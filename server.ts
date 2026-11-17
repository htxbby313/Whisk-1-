import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel, Modality, type LiveServerMessage } from '@google/genai';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import { adminAuth, adminDb } from './src/lib/firebase-admin.ts';
import {
  createPackingItem,
  createTripNote,
  deletePackingItem,
  deleteTripNote,
  getOrCreateUser,
  getPackingItemsForTrip,
  getTripNotesForTrip,
  updatePackingItemStatus,
} from './src/db/repository.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const app = express();

app.use(express.json({ limit: '10mb' }));

// Lazy-initialized Gemini client utility on the server with telemetry User-Agent header
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

interface GroundingSource {
  title: string;
  uri: string;
  sourceType: 'search' | 'maps';
  snippet?: string;
}

function extractGroundingSources(response: any): GroundingSource[] {
  const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (!Array.isArray(chunks)) return [];
  const sources: GroundingSource[] = [];
  const seen = new Set<string>();

  for (const chunk of chunks) {
    if (chunk?.maps?.uri && !seen.has(chunk.maps.uri)) {
      seen.add(chunk.maps.uri);
      const reviewSnippet =
        chunk.maps.placeAnswerSources?.reviewSnippets?.[0]?.reviewText ||
        chunk.maps.placeAnswerSources?.reviewSnippets?.[0]?.snippet ||
        undefined;
      sources.push({
        title: chunk.maps.title || 'Google Maps Place',
        uri: chunk.maps.uri,
        sourceType: 'maps',
        snippet: typeof reviewSnippet === 'string' ? reviewSnippet.slice(0, 280) : undefined,
      });
    } else if (chunk?.web?.uri && !seen.has(chunk.web.uri)) {
      seen.add(chunk.web.uri);
      sources.push({
        title: chunk.web.title || 'Web Source',
        uri: chunk.web.uri,
        sourceType: 'search',
      });
    }
  }
  return sources;
}

const wrapAffiliateLink = (url: string, destination: string, _type: string): string => {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    urlObj.searchParams.append('ref', 'whisk_bestie');
    urlObj.searchParams.append('partner_id', 'WHISK_PARTNER_ID');
    urlObj.searchParams.append('dest', destination.toLowerCase().replace(/\s+/g, '_'));
    return urlObj.toString();
  } catch (_e) {
    return url;
  }
};

function sanitizeChatHistory(history: any[]): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  if (!Array.isArray(history)) return [];
  return history
    .filter((m) => (m && typeof m === 'object' && typeof m.text === 'string') || m?.parts?.[0]?.text)
    .slice(-16)
    .map((m) => ({
      role: m.role === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: String(m.parts?.[0]?.text ?? m.text ?? '') }],
    }))
    .filter((m) => m.parts[0].text.trim().length > 0);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function parseGeminiApiError(error: any): {
  status: number;
  message: string;
  isQuotaOrRateLimit: boolean;
} {
  let rawMsg =
    typeof error?.message === 'string'
      ? error.message
      : String(error || 'AI service request failed');
  let parsedStatus: number | undefined =
    typeof error?.status === 'number'
      ? error.status
      : typeof error?.code === 'number'
      ? error.code
      : undefined;
  let parsedRpcStatus = '';

  try {
    const jsonStart = rawMsg.indexOf('{');
    if (jsonStart !== -1) {
      const parsed = JSON.parse(rawMsg.slice(jsonStart));
      if (parsed?.error) {
        if (typeof parsed.error.code === 'number') parsedStatus = parsed.error.code;
        if (typeof parsed.error.status === 'string') parsedRpcStatus = parsed.error.status;
        if (typeof parsed.error.message === 'string') rawMsg = parsed.error.message;
      }
    }
  } catch {
    // Preserve non-JSON error message
  }

  const isQuotaOrRateLimit =
    parsedStatus === 429 ||
    parsedRpcStatus === 'RESOURCE_EXHAUSTED' ||
    rawMsg.includes('RESOURCE_EXHAUSTED') ||
    rawMsg.toLowerCase().includes('quota') ||
    rawMsg.toLowerCase().includes('rate limit');

  if (isQuotaOrRateLimit) {
    return {
      status: 429,
      isQuotaOrRateLimit: true,
      message:
        'Gemini API quota or rate limit reached for the current key. Please wait a moment and try again, or add a billing-enabled Gemini API key in Settings > Secrets for higher limits.',
    };
  }

  const isAuthIssue =
    parsedStatus === 403 ||
    parsedRpcStatus === 'PERMISSION_DENIED' ||
    rawMsg.includes('API_KEY_INVALID') ||
    rawMsg.toLowerCase().includes('api key');

  if (isAuthIssue) {
    return {
      status: parsedStatus === 400 || parsedStatus === 403 ? parsedStatus : 403,
      isQuotaOrRateLimit: false,
      message:
        'Gemini API key is missing, invalid, or lacks permission. Please verify your API key in Settings > Secrets.',
    };
  }

  return {
    status: parsedStatus && parsedStatus >= 400 && parsedStatus < 600 ? parsedStatus : 500,
    isQuotaOrRateLimit: false,
    message: rawMsg || 'AI service request failed',
  };
}

