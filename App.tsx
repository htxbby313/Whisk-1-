
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
  LocateFixed
} from 'lucide-react';
import { 
  generateItinerary, 
  generateBlogPost
} from './geminiService';
import { SearchParams, TripItinerary, BlogPost, Recommendation, MembershipTier, SavedPlace, GroundingSource, DayPlan } from './types';
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
  updateItineraryBlogPostInFirestore
} from './src/services/firestoreService';
import { ChatBot } from './src/components/ChatBot';
import { PlacesExplorer } from './src/components/PlacesExplorer';
import { WeatherForecast } from './src/components/WeatherForecast';
import { ItineraryMap } from './src/components/ItineraryMap';
import { TripToolkit } from './src/components/TripToolkit';
import { AuthModal } from './src/components/AuthModal';
import { LegalModal } from './src/components/LegalModal';
import { LegalConsentModal } from './src/components/LegalConsentModal';
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

const PROMO_TRAVEL_PHOTOS = LOCAL_TRAVEL_IMAGE_POOL;

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

const Navbar = ({ user, username, membershipTier, signingIn, onHome, onMyTrips, onSignIn, onLogOut, activeTab, onUpgrade }: any) => (
  <nav className="sticky top-0 z-50 glass-panel shadow-sm border-b border-slate-200/60">
    <div className="max-w-7xl mx-auto px-6 sm:px-10">
      <div className="flex justify-between items-center h-20 gap-8">
        <button onClick={onHome} className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap shrink-0">
          <div className="vibrant-gradient p-2.5 rounded-xl shadow-[var(--shadow-orange)]">
            <Plane className="text-white w-5 h-5" />
          </div>
          <span className="text-2xl font-black tracking-tight text-[var(--whisk-navy)]">Whisk</span>
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

const TrustTabs = () => {
  const [activeTab, setActiveTab] = React.useState(0);
  const tabs = [
    { 
      title: "Our Vibe", 
      content: "We're not some corporate travel agency. We're a group of friends who were tired of scrolling through paid ads and generic lists. Whisk was born to find the soul of a city, not just the airport hotel.",
      icon: <Smile className="w-8 h-8" />
    },
    { 
      title: "Expert Vetting", 
      content: "Every recommendation is cross-referenced with local data and expert blogs. We don't just follow the crowd; we follow the people who actually live there. If a spot goes downhill, we remove it. Fast.",
      icon: <ShieldCheck className="w-8 h-8" />
    },
    { 
      title: "Community First", 
      content: "Thousands of besties have used Whisk to find their new favorite pizza in Rome or a secret sunset hike in Maui. We're building a network of trust that grows with every single trip planned.",
      icon: <Heart className="w-8 h-8" />
    }
  ];

  return (
    <div className="mt-8 bg-slate-50 rounded-[3rem] p-8 md:p-10 border-2 border-white shadow-lg w-full">
      <div className="flex items-center gap-4 mb-6">
        <div className="vibrant-gradient p-2.5 rounded-xl text-white shadow-md">
          <MapPin className="w-5 h-5" />
        </div>
        <h3 className="text-2xl font-black text-[var(--whisk-navy)] tracking-tight">As a local...</h3>
      </div>
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2 no-scrollbar">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === i 
              ? 'vibrant-gradient text-white shadow-md' 
              : 'bg-white text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div className="animate-in fade-in slide-in-from-left-2 duration-300">
        <p className="text-slate-500 text-base font-medium leading-relaxed">
          {tabs[activeTab].content}
        </p>
      </div>
    </div>
  );
};

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

  return (
    <article className="max-w-7xl mx-auto px-6 sm:px-10 py-14 animate-in fade-in duration-500">
      <button onClick={onBack} className="flex items-center gap-2 font-black text-sm uppercase tracking-widest text-[var(--whisk-orange)] hover:-translate-x-1 transition-transform mb-8 cursor-pointer">
        <ChevronRight className="w-5 h-5 rotate-180" /> Back to Explore
      </button>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 bg-white rounded-[3rem] shadow-2xl border-4 border-white overflow-hidden">
          <img src={post.imageUrl} referrerPolicy="no-referrer" className="w-full h-[380px] object-cover" alt={post.title} />
          <div className="p-8 sm:p-14">
            <div className="mb-8">
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
              <h1 className="text-4xl md:text-5xl font-black text-[var(--whisk-navy)] tracking-tight leading-tight">
                {post.title}
              </h1>
            </div>

            <p className="text-lg text-slate-500 font-medium italic mb-8">{post.metaDescription}</p>

            {post.geoSummary && (
              <section className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 mb-8">
                <div className="text-xs font-black uppercase tracking-widest text-[var(--whisk-azure)] mb-2 flex items-center gap-2">
                  <Compass className="w-4 h-4" /> Quick Route Takeaways
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

        <div className="space-y-10">
          {itinerary ? (
            <ActionSidebar
              recommendations={itinerary.recommendations}
              destination={itinerary.destination}
              savedPlaceNames={savedPlaceNames}
              onSavePlace={onSavePlace}
              unlocked={Boolean(itinerary.unlocked || hasActiveSubscription)}
              onOpenPassport={onOpenPassport}
            />
          ) : (
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-[3rem] p-8 sm:p-10 shadow-2xl border-2 border-white space-y-5">
                <div className="vibrant-gradient w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md">
                  <Plane className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-[var(--whisk-navy)] tracking-tight">
                  Plan Your Custom {post.destination.split(',')[0]} Trip
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Generate an exact day-by-day route tailored to your pace, budget, and accessibility needs—backed by live Search &amp; Google Maps.
                </p>
                <button
                  type="button"
                  onClick={() => onPlanDestination(post.destination)}
                  className="w-full vibrant-gradient text-white py-4 px-5 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-95 transition-opacity shadow-[var(--shadow-orange)] cursor-pointer"
                >
                  Build {post.destination.split(',')[0]} Route <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
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
  compact = false,
}: {
  onOpenLegalDoc: (docId: LegalDocId) => void;
  compact?: boolean;
}) => (
  <footer className={`bg-[var(--whisk-navy)] text-white ${compact ? 'py-16 mt-20' : 'py-24'}`}>
    <div className="max-w-7xl mx-auto px-6 sm:px-10 text-center space-y-8">
      <div className="flex items-center justify-center gap-4">
        <div className="vibrant-gradient p-3 rounded-2xl shadow-lg">
          <Plane className="w-7 h-7" />
        </div>
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
      </nav>

      <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">
        © 2026 Whisk, Inc. · Curated World Adventures · California, USA
      </div>
    </div>
  </footer>
);

const LOADING_PHOTOS = LANDMARK_POLAROIDS.map((p, idx) => ({
  image: p.url,
  location: p.name,
  tip: [
    'Skip the elevator queue at dusk—sip café crème along Rue Saint-Dominique as the Eiffel Tower sparkles on the hour.',
    'Visit Senso-ji in Asakusa before 8 AM for serene lantern courtyards, then stroll Sumida riverside cafés toward Skytree.',
    'Take early morning ferries between Positano and Amalfi to beat coastal bus traffic and catch sunlit lemon groves.',
    'Follow the Oia to Fira cliff path in the late afternoon for quiet caldera views away from sunset bottlenecks.',
    'Ask your Marrakech riad host to arrange a rooftop mint-tea tasting just before golden hour hits the terracotta skyline.',
    'Ride the earliest Gornergrat cogwheel train in Zermatt for mirror-calm Matterhorn reflections in Riffelsee.',
  ][idx % 6],
}));

const ItinerarySkeleton = ({ statusText }: { statusText: string }) => {
  const [photoIndex, setPhotoIndex] = React.useState(0);
  const [fadeState, setFadeState] = React.useState<'in' | 'out'>('in');
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    // 4.5 seconds interval for switching slides
    const slideDuration = 4500;
    const updateRate = 50; // update scale/indicators every 50ms
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += updateRate;
      setProgress(Math.min((elapsed / slideDuration) * 100, 100));

      if (elapsed >= slideDuration) {
        // Trigger fade out
        setFadeState('out');
        setTimeout(() => {
          setPhotoIndex((prev) => (prev + 1) % LOADING_PHOTOS.length);
          setFadeState('in');
          setProgress(0);
        }, 500); // fade out duration
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
    }, 300);
  };

  const handlePrev = () => {
    setFadeState('out');
    setTimeout(() => {
      setPhotoIndex((prev) => (prev - 1 + LOADING_PHOTOS.length) % LOADING_PHOTOS.length);
      setFadeState('in');
      setProgress(0);
    }, 300);
  };

  const activePhoto = LOADING_PHOTOS[photoIndex];

  return (
    <div className="min-h-screen bg-gradient-to-tr from-orange-50/60 via-amber-50/30 to-rose-50/60 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden transition-all duration-700">
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:20px_20px] opacity-40 pointer-events-none"></div>
      {/* Background Decorative Blur */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--whisk-orange)]/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--whisk-cyan)]/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>

      {/* Main Container */}
      <div className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl p-6 md:p-12 border-4 border-white flex flex-col items-center relative z-10 transition-all">
        
        {/* Core Spinning Loader Headers */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 border-6 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 w-20 h-20 border-6 border-t-[var(--whisk-orange)] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-[var(--whisk-orange)] animate-pulse" />
          </div>
          <h3 className="text-3xl md:text-4xl font-black text-[var(--whisk-navy)] mb-2 tracking-tighter">
            Sit tight, bestie!
          </h3>
          <p className="text-md text-[var(--whisk-pink)] font-black uppercase tracking-widest animate-pulse">
            {statusText || "Mapping out your dream escape..."}
          </p>
        </div>

        {/* Dynamic Presentation Card with Travel Photo and Insider Tip */}
        <div className="w-full bg-slate-50/50 rounded-[2.5rem] border border-slate-100 p-4 md:p-8 flex flex-col md:flex-row gap-8 items-center overflow-hidden min-h-[380px] md:min-h-[310px]">
          
          {/* Photo Section */}
          <div className="w-full md:w-2/5 aspect-[4/3] md:aspect-square relative rounded-[2rem] overflow-hidden shadow-lg shrink-0">
            <img 
              src={activePhoto.image} 
              alt={activePhoto.location} 
              className={`w-full h-full object-cover transition-all duration-750 transform scale-100 ${fadeState === 'out' ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100'}`} 
            />
            {/* Soft gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
            {/* Location tag */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 text-white">
              <MapPin className="w-5 h-5 text-[var(--whisk-cyan)] shrink-0" />
              <span className="font-extrabold tracking-tight text-sm drop-shadow-md">{activePhoto.location}</span>
            </div>
          </div>

          {/* Tips Section */}
          <div className="flex-1 flex flex-col justify-between h-full py-2">
            <div className={`transition-all duration-500 ${fadeState === 'out' ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
              <div className="inline-flex items-center gap-2 bg-[var(--whisk-orange)]/10 text-[var(--whisk-orange)] px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest mb-4">
                <Sparkles className="w-3.5 h-3.5" /> Bestie Insider Tip
              </div>
              <h4 className="text-2xl font-black text-[var(--whisk-navy)] tracking-tight mb-3">
                Wanderlust Inspiration
              </h4>
              <p className="text-slate-600 text-sm md:text-base font-medium leading-relaxed italic">
                "{activePhoto.tip}"
              </p>
            </div>

            {/* Slider Controls and Timeline indicator */}
            <div className="mt-8 flex items-center justify-between">
              {/* Carousel Arrows */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrev}
                  className="p-3 bg-white hover:bg-slate-100 border border-slate-200/60 rounded-full transition-all text-slate-500 hover:text-[var(--whisk-orange)] shadow-sm hover:scale-105"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <button 
                  onClick={handleNext}
                  className="p-3 bg-white hover:bg-slate-100 border border-slate-200/60 rounded-full transition-all text-slate-500 hover:text-[var(--whisk-orange)] shadow-sm hover:scale-105"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Progress and Indicators */}
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  {LOADING_PHOTOS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setFadeState('out');
                        setTimeout(() => {
                          setPhotoIndex(i);
                          setFadeState('in');
                          setProgress(0);
                        }, 300);
                      }}
                      className={`h-2.5 rounded-full transition-all duration-300 ${i === photoIndex ? 'bg-[var(--whisk-orange)] w-6' : 'bg-slate-200 w-2.5'}`}
                    ></button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom indicator progress bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-8 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[var(--whisk-orange)] to-[var(--whisk-pink)] rounded-full transition-all duration-50"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest mt-4">
          Whisk Travel Engine • Custom Curated Adventures
        </p>
      </div>
    </div>
  );
};

const ItineraryDisplay = ({ 
  itinerary,
  hasActiveSubscription,
  onUnlock, 
  handleViewPost, 
  generatingBlogPostId,
  savedPlaceNames,
  onSavePlace,
  onCoordinatesHydrated,
  onSignInRequest,
}: { 
  itinerary: TripItinerary;
  hasActiveSubscription: boolean;
  onRateActivity: any; 
  onRateOverall: any; 
  onUnlock: () => void; 
  handleViewPost: (post: BlogPost) => void; 
  generatingBlogPostId: string | null;
  savedPlaceNames: Set<string>;
  onSavePlace: any;
  onCoordinatesHydrated?: (itineraryId: string, updatedDays: DayPlan[]) => void;
  onSignInRequest: () => void | Promise<void>;
}) => {
  const mapsSources = (itinerary.groundingSources || []).filter((s: GroundingSource) => s.sourceType === 'maps');
  const searchSources = (itinerary.groundingSources || []).filter((s: GroundingSource) => s.sourceType === 'search');
  const isUnlocked = Boolean(itinerary.unlocked || hasActiveSubscription);
  const freeVisibleCount = itinerary.days.length <= 1 ? 1 : Math.max(1, Math.floor(itinerary.days.length / 2));

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-10 py-20 animate-in slide-in-from-bottom-10 duration-700">
       <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 text-[var(--whisk-terracotta)] text-xs font-bold uppercase tracking-widest mb-4">
            <Globe className="w-4 h-4" />
            <span>Search & Google Maps Grounded</span>
            <span aria-hidden="true">·</span>
            <span>{isUnlocked ? 'Full Access Unlocked' : `Free Preview (${freeVisibleCount} of ${itinerary.days.length} days)`}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-[var(--whisk-navy)] mb-6 tracking-tighter leading-tight text-balance">{itinerary.title}</h1>
          <p className="text-xl text-slate-500 font-medium max-w-3xl mx-auto leading-relaxed italic">"{itinerary.summary}"</p>
       </div>

       <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <ItineraryMap
              itinerary={itinerary}
              onCoordinatesHydrated={onCoordinatesHydrated}
            />
            <WeatherForecast destination={itinerary.destination} />
            {itinerary.days.map((day, dIdx) => {
              const isDayLocked = !isUnlocked && dIdx >= freeVisibleCount;
              return (
              <div key={dIdx} className="bg-white rounded-[3.5rem] p-8 md:p-14 shadow-xl border border-slate-100 relative overflow-hidden group">
                 <div className="relative z-10">
                    <div className="flex items-center gap-5 mb-10">
                       <div className="vibrant-gradient w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg tabular-nums">
                          {day.dayNumber}
                       </div>
                       <div>
                          <div className="text-xs font-bold text-[var(--whisk-terracotta)] uppercase tracking-widest mb-1">Day {day.dayNumber}</div>
                          <h2 className="text-3xl font-black text-[var(--whisk-navy)] tracking-tight">{day.theme}</h2>
                       </div>
                    </div>
                    
                    <div className={`space-y-8 transition-all duration-500 ${isDayLocked ? 'blur-md pointer-events-none select-none opacity-35' : ''}`}>
                       {day.activities.map((activity, aIdx) => (
                         <div key={aIdx} className="flex gap-6 relative">
                            {aIdx < day.activities.length - 1 && <div className="absolute left-5 top-14 bottom-0 w-0.5 bg-slate-100"></div>}
                            <div className="bg-slate-50 p-3.5 rounded-2xl h-fit border border-slate-100 shrink-0">
                               <Clock className="w-5 h-5 text-[var(--whisk-azure)]" />
                            </div>
                            <div className="space-y-2">
                               <span className="text-xs font-bold text-[var(--whisk-azure)] uppercase tracking-wider">{activity.time}</span>
                               <h4 className="text-xl font-black text-[var(--whisk-navy)] tracking-tight">{activity.location}</h4>
                               <p className="text-slate-600 text-sm md:text-base font-medium leading-relaxed">{activity.description}</p>
                            </div>
                         </div>
                       ))}
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

            {/* Google Maps & Search Grounding Citations Panel */}
            {(mapsSources.length > 0 || searchSources.length > 0 || itinerary.mapsOverview) && (
              <div className="bg-white rounded-[3rem] p-10 shadow-xl border-4 border-white space-y-6">
                <div className="flex items-center gap-3">
                  <div className="vibrant-gradient p-3 rounded-2xl text-white">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[var(--whisk-navy)] tracking-tight">Verified Google Maps & Search Intel</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Real-world sources backing this trip</p>
                  </div>
                </div>

                {itinerary.mapsOverview && (
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    {itinerary.mapsOverview}
                  </p>
                )}

                {mapsSources.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-[var(--whisk-orange)]">Google Maps Places</h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {mapsSources.map((src, i) => {
                        const isSaved = savedPlaceNames.has(src.title.toLowerCase());
                        return (
                          <div key={i} className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 flex flex-col justify-between gap-2">
                            <div className="flex items-start justify-between gap-2">
                              <a href={src.uri} target="_blank" rel="noopener noreferrer" className="font-black text-sm text-[var(--whisk-navy)] hover:text-[var(--whisk-orange)] flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-[var(--whisk-orange)] shrink-0" />
                                <span>{src.title}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                              <button
                                type="button"
                                onClick={() =>
                                  onSavePlace({
                                    name: src.title,
                                    type: 'place',
                                    destination: itinerary.destination,
                                    description: src.snippet || `Verified Google Maps spot in ${itinerary.destination}`,
                                    mapsUri: src.uri,
                                  })
                                }
                                className={`p-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                                  isSaved ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-400 hover:text-[var(--whisk-orange)]'
                                }`}
                                title={isSaved ? 'Saved' : 'Save place'}
                              >
                                {isSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            {src.snippet && <p className="text-xs text-slate-500 italic line-clamp-2">"{src.snippet}"</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {searchSources.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-sky-600">Google Search Sources</h4>
                    <div className="flex flex-wrap gap-2">
                      {searchSources.map((src, i) => (
                        <a
                          key={i}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 text-sky-700 text-xs font-bold hover:bg-sky-100 transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span className="max-w-[200px] truncate">{src.title}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <TripToolkit
              itinerary={itinerary}
              onSignInRequest={onSignInRequest}
            />

            <PlacesExplorer
              defaultDestination={itinerary.destination}
              savedPlaceNames={savedPlaceNames}
              onSavePlace={onSavePlace}
            />
          </div>
          
          <div className="space-y-12">
             <ActionSidebar
               recommendations={itinerary.recommendations}
               destination={itinerary.destination}
               savedPlaceNames={savedPlaceNames}
               onSavePlace={onSavePlace}
               unlocked={isUnlocked}
               onOpenPassport={onUnlock}
             />
             {itinerary.blogPost ? (
                <div onClick={() => handleViewPost(itinerary.blogPost!)} className="bg-white rounded-[3rem] p-10 shadow-xl border-4 border-white hover:border-[var(--whisk-orange)]/20 transition-all group cursor-pointer">
                   <h4 className="text-2xl font-black text-[var(--whisk-navy)] mb-6 tracking-tight flex items-center gap-2">
                     Our Deep Dive <ArrowRight className="w-5 h-5 text-[var(--whisk-orange)] group-hover:translate-x-2 transition-transform" />
                   </h4>
                   <img src={itinerary.blogPost.imageUrl} referrerPolicy="no-referrer" className="w-full h-48 object-cover rounded-3xl mb-8" alt="Blog" />
                   <h5 className="font-black text-xl mb-4 text-[var(--whisk-navy)] leading-tight">{itinerary.blogPost.title}</h5>
                   <p className="text-slate-500 text-sm font-medium mb-8 line-clamp-2">{itinerary.blogPost.metaDescription}</p>
                </div>
             ) : generatingBlogPostId === itinerary.id ? (
                <div className="bg-white rounded-[3rem] p-10 shadow-xl border-4 border-dashed border-slate-200 animate-pulse">
                   <h4 className="text-2xl font-black text-[var(--whisk-navy)] mb-3 tracking-tight flex items-center gap-2">
                     <Sparkles className="w-6 h-6 text-[var(--whisk-orange)]" />
                     Writing Field Guide...
                   </h4>
                   <p className="text-slate-400 text-sm font-medium mb-6 leading-relaxed">Curating a custom travel story and insider tips for this adventure...</p>
                   <div className="w-full h-48 bg-slate-100/80 rounded-3xl mb-8 flex items-center justify-center relative overflow-hidden">
                     <span className="text-slate-400 text-xs font-bold uppercase tracking-widest z-10">Preparing Guide...</span>
                   </div>
                </div>
             ) : null}
          </div>
       </div>
    </div>
  );
};

const TripPlannerForm = ({ onGenerate, loading }: any) => {
  const [params, setParams] = React.useState<SearchParams>({ 
    destination: '', 
    duration: '3 days', 
    interests: [], 
    budget: 'Mid-range', 
    pace: 'Moderate', 
    accessibility: [] 
  });
  
  const toggleInterest = (interest: string) => setParams(prev => ({ 
    ...prev, 
    interests: prev.interests.includes(interest) ? prev.interests.filter(i => i !== interest) : [...prev.interests, interest] 
  }));

  const toggleAccessibility = (item: string) => setParams(prev => ({ 
    ...prev, 
    accessibility: prev.accessibility.includes(item) ? prev.accessibility.filter(i => i !== item) : [...prev.accessibility, item] 
  }));

  const accessibilityOptions = [
    'Wheelchair Access',
    'Limited Walking',
    'Elevators Only',
    'Quiet Spaces',
    'Service Animal Friendly',
    'Braille Signage',
    'Low Sensory'
  ];

  return (
    <div className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-tr from-[#E05A47]/10 via-[#F59E0B]/5 to-[#0284C7]/10 transition-all duration-700">
      <img src={LANDMARK_POLAROIDS[2].url} referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover opacity-[0.06] pointer-events-none" alt="Mediterranean Travel Backdrop" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-[4rem] p-10 md:p-20 shadow-2xl border-4 border-white/50 relative">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 bg-[var(--whisk-orange)]/10 text-[var(--whisk-orange)] px-6 py-2 rounded-full text-[12px] font-black uppercase tracking-widest mb-8">Trip Planner</div>
            <h2 className="text-6xl font-black mb-4 tracking-tighter text-[var(--whisk-navy)]">Where next, bestie?</h2>
            <p className="text-slate-500 font-medium text-xl">Give me the vibes, and I'll do the rest.</p>
          </div>
          <div className="space-y-12">
            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-400 ml-6">Destinaton</label>
                <div className="relative group">
                  <MapPin className="absolute left-8 top-1/2 -translate-y-1/2 text-[var(--whisk-orange)] w-7 h-7" />
                  <input type="text" placeholder="Bali, London, Mars..." className="w-full bg-slate-50 border-4 border-transparent rounded-[2.5rem] py-6 pl-20 pr-10 outline-none focus:ring-8 focus:ring-[var(--focus-ring)] focus:bg-white transition-all text-xl font-black text-[var(--whisk-navy)]" value={params.destination} onChange={e => setParams({...params, destination: e.target.value})} />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-400 ml-6">How many days?</label>
                <div className="relative group">
                  <Calendar className="absolute left-8 top-1/2 -translate-y-1/2 text-[var(--whisk-orange)] w-7 h-7" />
                  <select className="w-full bg-slate-50 border-4 border-transparent rounded-[2.5rem] py-6 pl-20 pr-10 outline-none focus:ring-8 focus:ring-[var(--focus-ring)] focus:bg-white transition-all text-xl font-black text-[var(--whisk-navy)] appearance-none cursor-pointer" value={params.duration} onChange={e => setParams({...params, duration: e.target.value})}>
                    {[2,3,4,5,7,10,14,21].map(d => <option key={d} value={`${d} days`}>{d} Days</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-400 ml-6">Budget</label>
                <div className="relative group">
                  <DollarSign className="absolute left-8 top-1/2 -translate-y-1/2 text-[var(--whisk-orange)] w-7 h-7" />
                  <select className="w-full bg-slate-50 border-4 border-transparent rounded-[2.5rem] py-6 pl-20 pr-10 outline-none focus:ring-8 focus:ring-[var(--focus-ring)] focus:bg-white transition-all text-xl font-black text-[var(--whisk-navy)] appearance-none cursor-pointer" value={params.budget} onChange={e => setParams({...params, budget: e.target.value as any})}>
                    <option value="Budget">Shoestring</option>
                    <option value="Mid-range">Comfortable</option>
                    <option value="Luxury">All Out</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-400 ml-6">Energy Level</label>
                <div className="relative group">
                  <Zap className="absolute left-8 top-1/2 -translate-y-1/2 text-[var(--whisk-orange)] w-7 h-7" />
                  <select className="w-full bg-slate-50 border-4 border-transparent rounded-[2.5rem] py-6 pl-20 pr-10 outline-none focus:ring-8 focus:ring-[var(--focus-ring)] focus:bg-white transition-all text-xl font-black text-[var(--whisk-navy)] appearance-none cursor-pointer" value={params.pace} onChange={e => setParams({...params, pace: e.target.value as any})}>
                    <option value="Relaxed">Chill Vibes</option>
                    <option value="Moderate">A Bit of Everything</option>
                    <option value="Fast-paced">Let's Go Everywhere</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <label className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-400 ml-6">Vibes We Want</label>
              <div className="flex flex-wrap gap-3">
                {['Fine Dining', 'Art & Culture', 'Nature', 'Extreme Adventure', 'Shopping', 'Hidden Gems', 'Relaxing', 'Sports'].map(interest => (
                  <button key={interest} onClick={() => toggleInterest(interest)} className={`px-6 py-3 rounded-[2rem] text-sm font-black uppercase tracking-widest transition-all border-4 ${params.interests.includes(interest) ? 'vibrant-gradient border-transparent text-white shadow-xl scale-110' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100 hover:text-[var(--whisk-navy)]'}`}>{interest}</button>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-center gap-4 ml-6">
                <Accessibility className="w-5 h-5 text-slate-400" />
                <label className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-400">Accessibility Needs</label>
              </div>
              <div className="flex flex-wrap gap-3">
                {accessibilityOptions.map(option => (
                  <button key={option} onClick={() => toggleAccessibility(option)} className={`px-6 py-3 rounded-[2rem] text-sm font-black uppercase tracking-widest transition-all border-4 ${params.accessibility.includes(option) ? 'cyan-gradient border-transparent text-white shadow-xl scale-110' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100 hover:text-[var(--whisk-navy)]'}`}>{option}</button>
                ))}
              </div>
            </div>

            <button onClick={() => onGenerate(params)} disabled={loading || !params.destination} className={`w-full py-8 rounded-[3rem] font-black uppercase tracking-[0.5em] text-lg flex items-center justify-center gap-6 transition-all ${loading || !params.destination ? 'bg-slate-100 text-slate-300' : 'vibrant-gradient text-white hover:scale-105 shadow-[var(--shadow-orange)]'}`}>
              {loading ? <div className="flex gap-2"><div className="w-3 h-3 bg-white rounded-full animate-bounce"></div><div className="w-3 h-3 bg-white rounded-full animate-bounce delay-100"></div></div> : <Compass className="w-8 h-8" />}
              {loading ? "Sorting it out, hang tight!" : 'Plan My Trip!'}
            </button>
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
    membershipTier,
    username,
    needsLegalConsent,
    signingIn,
    authError,
    logOut,
    setTier,
    clearAuthError,
  } = useAuth();

  const [loading, setLoading] = React.useState(false);
  const [loadingStatus, setLoadingStatus] = React.useState('');
  const [itinerary, setItinerary] = React.useState<TripItinerary | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'home' | 'my-trips'>('home');
  const [recentTrips, setRecentTrips] = React.useState<TripItinerary[]>([]);
  const [publicGuides, setPublicGuides] = React.useState<BlogPost[]>([]);
  const [savedPlaces, setSavedPlaces] = React.useState<SavedPlace[]>([]);
  const [viewingData, setViewingData] = React.useState<{post: BlogPost, itinerary?: TripItinerary | null} | null>(null);
  const [isMembershipModalOpen, setIsMembershipModalOpen] = React.useState(false);
  const [passportPromptReason, setPassportPromptReason] = React.useState<string | null>(null);
  const [isProfileGateOpen, setIsProfileGateOpen] = React.useState(false);
  const [pendingPlannerAfterAuth, setPendingPlannerAfterAuth] = React.useState(false);
  const [singleTripUnlockedCredit, setSingleTripUnlockedCredit] = React.useState(false);
  const [generatingBlogPostId, setGeneratingBlogPostId] = React.useState<string | null>(null);
  const [bannerError, setBannerError] = React.useState<string | null>(null);
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = React.useState(false);
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
  const [activePromoTab, setActivePromoTab] = React.useState(0);
  const [promoImageIndex, setPromoImageIndex] = React.useState(() => Math.floor(Math.random() * PROMO_TRAVEL_PHOTOS.length));

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

  const handleStartPlanning = () => {
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

  React.useEffect(() => {
    const timer = setInterval(() => {
      setPromoImageIndex((prev) => (prev + 1) % PROMO_TRAVEL_PHOTOS.length);
    }, 6000);
    return () => clearInterval(timer);
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

  const baseArticles = React.useMemo(() => {
    const tripGuides = recentTrips
      .map((t) => t.blogPost)
      .filter((p): p is BlogPost => p !== undefined && p !== null);

    const seenKeys = new Set<string>();
    const combined: BlogPost[] = [];
    for (const item of [...tripGuides, ...publicGuides, ...INITIAL_ARTICLES]) {
      const dedupeKey = item.slug || item.id;
      if (!seenKeys.has(dedupeKey) && !seenKeys.has(item.id)) {
        seenKeys.add(dedupeKey);
        seenKeys.add(item.id);
        combined.push(item);
      }
    }
    return combined;
  }, [recentTrips, publicGuides]);

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
      const associated = matched.itineraryId
        ? recentTrips.find((t) => t.id === matched.itineraryId) || null
        : null;
      setViewingData({ post: matched, itinerary: associated });
    }
  }, [baseArticles, recentTrips, viewingData]);

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
    setLoadingStatus('Mapping your perfect trip with Google Search & Maps...');
    setShowForm(false);
    setItinerary(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const itineraryResult = await generateItinerary(params);
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

      setGeneratingBlogPostId(itineraryResult.id);
      try {
        const blogPostResult = await generateBlogPost(itineraryResult);

        const newBlogPost: BlogPost = {
          ...blogPostResult,
          id: `guide_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          imageUrl: getUniqueTravelImage(params.destination, blogPostResult.title || itineraryResult.id),
          createdAt: new Date().toISOString(),
          isPublished: true,
        };

        setItinerary(prev => {
          if (prev && prev.id === itineraryResult.id) {
            return { ...prev, blogPost: newBlogPost };
          }
          return prev;
        });

        await Promise.all([
          updateItineraryBlogPostInFirestore(itineraryResult.id, newBlogPost),
          publishGuideToFirestore(user.uid, newBlogPost).catch((err) => {
            console.warn('Public organic guide publish skipped:', err);
          }),
        ]);
      } catch (bgErr) {
        console.error("Failed to generate blog post in background:", bgErr);
      } finally {
        setGeneratingBlogPostId(null);
      }
    } catch (err: any) {
      console.error('Error generating itinerary:', err);
      setBannerError(err?.message || "Something went wrong while planning your route. Let's try again?");
      setShowForm(true);
      setLoading(false);
    }
  };

  const handleViewPost = (post: BlogPost) => {
    const associatedItinerary = recentTrips.find(trip => trip.id === post.itineraryId) || null;
    setViewingData({ post, itinerary: associatedItinerary });
    if (typeof window !== 'undefined') {
      const guideKey = post.slug || post.id;
      window.history.replaceState(null, '', `?guide=${encodeURIComponent(guideKey)}`);
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

  if (viewingData) {
    return (
       <div className="min-h-screen selection:bg-[var(--whisk-terracotta)] selection:text-white relative bg-[#FAFAFA] transition-all duration-700">
         {mapsQuotaExceeded && <MapsQuotaBanner />}
         <div className="relative z-10 flex flex-col min-h-screen justify-between">
           <div>
             <Navbar user={user} username={username} membershipTier={membershipTier} signingIn={signingIn} onHome={handleReturnHome} onMyTrips={() => { if(user) setActiveTab('my-trips'); setItinerary(null); handleCloseGuide(); }} onSignIn={openAuthModal} onLogOut={handleLogOut} activeTab={'home'} onUpgrade={handleUnlock} />
             <BlogPostDisplay
               post={viewingData.post}
               hasActiveSubscription={hasActiveSubscription}
               itinerary={viewingData.itinerary}
               onBack={handleCloseGuide}
               savedPlaceNames={savedPlaceNames}
               onSavePlace={handleSaveOrTogglePlace}
               onOpenPassport={handleUnlock}
               onPlanDestination={() => {
                 handleCloseGuide();
                 handleStartPlanning();
               }}
             />
           </div>
           <LegalFooter onOpenLegalDoc={openLegalDoc} compact />
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

  const isLandingView = !loading && !itinerary && !showForm && activeTab === 'home';

  return (
    <div className={`min-h-screen selection:bg-[var(--whisk-terracotta)] selection:text-white relative transition-all duration-700 ${isLandingView ? 'whisk-ombre-bg' : 'bg-[#FAFAFA]'}`}>
      {mapsQuotaExceeded && <MapsQuotaBanner />}
      <Navbar user={user} username={username} membershipTier={membershipTier} signingIn={signingIn} onHome={handleReturnHome} onMyTrips={() => { if(user) setActiveTab('my-trips'); setItinerary(null); setShowForm(false); }} onSignIn={openAuthModal} onLogOut={handleLogOut} activeTab={activeTab} onUpgrade={handleUnlock} />

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
            {/* Vibrant Travel Icon Bar (no city list) */}
            <div className="flex items-center justify-center gap-3 mb-5">
              {HERO_CARD_ICONS.map(({ Icon, color, bg }, idx) => (
                <div
                  key={idx}
                  className={`w-10 h-10 rounded-2xl ${bg} flex items-center justify-center shadow-xs transition-transform duration-200 hover:scale-110`}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
              ))}
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-[var(--whisk-navy)] mb-4 tracking-tight leading-[1.08] text-balance">
              Where will you{' '}
              <span className="whisk-text-ombre">
                whisk to?
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 max-w-sm mx-auto leading-relaxed font-medium mb-7">
              Curated local routes backed by live search and Google Maps. Create your profile to preview your first trip free.
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
        <TripPlannerForm onGenerate={handleGenerate} loading={loading} />
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
            />
          </section>
          <section className="py-24 relative overflow-hidden transition-all duration-700">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
              <div className="grid md:grid-cols-2 gap-14 lg:gap-20 items-start">
                <div className="relative">
                  <img
                    key={promoImageIndex}
                    src={PROMO_TRAVEL_PHOTOS[promoImageIndex]}
                    referrerPolicy="no-referrer"
                    className="rounded-[4rem] shadow-2xl border-8 border-white object-cover aspect-[4/3] w-full animate-in fade-in duration-1000"
                    alt="Travel Scene"
                  />
                </div>
                <div className="space-y-8 bg-white/95 backdrop-blur-md rounded-[3rem] p-8 md:p-10 shadow-2xl border-2 border-white">
                  <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-[var(--whisk-navy)] leading-tight">Better Trips, Fast.</h2>
                  <div className="w-full bg-slate-50/90 p-6 rounded-[2rem] border border-slate-100">
                    <div className="flex border-b border-slate-200/70 pb-3 mb-6 gap-2 sm:gap-4">
                      <button
                        onClick={() => setActivePromoTab(0)}
                        className={`flex-1 flex items-center justify-center gap-3 py-3 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                          activePromoTab === 0
                            ? 'vibrant-gradient text-white shadow-md'
                            : 'bg-white text-slate-600 hover:text-[var(--whisk-navy)]'
                        }`}
                        id="btn-promo-tab-vetted"
                      >
                        <Heart className={`w-3.5 h-3.5 ${activePromoTab === 0 ? 'fill-white text-white' : 'text-slate-400'}`} />
                        Vetted Advice
                      </button>
                      
                      <button
                        onClick={() => setActivePromoTab(1)}
                        className={`flex-1 flex items-center justify-center gap-3 py-3 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                          activePromoTab === 1
                            ? 'vibrant-gradient text-white shadow-md'
                            : 'bg-white text-slate-600 hover:text-[var(--whisk-navy)]'
                        }`}
                        id="btn-promo-tab-seconds"
                      >
                        <Zap className={`w-3.5 h-3.5 ${activePromoTab === 1 ? 'fill-white text-white' : 'text-slate-400'}`} />
                        Ready in Seconds
                      </button>
                    </div>

                    <div className="px-2 py-1 duration-300 animate-in fade-in zoom-in-95">
                      {activePromoTab === 0 ? (
                        <div>
                          <h4 className="text-lg font-black uppercase tracking-wider text-[var(--whisk-navy)] mb-2 flex items-center gap-2">
                            Only the Best Hand-Picked Advice
                          </h4>
                          <p className="text-slate-600 font-medium leading-relaxed text-sm">
                            We don't do sponsored lists. Every recommendation is cross-checked with real-time Search and Google Maps data. Only the places I'd tell my best friend about.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-lg font-black uppercase tracking-wider text-[var(--whisk-navy)] mb-2 flex items-center gap-2">
                            A Full Personal Route Ready in Coffee Time
                          </h4>
                          <p className="text-slate-600 font-medium leading-relaxed text-sm">
                            Stop spending weeks parsing countless forums. Our smart planner creates a complete custom local route in the time it takes to grab a cup of hot espresso.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <TrustTabs />
                </div>
              </div>
            </div>
          </section>
        </>
      )}
      
      {!loading && !itinerary && activeTab === 'my-trips' && (
         <div className="relative overflow-hidden bg-gradient-to-tr from-orange-50/60 via-amber-50/30 to-rose-50/60 min-h-[75vh] py-16 transition-all duration-700">
           <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:20px_20px] opacity-40 pointer-events-none"></div>
           <div className="max-w-7xl mx-auto px-6 sm:px-10 relative z-10 pt-10 space-y-20">
             <div>
               <h2 className="text-5xl md:text-7xl font-black mb-12 tracking-tighter text-center text-[var(--whisk-navy)]">My Saved Trips</h2>
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
                        <div className="inline-block bg-orange-50 text-[var(--whisk-orange)] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                          {trip.duration}
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
               <h3 className="text-4xl md:text-5xl font-black mb-10 tracking-tighter text-center text-[var(--whisk-navy)]">Saved Favorite Places</h3>
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
                   <p className="text-slate-400 font-bold">Bookmark any hotel, restaurant, or Google Maps spot to keep it handy here!</p>
                 </div>
               )}
             </div>
           </div>
         </div>
      )}
      
      {itinerary && !loading && (
        <div className="relative overflow-hidden bg-gradient-to-tr from-orange-50/60 via-amber-50/30 to-rose-50/60 min-h-screen transition-all duration-700">
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:20px_20px] opacity-40 pointer-events-none"></div>
          <div className="relative z-10">
            <ItineraryDisplay 
              itinerary={itinerary}
              hasActiveSubscription={hasActiveSubscription}
              onRateActivity={() => {}} 
              onRateOverall={() => {}} 
              onUnlock={handleUnlock}
              handleViewPost={handleViewPost}
              generatingBlogPostId={generatingBlogPostId}
              savedPlaceNames={savedPlaceNames}
              onSavePlace={handleSaveOrTogglePlace}
              onCoordinatesHydrated={handleCoordinatesHydrated}
              onSignInRequest={openAuthModal}
            />
            <div className="max-w-7xl mx-auto px-6 pb-40 flex flex-col items-center gap-12">
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
      <LegalFooter onOpenLegalDoc={openLegalDoc} />
    </div>
  );
}
