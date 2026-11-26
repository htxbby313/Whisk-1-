import * as React from 'react';
import {
  AlertCircle,
  Box,
  Camera,
  Check,
  Copy,
  Download,
  ExternalLink,
  Film,
  Globe,
  Image as ImageIcon,
  Layers,
  Loader2,
  MapPin,
  MessageSquare,
  Play,
  RefreshCw,
  Search,
  Send,
  Shuffle,
  SkipForward,
  Sparkles,
  Ticket,
  Upload,
  Volume2,
  Wand2,
  X,
} from 'lucide-react';
import { TripItinerary } from '../../types';
import { WhiskLogo } from './WhiskLogo';
import { BoardingPass3DStage } from './BoardingPass3DStage';
import { LANDMARK_POLAROIDS, PolaroidLandmark } from '../data/destinationMedia';
import {
  exportWhiskLogoAsset,
  MARKETING_PASS_THEMES,
  MarketingBoardingPassSpec,
  MarketingPassThemeId,
  renderMarketingSocialProofPng,
} from './BoardingPassSocialProofCanvas';
import {
  buildAutoReelPrompts,
  REEL_CONTENT_FORMATS,
  ReelContentFormatId,
} from './marketingReelPresets';
import {
  compositeLuxuryBoardingPassReel,
  compositeSoundscapeBoardingPassReel,
  renderAnimatedPolaroidReel,
} from './luxuryReelCompositor';
import {
  fetchMarketingTrendsAndSpots,
  generateMarketingVideo,
  generateOrEditMarketingImage,
  MarketingChatModel,
  MarketingChatTurn,
  MarketingImageAspect,
  MarketingImageSize,
  MarketingPlatform,
  MarketingTrendBrief,
  MarketingVideoAspect,
  MarketingVideoDuration,
  MarketingVideoResolution,
  sendMarketingDirectorChat,
} from '../services/marketingService';

interface GeneratedReelItem {
  id: string;
  formatId: ReelContentFormatId;
  formatTitle: string;
  destination: string;
  destCode: string;
  aspectRatio: MarketingVideoAspect;
  duration: string;
  videoUrl: string;
  rawFootageUrl: string;
  fileExtension: 'mp4' | 'webm';
  interactionId: string | null;
  caption: string;
  hasStudioOutro: boolean;
  createdAt: string;
}

type StudioTab = 'social-pass' | 'stage-3d' | 'image-studio' | 'video-studio' | 'director';

interface AdminMarketingStudioProps {
  itineraries: TripItinerary[];
  totalUsers: number;
  totalItineraries: number;
  publishedGuidesCount: number;
}

interface PresetCampaign {
  id: string;
  label: string;
  originCode: string;
  originLabel: string;
  destCode: string;
  destLabel: string;
  title: string;
  dateDisplay: string;
  duration: string;
  cabinLabel: string;
  viralHook: string;
  socialProofQuote: string;
  anchorSpots: Array<{ name: string; subtitle: string }>;
}

const PRESET_CAMPAIGNS: PresetCampaign[] = [
  {
    id: 'tokyo',
    label: 'Tokyo, Japan',
    originCode: 'JFK',
    originLabel: 'New York',
    destCode: 'TYO',
    destLabel: 'Tokyo',
    title: 'Lantern Nights & East Tokyo Espresso Walk',
    dateDisplay: 'APR 12 – APR 16',
    duration: '5 Days',
    cabinLabel: 'Boutique',
    viralHook: 'Stop spending 14 hours in spreadsheets before Tokyo.',
    socialProofQuote: 'Every coffee bar and shrine was within a 10-minute walk. Zero transit stress.',
    anchorSpots: [
      { name: 'Senso-ji Dawn Gate', subtitle: 'Asakusa · 10-min walkable zone' },
      { name: 'Kiyosumi Roastery Lane', subtitle: 'East Tokyo · Third-wave espresso' },
      { name: 'Yanaka Ginza Sunset Steps', subtitle: 'Old Tokyo · Golden hour stroll' },
    ],
  },
  {
    id: 'paris',
    label: 'Paris, France',
    originCode: 'LAX',
    originLabel: 'Los Angeles',
    destCode: 'CDG',
    destLabel: 'Paris',
    title: 'Left Bank Terracotta Bistros & Seine Golden Hour',
    dateDisplay: 'MAY 04 – MAY 08',
    duration: '4 Days',
    cabinLabel: 'Editorial',
    viralHook: 'The Paris route locals actually walk at sunset.',
    socialProofQuote: 'Built our whole Left Bank boarding pass in 30 seconds on whisk.travel.',
    anchorSpots: [
      { name: 'Rue Cler Morning Market', subtitle: '7th Arr. · Croissants & florists' },
      { name: 'Musée Rodin Sculpture Garden', subtitle: 'Left Bank · Quiet courtyard' },
      { name: 'Pont Alexandre III Dusk', subtitle: 'Seine · Eiffel sparkle viewpoint' },
    ],
  },
  {
    id: 'amalfi',
    label: 'Amalfi Coast, Italy',
    originCode: 'MIA',
    originLabel: 'Miami',
    destCode: 'NAP',
    destLabel: 'Amalfi Coast',
    title: 'Cliffside Lemons, High-Speed Ferries & Ravello',
    dateDisplay: 'JUN 18 – JUN 22',
    duration: '5 Days',
    cabinLabel: 'Luxury',
    viralHook: 'Skip Amalfi traffic with this ferry-first boarding pass.',
    socialProofQuote: 'Replaced bus gridlock with 20-minute coastal ferries and hidden lemon terraces.',
    anchorSpots: [
      { name: 'Positano 9 AM Harbor Swim', subtitle: 'Spiaggia Grande · Pre-crowd window' },
      { name: 'Atrani Pedestrian Tunnel', subtitle: 'Amalfi · Whitewashed cliff cove' },
      { name: 'Villa Cimbrone Terrace', subtitle: 'Ravello · Sunset horizon panorama' },
    ],
  },
  {
    id: 'santorini',
    label: 'Santorini, Greece',
    originCode: 'ORD',
    originLabel: 'Chicago',
    destCode: 'JTR',
    destLabel: 'Santorini',
    title: 'Caldera Ridge Trails & Volcanic Coves Beyond Oia',
    dateDisplay: 'SEP 08 – SEP 12',
    duration: '4 Days',
    cabinLabel: 'Bespoke',
    viralHook: 'Santorini sunset views without fighting 500 tourists.',
    socialProofQuote: 'Whisk routed us to Imerovigli and Pyrgos—best caldera dinner of our lives.',
    anchorSpots: [
      { name: 'Fira to Imerovigli Rim Walk', subtitle: 'Caldera · 8 AM shade-free ridge' },
      { name: 'Ammoudi Bay Sea Steps', subtitle: 'Below Oia · Volcanic cove swim' },
      { name: 'Pyrgos Hilltop Bell Towers', subtitle: 'Inland · Quiet Assyrtiko terrace' },
    ],
  },
];

const CHAT_MODEL_OPTIONS: Array<{ id: MarketingChatModel; label: string; note: string }> = [
  { id: 'gemini-4-hydrogen', label: 'Gemini 4 Hydrogen', note: 'General strategy & hooks' },
  { id: 'gemini-4-neon', label: 'Gemini 4 Neon', note: 'Complex launch playbooks' },
  { id: 'gemini-4-carbon', label: 'Gemini 4 Carbon', note: 'Deep positioning & funnels' },
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', note: 'Fast captions & variants' },
];

const QUICK_DIRECTOR_PROMPTS = [
  'Write a 15-second TikTok hook & shot list showing the Whisk Boarding Pass reveal for this destination.',
  'Create a 5-slide Instagram Carousel outline pairing real social proof with walkable map stops.',
  'Give me 5 viral Reel opening lines under 8 words that drive clicks to whisk.travel.',
  'Draft a creator UGC brief asking travel TikTokers to share their Whisk Boarding Pass.',
];

function deriveIataCode(name: string, fallback = 'DST'): string {
  const lower = name.toLowerCase();
  const known: Record<string, string> = {
    tokyo: 'TYO',
    kyoto: 'KIX',
    paris: 'CDG',
    london: 'LHR',
    'new york': 'JFK',
    rome: 'FCO',
    amalfi: 'NAP',
    positano: 'NAP',
    santorini: 'JTR',
    marrakech: 'RAK',
    barcelona: 'BCN',
    lisbon: 'LIS',
    seoul: 'ICN',
    bali: 'DPS',
    zermatt: 'ZRH',
    swiss: 'ZRH',
    miami: 'MIA',
    los: 'LAX',
  };
  for (const [k, code] of Object.entries(known)) {
    if (lower.includes(k)) return code;
  }
  const letters = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
  return (letters.slice(0, 3) || fallback).padEnd(3, 'X');
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read uploaded file.'));
    reader.readAsDataURL(file);
  });
}

function imageUrlToDataUrl(url: string): Promise<string> {
  if (url.startsWith('data:')) return Promise.resolve(url);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const maxDim = 1600;
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
      const w = Math.max(1, Math.round((img.naturalWidth || 1080) * scale));
      const h = Math.max(1, Math.round((img.naturalHeight || 1080) * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Unable to initialize canvas for image conversion.'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => reject(new Error('Could not convert Polaroid photo for animation.'));
    img.src = url;
  });
}

function pickDestinationPolaroidNames(destination: string, count = 3): string[] {
  const query = destination.toLowerCase().trim();
  const primary =
    LANDMARK_POLAROIDS.find(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        query.includes(p.name.split(',')[0].toLowerCase()) ||
        p.region.toLowerCase().includes(query)
    ) || LANDMARK_POLAROIDS[0];

  const picked: string[] = [primary.name];
  for (const simName of primary.similarTo) {
    if (picked.length >= count) break;
    if (LANDMARK_POLAROIDS.some((p) => p.name === simName) && !picked.includes(simName)) {
      picked.push(simName);
    }
  }
  for (const p of LANDMARK_POLAROIDS) {
    if (picked.length >= count) break;
    if (!picked.includes(p.name)) picked.push(p.name);
  }
  return picked;
}

