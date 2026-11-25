
import * as React from 'react';
import { 
  Compass, 
  MapPin, 
  Calendar, 
  Sparkles, 
  ChevronRight, 
  Hotel, 
  Utensils, 
  Camera, 
  Clock,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  Plane,
  Star,
  DollarSign,
  Zap,
  Share2,
  ShieldCheck,
  Globe,
  Trash2,
  User,
  LogOut,
  Lock,
  MessageSquare,
  MessageCircle,
  Send,
  X,
  Brain,
  Loader2,
  UserPlus,
  Palmtree,
  Map,
  CreditCard,
  Crown,
  ShieldAlert,
  Car,
  Tent,
  Mountain,
  BookOpen,
  CheckCircle2,
  Heart,
  Smile,
  PartyPopper,
  Coffee,
  LockKeyhole,
  Unlock,
  Shield,
  Accessibility,
  AlertCircle,
  Umbrella,
  Sun,
  Wine,
  Shuffle,
  Bookmark,
  Check,
  LocateFixed,
  Copy,
  Printer,
  Wifi
} from 'lucide-react';
import { 
  generateItinerary, 
  generateBlogPost,
  findNearestAirport,
} from './geminiService';
import { SearchParams, TripItinerary, BlogPost, Recommendation, MembershipTier, SavedPlace, GroundingSource, DayPlan, DiscoveredSpot } from './types';
import { useAuth } from './src/context/AuthContext';
import {
  deleteItineraryFromFirestore,
  publishGuideToFirestore,
  removeFavoritePlace,
  saveFavoritePlace,
  saveItineraryToFirestore,
  subscribePublicGuides,
  subscribeSavedPlaces,
  subscribeUserItineraries,
  unlockItineraryInFirestore,
} from './src/services/firestoreService';
import { ChatBot } from './src/components/ChatBot';
import { PlacesExplorer } from './src/components/PlacesExplorer';
import { WeatherForecast } from './src/components/WeatherForecast';
import { ItineraryMap } from './src/components/ItineraryMap';
import { AuthModal } from './src/components/AuthModal';
import { LegalModal } from './src/components/LegalModal';
import { LegalConsentModal } from './src/components/LegalConsentModal';
import { TravelShowcaseSection } from './src/components/TravelShowcaseSection';
import { AdminRouteGuard } from './src/components/AdminRouteGuard';
import { AdminDashboard } from './src/components/AdminDashboard';
import { WhiskLogo } from './src/components/WhiskLogo';
import { DateRangeCalendarPicker } from './src/components/DateRangeCalendarPicker';
import { isLegalDocId, LEGAL_DOCUMENTS, LegalDocId } from './src/legal/catalog';
import {
  DESTINATION_IMAGE_BY_KEY,
  LANDMARK_POLAROIDS,
  LOCAL_TRAVEL_IMAGE_POOL,
  PolaroidLandmark,
} from './src/data/destinationMedia';

const MapsQuotaBanner = () => (
  <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
    <span>
      Google Maps Platform quota reached. If you are the app owner, visit{' '}
      <a
        href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
        target="_blank"
        rel="noopener noreferrer"
        className="underline font-semibold text-amber-950 hover:text-amber-800"
      >
        maps developer site
      </a>{' '}
      for instructions to update your account.
    </span>
  </div>
);

const USED_IMAGES = new Set<string>();

function getUniqueTravelImage(destination: string, uniqueSeed?: string): string {
  const destLower = destination.toLowerCase().trim();
  const cleanDest = destLower.replace(/[^a-z]/g, '');

  for (const key of Object.keys(DESTINATION_IMAGE_BY_KEY)) {
    if (cleanDest.includes(key)) {
      const list = DESTINATION_IMAGE_BY_KEY[key];
      for (const url of list) {
        if (!USED_IMAGES.has(url)) {
          USED_IMAGES.add(url);
          return url;
        }
      }
      return list[0];
    }
  }

  for (const url of LOCAL_TRAVEL_IMAGE_POOL) {
    if (!USED_IMAGES.has(url)) {
      USED_IMAGES.add(url);
      return url;
    }
  }

  const seedNum = uniqueSeed
    ? Array.from(uniqueSeed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    : 0;
  return LOCAL_TRAVEL_IMAGE_POOL[seedNum % LOCAL_TRAVEL_IMAGE_POOL.length];
}

const INITIAL_ARTICLES: BlogPost[] = [
  {
    id: 'static-1',
    slug: 'paris-terracotta-bistros-eiffel-guide',
    seoTitle: 'Paris Left Bank & Eiffel Walks: 2026 Local Field Guide | Whisk',
    title: "Golden Hour in Paris: Terracotta Bistros & Eiffel Walks",
    metaDescription: "Golden café terraces, side-street patisseries, and timeless Left Bank walks at sunset across Saint-Germain and Rue Cler.",
    geoSummary: "Pair quiet morning pastry walks along Rue Cler in the 7th arrondissement with late-afternoon gallery stops in Saint-Germain-des-Prés, finishing at Pont Alexandre III as the Eiffel Tower lights up at dusk.",
    neighborhoods: ["Rue Cler (7th Arr.)", "Saint-Germain-des-Prés", "Le Marais", "Canal Saint-Martin"],
    keywords: ["Paris itinerary", "Left Bank walking route", "Rue Cler cafés", "Paris golden hour spots"],
    geoCoordinates: { latitude: 48.8566, longitude: 2.3522 },
    faqs: [
      {
        question: "What is the best time to walk along the Seine and Champ de Mars?",
        answer: "Arrive 45 minutes before sunset to catch soft warm light along Pont Alexandre III and stay for the top-of-the-hour Eiffel sparkle without mid-day crowds."
      },
      {
        question: "Which Paris neighborhood feels authentic for breakfast bistros?",
        answer: "Rue Cler in the 7th arrondissement and Rue des Martyrs in the 9th remain lively neighborhood market streets with independent bakeries and sidewalk espresso bars."
      }
    ],
    content: `## Why the Left Bank Still Wins Sunset\nEvery traveler pictures the Eiffel Tower, yet Paris reveals its best rhythm a few blocks away on tiled market lanes and corner zinc bars.\n\n### Morning Market Loop\n* Pick up warm croissants along **Rue Cler** before tour buses arrive.\n* Cross toward the **Musée Rodin** garden for quiet sculptures beneath blooming chestnuts.\n* Grab an afternoon espresso around **Place Furstenberg** in Saint-Germain.\n\n> Skip elevator queues at peak noon—golden hour from the Seine embankments gives you open skies, street music, and classic Parisian rooftops.`,
    imageUrl: LANDMARK_POLAROIDS[0].url,
    destination: "Paris, France",
    isPublished: true,
    createdAt: '2026-03-10T10:00:00.000Z'
  },
  {
    id: 'static-2',
    slug: 'tokyo-asakusa-espresso-night-guide',
    seoTitle: 'Tokyo Asakusa & Kiyosumi Coffee Walk: Local Guide | Whisk',
    title: "Lantern Nights in Tokyo: Asakusa to Hidden Espresso Bars",
    metaDescription: "Wander glowing shrines in Asakusa at dusk before crossing the Sumida River into Kiyosumi-Shirakawa third-wave coffee bars.",
    geoSummary: "Start in eastern Tokyo around Senso-ji before 8:30 AM, cross the Sumida River to artisanal roasters in Kiyosumi-Shirakawa, and wrap up with lantern-lit izakaya alleys after dark.",
    neighborhoods: ["Asakusa", "Kiyosumi-Shirakawa", "Yanaka", "Shimokitazawa"],
    keywords: ["Tokyo travel guide", "Asakusa morning itinerary", "Kiyosumi coffee", "Tokyo local neighborhoods"],
    geoCoordinates: { latitude: 35.7148, longitude: 139.7967 },
    faqs: [
      {
        question: "When should you visit Senso-ji in Asakusa to avoid heavy crowds?",
        answer: "Arrive before 8:30 AM or return after 8:00 PM when the pagoda and Kaminarimon lantern gate glow dramatically with only local commuters nearby."
      },
      {
        question: "Where is Tokyo's best indie coffee district?",
        answer: "Kiyosumi-Shirakawa, just south of Asakusa across the Sumida River, anchors dozens of boutique roasteries beside peaceful Japanese gardens."
      }
    ],
    content: `## East Tokyo Beyond the Neon Rush\nWhile Shibuya dominates postcards, east Tokyo pairs Edo-era wooden temples with serene canal-side coffee houses.\n\n### One Seamless River Route\n* Walk **Senso-ji's Nakamise-dori** at dawn while shutters begin lifting.\n* Hop south into **Kiyosumi-Shirakawa** for pour-over tastings and contemporary galleries.\n* End with smoky yakitori along **Hoppy Street** as paper lanterns flick on.\n\n> Pair morning temple walks with afternoon specialty roasters south of the Sumida River for Tokyo's most balanced cultural contrast.`,
    imageUrl: LANDMARK_POLAROIDS[1].url,
    destination: "Tokyo, Japan",
    isPublished: true,
    createdAt: '2026-03-12T10:00:00.000Z'
  },
  {
    id: 'static-3',
    slug: 'amalfi-coast-positano-cliffside-guide',
    seoTitle: 'Amalfi Coast Ferry & Lemon Grove Guide: Positano to Ravello | Whisk',
    title: "Cliffside Lemons & Azure Seas on the Amalfi Coast",
    metaDescription: "Navigate Positano steps, Amalfi ferries, and Ravello clifftop gardens seamlessly without getting stuck in coastal highway traffic.",
    geoSummary: "Skip coastal bus gridlock by connecting Salerno, Amalfi, and Positano via early-morning high-speed ferries, reserving midday hours for shady Ravello hilltop terraces.",
    neighborhoods: ["Positano", "Ravello", "Amalfi Harbor", "Atrani"],
    keywords: ["Amalfi Coast guide", "Positano ferry schedule", "Ravello gardens", "Italy coastal itinerary"],
    geoCoordinates: { latitude: 40.6333, longitude: 14.6029 },
    faqs: [
      {
        question: "How do you travel between Amalfi Coast towns without traffic delays?",
        answer: "Book regional Travelmar or Alilauro ferries between Positano, Amalfi, and Salerno; sea crossings take 20 minutes and offer unobstructed views of the pastel cliffside villages."
      },
      {
        question: "Which Amalfi town is best for quieter panoramic views?",
        answer: "Ravello sits high above the sea with Villa Cimbrone's Terrace of Infinity and noticeably calmer afternoon breezes than beach-level towns."
      }
    ],
    content: `## Beat Coastal Traffic by Taking the Water\nThe Amalfi Coast rewards travelers who trade bumper-to-bumper highway tarmac for saltwater ferries and stone lemon staircases.\n\n### High-Low Coastal Strategy\n* Take the **first 9 AM ferry** into Positano harbor for beach swims before day-trippers dock.\n* Stroll next door from Amalfi town into peaceful **Atrani** via the whitewashed pedestrian tunnel.\n* Climb up to **Ravello** after 4 PM for cooler alpine-meets-sea panoramas.\n\n> Always pack linen shirts and grippy sandals—the coast's best vistas sit at the top of centuries-old limestone stairs.`,
    imageUrl: LANDMARK_POLAROIDS[2].url,
    destination: "Amalfi Coast, Italy",
    isPublished: true,
    createdAt: '2026-03-14T10:00:00.000Z'
  },
  {
    id: 'static-4',
    slug: 'santorini-oia-caldera-sunset-guide',
    seoTitle: 'Santorini Caldera Hike & Aegean Coves Field Guide | Whisk',
    title: "Blue Domes of Santorini & Caldera Sunset Trails",
    metaDescription: "Walk the dramatic Oia-to-Fira rim trail, swim volcanic coves below Pyrgos, and find serene Aegean tavernas away from sunset bottlenecks.",
    geoSummary: "Walk the 10-kilometer Fira-to-Oia caldera ridge trail starting early morning from Fira, then trade crowded castle terraces for volcanic cliffside dinners in Imerovigli or Pyrgos.",
    neighborhoods: ["Imerovigli", "Oia", "Pyrgos Kallistis", "Ammoudi Bay"],
    keywords: ["Santorini caldera walk", "Fira to Oia hike", "Imerovigli sunset", "Greece Cyclades guide"],
    geoCoordinates: { latitude: 36.4618, longitude: 25.3753 },
    faqs: [
      {
        question: "How long does the Fira to Oia caldera hike take?",
        answer: "Expect 2.5 to 3.5 hours at a relaxed photo pace along cobbled paths and pumice ridge trails with zero shade—start before 8:30 AM and carry water."
      },
      {
        question: "Where can you see the Santorini sunset without heavy Oia crowds?",
        answer: "Imerovigli's Skaros Rock promontory and hilltop tavernas around Pyrgos overlook the entire caldera basin with clear golden-hour sightlines."
      }
    ],
    content: `## Above the Volcanic Basin\nSantorini feels wildly different once you step past main souvenir alleys onto sun-bleached footpath ridges.\n\n### Three Must-Save Experiences\n* Walk **Fira to Imerovigli** in crisp morning light before midday UV peaks.\n* Descend to **Ammoudi Bay** for cliffside sea swims and grilled octopus.\n* Wander inland **Pyrgos Kallistis** for Cycladic bell towers and local Assyrtiko tastings.\n\n> Base yourself in Imerovigli if you want unobstructed western caldera views steps from your terrace.`,
    imageUrl: LANDMARK_POLAROIDS[3].url,
    destination: "Santorini, Greece",
    isPublished: true,
    createdAt: '2026-03-16T10:00:00.000Z'
  },
  {
    id: 'static-5',
    slug: 'marrakech-medina-saffron-courtyard-guide',
    seoTitle: 'Marrakech Medina, Riads & Garden Guide | Whisk',
    title: "Saffron Courtyards & Spice Alleys of Marrakech",
    metaDescription: "Cool emerald riad courtyards, artisan brass souks, Atlas rooftop mint tea, and calm morning walks inside the Marrakech Medina.",
    geoSummary: "Explore Bahia Palace and Le Jardin Secret right at opening hour, break midday inside tranquil tiled riads, and time Ben Youssef Madrasa before evening spice stalls ignite around Rahba Kedima.",
    neighborhoods: ["Mouassine", "Rahba Kedima", "Gueliz", "Kasbah"],
    keywords: ["Marrakech itinerary", "Marrakech Medina guide", "best riads Mouassine", "Morocco travel tips"],
    geoCoordinates: { latitude: 31.6295, longitude: -7.9811 },
    faqs: [
      {
        question: "Where should first-time visitors stay in Marrakech?",
        answer: "Riad courtyards in Mouassine or Dar el Bacha balance walkable proximity to the souks with quiet pedestrian side lanes and easy taxi drop-off access."
      },
      {
        question: "What is the best time of day to visit Ben Youssef Madrasa?",
        answer: "Arrive at 9 AM opening when clear sunlight filters straight onto the carved cedarwood courtyard pool before tour groups gather."
      }
    ],
    content: `## Calm Courtyards Inside Ancient Walls\nMarrakech moves in sensory layers: hushed orange-blossom courtyards behind heavy cedar doors open straight onto vibrant spice squares.\n\n### Medina Pacing Tips\n* Tour **Bahia Palace** and **Ben Youssef Madrasa** right at opening hour.\n* Browse apothecaries and hand-woven baskets at **Rahba Kedima** before afternoon heat peaks.\n* Take sunset mint tea on a Kasbah rooftop facing the snow-dusted **High Atlas Mountains**.\n\n> Rhythm matters here: slow mornings, shady courtyard lunches, and atmospheric dusk strolls transform the Medina.`,
    imageUrl: LANDMARK_POLAROIDS[4].url,
    destination: "Marrakech, Morocco",
    isPublished: true,
    createdAt: '2026-03-18T10:00:00.000Z'
  },
  {
    id: 'static-6',
    slug: 'swiss-alps-zermatt-matterhorn-guide',
    seoTitle: 'Zermatt & Matterhorn High-Alpine Rail Guide | Whisk',
    title: "Matterhorn Mornings in the Swiss Alps",
    metaDescription: "Car-free Zermatt village lanes, Gornergrat panoramic trains, mirror-still glacial lakes, and wood-fired alpine fondue chalets.",
    geoSummary: "Ride the first Gornergrat Bahn cogwheel train out of car-free Zermatt for unobstructed Matterhorn reflections at Riffelsee before afternoon summit clouds drift in.",
    neighborhoods: ["Zermatt Hinterdorf", "Gornergrat Ridge", "Riffelsee", "Findeln"],
    keywords: ["Zermatt travel guide", "Matterhorn sunrise", "Gornergrat cogwheel train", "Swiss Alps hiking"],
    geoCoordinates: { latitude: 46.0207, longitude: 7.7491 },
    faqs: [
      {
        question: "How do you get clear Matterhorn photos without afternoon clouds?",
        answer: "Mountain clouds commonly build after 11:30 AM, so board the earliest Gornergrat train or walk to Kirchbrücke bridge right around sunrise."
      },
      {
        question: "Is Zermatt accessible without a rental car?",
        answer: "Yes—Zermatt is strictly car-free and connected seamlessly via Swiss SBB trains from Zurich, Geneva, and Brig straight into town."
      }
    ],
    content: `## Crisp Air & Granite Peaks in Car-Free Zermatt\nWith electric shuttles gliding past centuries-old larch barns, Zermatt blends effortless Swiss rail precision with wild high-alpine trails.\n\n### Peak Day Blueprint\n* Catch **sunrise on Kirchbrücke** before bakeries pull warm Nussgipfel from the oven.\n* Ascend via **Gornergrat Bahn** and hike down past **Riffelsee** mirror pools.\n* Break for sun-terrace rösti in the hillside hamlet of **Findeln** facing the Matterhorn east face.\n\n> Layer up even in July—temperatures above 2,800 meters shift fast between bright alpine sun and glacial breezes.`,
    imageUrl: LANDMARK_POLAROIDS[5].url,
    destination: "Swiss Alps, Switzerland",
    isPublished: true,
    createdAt: '2026-03-20T10:00:00.000Z'
  }
];

const COLLAGE_POOL = LANDMARK_POLAROIDS;

const WASHI_TAPES = [
  {
    background: 'linear-gradient(90deg, rgba(255,59,48,0.85), rgba(255,204,0,0.85))',
    posClass: '-top-2.5 left-4',
    widthClass: 'w-16',
  },
  {
    background: 'repeating-linear-gradient(45deg, rgba(0,180,255,0.82) 0 6px, rgba(255,255,255,0.75) 6px 12px)',
    posClass: '-top-2.5 right-4',
    widthClass: 'w-20',
  },
  {
    background: 'linear-gradient(135deg, rgba(255,28,247,0.8), rgba(0,180,255,0.82))',
    posClass: '-top-3 left-1/3',
    widthClass: 'w-18',
  },
  {
    background: 'repeating-linear-gradient(-45deg, rgba(0,230,118,0.85) 0 5px, rgba(255,204,0,0.8) 5px 10px)',
    posClass: '-top-2.5 left-1/2 -translate-x-1/2',
    widthClass: 'w-16',
  },
  {
    background: 'linear-gradient(90deg, rgba(255,204,0,0.9), rgba(255,28,247,0.78))',
    posClass: '-top-2.5 right-6',
    widthClass: 'w-14',
  },
  {
    background: 'repeating-linear-gradient(90deg, rgba(255,59,48,0.8) 0 7px, rgba(255,28,247,0.75) 7px 14px)',
    posClass: '-top-2.5 left-6',
    widthClass: 'w-20',
  },
];

const HERO_CARD_ICONS = [
  { Icon: Plane, color: '#FF3B30', bg: 'bg-[#FF3B30]/10' },
  { Icon: Palmtree, color: '#00C853', bg: 'bg-[#00E676]/15' },
  { Icon: Mountain, color: '#00B4FF', bg: 'bg-[#00B4FF]/12' },
  { Icon: Sun, color: '#F59E0B', bg: 'bg-[#FFCC00]/20' },
  { Icon: Umbrella, color: '#FF1CF7', bg: 'bg-[#FF1CF7]/10' },
  { Icon: Compass, color: '#0F172A', bg: 'bg-slate-100' },
];

const toLocalIsoDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const addDaysToIso = (iso: string, offsetDays: number): string => {
  const base = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(base.getTime())) return iso;
  base.setUTCDate(base.getUTCDate() + offsetDays);
  return base.toISOString().slice(0, 10);
};