function parseModelJson<T = any>(rawText: string | undefined, fallback: T): T {
  const cleaned = String(rawText || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  if (!cleaned) return fallback;
  return JSON.parse(cleaned) as T;
}

async function generateContentWithResilience(options: {
  model: string;
  contents: any;
  config?: any;
  allowLiteFallback?: boolean;
  allowUngroundedFallbackOn429?: boolean;
}) {
  const {
    model,
    contents,
    config,
    allowLiteFallback = true,
    allowUngroundedFallbackOn429 = false,
  } = options;

  const attempts: Array<{ model: string; config: any; delayBeforeMs: number }> = [
    { model, config, delayBeforeMs: 0 },
    { model, config, delayBeforeMs: 1200 },
  ];

  if (allowLiteFallback && model !== 'gemini-3.1-flash-lite') {
    const liteConfig = config ? { ...config } : {};
    if (liteConfig.thinkingConfig) {
      liteConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
    }
    attempts.push({ model: 'gemini-3.1-flash-lite', config: liteConfig, delayBeforeMs: 600 });

    if (allowUngroundedFallbackOn429 && liteConfig.tools) {
      const ungroundedConfig = { ...liteConfig };
      delete ungroundedConfig.tools;
      delete ungroundedConfig.toolConfig;
      attempts.push({
        model: 'gemini-3.1-flash-lite',
        config: ungroundedConfig,
        delayBeforeMs: 400,
      });
    }
  } else if (allowUngroundedFallbackOn429 && config?.tools) {
    const ungroundedConfig = { ...config };
    delete ungroundedConfig.tools;
    delete ungroundedConfig.toolConfig;
    attempts.push({ model, config: ungroundedConfig, delayBeforeMs: 400 });
  }

  let lastError: any;
  for (const attempt of attempts) {
    if (attempt.delayBeforeMs > 0) {
      await sleep(attempt.delayBeforeMs);
    }
    try {
      const response = await getAi().models.generateContent({
        model: attempt.model,
        contents,
        config: attempt.config,
      });
      return { response, usedModel: attempt.model };
    } catch (err: any) {
      lastError = err;
      const parsed = parseGeminiApiError(err);
      const isTransient = parsed.isQuotaOrRateLimit || parsed.status === 503 || parsed.status === 500;
      if (!isTransient) {
        throw err;
      }
    }
  }

  throw lastError;
}

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Resolve non-PII @username -> Firebase Auth login email via Firebase Admin
const USERNAME_REGEX = /^[a-z0-9][a-z0-9_-]{1,22}[a-z0-9]$/;
app.post('/api/auth/resolve-username', async (req, res) => {
  try {
    const raw = typeof req.body?.username === 'string' ? req.body.username : '';
    const username = raw.trim().toLowerCase().replace(/^@+/, '');

    if (!USERNAME_REGEX.test(username)) {
      return res.status(400).json({
        error: 'Usernames must be 3-24 characters using letters, numbers, underscores, or hyphens.',
      });
    }

    const snap = await adminDb.collection('usernames').doc(username).get();
    if (!snap.exists) {
      return res.status(404).json({
        error: `No traveler account found for @${username}.`,
      });
    }

    const uid = snap.data()?.uid;
    if (typeof uid !== 'string' || !uid) {
      return res.status(404).json({
        error: `No traveler account found for @${username}.`,
      });
    }

    const userRecord = await adminAuth.getUser(uid);
    if (!userRecord.email) {
      return res.status(404).json({
        error: `No sign-in credentials found for @${username}.`,
      });
    }

    return res.json({ authEmail: userRecord.email });
  } catch (err: any) {
    if (err?.code === 'auth/user-not-found') {
      return res.status(404).json({
        error: 'No traveler account found for that username.',
      });
    }
    console.error('Username resolution error:', err);
    return res.status(503).json({
      error: 'Username lookup service is temporarily unavailable.',
      code: 'ADMIN_UNAVAILABLE',
    });
  }
});

function mapWmoCode(code: number): { condition: string; icon: string } {
  if (code === 0) return { condition: 'Clear Sky', icon: 'clear' };
  if (code >= 1 && code <= 2) return { condition: 'Partly Cloudy', icon: 'partly-cloudy' };
  if (code === 3) return { condition: 'Overcast', icon: 'cloudy' };
  if (code === 45 || code === 48) return { condition: 'Foggy', icon: 'fog' };
  if (code >= 51 && code <= 57) return { condition: 'Drizzle', icon: 'drizzle' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { condition: 'Rainy', icon: 'rain' };
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return { condition: 'Snow', icon: 'snow' };
  if (code >= 95 && code <= 99) return { condition: 'Thunderstorm', icon: 'storm' };
  return { condition: 'Fair', icon: 'partly-cloudy' };
}

// 7-Day Public Weather Forecast via Open-Meteo
app.get('/api/weather', async (req, res) => {
  try {
    const destination = String(req.query.destination || '').trim();
    if (!destination) {
      return res.status(400).json({ error: 'Destination query parameter is required' });
    }

    const geocode = async (queryText: string) => {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(queryText)}&count=1&language=en&format=json`;
      const geoRes = await fetch(geoUrl);
      if (!geoRes.ok) throw new Error('Geocoding service unavailable');
      const geoData: any = await geoRes.json();
      return geoData?.results?.[0] || null;
    };

    let place = await geocode(destination);
    if (!place && destination.includes(',')) {
      place = await geocode(destination.split(',')[0].trim());
    }
    if (!place) {
      return res.status(404).json({ error: `Could not locate weather coordinates for "${destination}"` });
    }

    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto&forecast_days=7`;
    const weatherRes = await fetch(forecastUrl);
    if (!weatherRes.ok) throw new Error('Public weather forecast API unavailable');
    const weatherData: any = await weatherRes.json();

    const currentMeta = mapWmoCode(Number(weatherData?.current?.weather_code ?? 0));
    const daily = weatherData?.daily || {};
    const dates: string[] = Array.isArray(daily.time) ? daily.time : [];

    const days = dates.map((dateStr, idx) => {
      const meta = mapWmoCode(Number(daily.weather_code?.[idx] ?? 0));
      return {
        date: dateStr,
        tempMaxC: Math.round(Number(daily.temperature_2m_max?.[idx] ?? 0)),
        tempMinC: Math.round(Number(daily.temperature_2m_min?.[idx] ?? 0)),
        precipProb: Number(daily.precipitation_probability_max?.[idx] ?? 0),
        windKmh: Math.round(Number(daily.wind_speed_10m_max?.[idx] ?? 0)),
        condition: meta.condition,
        icon: meta.icon,
      };
    });

    res.json({
      locationName: place.name,
      country: place.country || '',
      timezone: weatherData.timezone || 'UTC',
      current: {
        tempC: Math.round(Number(weatherData?.current?.temperature_2m ?? 0)),
        condition: currentMeta.condition,
        icon: currentMeta.icon,
      },
      days,
    });
  } catch (error: any) {
    console.error('Error fetching 7-day weather:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch weather forecast' });
  }
});

// --- Google Maps Platform Server-Side Config & Geocoding Helpers ---
class MapsQuotaError extends Error {
  constructor(message = 'RESOURCE_EXHAUSTED') {
    super(message);
    this.name = 'MapsQuotaError';
  }
}

const getMapsApiKey = (): string =>
  process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '';

interface GeocodedCoords {
  latitude: number;
  longitude: number;
  placeId?: string;
  formattedAddress?: string;
}

async function geocodeSingleLocation(
  rawLocation: string,
  destination: string,
  apiKey: string
): Promise<GeocodedCoords | null> {
  if (!apiKey || !rawLocation.trim()) return null;

  const cleaned = rawLocation.replace(/\([^)]*\)/g, '').trim();
  const destCity = destination.split(',')[0]?.trim().toLowerCase() || '';
  const hasDestContext =
    destCity.length > 0 && cleaned.toLowerCase().includes(destCity);
  const query = hasDestContext ? cleaned : `${cleaned}, ${destination}`;

  // Primary: Geocoding API v4
  const v4Url = `https://geocode.googleapis.com/v4/geocode/address/${encodeURIComponent(query)}`;
  try {
    const v4Res = await fetch(v4Url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'results.placeId,results.location,results.formattedAddress',
        'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
      },
    });

    if (v4Res.status === 429) {
      throw new MapsQuotaError('RESOURCE_EXHAUSTED');
    }

    const v4Data: any = await v4Res.json().catch(() => null);
    if (v4Data?.error?.status === 'RESOURCE_EXHAUSTED') {
      throw new MapsQuotaError('RESOURCE_EXHAUSTED');
    }

    const first = v4Data?.results?.[0];
    if (
      v4Res.ok &&
      typeof first?.location?.latitude === 'number' &&
      typeof first?.location?.longitude === 'number'
    ) {
      return {
        latitude: first.location.latitude,
        longitude: first.location.longitude,
        placeId: first.placeId || undefined,
        formattedAddress: first.formattedAddress || undefined,
      };
    }
  } catch (err) {
    if (err instanceof MapsQuotaError) throw err;
  }

  // Fallback: Standard Geocoding REST API (server-side, avoids CORS)
  const legacyUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    query
  )}&key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(legacyUrl, {
    headers: {
      'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
    },
  });

  if (res.status === 429) {
    throw new MapsQuotaError('RESOURCE_EXHAUSTED');
  }

  const data: any = await res.json().catch(() => null);
  if (
    data?.status === 'OVER_QUERY_LIMIT' ||
    data?.error?.status === 'RESOURCE_EXHAUSTED'
  ) {
    throw new MapsQuotaError('RESOURCE_EXHAUSTED');
  }

  const result = data?.results?.[0];
  const loc = result?.geometry?.location;
  if (typeof loc?.lat === 'number' && typeof loc?.lng === 'number') {
    return {
      latitude: loc.lat,
      longitude: loc.lng,
      placeId: result?.place_id || undefined,
      formattedAddress: result?.formatted_address || undefined,
    };
  }

  return null;
}