export const AdminMarketingStudio: React.FC<AdminMarketingStudioProps> = ({
  itineraries,
  totalUsers,
  totalItineraries,
  publishedGuidesCount,
}) => {
  const [activeTab, setActiveTab] = React.useState<StudioTab>('social-pass');
  const [selectedSourceId, setSelectedSourceId] = React.useState<string>('preset:tokyo');
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Live social-proof metric grounded in actual Firestore counts
  const defaultProofMetric = React.useMemo(() => {
    const trips = Math.max(totalItineraries, 1);
    const travelers = Math.max(totalUsers, 1);
    return `${trips} curated trips · ${travelers} travelers · ${publishedGuidesCount} local guides`;
  }, [totalUsers, totalItineraries, publishedGuidesCount]);

  // Shared Whisk Boarding Pass + Social Proof spec (flows across 2D Card, 3D Stage, Image & Video Studios)
  const [spec, setSpec] = React.useState<MarketingBoardingPassSpec>(() => ({
    originCode: PRESET_CAMPAIGNS[0].originCode,
    originLabel: PRESET_CAMPAIGNS[0].originLabel,
    destCode: PRESET_CAMPAIGNS[0].destCode,
    destLabel: PRESET_CAMPAIGNS[0].destLabel,
    title: PRESET_CAMPAIGNS[0].title,
    dateDisplay: PRESET_CAMPAIGNS[0].dateDisplay,
    duration: PRESET_CAMPAIGNS[0].duration,
    cabinLabel: PRESET_CAMPAIGNS[0].cabinLabel,
    passCode: 'WK 408',
    viralHook: PRESET_CAMPAIGNS[0].viralHook,
    socialProofMetric: defaultProofMetric,
    socialProofQuote: PRESET_CAMPAIGNS[0].socialProofQuote,
    socialProofAuthor: '@whisk.travel',
    anchorSpots: PRESET_CAMPAIGNS[0].anchorSpots,
    themeId: 'ivory',
    customBackdropDataUrl: null,
  }));

  React.useEffect(() => {
    setSpec((prev) => ({ ...prev, socialProofMetric: defaultProofMetric }));
  }, [defaultProofMetric]);

  // 9:16 Boarding Pass + Social Proof rendered preview URL
  const [passPreviewUrl, setPassPreviewUrl] = React.useState<string | null>(null);
  const [renderingPass, setRenderingPass] = React.useState(false);

  // Logo export busy state
  const [exportingLogo, setExportingLogo] = React.useState<string | null>(null);

  // Image Studio (gemini-nano-banana-2.1) state
  const [imageMode, setImageMode] = React.useState<'create' | 'edit'>('create');
  const [imagePrompt, setImagePrompt] = React.useState(
    'Editorial 35mm travel photography of Tokyo Asakusa lanterns at warm golden hour, shallow depth of field, atmospheric sunset sky, crisp architectural detail, vertical Instagram Reel cover composition'
  );
  const [imageAspect, setImageAspect] = React.useState<MarketingImageAspect>('9:16');
  const [imageSize, setImageSize] = React.useState<MarketingImageSize>('1K');
  const [imageSourceUrl, setImageSourceUrl] = React.useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = React.useState<string | null>(null);
  const [generatedImageNote, setGeneratedImageNote] = React.useState<string>('');
  const [generatingImage, setGeneratingImage] = React.useState(false);

  // Video Studio (gemini-omni-1.2-flash) & Auto-Rotating Luxury Reel Sequencer state
  const [reelFormatId, setReelFormatId] = React.useState<ReelContentFormatId>('soundscape-pass');
  const [autoRotateFormat, setAutoRotateFormat] = React.useState<boolean>(true);
  const [autoRotateSource, setAutoRotateSource] = React.useState<boolean>(false);
  const [autoAttachBoardingPassOutro, setAutoAttachBoardingPassOutro] = React.useState<boolean>(true);
  const [showEditorialLowerThird, setShowEditorialLowerThird] = React.useState<boolean>(true);
  const [videoMode, setVideoMode] = React.useState<'animate' | 'text' | 'polaroids'>('text');
  const [videoAspect, setVideoAspect] = React.useState<MarketingVideoAspect>('9:16');
  const [videoDuration, setVideoDuration] = React.useState<MarketingVideoDuration>('8s');
  const [videoResolution, setVideoResolution] = React.useState<MarketingVideoResolution>('1080p');
  const [videoPrompt, setVideoPrompt] = React.useState<string>('');
  const [reelPromptEditedManually, setReelPromptEditedManually] = React.useState<boolean>(false);
  const [videoSourceImageUrl, setVideoSourceImageUrl] = React.useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = React.useState<string | null>(null);
  const [rawFootageUrl, setRawFootageUrl] = React.useState<string | null>(null);
  const [generatedFileExt, setGeneratedFileExt] = React.useState<'mp4' | 'webm'>('mp4');
  const [videoInteractionId, setVideoInteractionId] = React.useState<string | null>(null);
  const [videoFollowUpPrompt, setVideoFollowUpPrompt] = React.useState('');
  const [generatingVideo, setGeneratingVideo] = React.useState(false);
  const [videoProgressLabel, setVideoProgressLabel] = React.useState<string>('');
  const [reelLibrary, setReelLibrary] = React.useState<GeneratedReelItem[]>([]);

  // Whisk Polaroid Reels Builder state
  const [selectedPolaroidNames, setSelectedPolaroidNames] = React.useState<string[]>(() =>
    pickDestinationPolaroidNames(PRESET_CAMPAIGNS[0].destLabel, 3)
  );
  const [polaroidBackdrop, setPolaroidBackdrop] = React.useState<'espresso' | 'linen'>('espresso');
  const [useLatestSoundscapeOnPolaroids, setUseLatestSoundscapeOnPolaroids] =
    React.useState<boolean>(true);

  const selectedPolaroids = React.useMemo(() => {
    return selectedPolaroidNames
      .map((name) => LANDMARK_POLAROIDS.find((p) => p.name === name))
      .filter((p): p is PolaroidLandmark => Boolean(p));
  }, [selectedPolaroidNames]);

  // Live auto-built single-take luxury cinema prompt + soundscape + caption synced to active verified spots & format
  const autoReelBundle = React.useMemo(
    () => buildAutoReelPrompts(spec, reelFormatId, videoAspect, videoDuration),
    [spec, reelFormatId, videoAspect, videoDuration]
  );

  React.useEffect(() => {
    if (reelPromptEditedManually) return;
    setVideoPrompt(autoReelBundle.cinematographyPrompt);
  }, [autoReelBundle, reelPromptEditedManually]);

  React.useEffect(() => {
    if (reelFormatId === 'polaroid-alive' && !videoSourceImageUrl) {
      const matchedName = pickDestinationPolaroidNames(spec.destLabel, 1)[0];
      const matched = LANDMARK_POLAROIDS.find((p) => p.name === matchedName);
      if (matched) {
        imageUrlToDataUrl(matched.url)
          .then((dataUrl) => setVideoSourceImageUrl(dataUrl))
          .catch(() => {
            setVideoSourceImageUrl(matched.url);
          });
      }
    }
  }, [reelFormatId, spec.destLabel, videoSourceImageUrl]);

  // Trend & Maps Grounding state (gemini-4-hydrogen)
  const [researchPlatform, setResearchPlatform] = React.useState<MarketingPlatform>('instagram-reel');
  const [researchGoal, setResearchGoal] = React.useState(
    'Promote Whisk Boarding Pass social proof and walkable 10-minute neighborhood routes on @whisk.travel'
  );
  const [trendBrief, setTrendBrief] = React.useState<MarketingTrendBrief | null>(null);
  const [researchingTrends, setResearchingTrends] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Creative Director Chatbot state
  const [chatModel, setChatModel] = React.useState<MarketingChatModel>('gemini-4-hydrogen');
  const [chatUseSearch, setChatUseSearch] = React.useState(true);
  const [chatInput, setChatInput] = React.useState('');
  const [chatSending, setChatSending] = React.useState(false);
  const [chatTurns, setChatTurns] = React.useState<MarketingChatTurn[]>([
    {
      role: 'model',
      model: 'gemini-4-hydrogen',
      text: 'Ready to build @whisk.travel campaigns. Ask for a TikTok hook, a 15-second Boarding Pass reveal script, an Instagram Carousel outline, or creator UGC angles for the selected destination.',
    },
  ]);
  const chatScrollRef = React.useRef<HTMLDivElement | null>(null);

  const flashNotice = React.useCallback((msg: string) => {
    setNotice(msg);
    window.setTimeout(() => {
      setNotice((prev) => (prev === msg ? null : prev));
    }, 4200);
  }, []);

  const copyText = React.useCallback((text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(key);
    window.setTimeout(() => setCopiedId((prev) => (prev === key ? null : prev)), 2000);
  }, []);

  // Re-render live 9:16 Boarding Pass + Social Proof preview whenever spec changes
  React.useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setRenderingPass(true);
      try {
        const url = await renderMarketingSocialProofPng(spec);
        if (active) setPassPreviewUrl(url);
      } catch (err) {
        console.warn('Preview render warning:', err);
      } finally {
        if (active) setRenderingPass(false);
      }
    }, 180);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [spec]);

  React.useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatTurns]);

  const allCampaignSourceIds = React.useMemo(() => {
    const presetIds = PRESET_CAMPAIGNS.map((p) => `preset:${p.id}`);
    const tripIds = itineraries.slice(0, 20).map((t) => t.id);
    return [...presetIds, ...tripIds];
  }, [itineraries]);

  const applyReelFormat = React.useCallback(
    (nextFormatId: ReelContentFormatId) => {
      const fmt =
        REEL_CONTENT_FORMATS.find((f) => f.id === nextFormatId) || REEL_CONTENT_FORMATS[0];
      setReelFormatId(fmt.id);
      setVideoMode(fmt.recommendedMode);
      setVideoDuration(fmt.recommendedDuration);
      setReelPromptEditedManually(false);
      if (fmt.id === 'polaroid-alive') {
        const matchedName = pickDestinationPolaroidNames(spec.destLabel, 1)[0];
        const matched = LANDMARK_POLAROIDS.find((p) => p.name === matchedName);
        if (matched) {
          imageUrlToDataUrl(matched.url)
            .then((dataUrl) => setVideoSourceImageUrl(dataUrl))
            .catch(() => setVideoSourceImageUrl(matched.url));
        }
      } else if (fmt.recommendedMode === 'animate' && passPreviewUrl) {
        setVideoSourceImageUrl(passPreviewUrl);
      }
    },
    [passPreviewUrl, spec.destLabel]
  );

  // Apply either a real Firestore itinerary or a preset campaign
  const handleSelectCampaignSource = (value: string) => {
    setSelectedSourceId(value);
    setReelPromptEditedManually(false);
    if (value.startsWith('preset:')) {
      const preset = PRESET_CAMPAIGNS.find((p) => `preset:${p.id}` === value);
      if (!preset) return;
      setSpec((prev) => ({
        ...prev,
        originCode: preset.originCode,
        originLabel: preset.originLabel,
        destCode: preset.destCode,
        destLabel: preset.destLabel,
        title: preset.title,
        dateDisplay: preset.dateDisplay,
        duration: preset.duration,
        cabinLabel: preset.cabinLabel,
        viralHook: preset.viralHook,
        socialProofQuote: preset.socialProofQuote,
        anchorSpots: preset.anchorSpots,
      }));
      setSelectedPolaroidNames(pickDestinationPolaroidNames(preset.destLabel, 3));
      setImagePrompt(
        `Editorial 35mm golden hour photography of ${preset.label}, sunlit local architecture, atmospheric depth, luxury travel magazine aesthetic, vertical 9:16 composition`
      );
      return;
    }

    const trip = itineraries.find((t) => t.id === value);
    if (!trip) return;
    const originMatch = trip.departureAirport?.match(/\b([A-Z]{3})\b/);
    const originCode = originMatch ? originMatch[1] : 'WHK';
    const destCity = trip.destination.split(',')[0]?.trim() || trip.destination;
    const destCode = deriveIataCode(trip.destination, 'DST');

    const extractedSpots: Array<{ name: string; subtitle: string }> = [];
    for (const day of trip.days || []) {
      const firstAct = day.activities?.[0];
      if (firstAct) {
        extractedSpots.push({
          name: firstAct.location,
          subtitle: `Day ${day.dayNumber} · ${firstAct.time || 'Walkable anchor stop'}`,
        });
      }
      if (extractedSpots.length >= 3) break;
    }

    setSpec((prev) => ({
      ...prev,
      originCode,
      originLabel: trip.departureAirport?.split('(')[0]?.trim().slice(0, 18) || 'Origin Hub',
      destCode,
      destLabel: destCity,
      title: trip.title || `${destCity} Walkable Itinerary`,
      dateDisplay:
        trip.startDate && trip.endDate
          ? `${trip.startDate.slice(5)} – ${trip.endDate.slice(5)}`
          : (trip.duration || `${trip.days?.length || 3} Days`).toUpperCase(),
      duration: trip.duration || `${trip.days?.length || 3} Days`,
      cabinLabel: trip.budget || 'Bespoke',
      viralHook: `Real traveler route: ${destCity} mapped in walkable zones.`,
      socialProofQuote: `Generated this ${trip.days?.length || 3}-day ${destCity} itinerary in seconds on whisk.travel.`,
      anchorSpots:
        extractedSpots.length > 0
          ? extractedSpots
          : [{ name: `${destCity} Old Town`, subtitle: 'Day 1 · 10-min walkable zone' }],
    }));
    setSelectedPolaroidNames(pickDestinationPolaroidNames(destCity, 3));
    setImagePrompt(
      `Editorial 35mm golden hour travel photography of ${trip.destination}, authentic local neighborhood atmosphere, cinematic sunlight, vertical 9:16 frame`
    );
    flashNotice(`Loaded real Firestore itinerary: ${trip.title}`);
  };

  // Download Brand Logo Asset
  const handleExportLogo = async (
    variant: 'svg' | 'png-transparent' | 'png-avatar-light' | 'png-avatar-dark' | 'png-wordmark-light' | 'png-wordmark-dark'
  ) => {
    setExportingLogo(variant);
    setError(null);
    try {
      await exportWhiskLogoAsset(variant);
      flashNotice(`Downloaded Whisk logo (${variant}).`);
    } catch (err: any) {
      setError(err?.message || 'Unable to export Whisk logo.');
    } finally {
      setExportingLogo(null);
    }
  };

  // Download 1080x1920 Boarding Pass + Social Proof PNG
  const handleDownloadSocialPassPng = async () => {
    setError(null);
    try {
      const dataUrl = passPreviewUrl || (await renderMarketingSocialProofPng(spec));
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `whisk-social-boarding-pass-${spec.destCode.toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      flashNotice('Downloaded 1080×1920 Whisk Boarding Pass Social Proof PNG.');
    } catch (err: any) {
      setError(err?.message || 'Could not export Boarding Pass PNG.');
    }
  };

  // Handoff helpers between tabs
  const sendToImageEditor = (dataUrl: string, suggestedEdit?: string) => {
    setImageMode('edit');
    setImageSourceUrl(dataUrl);
    if (suggestedEdit) setImagePrompt(suggestedEdit);
    setActiveTab('image-studio');
    flashNotice('Loaded frame into Nano Banana 2.1 Image Editor.');
  };

  const sendToVideoAnimator = (dataUrl: string, suggestedMotion?: string) => {
    setVideoMode('animate');
    setVideoSourceImageUrl(dataUrl);
    setVideoInteractionId(null);
    if (suggestedMotion) setVideoPrompt(suggestedMotion);
    setActiveTab('video-studio');
    flashNotice('Loaded frame into Omni 1.2 Flash Video Animator (9:16).');
  };

  // Run Nano Banana 2.1 Create / Edit Image
  const handleRunImageStudio = async () => {
    if (!imagePrompt.trim()) {
      setError('Enter a prompt to generate or edit an image.');
      return;
    }
    if (imageMode === 'edit' && !imageSourceUrl) {
      setError('Upload a photo or send a Boarding Pass / 3D frame before running Edit mode.');
      return;
    }
    setGeneratingImage(true);
    setError(null);
    try {
      const result = await generateOrEditMarketingImage({
        prompt: imagePrompt.trim(),
        aspectRatio: imageAspect,
        imageSize,
        sourceImageDataUrl: imageMode === 'edit' ? imageSourceUrl || undefined : undefined,
      });
      setGeneratedImageUrl(result.imageDataUrl);
      setGeneratedImageNote(result.text || '');
      flashNotice(`Generated marketing image with ${result.model}.`);
    } catch (err: any) {
      setError(err?.message || 'Image generation failed.');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleAdvanceReelRotation = React.useCallback(
    (silent = false) => {
      const currentIdx = REEL_CONTENT_FORMATS.findIndex((f) => f.id === reelFormatId);
      const nextFormat =
        REEL_CONTENT_FORMATS[(currentIdx + 1) % REEL_CONTENT_FORMATS.length];
      applyReelFormat(nextFormat.id);

      let rotatedDestNote = '';
      if (autoRotateSource && allCampaignSourceIds.length > 1) {
        const srcIdx = allCampaignSourceIds.indexOf(selectedSourceId);
        const nextSrcId =
          allCampaignSourceIds[(srcIdx + 1) % allCampaignSourceIds.length];
        handleSelectCampaignSource(nextSrcId);
        rotatedDestNote = ' + next destination';
      }

      if (!silent) {
        flashNotice(`Rotated to ${nextFormat.title}${rotatedDestNote}.`);
      }
    },
    [
      reelFormatId,
      applyReelFormat,
      autoRotateSource,
      allCampaignSourceIds,
      selectedSourceId,
      flashNotice,
    ]
  );

  // Toggle a Whisk Polaroid in/out of the Animated Polaroid Reel stack (1 to 5 slides)
  const handleTogglePolaroidSelection = (polaroidName: string) => {
    setSelectedPolaroidNames((prev) => {
      if (prev.includes(polaroidName)) {
        if (prev.length <= 1) return prev;
        return prev.filter((n) => n !== polaroidName);
      }
      if (prev.length >= 5) {
        return [...prev.slice(1), polaroidName];
      }
      return [...prev, polaroidName];
    });
  };

  // Send any bundled Whisk Polaroid straight into AI Living Polaroid mode (with stereo destination sound)
  const handleAnimateSinglePolaroidWithAI = async (polaroid: PolaroidLandmark) => {
    setError(null);
    try {
      const dataUrl = await imageUrlToDataUrl(polaroid.url);
      setReelFormatId('polaroid-alive');
      setVideoMode('animate');
      setVideoDuration('6s');
      setVideoSourceImageUrl(dataUrl);
      setReelPromptEditedManually(false);
      setVideoInteractionId(null);
      flashNotice(`Loaded ${polaroid.name} Polaroid into Living Polaroid AI Animator (with trip sound).`);
    } catch (err: any) {
      setError(err?.message || 'Could not load Polaroid photo into animator.');
    }
  };

  // Render Instant Animated Whisk Polaroid Stack -> Crisp Boarding Pass Reel (with optional real trip sound bed)
  const handleRenderPolaroidReel = async () => {
    const slides =
      selectedPolaroids.length > 0
        ? selectedPolaroids
        : pickDestinationPolaroidNames(spec.destLabel, 3)
            .map((name) => LANDMARK_POLAROIDS.find((p) => p.name === name))
            .filter((p): p is PolaroidLandmark => Boolean(p));

    if (slides.length === 0) {
      setError('Select at least one Whisk Polaroid to animate.');
      return;
    }

    setGeneratingVideo(true);
    setError(null);
    setVideoProgressLabel('Preparing animated Whisk Polaroid stack...');

    try {
      const freshPassPng = passPreviewUrl || (await renderMarketingSocialProofPng(spec));
      const finished = await renderAnimatedPolaroidReel({
        polaroids: slides.map((p) => ({
          url: p.url,
          title: p.name,
          subtitle: p.region,
        })),
        boardingPassDataUrl: freshPassPng,
        aspectRatio: videoAspect,
        destinationLabel: spec.destLabel,
        hookHeadline: spec.viralHook,
        audioBedVideoUrl: useLatestSoundscapeOnPolaroids ? rawFootageUrl : null,
        backdropStyle: polaroidBackdrop,
        onProgress: setVideoProgressLabel,
      });

      setGeneratedVideoUrl(finished.videoBlobUrl);
      setGeneratedFileExt(finished.fileExtension);

      const savedItem: GeneratedReelItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        formatId: 'polaroid-alive',
        formatTitle: `Polaroid Stack (${slides.length} prints) → Boarding Pass`,
        destination: spec.destLabel,
        destCode: spec.destCode,
        aspectRatio: videoAspect,
        duration: `${finished.totalDurationSec}s`,
        videoUrl: finished.videoBlobUrl,
        rawFootageUrl: rawFootageUrl || finished.videoBlobUrl,
        fileExtension: finished.fileExtension,
        interactionId: null,
        caption: `${spec.viralHook}\n\n${slides.map((s) => `• ${s.name} — ${s.region}`).join('\n')}\n\nYour walkable route + shareable Boarding Pass at whisk.travel\n\n#whisktravel #polaroidtravel #luxurytravel #${spec.destLabel.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        hasStudioOutro: true,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setReelLibrary((prev) => [savedItem, ...prev.slice(0, 11)]);
      flashNotice(
        `Rendered animated ${slides.length}-Polaroid Reel (${finished.totalDurationSec}s)${
          useLatestSoundscapeOnPolaroids && rawFootageUrl ? ' with live trip soundscape' : ''
        }.`
      );
    } catch (err: any) {
      setError(err?.message || 'Could not render animated Polaroid Reel.');
    } finally {
      setGeneratingVideo(false);
      setVideoProgressLabel('');
    }
  };

  // Re-composite existing clean cinema footage with updated Boarding Pass copy/theme (zero AI re-render cost)
  const handleRecompositeOutro = async () => {
    if (!rawFootageUrl) return;
    setGeneratingVideo(true);
    setError(null);
    try {
      if (autoReelBundle.format.compositeMode === 'soundscape-pass') {
        const finished = await compositeSoundscapeBoardingPassReel({
          ambientVideoUrl: rawFootageUrl,
          spec,
          aspectRatio: videoAspect,
          soundscapeLabel: autoReelBundle.soundscapeSummary,
          onProgress: setVideoProgressLabel,
        });
        setGeneratedVideoUrl(finished.videoBlobUrl);
        setGeneratedFileExt(finished.fileExtension);
        flashNotice(
          `Re-composited Boarding Pass + Live Trip Soundscape (${finished.totalDurationSec}s).`
        );
      } else {
        const freshPassPng = passPreviewUrl || (await renderMarketingSocialProofPng(spec));
        const finished = await compositeLuxuryBoardingPassReel({
          footageUrl: rawFootageUrl,
          boardingPassDataUrl: freshPassPng,
          aspectRatio: videoAspect,
          destinationLabel: spec.destLabel,
          spotTitle: autoReelBundle.featuredSpot.name,
          spotSubtitle: autoReelBundle.featuredSpot.subtitle,
          showEditorialCaption: showEditorialLowerThird,
          onProgress: setVideoProgressLabel,
        });
        setGeneratedVideoUrl(finished.videoBlobUrl);
        setGeneratedFileExt(finished.fileExtension);
        flashNotice(`Re-composited luxury Boarding Pass finale (${finished.totalDurationSec}s).`);
      }
    } catch (err: any) {
      setError(err?.message || 'Could not composite Boarding Pass end-card.');
    } finally {
      setGeneratingVideo(false);
      setVideoProgressLabel('');
    }
  };

  // Run Omni 1.2 Flash luxury footage + stereo destination soundscape + crisp Boarding Pass Studio Finisher
  const handleRunVideoStudio = async (isFollowUp = false) => {
    const activePrompt = isFollowUp ? videoFollowUpPrompt.trim() : videoPrompt.trim();
    if (!activePrompt) {
      setError('Enter a cinematography prompt first.');
      return;
    }

    let effectiveSourceImage =
      videoSourceImageUrl || (videoMode === 'animate' ? passPreviewUrl : null);

    if (!isFollowUp && videoMode === 'animate' && !effectiveSourceImage) {
      setError('Choose a Whisk Polaroid, Boarding Pass, or upload a photo to animate.');
      return;
    }

    const compositeMode = autoReelBundle.format.compositeMode;
    const isSoundscapePass = compositeMode === 'soundscape-pass' && videoMode === 'text';
    const attachStudioOutro =
      !isSoundscapePass && autoAttachBoardingPassOutro && compositeMode === 'cinema-outro';

    setGeneratingVideo(true);
    setError(null);
    setVideoProgressLabel(
      isFollowUp
        ? 'Refining footage & trip soundscape with Omni 1.2 Flash...'
        : isSoundscapePass
        ? `Capturing ${spec.destLabel} bokeh lights + live trip soundscape (${videoDuration})...`
        : attachStudioOutro
        ? `Filming clean ${videoResolution} cinema shot of ${autoReelBundle.featuredSpot.name} + ambient audio...`
        : `Rendering ${videoResolution} clip with Omni 1.2 Flash...`
    );

    try {
      if (!isFollowUp && videoMode === 'animate' && effectiveSourceImage) {
        effectiveSourceImage = await imageUrlToDataUrl(effectiveSourceImage);
      }

      const rawResult = await generateMarketingVideo({
        prompt: activePrompt,
        aspectRatio: videoAspect,
        duration: videoDuration,
        resolution: videoResolution,
        sourceImageDataUrl:
          !isFollowUp && videoMode === 'animate' ? effectiveSourceImage || undefined : undefined,
        previousInteractionId: isFollowUp ? videoInteractionId || undefined : undefined,
      });

      setRawFootageUrl(rawResult.videoDataUrl);
      setVideoInteractionId(rawResult.interactionId);
      if (isFollowUp) setVideoFollowUpPrompt('');

      let displayVideoUrl = rawResult.videoDataUrl;
      let displayExt: 'mp4' | 'webm' = 'mp4';
      let displayDuration: string = rawResult.duration;
      let hasOutro = false;

      if (isSoundscapePass) {
        const finished = await compositeSoundscapeBoardingPassReel({
          ambientVideoUrl: rawResult.videoDataUrl,
          spec,
          aspectRatio: videoAspect,
          soundscapeLabel: autoReelBundle.soundscapeSummary,
          onProgress: setVideoProgressLabel,
        });
        displayVideoUrl = finished.videoBlobUrl;
        displayExt = finished.fileExtension;
        displayDuration = `${finished.totalDurationSec}s`;
        hasOutro = true;
      } else if (attachStudioOutro) {
        const freshPassPng = passPreviewUrl || (await renderMarketingSocialProofPng(spec));
        const finished = await compositeLuxuryBoardingPassReel({
          footageUrl: rawResult.videoDataUrl,
          boardingPassDataUrl: freshPassPng,
          aspectRatio: videoAspect,
          destinationLabel: spec.destLabel,
          spotTitle: autoReelBundle.featuredSpot.name,
          spotSubtitle: autoReelBundle.featuredSpot.subtitle,
          showEditorialCaption: showEditorialLowerThird,
          onProgress: setVideoProgressLabel,
        });
        displayVideoUrl = finished.videoBlobUrl;
        displayExt = finished.fileExtension;
        displayDuration = `${finished.totalDurationSec}s`;
        hasOutro = true;
      }

      setGeneratedVideoUrl(displayVideoUrl);
      setGeneratedFileExt(displayExt);

      const savedItem: GeneratedReelItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        formatId: reelFormatId,
        formatTitle: autoReelBundle.format.title,
        destination: spec.destLabel,
        destCode: spec.destCode,
        aspectRatio: rawResult.aspectRatio,
        duration: displayDuration,
        videoUrl: displayVideoUrl,
        rawFootageUrl: rawResult.videoDataUrl,
        fileExtension: displayExt,
        interactionId: rawResult.interactionId,
        caption: autoReelBundle.suggestedCaption,
        hasStudioOutro: hasOutro,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setReelLibrary((prev) => [savedItem, ...prev.slice(0, 11)]);

      if (!isFollowUp && autoRotateFormat) {
        handleAdvanceReelRotation(true);
        flashNotice(
          isSoundscapePass
            ? `Finished Boarding Pass + Live Trip Soundscape (${displayDuration}) & rotated to next pillar.`
            : `Luxury Reel finished (${displayDuration}) with crisp Boarding Pass outro & rotated to next pillar.`
        );
      } else {
        flashNotice(
          isSoundscapePass
            ? `Finished Boarding Pass + Live Trip Soundscape (${displayDuration}).`
            : `Finished ${rawResult.aspectRatio} (${displayDuration}) luxury Reel.`
        );
      }
    } catch (err: any) {
      setError(err?.message || 'Video generation failed.');
    } finally {
      setGeneratingVideo(false);
      setVideoProgressLabel('');
    }
  };

  // Run Google Search + Google Maps Trend & Spot Research
  const handleResearchTrendsAndMaps = async (autoApplySpots = false) => {
    setResearchingTrends(true);
    setError(null);
    try {
      const brief = await fetchMarketingTrendsAndSpots({
        destination: spec.destLabel || spec.title,
        platform: researchPlatform,
        campaignGoal: researchGoal,
      });
      setTrendBrief(brief);
      if (autoApplySpots) {
        setSpec((prev) => ({
          ...prev,
          viralHook: brief.viralHooks?.[0] || prev.viralHook,
          title: brief.boardingPassHeadline || prev.title,
          socialProofQuote: brief.socialProofQuote || prev.socialProofQuote,
          anchorSpots:
            brief.verifiedSpots?.length > 0
              ? brief.verifiedSpots.slice(0, 3).map((s) => ({
                  name: s.name,
                  subtitle: `${s.neighborhood} · ${s.whyItConverts}`,
                }))
              : prev.anchorSpots,
        }));
        setReelPromptEditedManually(false);
        flashNotice(
          `Loaded ${brief.verifiedSpots?.length || 0} Google Maps verified spots for ${brief.destination} & rebuilt your Reel prompt.`
        );
      } else {
        flashNotice(`Grounded campaign brief loaded for ${brief.destination} via Google Search & Maps.`);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to research live trends & spots.');
    } finally {
      setResearchingTrends(false);
    }
  };

  const handleApplyBriefToPass = () => {
    if (!trendBrief) return;
    setSpec((prev) => ({
      ...prev,
      viralHook: trendBrief.viralHooks?.[0] || prev.viralHook,
      title: trendBrief.boardingPassHeadline || prev.title,
      socialProofQuote: trendBrief.socialProofQuote || prev.socialProofQuote,
      anchorSpots:
        trendBrief.verifiedSpots?.length > 0
          ? trendBrief.verifiedSpots.slice(0, 3).map((s) => ({
              name: s.name,
              subtitle: `${s.neighborhood} · ${s.whyItConverts}`,
            }))
          : prev.anchorSpots,
    }));
    if (trendBrief.imagePrompt) setImagePrompt(trendBrief.imagePrompt);
    setReelPromptEditedManually(false);
    flashNotice('Applied verified Google Maps spots, hook, and rebuilt the Spots → Boarding Pass Reel prompt.');
  };

  // Send message to Multi-Turn Gemini Creative Director Chat
  const handleSendChat = async (overrideMessage?: string) => {
    const text = (overrideMessage ?? chatInput).trim();
    if (!text || chatSending) return;

    const historyForApi = chatTurns.map((t) => ({ role: t.role, text: t.text }));
    setChatTurns((prev) => [...prev, { role: 'user', text }]);
    if (!overrideMessage) setChatInput('');
    setChatSending(true);
    setError(null);

    try {
      const contextSummary = `Destination: ${spec.destLabel} (${spec.originCode} -> ${spec.destCode}) | Boarding Pass Title: ${spec.title} | Current Hook: ${spec.viralHook} | Real Platform Metrics: ${spec.socialProofMetric} | Verified Anchor Spots: ${spec.anchorSpots.map((s) => s.name).join(', ')}`;
      const reply = await sendMarketingDirectorChat({
        message: text,
        model: chatModel,
        useSearch: chatUseSearch,
        contextSummary,
        history: historyForApi,
      });
      setChatTurns((prev) => [
        ...prev,
        {
          role: 'model',
          text: reply.text,
          model: reply.model,
          sources: reply.sources,
        },
      ]);
    } catch (err: any) {
      setError(err?.message || 'Creative Director chat failed.');
    } finally {
      setChatSending(false);
    }
  };

  const tabs: Array<{ id: StudioTab; label: string; icon: React.ComponentType<any> }> = [
    { id: 'social-pass', label: 'Boarding Pass Proof', icon: Ticket },
    { id: 'stage-3d', label: '3D Stage', icon: Box },
    { id: 'image-studio', label: 'Image Studio', icon: ImageIcon },
    { id: 'video-studio', label: 'Video Reels', icon: Film },
    { id: 'director', label: 'Trends & Director', icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      {/* Feedback Banners */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 flex items-center justify-between gap-3 text-xs font-medium text-rose-700"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="p-1 hover:bg-rose-100 rounded-md cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center justify-between gap-3 text-xs font-medium text-emerald-800">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="p-1 hover:bg-emerald-100 rounded-md cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Brand Logo Kit & Quick Export Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <WhiskLogo size={48} className="shrink-0 drop-shadow-xs" />
          <div>
            <h2 className="text-sm font-bold text-[var(--whisk-navy)]">
              Whisk Brand Logo Kit · @whisk.travel
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Download vector SVG or high-resolution PNG logos for Instagram, TikTok, CapCut overlays, and press decks.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'svg', label: 'Vector SVG' },
              { id: 'png-transparent', label: 'Icon PNG (1024px)' },
              { id: 'png-avatar-light', label: 'Avatar (Ivory)' },
              { id: 'png-avatar-dark', label: 'Avatar (Dark)' },
              { id: 'png-wordmark-light', label: 'Wordmark (Light)' },
              { id: 'png-wordmark-dark', label: 'Wordmark (Dark)' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={exportingLogo !== null}
              onClick={() => handleExportLogo(item.id)}
              className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-60"
            >
              {exportingLogo === item.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Campaign Source + Studio Navigation Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-white text-[var(--whisk-navy)] shadow-2xs'
                    : 'text-slate-600 hover:text-[var(--whisk-navy)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <label
            htmlFor="campaign-source-select"
            className="text-xs font-semibold text-slate-500 whitespace-nowrap"
          >
            Trip Source
          </label>
          <select
            id="campaign-source-select"
            value={selectedSourceId}
            onChange={(e) => handleSelectCampaignSource(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-[var(--whisk-navy)] max-w-[260px]"
          >
            <optgroup label="Flagship Presets">
              {PRESET_CAMPAIGNS.map((p) => (
                <option key={p.id} value={`preset:${p.id}`}>
                  {p.label} ({p.originCode} → {p.destCode})
                </option>
              ))}
            </optgroup>
            {itineraries.length > 0 && (
              <optgroup label="Live Firestore Itineraries">
                {itineraries.slice(0, 20).map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.destination} · {trip.title.slice(0, 28)}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      {/* TAB 1: SOCIAL PROOF + WHISK BOARDING PASS COMPOSER (9:16) */}
      {activeTab === 'social-pass' && (
        <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">
          {/* Left: Live 9:16 Rendered Story/TikTok Asset */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center">
            <div className="w-full max-w-[320px] aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 relative flex items-center justify-center">
              {passPreviewUrl ? (
                <img
                  src={passPreviewUrl}
                  alt="Whisk Boarding Pass 9:16 social proof preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Rendering 1080×1920 preview...</span>
                </div>
              )}
              {renderingPass && passPreviewUrl && (
                <div className="absolute bottom-3 right-3 bg-slate-900/85 text-white text-[11px] font-medium px-2.5 py-1 rounded-lg">
                  Updating...
                </div>
              )}
            </div>

            <div className="w-full mt-4 space-y-2">
              <button
                type="button"
                onClick={handleDownloadSocialPassPng}
                className="w-full h-10 px-4 rounded-xl bg-[var(--whisk-navy)] hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download 1080×1920 PNG</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (passPreviewUrl) {
                      sendToVideoAnimator(
                        passPreviewUrl,
                        `Smooth vertical luxury reveal for @whisk.travel: golden sunlight washes across this ${spec.destLabel} Whisk Boarding Pass while subtle parallax motion brings the route card to life for TikTok & Instagram Reels`
                      );
                    }
                  }}
                  disabled={!passPreviewUrl}
                  className="h-9 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-[var(--whisk-navy)] inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Film className="w-3.5 h-3.5 text-[#D94E34]" />
                  <span>Animate Reel</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (passPreviewUrl) {
                      sendToImageEditor(
                        passPreviewUrl,
                        `Place this Whisk Boarding Pass resting naturally on a sunlit marble café table in ${spec.destLabel} beside an espresso cup and sunglasses, 35mm editorial travel lifestyle photography`
                      );
                    }
                  }}
                  disabled={!passPreviewUrl}
                  className="h-9 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-[var(--whisk-navy)] inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Wand2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Style with AI</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Editorial Boarding Pass + Social Proof Controls */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-[var(--whisk-navy)]">
                  Social Proof & Boarding Pass Copy
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Every edit updates both this 9:16 export card and the live Three.js 3D Boarding Pass stage.
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(Object.values(MARKETING_PASS_THEMES)).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSpec((prev) => ({ ...prev, themeId: t.id }))}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      spec.themeId === t.id
                        ? 'bg-white text-[var(--whisk-navy)] shadow-2xs'
                        : 'text-slate-600 hover:text-[var(--whisk-navy)]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-4 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Origin IATA</label>
                <input
                  type="text"
                  maxLength={3}
                  value={spec.originCode}
                  onChange={(e) => setSpec((p) => ({ ...p, originCode: e.target.value.toUpperCase() }))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-sm font-mono font-bold uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Origin City</label>
                <input
                  type="text"
                  value={spec.originLabel}
                  onChange={(e) => setSpec((p) => ({ ...p, originLabel: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dest IATA</label>
                <input
                  type="text"
                  maxLength={3}
                  value={spec.destCode}
                  onChange={(e) => setSpec((p) => ({ ...p, destCode: e.target.value.toUpperCase() }))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-sm font-mono font-bold uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Destination</label>
                <input
                  type="text"
                  value={spec.destLabel}
                  onChange={(e) => setSpec((p) => ({ ...p, destLabel: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Scroll-Stopping Social Hook (Top of 9:16 Card)
              </label>
              <input
                type="text"
                value={spec.viralHook}
                onChange={(e) => setSpec((p) => ({ ...p, viralHook: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-semibold"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Boarding Pass Headline
                </label>
                <input
                  type="text"
                  value={spec.title}
                  onChange={(e) => setSpec((p) => ({ ...p, title: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Verified Social Proof Metric Line
                </label>
                <input
                  type="text"
                  value={spec.socialProofMetric}
                  onChange={(e) => setSpec((p) => ({ ...p, socialProofMetric: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-sm tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Traveler Social Proof Quote
              </label>
              <textarea
                rows={2}
                value={spec.socialProofQuote}
                onChange={(e) => setSpec((p) => ({ ...p, socialProofQuote: e.target.value }))}
                className="w-full p-3 rounded-lg border border-slate-300 text-sm"
              />
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Featured Walkable Anchor Stops (Shown on Ticket)
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTab('director')}
                  className="text-xs font-semibold text-[#D94E34] hover:underline cursor-pointer"
                >
                  Pull verified spots from Google Maps →
                </button>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                {spec.anchorSpots.slice(0, 3).map((spot, idx) => (
                  <div key={idx} className="space-y-1.5 p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                    <input
                      type="text"
                      value={spot.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSpec((prev) => ({
                          ...prev,
                          anchorSpots: prev.anchorSpots.map((s, i) =>
                            i === idx ? { ...s, name: val } : s
                          ),
                        }));
                      }}
                      placeholder={`Stop ${idx + 1} name`}
                      className="w-full h-8 px-2.5 rounded-md border border-slate-300 bg-white text-xs font-semibold"
                    />
                    <input
                      type="text"
                      value={spot.subtitle}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSpec((prev) => ({
                          ...prev,
                          anchorSpots: prev.anchorSpots.map((s, i) =>
                            i === idx ? { ...s, subtitle: val } : s
                          ),
                        }));
                      }}
                      placeholder="Neighborhood · walk note"
                      className="w-full h-8 px-2.5 rounded-md border border-slate-300 bg-white text-xs text-slate-600"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Optional Custom AI Photo Backdrop Behind Boarding Pass */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                {spec.customBackdropDataUrl
                  ? 'Custom AI / uploaded photo backdrop active behind Boarding Pass.'
                  : 'Using clean editorial studio backdrop. Generate a destination backdrop in Image Studio or upload one.'}
              </div>
              <div className="flex items-center gap-2">
                {spec.customBackdropDataUrl && (
                  <button
                    type="button"
                    onClick={() => setSpec((p) => ({ ...p, customBackdropDataUrl: null }))}
                    className="h-8 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Clear Backdrop
                  </button>
                )}
                <label className="h-8 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Backdrop</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const dataUrl = await readFileAsDataUrl(file);
                      setSpec((p) => ({ ...p, customBackdropDataUrl: dataUrl }));
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: THREE.JS 3D BOARDING PASS & GLOBE STAGE */}
      {activeTab === 'stage-3d' && (
        <div className="space-y-3">
          <BoardingPass3DStage
            spec={spec}
            onChangeTheme={(themeId: MarketingPassThemeId) =>
              setSpec((prev) => ({ ...prev, themeId }))
            }
            onSendFrameToImageEditor={(frameUrl) =>
              sendToImageEditor(
                frameUrl,
                `Enhance this 3D Whisk Boarding Pass diorama for ${spec.destLabel} with warm sunset studio volumetric lighting and subtle editorial film grain`
              )
            }
            onSendFrameToVideo={(frameUrl) =>
              sendToVideoAnimator(
                frameUrl,
                `Smooth cinematic dolly orbit around the 3D Whisk Boarding Pass and brass travel globe for ${spec.destLabel}, warm sunlit reflections, luxury travel reel pacing`
              )
            }
          />
          <p className="text-xs text-slate-500">
            Tip: Switch the bottom dock crop to 9:16, record a 6-second WebM turntable clip directly for TikTok/Reels, or click Animate AI to turn any camera angle into an Omni 1.2 Flash video.
          </p>
        </div>
      )}

      {/* TAB 3: IMAGE STUDIO (gemini-nano-banana-2.1 CREATE & EDIT) */}
      {activeTab === 'image-studio' && (
        <div className="grid lg:grid-cols-[1fr_420px] gap-6 items-start">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-[var(--whisk-navy)]">
                  Create & Edit Marketing Visuals · gemini-nano-banana-2.1
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate editorial 9:16 Reels covers, Instagram carousels, or restyle your Whisk Boarding Pass photos.
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setImageMode('create')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                    imageMode === 'create'
                      ? 'bg-white text-[var(--whisk-navy)] shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  Create from Text
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('edit')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                    imageMode === 'edit'
                      ? 'bg-white text-[var(--whisk-navy)] shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  Edit Existing Image
                </button>
              </div>
            </div>

            {imageMode === 'edit' && (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700">Source Image to Edit</span>
                  <div className="flex items-center gap-2">
                    {passPreviewUrl && (
                      <button
                        type="button"
                        onClick={() => setImageSourceUrl(passPreviewUrl)}
                        className="h-8 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
                      >
                        Use Current Boarding Pass
                      </button>
                    )}
                    <label className="h-8 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setImageSourceUrl(await readFileAsDataUrl(file));
                        }}
                      />
                    </label>
                  </div>
                </div>

                {imageSourceUrl ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={imageSourceUrl}
                      alt="Source image for editing"
                      className="w-20 h-28 object-cover rounded-lg border border-slate-200 bg-white"
                    />
                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="font-semibold text-[var(--whisk-navy)]">Source loaded</div>
                      <p>Describe the lighting, setting, or visual changes below.</p>
                      <button
                        type="button"
                        onClick={() => setImageSourceUrl(null)}
                        className="text-rose-600 font-semibold hover:underline cursor-pointer"
                      >
                        Remove source
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Upload a travel photo, or click “Use Current Boarding Pass” to place your Boarding Pass into a lifestyle scene.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {imageMode === 'create' ? 'Visual Prompt' : 'Edit Instruction'}
              </label>
              <textarea
                rows={4}
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe lighting, composition, destination details, and mood..."
                className="w-full p-3.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['9:16', '4:5', '1:1', '16:9'] as MarketingImageAspect[]).map((ar) => (
                    <button
                      key={ar}
                      type="button"
                      onClick={() => setImageAspect(ar)}
                      className={`h-9 rounded-lg border text-xs font-semibold tabular-nums cursor-pointer ${
                        imageAspect === ar
                          ? 'bg-[var(--whisk-navy)] text-white border-[var(--whisk-navy)]'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {ar}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Output Resolution
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['1K', '2K'] as MarketingImageSize[]).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setImageSize(sz)}
                      className={`h-9 rounded-lg border text-xs font-semibold tabular-nums cursor-pointer ${
                        imageSize === sz
                          ? 'bg-[var(--whisk-navy)] text-white border-[var(--whisk-navy)]'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {sz} Sharp
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={generatingImage}
              onClick={handleRunImageStudio}
              className="h-10 px-5 rounded-xl bg-[var(--whisk-navy)] hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {generatingImage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>
                {generatingImage
                  ? 'Generating with Nano Banana 2.1...'
                  : imageMode === 'create'
                  ? 'Generate Marketing Image'
                  : 'Apply Image Edit'}
              </span>
            </button>
          </div>

          {/* Output Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="text-xs font-bold text-[var(--whisk-navy)]">Generated Output</div>

            <div className="w-full min-h-[360px] rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
              {generatedImageUrl ? (
                <img
                  src={generatedImageUrl}
                  alt="Generated Whisk marketing visual"
                  className="w-full max-h-[500px] object-contain"
                />
              ) : (
                <div className="text-center px-6 py-12 text-xs text-slate-400">
                  Your generated 9:16 / 4:5 / 16:9 marketing visual will appear here.
                </div>
              )}
            </div>

            {generatedImageNote && (
              <p className="text-xs text-slate-600 leading-relaxed">{generatedImageNote}</p>
            )}

            {generatedImageUrl && (
              <div className="space-y-2">
                <a
                  href={generatedImageUrl}
                  download={`whisk-marketing-${spec.destCode.toLowerCase()}.png`}
                  className="w-full h-9 px-4 rounded-xl bg-[var(--whisk-navy)] hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PNG</span>
                </a>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSpec((p) => ({ ...p, customBackdropDataUrl: generatedImageUrl }));
                      setActiveTab('social-pass');
                      flashNotice('Applied image as your Boarding Pass backdrop.');
                    }}
                    className="h-9 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Use as Pass Backdrop
                  </button>
                  <button
                    type="button"
                    onClick={() => sendToVideoAnimator(generatedImageUrl)}
                    className="h-9 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Film className="w-3.5 h-3.5 text-[#D94E34]" />
                    <span>Animate Video</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: VIDEO REELS STUDIO (AUTO-ROTATING VERIFIED SPOTS -> BOARDING PASS) */}
      {activeTab === 'video-studio' && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-[1fr_420px] gap-6 items-start">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-[var(--whisk-navy)]">
                    Luxury Reel Studio · Soundscape Pass, Polaroids & Verified Spots
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Produce Boarding Pass + live trip soundscapes, animated Whisk Polaroid Reels, or single-take 35mm spot films.
                  </p>
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setVideoMode('text')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                      videoMode === 'text'
                        ? 'bg-white text-[var(--whisk-navy)] shadow-2xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Pass & Soundscape
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoMode('polaroids')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${
                      videoMode === 'polaroids'
                        ? 'bg-white text-[var(--whisk-navy)] shadow-2xs'
                        : 'text-slate-600'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 text-[#D94E34]" />
                    <span>Polaroid Reels</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoMode('animate')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                      videoMode === 'animate'
                        ? 'bg-white text-[var(--whisk-navy)] shadow-2xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Animate Photo
                  </button>
                </div>
              </div>

              {videoMode === 'polaroids' ? (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/75 space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-[var(--whisk-navy)] flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-[#D94E34]" />
                          <span>Animated Whisk Polaroid Stack → Boarding Pass</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Select 1–5 Whisk Polaroids ({selectedPolaroidNames.length}/5 selected). Each print glides onto an editorial desk with slow Ken Burns motion, then dissolves into your crisp Boarding Pass.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedPolaroidNames(pickDestinationPolaroidNames(spec.destLabel, 3))
                        }
                        className="h-8 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-[var(--whisk-navy)] inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#D94E34]" />
                        <span>Match {spec.destLabel}</span>
                      </button>
                    </div>

                    {/* Visual Whisk Polaroid Picker Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {LANDMARK_POLAROIDS.map((polaroid) => {
                        const orderIdx = selectedPolaroidNames.indexOf(polaroid.name);
                        const isSelected = orderIdx !== -1;
                        return (
                          <button
                            key={polaroid.name}
                            type="button"
                            onClick={() => handleTogglePolaroidSelection(polaroid.name)}
                            className={`group relative rounded-xl p-1.5 pb-2 bg-white border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[#D94E34] ring-2 ring-[#D94E34]/20 shadow-sm'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="relative aspect-[4/4] rounded-lg overflow-hidden bg-slate-100">
                              <img
                                src={polaroid.url}
                                alt={polaroid.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                              {isSelected && (
                                <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#D94E34] text-white text-[10px] font-bold flex items-center justify-center shadow">
                                  {orderIdx + 1}
                                </span>
                              )}
                            </div>
                            <div className="mt-1.5 px-0.5">
                              <div className="text-[10px] font-bold text-[var(--whisk-navy)] truncate">
                                {polaroid.name.split(',')[0]}
                              </div>
                              <div className="text-[9px] text-slate-500 truncate">
                                {polaroid.region}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected Polaroid Sequence Strip */}
                    {selectedPolaroids.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                        <span className="font-semibold text-[var(--whisk-navy)]">Sequence:</span>
                        {selectedPolaroids.map((p, idx) => (
                          <React.Fragment key={p.name}>
                            <span className="font-medium text-slate-800">
                              {idx + 1}. {p.name.split(',')[0]}
                            </span>
                            <span className="text-slate-400">→</span>
                          </React.Fragment>
                        ))}
                        <span className="font-semibold text-[#D94E34]">
                          Whisk Boarding Pass ({spec.originCode} → {spec.destCode})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Polaroid Reel Surface, Aspect Ratio & Audio Bed Controls */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Editorial Desk Surface
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(
                          [
                            { id: 'espresso', label: 'Dark Espresso' },
                            { id: 'linen', label: 'Warm Linen' },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setPolaroidBackdrop(opt.id)}
                            className={`h-9 rounded-lg border text-xs font-semibold cursor-pointer ${
                              polaroidBackdrop === opt.id
                                ? 'bg-[var(--whisk-navy)] text-white border-[var(--whisk-navy)]'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Aspect Ratio
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(['9:16', '16:9'] as MarketingVideoAspect[]).map((ar) => (
                          <button
                            key={ar}
                            type="button"
                            onClick={() => setVideoAspect(ar)}
                            className={`h-9 rounded-lg border text-xs font-semibold tabular-nums cursor-pointer ${
                              videoAspect === ar
                                ? 'bg-[var(--whisk-navy)] text-white border-[var(--whisk-navy)]'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {ar}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useLatestSoundscapeOnPolaroids}
                        onChange={(e) => setUseLatestSoundscapeOnPolaroids(e.target.checked)}
                        className="rounded border-slate-300 text-[#D94E34]"
                      />
                      <Volume2 className="w-3.5 h-3.5 text-[#D94E34]" />
                      <span>Layer latest captured trip soundscape underneath Polaroids</span>
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {rawFootageUrl
                        ? 'Live destination audio bed ready'
                        : 'Tip: film Pillar #1 first to attach real city & market sounds'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={generatingVideo || selectedPolaroids.length === 0}
                      onClick={handleRenderPolaroidReel}
                      className="h-10 px-5 rounded-xl bg-[#D94E34] hover:bg-[#c54229] text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {generatingVideo ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Film className="w-4 h-4" />
                      )}
                      <span>
                        {generatingVideo
                          ? videoProgressLabel || 'Rendering Polaroid Reel...'
                          : `Render Animated ${selectedPolaroids.length}-Polaroid Reel`}
                      </span>
                    </button>

                    {selectedPolaroids[0] && (
                      <button
                        type="button"
                        disabled={generatingVideo}
                        onClick={() => handleAnimateSinglePolaroidWithAI(selectedPolaroids[0])}
                        className="h-10 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-[var(--whisk-navy)] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Wand2 className="w-3.5 h-3.5 text-[#D94E34]" />
                        <span>
                          Animate “{selectedPolaroids[0].name.split(',')[0]}” with AI + Sound
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Content Format Rotator Bar */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/75 space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-[var(--whisk-navy)] flex items-center gap-1.5">
                          <Shuffle className="w-3.5 h-3.5 text-[#D94E34]" />
                          <span>Content Rotation Pillar</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {autoReelBundle.format.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={researchingTrends}
                          onClick={() => handleResearchTrendsAndMaps(true)}
                          className="h-8 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-[var(--whisk-navy)] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                        >
                          {researchingTrends ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <MapPin className="w-3.5 h-3.5 text-[#D94E34]" />
                          )}
                          <span>Refresh Maps Spots</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdvanceReelRotation(false)}
                          className="h-8 px-3 rounded-lg bg-[var(--whisk-navy)] hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <SkipForward className="w-3.5 h-3.5" />
                          <span>Next Format</span>
                        </button>
                      </div>
                    </div>

                    {/* 7 Selectable Content Pillars */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {REEL_CONTENT_FORMATS.map((fmt) => {
                        const active = reelFormatId === fmt.id;
                        return (
                          <button
                            key={fmt.id}
                            type="button"
                            onClick={() => applyReelFormat(fmt.id)}
                            className={`px-3 py-2 rounded-lg border text-left text-xs font-semibold transition-colors cursor-pointer ${
                              active
                                ? 'bg-[var(--whisk-navy)] text-white border-[var(--whisk-navy)]'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="truncate">{fmt.shortLabel}</div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Live Trip Soundscape + Editorial Cut Strip */}
                    <div className="pt-2 border-t border-slate-200/80 space-y-1.5 text-[11px] text-slate-600">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-semibold text-[var(--whisk-navy)] inline-flex items-center gap-1">
                          <Volume2 className="w-3.5 h-3.5 text-[#D94E34]" />
                          <span>Live Trip Soundscape:</span>
                        </span>
                        <span className="font-medium text-slate-800">
                          {autoReelBundle.soundscapeSummary}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-semibold text-[var(--whisk-navy)]">Editorial Cut:</span>
                        {autoReelBundle.format.compositeMode === 'soundscape-pass' ? (
                          <span className="font-semibold text-[#D94E34]">
                            Standalone Whisk Boarding Pass ({spec.originCode} → {spec.destCode}) floating over blurred {spec.destLabel} lights + stereo trip audio ({videoDuration})
                          </span>
                        ) : (
                          <>
                            <span className="font-medium text-slate-800">
                              Single-take 35mm film of {autoReelBundle.featuredSpot.name} ({videoDuration}, zero AI text)
                            </span>
                            <span className="text-slate-400">→</span>
                            <span className="font-semibold text-[#D94E34]">
                              {autoAttachBoardingPassOutro
                                ? `0.85s cross-dissolve → Crisp Whisk Boarding Pass (${spec.originCode} → ${spec.destCode})`
                                : `Raw text-free cinema clip`}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Automation & Studio Finisher Toggles */}
                    <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-x-5 gap-y-2">
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoRotateFormat}
                          onChange={(e) => setAutoRotateFormat(e.target.checked)}
                          className="rounded border-slate-300 text-[var(--whisk-navy)]"
                        />
                        <span>Auto-advance pillar after render</span>
                      </label>
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoRotateSource}
                          onChange={(e) => setAutoRotateSource(e.target.checked)}
                          className="rounded border-slate-300 text-[var(--whisk-navy)]"
                        />
                        <span>Also rotate destination</span>
                      </label>
                      {autoReelBundle.format.compositeMode === 'cinema-outro' && (
                        <>
                          <label
                            className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer"
                            title="Films clean, text-free luxury cinema footage with destination audio and seamlessly cross-dissolves into your exact vector-sharp Whisk Boarding Pass PNG end-card."
                          >
                            <input
                              type="checkbox"
                              checked={autoAttachBoardingPassOutro}
                              onChange={(e) => setAutoAttachBoardingPassOutro(e.target.checked)}
                              className="rounded border-slate-300 text-[#D94E34]"
                            />
                            <span className="inline-flex items-center gap-1">
                              <Layers className="w-3.5 h-3.5 text-[#D94E34]" />
                              <span>Studio Boarding Pass Outro (Crisp Vector)</span>
                            </span>
                          </label>
                          {autoAttachBoardingPassOutro && (
                            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={showEditorialLowerThird}
                                onChange={(e) => setShowEditorialLowerThird(e.target.checked)}
                                className="rounded border-slate-300 text-[var(--whisk-navy)]"
                              />
                              <span>Subtle serif spot title</span>
                            </label>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {videoMode === 'animate' && (
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-700">
                          Starting Polaroid or Frame Image
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              const matchName = pickDestinationPolaroidNames(spec.destLabel, 1)[0];
                              const matched = LANDMARK_POLAROIDS.find((p) => p.name === matchName);
                              if (matched) {
                                setVideoSourceImageUrl(await imageUrlToDataUrl(matched.url));
                              }
                            }}
                            className="h-8 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-[var(--whisk-navy)] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5 text-[#D94E34]" />
                            <span>Use {spec.destLabel} Polaroid</span>
                          </button>
                          {passPreviewUrl && (
                            <button
                              type="button"
                              onClick={() => setVideoSourceImageUrl(passPreviewUrl)}
                              className="h-8 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
                            >
                              Use Boarding Pass
                            </button>
                          )}
                          {generatedImageUrl && (
                            <button
                              type="button"
                              onClick={() => setVideoSourceImageUrl(generatedImageUrl)}
                              className="h-8 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
                            >
                              Use Nano Banana Image
                            </button>
                          )}
                          <label className="h-8 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setVideoSourceImageUrl(await readFileAsDataUrl(file));
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Quick Whisk Polaroid Swatch Strip */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {LANDMARK_POLAROIDS.slice(0, 12).map((p) => (
                          <button
                            key={p.name}
                            type="button"
                            onClick={async () => setVideoSourceImageUrl(await imageUrlToDataUrl(p.url))}
                            className="shrink-0 w-14 rounded-lg border border-slate-200 bg-white p-1 hover:border-[#D94E34] transition-colors cursor-pointer"
                            title={`Animate ${p.name} Polaroid`}
                          >
                            <img
                              src={p.url}
                              alt={p.name}
                              className="w-full h-11 object-cover rounded"
                            />
                            <div className="text-[9px] font-semibold text-slate-700 truncate mt-0.5 text-center">
                              {p.name.split(',')[0]}
                            </div>
                          </button>
                        ))}
                      </div>

                      {videoSourceImageUrl ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={videoSourceImageUrl}
                            alt="Starting frame for video animation"
                            className="w-20 h-28 object-cover rounded-lg border border-slate-200 bg-white"
                          />
                          <div className="text-xs text-slate-600 space-y-1">
                            <div className="font-semibold text-[var(--whisk-navy)]">
                              Starting frame ready for Living Polaroid animation
                            </div>
                            <p>
                              Omni 1.2 Flash will gently bring this frame to life with stereo destination audio, then dissolve into your crisp Boarding Pass.
                            </p>
                            <button
                              type="button"
                              onClick={() => setVideoSourceImageUrl(null)}
                              className="text-rose-600 font-semibold hover:underline cursor-pointer"
                            >
                              Remove frame
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">
                          Pick any Whisk Polaroid above or upload a destination photo to animate it into a luxury Reel with real trip sound.
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        {autoReelBundle.format.compositeMode === 'soundscape-pass'
                          ? 'Ambient Lights & Live Trip Soundscape Prompt (Boarding Pass Floats Cleanly on Top)'
                          : 'Director Cinematography & Soundscape Prompt (Single-Take 35mm · Boarding Pass Composited Cleanly After)'}
                      </label>
                      {reelPromptEditedManually && (
                        <button
                          type="button"
                          onClick={() => setReelPromptEditedManually(false)}
                          className="text-[11px] font-semibold text-[#D94E34] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Rebuild from Spots</span>
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={5}
                      value={videoPrompt}
                      onChange={(e) => {
                        setVideoPrompt(e.target.value);
                        setReelPromptEditedManually(true);
                      }}
                      placeholder="Describe the atmosphere, bokeh lights, and authentic local soundscape (horns, market chatter, café clinking)..."
                      className="w-full p-3.5 rounded-xl border border-slate-300 text-xs leading-relaxed"
                    />
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Aspect Ratio
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(['9:16', '16:9'] as MarketingVideoAspect[]).map((ar) => (
                          <button
                            key={ar}
                            type="button"
                            onClick={() => setVideoAspect(ar)}
                            className={`h-9 rounded-lg border text-xs font-semibold tabular-nums cursor-pointer ${
                              videoAspect === ar
                                ? 'bg-[var(--whisk-navy)] text-white border-[var(--whisk-navy)]'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {ar}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Duration
                      </label>
                      <select
                        value={videoDuration}
                        onChange={(e) => setVideoDuration(e.target.value as MarketingVideoDuration)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-semibold tabular-nums"
                      >
                        {(['5s', '6s', '8s', '10s', '12s', '15s'] as MarketingVideoDuration[]).map((d) => (
                          <option key={d} value={d}>
                            {d} clip
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Resolution
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(['720p', '1080p'] as MarketingVideoResolution[]).map((resOpt) => (
                          <button
                            key={resOpt}
                            type="button"
                            onClick={() => setVideoResolution(resOpt)}
                            className={`h-9 rounded-lg border text-xs font-semibold tabular-nums cursor-pointer ${
                              videoResolution === resOpt
                                ? 'bg-[var(--whisk-navy)] text-white border-[var(--whisk-navy)]'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {resOpt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={generatingVideo}
                      onClick={() => handleRunVideoStudio(false)}
                      className="h-10 px-5 rounded-xl bg-[#D94E34] hover:bg-[#c54229] text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {generatingVideo ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : autoReelBundle.format.compositeMode === 'soundscape-pass' ? (
                        <Volume2 className="w-4 h-4" />
                      ) : (
                        <Film className="w-4 h-4" />
                      )}
                      <span>
                        {generatingVideo
                          ? videoProgressLabel || 'Filming luxury Reel...'
                          : autoReelBundle.format.compositeMode === 'soundscape-pass'
                          ? `Render Boarding Pass + ${spec.destLabel} Sounds`
                          : videoMode === 'animate'
                          ? `Animate Living Polaroid + Pass Outro`
                          : `Film ${autoReelBundle.format.shortLabel} + Pass Outro`}
                      </span>
                    </button>

                    {rawFootageUrl && autoReelBundle.format.compositeMode !== 'direct' && (
                      <button
                        type="button"
                        disabled={generatingVideo}
                        onClick={handleRecompositeOutro}
                        className="h-10 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-[var(--whisk-navy)] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Layers className="w-3.5 h-3.5 text-[#D94E34]" />
                        <span>
                          {autoReelBundle.format.compositeMode === 'soundscape-pass'
                            ? 'Re-Composite Pass + Sound'
                            : 'Re-Composite Outro'}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => copyText(autoReelBundle.suggestedCaption, 'reel-caption')}
                      className="h-10 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedId === 'reel-caption' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>{copiedId === 'reel-caption' ? 'Caption Copied' : 'Copy Post Caption'}</span>
                    </button>
                  </div>

                  {/* Multi-Turn Video Refinement / Extension via previous_interaction_id */}
                  {videoInteractionId && (
                    <div className="pt-4 border-t border-slate-200 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="text-xs font-semibold text-slate-700">
                          Refine Footage & Soundscape (Multi-Turn Omni Flash)
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setVideoFollowUpPrompt(
                              'Bring out warmer street lights and richer background sounds of the local market: light conversation, distant horns, espresso cups clinking, slower camera drift.'
                            )
                          }
                          className="text-[11px] font-semibold text-[#D94E34] hover:underline cursor-pointer"
                        >
                          Richer Lights & Market Chatter →
                        </button>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={videoFollowUpPrompt}
                          onChange={(e) => setVideoFollowUpPrompt(e.target.value)}
                          placeholder="e.g. Add warmer lantern bokeh and livelier evening market chatter"
                          className="flex-1 h-9 px-3 rounded-lg border border-slate-300 text-xs"
                        />
                        <button
                          type="button"
                          disabled={generatingVideo || !videoFollowUpPrompt.trim()}
                          onClick={() => handleRunVideoStudio(true)}
                          className="h-9 px-4 rounded-lg bg-[var(--whisk-navy)] hover:bg-slate-800 text-white text-xs font-semibold whitespace-nowrap cursor-pointer disabled:opacity-50"
                        >
                          Refine Footage
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Video Preview, Caption & Download Panel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-[var(--whisk-navy)]">
                  Finished Luxury Reel ({videoAspect})
                </div>
                <span className="text-[11px] font-medium text-slate-500">
                  {spec.destLabel} ·{' '}
                  {videoMode === 'polaroids'
                    ? `${selectedPolaroids.length} Polaroids`
                    : autoReelBundle.format.shortLabel}
                </span>
              </div>

              <div className="w-full min-h-[380px] rounded-xl border border-slate-200 bg-slate-950 flex items-center justify-center overflow-hidden">
                {generatedVideoUrl ? (
                  <video
                    key={generatedVideoUrl}
                    src={generatedVideoUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="w-full max-h-[520px] object-contain"
                  />
                ) : (
                  <div className="text-center px-6 py-12 text-xs text-slate-400">
                    {generatingVideo
                      ? videoProgressLabel || 'Rendering luxury Reel & destination audio...'
                      : 'Your finished Reel (Boarding Pass + live trip soundscape, animated Polaroids, or 35mm spot film) will play here with sound.'}
                  </div>
                )}
              </div>

              {generatedVideoUrl && (
                <div className="space-y-2">
                  <a
                    href={generatedVideoUrl}
                    download={`whisk-luxury-reel-${spec.destCode.toLowerCase()}-${reelFormatId}-${videoAspect.replace(':', 'x')}.${generatedFileExt}`}
                    className="w-full h-10 px-4 rounded-xl bg-[var(--whisk-navy)] hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Finished Reel ({generatedFileExt.toUpperCase()})</span>
                  </a>
                  {rawFootageUrl && rawFootageUrl !== generatedVideoUrl && (
                    <a
                      href={rawFootageUrl}
                      download={`whisk-raw-cinema-${spec.destCode.toLowerCase()}-${reelFormatId}.mp4`}
                      className="w-full h-9 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center justify-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Download Raw Text-Free Footage (MP4)</span>
                    </a>
                  )}
                </div>
              )}

              {/* Ready-to-Post Synced Caption Preview */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[var(--whisk-navy)]">
                    Paired @whisk.travel Caption
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(autoReelBundle.suggestedCaption, 'reel-caption-card')}
                    className="text-[11px] font-semibold text-slate-600 hover:text-[var(--whisk-navy)] inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === 'reel-caption-card' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedId === 'reel-caption-card' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 whitespace-pre-line leading-relaxed">
                  {autoReelBundle.suggestedCaption}
                </p>
              </div>
            </div>
          </div>

          {/* Session Reel Queue (Preserves Every Rotated Reel Generated This Session) */}
          {reelLibrary.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[var(--whisk-navy)]">
                    Session Reel Queue ({reelLibrary.length})
                  </h4>
                  <p className="text-xs text-slate-500">
                    Every rotated Reel generated in this session stays ready for playback, caption copy, and MP4 download.
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {reelLibrary.map((item) => {
                  const isCurrent = generatedVideoUrl === item.videoUrl;
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition-colors space-y-2.5 ${
                        isCurrent
                          ? 'border-[var(--whisk-navy)] bg-slate-50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-[var(--whisk-navy)]">
                            {item.destination} · {item.duration}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {item.formatTitle} · {item.createdAt}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setGeneratedVideoUrl(item.videoUrl);
                            setRawFootageUrl(item.rawFootageUrl);
                            setGeneratedFileExt(item.fileExtension);
                            setVideoInteractionId(item.interactionId);
                          }}
                          className="h-7 px-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-semibold text-[var(--whisk-navy)] inline-flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Play className="w-3 h-3" />
                          <span>Preview</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={item.videoUrl}
                          download={`whisk-luxury-reel-${item.destCode.toLowerCase()}-${item.formatId}.${item.fileExtension}`}
                          className="flex-1 h-8 px-3 rounded-lg bg-[var(--whisk-navy)] hover:bg-slate-800 text-white text-[11px] font-semibold inline-flex items-center justify-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download {item.fileExtension.toUpperCase()}</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => copyText(item.caption, `queue-${item.id}`)}
                          className="h-8 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === `queue-${item.id}` ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedId === `queue-${item.id}` ? 'Copied' : 'Caption'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: GOOGLE SEARCH & MAPS TREND RESEARCH + GEMINI CREATIVE DIRECTOR CHAT */}
      {activeTab === 'director' && (
        <div className="grid xl:grid-cols-2 gap-6 items-start">
          {/* Left: Live Search + Maps Grounded Campaign Brief */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-[var(--whisk-navy)]">
                Live Trend & Local Spot Grounding · gemini-4-hydrogen
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Combines live Google Search travel trends with Google Maps verified neighborhood spots for {spec.destLabel}.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Channel
                </label>
                <select
                  value={researchPlatform}
                  onChange={(e) => setResearchPlatform(e.target.value as MarketingPlatform)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
                >
                  <option value="instagram-reel">Instagram Reel (9:16)</option>
                  <option value="tiktok">TikTok Video (9:16)</option>
                  <option value="instagram-story">Instagram Story Boarding Pass</option>
                  <option value="carousel">Instagram Proof Carousel</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination Focus
                </label>
                <input
                  type="text"
                  value={spec.destLabel}
                  onChange={(e) => setSpec((p) => ({ ...p, destLabel: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Campaign Angle
              </label>
              <input
                type="text"
                value={researchGoal}
                onChange={(e) => setResearchGoal(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                disabled={researchingTrends}
                onClick={() => handleResearchTrendsAndMaps(false)}
                className="h-9 px-4 rounded-xl bg-[var(--whisk-navy)] hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {researchingTrends ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>
                  {researchingTrends
                    ? 'Researching Search & Maps...'
                    : 'Research Live Trends & Spots'}
                </span>
              </button>

              {trendBrief && (
                <button
                  type="button"
                  onClick={handleApplyBriefToPass}
                  className="h-9 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-[var(--whisk-navy)] cursor-pointer"
                >
                  Apply to Boarding Pass & Prompts
                </button>
              )}
            </div>

            {trendBrief ? (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div>
                  <div className="text-xs font-bold text-[var(--whisk-navy)] mb-1">
                    Current Trend Angle
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{trendBrief.trendSummary}</p>
                </div>

                {trendBrief.viralHooks?.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-[var(--whisk-navy)] mb-1.5">
                      Viral Opening Hooks
                    </div>
                    <div className="space-y-1.5">
                      {trendBrief.viralHooks.map((hook, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs"
                        >
                          <span className="font-medium text-slate-800">{hook}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSpec((p) => ({ ...p, viralHook: hook }));
                              flashNotice('Applied hook to Boarding Pass.');
                            }}
                            className="text-[11px] font-semibold text-[#D94E34] hover:underline shrink-0 cursor-pointer"
                          >
                            Use
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {trendBrief.verifiedSpots?.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-[var(--whisk-navy)] mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#D94E34]" />
                      <span>Google Maps Verified Anchor Spots</span>
                    </div>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                      {trendBrief.verifiedSpots.map((spot, i) => (
                        <div key={i} className="px-3.5 py-2.5 bg-white text-xs">
                          <div className="font-semibold text-[var(--whisk-navy)]">
                            {spot.name}{' '}
                            <span className="text-slate-400 font-normal">· {spot.neighborhood}</span>
                          </div>
                          <div className="text-slate-600 mt-0.5">{spot.whyItConverts}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--whisk-navy)]">
                      Ready-to-Post Caption & Hashtags
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          `${trendBrief.caption}\n\n${(trendBrief.hashtags || []).join(' ')}`,
                          'caption'
                        )
                      }
                      className="text-xs font-semibold text-slate-700 hover:text-[var(--whisk-navy)] inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === 'caption' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedId === 'caption' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {trendBrief.caption}
                  </p>
                  <div className="text-[11px] font-medium text-slate-500">
                    {(trendBrief.hashtags || []).join(' ')}
                  </div>
                </div>

                {trendBrief.sources?.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-500">
                      Google Search & Maps Sources
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {trendBrief.sources.slice(0, 6).map((src, i) => (
                        <a
                          key={i}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-medium text-sky-700 hover:underline inline-flex items-center gap-1"
                        >
                          <span className="max-w-[180px] truncate">{src.title}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                Click “Research Live Trends & Spots” to pull grounded hooks, captions, and verified Google Maps locations.
              </div>
            )}
          </div>

          {/* Right: Multi-Turn Gemini Creative Director Chatbot */}
          <div className="bg-white border border-slate-200 rounded-2xl flex flex-col h-[680px] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--whisk-navy)]">
                  Whisk Creative Director Chat
                </h3>
                <p className="text-[11px] text-slate-500">
                  Multi-turn scriptwriter & growth strategist synced to {spec.destLabel}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  aria-label="Select Gemini model"
                  value={chatModel}
                  onChange={(e) => setChatModel(e.target.value as MarketingChatModel)}
                  className="h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700"
                >
                  {CHAT_MODEL_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label} — {opt.note}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setChatUseSearch((v) => !v)}
                  title="Toggle live Google Search grounding"
                  className={`h-8 px-2.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                    chatUseSearch
                      ? 'border-sky-300 bg-sky-50 text-sky-800'
                      : 'border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Search</span>
                </button>
              </div>
            </div>

            {/* Scrollable Thread */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
              {chatTurns.map((turn, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${turn.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
                      turn.role === 'user'
                        ? 'bg-[var(--whisk-navy)] text-white'
                        : 'bg-white border border-slate-200 text-slate-800'
                    }`}
                  >
                    {turn.text}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400 px-1">
                    <span>{turn.role === 'user' ? 'You' : turn.model || 'Gemini'}</span>
                    {turn.role === 'model' && (
                      <button
                        type="button"
                        onClick={() => copyText(turn.text, `chat-${idx}`)}
                        className="hover:text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === `chat-${idx}` ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedId === `chat-${idx}` ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {chatSending && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Drafting campaign copy with {chatModel}...</span>
                </div>
              )}
            </div>

            {/* Quick Starters + Composer */}
            <div className="p-3.5 border-t border-slate-200 bg-white space-y-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {QUICK_DIRECTOR_PROMPTS.map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendChat(q)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-medium text-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {q.slice(0, 44)}…
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChat();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask for a Reel script, hook rewrite, or UGC brief..."
                  className="flex-1 h-10 px-3.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                />
                <button
                  type="submit"
                  disabled={chatSending || !chatInput.trim()}
                  className="h-10 px-4 rounded-xl bg-[var(--whisk-navy)] hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
