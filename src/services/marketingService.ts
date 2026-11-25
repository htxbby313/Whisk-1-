import { auth } from '../firebase';
import { GroundingSource } from '../../types';

export type MarketingPlatform = 'instagram-reel' | 'tiktok' | 'instagram-story' | 'carousel';
export type MarketingImageAspect = '9:16' | '4:5' | '1:1' | '16:9' | '3:4' | '4:3';
export type MarketingImageSize = '1K' | '2K';
export type MarketingVideoAspect = '9:16' | '16:9';
export type MarketingVideoDuration = '5s' | '6s' | '8s' | '10s' | '12s' | '15s';
export type MarketingVideoResolution = '720p' | '1080p';
export type MarketingChatModel =
  | 'gemini-4-hydrogen'
  | 'gemini-4-neon'
  | 'gemini-4-carbon'
  | 'gemini-3.1-flash-lite';

export interface VerifiedMarketingSpot {
  name: string;
  neighborhood: string;
  whyItConverts: string;
}

export interface MarketingTrendBrief {
  destination: string;
  platform: string;
  viralHooks: string[];
  boardingPassHeadline: string;
  socialProofQuote: string;
  caption: string;
  hashtags: string[];
  imagePrompt: string;
  videoPrompt: string;
  trendSummary: string;
  verifiedSpots: VerifiedMarketingSpot[];
  sources: GroundingSource[];
}

export interface MarketingImageResult {
  imageDataUrl: string;
  mimeType: string;
  text: string;
  interactionId: string | null;
  model: string;
}

export interface MarketingVideoResult {
  videoDataUrl: string;
  mimeType: string;
  interactionId: string | null;
  aspectRatio: MarketingVideoAspect;
  duration: MarketingVideoDuration;
  resolution: MarketingVideoResolution;
  model: string;
}

export interface MarketingChatTurn {
  role: 'user' | 'model';
  text: string;
  model?: string;
  sources?: GroundingSource[];
}

async function getAdminAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Sign in with an administrator account to use the Marketing Studio.');
  }
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function postMarketingJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const headers = await getAdminAuthHeaders();
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

export async function fetchMarketingTrendsAndSpots(params: {
  destination: string;
  platform: MarketingPlatform;
  campaignGoal?: string;
}): Promise<MarketingTrendBrief> {
  return postMarketingJson<MarketingTrendBrief>('/api/marketing/trends-and-spots', params);
}

export async function generateOrEditMarketingImage(params: {
  prompt: string;
  aspectRatio: MarketingImageAspect;
  imageSize: MarketingImageSize;
  sourceImageDataUrl?: string;
}): Promise<MarketingImageResult> {
  return postMarketingJson<MarketingImageResult>('/api/marketing/image', params);
}

export async function generateMarketingVideo(params: {
  prompt: string;
  aspectRatio: MarketingVideoAspect;
  duration: MarketingVideoDuration;
  resolution: MarketingVideoResolution;
  sourceImageDataUrl?: string;
  previousInteractionId?: string;
}): Promise<MarketingVideoResult> {
  return postMarketingJson<MarketingVideoResult>('/api/marketing/video', params);
}

export async function sendMarketingDirectorChat(params: {
  message: string;
  model: MarketingChatModel;
  useSearch: boolean;
  contextSummary: string;
  history: Array<{ role: 'user' | 'model'; text: string }>;
}): Promise<{ text: string; model: string; sources: GroundingSource[] }> {
  return postMarketingJson('/api/marketing/chat', params);
}
