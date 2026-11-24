import { GoogleGenAI, Type } from '@google/genai';
import { SearchParams, TripItinerary } from './types';
import {
  getDestinationGeo,
  generateItinerarySeo,
} from './src/utils/seoGeoHelper';

// Supports Google AI Studio (process.env.API_KEY) and local Vite (import.meta.env.VITE_GEMINI_API_KEY)
const apiKey =
  (typeof process !== 'undefined' && process.env?.API_KEY) ||
  (typeof import.meta !== 'undefined' &&
    import.meta.env?.VITE_GEMINI_API_KEY) ||
  '';
const ai = new GoogleGenAI({ apiKey });

const getAffiliateId = (type: string): string => {
  const envPartner =
    typeof process !== 'undefined' ? process.env?.AFFILIATE_PARTNER_ID : undefined;
  const envHotels =
    typeof process !== 'undefined' ? process.env?.AFFILIATE_HOTELS_ID : undefined;
  const envFlights =
    typeof process !== 'undefined' ? process.env?.AFFILIATE_FLIGHTS_ID : undefined;
  const envTours =
    typeof process !== 'undefined' ? process.env?.AFFILIATE_TOURS_ID : undefined;
  const envDining =
    typeof process !== 'undefined' ? process.env?.AFFILIATE_DINING_ID : undefined;

  switch (type.toLowerCase()) {
    case 'hotel':
    case 'stay':
    case 'lodging':
      return envHotels || envPartner || '809946';
    case 'flight':
    case 'transport':
      return envFlights || envPartner || '809946';
    case 'tour':
    case 'activity':
      return envTours || envPartner || '809946';
    case 'restaurant':
    case 'dining':
      return envDining || envPartner || 'whisk';
    default:
      return envPartner || '809946';
  }
};

/**
 * Appends tracking parameters to affiliate URLs.
 */
const wrapAffiliateLink = (
  url: string,
  destination: string,
  type: string
): string => {
  const partnerId = getAffiliateId(type);
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('marker', partnerId);
    urlObj.searchParams.set('ref', 'whisk');
    urlObj.searchParams.set('utm_source', 'whisk_direct');
    urlObj.searchParams.set('utm_medium', 'itinerary_app');
    urlObj.searchParams.set(
      'dest',
      destination.toLowerCase().replace(/\s+/g, '_')
    );
    urlObj.searchParams.set('category', type);
    return urlObj.toString();
  } catch {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}marker=${partnerId}&ref=whisk&dest=${encodeURIComponent(destination)}&category=${type}`;
  }
};

export const generateItinerary = async (
  params: SearchParams
): Promise<TripItinerary> => {
  try {
    const accessibilityStr =
      params.accessibility.length > 0
        ? `IMPORTANT: The traveler has specific needs: ${params.accessibility.join(', ')}. All recommended venues and activities MUST be confirmed to meet these needs.`
        : '';

    const anchorsStr =
      params.mustSeeAnchors && params.mustSeeAnchors.length > 0
        ? `ANCHOR SPOTS & MUST-SEES (NON-NEGOTIABLE):
    The traveler has specified these essential anchor spots/activities: ${params.mustSeeAnchors.join(', ')}.
    ANCHOR & BRANCHING GUIDELINES:
    1. Lock each specified anchor spot into the daily schedule at realistic times and geographically sound neighborhoods.
    2. Set "isAnchor": true for each of these anchor activities.
    3. Surrounding each anchor, craft unique, hyper-local "branching" experiences (e.g., hidden garden, artisan workshop, local aperitivo, or secret view within a 5-10 minute walk) so returning travelers experience fresh discoveries.
    4. Provide "branchingReason" explaining the local connection or context.`
        : '';

    const prompt = `You are a Senior Travel Agent for "Whisk", a bespoke travel agency. Create a highly detailed and engaging travel itinerary based on years of professional experience.

    DESTINATION: ${params.destination}
    DURATION: ${params.duration}
    INTERESTS: ${params.interests.join(', ')}
    BUDGET: ${params.budget}
    PACE: ${params.pace}
    ${accessibilityStr}
    ${anchorsStr}

    GUIDELINES:
    1. Title: Create a warm, inviting, magazine-style title.
    2. Activities: Provide specific timings, vivid and friendly descriptions, and accurate location names.
    3. Recommendations: Select exactly 3 excellent partners: 1 Hotel, 1 Local Tour, 1 Top-rated Restaurant.
    4. URLs: Provide a real booking URL for each partner.
    5. Tone: Professional, warm, and highly knowledgeable. 
    6. CRITICAL: NEVER mention you are an AI. Speak as a human travel expert who has personally vetted these locations and loves to help people travel.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
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
                        isAnchor: { type: Type.BOOLEAN },
                        branchingReason: { type: Type.STRING },
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
                  type: {
                    type: Type.STRING,
                    enum: ['hotel', 'tour', 'restaurant'],
                  },
                  description: { type: Type.STRING },
                  affiliateUrl: { type: Type.STRING },
                },
                required: ['name', 'type', 'description', 'affiliateUrl'],
              },
            },
          },
          required: [
            'title',
            'destination',
            'duration',
            'summary',
            'days',
            'recommendations',
          ],
        },
      },
    });

    // Parse & validate
    let parsed: any;
    try {
      parsed = JSON.parse(response.text);
    } catch {
      throw new Error('Failed to parse Gemini response JSON.');
    }
    if (
      !parsed.title ||
      !Array.isArray(parsed.days) ||
      !Array.isArray(parsed.recommendations)
    ) {
      throw new Error('Gemini response missing required fields.');
    }

    const processedRecommendations = (parsed.recommendations || []).map(
      (rec: any) => ({
        ...rec,
        affiliateUrl: wrapAffiliateLink(
          rec.affiliateUrl,
          params.destination,
          rec.type
        ),
      })
    );

    const geo = getDestinationGeo(params.destination);
    const seo = generateItinerarySeo(
      params.destination,
      params.duration,
      parsed.summary
    );

    return {
      ...parsed,
      recommendations: processedRecommendations,
      id: Math.random().toString(36).substring(7),
      createdAt: new Date().toISOString(),
      budget: params.budget,
      pace: params.pace,
      accessibility: params.accessibility,
      mustSeeAnchors: params.mustSeeAnchors,
      overallRating: 0,
      geo,
      seo,
    };
  } catch (err) {
    console.error('generateItinerary error:', err);
    // Re‑throw so callers can handle UI feedback
    throw err;
  }
};

export const sendChatMessage = async (message: string, history: any[] = []) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [...history, { role: 'user', parts: [{ text: message }] }],
    config: {
      systemInstruction:
        'You are the Whisk Head Concierge. Provide expert, encouraging, and concise travel advice. Maintain the persona of a high-end travel agent. NEVER reveal your artificial nature.',
    },
  });
  return response.text;
};

export const sendFastChatMessage = async (message: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-flash-lite-latest',
    contents: message,
    config: {
      systemInstruction:
        'You are a Whisk Help Desk assistant. Provide extremely fast, helpful, and brief answers. Pure hospitality.',
    },
  });
  return response.text;
};

export const sendThinkingChatMessage = async (message: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: message,
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      systemInstruction:
        'You are a Senior Travel Planner at Whisk. You handle complex travel arrangements (multi-destination, strict budgets, large groups). Provide detailed, thoughtful insights while remaining in character as a human travel professional.',
    },
  });
  return response.text;
};