async function geocodeItineraryDays(
  days: any[],
  destination: string
): Promise<{ days: any[]; quotaExceeded: boolean }> {
  const apiKey = getMapsApiKey();
  if (!apiKey || !Array.isArray(days)) {
    return { days, quotaExceeded: false };
  }

  const cache: Record<string, GeocodedCoords | null> = {};
  let quotaExceeded = false;

  const uniqueLocations: string[] = [];
  for (const day of days) {
    for (const act of day?.activities || []) {
      const hasCoords =
        typeof act?.latitude === 'number' &&
        Number.isFinite(act.latitude) &&
        typeof act?.longitude === 'number' &&
        Number.isFinite(act.longitude);
      const loc = typeof act?.location === 'string' ? act.location.trim() : '';
      if (!hasCoords && loc && !(loc in cache)) {
        cache[loc] = null;
        uniqueLocations.push(loc);
      }
    }
  }

  // Geocode in small batches to avoid burst rate limits
  const batchSize = 5;
  for (let i = 0; i < uniqueLocations.length; i += batchSize) {
    if (quotaExceeded) break;
    const batch = uniqueLocations.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (loc) => {
        try {
          cache[loc] = await geocodeSingleLocation(loc, destination, apiKey);
        } catch (err) {
          if (err instanceof MapsQuotaError) {
            quotaExceeded = true;
          }
        }
      })
    );
  }

  const enrichedDays = days.map((day) => ({
    ...day,
    activities: (day?.activities || []).map((act: any) => {
      const hasCoords =
        typeof act?.latitude === 'number' &&
        Number.isFinite(act.latitude) &&
        typeof act?.longitude === 'number' &&
        Number.isFinite(act.longitude);
      if (hasCoords) return act;

      const loc = typeof act?.location === 'string' ? act.location.trim() : '';
      const resolved = loc ? cache[loc] : null;
      if (!resolved) return act;

      return {
        ...act,
        latitude: resolved.latitude,
        longitude: resolved.longitude,
        placeId: resolved.placeId,
        formattedAddress: resolved.formattedAddress,
      };
    }),
  }));

  return { days: enrichedDays, quotaExceeded };
}