const diffDaysInclusive = (startIso: string, endIso: string): number => {
  const s = new Date(`${startIso}T12:00:00Z`).getTime();
  const e = new Date(`${endIso}T12:00:00Z`).getTime();
  if (Number.isNaN(s) || Number.isNaN(e)) return 3;
  return Math.round((e - s) / 86400000) + 1;
};

const formatTripDayDate = (iso?: string): string | null => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
};

const formatTripDateRange = (startIso?: string, endIso?: string): string | null => {
  if (!startIso || !/^\d{4}-\d{2}-\d{2}$/.test(startIso)) return null;
  const s = new Date(`${startIso}T12:00:00Z`);
  if (Number.isNaN(s.getTime())) return null;
  if (!endIso || !/^\d{4}-\d{2}-\d{2}$/.test(endIso)) {
    return s.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }
  const e = new Date(`${endIso}T12:00:00Z`);
  if (Number.isNaN(e.getTime())) return null;
  const sameYear = s.getUTCFullYear() === e.getUTCFullYear();
  const startStr = s.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
    timeZone: 'UTC',
  });
  const endStr = e.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return `${startStr} – ${endStr}`;
};

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface PolaroidTileBase extends PolaroidLandmark {
  uid: string;
  landRot: string;
  throwRot: string;
  throwX: string;
  throwY: string;
  tape: (typeof WASHI_TAPES)[number];
  tapeRot: string;
  dropDelayMs: number;
  tapeDelayMs: number;
  jitterClass: string;
  stackShift: string;
  stackZ: number;
}

interface PolaroidSlotState extends PolaroidTileBase {
  prevCard?: PolaroidTileBase;
}

const STACK_OFFSETS = [
  '-translate-x-2 -translate-y-2',
  'translate-x-3 translate-y-2',
  '-translate-x-3 translate-y-3',
  'translate-x-2 -translate-y-3',
  'translate-x-4 -translate-y-1',
  '-translate-x-2 translate-y-4',
];

function buildPolaroidTile(
  landmark: PolaroidLandmark,
  slotIndex: number,
  uidCounter: number,
  dropDelayMs: number
): PolaroidSlotState {
  const landDeg = (Math.random() * 18 - 9).toFixed(1);
  const throwDeg = (Math.random() * 48 - 24).toFixed(1);
  const throwX = Math.round(Math.random() * 170 - 85);
  const throwY = Math.round(Math.random() * 150 - 95);
  const tape = WASHI_TAPES[Math.floor(Math.random() * WASHI_TAPES.length)];
  const tapeDeg = (Math.random() * 28 - 14).toFixed(1);
  const jitterClass =
    (slotIndex + uidCounter) % 2 === 0 ? '-translate-y-2' : 'translate-y-2';
  const stackShift = STACK_OFFSETS[(slotIndex + uidCounter) % STACK_OFFSETS.length];
  const stackZ = 1 + ((slotIndex * 3 + uidCounter) % 8);

  return {
    ...landmark,
    uid: `slot-${slotIndex}-${uidCounter}`,
    landRot: `${landDeg}deg`,
    throwRot: `${throwDeg}deg`,
    throwX: `${throwX}px`,
    throwY: `${throwY}px`,
    tape,
    tapeRot: `${tapeDeg}deg`,
    dropDelayMs,
    tapeDelayMs: dropDelayMs + 420,
    jitterClass,
    stackShift,
    stackZ,
  };
}

const PolaroidCardView: React.FC<{
  card: PolaroidTileBase;
  isBackground?: boolean;
}> = ({ card, isBackground = false }) => (
  <div
    style={
      isBackground
        ? { transform: `rotate(${card.landRot})` }
        : ({
            '--land-rot': card.landRot,
            '--throw-rot': card.throwRot,
            '--throw-x': card.throwX,
            '--throw-y': card.throwY,
            animationDelay: `${card.dropDelayMs}ms`,
          } as React.CSSProperties)
    }
    className={`${
      isBackground
        ? 'absolute inset-0 z-0 opacity-95'
        : 'polaroid-throw relative z-10'
    } bg-white p-2.5 pb-7 sm:p-3.5 sm:pb-10 rounded-[4px] shadow-[0_20px_44px_rgba(15,23,42,0.34)] border border-white/85 ${card.jitterClass}`}
  >
    <div
      style={
        isBackground
          ? {
              background: card.tape.background,
              transform: `rotate(${card.tapeRot})`,
            }
          : ({
              background: card.tape.background,
              '--tape-rot': card.tapeRot,
              animationDelay: `${card.tapeDelayMs}ms`,
            } as React.CSSProperties)
      }
      className={`${
        isBackground ? 'opacity-90' : 'tape-slap'
      } absolute ${card.tape.posClass} ${card.tape.widthClass} h-4 sm:h-5 z-20 shadow-sm pointer-events-none`}
    />
    <div
      className={`aspect-[4/3] w-full overflow-hidden bg-gradient-to-br ${card.fallbackGradient} relative`}
    >
      <img
        src={card.url}
        alt={card.name}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover"
      />
    </div>
    <div className="text-center font-handwritten text-lg sm:text-2xl text-slate-800 mt-2 leading-none truncate">
      {card.name.split(',')[0]} · {card.region.split('·')[0].trim()}
    </div>
  </div>
);

const HeroMosaic = () => {
  const uidCounterRef = React.useRef(100);

  const [tiles, setTiles] = React.useState<PolaroidSlotState[]>(() => {
    const initialTwelve = shuffleArray(LANDMARK_POLAROIDS).slice(0, 12);
    const dropSlots = shuffleArray(Array.from({ length: 12 }, (_, i) => i));

    return initialTwelve.map((landmark, idx) =>
      buildPolaroidTile(landmark, idx, idx, dropSlots[idx] * 95)
    );
  });

  React.useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const timers = new Set<number>();
    let active = true;

    const scheduleSlotReplacement = (slotIdx: number) => {
      const waitMs = 15000 + Math.floor(Math.random() * 15000);
      const timerId = window.setTimeout(() => {
        timers.delete(timerId);
        if (!active) return;

        setTiles((prev) => {
          const usedNames = new Set(prev.map((t) => t.name));
          const reservePool = LANDMARK_POLAROIDS.filter(
            (item) => !usedNames.has(item.name)
          );
          const candidatePool =
            reservePool.length > 0
              ? reservePool
              : LANDMARK_POLAROIDS.filter(
                  (item) => item.name !== prev[slotIdx]?.name
                );

          const chosen =
            candidatePool[Math.floor(Math.random() * candidatePool.length)];
          const nextUid = ++uidCounterRef.current;
          const oldCard = prev[slotIdx];
          const { prevCard: _dropOldPrev, ...cleanOldCard } = oldCard;

          const newTile = buildPolaroidTile(chosen, slotIdx, nextUid, 0);
          newTile.prevCard = cleanOldCard;

          return prev.map((item, idx) => (idx === slotIdx ? newTile : item));
        });

        const clearPrevTimer = window.setTimeout(() => {
          timers.delete(clearPrevTimer);
          if (!active) return;
          setTiles((prev) =>
            prev.map((item, idx) => {
              if (idx !== slotIdx || !item.prevCard) return item;
              const { prevCard: _removed, ...rest } = item;
              return rest;
            })
          );
        }, 1050);
        timers.add(clearPrevTimer);

        scheduleSlotReplacement(slotIdx);
      }, waitMs);

      timers.add(timerId);
    };

    for (let i = 0; i < 12; i++) {
      scheduleSlotReplacement(i);
    }

    return () => {
      active = false;
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
    };
  }, []);

  return (
    <div
      className="absolute inset-0 -z-10 overflow-hidden select-none bg-transparent"
      aria-hidden="true"
    >
      {/* Wall-to-wall overlapping & casually stacked Polaroids behind the hero card */}
      <div className="absolute -inset-x-10 -inset-y-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2 p-1 sm:p-2 content-center">
        {tiles.map((card) => (
          <div
            key={card.uid.split('-').slice(0, 2).join('-')}
            style={{ zIndex: card.stackZ }}
            className={`relative -m-1.5 sm:-m-2.5 transition-transform duration-700 ${card.stackShift}`}
          >
            {card.prevCard && <PolaroidCardView card={card.prevCard} isBackground />}
            <PolaroidCardView key={card.uid} card={card} />
          </div>
        ))}
      </div>

      {/* Gentle center halo so hero CTA card stays ultra crisp without dulling the neon ombre */}
      <div className="absolute inset-0 z-20 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0.06)_55%,rgba(15,23,42,0.16)_100%)] pointer-events-none" />
    </div>
  );
};

const Navbar = ({ user, username, membershipTier, isAdmin, signingIn, onHome, onMyTrips, onOpenAdmin, onSignIn, onLogOut, activeTab, onUpgrade }: any) => (
  <nav className="sticky top-0 z-50 glass-panel shadow-sm border-b border-slate-200/60">
    <div className="max-w-7xl mx-auto px-6 sm:px-10">
      <div className="flex justify-between items-center h-20 gap-8">
        <button onClick={onHome} className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap shrink-0">
          <WhiskLogo size={40} className="drop-shadow-sm" />
          <span className="text-2xl font-black tracking-tight whisk-text-ombre">Whisk</span>
        </button>

        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={onHome}
            className={`text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'home'
                ? 'text-[var(--whisk-terracotta)] underline underline-offset-8 decoration-2'
                : 'text-slate-600 hover:text-[var(--whisk-navy)]'
            }`}
          >
            Discover
          </button>
          {user && (
            <button
              onClick={onMyTrips}
              className={`text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'my-trips'
                  ? 'text-[var(--whisk-terracotta)] underline underline-offset-8 decoration-2'
                  : 'text-slate-600 hover:text-[var(--whisk-navy)]'
              }`}
            >
              My Trips
            </button>
          )}
          <button
            onClick={onUpgrade}
            className="text-sm font-bold text-slate-600 hover:text-[var(--whisk-azure)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Whisk Passport
          </button>
          {isAdmin && onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="text-sm font-bold text-slate-700 hover:text-[var(--whisk-terracotta)] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[var(--whisk-terracotta)]" />
              Admin
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-3">
              {membershipTier === 'Wanderer' && (
                <button
                  onClick={onUpgrade}
                  className="hidden sm:inline-flex saffron-gradient text-white px-4 py-2 rounded-xl text-xs font-bold hover:opacity-95 transition-opacity shadow-sm items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5" /> Whisk Passport
                </button>
              )}
              <button
                onClick={onUpgrade}
                className="flex items-center gap-2 text-xs font-bold bg-white text-[var(--whisk-navy)] px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-colors border border-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Traveler'}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-[var(--whisk-terracotta)]" />
                )}
                <span className="max-w-[100px] truncate">{user.displayName?.split(' ')[0] || (username ? `@${username}` : 'Profile')}</span>
              </button>
              <button
                onClick={onLogOut}
                title="Sign out"
                aria-label="Sign out"
                className="p-2 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              disabled={signingIn}
              className="vibrant-gradient text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:opacity-95 transition-opacity shadow-[var(--shadow-orange)] flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
            >
              {signingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
              {signingIn ? 'Signing in...' : 'Sign In'}
            </button>
          )}
        </div>
      </div>
    </div>
  </nav>
);

