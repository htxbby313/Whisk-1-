import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { FieldValue } from 'firebase-admin/firestore';
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

const MAJOR_AIRPORTS: Array<{
  code: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}> = [
  { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'USA', lat: 40.6413, lng: -73.7781 },
  { code: 'EWR', name: 'Newark Liberty International Airport', city: 'Newark', country: 'USA', lat: 40.6895, lng: -74.1745 },
  { code: 'BOS', name: 'Boston Logan International Airport', city: 'Boston', country: 'USA', lat: 42.3656, lng: -71.0096 },
  { code: 'PHL', name: 'Philadelphia International Airport', city: 'Philadelphia', country: 'USA', lat: 39.8744, lng: -75.2424 },
  { code: 'IAD', name: 'Washington Dulles International Airport', city: 'Washington, D.C.', country: 'USA', lat: 38.9531, lng: -77.4565 },
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', country: 'USA', lat: 33.6407, lng: -84.4277 },
  { code: 'MIA', name: 'Miami International Airport', city: 'Miami', country: 'USA', lat: 25.7959, lng: -80.287 },
  { code: 'MCO', name: 'Orlando International Airport', city: 'Orlando', country: 'USA', lat: 28.4312, lng: -81.3081 },
  { code: 'CLT', name: 'Charlotte Douglas International Airport', city: 'Charlotte', country: 'USA', lat: 35.2144, lng: -80.9473 },
  { code: 'ORD', name: "O'Hare International Airport", city: 'Chicago', country: 'USA', lat: 41.9742, lng: -87.9073 },
  { code: 'DTW', name: 'Detroit Metropolitan Airport', city: 'Detroit', country: 'USA', lat: 42.2162, lng: -83.3554 },
  { code: 'MSP', name: 'Minneapolis-Saint Paul International Airport', city: 'Minneapolis', country: 'USA', lat: 44.8848, lng: -93.2223 },
  { code: 'DFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas', country: 'USA', lat: 32.8998, lng: -97.0403 },
  { code: 'IAH', name: 'George Bush Intercontinental Airport', city: 'Houston', country: 'USA', lat: 29.9902, lng: -95.3368 },
  { code: 'AUS', name: 'Austin-Bergstrom International Airport', city: 'Austin', country: 'USA', lat: 30.1975, lng: -97.6664 },
  { code: 'MSY', name: 'Louis Armstrong New Orleans International Airport', city: 'New Orleans', country: 'USA', lat: 29.9934, lng: -90.258 },
  { code: 'BNA', name: 'Nashville International Airport', city: 'Nashville', country: 'USA', lat: 36.1263, lng: -86.6774 },
  { code: 'DEN', name: 'Denver International Airport', city: 'Denver', country: 'USA', lat: 39.8561, lng: -104.6737 },
  { code: 'SLC', name: 'Salt Lake City International Airport', city: 'Salt Lake City', country: 'USA', lat: 40.7899, lng: -111.9791 },
  { code: 'PHX', name: 'Phoenix Sky Harbor International Airport', city: 'Phoenix', country: 'USA', lat: 33.4352, lng: -112.0101 },
  { code: 'LAS', name: 'Harry Reid International Airport', city: 'Las Vegas', country: 'USA', lat: 36.084, lng: -115.1537 },
  { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'USA', lat: 33.9416, lng: -118.4085 },
  { code: 'SAN', name: 'San Diego International Airport', city: 'San Diego', country: 'USA', lat: 32.7338, lng: -117.1933 },
  { code: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'USA', lat: 37.6213, lng: -122.379 },
  { code: 'SJC', name: 'San Jose Mineta International Airport', city: 'San Jose', country: 'USA', lat: 37.3639, lng: -121.9289 },
  { code: 'PDX', name: 'Portland International Airport', city: 'Portland', country: 'USA', lat: 45.5898, lng: -122.5951 },
  { code: 'SEA', name: 'Seattle-Tacoma International Airport', city: 'Seattle', country: 'USA', lat: 47.4502, lng: -122.3088 },
  { code: 'HNL', name: 'Daniel K. Inouye International Airport', city: 'Honolulu', country: 'USA', lat: 21.3187, lng: -157.9225 },
  { code: 'ANC', name: 'Ted Stevens Anchorage International Airport', city: 'Anchorage', country: 'USA', lat: 61.1743, lng: -149.9963 },
  { code: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', country: 'Canada', lat: 43.6777, lng: -79.6248 },
  { code: 'YVR', name: 'Vancouver International Airport', city: 'Vancouver', country: 'Canada', lat: 49.1967, lng: -123.1815 },
  { code: 'YUL', name: 'Montréal-Trudeau International Airport', city: 'Montreal', country: 'Canada', lat: 45.4706, lng: -73.7408 },
  { code: 'YYC', name: 'Calgary International Airport', city: 'Calgary', country: 'Canada', lat: 51.1215, lng: -114.0076 },
  { code: 'MEX', name: 'Mexico City International Airport', city: 'Mexico City', country: 'Mexico', lat: 19.4363, lng: -99.0721 },
  { code: 'CUN', name: 'Cancún International Airport', city: 'Cancún', country: 'Mexico', lat: 21.0365, lng: -86.8771 },
  { code: 'GRU', name: 'São Paulo/Guarulhos International Airport', city: 'São Paulo', country: 'Brazil', lat: -23.4356, lng: -46.4731 },
  { code: 'GIG', name: 'Rio de Janeiro/Galeão International Airport', city: 'Rio de Janeiro', country: 'Brazil', lat: -22.8099, lng: -43.2506 },
  { code: 'EZE', name: 'Ministro Pistarini International Airport', city: 'Buenos Aires', country: 'Argentina', lat: -34.8222, lng: -58.5358 },
  { code: 'BOG', name: 'El Dorado International Airport', city: 'Bogotá', country: 'Colombia', lat: 4.7016, lng: -74.1469 },
  { code: 'LIM', name: 'Jorge Chávez International Airport', city: 'Lima', country: 'Peru', lat: -12.0219, lng: -77.1143 },
  { code: 'SCL', name: 'Arturo Merino Benítez International Airport', city: 'Santiago', country: 'Chile', lat: -33.393, lng: -70.7858 },
  { code: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'UK', lat: 51.47, lng: -0.4543 },
  { code: 'MAN', name: 'Manchester Airport', city: 'Manchester', country: 'UK', lat: 53.3537, lng: -2.275 },
  { code: 'DUB', name: 'Dublin Airport', city: 'Dublin', country: 'Ireland', lat: 53.4264, lng: -6.2499 },
  { code: 'CDG', name: 'Paris Charles de Gaulle Airport', city: 'Paris', country: 'France', lat: 49.0097, lng: 2.5479 },
  { code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands', lat: 52.3105, lng: 4.7683 },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', lat: 50.0379, lng: 8.5622 },
  { code: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany', lat: 48.3537, lng: 11.775 },
  { code: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland', lat: 47.4582, lng: 8.5555 },
  { code: 'MAD', name: 'Adolfo Suárez Madrid–Barajas Airport', city: 'Madrid', country: 'Spain', lat: 40.4983, lng: -3.5676 },
  { code: 'BCN', name: 'Josep Tarradellas Barcelona-El Prat Airport', city: 'Barcelona', country: 'Spain', lat: 41.2974, lng: 2.0833 },
  { code: 'LIS', name: 'Humberto Delgado Airport', city: 'Lisbon', country: 'Portugal', lat: 38.7742, lng: -9.1342 },
  { code: 'FCO', name: 'Leonardo da Vinci–Fiumicino Airport', city: 'Rome', country: 'Italy', lat: 41.8003, lng: 12.2389 },
  { code: 'MXP', name: 'Milan Malpensa Airport', city: 'Milan', country: 'Italy', lat: 45.6301, lng: 8.7255 },
  { code: 'ATH', name: 'Athens International Airport', city: 'Athens', country: 'Greece', lat: 37.9364, lng: 23.9445 },
  { code: 'VIE', name: 'Vienna International Airport', city: 'Vienna', country: 'Austria', lat: 48.1103, lng: 16.5697 },
  { code: 'CPH', name: 'Copenhagen Airport', city: 'Copenhagen', country: 'Denmark', lat: 55.618, lng: 12.6508 },
  { code: 'ARN', name: 'Stockholm Arlanda Airport', city: 'Stockholm', country: 'Sweden', lat: 59.6498, lng: 17.9238 },
  { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', lat: 41.2753, lng: 28.7519 },
  { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE', lat: 25.2532, lng: 55.3657 },
  { code: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar', lat: 25.2731, lng: 51.6081 },
  { code: 'CAI', name: 'Cairo International Airport', city: 'Cairo', country: 'Egypt', lat: 30.1219, lng: 31.4056 },
  { code: 'CMN', name: 'Mohammed V International Airport', city: 'Casablanca', country: 'Morocco', lat: 33.3675, lng: -7.5899 },
  { code: 'JNB', name: 'O.R. Tambo International Airport', city: 'Johannesburg', country: 'South Africa', lat: -26.1367, lng: 28.2411 },
  { code: 'CPT', name: 'Cape Town International Airport', city: 'Cape Town', country: 'South Africa', lat: -33.9715, lng: 18.6021 },
  { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'New Delhi', country: 'India', lat: 28.5562, lng: 77.1 },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'India', lat: 19.0896, lng: 72.8656 },
  { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore', lat: 1.3644, lng: 103.9915 },
  { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', lat: 13.69, lng: 100.7501 },
  { code: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'China', lat: 22.308, lng: 113.9185 },
  { code: 'ICN', name: 'Incheon International Airport', city: 'Seoul', country: 'South Korea', lat: 37.4602, lng: 126.4407 },
  { code: 'HND', name: 'Tokyo Haneda Airport', city: 'Tokyo', country: 'Japan', lat: 35.5494, lng: 139.7798 },
  { code: 'KIX', name: 'Kansai International Airport', city: 'Osaka', country: 'Japan', lat: 34.432, lng: 135.2304 },
  { code: 'TPE', name: 'Taiwan Taoyuan International Airport', city: 'Taipei', country: 'Taiwan', lat: 25.0797, lng: 121.2342 },
  { code: 'MNL', name: 'Ninoy Aquino International Airport', city: 'Manila', country: 'Philippines', lat: 14.5086, lng: 121.0194 },
  { code: 'CGK', name: 'Soekarno-Hatta International Airport', city: 'Jakarta', country: 'Indonesia', lat: -6.1256, lng: 106.6559 },
  { code: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia', lat: -33.9399, lng: 151.1753 },
  { code: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', lat: -37.669, lng: 144.841 },
  { code: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'New Zealand', lat: -37.0082, lng: 174.785 },
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestAirportByCoords(latitude: number, longitude: number) {
  let best = MAJOR_AIRPORTS[0];
  let bestDist = Infinity;
  for (const ap of MAJOR_AIRPORTS) {
    const d = haversineKm(latitude, longitude, ap.lat, ap.lng);
    if (d < bestDist) {
      bestDist = d;
      best = ap;
    }
  }
  return {
    code: best.code,
    name: best.name,
    city: best.city,
    country: best.country,
    distanceKm: Math.round(bestDist),
    label: `${best.code} — ${best.city} (${best.name})`,
  };
}

const wrapAffiliateLink = (
  url: string,
  destination: string,
  type: string,
  options?: { name?: string; departureAirport?: string; startDate?: string; endDate?: string }
): string => {
  const ref = (process.env.AFFILIATE_REF || 'whisk_travel').trim();
  const fallbackPartnerId = (process.env.AFFILIATE_PARTNER_ID || '').trim();
  const typePartnerId =
    (type === 'hotel'
      ? process.env.AFFILIATE_HOTELS_ID
      : type === 'flight'
      ? process.env.AFFILIATE_FLIGHTS_ID
      : type === 'tour'
      ? process.env.AFFILIATE_TOURS_ID
      : type === 'restaurant'
      ? process.env.AFFILIATE_DINING_ID
      : ''
    )?.trim() || fallbackPartnerId;

  const validStart = options?.startDate && /^\d{4}-\d{2}-\d{2}$/.test(options.startDate) ? options.startDate : '';
  const validEnd = options?.endDate && /^\d{4}-\d{2}-\d{2}$/.test(options.endDate) ? options.endDate : '';

  let targetUrl = (url || '').trim();
  const isGenericFallback =
    !targetUrl ||
    targetUrl === 'https://google.com' ||
    targetUrl === 'http://google.com' ||
    targetUrl.includes('example.com');

  if (type === 'flight') {
    const origin = (options?.departureAirport || '').trim();
    const datePhrase = validStart && validEnd ? ` on ${validStart} through ${validEnd}` : validStart ? ` on ${validStart}` : '';
    const flightQuery = origin
      ? `Flights from ${origin} to ${destination}${datePhrase}`
      : `Flights to ${destination}${datePhrase}`;
    if (isGenericFallback || !targetUrl.toLowerCase().includes('flight')) {
      targetUrl = `https://www.google.com/travel/flights?q=${encodeURIComponent(flightQuery)}`;
    }
  } else if (isGenericFallback) {
    const placeQuery = `${options?.name || ''} ${destination}`.trim();
    if (type === 'hotel') {
      targetUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(placeQuery)}`;
    } else if (type === 'tour') {
      targetUrl = `https://www.viator.com/searchResults/all?text=${encodeURIComponent(placeQuery)}`;
    } else {
      targetUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeQuery)}`;
    }
  }

  try {
    const urlObj = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
    if (type === 'hotel' && urlObj.hostname.includes('booking.com')) {
      if (validStart && !urlObj.searchParams.has('checkin')) urlObj.searchParams.set('checkin', validStart);
      if (validEnd && !urlObj.searchParams.has('checkout')) urlObj.searchParams.set('checkout', validEnd);
    }
    if (ref && !urlObj.searchParams.has('ref')) {
      urlObj.searchParams.set('ref', ref);
    }
    if (typePartnerId) {
      if (urlObj.hostname.includes('booking.com')) {
        urlObj.searchParams.set('aid', typePartnerId);
      } else if (urlObj.hostname.includes('viator.com')) {
        urlObj.searchParams.set('pid', typePartnerId);
      } else {
        urlObj.searchParams.set('partner_id', typePartnerId);
      }
    }
    return urlObj.toString();
  } catch (_e) {
    return targetUrl;
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

  const hasMapsTool =
    Array.isArray(config?.tools) &&
    config.tools.some((t: any) => t && typeof t === 'object' && 'googleMaps' in t);

  const attempts: Array<{ model: string; config: any; delayBeforeMs: number }> = [
    { model, config, delayBeforeMs: 0 },
  ];

  if (allowLiteFallback && model !== 'gemini-3.1-flash-lite') {
    const liteConfig = config ? { ...config } : {};
    if (liteConfig.thinkingConfig) {
      liteConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
    }
    if (hasMapsTool) {
      liteConfig.tools = [{ googleSearch: {} }];
      delete liteConfig.toolConfig;
    }
    attempts.push({ model: 'gemini-3.1-flash-lite', config: liteConfig, delayBeforeMs: 900 });

    if (allowUngroundedFallbackOn429 && liteConfig.tools) {
      const ungroundedConfig = { ...liteConfig };
      delete ungroundedConfig.tools;
      delete ungroundedConfig.toolConfig;
      attempts.push({
        model: 'gemini-3.1-flash-lite',
        config: ungroundedConfig,
        delayBeforeMs: 700,
      });
    }
  } else {
    attempts.push({ model, config, delayBeforeMs: 1200 });
    if (allowUngroundedFallbackOn429 && config?.tools) {
      const ungroundedConfig = { ...config };
      delete ungroundedConfig.tools;
      delete ungroundedConfig.toolConfig;
      attempts.push({ model, config: ungroundedConfig, delayBeforeMs: 700 });
    }
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

// Nearest Major Airport lookup from browser geolocation coordinates
app.post('/api/location/nearest-airport', (req, res) => {
  const lat = Number(req.body?.latitude);
  const lng = Number(req.body?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return res.status(400).json({ error: 'Valid latitude and longitude coordinates are required.' });
  }
  return res.json(findNearestAirportByCoords(lat, lng));
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

// --- Public Legal Document Endpoints & Consent Audit API ---
const LEGAL_VERSION = '2026-11-17';
const LEGAL_EFFECTIVE_DATE = 'November 17, 2026';
const PUBLIC_LEGAL_DOCS = [
  { id: 'terms', title: 'Terms of Service', file: 'terms.md', publicPath: '/legal/terms', apiPath: '/api/legal/terms' },
  { id: 'privacy', title: 'Privacy Policy', file: 'privacy.md', publicPath: '/legal/privacy', apiPath: '/api/legal/privacy' },
  { id: 'cookies', title: 'Cookie Policy', file: 'cookies.md', publicPath: '/legal/cookies', apiPath: '/api/legal/cookies' },
  { id: 'ugc', title: 'User-Generated Content Policy', file: 'ugc.md', publicPath: '/legal/ugc', apiPath: '/api/legal/ugc' },
  { id: 'refunds', title: 'Refund & Cancellation Policy', file: 'refunds.md', publicPath: '/legal/refunds', apiPath: '/api/legal/refunds' },
  { id: 'disclaimer', title: 'Disclaimer & Limitation of Liability', file: 'disclaimer.md', publicPath: '/legal/disclaimer', apiPath: '/api/legal/disclaimer' },
] as const;

function readPublicLegalMarkdown(fileName: string): string | null {
  const candidates = [
    path.resolve(__dirname, 'src/legal', fileName),
    path.resolve(process.cwd(), 'src/legal', fileName),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate, 'utf-8');
    }
  }
  return null;
}

app.get('/api/legal', (_req, res) => {
  res.json({
    version: LEGAL_VERSION,
    effectiveDate: LEGAL_EFFECTIVE_DATE,
    contactEmail: 'privacy@whisk.travel',
    documents: PUBLIC_LEGAL_DOCS.map(({ id, title, publicPath, apiPath }) => ({
      id,
      title,
      publicPath,
      apiPath,
    })),
  });
});

app.get('/api/legal/consent', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const snap = await adminDb.collection('users').doc(uid).get();
    if (!snap.exists) {
      return res.json({
        upToDate: false,
        legalConsentVersion: null,
        legalConsentAcceptedAt: null,
        marketingOptIn: false,
      });
    }
    const data = snap.data() || {};
    const acceptedVersion =
      typeof data.legalConsentVersion === 'string' ? data.legalConsentVersion : null;
    const acceptedAt = data.legalConsentAcceptedAt?.toDate
      ? data.legalConsentAcceptedAt.toDate().toISOString()
      : null;

    return res.json({
      upToDate: Boolean(acceptedVersion && acceptedAt),
      legalConsentVersion: acceptedVersion,
      legalConsentAcceptedAt: acceptedAt,
      marketingOptIn: Boolean(data.marketingOptIn),
    });
  } catch (err: any) {
    console.error('Failed to fetch legal consent status:', err);
    return res.status(503).json({
      error: 'Legal consent lookup temporarily unavailable.',
      code: 'ADMIN_UNAVAILABLE',
    });
  }
});

app.post('/api/legal/consent', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const body = req.body || {};
    const version =
      typeof body.version === 'string' && body.version.trim()
        ? body.version.trim().slice(0, 30)
        : LEGAL_VERSION;
    const acceptedAll = Boolean(
      body.acceptedAll ||
        (body.acceptedTerms &&
          body.acceptedPrivacy &&
          body.acceptedCookies &&
          body.acceptedUgc &&
          body.acceptedRefunds &&
          body.acceptedDisclaimer)
    );

    if (!acceptedAll) {
      return res.status(400).json({
        error: 'Explicit acceptance of Terms of Service, Privacy Policy, and all legal policies is required.',
      });
    }

    const marketingOptIn = Boolean(body.marketingOptIn);
    const nowIso = new Date().toISOString();

    try {
      await adminDb
        .collection('users')
        .doc(uid)
        .set(
          {
            legalConsentVersion: version,
            legalConsentAcceptedAt: FieldValue.serverTimestamp(),
            marketingOptIn,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
    } catch (adminErr: any) {
      const msg = String(adminErr?.message || '');
      const isAdminIamUnavailable =
        adminErr?.code === 7 ||
        adminErr?.code === 16 ||
        msg.includes('PERMISSION_DENIED') ||
        msg.includes('Could not load the default credentials');
      if (isAdminIamUnavailable) {
        return res.json({
          recorded: true,
          syncedVia: 'client_firestore',
          version,
          marketingOptIn,
          acceptedAt: nowIso,
        });
      }
      throw adminErr;
    }

    return res.json({
      recorded: true,
      syncedVia: 'server_admin',
      version,
      marketingOptIn,
      acceptedAt: nowIso,
    });
  } catch (err: any) {
    console.warn('Backend consent audit sync skipped:', err?.message || err);
    return res.status(503).json({
      error: 'Backend consent audit temporarily unavailable.',
      code: 'ADMIN_UNAVAILABLE',
    });
  }
});

app.get('/api/legal/:docId', (req, res) => {
  const docId = String(req.params.docId || '').trim().toLowerCase();
  const entry = PUBLIC_LEGAL_DOCS.find((d) => d.id === docId);
  if (!entry) {
    return res.status(404).json({ error: 'Legal document not found.' });
  }

  const markdown = readPublicLegalMarkdown(entry.file);
  if (!markdown) {
    return res.status(500).json({ error: 'Legal document file could not be loaded.' });
  }

  const wantsRaw =
    req.query.format === 'raw' ||
    req.query.format === 'md' ||
    (req.headers.accept && req.headers.accept.includes('text/markdown'));

  if (wantsRaw) {
    return res.type('text/markdown; charset=utf-8').send(markdown);
  }

  return res.json({
    id: entry.id,
    title: entry.title,
    version: LEGAL_VERSION,
    effectiveDate: LEGAL_EFFECTIVE_DATE,
    contactEmail: 'privacy@whisk.travel',
    publicPath: entry.publicPath,
    markdown,
  });
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

// Generate Travel Itinerary with fast low-latency Google Search Grounding, nearest airport routing, & day-attached bookings
app.post(['/api/gemini/itinerary', '/api/itinerary'], async (req, res) => {
  try {
    const params = req.body;
    if (!params || !params.destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    // Resolve departure airport from explicit user input or browser coordinates
    let resolvedDepartureAirport =
      typeof params.departureAirport === 'string' && params.departureAirport.trim()
        ? params.departureAirport.trim().slice(0, 120)
        : typeof params.departureLocation === 'string' && params.departureLocation.trim()
        ? params.departureLocation.trim().slice(0, 120)
        : '';

    if (
      !resolvedDepartureAirport &&
      typeof params.latitude === 'number' &&
      typeof params.longitude === 'number'
    ) {
      const nearest = findNearestAirportByCoords(params.latitude, params.longitude);
      resolvedDepartureAirport = `${nearest.code} (${nearest.city})`;
    }

    const preferredSpotsList: Array<{ name: string; destination?: string; description?: string }> =
      Array.isArray(params.preferredSpots)
        ? params.preferredSpots
            .filter((s: any) => s && typeof s.name === 'string' && s.name.trim())
            .slice(0, 6)
        : [];

    const preferredSpotsSection =
      preferredSpotsList.length > 0
        ? `\n    Traveler's Previously Explored / Saved Spots (weave matching spots into the day plans when relevant to ${params.destination}):\n    ${preferredSpotsList
            .map((s) => `- ${s.name}${s.destination ? ` (${s.destination})` : ''}${s.description ? `: ${s.description.slice(0, 120)}` : ''}`)
            .join('\n    ')}`
        : '';

    const isoDateRe = /^\d{4}-\d{2}-\d{2}$/;
    const rawStartDate = typeof params.startDate === 'string' && isoDateRe.test(params.startDate.trim()) ? params.startDate.trim() : '';
    const rawEndDate = typeof params.endDate === 'string' && isoDateRe.test(params.endDate.trim()) ? params.endDate.trim() : '';

    let resolvedDuration = params.duration || '3 days';
    let travelDatesContext = 'Flexible dates (not specified)';
    const calendarDayLabels: string[] = [];

    if (rawStartDate) {
      const startObj = new Date(`${rawStartDate}T12:00:00Z`);
      const parsedDurationDays = Number.parseInt(String(resolvedDuration), 10) || 3;
      let dayCount = Math.min(14, Math.max(1, parsedDurationDays));
      let effectiveEnd = rawEndDate;

      if (rawEndDate) {
        const endObj = new Date(`${rawEndDate}T12:00:00Z`);
        const diffDays = Math.round((endObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (diffDays >= 1 && diffDays <= 14) {
          dayCount = diffDays;
          resolvedDuration = `${dayCount} ${dayCount === 1 ? 'day' : 'days'}`;
        }
      } else {
        const computedEnd = new Date(startObj.getTime() + (dayCount - 1) * 86400000);
        effectiveEnd = computedEnd.toISOString().slice(0, 10);
      }

      for (let i = 0; i < dayCount; i++) {
        const d = new Date(startObj.getTime() + i * 86400000);
        calendarDayLabels.push(d.toISOString().slice(0, 10));
      }

      travelDatesContext = effectiveEnd
        ? `${rawStartDate} to ${effectiveEnd} (${dayCount} ${dayCount === 1 ? 'day' : 'days'} — account for exact season, day-of-week closures, local events, and seasonal flight/hotel pricing)`
        : `Starting ${rawStartDate} (${resolvedDuration})`;
    }

    const flightOriginContext = resolvedDepartureAirport
      ? `Departure Hub / Nearest Airport: ${resolvedDepartureAirport} (MUST estimate flight options & pricing departing from ${resolvedDepartureAirport} to ${params.destination})`
      : `Departure Hub: Not specified (estimate realistic round-trip flights from major international hubs to ${params.destination})`;

    const itineraryPrompt = `You are Whisk's expert travel planner. Create a customized, real-world travel itinerary JSON for ${params.destination}.

    Search live travel information to ground:
    1. Flight options and current round-trip price estimates (${flightOriginContext}).
    2. Real, highly-rated hotels/boutique lodging in ${params.destination} with current nightly rates and availability status.
    3. Real restaurants and tours matching the traveler's interests with realistic prices.

    Traveler Profile:
    - Travel Dates: ${travelDatesContext}
    - Duration: ${resolvedDuration}
    - ${flightOriginContext}
    - Interests: ${(params.interests || []).join(', ') || 'Local culture, dining, and scenic highlights'}
    - Budget Tier: ${params.budget || 'Mid-range'}
    - Pace: ${params.pace || 'Moderate'}
    - Accessibility Needs: ${(params.accessibility && params.accessibility.length > 0) ? params.accessibility.join(', ') : 'None specified'}${preferredSpotsSection}

    Strict Rules:
    1. Keep descriptions concise, lively, and practical so the schedule is crisp and scannable.
    2. Every activity 'location' MUST be a specific real-world venue, landmark, restaurant, or neighborhood in ${params.destination} (never generic phrases like "Local dinner"), and include a concise 1-sentence 'insiderTip' with verified timing, dish, or logistics advice.
    3. For every recommendation (flight, hotel, restaurant, tour), include realistic 'price', 'availability', and 'dayNumbers' (array of 1-indexed day numbers where that booking is utilized: put flights & hotel check-in on [1], and each restaurant or tour on the exact day number(s) it appears in the itinerary).
    4. For flight recommendations, include 'departureAirport' matching "${resolvedDepartureAirport || 'Major Hub'}".
    5. Directly weave any accessibility requirements into activity descriptions and recommendations.`;

    const { response: structResponse } = await generateContentWithResilience({
      model: 'gemini-4-hydrogen',
      contents: itineraryPrompt,
      allowLiteFallback: true,
      allowUngroundedFallbackOn429: true,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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
                        insiderTip: { type: Type.STRING },
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
                  dayNumbers: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER },
                  },
                  departureAirport: { type: Type.STRING },
                },
                required: ['name', 'type', 'description', 'affiliateUrl', 'price', 'availability', 'dayNumbers'],
              },
            },
          },
          required: ['title', 'destination', 'duration', 'summary', 'days', 'recommendations'],
        },
      },
    });

    const parsed = parseModelJson(structResponse.text, {} as any);
    const totalDays = Math.max(1, (parsed.days || []).length);

    const processedRecommendations = (parsed.recommendations || []).map((rec: any) => {
      const validDayNums = Array.isArray(rec.dayNumbers)
        ? rec.dayNumbers
            .map((n: any) => Number(n))
            .filter((n: number) => Number.isInteger(n) && n >= 1 && n <= totalDays)
        : [];
      const fallbackDays =
        validDayNums.length > 0
          ? validDayNums
          : rec.type === 'flight' || rec.type === 'hotel'
          ? [1]
          : [];

      const recDeparture =
        rec.type === 'flight'
          ? rec.departureAirport || resolvedDepartureAirport || undefined
          : undefined;

      return {
        ...rec,
        dayNumbers: fallbackDays,
        departureAirport: recDeparture,
        affiliateUrl: wrapAffiliateLink(rec.affiliateUrl || '', params.destination, rec.type, {
          name: rec.name,
          departureAirport: recDeparture,
          startDate: rawStartDate || undefined,
          endDate: rawEndDate || (calendarDayLabels.length > 0 ? calendarDayLabels[calendarDayLabels.length - 1] : undefined),
        }),
      };
    });

    // Attach exact calendar dates to each DayPlan when startDate was selected
    let finalDays = (parsed.days || []).map((day: any, idx: number) => ({
      ...day,
      dayNumber: typeof day.dayNumber === 'number' ? day.dayNumber : idx + 1,
      date: calendarDayLabels[idx] || undefined,
    }));
    let quotaExceeded = false;
    try {
      const geocodeResult = await Promise.race([
        geocodeItineraryDays(finalDays, parsed.destination || params.destination),
        new Promise<{ days: any[]; quotaExceeded: boolean }>((resolve) =>
          setTimeout(() => resolve({ days: finalDays, quotaExceeded: false }), 2200)
        ),
      ]);
      finalDays = geocodeResult.days;
      quotaExceeded = geocodeResult.quotaExceeded;
    } catch {
      // Non-fatal; client map lazily geocodes missing pins
    }

    const searchSources = extractGroundingSources(structResponse);
    const cleanId = `trip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const finalEndDate =
      rawEndDate ||
      (calendarDayLabels.length > 0 ? calendarDayLabels[calendarDayLabels.length - 1] : undefined);

    res.json({
      ...parsed,
      duration: resolvedDuration,
      startDate: rawStartDate || undefined,
      endDate: finalEndDate,
      departureAirport: resolvedDepartureAirport || undefined,
      days: finalDays,
      recommendations: processedRecommendations,
      groundingSources: searchSources.slice(0, 25),
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
      allowLiteFallback: true,
      allowUngroundedFallbackOn429: true,
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

// Generate Public Editorial Destination Guide (edited search intel + 1-3 suggested spots, keeping all itinerary data & methodology private)
app.post(['/api/gemini/blog-post', '/api/blog-post'], async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    const searchIntelNotes = Array.isArray(payload.searchIntel)
      ? payload.searchIntel
          .slice(0, 6)
          .map((s: any) => (s?.title ? `${s.title}${s.snippet ? ` — ${s.snippet}` : ''}` : ''))
          .filter(Boolean)
          .join(' | ')
      : '';

    const spotHints = Array.isArray(payload.spotHints)
      ? payload.spotHints
          .slice(0, 3)
          .map((s: any) => (s?.name ? `${s.name} (${s.type || 'spot'})` : ''))
          .filter(Boolean)
          .join(', ')
      : '';

    const prompt = `Write a polished, public-facing destination Field Guide for ${payload.destination} optimized for organic discovery and human readers.

    Public Research Notes (edit cleanly for a general magazine-style audience):
    - Destination: ${payload.destination}
    - Public Research Context: ${searchIntelNotes || payload.destination}
    - Optional Spot Ideas: ${spotHints || 'Use 1-3 iconic local places to eat, visit, or see'}

    Strict Privacy & Editorial Rules:
    1. Keep ALL personal traveler itinerary data and how Whisk builds itineraries 100% private. NEVER mention AI, prompts, algorithms, user schedules, private itineraries, or behind-the-scenes tools.
    2. When describing ${payload.destination}, naturally suggest **1 to 3 standout real-world places to eat, visit, or see** with vivid local flavor and practical timing tips.
    3. Voice: Warm, crisp, editorial travel writing — authentic neighborhood feel, zero corporate filler.
    4. SEO & GEO Metadata:
       - "seoTitle": Compelling search headline (45–60 characters).
       - "metaDescription": 130–158 character snippet inviting readers to explore ${payload.destination}.
       - "slug": Lowercase hyphenated URL slug including destination.
       - "keywords": 5–7 natural destination travel search phrases.
       - "geoSummary": A concise 2–3 sentence factual destination overview covering best neighborhoods, local transit, and when to go.
       - "neighborhoods": 3–5 real neighborhoods or areas in ${payload.destination}.
       - "faqs": 3 helpful general traveler Q&As with concise 2-sentence answers.
    5. Content Markdown: Structured with clear ## headers, 1–3 highlighted spots to eat/visit/see, scannable bullet points (* item), and one local insider tip in a blockquote (> tip).`;

    const { response } = await generateContentWithResilience({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      allowLiteFallback: true,
      allowUngroundedFallbackOn429: true,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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
    const finalSlug = toSeoSlug(parsed.slug || parsed.title || payload.destination);
    generatedGuideSlugs.add(finalSlug);
    const geoCoordinates =
      payload.geoCoordinates &&
      typeof payload.geoCoordinates.latitude === 'number' &&
      typeof payload.geoCoordinates.longitude === 'number'
        ? payload.geoCoordinates
        : extractCentroidCoordinates(payload);

    res.json({
      ...parsed,
      slug: finalSlug,
      geoCoordinates,
      itineraryId: `editorial_${Date.now()}`,
      destination: payload.destination,
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
  const pathname = new URL(request.url || '/', 'http://localhost').pathname;
  if (pathname === '/live') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
    return;
  }
  socket.destroy();
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
    ...PUBLIC_LEGAL_DOCS.map(
      (docEntry) =>
        `  <url><loc>${baseUrl}${docEntry.publicPath}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>`
    ),
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
      server: { middlewareMode: true, hmr: false, ws: false },
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