// Safe client runtime config endpoint for Google Maps API key
app.get('/api/maps/config', (_req, res) => {
  res.json({ apiKey: getMapsApiKey() });
});

// Server-side proxy for geocoding itinerary activity locations (avoids CORS CF1)
app.post('/api/maps/geocode-itinerary', async (req, res) => {
  try {
    const { destination, days } = req.body || {};
    if (!destination || !Array.isArray(days)) {
      return res.status(400).json({ error: 'destination and days array are required' });
    }

    const apiKey = getMapsApiKey();
    if (!apiKey) {
      return res.status(503).json({ error: 'Google Maps API key not configured' });
    }

    const { days: enrichedDays, quotaExceeded } = await geocodeItineraryDays(days, destination);
    if (quotaExceeded) {
      return res.status(429).json({
        error: 'RESOURCE_EXHAUSTED',
        quotaExceeded: true,
        days: enrichedDays,
      });
    }

    res.json({ days: enrichedDays });
  } catch (error: any) {
    if (error instanceof MapsQuotaError) {
      return res.status(429).json({ error: 'RESOURCE_EXHAUSTED', quotaExceeded: true });
    }
    console.error('Error geocoding itinerary locations:', error);
    res.status(500).json({ error: error.message || 'Failed to geocode itinerary' });
  }
});