const BlogFeed = ({ 
  posts, 
  onView, 
  showAll, 
  onToggleShowAll, 
  onCycle, 
  hasMultiple, 
  title = "Community Field Guides" 
}: { 
  posts: BlogPost[], 
  onView: (post: BlogPost) => void, 
  showAll: boolean,
  onToggleShowAll: () => void,
  onCycle: () => void,
  hasMultiple: boolean,
  title?: string 
}) => (
  <section className="py-20 relative transition-all duration-700">
    <div className="max-w-7xl mx-auto px-6 sm:px-10">
      <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] p-8 md:p-10 shadow-xl border-2 border-white flex flex-col md:flex-row justify-between items-center md:items-end mb-12 gap-8">
        <div className="text-center md:text-left">
          <div className="inline-flex items-center gap-2 text-[var(--whisk-terracotta)] text-xs font-bold uppercase tracking-widest mb-3">
            <BookOpen className="w-4 h-4" /> {title}
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-3 tracking-tighter text-[var(--whisk-navy)]">Expert Intel & Inspo</h2>
          <p className="text-slate-600 text-base md:text-lg font-medium max-w-2xl">Read up on the world's most vibrant spots before you go.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {hasMultiple && (
            <button 
              onClick={onCycle}
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-[var(--whisk-navy)] px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0"
              title="Randomize & cycle destinations"
              id="btn-cycle-destinations"
            >
              <Shuffle className="w-4 h-4 text-[var(--whisk-terracotta)]" />
              Cycle Destinations
            </button>
          )}
          {hasMultiple && (
            <button 
              onClick={onToggleShowAll}
              className="inline-flex items-center gap-2 vibrant-gradient hover:opacity-95 text-white px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer whitespace-nowrap shrink-0"
              id="btn-toggle-articles"
            >
              {showAll ? "Show Less" : "View More Guides"}
            </button>
          )}
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-10">
        {posts.map((post: BlogPost) => (
          <div key={post.id} className="bg-white rounded-[3rem] overflow-hidden shadow-2xl transition-all group cursor-pointer border-2 border-white animate-in fade-in duration-500" onClick={() => onView(post)}>
            <div className="relative h-72 overflow-hidden">
              <img src={post.imageUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={post.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"></div>
              <div className="absolute bottom-6 left-8 right-8 text-white">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest mb-1.5 opacity-95"><MapPin className="w-3.5 h-3.5" />{post.destination}</div>
                <h3 className="text-2xl font-black tracking-tight leading-tight">{post.title}</h3>
              </div>
            </div>
            <div className="p-8">
              <p className="text-slate-600 font-medium text-sm line-clamp-2 mb-6 leading-relaxed">{post.metaDescription}</p>
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                 <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-xl vibrant-gradient flex items-center justify-center text-white text-[10px] font-black shadow-md">W</div>
                     <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Whisk Team</span>
                 </div>
                 <span className="text-xs font-semibold text-slate-400 uppercase">{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const ActionSidebar = ({
  recommendations,
  destination,
  savedPlaceNames,
  onSavePlace,
  unlocked,
  onOpenPassport,
}: {
  recommendations: Recommendation[];
  destination: string;
  savedPlaceNames: Set<string>;
  onSavePlace: (place: {
    name: string;
    type: 'hotel' | 'tour' | 'restaurant' | 'flight' | 'place';
    destination: string;
    description: string;
    price?: string;
    availability?: string;
    affiliateUrl?: string;
    mapsUri?: string;
  }) => Promise<void>;
  unlocked: boolean;
  onOpenPassport: () => void;
}) => {
  const destinationQuery = encodeURIComponent(destination);

  if (!unlocked) {
    return (
      <div className="sticky top-24 space-y-8">
        <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-xl border border-[#E05A47]/25 space-y-6">
          <div className="flex items-center gap-3">
            <div className="vibrant-gradient p-3 rounded-2xl text-white shadow-md">
              <LockKeyhole className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[var(--whisk-navy)] tracking-tight">Partner Bookings Locked</h3>
              <p className="text-xs font-bold text-slate-400">Included with Whisk Passport</p>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Your free trip preview includes the first half of the itinerary schedule. Unlock with <strong>Whisk Passport</strong> to reveal all <strong>{recommendations.length} curated hotels, tours, restaurants</strong>, plus direct affiliate deals and the Commuter Hub.
          </p>

          <div className="space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
              <Hotel className="w-4 h-4 text-[#E05A47]" /> Boutique stays & nightly rate intel
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
              <Utensils className="w-4 h-4 text-[#F59E0B]" /> Verified local restaurants & tours
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
              <Car className="w-4 h-4 text-[#0284C7]" /> Commuter Hub (rideshare & car rentals)
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenPassport}
            className="w-full vibrant-gradient text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-95 transition-opacity shadow-[var(--shadow-orange)] cursor-pointer"
          >
            <Crown className="w-4 h-4" /> Unlock Full Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-24 space-y-10">
      <div className="bg-white rounded-[3.5rem] p-8 md:p-10 shadow-2xl border-2 border-[#E05A47]/40 relative overflow-hidden">
        <h3 className="text-3xl font-black mb-8 flex items-center gap-4 text-[var(--whisk-navy)] tracking-tighter">Partner Bookings</h3>
        <div className="space-y-6 relative z-10">
          {recommendations.map((rec: Recommendation, i: number) => {
            const isSaved = savedPlaceNames.has(rec.name.toLowerCase());
            return (
              <div key={i} className="bg-slate-50 rounded-3xl p-6 hover:bg-white hover:shadow-lg transition-all group border border-slate-100 hover:border-[#E05A47]/20">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="vibrant-gradient p-2.5 rounded-xl shadow-md text-white">
                      {rec.type === 'hotel' ? <Hotel className="w-5 h-5" /> : rec.type === 'restaurant' ? <Utensils className="w-5 h-5" /> : rec.type === 'flight' ? <Plane className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--whisk-terracotta)]">{rec.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {rec.price && (
                      <span className="text-xs font-bold text-[var(--whisk-azure)] tabular-nums">
                        {rec.price}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        onSavePlace({
                          name: rec.name,
                          type: rec.type,
                          destination,
                          description: rec.description,
                          price: rec.price,
                          availability: rec.availability,
                          affiliateUrl: rec.affiliateUrl,
                        })
                      }
                      title={isSaved ? 'Saved to My Places' : 'Save favorite place'}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        isSaved
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-white text-slate-400 hover:text-[var(--whisk-fuchsia)]'
                      }`}
                    >
                      {isSaved ? <Check className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <h4 className="font-black text-lg mb-1.5 tracking-tight text-[var(--whisk-navy)] leading-snug">{rec.name}</h4>
                {rec.availability && (
                  <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-slate-500">
                    <AlertCircle className="w-3.5 h-3.5 text-[var(--whisk-saffron)]" />
                    {rec.availability}
                  </div>
                )}
                <p className="text-slate-500 text-sm mb-5 leading-relaxed font-medium line-clamp-2">{rec.description}</p>
                <a href={rec.affiliateUrl} target="_blank" rel="noopener noreferrer" className="w-full vibrant-gradient text-white py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-95 transition-opacity shadow-md">
                  Book Partner <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-[var(--whisk-navy)] rounded-[3rem] p-8 md:p-10 shadow-2xl text-white">
        <h3 className="text-2xl font-black mb-6 flex items-center gap-3 tracking-tighter"><Car className="text-[var(--whisk-saffron)] w-7 h-7" />Commuter Hub</h3>
        <div className="space-y-3">
          <a href="https://uber.com" target="_blank" rel="noopener noreferrer" className="w-full bg-white/10 text-white p-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-between hover:bg-white/20 transition-colors">Uber Anywhere <ArrowRight className="w-4 h-4" /></a>
          <a href={`https://kayak.com/cars/${destinationQuery}`} target="_blank" rel="noopener noreferrer" className="w-full cyan-gradient text-white p-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-between hover:opacity-95 transition-opacity">Rent a Car <ArrowRight className="w-4 h-4" /></a>
        </div>
      </div>
      <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-xl border border-slate-200/80 space-y-5">
        <div className="flex items-center gap-3">
          <div className="saffron-gradient p-2.5 rounded-xl text-white shadow-sm">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-lg text-[var(--whisk-navy)] tracking-tight">Traveler Essentials</h4>
            <p className="text-xs font-bold text-slate-400">Mobile Data & Airport Lounges</p>
          </div>
        </div>
        <div className="space-y-3">
          <a
            href="https://airalo.tp.st/kU2qA8i9"
            target="_blank"
            rel="noopener noreferrer"
            className="group block p-4 rounded-2xl bg-slate-50 hover:bg-sky-50 border border-slate-100 hover:border-sky-200 transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black uppercase tracking-wider text-[var(--whisk-azure)]">eSIM Mobile Data</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[var(--whisk-azure)]" />
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Instant 4G/5G data for {destination.split(',')[0]}. Skip expensive international roaming fees.
            </p>
          </a>
          <a
            href="https://prioritypass.tp.st/u5mG3P8m"
            target="_blank"
            rel="noopener noreferrer"
            className="group block p-4 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-100 hover:border-amber-200 transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black uppercase tracking-wider text-amber-700">VIP Airport Lounge</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-700" />
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Relax before your flight with complimentary food, quiet workstations, and fast Wi-Fi.
            </p>
          </a>
        </div>
      </div>
    </div>
  );
};

function formatGuideMarkdownHtml(rawContent: string): string {
  const escaped = rawContent
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const lines = escaped.split(/\r?\n/);
  const blocks: string[] = [];
  let inList = false;

  const formatInline = (text: string) =>
    text
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-[var(--whisk-navy)]">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (inList) {
        blocks.push('</ul>');
        inList = false;
      }
      continue;
    }

    if (line.startsWith('### ')) {
      if (inList) {
        blocks.push('</ul>');
        inList = false;
      }
      blocks.push(
        `<h3 class="text-2xl font-black tracking-tight text-[var(--whisk-navy)] mt-8 mb-3">${formatInline(line.slice(4))}</h3>`
      );
    } else if (line.startsWith('## ')) {
      if (inList) {
        blocks.push('</ul>');
        inList = false;
      }
      blocks.push(
        `<h2 class="text-3xl font-black tracking-tight text-[var(--whisk-navy)] mt-10 mb-4">${formatInline(line.slice(3))}</h2>`
      );
    } else if (line.startsWith('&gt; ')) {
      if (inList) {
        blocks.push('</ul>');
        inList = false;
      }
      blocks.push(
        `<blockquote class="border-l-4 border-[var(--whisk-orange)] bg-amber-50/70 p-6 my-6 text-lg font-bold italic text-slate-700 rounded-2xl">${formatInline(line.slice(5))}</blockquote>`
      );
    } else if (line.startsWith('* ') || line.startsWith('- ')) {
      if (!inList) {
        blocks.push('<ul class="list-disc pl-6 space-y-2.5 my-5 text-slate-600 text-lg leading-relaxed">');
        inList = true;
      }
      blocks.push(`<li class="font-medium">${formatInline(line.slice(2))}</li>`);
    } else {
      if (inList) {
        blocks.push('</ul>');
        inList = false;
      }
      blocks.push(`<p class="text-lg text-slate-600 leading-relaxed font-medium my-4">${formatInline(line)}</p>`);
    }
  }

  if (inList) {
    blocks.push('</ul>');
  }

  return blocks.join('\n');
}

const BlogPostDisplay = ({
  post,
  itinerary,
  hasActiveSubscription,
  onBack,
  savedPlaceNames,
  onSavePlace,
  onOpenPassport,
  onPlanDestination,
}: {
  post: BlogPost;
  itinerary?: TripItinerary | null;
  hasActiveSubscription: boolean;
  onBack: () => void;
  savedPlaceNames: Set<string>;
  onSavePlace: any;
  onOpenPassport: () => void;
  onPlanDestination: (destination: string) => void;
}) => {
  const [guideCopied, setGuideCopied] = React.useState(false);
  const contentHtml = React.useMemo(
    () =>
      post.content
        ? formatGuideMarkdownHtml(post.content)
        : '<p class="text-lg text-slate-600">Explore our local route guide and neighborhood highlights.</p>',
    [post.content]
  );

  const wordCount = React.useMemo(
    () => (post.content ? post.content.trim().split(/\s+/).length : 180),
    [post.content]
  );
  const readMinutes = Math.max(2, Math.ceil(wordCount / 180));
  const destinationCity = post.destination.split(',')[0].trim();
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?guide=${post.id || encodeURIComponent(post.destination)}`
    : 'https://whisk.colemanholdingsllc.com';

  const whatsappText = `✈️ Checking out the ${destinationCity} route guide on Whisk:\n${shareUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;
  const smsUrl = `sms:?&body=${encodeURIComponent(whatsappText)}`;

  const handleCopyGuide = () => {
    const cleanSummary = [
      `✈️ ${post.title}`,
      `📍 Destination: ${post.destination}`,
      post.geoSummary ? `\n${post.geoSummary}\n` : '',
      `Explore & personalize this route on Whisk: ${shareUrl}`
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(cleanSummary);
    setGuideCopied(true);
    setTimeout(() => setGuideCopied(false), 2500);
  };

  return (
    <article className="max-w-7xl mx-auto px-6 sm:px-10 py-14 animate-in fade-in duration-500">
      <button onClick={onBack} className="flex items-center gap-2 font-black text-sm uppercase tracking-widest text-[var(--whisk-orange)] hover:-translate-x-1 transition-transform mb-8 cursor-pointer">
        <ChevronRight className="w-5 h-5 rotate-180" /> Back to Explore
      </button>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 bg-white rounded-[3rem] shadow-2xl border-4 border-white overflow-hidden">
          <img src={post.imageUrl} referrerPolicy="no-referrer" className="w-full h-[380px] object-cover" alt={post.title} />
          <div className="p-8 sm:p-14">
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2 text-[var(--whisk-terracotta)] font-bold text-xs uppercase tracking-wider mb-3">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{post.destination}</span>
                <span>·</span>
                <span>{readMinutes} min read</span>
                {post.geoCoordinates && (
                  <>
                    <span>·</span>
                    <span className="tabular-nums text-slate-500">
                      {post.geoCoordinates.latitude.toFixed(3)}, {post.geoCoordinates.longitude.toFixed(3)}
                    </span>
                  </>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-black whisk-text-ombre tracking-tight leading-tight">
                {post.title}
              </h1>
            </div>

            {/* 1-Click Group Handoff Bar */}
            <div className="flex flex-wrap items-center gap-2.5 py-4 mb-8 border-y border-slate-100 text-xs">
              <span className="font-black uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-[var(--whisk-azure)]" /> Group Handoff:
              </span>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
              <a
                href={smsUrl}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" /> iMessage / SMS
              </a>
              <button
                type="button"
                onClick={handleCopyGuide}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold transition-colors cursor-pointer"
              >
                {guideCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {guideCopied ? 'Copied Clean Route!' : 'Copy for Notion / Notes'}
              </button>
            </div>

            {/* Make This Route Yours Banner */}
            <div className="bg-gradient-to-r from-orange-50/90 via-amber-50/80 to-rose-50/90 border-2 border-orange-200/90 rounded-3xl p-6 sm:p-7 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xs">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[var(--whisk-orange)]">
                  <Sparkles className="w-3.5 h-3.5" /> Make This Route Yours ✨
                </div>
                <h3 className="text-xl font-black text-[var(--whisk-navy)] tracking-tight">
                  Personalize This Route for Your Dates & Pace
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xl leading-relaxed">
                  Adopt this curated {destinationCity} field guide into a full day-by-day itinerary tailored to your departure airport, travel style, and natural energy curve.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onPlanDestination(post.destination)}
                className="vibrant-gradient text-white py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-95 transition-opacity shadow-[var(--shadow-orange)] cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plane className="w-4 h-4" /> Personalize This Route ✈️
              </button>
            </div>

            <p className="text-lg text-slate-500 font-medium italic mb-8">{post.metaDescription}</p>

            {post.geoSummary && (
              <section className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 mb-8">
                <div className="text-xs font-black uppercase tracking-widest text-[var(--whisk-azure)] mb-2 flex items-center gap-2">
                  <Compass className="w-4 h-4" /> Local Snapshot
                </div>
                <p className="text-slate-700 text-base font-medium leading-relaxed">{post.geoSummary}</p>
              </section>
            )}

            {post.neighborhoods && post.neighborhoods.length > 0 && (
              <div className="text-xs font-bold text-slate-500 mb-8 pb-6 border-b border-slate-100">
                <span className="uppercase tracking-wider text-slate-400 mr-2">Key Neighborhoods:</span>
                <span className="text-[var(--whisk-navy)]">{post.neighborhoods.join(' · ')}</span>
              </div>
            )}

            <div className="max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: contentHtml }} />

            {post.faqs && post.faqs.length > 0 && (
              <section className="mt-12 pt-10 border-t border-slate-100">
                <h2 className="text-2xl font-black text-[var(--whisk-navy)] tracking-tight mb-6">
                  Travelers Also Ask
                </h2>
                <div className="space-y-4">
                  {post.faqs.map((faq, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                      <h3 className="font-bold text-base text-[var(--whisk-navy)] mb-1.5">{faq.question}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {post.keywords && post.keywords.length > 0 && (
              <footer className="mt-10 pt-6 border-t border-slate-100 text-xs font-semibold text-slate-400">
                Topics: {post.keywords.join(' · ')}
              </footer>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="sticky top-24 space-y-6">
            <div className="bg-white rounded-[3rem] p-8 sm:p-10 shadow-2xl border-2 border-white space-y-5">
              <div className="vibrant-gradient w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md">
                <Plane className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-[var(--whisk-navy)] tracking-tight">
                Plan Your Custom {destinationCity} Trip
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Build a private day-by-day itinerary tailored to your departure city, pace, budget, and natural traveler energy curve.
              </p>
              <button
                type="button"
                onClick={() => onPlanDestination(post.destination)}
                className="w-full vibrant-gradient text-white py-4 px-5 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-95 transition-opacity shadow-[var(--shadow-orange)] cursor-pointer"
              >
                Personalize {destinationCity} Route <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Traveler Essentials / High-Margin Passive Revenue Card */}
            <div className="bg-white rounded-[3rem] p-8 shadow-xl border-2 border-white space-y-4">
              <div className="flex items-center gap-3">
                <div className="cyan-gradient p-2.5 rounded-xl text-white shadow-sm">
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-base text-[var(--whisk-navy)] tracking-tight">Traveler Essentials</h4>
                  <p className="text-[11px] font-bold text-slate-400">Mobile Data & Airport Lounges</p>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <a
                  href="https://airalo.tp.st/kU2qA8i9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block p-3.5 rounded-2xl bg-slate-50 hover:bg-sky-50 border border-slate-100 hover:border-sky-200 transition-all"
                >
                  <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-[var(--whisk-azure)] mb-1">
                    <span>{destinationCity} eSIM Data</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[var(--whisk-azure)]" />
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Instant 4G/5G mobile connectivity without expensive international roaming fees.
                  </p>
                </a>
                <a
                  href="https://prioritypass.tp.st/u5mG3P8m"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block p-3.5 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-100 hover:border-amber-200 transition-all"
                >
                  <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-amber-700 mb-1">
                    <span>VIP Airport Lounges</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-700" />
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Quiet flight departure lounge passes with complimentary refreshments & fast Wi-Fi worldwide.
                  </p>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export type PassportPlan = 'Single' | 'Monthly' | 'Annual';

const WhiskPassportModal = ({
  isOpen,
  onClose,
  onSelectPlan,
  onOpenLegalDoc,
  promptReason,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: PassportPlan) => Promise<void>;
  onOpenLegalDoc: (docId: LegalDocId) => void;
  promptReason?: string | null;
}) => {
  const [submittingPlan, setSubmittingPlan] = React.useState<PassportPlan | null>(null);
  if (!isOpen) return null;

  const plans: Array<{
    key: PassportPlan;
    name: string;
    price: string;
    cadence: string;
    badge?: string;
    accent: string;
    features: string[];
    icon: React.ReactNode;
  }> = [
    {
      key: 'Single',
      name: 'Single Trip',
      price: '$4.99',
      cadence: 'one-time unlock',
      accent: 'saffron-gradient',
      icon: <MapPin className="w-6 h-6" />,
      features: [
        'Unlock all days for 1 itinerary',
        'Reveal partner hotels, dining & tours',
        'Access Commuter Hub transfer links',
      ],
    },
    {
      key: 'Monthly',
      name: 'Monthly Passport',
      price: '$9.99',
      cadence: 'per month',
      accent: 'cyan-gradient',
      icon: <Compass className="w-6 h-6" />,
      features: [
        'Unlimited trip itineraries & all days',
        'All partner hotel, restaurant & tour deals',
        'Commuter Hub across every destination',
      ],
    },
    {
      key: 'Annual',
      name: 'Annual Passport',
      price: '$79.99',
      cadence: 'per year · save 33%',
      badge: 'Best Value',
      accent: 'vibrant-gradient',
      icon: <Crown className="w-6 h-6" />,
      features: [
        'Full year of unlimited itineraries',
        'Instant unlock on every day & booking',
        'Deep-reasoning route & packing toolkit',
      ],
    },
  ];

  const handleChoose = async (planKey: PassportPlan) => {
    setSubmittingPlan(planKey);
    try {
      await onSelectPlan(planKey);
    } finally {
      setSubmittingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 bg-[var(--whisk-navy)]/70 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-[2.5rem] w-full max-w-5xl shadow-2xl relative p-8 sm:p-12 my-8 border border-white">
        <button
          onClick={onClose}
          aria-label="Close Whisk Passport modal"
          className="absolute top-6 right-6 p-3 hover:bg-slate-100 rounded-2xl transition-colors cursor-pointer"
        >
          <X className="w-6 h-6 text-slate-500" />
        </button>

        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--whisk-terracotta)] mb-3">
            <Crown className="w-4 h-4" /> Whisk Passport
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[var(--whisk-navy)] tracking-tight text-balance mb-3">
            Unlock Every Day & Partner Booking
          </h2>
          <p className="text-slate-600 text-base font-medium">
            {promptReason ||
              'Go beyond your free preview—reveal full multi-day itineraries, vetted hotels, tours, dining, and Commuter Hub links immediately.'}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`rounded-3xl p-7 flex flex-col border transition-all bg-slate-50 ${
                plan.badge ? 'border-[#E05A47]/50 ring-2 ring-[#E05A47]/15' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className={`${plan.accent} text-white p-3.5 rounded-2xl shadow-md`}>
                  {plan.icon}
                </div>
                {plan.badge && (
                  <span className="text-xs font-bold text-[#059669]">
                    {plan.badge}
                  </span>
                )}
              </div>

              <h3 className="text-xl font-black text-[var(--whisk-navy)] mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-black text-[var(--whisk-terracotta)] tabular-nums">
                  {plan.price}
                </span>
                <span className="text-xs font-semibold text-slate-500">{plan.cadence}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm font-medium text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={submittingPlan !== null}
                onClick={() => handleChoose(plan.key)}
                className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider text-white ${plan.accent} shadow-md hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2`}
              >
                {submittingPlan === plan.key && <Loader2 className="w-4 h-4 animate-spin" />}
                Activate {plan.name}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500 font-medium leading-relaxed">
          By activating Whisk Passport, you acknowledge our{' '}
          <button
            type="button"
            onClick={() => onOpenLegalDoc('terms')}
            className="underline font-bold text-[var(--whisk-navy)] hover:text-[var(--whisk-terracotta)] cursor-pointer"
          >
            Terms of Service
          </button>
          ,{' '}
          <button
            type="button"
            onClick={() => onOpenLegalDoc('refunds')}
            className="underline font-bold text-[var(--whisk-navy)] hover:text-[var(--whisk-terracotta)] cursor-pointer"
          >
            Refund & Cancellation Policy
          </button>
          , and{' '}
          <button
            type="button"
            onClick={() => onOpenLegalDoc('disclaimer')}
            className="underline font-bold text-[var(--whisk-navy)] hover:text-[var(--whisk-terracotta)] cursor-pointer"
          >
            Travel Disclaimer
          </button>
          .
        </p>
      </div>
    </div>
  );
};

const LegalFooter = ({
  onOpenLegalDoc,
  onOpenAdmin,
  compact = false,
}: {
  onOpenLegalDoc: (docId: LegalDocId) => void;
  onOpenAdmin?: () => void;
  compact?: boolean;
}) => (
  <footer className={`bg-[var(--whisk-navy)] text-white ${compact ? 'py-16 mt-20' : 'py-24'}`}>
    <div className="max-w-7xl mx-auto px-6 sm:px-10 text-center space-y-8">
      <div className="flex items-center justify-center gap-4">
        <WhiskLogo size={48} className="drop-shadow-md" />
        <span className="text-3xl font-black tracking-tight uppercase">Whisk</span>
      </div>

      <nav
        aria-label="Legal and Privacy"
        className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-bold text-slate-300"
      >
        {LEGAL_DOCUMENTS.map((docItem) => (
          <a
            key={docItem.id}
            href={docItem.path}
            onClick={(e) => {
              e.preventDefault();
              onOpenLegalDoc(docItem.id);
            }}
            className="hover:text-white underline-offset-4 hover:underline transition-colors py-1"
          >
            {docItem.title === 'Cookie Policy' ? 'Cookie Policy & Privacy Choices' : docItem.title}
          </a>
        ))}
        <a
          href="mailto:privacy@whisk.travel"
          className="text-amber-300 hover:text-amber-200 underline-offset-4 hover:underline transition-colors py-1"
        >
          privacy@whisk.travel
        </a>
        {onOpenAdmin && (
          <a
            href="/admin"
            onClick={(e) => {
              e.preventDefault();
              onOpenAdmin();
            }}
            className="text-slate-400 hover:text-white underline-offset-4 hover:underline transition-colors py-1"
          >
            Admin Portal
          </a>
        )}
      </nav>

      <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">
        © 2026 Whisk, Inc. · Curated World Adventures · California, USA
      </div>
    </div>
  </footer>
);

const LANDMARK_QUICK_FACTS: string[] = [
  'The Eiffel Tower grows up to 15 cm taller in summer as its wrought-iron lattice expands in the heat.',
  'Senso-ji in Asakusa was founded in 645 AD, making it Tokyo’s oldest Buddhist temple.',
  'Positano’s vertical cliffside homes were once painted bright pastels so fishermen could spot them from sea.',
  'Oia’s whitewashed cave houses stay cool naturally thanks to thick volcanic pumice walls.',
  'Marrakech is nicknamed the Red City for the sun-baked red clay walls built around the medina in 1122.',
  'Zermatt has been strictly car-free since 1961—only electric shuttles and mountain trains circulate in town.',
  'Rome’s Colosseum could seat 50,000 spectators and featured a retractable canvas awning called the velarium.',
  'Machu Picchu’s Inca stone walls were carved so precisely that not even a knife blade fits between them.',
  'The Taj Mahal’s four minarets lean slightly outward so an earthquake would send them away from the central tomb.',
  'Petra’s rose-red Treasury was carved directly into sandstone cliffs by the Nabataeans over 2,000 years ago.',
  'Rio de Janeiro’s Sugarloaf cable car has carried visitors above Guanabara Bay since 1912.',
  'The Great Pyramid of Giza stood as the tallest human-made structure on Earth for more than 3,800 years.',
  'Chureito Pagoda sits 398 steps above Fujiyoshida and frames Mount Fuji directly across the valley.',
  'Antoni Gaudí originally designed Barcelona’s Park Güell as a hillside garden neighborhood of 60 homes.',
  'Bali’s Ulun Danu Beratan Temple sits on Lake Bratan at 1,200 meters and honors the goddess of water.',
  'Iceland’s Kirkjufell is a 463-meter-high freestanding peak sculpted by glaciers during the last Ice Age.',
  'Venice’s Grand Canal curves in an S-shape for 3.8 km and is crossed by only four bridges.',
  'When the Brooklyn Bridge opened in 1883, it was the longest suspension bridge in the world.',
  'Cape Town’s Bo-Kaap neighborhood was painted in vibrant hues by residents celebrating emancipation.',
  'The Sydney Opera House roof is covered in over one million self-cleaning glossy Swedish ceramic tiles.',
];

const LOADING_PHOTOS = LANDMARK_POLAROIDS.map((p, idx) => ({
  image: p.url,
  location: p.name,
  fact: LANDMARK_QUICK_FACTS[idx % LANDMARK_QUICK_FACTS.length],
}));

const ItinerarySkeleton = ({ statusText }: { statusText: string }) => {
  const [photoIndex, setPhotoIndex] = React.useState(0);
  const [fadeState, setFadeState] = React.useState<'in' | 'out'>('in');
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const slideDuration = 4200;
    const updateRate = 50;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += updateRate;
      setProgress(Math.min((elapsed / slideDuration) * 100, 100));

      if (elapsed >= slideDuration) {
        setFadeState('out');
        setTimeout(() => {
          setPhotoIndex((prev) => (prev + 1) % LOADING_PHOTOS.length);
          setFadeState('in');
          setProgress(0);
        }, 350);
        elapsed = 0;
      }
    }, updateRate);

    return () => clearInterval(timer);
  }, [photoIndex]);

  const handleNext = () => {
    setFadeState('out');
    setTimeout(() => {
      setPhotoIndex((prev) => (prev + 1) % LOADING_PHOTOS.length);
      setFadeState('in');
      setProgress(0);
    }, 220);
  };

  const handlePrev = () => {
    setFadeState('out');
    setTimeout(() => {
      setPhotoIndex((prev) => (prev - 1 + LOADING_PHOTOS.length) % LOADING_PHOTOS.length);
      setFadeState('in');
      setProgress(0);
    }, 220);
  };

  const activePhoto = LOADING_PHOTOS[photoIndex];

  return (
    <div className="min-h-screen whisk-ombre-bg flex flex-col items-center justify-center px-4 py-8 sm:p-10 relative overflow-hidden">
      <div className="w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl border-2 border-white overflow-hidden flex flex-col relative z-10">
        {/* Compact Header */}
        <div className="px-6 py-4 flex items-center justify-between gap-4 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
              <WhiskLogo size={38} className="drop-shadow-xs" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-black tracking-tight whisk-text-ombre truncate">
                Building Your Itinerary
              </h3>
              <p className="text-xs font-semibold text-slate-500 truncate">
                {statusText || 'Putting your stops and bookings together...'}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400 tabular-nums whitespace-nowrap shrink-0">
            {photoIndex + 1} / {LOADING_PHOTOS.length}
          </span>
        </div>

        {/* 90% Photo : 10% Quick Fact Visual Container */}
        <div className="flex flex-col h-[500px] sm:h-[560px]">
          {/* 90% Photo Viewport */}
          <div className="relative flex-[9] min-h-0 w-full overflow-hidden bg-slate-900">
            <img
              src={activePhoto.image}
              alt={activePhoto.location}
              className={`w-full h-full object-cover transition-all duration-500 ${
                fadeState === 'out' ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
              }`}
            />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 via-black/20 to-transparent pointer-events-none" />

            <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-white">
                <MapPin className="w-4 h-4 text-[var(--whisk-cyan)] shrink-0" />
                <span className="font-extrabold tracking-tight text-sm sm:text-base drop-shadow">
                  {activePhoto.location}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous photo"
                  className="p-2 bg-black/45 hover:bg-black/65 text-white rounded-full backdrop-blur-xs transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next photo"
                  className="p-2 bg-black/45 hover:bg-black/65 text-white rounded-full backdrop-blur-xs transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 10% Quick Fact Strip */}
          <div className="flex-[1] min-h-[58px] bg-white px-6 py-3 flex flex-col justify-center border-t border-slate-100">
            <p
              className={`text-xs sm:text-sm font-semibold text-[var(--whisk-navy)] leading-snug line-clamp-2 transition-opacity duration-300 ${
                fadeState === 'out' ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {activePhoto.fact}
            </p>
          </div>
        </div>

        {/* Slim Progress Line */}
        <div className="w-full bg-slate-100 h-1 overflow-hidden">
          <div
            className="h-full vibrant-gradient transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

function matchRecommendationsToDays(itinerary: TripItinerary): Map<number, Recommendation[]> {
  const byDay = new Map<number, Recommendation[]>();
  const days = itinerary.days || [];
  for (const d of days) {
    byDay.set(d.dayNumber, []);
  }
  if (days.length === 0) return byDay;

  const firstDayNum = days[0].dayNumber;
  const assigned = new Set<number>();

  (itinerary.recommendations || []).forEach((rec, recIdx) => {
    const explicitDays = Array.isArray(rec.dayNumbers)
      ? rec.dayNumbers.filter((n) => byDay.has(n))
      : [];

    if (explicitDays.length > 0) {
      explicitDays.forEach((dNum) => byDay.get(dNum)!.push(rec));
      assigned.add(recIdx);
      return;
    }

    if (rec.type === 'flight' || rec.type === 'hotel') {
      byDay.get(firstDayNum)!.push(rec);
      assigned.add(recIdx);
      return;
    }

    // Fallback: match recommendation name against activity location or description
    const recTokens = rec.name
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4);

    let matchedDay: number | null = null;
    for (const day of days) {
      const hay = `${day.theme} ${(day.activities || [])
        .map((a) => `${a.location} ${a.description}`)
        .join(' ')}`.toLowerCase();
      if (
        hay.includes(rec.name.toLowerCase()) ||
        (recTokens.length > 0 && recTokens.some((tok) => hay.includes(tok)))
      ) {
        matchedDay = day.dayNumber;
        break;
      }
    }

    if (matchedDay !== null) {
      byDay.get(matchedDay)!.push(rec);
      assigned.add(recIdx);
    }
  });

  // Distribute any remaining unmatched tours/restaurants evenly across days so none are orphaned
  let cursor = 0;
  (itinerary.recommendations || []).forEach((rec, recIdx) => {
    if (!assigned.has(recIdx)) {
      const targetDay = days[cursor % days.length].dayNumber;
      byDay.get(targetDay)!.push(rec);
      cursor += 1;
    }
  });

  return byDay;
}

function matchSourcesToDay(
  day: DayPlan,
  sources: GroundingSource[]
): GroundingSource[] {
  if (!sources.length) return [];
  const dayText = `${day.theme} ${(day.activities || [])
    .map((a) => `${a.location} ${a.description}`)
    .join(' ')}`.toLowerCase();

  const matched = sources.filter((src) => {
    const titleWords = (src.title || '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4);
    return titleWords.some((w) => dayText.includes(w));
  });

  return matched.slice(0, 4);
}

const ItineraryDisplay = ({ 
  itinerary,
  hasActiveSubscription,
  onUnlock,
  savedPlaceNames,
  onSavePlace,
  onCoordinatesHydrated,
}: { 
  itinerary: TripItinerary;
  hasActiveSubscription: boolean;
  onRateActivity: any; 
  onRateOverall: any; 
  onUnlock: () => void; 
  savedPlaceNames: Set<string>;
  onSavePlace: any;
  onCoordinatesHydrated?: (itineraryId: string, updatedDays: DayPlan[]) => void;
}) => {
  const [selectedMapDay, setSelectedMapDay] = React.useState<number | 'all'>('all');
  const [itineraryCopied, setItineraryCopied] = React.useState(false);
  const allSources = itinerary.groundingSources || [];
  const mapsSources = allSources.filter((s: GroundingSource) => s.sourceType === 'maps');
  const isUnlocked = Boolean(itinerary.unlocked || hasActiveSubscription);
  const freeVisibleCount = itinerary.days.length <= 1 ? 1 : Math.max(1, Math.floor(itinerary.days.length / 2));

  const dayBookingsMap = React.useMemo(
    () => matchRecommendationsToDays(itinerary),
    [itinerary]
  );

  const dayNumbers = React.useMemo(
    () => (itinerary.days || []).map((d) => d.dayNumber),
    [itinerary.days]
  );

  const jumpToDay = (dayNum: number) => {
    setSelectedMapDay(dayNum);
    const el = document.getElementById(`itinerary-day-${dayNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const buildActivityMapsUrl = (activity: TripItinerary['days'][number]['activities'][number]) => {
    if (activity.mapsUri) return activity.mapsUri;
    const matchedMap = mapsSources.find((m) =>
      m.title.toLowerCase().includes(activity.location.toLowerCase()) ||
      activity.location.toLowerCase().includes(m.title.toLowerCase())
    );
    if (matchedMap?.uri) return matchedMap.uri;
    const query = encodeURIComponent(
      activity.formattedAddress || `${activity.location}, ${itinerary.destination}`
    );
    if (activity.placeId) {
      return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${encodeURIComponent(activity.placeId)}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-10 py-16 animate-in slide-in-from-bottom-10 duration-700">
       <div className="mb-14 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 text-[var(--whisk-terracotta)] text-xs font-bold uppercase tracking-widest mb-4">
            <Compass className="w-4 h-4" />
            <span>Private Whisk Itinerary</span>
            {formatTripDateRange(itinerary.startDate, itinerary.endDate) && (
              <>
                <span aria-hidden="true">·</span>
                <span>{formatTripDateRange(itinerary.startDate, itinerary.endDate)}</span>
              </>
            )}
            {itinerary.departureAirport && (
              <>
                <span aria-hidden="true">·</span>
                <span>From {itinerary.departureAirport}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>{isUnlocked ? 'Full Access Unlocked' : `Free Preview (${freeVisibleCount} of ${itinerary.days.length} days)`}</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black whisk-text-ombre mb-6 tracking-tighter leading-tight text-balance">
            {itinerary.title}
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 font-medium max-w-3xl mx-auto leading-relaxed italic">
            "{itinerary.summary}"
          </p>
       </div>

       {/* Elegant Group Handoff Bar */}
       <div className="max-w-4xl mx-auto -mt-6 mb-12 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-lg flex flex-wrap items-center justify-between gap-4 text-xs">
         <div className="flex items-center gap-2 font-black uppercase tracking-wider text-[var(--whisk-navy)]">
           <Share2 className="w-4 h-4 text-[var(--whisk-orange)]" />
           <span>Group Handoff:</span>
         </div>
         <div className="flex flex-wrap items-center gap-2">
           <a
             href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
               `✈️ ${itinerary.title}\n📍 Destination: ${itinerary.destination}\n\n"${itinerary.summary}"\n\nPlan with Whisk: https://whisk.colemanholdingsllc.com`
             )}`}
             target="_blank"
             rel="noopener noreferrer"
             className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold transition-colors"
           >
             <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
           </a>
           <a
             href={`sms:?&body=${encodeURIComponent(
               `✈️ ${itinerary.title}\n📍 Destination: ${itinerary.destination}\n\n"${itinerary.summary}"\n\nPlan with Whisk: https://whisk.colemanholdingsllc.com`
             )}`}
             className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold transition-colors"
           >
             <MessageSquare className="w-3.5 h-3.5" /> iMessage / SMS
           </a>
           <button
             type="button"
             onClick={() => {
               const cleanSummary = [
                 `✈️ ${itinerary.title}`,
                 `📍 Destination: ${itinerary.destination}`,
                 itinerary.startDate && itinerary.endDate ? `📅 Dates: ${formatTripDateRange(itinerary.startDate, itinerary.endDate)}` : '',
                 itinerary.summary ? `\n"${itinerary.summary}"\n` : '',
                 ...itinerary.days.map((d) => 
                   `Day ${d.dayNumber}: ${d.theme}\n` +
                   d.activities.map((a) => `• [${a.time}] ${a.location}${a.neighborhood ? ` (${a.neighborhood})` : ''}: ${a.description}${a.walkTime ? ` [🚶 ${a.walkTime}]` : ''}`).join('\n')
                 ),
                 `\nCurated by Whisk: https://whisk.colemanholdingsllc.com`
               ].filter(Boolean).join('\n');
               navigator.clipboard.writeText(cleanSummary);
               setItineraryCopied(true);
               setTimeout(() => setItineraryCopied(false), 2500);
             }}
             className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold transition-colors cursor-pointer"
           >
             {itineraryCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
             {itineraryCopied ? 'Copied Clean Route!' : 'Copy for Notion / Notes'}
           </button>
           <button
             type="button"
             onClick={() => window.print()}
             className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold transition-colors cursor-pointer"
           >
             <Printer className="w-3.5 h-3.5" /> Print / PDF
           </button>
         </div>
       </div>

       <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <ItineraryMap
              itinerary={itinerary}
              onCoordinatesHydrated={onCoordinatesHydrated}
              selectedDay={selectedMapDay}
              onSelectDay={(nextDay) => {
                setSelectedMapDay(nextDay);
                if (typeof nextDay === 'number') {
                  const el = document.getElementById(`itinerary-day-${nextDay}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
              }}
            />

            <WeatherForecast destination={itinerary.destination} />

            {itinerary.days.map((day, dIdx) => {
              const isDayLocked = !isUnlocked && dIdx >= freeVisibleCount;
              const dayBookings = dayBookingsMap.get(day.dayNumber) || [];
              const daySources = matchSourcesToDay(day, allSources);
              const prevDayNum = dIdx > 0 ? dayNumbers[dIdx - 1] : null;
              const nextDayNum = dIdx < dayNumbers.length - 1 ? dayNumbers[dIdx + 1] : null;
              const isFocusedDay = selectedMapDay === day.dayNumber;

              return (
              <div
                key={dIdx}
                id={`itinerary-day-${day.dayNumber}`}
                className={`bg-white rounded-[3rem] p-7 sm:p-12 shadow-xl border relative overflow-hidden transition-all scroll-mt-24 ${
                  isFocusedDay ? 'border-[var(--whisk-orange)] ring-2 ring-[var(--whisk-orange)]/15' : 'border-slate-100'
                }`}
              >
                 <div className="relative z-10">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-9">
                       <div className="flex items-center gap-4">
                          <div className="vibrant-gradient w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg tabular-nums shrink-0">
                             {day.dayNumber}
                          </div>
                          <div>
                             <div className="text-xs font-bold text-[var(--whisk-terracotta)] uppercase tracking-widest mb-1">
                               Day {day.dayNumber}
                               {formatTripDayDate(day.date) ? ` · ${formatTripDayDate(day.date)}` : ''}
                             </div>
                             <h2 className="text-2xl sm:text-3xl font-black text-[var(--whisk-navy)] tracking-tight">
                               {day.theme}
                             </h2>
                          </div>
                       </div>

                       <button
                         type="button"
                         onClick={() => {
                           setSelectedMapDay(day.dayNumber);
                           window.scrollTo({ top: 180, behavior: 'smooth' });
                         }}
                         className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-bold text-[var(--whisk-navy)] cursor-pointer whitespace-nowrap shrink-0"
                       >
                         <MapPin className="w-3.5 h-3.5 text-[var(--whisk-orange)]" />
                         View Day {day.dayNumber} Route
                       </button>
                    </div>
                    
                    <div className={`space-y-8 transition-all duration-500 ${isDayLocked ? 'blur-md pointer-events-none select-none opacity-35' : ''}`}>
                       {day.activities.map((activity, aIdx) => {
                         const activityMapUrl = buildActivityMapsUrl(activity);
                         const isSpotSaved = savedPlaceNames.has(activity.location.toLowerCase());
                         return (
                           <div key={aIdx} className="flex gap-4 sm:gap-6 relative">
                              {aIdx < day.activities.length - 1 && (
                                <div className="absolute left-5 top-14 bottom-0 w-0.5 bg-slate-100" />
                              )}
                              <div className="bg-slate-50 p-3.5 rounded-2xl h-fit border border-slate-100 shrink-0">
                                 <Clock className="w-5 h-5 text-[var(--whisk-azure)]" />
                              </div>
                              <div className="flex-1 min-w-0 space-y-2">
                                 <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-bold text-[var(--whisk-azure)] uppercase tracking-wider">
                                          {activity.time}
                                        </span>
                                        {activity.energyLevel === 'morning_spark' && (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                                            <Zap className="w-3 h-3 text-amber-500" /> Morning Spark
                                          </span>
                                        )}
                                        {activity.energyLevel === 'recharge' && (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                            <Coffee className="w-3 h-3 text-emerald-600" /> Midday Recharge
                                          </span>
                                        )}
                                        {activity.energyLevel === 'golden_hour' && (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200/80">
                                            <Sun className="w-3 h-3 text-orange-500" /> Golden Hour
                                          </span>
                                        )}
                                        {activity.energyLevel === 'evening_unwind' && (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80">
                                            <Wine className="w-3 h-3 text-purple-500" /> Evening Unwind
                                          </span>
                                        )}
                                        {activity.walkTime && (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600">
                                            🚶 {activity.walkTime}
                                          </span>
                                        )}
                                        {activity.neighborhood && (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                                            📍 {activity.neighborhood}
                                          </span>
                                        )}
                                      </div>
                                      <h4 className="text-xl font-black text-[var(--whisk-navy)] tracking-tight">
                                        {activity.location}
                                      </h4>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onSavePlace({
                                          name: activity.location,
                                          type: 'place',
                                          destination: itinerary.destination,
                                          description: activity.insiderTip || activity.description,
                                          mapsUri: activityMapUrl,
                                        })
                                      }
                                      title={isSpotSaved ? 'Saved to My Places' : 'Save spot'}
                                      className={`p-2 rounded-xl transition-colors shrink-0 cursor-pointer ${
                                        isSpotSaved
                                          ? 'bg-emerald-100 text-emerald-700'
                                          : 'bg-slate-50 text-slate-400 hover:text-[var(--whisk-orange)]'
                                      }`}
                                    >
                                      {isSpotSaved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                                    </button>
                                 </div>

                                 <p className="text-slate-600 text-sm md:text-base font-medium leading-relaxed">
                                   {activity.description}
                                 </p>

                                 {/* Embedded Verified Maps Address + Local Intel right inside the activity */}
                                 <div className="bg-slate-50/90 border border-slate-100 rounded-2xl px-4 py-3 space-y-1.5 text-xs">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                       <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600 min-w-0">
                                          <MapPin className="w-3.5 h-3.5 text-[var(--whisk-orange)] shrink-0" />
                                          <span className="truncate">
                                            {activity.formattedAddress || `${activity.location}, ${itinerary.destination}`}
                                          </span>
                                       </span>
                                       <a
                                         href={activityMapUrl}
                                         target="_blank"
                                         rel="noopener noreferrer"
                                         className="inline-flex items-center gap-1 font-bold text-[var(--whisk-orange)] hover:underline whitespace-nowrap shrink-0"
                                       >
                                         Google Maps <ExternalLink className="w-3 h-3" />
                                       </a>
                                    </div>
                                    {activity.insiderTip && (
                                      <p className="text-slate-500 font-medium leading-relaxed">
                                        <span className="font-bold text-[var(--whisk-navy)]">Local intel: </span>
                                        {activity.insiderTip}
                                      </p>
                                    )}
                                 </div>
                              </div>
                           </div>
                         );
                       })}

                       {/* Inline Verified Search Sources matched to this Day */}
                       {daySources.length > 0 && (
                         <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-bold uppercase tracking-wider text-slate-400 mr-1">
                              Verified Intel:
                            </span>
                            {daySources.map((src, sIdx) => (
                              <a
                                key={sIdx}
                                href={src.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-50 text-sky-700 font-semibold hover:bg-sky-100 transition-colors"
                              >
                                <Globe className="w-3 h-3 shrink-0" />
                                <span className="max-w-[180px] truncate">{src.title}</span>
                                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                              </a>
                            ))}
                         </div>
                       )}

                       {/* Day-Attached Booking Partners */}
                       {dayBookings.length > 0 && (
                         <div className="pt-6 border-t border-slate-100 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                               <h3 className="text-xs font-black uppercase tracking-widest text-[var(--whisk-terracotta)]">
                                 Day {day.dayNumber} Partner Bookings
                               </h3>
                               {!isUnlocked && (
                                 <button
                                   type="button"
                                   onClick={onUnlock}
                                   className="text-xs font-bold text-[var(--whisk-terracotta)] hover:underline cursor-pointer"
                                 >
                                   Unlock with Whisk Passport
                                 </button>
                               )}
                            </div>

                            {isUnlocked ? (
                              <div className="grid sm:grid-cols-2 gap-3">
                                {dayBookings.map((rec, bIdx) => {
                                  const isSaved = savedPlaceNames.has(rec.name.toLowerCase());
                                  return (
                                    <div
                                      key={bIdx}
                                      className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 flex flex-col justify-between gap-3"
                                    >
                                      <div>
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[var(--whisk-terracotta)]">
                                            {rec.type === 'hotel' ? (
                                              <Hotel className="w-3.5 h-3.5" />
                                            ) : rec.type === 'restaurant' ? (
                                              <Utensils className="w-3.5 h-3.5" />
                                            ) : rec.type === 'flight' ? (
                                              <Plane className="w-3.5 h-3.5" />
                                            ) : (
                                              <Camera className="w-3.5 h-3.5" />
                                            )}
                                            {rec.type}
                                          </span>
                                          <div className="flex items-center gap-1.5">
                                            {rec.price && (
                                              <span className="text-xs font-bold text-[var(--whisk-azure)] tabular-nums">
                                                {rec.price}
                                              </span>
                                            )}
                                            <button
                                              type="button"
                                              onClick={() =>
                                                onSavePlace({
                                                  name: rec.name,
                                                  type: rec.type,
                                                  destination: itinerary.destination,
                                                  description: rec.description,
                                                  price: rec.price,
                                                  availability: rec.availability,
                                                  affiliateUrl: rec.affiliateUrl,
                                                })
                                              }
                                              className={`p-1.5 rounded-lg cursor-pointer ${
                                                isSaved
                                                  ? 'bg-emerald-100 text-emerald-700'
                                                  : 'bg-white text-slate-400 hover:text-[var(--whisk-fuchsia)]'
                                              }`}
                                              title={isSaved ? 'Saved' : 'Save booking'}
                                            >
                                              {isSaved ? <Check className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5" />}
                                            </button>
                                          </div>
                                        </div>
                                        <div className="font-black text-sm text-[var(--whisk-navy)] leading-snug">
                                          {rec.name}
                                        </div>
                                        {rec.type === 'flight' && rec.departureAirport && (
                                          <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                                            Departing from {rec.departureAirport}
                                          </div>
                                        )}
                                        {rec.availability && (
                                          <div className="text-[11px] font-semibold text-amber-700 mt-1">
                                            {rec.availability}
                                          </div>
                                        )}
                                      </div>

                                      <a
                                        href={rec.affiliateUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full vibrant-gradient text-white py-2.5 px-3 rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 hover:opacity-95 transition-opacity"
                                      >
                                        Book {rec.type === 'flight' ? 'Flight' : 'Partner'} <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                                <span className="font-semibold text-slate-600">
                                  {dayBookings.length} partner booking{dayBookings.length === 1 ? '' : 's'} matched for Day {day.dayNumber} ({dayBookings.map((b) => b.type).join(', ')})
                                </span>
                                <button
                                  type="button"
                                  onClick={onUnlock}
                                  className="vibrant-gradient text-white px-3.5 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider cursor-pointer"
                                >
                                  Unlock Bookings
                                </button>
                              </div>
                            )}
                         </div>
                       )}

                       {/* Day-to-Day Previous / Next Connector Footer */}
                       {(prevDayNum !== null || nextDayNum !== null) && (
                         <div className="pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
                            {prevDayNum !== null ? (
                              <button
                                type="button"
                                onClick={() => jumpToDay(prevDayNum)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[var(--whisk-navy)] cursor-pointer"
                              >
                                <ChevronRight className="w-4 h-4 rotate-180" />
                                Previous: Day {prevDayNum}
                              </button>
                            ) : (
                              <span />
                            )}

                            {nextDayNum !== null && (
                              <button
                                type="button"
                                onClick={() => jumpToDay(nextDayNum)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--whisk-terracotta)] hover:underline cursor-pointer"
                              >
                                Next: Day {nextDayNum}
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            )}
                         </div>
                       )}
                    </div>

                    {isDayLocked && (
                      <div className="absolute inset-0 flex items-center justify-center p-6 z-20">
                         <div className="bg-white/95 backdrop-blur-md p-8 rounded-3xl text-center shadow-2xl border border-[#E05A47]/20 max-w-md">
                            <LockKeyhole className="w-12 h-12 text-[var(--whisk-terracotta)] mx-auto mb-4" />
                            <h4 className="text-2xl font-black text-[var(--whisk-navy)] mb-2 tracking-tight">Day {day.dayNumber} is in Full Passport</h4>
                            <p className="text-sm text-slate-600 font-medium mb-6">Free previews show the first half of your itinerary. Unlock with Whisk Passport ($4.99 single trip, $9.99/mo, or $79.99/yr).</p>
                            <button onClick={onUnlock} className="w-full vibrant-gradient text-white py-3.5 px-5 rounded-2xl font-bold uppercase tracking-wider text-xs shadow-md hover:opacity-95 transition-opacity cursor-pointer">
                              Unlock with Whisk Passport
                            </button>
                         </div>
                      </div>
                    )}
                 </div>
              </div>
              );
            })}
          </div>
          
          <div className="space-y-10">
             <ActionSidebar
               recommendations={itinerary.recommendations}
               destination={itinerary.destination}
               savedPlaceNames={savedPlaceNames}
               onSavePlace={onSavePlace}
               unlocked={isUnlocked}
               onOpenPassport={onUnlock}
             />
          </div>
       </div>
    </div>
  );
};

const TripPlannerForm = ({
  onGenerate,
  loading,
  savedSpotCount = 0,
  initialDestination = '',
}: {
  onGenerate: (params: SearchParams) => void;
  loading: boolean;
  savedSpotCount?: number;
  initialDestination?: string;
}) => {
  const todayIso = React.useMemo(() => toLocalIsoDate(new Date()), []);

  const [params, setParams] = React.useState<SearchParams>({ 
    destination: initialDestination || '', 
    startDate: undefined,
    endDate: undefined,
    duration: '3 days', 
    interests: [], 
    budget: 'Mid-range', 
    pace: 'Moderate', 
    accessibility: [],
    departureLocation: '',
    departureAirport: '',
    publishPublicGuide: true,
  });

  React.useEffect(() => {
    if (initialDestination) {
      setParams((prev) => ({ ...prev, destination: initialDestination }));
    }
  }, [initialDestination]);
  const [locatingAirport, setLocatingAirport] = React.useState(false);
  const [airportNote, setAirportNote] = React.useState<string | null>(null);

  const handleDateRangeChange = (next: {
    startDate?: string;
    endDate?: string;
    duration?: string;
  }) => {
    setParams((prev) => ({
      ...prev,
      startDate: next.startDate,
      endDate: next.endDate,
      duration: next.duration || prev.duration,
    }));
  };
  
  const toggleInterest = (interest: string) => setParams(prev => ({ 
    ...prev, 
    interests: prev.interests.includes(interest) ? prev.interests.filter(i => i !== interest) : [...prev.interests, interest] 
  }));

  const toggleAccessibility = (item: string) => setParams(prev => ({ 
    ...prev, 
    accessibility: prev.accessibility.includes(item) ? prev.accessibility.filter(i => i !== item) : [...prev.accessibility, item] 
  }));

  const handleFindNearestAirport = () => {
    if (!('geolocation' in navigator)) {
      setAirportNote('Location services are unavailable in this browser. Type your departure city or airport code.');
      return;
    }
    setLocatingAirport(true);
    setAirportNote(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const nearest = await findNearestAirport({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setParams((prev) => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            departureLocation: `${nearest.city}, ${nearest.country}`,
            departureAirport: `${nearest.code} — ${nearest.city}`,
          }));
          setAirportNote(`Nearest major airport: ${nearest.code} (${nearest.name}, ~${nearest.distanceKm} km away)`);
        } catch {
          setAirportNote('Could not match your nearest airport automatically. Enter your city or 3-letter airport code.');
        } finally {
          setLocatingAirport(false);
        }
      },
      () => {
        setLocatingAirport(false);
        setAirportNote('Location permission was denied. You can still type your departure city or airport code.');
      },
      { timeout: 7000 }
    );
  };

  const accessibilityOptions = [
    'Wheelchair Access',
    'Limited Walking',
    'Elevators Only',
    'Quiet Spaces',
    'Service Animal Friendly',
    'Braille Signage',
    'Low Sensory'
  ];

  const hasValidDateRange = Boolean(params.startDate && params.endDate);

  return (
    <div className="relative py-16 md:py-24 overflow-hidden whisk-ombre-bg transition-all duration-700">
      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-[3.5rem] p-8 sm:p-14 md:p-18 shadow-2xl border-2 border-white relative">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 text-[var(--whisk-terracotta)] text-xs font-black uppercase tracking-widest mb-4">
              <WhiskLogo size={26} />
              <span>Trip Planner</span>
            </div>
            <h2 className="text-4xl sm:text-6xl font-black mb-3 tracking-tighter whisk-text-ombre">
              Where next, bestie?
            </h2>
            <p className="text-slate-500 font-medium text-lg">
              Pick your destination, exact travel dates, and departure airport — Whisk builds your private route.
            </p>
            {savedSpotCount > 0 && (
              <p className="text-xs font-bold text-emerald-700 mt-2">
                {savedSpotCount} explored & saved spot{savedSpotCount === 1 ? '' : 's'} ready to personalize your itinerary
              </p>
            )}
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-[0.25em] text-slate-400 ml-4">Destination</label>
              <div className="relative group">
                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--whisk-orange)] w-6 h-6" />
                <input
                  type="text"
                  placeholder="Tokyo, Amalfi Coast, Lisbon..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-5 pl-16 pr-6 outline-none focus:border-[var(--whisk-orange)] focus:bg-white transition-all text-lg font-bold text-[var(--whisk-navy)]"
                  value={params.destination}
                  onChange={e => setParams({...params, destination: e.target.value})}
                />
              </div>
            </div>

            {/* Interactive Calendar Date Range Picker */}
            <DateRangeCalendarPicker
              startDate={params.startDate}
              endDate={params.endDate}
              minDate={todayIso}
              maxDays={14}
              defaultOpen
              onChange={handleDateRangeChange}
            />

            {/* Departing From / Nearest Airport with Location Services */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4">
                <label className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
                  Departing From (For Eligible Flights)
                </label>
                <button
                  type="button"
                  onClick={handleFindNearestAirport}
                  disabled={locatingAirport}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--whisk-azure)] hover:underline cursor-pointer disabled:opacity-60"
                >
                  {locatingAirport ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LocateFixed className="w-3.5 h-3.5" />
                  )}
                  {locatingAirport ? 'Finding nearest airport...' : 'Use My Location (Nearest Airport)'}
                </button>
              </div>
              <div className="relative">
                <Plane className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--whisk-azure)] w-6 h-6" />
                <input
                  type="text"
                  placeholder="City or airport code (e.g., SFO, New York, London LHR)"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-5 pl-16 pr-6 outline-none focus:border-[var(--whisk-azure)] focus:bg-white transition-all text-base font-bold text-[var(--whisk-navy)]"
                  value={params.departureAirport || params.departureLocation || ''}
                  onChange={e =>
                    setParams({
                      ...params,
                      departureLocation: e.target.value,
                      departureAirport: e.target.value,
                    })
                  }
                />
              </div>
              {airportNote && (
                <p className="text-xs font-semibold text-slate-500 px-4">{airportNote}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-[0.25em] text-slate-400 ml-4">Budget</label>
                <div className="relative group">
                  <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--whisk-orange)] w-6 h-6" />
                  <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-5 pl-16 pr-6 outline-none focus:border-[var(--whisk-orange)] focus:bg-white transition-all text-lg font-bold text-[var(--whisk-navy)] appearance-none cursor-pointer" value={params.budget} onChange={e => setParams({...params, budget: e.target.value as any})}>
                    <option value="Budget">Shoestring</option>
                    <option value="Mid-range">Comfortable</option>
                    <option value="Luxury">All Out</option>
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between ml-4">
                  <label className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Energy Level & Pacing</label>
                  <span className="text-[11px] font-bold text-[var(--whisk-orange)]">⚡ Energy Curve Active</span>
                </div>
                <div className="relative group">
                  <Zap className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--whisk-orange)] w-6 h-6" />
                  <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-5 pl-16 pr-6 outline-none focus:border-[var(--whisk-orange)] focus:bg-white transition-all text-lg font-bold text-[var(--whisk-navy)] appearance-none cursor-pointer" value={params.pace} onChange={e => setParams({...params, pace: e.target.value as any})}>
                    <option value="Relaxed">Chill Vibes (Gentle Curve & Extended Recharge)</option>
                    <option value="Moderate">A Bit of Everything (Balanced Energy Curve)</option>
                    <option value="Fast-paced">Let's Go Everywhere (High Spark & Packed Days)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Concierge Energy Curve Info Banner */}
            <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-600 font-medium">
              <Sparkles className="w-4 h-4 text-[var(--whisk-orange)] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Human Energy Curve:</strong> Whisk balances natural traveler stamina—high-energy culture in the morning, a dedicated midday recharge window at quiet local spots, golden hour vistas, and relaxed unhurried dining. Sequential stops are clustered within 10–15 min walkable micro-buffers to prevent transit fatigue.
              </p>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-[0.25em] text-slate-400 ml-4">Vibes We Want</label>
              <div className="flex flex-wrap gap-2.5">
                {['Fine Dining', 'Art & Culture', 'Nature', 'Extreme Adventure', 'Shopping', 'Hidden Gems', 'Relaxing', 'Sports'].map(interest => (
                  <button key={interest} type="button" onClick={() => toggleInterest(interest)} className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${params.interests.includes(interest) ? 'vibrant-gradient text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-[var(--whisk-navy)]'}`}>{interest}</button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 ml-4">
                <Accessibility className="w-4 h-4 text-slate-400" />
                <label className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Accessibility Needs</label>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {accessibilityOptions.map(option => (
                  <button key={option} type="button" onClick={() => toggleAccessibility(option)} className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${params.accessibility.includes(option) ? 'cyan-gradient text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-[var(--whisk-navy)]'}`}>{option}</button>
                ))}
              </div>
            </div>

            {/* Public Community Blog Post Toggle */}
            <label className="flex items-start justify-between gap-4 bg-slate-50 border border-slate-200/80 rounded-3xl p-5 cursor-pointer select-none">
              <div className="space-y-1">
                <div className="text-sm font-black text-[var(--whisk-navy)]">
                  Publish a Public Destination Field Guide to Homepage Feed
                </div>
                <p className="text-xs font-medium text-slate-500 leading-relaxed">
                  When on, Whisk automatically adds an edited public guide with 1–3 standout places to eat or visit into the homepage post rotation. Your personal itinerary, budget, and schedule stay private.
                </p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(params.publishPublicGuide)}
                onChange={(e) => setParams({ ...params, publishPublicGuide: e.target.checked })}
                className="w-5 h-5 mt-0.5 rounded border-slate-300 accent-[var(--whisk-orange)] shrink-0"
              />
            </label>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => onGenerate(params)}
                disabled={loading || !params.destination.trim() || !hasValidDateRange}
                className={`w-full py-6 rounded-3xl font-black uppercase tracking-[0.35em] text-base flex items-center justify-center gap-4 transition-all cursor-pointer ${
                  loading || !params.destination.trim() || !hasValidDateRange
                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                    : 'vibrant-gradient text-white hover:opacity-95 shadow-[var(--shadow-orange)]'
                }`}
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Compass className="w-6 h-6" />}
                {loading ? 'Building your itinerary...' : 'Plan My Trip'}
              </button>
              {!hasValidDateRange && (
                <p className="text-center text-xs font-semibold text-slate-500">
                  {!params.startDate
                    ? 'Select both a start date and an end date on the calendar above to continue.'
                    : 'Select your return date on the calendar above to complete your trip dates.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const {
    user,
    authReady,
    isAdmin,
    membershipTier,
    username,
    needsLegalConsent,
    signingIn,
    authError,
    logOut,
    setTier,
    clearAuthError,
  } = useAuth();

  const [currentPath, setCurrentPath] = React.useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  const navigateTo = React.useCallback((nextPath: string, replace = false) => {
    if (typeof window !== 'undefined') {
      if (replace) {
        window.history.replaceState(null, '', nextPath);
      } else {
        window.history.pushState(null, '', nextPath);
      }
      setCurrentPath(window.location.pathname);
    } else {
      setCurrentPath(nextPath);
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const [loading, setLoading] = React.useState(false);
  const [loadingStatus, setLoadingStatus] = React.useState('');
  const [itinerary, setItinerary] = React.useState<TripItinerary | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'home' | 'my-trips'>('home');
  const [recentTrips, setRecentTrips] = React.useState<TripItinerary[]>([]);
  const [publicGuides, setPublicGuides] = React.useState<BlogPost[]>([]);
  const [savedPlaces, setSavedPlaces] = React.useState<SavedPlace[]>([]);
  const [exploredSpots, setExploredSpots] = React.useState<DiscoveredSpot[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem('whisk_explored_spots_v1');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.slice(0, 24) : [];
    } catch {
      return [];
    }
  });
  const [viewingData, setViewingData] = React.useState<{post: BlogPost, itinerary?: TripItinerary | null} | null>(null);
  const [isMembershipModalOpen, setIsMembershipModalOpen] = React.useState(false);
  const [passportPromptReason, setPassportPromptReason] = React.useState<string | null>(null);
  const [isProfileGateOpen, setIsProfileGateOpen] = React.useState(false);
  const [pendingPlannerAfterAuth, setPendingPlannerAfterAuth] = React.useState(false);
  const [singleTripUnlockedCredit, setSingleTripUnlockedCredit] = React.useState(false);
  const [bannerError, setBannerError] = React.useState<string | null>(null);
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = React.useState(false);
  const [plannerPrefillDestination, setPlannerPrefillDestination] = React.useState<string>('');
  const [activeLegalDocId, setActiveLegalDocId] = React.useState<LegalDocId | null>(() => {
    if (typeof window === 'undefined') return null;
    const pathMatch = window.location.pathname.match(/^\/legal\/([a-z-]+)\/?$/i);
    if (pathMatch && isLegalDocId(pathMatch[1].toLowerCase())) {
      return pathMatch[1].toLowerCase() as LegalDocId;
    }
    const queryDoc = new URLSearchParams(window.location.search).get('legal')?.toLowerCase();
    if (queryDoc && isLegalDocId(queryDoc)) {
      return queryDoc;
    }
    return null;
  });

  const [shuffledArticles, setShuffledArticles] = React.useState<BlogPost[]>([]);
  const [showAllArticles, setShowAllArticles] = React.useState(false);

  const openLegalDoc = React.useCallback((docId: LegalDocId) => {
    setActiveLegalDocId(docId);
    if (typeof window !== 'undefined' && !window.location.search.includes('guide=')) {
      window.history.replaceState(null, '', `/legal/${docId}`);
    }
  }, []);

  const closeLegalDoc = React.useCallback(() => {
    setActiveLegalDocId(null);
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/legal/')) {
      window.history.replaceState(null, '', '/');
    }
  }, []);

  React.useEffect(() => {
    if (user && !needsLegalConsent && pendingPlannerAfterAuth) {
      setIsProfileGateOpen(false);
      setPendingPlannerAfterAuth(false);
      setShowForm(true);
    }
  }, [user, needsLegalConsent, pendingPlannerAfterAuth]);

  const openAuthModal = React.useCallback(() => {
    clearAuthError();
    setIsProfileGateOpen(true);
  }, [clearAuthError]);

  const handleStartPlanning = (prefillDestination?: string) => {
    if (typeof prefillDestination === 'string') {
      setPlannerPrefillDestination(prefillDestination);
    }
    if (!user) {
      setPendingPlannerAfterAuth(true);
      openAuthModal();
      return;
    }
    if (needsLegalConsent) {
      setPendingPlannerAfterAuth(true);
      return;
    }
    setActiveTab('home');
    setItinerary(null);
    setViewingData(null);
    if (typeof window !== 'undefined' && window.location.search.includes('guide=')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    setShowForm(true);
  };

  React.useEffect(() => {
    const onQuotaExceeded = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  // Subscribe to public SEO/GEO organic community field guides regardless of auth state
  React.useEffect(() => {
    const unsubPublic = subscribePublicGuides((guides) => {
      setPublicGuides(guides);
    });
    return () => unsubPublic();
  }, []);

  // Load Firestore trips & saved places when authenticated and legal terms accepted
  React.useEffect(() => {
    if (!authReady) return;

    if (!user || needsLegalConsent) {
      setRecentTrips([]);
      setSavedPlaces([]);
      return;
    }

    const unsubTrips = subscribeUserItineraries(user.uid, (trips) => {
      setRecentTrips(trips);
    });
    const unsubPlaces = subscribeSavedPlaces(user.uid, (places) => {
      setSavedPlaces(places);
    });

    return () => {
      unsubTrips();
      unsubPlaces();
    };
  }, [authReady, user, needsLegalConsent]);

  const savedPlaceNames = React.useMemo(
    () => new Set(savedPlaces.map((p) => p.name.toLowerCase())),
    [savedPlaces]
  );

  const handleSaveOrTogglePlace = async (place: {
    name: string;
    type: 'hotel' | 'tour' | 'restaurant' | 'flight' | 'place';
    destination: string;
    description: string;
    price?: string;
    availability?: string;
    affiliateUrl?: string;
    mapsUri?: string;
  }) => {
    if (!user) {
      openAuthModal();
      return;
    }
    const existing = savedPlaces.find((p) => p.name.toLowerCase() === place.name.toLowerCase());
    if (existing) {
      await removeFavoritePlace(user.uid, existing.id);
    } else {
      await saveFavoritePlace(user.uid, place);
    }
  };

  const handleSpotsDiscovered = React.useCallback(
    async (spots: DiscoveredSpot[]) => {
      if (!spots.length) return;
      setExploredSpots((prev) => {
        const seen = new Set(prev.map((s) => s.name.toLowerCase()));
        const additions = spots.filter((s) => !seen.has(s.name.toLowerCase()));
        const next = [...additions, ...prev].slice(0, 24);
        try {
          window.localStorage.setItem('whisk_explored_spots_v1', JSON.stringify(next));
        } catch {
          // Ignore storage quota errors
        }
        return next;
      });

      // Also persist newly discovered spots to Firestore for signed-in users so future itineraries use them cross-device
      if (user && !needsLegalConsent) {
        const newForFirestore = spots
          .filter((s) => !savedPlaceNames.has(s.name.toLowerCase()))
          .slice(0, 3);
        for (const spot of newForFirestore) {
          try {
            await saveFavoritePlace(user.uid, {
              name: spot.name,
              type: 'place',
              destination: spot.destination || 'Explore',
              description: spot.description || `Explored spot in ${spot.destination}`,
              mapsUri: spot.mapsUri,
            });
          } catch {
            // Non-fatal; already cached locally
          }
        }
      }
    },
    [user, needsLegalConsent, savedPlaceNames]
  );

  // Public Community Field Guides feed ONLY uses publicGuides + editorial defaults (keeping personal itineraries private)
  const baseArticles = React.useMemo(() => {
    const seenKeys = new Set<string>();
    const combined: BlogPost[] = [];
    for (const item of [...publicGuides, ...INITIAL_ARTICLES]) {
      const dedupeKey = item.slug || item.id;
      if (!seenKeys.has(dedupeKey) && !seenKeys.has(item.id)) {
        seenKeys.add(dedupeKey);
        seenKeys.add(item.id);
        combined.push(item);
      }
    }
    return combined;
  }, [publicGuides]);

  // Deep-link ?guide=<slug> for direct SEO / shared field guide links
  React.useEffect(() => {
    if (typeof window === 'undefined' || viewingData) return;
    const params = new URLSearchParams(window.location.search);
    const guideParam = params.get('guide');
    if (!guideParam) return;
    const matched = baseArticles.find(
      (g) => g.slug === guideParam || g.id === guideParam
    );
    if (matched) {
      setViewingData({ post: matched, itinerary: null });
    }
  }, [baseArticles, viewingData]);

  // Dynamic SEO & GEO <head> metadata + JSON-LD structured data updater
  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    const setMetaTag = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('content', content);
    };

    const canonicalEl = document.querySelector('link[rel="canonical"]');
    const jsonLdEl = document.getElementById('whisk-jsonld');

    if (viewingData?.post) {
      const p = viewingData.post;
      const guideTitle = p.seoTitle || `${p.title} | Whisk Field Guide`;
      const guideDesc = p.metaDescription || p.geoSummary || `Curated travel guide for ${p.destination}.`;
      const guideUrl = `${window.location.origin}/?guide=${encodeURIComponent(p.slug || p.id)}`;

      document.title = guideTitle;
      setMetaTag('meta[name="description"]', guideDesc);
      setMetaTag('meta[property="og:type"]', 'article');
      setMetaTag('meta[property="og:title"]', guideTitle);
      setMetaTag('meta[property="og:description"]', guideDesc);
      setMetaTag('meta[property="og:url"]', guideUrl);
      setMetaTag('meta[name="twitter:title"]', guideTitle);
      setMetaTag('meta[name="twitter:description"]', guideDesc);
      if (canonicalEl) canonicalEl.setAttribute('href', guideUrl);

      if (jsonLdEl) {
        const schemaGraph: Record<string, unknown>[] = [
          {
            '@context': 'https://schema.org',
            '@type': 'TravelGuide',
            headline: p.title,
            description: guideDesc,
            image: p.imageUrl,
            datePublished: p.createdAt,
            author: { '@type': 'Organization', name: 'Whisk Travel' },
            keywords: p.keywords?.join(', '),
            about: {
              '@type': 'Place',
              name: p.destination,
              ...(p.geoCoordinates
                ? {
                    geo: {
                      '@type': 'GeoCoordinates',
                      latitude: p.geoCoordinates.latitude,
                      longitude: p.geoCoordinates.longitude,
                    },
                  }
                : {}),
            },
          },
        ];
        if (p.faqs && p.faqs.length > 0) {
          schemaGraph.push({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: p.faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          });
        }
        jsonLdEl.textContent = JSON.stringify(schemaGraph.length === 1 ? schemaGraph[0] : schemaGraph);
      }
      return;
    }

    const defaultTitle = 'Whisk — Curated Travel Routes & Local Field Guides';
    const defaultDesc =
      'Plan custom day-by-day travel itineraries backed by live Search & Google Maps and explore community-built SEO & GEO destination field guides.';
    document.title = defaultTitle;
    setMetaTag('meta[name="description"]', defaultDesc);
    setMetaTag('meta[property="og:type"]', 'website');
    setMetaTag('meta[property="og:title"]', defaultTitle);
    setMetaTag('meta[property="og:description"]', defaultDesc);
    setMetaTag('meta[property="og:url"]', `${window.location.origin}/`);
    setMetaTag('meta[name="twitter:title"]', defaultTitle);
    setMetaTag('meta[name="twitter:description"]', defaultDesc);
    if (canonicalEl) canonicalEl.setAttribute('href', `${window.location.origin}/`);
    if (jsonLdEl) {
      jsonLdEl.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Whisk',
        applicationCategory: 'TravelApplication',
        operatingSystem: 'Web',
        description: defaultDesc,
      });
    }
  }, [viewingData]);

  React.useEffect(() => {
    if (baseArticles.length > 0 && shuffledArticles.length === 0) {
      const copy = [...baseArticles];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      setShuffledArticles(copy);
    } else if (baseArticles.length > 0) {
      setShuffledArticles(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newItems = baseArticles.filter(item => !existingIds.has(item.id));
        if (newItems.length > 0) {
          return [...newItems, ...prev];
        }
        return prev;
      });
    }
  }, [baseArticles, shuffledArticles.length]);

  const handleCycleArticles = React.useCallback(() => {
    setShuffledArticles((prev) => {
      const copy = [...prev];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[j], copy[i]] = [copy[i], copy[j]];
      }
      return copy;
    });
  }, []);

  const visibleArticles = React.useMemo(() => {
    if (showAllArticles) {
      return shuffledArticles;
    }
    return shuffledArticles.slice(0, 3);
  }, [shuffledArticles, showAllArticles]);

  const persistTrip = async (trip: TripItinerary) => {
    if (user) {
      await saveItineraryToFirestore(user.uid, trip);
    }
  };

  const handleGenerate = async (params: SearchParams) => {
    if (!user) {
      setPendingPlannerAfterAuth(true);
      setIsProfileGateOpen(true);
      return;
    }

    const hasSubscription = membershipTier === 'Explorer' || membershipTier === 'Cartographer';
    const isFreeFirstTrip = recentTrips.length === 0;
    if (!hasSubscription && !isFreeFirstTrip && !singleTripUnlockedCredit) {
      setPassportPromptReason(
        'Your first trip preview was free! Activate Whisk Passport ($4.99 single trip, $9.99/mo, or $79.99/yr) to generate and unlock more itineraries.'
      );
      setIsMembershipModalOpen(true);
      return;
    }

    setLoading(true);
    setBannerError(null);
    setLoadingStatus('Planning your route, verified stops, and partner bookings...');
    setShowForm(false);
    setItinerary(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      // Combine saved Firestore places + locally explored homepage spots relevant to the trip
      const destLower = params.destination.toLowerCase();
      const allRemembered: DiscoveredSpot[] = [
        ...savedPlaces.map((p) => ({
          name: p.name,
          destination: p.destination,
          description: p.description,
          mapsUri: p.mapsUri,
        })),
        ...exploredSpots,
      ];
      const dedupedPreferred: DiscoveredSpot[] = [];
      const seenPreferred = new Set<string>();
      for (const spot of allRemembered) {
        const key = spot.name.toLowerCase();
        if (seenPreferred.has(key)) continue;
        const spotDest = (spot.destination || '').toLowerCase();
        if (
          spotDest &&
          (destLower.includes(spotDest) || spotDest.includes(destLower.split(',')[0].trim()))
        ) {
          seenPreferred.add(key);
          dedupedPreferred.push(spot);
        }
      }

      const itineraryResult = await generateItinerary({
        ...params,
        preferredSpots: dedupedPreferred.slice(0, 6),
      });
      const shouldUnlockNow = hasSubscription || singleTripUnlockedCredit;
      if (singleTripUnlockedCredit) {
        setSingleTripUnlockedCredit(false);
      }

      const finalItinerary: TripItinerary = {
        ...itineraryResult,
        ownerId: user.uid,
        unlocked: shouldUnlockNow,
      };

      setItinerary(finalItinerary);
      await persistTrip(finalItinerary);
      setLoading(false);

      // If the public toggle is enabled, publish an edited public-safe Field Guide directly into the homepage post rotation (never shown on the private itinerary)
      if (params.publishPublicGuide !== false) {
        (async () => {
          try {
            const blogPostResult = await generateBlogPost(itineraryResult);
            const newBlogPost: BlogPost = {
              ...blogPostResult,
              id: `guide_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              imageUrl: getUniqueTravelImage(params.destination, blogPostResult.title || itineraryResult.id),
              createdAt: new Date().toISOString(),
              isPublished: true,
            };
            await publishGuideToFirestore(user.uid, newBlogPost);
          } catch (bgErr) {
            console.warn('Public destination guide auto-publish skipped:', bgErr);
          }
        })();
      }
    } catch (err: any) {
      console.error('Error generating itinerary:', err);
      setBannerError(err?.message || "Something went wrong while planning your route. Let's try again?");
      setShowForm(true);
      setLoading(false);
    }
  };

  const handleViewPost = (post: BlogPost) => {
    setViewingData({ post, itinerary: null });
    if (typeof window !== 'undefined') {
      const guideKey = post.slug || post.id;
      window.history.replaceState(null, '', `/?guide=${encodeURIComponent(guideKey)}`);
      setCurrentPath('/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUnlock = () => {
    if (!user) {
      setIsProfileGateOpen(true);
      return;
    }
    setPassportPromptReason(null);
    setIsMembershipModalOpen(true);
  };

  const handleDeleteTrip = async (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation();
    if (user) {
      await deleteItineraryFromFirestore(tripId);
    }
  };

  const handleCloseGuide = () => {
    setViewingData(null);
    if (typeof window !== 'undefined' && window.location.search.includes('guide=')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const handleReturnHome = () => {
    setItinerary(null);
    setShowForm(false);
    handleCloseGuide();
    setActiveTab('home');
  };

  const handleLogOut = async () => {
    await logOut();
    handleReturnHome();
  };

  const hasActiveSubscription = membershipTier === 'Explorer' || membershipTier === 'Cartographer';

  const handleSelectPassportPlan = async (plan: PassportPlan) => {
    if (!user) {
      setIsMembershipModalOpen(false);
      openAuthModal();
      return;
    }

    if (plan === 'Monthly') {
      await setTier('Explorer');
    } else if (plan === 'Annual') {
      await setTier('Cartographer');
    } else if (!itinerary && !viewingData?.itinerary) {
      setSingleTripUnlockedCredit(true);
    }

    if (itinerary) {
      const updated = { ...itinerary, unlocked: true };
      setItinerary(updated);
      setRecentTrips((prev) =>
        prev.map((t) => (t.id === itinerary.id ? { ...t, unlocked: true } : t))
      );
      await unlockItineraryInFirestore(itinerary.id);
    }
    if (viewingData?.itinerary) {
      const viewId = viewingData.itinerary.id;
      setViewingData((prev) =>
        prev && prev.itinerary ? { ...prev, itinerary: { ...prev.itinerary, unlocked: true } } : prev
      );
      setRecentTrips((prev) =>
        prev.map((t) => (t.id === viewId ? { ...t, unlocked: true } : t))
      );
      await unlockItineraryInFirestore(viewId);
    }

    setPassportPromptReason(null);
    setIsMembershipModalOpen(false);
  };

  const handleCoordinatesHydrated = React.useCallback(
    async (itineraryId: string, updatedDays: DayPlan[]) => {
      const sourceTrip =
        (itinerary && itinerary.id === itineraryId ? itinerary : null) ||
        recentTrips.find((t) => t.id === itineraryId) ||
        null;
      const tripToSave = sourceTrip ? { ...sourceTrip, days: updatedDays } : null;

      setItinerary((prev) =>
        prev && prev.id === itineraryId ? { ...prev, days: updatedDays } : prev
      );
      setRecentTrips((prev) =>
        prev.map((t) => (t.id === itineraryId ? { ...t, days: updatedDays } : t))
      );
      if (user && tripToSave) {
        try {
          await saveItineraryToFirestore(user.uid, tripToSave);
        } catch (_err) {
          // Non-fatal background coordinate sync
        }
      }
    },
    [user, itinerary, recentTrips]
  );

  const activeError = bannerError || (!isProfileGateOpen ? authError : null);
  const isAdminRoute = currentPath === '/admin' || currentPath.startsWith('/admin/');

  const handleOpenAdmin = React.useCallback(() => {
    navigateTo(isAdmin ? '/admin' : '/admin/login');
  }, [isAdmin, navigateTo]);

  const handleUnauthorizedAdminRedirect = React.useCallback(
    (message: string) => {
      navigateTo('/', true);
      setBannerError(message);
    },
    [navigateTo]
  );

  const handleNormalizeToAdmin = React.useCallback(() => {
    navigateTo('/admin', true);
  }, [navigateTo]);

  if (isAdminRoute) {
    return (
      <>
        <AdminRouteGuard
          currentPath={currentPath}
          onUnauthorizedRedirect={handleUnauthorizedAdminRedirect}
          onNavigateHome={() => navigateTo('/')}
          onNormalizeToAdmin={handleNormalizeToAdmin}
        >
          <AdminDashboard
            onNavigateHome={() => navigateTo('/')}
            onOpenPublicGuide={(post) => handleViewPost(post)}
          />
        </AdminRouteGuard>
        <LegalConsentModal
          isOpen={Boolean(user && needsLegalConsent)}
          onOpenLegalDoc={openLegalDoc}
        />
        <LegalModal
          activeDocId={activeLegalDocId}
          onSelectDoc={openLegalDoc}
          onClose={closeLegalDoc}
        />
      </>
    );
  }

  if (viewingData) {
    return (
       <div className="min-h-screen selection:bg-[var(--whisk-terracotta)] selection:text-white relative whisk-ombre-bg transition-all duration-700">
         {mapsQuotaExceeded && <MapsQuotaBanner />}
         <div className="relative z-10 flex flex-col min-h-screen justify-between">
           <div>
             <Navbar user={user} username={username} membershipTier={membershipTier} isAdmin={isAdmin} signingIn={signingIn} onHome={handleReturnHome} onMyTrips={() => { if(user) setActiveTab('my-trips'); setItinerary(null); handleCloseGuide(); }} onOpenAdmin={handleOpenAdmin} onSignIn={openAuthModal} onLogOut={handleLogOut} activeTab={'home'} onUpgrade={handleUnlock} />
             <BlogPostDisplay
               post={viewingData.post}
               hasActiveSubscription={hasActiveSubscription}
               itinerary={null}
               onBack={handleCloseGuide}
               savedPlaceNames={savedPlaceNames}
               onSavePlace={handleSaveOrTogglePlace}
               onOpenPassport={handleUnlock}
               onPlanDestination={(dest) => {
                 handleCloseGuide();
                 handleStartPlanning(dest || viewingData.post.destination);
               }}
             />
           </div>
           <LegalFooter onOpenLegalDoc={openLegalDoc} onOpenAdmin={handleOpenAdmin} compact />
         </div>
         <AuthModal
           isOpen={isProfileGateOpen && !user}
           onOpenLegalDoc={openLegalDoc}
           onClose={() => {
             setIsProfileGateOpen(false);
             setPendingPlannerAfterAuth(false);
             clearAuthError();
           }}
         />
         <LegalConsentModal
           isOpen={Boolean(user && needsLegalConsent)}
           onOpenLegalDoc={openLegalDoc}
         />
         <LegalModal
           activeDocId={activeLegalDocId}
           onSelectDoc={openLegalDoc}
           onClose={closeLegalDoc}
         />
         <WhiskPassportModal
           isOpen={isMembershipModalOpen}
           onClose={() => setIsMembershipModalOpen(false)}
           onSelectPlan={handleSelectPassportPlan}
           onOpenLegalDoc={openLegalDoc}
           promptReason={passportPromptReason}
         />
       </div>
    );
  }

  const totalRememberedSpots = new Set([
    ...savedPlaces.map((p) => p.name.toLowerCase()),
    ...exploredSpots.map((s) => s.name.toLowerCase()),
  ]).size;

  return (
    <div className="min-h-screen selection:bg-[var(--whisk-terracotta)] selection:text-white relative transition-all duration-700 whisk-ombre-bg">
      {mapsQuotaExceeded && <MapsQuotaBanner />}
      <Navbar user={user} username={username} membershipTier={membershipTier} isAdmin={isAdmin} signingIn={signingIn} onHome={handleReturnHome} onMyTrips={() => { if(user) setActiveTab('my-trips'); setItinerary(null); setShowForm(false); }} onOpenAdmin={handleOpenAdmin} onSignIn={openAuthModal} onLogOut={handleLogOut} activeTab={activeTab} onUpgrade={handleUnlock} />

      {activeError && (
        <div className="max-w-4xl mx-auto px-6 mt-6 relative z-30">
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-3xl flex items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3 text-sm font-bold">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{activeError}</span>
            </div>
            <button onClick={() => { setBannerError(null); clearAuthError(); }} className="p-1 hover:bg-rose-100 rounded-xl cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {loading && (
        <ItinerarySkeleton statusText={loadingStatus} />
      )}
      {!loading && !itinerary && !showForm && activeTab === 'home' && (
        <header className="relative min-h-[88vh] flex items-center justify-center overflow-hidden isolate py-12 px-4">
          <HeroMosaic />

          {/* Centered Permanent Hero Card */}
          <div className="w-full max-w-[460px] text-center relative z-10 flex flex-col items-center bg-white/95 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-[0_28px_80px_rgba(15,23,42,0.34)] border-2 border-white">
            <WhiskLogo size={72} className="mb-4 drop-shadow-md" />
            {/* Vibrant Travel Icon Bar */}
            <div className="flex items-center justify-center gap-2.5 mb-5">
              {HERO_CARD_ICONS.map(({ Icon, color, bg }, idx) => (
                <div
                  key={idx}
                  className={`w-9 h-9 rounded-2xl ${bg} flex items-center justify-center shadow-xs transition-transform duration-200 hover:scale-110`}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
              ))}
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-black mb-4 tracking-tight leading-[1.08] text-balance">
              Where will you{' '}
              <span className="whisk-text-ombre">
                whisk
              </span>{' '}
              <span className="text-black">to?</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 max-w-sm mx-auto leading-relaxed font-medium mb-7">
              Curated local routes with verified stops, day-level partner bookings, and interactive maps. Create your profile to preview your first trip free.
            </p>

            <button
              onClick={handleStartPlanning}
              className="vibrant-gradient w-full text-white py-4 px-6 rounded-2xl text-sm font-bold tracking-wide shadow-[var(--shadow-orange)] cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 whitespace-nowrap"
            >
              <Plane className="w-4 h-4" />
              {user ? 'Plan My Trip' : 'Create Profile & Plan Free Preview'}
            </button>
          </div>
        </header>
      )}

      {!loading && showForm && !itinerary && (
        <TripPlannerForm
          onGenerate={handleGenerate}
          loading={loading}
          savedSpotCount={totalRememberedSpots}
          initialDestination={plannerPrefillDestination}
        />
      )}

      {/* Discover Section */}
      {!loading && !itinerary && activeTab === 'home' && (
        <>
          <BlogFeed 
            posts={visibleArticles} 
            onView={handleViewPost} 
            showAll={showAllArticles}
            onToggleShowAll={() => setShowAllArticles(prev => !prev)}
            onCycle={handleCycleArticles}
            hasMultiple={shuffledArticles.length > 3}
          />
          <section className="max-w-7xl mx-auto px-6 sm:px-10 py-10 relative z-10">
            <PlacesExplorer
              savedPlaceNames={savedPlaceNames}
              onSavePlace={handleSaveOrTogglePlace}
              onSpotsDiscovered={handleSpotsDiscovered}
            />
          </section>
          <TravelShowcaseSection />
        </>
      )}
      
      {!loading && !itinerary && activeTab === 'my-trips' && (
         <div className="relative overflow-hidden min-h-[75vh] py-16 transition-all duration-700">
           <div className="max-w-7xl mx-auto px-6 sm:px-10 relative z-10 pt-10 space-y-20">
             <div>
               <h2 className="text-5xl md:text-7xl font-black mb-12 tracking-tighter text-center whisk-text-ombre">My Saved Trips</h2>
               {recentTrips.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {recentTrips.map(trip => (
                      <div key={trip.id} onClick={() => { setItinerary(trip); setActiveTab('home'); }} className="bg-white rounded-[3rem] p-10 shadow-xl border-4 border-white cursor-pointer hover:border-[var(--whisk-orange)] transition-all relative group">
                        <button
                          onClick={(e) => handleDeleteTrip(e, trip.id)}
                          title="Delete trip"
                          className="absolute top-6 right-6 p-2.5 rounded-xl bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="text-xs font-bold text-[var(--whisk-orange)] uppercase tracking-wider mb-3">
                          {trip.duration}
                          {formatTripDateRange(trip.startDate, trip.endDate)
                            ? ` · ${formatTripDateRange(trip.startDate, trip.endDate)}`
                            : ''}
                        </div>
                        <h3 className="text-2xl font-black text-[var(--whisk-navy)] mb-4 tracking-tighter pr-8">{trip.title}</h3>
                        <div className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest"><MapPin size={14}/> {trip.destination}</div>
                      </div>
                    ))}
                  </div>
               ) : (
                  <div className="text-center py-16 bg-white/95 backdrop-blur-md rounded-[4rem] border-4 border-white shadow-xl">
                    <p className="text-2xl text-slate-400 font-bold mb-8">No saved trips yet!</p>
                    <button onClick={handleStartPlanning} className="vibrant-gradient text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl cursor-pointer">Start Planning</button>
                  </div>
               )}
             </div>

             <div>
               <h3 className="text-4xl md:text-5xl font-black mb-10 tracking-tighter text-center whisk-text-ombre">Saved & Explored Places</h3>
               {savedPlaces.length > 0 ? (
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {savedPlaces.map(place => (
                     <div key={place.id} className="bg-white rounded-[2.5rem] p-8 shadow-xl border-4 border-white flex flex-col justify-between gap-4">
                       <div>
                         <div className="flex items-center justify-between gap-2 mb-3">
                           <span className="bg-sky-50 text-sky-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{place.type}</span>
                           <button
                             onClick={() => user && removeFavoritePlace(user.uid, place.id)}
                             className="p-2 rounded-xl bg-slate-50 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                             title="Remove saved place"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
                         <h4 className="text-xl font-black text-[var(--whisk-navy)] mb-1">{place.name}</h4>
                         <div className="text-xs font-bold text-[var(--whisk-orange)] uppercase tracking-wider mb-3">{place.destination}</div>
                         <p className="text-sm text-slate-500 line-clamp-3">{place.description}</p>
                       </div>
                       <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                         {place.mapsUri && (
                           <a href={place.mapsUri} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-black text-[var(--whisk-orange)] hover:underline">
                             <MapPin className="w-3.5 h-3.5" /> Google Maps <ExternalLink className="w-3 h-3" />
                           </a>
                         )}
                         {place.affiliateUrl && (
                           <a href={place.affiliateUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-black text-sky-600 hover:underline ml-auto">
                             Book / Details <ExternalLink className="w-3 h-3" />
                           </a>
                         )}
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-12 bg-white/80 rounded-[3rem] border-2 border-white">
                   <p className="text-slate-400 font-bold">Explore spots on the homepage or bookmark any hotel, restaurant, or stop to remember it for future itineraries!</p>
                 </div>
               )}
             </div>
           </div>
         </div>
      )}
      
      {itinerary && !loading && (
        <div className="relative overflow-hidden min-h-screen transition-all duration-700">
          <div className="relative z-10">
            <ItineraryDisplay 
              itinerary={itinerary}
              hasActiveSubscription={hasActiveSubscription}
              onRateActivity={() => {}} 
              onRateOverall={() => {}} 
              onUnlock={handleUnlock}
              savedPlaceNames={savedPlaceNames}
              onSavePlace={handleSaveOrTogglePlace}
              onCoordinatesHydrated={handleCoordinatesHydrated}
            />
            <div className="max-w-7xl mx-auto px-6 pb-32 flex flex-col items-center gap-12">
              <button onClick={handleStartPlanning} className="bg-white border border-slate-200 px-12 py-6 rounded-3xl font-bold uppercase tracking-widest text-xs hover:border-[var(--whisk-terracotta)] transition-all flex items-center gap-3 shadow-lg group text-[var(--whisk-navy)] cursor-pointer">
                <ChevronRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" /> Plan Another Trip
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={isProfileGateOpen && !user}
        onOpenLegalDoc={openLegalDoc}
        onClose={() => {
          setIsProfileGateOpen(false);
          setPendingPlannerAfterAuth(false);
          clearAuthError();
        }}
      />

      <LegalConsentModal
        isOpen={Boolean(user && needsLegalConsent)}
        onOpenLegalDoc={openLegalDoc}
      />

      <LegalModal
        activeDocId={activeLegalDocId}
        onSelectDoc={openLegalDoc}
        onClose={closeLegalDoc}
      />

      <ChatBot />
      <WhiskPassportModal
        isOpen={isMembershipModalOpen}
        onClose={() => { setIsMembershipModalOpen(false); setPassportPromptReason(null); }}
        onSelectPlan={handleSelectPassportPlan}
        onOpenLegalDoc={openLegalDoc}
        promptReason={passportPromptReason}
      />
      <LegalFooter onOpenLegalDoc={openLegalDoc} onOpenAdmin={handleOpenAdmin} />
    </div>
  );
}