// Generate Travel Itinerary with Google Search + Google Maps Grounding
app.post(['/api/gemini/itinerary', '/api/itinerary'], async (req, res) => {
  try {
    const params = req.body;
    if (!params || !params.destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    const itineraryPrompt = `You are an expert travel planner and a supportive, excited travel bestie. Create a highly customized, structured travel itinerary JSON for ${params.destination}.
    
    You MUST search the web in real-time to find actual current pricing, properties, and rates for:
    1. Average flight prices from major hubs or realistic routes for a ${params.duration || '3 days'} trip.
    2. Real, highly-rated hotels/boutique lodging in ${params.destination} with estimated current nightly rates and availability status.
    3. Top restaurants and popular excursions/tours matching the interests with estimated prices.

    User Preferences & Context:
    - Duration: ${params.duration || '3 days'}
    - Interests: ${(params.interests || []).join(', ')}
    - Budget Tier: ${params.budget || 'Mid-range'}
    - Pace: ${params.pace || 'Moderate'}
    - Accessibility Accommodations: ${(params.accessibility && params.accessibility.length > 0) ? params.accessibility.join(', ') : 'None specified'}

    Rules:
    1. Talk like an excited, luxury-savvy or budget-smart travel bestie in the summary. Keep the text engaging and enthusiastic.
    2. For every option (hotels, tours, restaurants, flights), you MUST include realistic, grounded 'price' strings (e.g., "$120/night", "$75/person", "$450 round-trip") and specific 'availability' status (e.g., "Only 3 spots left", "Booking fast", "Widely available", "Likely to sell out").
    3. All entities, hotels, restaurants, and tours must represent actual physical places/options found via web search grounding.
    4. Each activity 'location' MUST be a specific, real-world physical venue, landmark, restaurant, or neighborhood name (never vague like "Morning coffee" or "Local dinner") so it can be pinned on a map.
    5. Any specified accessibility requirements MUST be directly reflected in the descriptions of day plans and recommendation details.`;

    const mapsPrompt = `Find top real-world landmarks, beloved restaurants, scenic neighborhoods, and boutique stays in ${params.destination} matching these interests: ${(params.interests || []).join(', ') || 'top highlights'}${params.accessibility?.length ? ` with accessibility focus (${params.accessibility.join(', ')})` : ''}. Provide a concise, enthusiastic local neighborhood snapshot highlighting verified spots.`;

    const mapsConfig: any = {
      tools: [{ googleMaps: {} }],
    };
    if (typeof params.latitude === 'number' && typeof params.longitude === 'number') {
      mapsConfig.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: params.latitude,
            longitude: params.longitude,
          },
        },
      };
    }

    const { response: structResponse } = await generateContentWithResilience({
      model: 'gemini-4-hydrogen',
      contents: itineraryPrompt,
      allowLiteFallback: true,
      allowUngroundedFallbackOn429: true,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            destination: { type: Type.STRING },
            duration: { type: Type.STRING },
            summary: { type: Type.STRING },
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayNumber: { type: Type.NUMBER },
                  theme: { type: Type.STRING },
                  activities: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        time: { type: Type.STRING },
                        description: { type: Type.STRING },
                        location: { type: Type.STRING },
                      },
                      required: ['time', 'description', 'location'],
                    },
                  },
                },
                required: ['dayNumber', 'theme', 'activities'],
              },
            },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['hotel', 'tour', 'restaurant', 'flight'] },
                  description: { type: Type.STRING },
                  affiliateUrl: { type: Type.STRING },
                  price: { type: Type.STRING },
                  availability: { type: Type.STRING },
                },
                required: ['name', 'type', 'description', 'affiliateUrl', 'price', 'availability'],
              },
            },
          },
          required: ['title', 'destination', 'duration', 'summary', 'days', 'recommendations'],
        },
      },
    });

    const parsed = parseModelJson(structResponse.text, {} as any);
    const processedRecommendations = (parsed.recommendations || []).map((rec: any) => ({
      ...rec,
      affiliateUrl: wrapAffiliateLink(rec.affiliateUrl || 'https://google.com', params.destination, rec.type),
    }));

    // Run Maps grounding enrichment sequentially AFTER structured route to avoid concurrent RPM bursts
    let mapsSources: GroundingSource[] = [];
    let mapsOverview = '';
    try {
      const mapsResponse = await getAi().models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: mapsPrompt,
        config: mapsConfig,
      });
      mapsSources = extractGroundingSources(mapsResponse);
      mapsOverview = mapsResponse.text || '';
    } catch (mapsErr) {
      console.warn('Optional Maps overview skipped:', parseGeminiApiError(mapsErr).message);
    }

    // Enrich itinerary day activities with real coordinates via Google Maps Geocoding API
    const { days: geocodedDays, quotaExceeded } = await geocodeItineraryDays(
      parsed.days || [],
      parsed.destination || params.destination
    );

    const searchSources = extractGroundingSources(structResponse);

    const combinedSources: GroundingSource[] = [];
    const seenUris = new Set<string>();
    for (const s of [...mapsSources, ...searchSources]) {
      if (!seenUris.has(s.uri)) {
        seenUris.add(s.uri);
        combinedSources.push(s);
      }
    }

    const cleanId = `trip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    res.json({
      ...parsed,
      days: geocodedDays,
      recommendations: processedRecommendations,
      groundingSources: combinedSources.slice(0, 35),
      mapsOverview: mapsOverview.slice(0, 4500),
      mapsQuotaExceeded: quotaExceeded || undefined,
      id: cleanId,
      createdAt: new Date().toISOString(),
      budget: params.budget,
      pace: params.pace,
      interests: params.interests,
      accessibility: params.accessibility,
      overallRating: 0,
      unlocked: false,
    });
  } catch (error: any) {
    const parsedErr = parseGeminiApiError(error);
    console.error('Error generating itinerary:', parsedErr.message);
    res.status(parsedErr.status).json({ error: parsedErr.message, code: parsedErr.status });
  }
});

// Google Maps Place Explorer Endpoint
app.post('/api/gemini/places', async (req, res) => {
  try {
    const { query, destination, latitude, longitude } = req.body;
    if (!query && !destination) {
      return res.status(400).json({ error: 'Query or destination is required' });
    }

    const prompt = destination
      ? `Using Google Maps, find the best real-world places in ${destination} for: "${query || 'top local spots, hidden gems, and restaurants'}". Include brief insider tips and why locals love each spot.`
      : `Using Google Maps, find the best real-world places for: "${query}". Include brief insider tips and practical details.`;

    const config: any = {
      tools: [{ googleMaps: {} }],
      systemInstruction:
        "You are Whisk's Local Maps Guide. Recommend verified physical places with authentic insider context. Output clean Markdown.",
    };

    if (typeof latitude === 'number' && typeof longitude === 'number') {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude,
            longitude,
          },
        },
      };
    }

    const { response, usedModel } = await generateContentWithResilience({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config,
      allowLiteFallback: false,
    });

    const sources = extractGroundingSources(response);
    res.json({
      text: response.text || '',
      sources,
      model: usedModel,
    });
  } catch (error: any) {
    const parsedErr = parseGeminiApiError(error);
    console.error('Error querying Google Maps places:', parsedErr.message);
    res.status(parsedErr.status).json({ error: parsedErr.message, code: parsedErr.status });
  }
});

const generatedGuideSlugs = new Set<string>([
  'paris-terracotta-bistros-eiffel-guide',
  'tokyo-asakusa-espresso-night-guide',
  'amalfi-coast-positano-cliffside-guide',
  'santorini-oia-caldera-sunset-guide',
  'marrakech-medina-saffron-courtyard-guide',
  'swiss-alps-zermatt-matterhorn-guide',
]);

function extractCentroidCoordinates(itinerary: any): { latitude: number; longitude: number } | undefined {
  const coords: Array<{ lat: number; lng: number }> = [];
  for (const day of itinerary?.days || []) {
    for (const act of day?.activities || []) {
      if (typeof act?.latitude === 'number' && typeof act?.longitude === 'number') {
        coords.push({ lat: act.latitude, lng: act.longitude });
      }
    }
  }
  if (coords.length === 0) return undefined;
  const avgLat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;
  const avgLng = coords.reduce((s, c) => s + c.lng, 0) / coords.length;
  return {
    latitude: Number(avgLat.toFixed(5)),
    longitude: Number(avgLng.toFixed(5)),
  };
}

function toSeoSlug(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 90) || `travel-guide-${Date.now()}`
  );
}

// Generate SEO & GEO Optimized Blog Post / Organic Marketing Field Guide
app.post(['/api/gemini/blog-post', '/api/blog-post'], async (req, res) => {
  try {
    const itinerary = req.body;
    if (!itinerary || !itinerary.destination) {
      return res.status(400).json({ error: 'Valid itinerary is required' });
    }

    const spotNames = (itinerary.recommendations || []).map((r: any) => r.name).filter(Boolean).join(', ');
    const dayHighlights = (itinerary.days || [])
      .slice(0, 4)
      .map((d: any) => `Day ${d.dayNumber} (${d.theme}): ${(d.activities || []).map((a: any) => a.location).join(', ')}`)
      .join(' | ');

    const prompt = `Write an engaging, organic-marketing-grade travel Field Guide for ${itinerary.destination} (${itinerary.duration || 'multi-day trip'}) ${itinerary.accessibility && itinerary.accessibility.length > 0 ? `(highlighting accessibility for: ${itinerary.accessibility.join(', ')})` : ''} optimized for both SEO (Google Search) and GEO (Generative Engine Optimization / AI answer citations).

    **Itinerary Context:**
    - Spots & Partners: ${spotNames || itinerary.destination}
    - Highlights: ${dayHighlights || itinerary.summary || itinerary.destination}
    - Travel Style: ${itinerary.pace || 'Balanced'} pace · ${itinerary.budget || 'Mid-range'} budget

    **Requirements:**
    1. Voice: Warm, authentic "Travel Bestie" insider storytelling — enthusiastic, grounded in real neighborhoods, zero corporate fluff.
    2. SEO Optimization:
       - "seoTitle": Compelling search headline (45–60 characters) with destination + trip intent.
       - "metaDescription": 130–158 character organic search snippet ending with a clear action.
       - "slug": Lowercase hyphenated URL slug including destination and focus.
       - "keywords": 6–8 high-intent long-tail search phrases travelers actually type.
    3. GEO (Generative Engine Optimization):
       - "geoSummary": A crisp, citable 2–3 sentence factual overview naming the city/country, best neighborhoods, transit notes, and signature landmarks so AI engines can quote it directly.
       - "neighborhoods": 3–6 real districts, landmarks, or areas covered in this itinerary.
       - "faqs": 3–4 helpful traveler Q&A pairs ("When is the best time...", "How do I get around...", "Is it walkable/accessible...") with direct, factual 2-sentence answers.
    4. Content Markdown: Structured with clear ## headers, real entity names from above, scannable bullet highlights (* item), and a "Bestie Secret Tip" in a blockquote (> tip).`;

    const { response } = await generateContentWithResilience({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      allowLiteFallback: true,
      allowUngroundedFallbackOn429: true,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            seoTitle: { type: Type.STRING },
            slug: { type: Type.STRING },
            metaDescription: { type: Type.STRING },
            geoSummary: { type: Type.STRING },
            content: { type: Type.STRING },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            neighborhoods: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            faqs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                },
                required: ['question', 'answer'],
              },
            },
          },
          required: [
            'title',
            'seoTitle',
            'slug',
            'metaDescription',
            'geoSummary',
            'content',
            'keywords',
            'neighborhoods',
            'faqs',
          ],
        },
      },
    });

    const parsed = parseModelJson(response.text, {} as any);
    const finalSlug = toSeoSlug(parsed.slug || parsed.title || itinerary.destination);
    generatedGuideSlugs.add(finalSlug);
    const geoCoordinates = extractCentroidCoordinates(itinerary);

    res.json({
      ...parsed,
      slug: finalSlug,
      geoCoordinates,
      itineraryId: itinerary.id,
      destination: itinerary.destination,
    });
  } catch (error: any) {
    const parsedErr = parseGeminiApiError(error);
    console.error('Error generating blog post:', parsedErr.message);
    res.status(parsedErr.status).json({ error: parsedErr.message, code: parsedErr.status });
  }
});

function buildChatConfig(mode: string, latitude?: number, longitude?: number) {
  let model = 'gemini-4-hydrogen';
  const config: any = {
    systemInstruction:
      "You are Whisk's Travel Bestie. You're high-energy, helpful, and sound like a close personal friend. Use real-time web info when helpful, keep advice practical, and never mention technical jargon.",
    tools: [{ googleSearch: {} }],
  };

  if (mode === 'fast') {
    model = 'gemini-3.1-flash-lite';
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
    config.systemInstruction =
      "You are the Quick-Reply Buddy at Whisk. You're like the friend who's always on their phone ready with crisp, punchy, practical travel answers in seconds.";
    delete config.tools;
  } else if (mode === 'maps') {
    model = 'gemini-4-hydrogen';
    config.tools = [{ googleMaps: {} }];
    config.systemInstruction =
      "You are Whisk's Local Maps Guide. Help travelers find real restaurants, cafes, transit stops, hotels, and hidden neighborhood spots using live Google Maps place data.";
    if (typeof latitude === 'number' && typeof longitude === 'number') {
      config.toolConfig = {
        retrievalConfig: {
          latLng: { latitude, longitude },
        },
      };
    }
  } else if (mode === 'thinking') {
    model = 'gemini-4-hydrogen';
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.XHIGH };
    config.tools = [{ googleSearch: {} }];
    config.systemInstruction =
      'You are the Master Deep-Reasoning Planner at Whisk. Think step-by-step through seasonal logistics, transit connections, crowd timing, and accessibility constraints to craft airtight travel strategies.';
  } else if (mode === 'complex') {
    model = 'gemini-4-hydrogen';
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    config.tools = [{ googleSearch: {} }];
    config.systemInstruction =
      "You are Whisk's Interactive Trip Architect. Help users restructure multi-day routes, compare detailed budgets, optimize neighborhood sequences, and adapt plans interactively to changing preferences.";
  }

  return { model, config };
}

// Multi-turn Travel Chat with role-based modes & grounding
app.post(['/api/gemini/chat', '/api/chat'], async (req, res) => {
  try {
    const { message, history = [], mode = 'standard', latitude, longitude } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const { model, config } = buildChatConfig(mode, latitude, longitude);
    const cleanHistory = sanitizeChatHistory(history);
    const contents = [...cleanHistory, { role: 'user', parts: [{ text: message }] }];

    const { response, usedModel } = await generateContentWithResilience({
      model,
      contents,
      config,
      allowLiteFallback: mode !== 'maps',
      allowUngroundedFallbackOn429: mode !== 'maps' && mode !== 'fast',
    });

    const sources = extractGroundingSources(response);
    return res.json({ text: response.text, sources, model: usedModel });
  } catch (error: any) {
    const parsedErr = parseGeminiApiError(error);
    console.error('Error handling chat request:', parsedErr.message);
    res.status(parsedErr.status).json({ error: parsedErr.message, code: parsedErr.status });
  }
});

// Streaming Multi-turn Chat (Server-Sent Events)
app.post(['/api/gemini/chat/stream', '/api/chat/stream'], async (req, res) => {
  let headersSent = false;
  try {
    const { message, history = [], mode = 'standard', latitude, longitude } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const { model, config } = buildChatConfig(mode, latitude, longitude);
    const cleanHistory = sanitizeChatHistory(history);
    const contents = [...cleanHistory, { role: 'user', parts: [{ text: message }] }];

    let activeModel = model;
    let stream: any;
    try {
      stream = await getAi().models.generateContentStream({
        model,
        contents,
        config,
      });
    } catch (streamInitErr: any) {
      const parsed = parseGeminiApiError(streamInitErr);
      if (parsed.isQuotaOrRateLimit && mode !== 'maps' && model !== 'gemini-3.1-flash-lite') {
        await sleep(800);
        activeModel = 'gemini-3.1-flash-lite';
        const liteConfig = { ...config };
        if (liteConfig.thinkingConfig) {
          liteConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
        }
        stream = await getAi().models.generateContentStream({
          model: activeModel,
          contents,
          config: liteConfig,
        });
      } else {
        throw streamInitErr;
      }
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    headersSent = true;

    const collectedSources: GroundingSource[] = [];
    const seenUris = new Set<string>();

    for await (const chunk of stream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
      const chunkSources = extractGroundingSources(chunk);
      for (const s of chunkSources) {
        if (!seenUris.has(s.uri)) {
          seenUris.add(s.uri);
          collectedSources.push(s);
        }
      }
    }

    res.write(`data: ${JSON.stringify({ sources: collectedSources, model: activeModel })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    const parsedErr = parseGeminiApiError(error);
    console.error('Error in streaming chat:', parsedErr.message);
    if (!headersSent) {
      return res.status(parsedErr.status).json({ error: parsedErr.message, code: parsedErr.status });
    }
    res.write(`data: ${JSON.stringify({ error: parsedErr.message })}\n\n`);
    res.end();
  }
});

// Smart Destination Packing Suggestions via gemini-4-hydrogen
app.post('/api/gemini/suggest-packing', async (req, res) => {
  try {
    const { destination, duration, interests = [] } = req.body || {};
    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    const { response } = await generateContentWithResilience({
      model: 'gemini-4-hydrogen',
      contents: `Suggest 6 practical, destination-specific packing items for a ${duration || '3 days'} trip to ${destination}${
        Array.isArray(interests) && interests.length > 0 ? ` focused on ${interests.join(', ')}` : ''
      }.`,
      allowLiteFallback: true,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  item: { type: Type.STRING },
                  category: {
                    type: Type.STRING,
                    enum: ['Essentials', 'Clothing', 'Tech', 'Documents', 'Health'],
                  },
                },
                required: ['item', 'category'],
              },
            },
          },
          required: ['items'],
        },
      },
    });

    const parsed = parseModelJson(response.text, { items: [] });
    res.json({ items: Array.isArray(parsed.items) ? parsed.items.slice(0, 6) : [] });
  } catch (error: any) {
    const parsedErr = parseGeminiApiError(error);
    console.error('Error generating packing suggestions:', parsedErr.message);
    res.status(parsedErr.status).json({ error: parsedErr.message, code: parsedErr.status });
  }
});

// General Gemini Generate Content proxy endpoint
app.post(['/api/gemini/generate', '/api/generate'], async (req, res) => {
  try {
    const { prompt, contents, model = 'gemini-4-hydrogen', config } = req.body;
    const { response } = await generateContentWithResilience({
      model,
      contents: contents || prompt,
      config,
      allowLiteFallback: true,
    });
    res.json({ text: response.text, sources: extractGroundingSources(response) });
  } catch (error: any) {
    const parsedErr = parseGeminiApiError(error);
    console.error('Error in general generate endpoint:', parsedErr.message);
    res.status(parsedErr.status).json({ error: parsedErr.message, code: parsedErr.status });
  }
});

// --- Authenticated Cloud SQL Trip Toolkit Routes ---
app.post('/api/sql/users/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const email = req.user!.email || `${uid}@users.local`;
    const displayName = typeof req.user!.name === 'string' ? req.user!.name : undefined;
    const userRecord = await getOrCreateUser(uid, email, displayName);
    res.json({ user: userRecord });
  } catch (error: any) {
    console.error('Error syncing SQL user:', error);
    res.status(500).json({ error: error.message || 'Failed to sync user profile' });
  }
});

app.get('/api/sql/trips/:itineraryId/toolkit', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const itineraryId = String(req.params.itineraryId || '').trim();
    if (!itineraryId) {
      return res.status(400).json({ error: 'Itinerary ID is required' });
    }
    const [items, notes] = await Promise.all([
      getPackingItemsForTrip(uid, itineraryId),
      getTripNotesForTrip(uid, itineraryId),
    ]);
    res.json({ packingItems: items, tripNotes: notes });
  } catch (error: any) {
    console.error('Error fetching trip toolkit:', error);
    res.status(500).json({ error: error.message || 'Failed to load trip toolkit' });
  }
});

app.post('/api/sql/trips/:itineraryId/packing', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const email = req.user!.email || `${uid}@users.local`;
    const displayName = typeof req.user!.name === 'string' ? req.user!.name : undefined;
    const itineraryId = String(req.params.itineraryId || '').trim();
    const { destination, item, category } = req.body || {};
    if (!itineraryId || !destination || !String(item || '').trim()) {
      return res.status(400).json({ error: 'Itinerary ID, destination, and item are required' });
    }
    const created = await createPackingItem(uid, email, displayName, {
      itineraryId,
      destination: String(destination).trim(),
      item: String(item).trim().slice(0, 140),
      category: String(category || 'Essentials').trim(),
    });
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating packing item:', error);
    res.status(500).json({ error: error.message || 'Failed to add packing item' });
  }
});

app.patch('/api/sql/packing/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const itemId = Number(req.params.id);
    if (!Number.isInteger(itemId)) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }
    const updated = await updatePackingItemStatus(uid, itemId, Boolean(req.body?.isPacked));
    if (!updated) {
      return res.status(404).json({ error: 'Packing item not found' });
    }
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating packing item:', error);
    res.status(500).json({ error: error.message || 'Failed to update packing item' });
  }
});

app.delete('/api/sql/packing/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const itemId = Number(req.params.id);
    if (!Number.isInteger(itemId)) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }
    const deleted = await deletePackingItem(uid, itemId);
    if (!deleted) {
      return res.status(404).json({ error: 'Packing item not found' });
    }
    res.json({ deleted: true });
  } catch (error: any) {
    console.error('Error deleting packing item:', error);
    res.status(500).json({ error: error.message || 'Failed to delete packing item' });
  }
});

app.post('/api/sql/trips/:itineraryId/notes', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const email = req.user!.email || `${uid}@users.local`;
    const displayName = typeof req.user!.name === 'string' ? req.user!.name : undefined;
    const itineraryId = String(req.params.itineraryId || '').trim();
    const { destination, title, content, rating } = req.body || {};
    if (!itineraryId || !destination || !String(title || '').trim() || !String(content || '').trim()) {
      return res.status(400).json({ error: 'Itinerary ID, destination, title, and content are required' });
    }
    const created = await createTripNote(uid, email, displayName, {
      itineraryId,
      destination: String(destination).trim(),
      title: String(title).trim().slice(0, 120),
      content: String(content).trim().slice(0, 2000),
      rating: typeof rating === 'number' ? rating : 5,
    });
    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating trip note:', error);
    res.status(500).json({ error: error.message || 'Failed to save trip note' });
  }
});

app.delete('/api/sql/notes/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const noteId = Number(req.params.id);
    if (!Number.isInteger(noteId)) {
      return res.status(400).json({ error: 'Valid note ID is required' });
    }
    const deleted = await deleteTripNote(uid, noteId);
    if (!deleted) {
      return res.status(404).json({ error: 'Trip note not found' });
    }
    res.json({ deleted: true });
  } catch (error: any) {
    console.error('Error deleting trip note:', error);
    res.status(500).json({ error: error.message || 'Failed to delete trip note' });
  }
});

const server = http.createServer(app);

// Live API WebSocket Server
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', async (clientWs: WebSocket) => {
  let session: any = null;

  try {
    session = await getAi().live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction:
          "You are Whisk's Travel Bestie. Helpful, excited, and knowledgeable about travel destinations and itinerary planning.",
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          if (clientWs.readyState !== WebSocket.OPEN) return;
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio) {
            clientWs.send(JSON.stringify({ audio }));
          }
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
          const textPart = message.serverContent?.modelTurn?.parts?.find((p: any) => p.text);
          if (textPart?.text) {
            clientWs.send(JSON.stringify({ text: textPart.text }));
          }
        },
        onclose: () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.close();
          }
        },
        onerror: (err: any) => {
          console.error('Gemini Live session error:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ error: err.message || 'Live session error' }));
          }
        },
      },
    });

    clientWs.on('message', (data: any) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.audio) {
          session.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: parsed.mimeType || 'audio/pcm;rate=16000' },
          });
        } else if (parsed.text) {
          session.sendRealtimeInput({
            text: parsed.text,
          });
        } else if (parsed.video) {
          session.sendRealtimeInput({
            video: { data: parsed.video, mimeType: parsed.mimeType || 'image/jpeg' },
          });
        }
      } catch (err) {
        console.error('Error handling WebSocket client message:', err);
      }
    });

    clientWs.on('close', () => {
      try {
        if (session) {
          session.close();
        }
      } catch (_e) {}
    });
  } catch (err: any) {
    console.error('Failed to initialize Gemini Live session:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ error: err.message || 'Failed to connect to Live API' }));
      clientWs.close();
    }
  }
});

// Upgrade handler for Live WebSocket connections
server.on('upgrade', (request, socket, head) => {
  const isViteHmr = request.headers['sec-websocket-protocol'] === 'vite-hmr';
  if (!isViteHmr) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

// Organic SEO Crawler Endpoints
app.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`);
});

app.get('/sitemap.xml', (req, res) => {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const today = new Date().toISOString().split('T')[0];
  const urls = [
    `  <url><loc>${baseUrl}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    ...Array.from(generatedGuideSlugs).map(
      (slug) =>
        `  <url><loc>${baseUrl}/?guide=${encodeURIComponent(slug)}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`
    ),
  ].join('\n');

  res
    .type('application/xml')
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`);
});

// Mount Vite in dev, static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api/')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Whisk server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
