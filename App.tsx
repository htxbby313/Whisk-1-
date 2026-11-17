import React, { useState, useEffect, useRef } from 'react';
import Toast from './src/components/Toast';
import AuthModal, { UserProfile } from './src/components/AuthModal';
import SubscriptionModal from './src/components/SubscriptionModal';
import LegalModal, { LegalTab } from './src/components/LegalModal';
import ProfileModal from './src/components/ProfileModal';
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
  Zap,
  Share2,
  ShieldCheck,
  Globe,
  User,
  LogOut,
  Lock,
  MessageCircle,
  Send,
  X,
  Brain,
  Loader2,
  Mountain,
  Crown,
  Car,
  Shield,
} from 'lucide-react';
import {
  generateItinerary,
  sendChatMessage,
  sendFastChatMessage,
  sendThinkingChatMessage,
} from './geminiService';
import { SearchParams, TripItinerary } from './types';
import {
  POLAROID_HERO_COLLECTION,
  getDestinationImage,
} from './src/utils/destinationImages';
import {
  applyDynamicSeoAndGeo,
  getDestinationGeo,
  generateItinerarySeo,
} from './src/utils/seoGeoHelper';
import { MASTER_DEMO_ITINERARIES } from './src/utils/masterDemoItineraries';

// World-inspired vibrant colors
const colors = {
  primary: '#FF5722', // Marrakech Spice Terracotta
  secondary: '#0284C7', // Mediterranean Azure
  accent: '#F59E0B', // Jaipur Saffron Gold
  nature: '#059669', // Bali Emerald Palm
  berry: '#E11D48', // Havana Bougainvillea
  indigo: '#4338CA', // Aegean Deep Sea
  dark: '#1E1B18', // Warm Espresso Obsidian
  light: '#FFFDF9', // Sun-drenched Ivory Parchment
};

export const StarRating = ({
  rating = 0,
  onRate,
  size = 4,
  interactive = true,
}: {
  rating?: number;
  onRate?: (r: number) => void;
  size?: number;
  interactive?: boolean;
}) => {
  const [hover, setHover] = useState(0);
  const sizeMap: Record<number, string> = {
    4: 'w-4 h-4',
    5: 'w-5 h-5',
    6: 'w-6 h-6',
    12: 'w-8 h-8',
  };
  const starClass = sizeMap[size] || sizeMap[4];
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          className={`transition-all ${interactive ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'}`}
        >
          <Star
            className={`${starClass} ${
              star <= (hover || rating)
                ? 'fill-amber-400 text-amber-400'
                : 'text-slate-200 fill-slate-50'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'standard' | 'fast' | 'thinking'>(
    'standard'
  );
  const [messages, setMessages] = useState<
    { role: 'user' | 'ai'; text: string; type?: string }[]
  >([
    {
      role: 'ai',
      text: "Bonjour! I'm your Whisk travel concierge. Where in the world are you dreaming of heading next?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    const updated = [...messages, { role: 'user' as const, text: userMsg }];
    setMessages(updated);
    setInput('');
    setIsLoading(true);
    try {
      let reply: string;
      if (mode === 'fast') {
        reply = await sendFastChatMessage(userMsg);
      } else if (mode === 'thinking') {
        reply = await sendThinkingChatMessage(userMsg);
      } else {
        const historyForGemini = updated.map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }],
        }));
        reply = await sendChatMessage(userMsg, historyForGemini);
      }
      setMessages([...updated, { role: 'ai', text: reply, type: mode }]);
    } catch {
      setMessages([
        ...updated,
        {
          role: 'ai',
          text: 'Our communications scout hit interference! Please check your signal and try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200]">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{ backgroundColor: colors.primary }}
          aria-label="Open chat"
          className="text-white p-5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center gap-3 border-4 border-white/80 group cursor-pointer"
        >
          <MessageCircle className="w-7 h-7" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-500 font-black text-xs uppercase tracking-widest">
            Chat with Scout
          </span>
        </button>
      )}

      {isOpen && (
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-orange-100 w-[90vw] sm:w-[420px] h-[580px] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
          <div
            style={{ backgroundColor: colors.dark }}
            className="p-5 text-white flex justify-between items-center border-b border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Whisk Concierge</h4>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => setMode('standard')}
                    className={`text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full transition-colors ${
                      mode === 'standard'
                        ? 'bg-orange-500 text-white'
                        : 'bg-white/10 text-white/50'
                    }`}
                  >
                    Bespoke
                  </button>
                  <button
                    onClick={() => setMode('thinking')}
                    className={`text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full transition-colors ${
                      mode === 'thinking'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-white/10 text-white/50'
                    }`}
                  >
                    Deep Scout
                  </button>
                  <button
                    onClick={() => setMode('fast')}
                    className={`text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full transition-colors ${
                      mode === 'fast'
                        ? 'bg-amber-400 text-slate-900'
                        : 'bg-white/10 text-white/50'
                    }`}
                  >
                    Quick
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="hover:bg-white/10 p-2 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-tr-none shadow-md'
                      : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-tl-none font-medium'
                  }`}
                >
                  {m.role === 'ai' && m.type === 'thinking' && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2">
                      <Brain className="w-3 h-3" /> Consulting Scout Archives...
                    </div>
                  )}
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                  <span className="text-sm text-slate-400 italic">
                    Charting a course...
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              placeholder="Ask anything about any destination..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              style={{ backgroundColor: colors.primary }}
              className="text-white p-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Navbar = ({
  userProfile,
  isSubscribed,
  onHome,
  onMyTrips,
  onSignIn,
  onLogOut,
  onOpenPassport,
  onOpenProfile,
  activeTab,
}: {
  userProfile: UserProfile | null;
  isSubscribed: boolean;
  onHome: () => void;
  onMyTrips: () => void;
  onSignIn: () => void;
  onLogOut: () => void;
  onOpenPassport: () => void;
  onOpenProfile?: () => void;
  activeTab: string;
}) => (
  <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl shadow-sm border-b border-orange-100/80">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-20">
        <button
          onClick={onHome}
          className="flex items-center gap-3 hover:opacity-90 transition-all group cursor-pointer"
        >
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-rose-500 shadow-lg shadow-orange-500/25 group-hover:scale-110 transition-transform">
            <Plane className="text-white w-6 h-6 -rotate-45" />
          </div>
          <div className="text-left">
            <span
              className="text-2xl font-black tracking-tighter uppercase block leading-none"
              style={{ color: colors.dark }}
            >
              Whisk
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-orange-600 block mt-0.5">
              Passport Club
            </span>
          </div>
        </button>

        {/* Actions: Visible on all screens */}
        <div className="flex items-center gap-3 md:gap-6">
          <div className="hidden md:flex items-center space-x-6">
            <button
              onClick={onHome}
              className={`text-xs font-black uppercase tracking-widest transition-colors cursor-pointer ${
                activeTab === 'home'
                  ? 'text-orange-600'
                  : 'text-slate-500 hover:text-orange-500'
              }`}
            >
              Explore
            </button>
            {userProfile && (
              <>
                <button
                  onClick={onMyTrips}
                  className={`text-xs font-black uppercase tracking-widest transition-colors cursor-pointer ${
                    activeTab === 'my-trips'
                      ? 'text-orange-600'
                      : 'text-slate-500 hover:text-orange-500'
                  }`}
                >
                  My Expeditions
                </button>
                <button
                  onClick={onOpenProfile}
                  className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-orange-500 transition-colors cursor-pointer"
                >
                  Passport & ID
                </button>
              </>
            )}
          </div>

          {/* Membership Badge / Upgrade Button */}
          {isSubscribed ? (
            <button
              onClick={onOpenProfile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-black text-[10px] md:text-[11px] uppercase tracking-wider shadow-md hover:scale-105 transition-all cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 fill-slate-900 text-slate-900" />
              <span>Passport Member</span>
            </button>
          ) : (
            <button
              onClick={onOpenPassport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 md:px-5 md:py-2.5 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 text-white font-black text-[10px] md:text-xs uppercase tracking-widest shadow-md hover:shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current text-yellow-200" />
              <span>Passport</span>
            </button>
          )}

          {userProfile ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenProfile}
                aria-label="Open traveler passport & profile"
                className="flex items-center gap-2 bg-slate-50 hover:bg-orange-50 border border-slate-200/80 hover:border-orange-300 px-3 py-1.5 rounded-full shadow-sm transition-all cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-white font-black text-xs flex items-center justify-center group-hover:scale-105 transition-transform">
                  {userProfile.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-slate-800 hidden sm:inline group-hover:text-orange-600 transition-colors">
                  {userProfile.name}
                </span>
                <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 hidden lg:inline">
                  Passport ID
                </span>
              </button>
              <button
                onClick={onLogOut}
                aria-label="Log out"
                className="text-slate-400 hover:text-red-500 transition-colors p-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              style={{ backgroundColor: colors.dark }}
              className="text-white px-3.5 py-2 md:px-6 md:py-2.5 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-orange-400" />
              <span>Create Profile</span>
            </button>
          )}
        </div>
      </div>
    </div>
  </nav>
);

// Community Feed with Verified Landmark Photography
const CommunityFeed = ({
  itineraries,
  onView,
}: {
  itineraries: TripItinerary[];
  onView: (trip: TripItinerary) => void;
}) => {
  const defaultTrending: TripItinerary[] = [
    {
      id: 'kyoto_1',
      title: 'Whispering Bamboo & Zen Shrines',
      destination: 'Kyoto, Japan',
      duration: '4 days',
      summary:
        'Explore Fushimi Inari at dawn, private tea ceremonies, and bamboo forests.',
      days: [],
      recommendations: [],
      createdAt: new Date().toISOString(),
      budget: 'Luxury',
      pace: 'Relaxed',
      overallRating: 5,
    },
    {
      id: 'amalfi_1',
      title: 'Cliffside Lemons & Pastel Harbors',
      destination: 'Amalfi Coast, Italy',
      duration: '5 days',
      summary:
        'Private Gozzo boat to Capri, cliffside seafood trattorias, and sunset limoncello.',
      days: [],
      recommendations: [],
      createdAt: new Date().toISOString(),
      budget: 'Luxury',
      pace: 'Moderate',
      overallRating: 5,
    },
    {
      id: 'santorini_1',
      title: 'Aegean Blue Domes & Oia Sunsets',
      destination: 'Santorini, Greece',
      duration: '4 days',
      summary:
        'Volcanic caldera cruises, private wine tastings, and secret cliff walks.',
      days: [],
      recommendations: [],
      createdAt: new Date().toISOString(),
      budget: 'Mid-range',
      pace: 'Relaxed',
      overallRating: 4.9,
    },
  ];

  const displayList =
    itineraries.length > 0 ? itineraries.slice(0, 3) : defaultTrending;

  return (
    <section className="py-24 bg-gradient-to-b from-[#FFFDF9] to-white relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-16">
          <div>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 shadow-sm">
              <TrendingUp className="w-4 h-4 text-orange-600" /> Scout-Verified
              Expeditions
            </div>
            <h2
              className="text-4xl md:text-5xl font-black mb-3 tracking-tight"
              style={{ color: colors.dark }}
            >
              Trending Global Escapes
            </h2>
            <p className="text-slate-600 text-base md:text-lg font-medium max-w-2xl">
              Authentic journeys charted across 150+ countries. Real scouts,
              verified spots, unforgettable routes.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {displayList.map((trip) => {
            const photoUrl = getDestinationImage(trip.destination);
            return (
              <div
                key={trip.id}
                className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl hover:shadow-2xl border border-slate-100 transition-all duration-300 group cursor-pointer hover:-translate-y-2 flex flex-col"
                onClick={() => onView(trip)}
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={photoUrl}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    alt={trip.destination}
                  />
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    <span className="bg-orange-500/90 backdrop-blur-md text-white px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md">
                      {trip.budget || 'Mid-range'}
                    </span>
                    <span className="bg-emerald-600/90 backdrop-blur-md text-white px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                      <Mountain className="w-3 h-3" /> {trip.pace || 'Moderate'}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-5 left-6 right-6 text-white">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.25em] mb-1 text-amber-300">
                      <MapPin className="w-3.5 h-3.5" />
                      {trip.destination}
                    </div>
                    <h3 className="text-xl font-black tracking-tight leading-snug line-clamp-1">
                      {trip.title}
                    </h3>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <p className="text-slate-600 text-xs md:text-sm font-medium leading-relaxed mb-6 line-clamp-2">
                    {trip.summary}
                  </p>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs font-black uppercase tracking-wider text-orange-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Inspect Route <ChevronRight className="w-4 h-4" />
                    </span>
                    <div className="bg-amber-50 px-2.5 py-1 rounded-xl flex items-center gap-1 text-xs font-black text-amber-700">
                      <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                      4.9
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// "Where will you whisk to?" Central Hero Component with Wall-to-Wall Polaroids
const WhiskHeroSection = ({
  userProfile,
  isSubscribed,
  onGenerate,
  onOpenAuth,
  onOpenPassport,
  loading,
}: {
  userProfile: UserProfile | null;
  isSubscribed: boolean;
  onGenerate: (params: SearchParams) => void;
  onOpenAuth: () => void;
  onOpenPassport: () => void;
  loading: boolean;
}) => {
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('3 days');
  const [interests, setInterests] = useState<string[]>([
    'Fine Dining',
    'Art & Culture',
  ]);
  const [budget, setBudget] = useState<'Budget' | 'Mid-range' | 'Luxury'>(
    'Mid-range'
  );
  const [pace, setPace] = useState<'Relaxed' | 'Moderate' | 'Fast-paced'>(
    'Moderate'
  );

  const popularChips = [
    { label: 'Paris, France', icon: '🗼' },
    { label: 'Tokyo, Japan', icon: '⛩️' },
    { label: 'Amalfi Coast, Italy', icon: '🍋' },
    { label: 'Bali, Indonesia', icon: '🌴' },
    { label: 'Marrakech, Morocco', icon: '🐪' },
    { label: 'Swiss Alps', icon: '🏔️' },
  ];

  const vibeOptions = [
    'Fine Dining',
    'Art & Culture',
    'Nature & Wildlife',
    'Extreme Adventure',
    'Hidden Gems',
    'Coastal Relax',
  ];

  const toggleInterest = (vibe: string) => {
    setInterests((prev) =>
      prev.includes(vibe) ? prev.filter((i) => i !== vibe) : [...prev, vibe]
    );
  };

  const handleWhiskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim() || loading) return;
    onGenerate({
      destination: destination.trim(),
      duration,
      interests,
      budget,
      pace,
      accessibility: [],
    });
  };

  return (
    <div className="relative min-h-[95vh] w-full flex items-center justify-center py-16 px-4 overflow-hidden bg-[#FAF6EE]">
      {/* =========================================================================
          WALL-TO-WALL POLAROID MOSAIC BACKDROP
          Fills the entire space behind the card (top, bottom, center, and sides)
          ========================================================================= */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
        {/* Semi-transparent radial vignette to guarantee center contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-orange-500/10 z-10"></div>
        <div className="absolute inset-0 bg-[#FAF6EE]/40 backdrop-blur-[1px] z-10"></div>

        {/* Dense responsive grid of authentic tilted polaroids */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8 p-4 -m-8 opacity-85">
          {POLAROID_HERO_COLLECTION.concat(POLAROID_HERO_COLLECTION).map(
            (polaroid, index) => (
              <div
                key={`${polaroid.id}-${index}`}
                className={`transform ${polaroid.rotation} transition-transform duration-700 hover:scale-105 hover:z-30`}
              >
                {/* Polaroid Frame */}
                <div className="bg-white p-3.5 pb-8 rounded-2xl shadow-[0_20px_45px_-10px_rgba(0,0,0,0.25)] border-2 border-slate-100 flex flex-col items-center">
                  {/* Pin / Tape graphic */}
                  <div
                    className="w-4 h-4 rounded-full shadow-md -mt-2 mb-2 border-2 border-white"
                    style={{ backgroundColor: polaroid.pinColor }}
                  ></div>
                  {/* Photo */}
                  <div className="w-full aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 mb-3 shadow-inner">
                    <img
                      src={polaroid.image}
                      alt={polaroid.destination}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  {/* Handwriting caption */}
                  <div className="w-full text-center px-1">
                    <span className="font-serif font-black text-slate-800 text-xs md:text-sm block tracking-tight">
                      {polaroid.destination}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mt-0.5">
                      {polaroid.country}
                    </span>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* =========================================================================
          FOREGROUND: "WHERE WILL YOU WHISK TO?" INTERACTIVE CARD
          ========================================================================= */}
      <div className="relative z-20 w-full max-w-3xl">
        <div className="bg-white/95 backdrop-blur-2xl rounded-[3.5rem] p-8 md:p-12 shadow-[0_35px_90px_-15px_rgba(0,0,0,0.35)] border-4 border-white">
          {/* Card Header Badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 text-white font-black text-[10px] md:text-[11px] uppercase tracking-[0.3em] shadow-lg mb-4">
              <Sparkles className="w-4 h-4 fill-current text-yellow-200" />
              1st Trip Free Preview • Whisk Passport
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-2 leading-tight">
              Where will you{' '}
              <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 bg-clip-text text-transparent">
                whisk to?
              </span>
            </h1>
            <p className="text-slate-600 text-sm md:text-base font-semibold max-w-lg mx-auto mb-6">
              Tell our world scouts your dream destination. We chart the
              ultimate day-by-day expedition in seconds.
            </p>

            {!userProfile ? (
              <div className="p-4 rounded-3xl bg-gradient-to-r from-orange-100/90 via-amber-100/90 to-rose-100/90 border-2 border-orange-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-left shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Required: Create Traveler Profile
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium">
                      Your first custom expedition preview is completely free!
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  Create Profile ✨
                </button>
              </div>
            ) : (
              <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-800 font-semibold text-left">
                <span>
                  Welcome, <strong>{userProfile.name}</strong> (
                  {isSubscribed
                    ? '👑 Passport Active'
                    : '✨ 1 Free Trip Active'}
                  )
                </span>
                {!isSubscribed && (
                  <button
                    type="button"
                    onClick={onOpenPassport}
                    className="text-[11px] font-black uppercase text-orange-600 hover:underline cursor-pointer ml-2"
                  >
                    Upgrade
                  </button>
                )}
              </div>
            )}
          </div>

          <form onSubmit={handleWhiskSubmit} className="space-y-6">
            {/* Destination Input */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2 ml-2">
                Dream Destination
              </label>
              <div className="relative group">
                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-500 w-6 h-6 group-focus-within:scale-110 transition-transform" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Kyoto, Positano, Bali, Swiss Alps..."
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-[2rem] py-5 pl-16 pr-6 outline-none focus:ring-4 focus:ring-orange-200 focus:bg-white focus:border-orange-500 text-lg md:text-xl font-bold transition-all text-slate-800 placeholder:text-slate-400"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>

              {/* Quick Destination Chips */}
              <div className="flex flex-wrap gap-2 mt-3 ml-1">
                {popularChips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => setDestination(chip.label)}
                    className="px-3.5 py-1.5 bg-orange-50/70 hover:bg-orange-100 text-slate-800 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 border border-orange-200/60 cursor-pointer"
                  >
                    <span>{chip.icon}</span>
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stay Duration & Budget Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2 ml-2">
                  Duration
                </label>
                <div className="relative">
                  <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500 w-5 h-5 pointer-events-none" />
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3.5 pl-14 pr-8 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer"
                  >
                    <option value="2 days">2 Days (Weekend Flash)</option>
                    <option value="3 days">3 Days (Long Weekend)</option>
                    <option value="4 days">4 Days (Classic Route)</option>
                    <option value="5 days">5 Days (In-Depth)</option>
                    <option value="7 days">
                      7 Days (Full Week Expedition)
                    </option>
                    <option value="10 days">10 Days (Grand Tour)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2 ml-2">
                  Budget Style
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
                  {(['Budget', 'Mid-range', 'Luxury'] as const).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBudget(b)}
                      className={`py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                        budget === b
                          ? 'bg-white text-orange-600 shadow-md scale-102'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Travel Pace */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2 ml-2">
                Pace of Exploration
              </label>
              <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl">
                {(['Relaxed', 'Moderate', 'Fast-paced'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPace(p)}
                    className={`py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                      pace === p
                        ? 'bg-white text-orange-600 shadow-md scale-102'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Travel Vibe Multi-select */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2 ml-2">
                Travel Vibe
              </label>
              <div className="flex flex-wrap gap-2">
                {vibeOptions.map((vibe) => (
                  <button
                    key={vibe}
                    type="button"
                    onClick={() => toggleInterest(vibe)}
                    className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-2 ${
                      interests.includes(vibe)
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-500 text-white shadow-md scale-105'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300'
                    }`}
                  >
                    {vibe}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !destination.trim()}
              className="w-full mt-2 py-5 px-8 rounded-[2.5rem] bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 text-white font-black text-sm uppercase tracking-[0.3em] shadow-2xl hover:shadow-orange-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                  <span>Consulting Scouts for {destination}...</span>
                </>
              ) : (
                <>
                  <Compass className="w-6 h-6 text-yellow-200 animate-spin-slow" />
                  <span>Whisk Me Away ✨</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Itinerary Display with Subscription Paywall Gating
const ItineraryDisplay = ({
  itinerary,
  isSubscribed,
  onRateActivity,
  onRateOverall,
  onOpenPassport,
  onOpenLegal,
}: {
  itinerary: TripItinerary;
  isSubscribed: boolean;
  onRateActivity: (dIdx: number, aIdx: number, r: number) => void;
  onRateOverall: (r: number) => void;
  onOpenPassport: (reason?: string) => void;
  onOpenLegal?: (tab: LegalTab) => void;
}) => {
  const destinationHeroPhoto = getDestinationImage(itinerary.destination);
  const geo = itinerary.geo || getDestinationGeo(itinerary.destination);
  const seo =
    itinerary.seo ||
    generateItinerarySeo(
      itinerary.destination,
      itinerary.duration,
      itinerary.summary
    );

  useEffect(() => {
    applyDynamicSeoAndGeo(itinerary);
  }, [itinerary]);

  // Users on free trial only see half of the itinerary days
  const totalDays = itinerary.days.length;
  const freeDaysCount = Math.max(1, Math.ceil(totalDays / 2));
  const visibleDays = isSubscribed
    ? itinerary.days
    : itinerary.days.slice(0, freeDaysCount);
  const lockedDays = isSubscribed ? [] : itinerary.days.slice(freeDaysCount);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-in fade-in duration-500">
      {/* SEO & Geo-Targeted Breadcrumbs & Location Bar */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-semibold text-slate-500 bg-white/90 backdrop-blur-md px-6 py-4 rounded-[2rem] border border-slate-200/80 shadow-sm">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2">
          <span className="text-slate-400">Whisk</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-400">Expeditions</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 font-bold">{geo.country}</span>
          <span className="text-slate-300">/</span>
          <span className="text-orange-600 font-black">{geo.city}</span>
        </nav>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-mono font-bold">
            <MapPin className="w-3.5 h-3.5 text-orange-500" />
            {geo.latitude.toFixed(4)}° N, {geo.longitude.toFixed(4)}° E
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold">
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            {geo.region} ({geo.timezone || 'Local'})
          </span>
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 hidden lg:inline">
            SEO Slug: /{seo.slug}
          </span>
        </div>
      </div>

      {/* Free Preview Banner */}
      {!isSubscribed && (
        <div className="mb-10 p-6 md:p-8 rounded-[2.5rem] bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
              <Lock className="w-7 h-7 text-yellow-200" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-[0.25em] text-yellow-200 mb-1">
                Free First Trip Preview Active
              </div>
              <h3 className="text-xl md:text-2xl font-black tracking-tight leading-tight">
                Viewing Days 1–{freeDaysCount} of your {totalDays}-Day
                Expedition
              </h3>
              <p className="text-white/80 text-xs md:text-sm font-medium mt-1">
                Booking links, hotel recommendations, and Days{' '}
                {freeDaysCount + 1}–{totalDays} are locked for Passport members.
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              onOpenPassport('Unlock full days and all booking links')
            }
            className="px-8 py-4 rounded-2xl bg-white text-orange-600 font-black text-xs uppercase tracking-widest shadow-xl hover:bg-yellow-50 hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            Unlock Full Itinerary ($4.99 or Pass)
          </button>
        </div>
      )}

      {/* Main Destination Hero Header Card */}
      <div className="relative rounded-[3.5rem] overflow-hidden shadow-2xl border-4 border-white mb-16">
        <img
          src={destinationHeroPhoto}
          alt={itinerary.destination}
          className="w-full h-[420px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

        <div className="absolute bottom-8 left-8 right-8 text-white max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest mb-3 shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Curated Whisk
            Route
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-3">
            {itinerary.title}
          </h1>
          <p className="text-slate-200 text-sm md:text-base font-medium line-clamp-3 mb-6 max-w-2xl leading-relaxed">
            {itinerary.summary}
          </p>
          <div className="flex flex-wrap gap-4 text-xs font-bold">
            <span className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-orange-400" />{' '}
              {itinerary.destination}
            </span>
            <span className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-400" />{' '}
              {itinerary.duration}
            </span>
            <span className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-400" />{' '}
              {itinerary.pace || 'Moderate'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Left 2 Cols: Timeline of Days */}
        <div className="lg:col-span-2 space-y-16">
          {/* Visible Days (Free or Subscribed) */}
          {visibleDays.map((day, dIdx) => (
            <div key={dIdx} className="relative pl-12 md:pl-16">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-orange-400 to-amber-300 rounded-full"></div>
              <div
                style={{ backgroundColor: colors.primary }}
                className="absolute left-[-20px] top-0 text-white w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-sm md:text-base font-black shadow-xl border-4 border-white"
              >
                {day.dayNumber}
              </div>
              <div className="mb-8">
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.3em] block mb-1">
                  Day {day.dayNumber}
                </span>
                <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                  {day.theme}
                </h3>
              </div>
              <div className="space-y-6">
                {day.activities.map((act, aIdx) => (
                  <div
                    key={aIdx}
                    className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-slate-100 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div
                        style={{ backgroundColor: colors.dark }}
                        className="inline-flex items-center gap-2 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider w-fit"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        {act.time}
                      </div>
                      <StarRating
                        rating={act.userRating}
                        onRate={(r) => onRateActivity(dIdx, aIdx, r)}
                        size={4}
                      />
                    </div>
                    <h4 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
                      <MapPin className="text-orange-500 w-5 h-5 shrink-0" />
                      {act.location}
                    </h4>
                    <p className="text-slate-600 text-sm md:text-base leading-relaxed font-medium">
                      {act.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Locked Days (when not subscribed) */}
          {lockedDays.map((day) => (
            <div key={day.dayNumber} className="relative pl-12 md:pl-16">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-200 rounded-full"></div>
              <div className="absolute left-[-20px] top-0 bg-slate-300 text-slate-600 w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-sm md:text-base font-black shadow-md border-4 border-white">
                <Lock className="w-5 h-5 text-slate-600" />
              </div>

              <div className="mb-6 opacity-60">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-1">
                  Day {day.dayNumber} (Locked)
                </span>
                <h3 className="text-2xl md:text-3xl font-black text-slate-700 tracking-tight">
                  {day.theme}
                </h3>
              </div>

              {/* Blurred Locked Card */}
              <div className="relative rounded-3xl overflow-hidden border-2 border-dashed border-amber-300 bg-amber-50/50 p-8 text-center flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900 mb-1">
                    Day {day.dayNumber} Activities Hidden
                  </h4>
                  <p className="text-slate-600 text-xs md:text-sm font-medium max-w-md">
                    Upgrade to Whisk Passport to unlock the full itinerary with
                    detailed timings, hidden local gems, and transport tips.
                  </p>
                </div>
                <button
                  onClick={() =>
                    onOpenPassport(`Unlock Day ${day.dayNumber} activities`)
                  }
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-xs uppercase tracking-widest shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  Unlock with Passport
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Col: Booking Hub & Expert Picks */}
        <div className="space-y-8">
          {/* Expert Partner Recommendations */}
          <div
            style={{ backgroundColor: colors.dark }}
            className="text-white rounded-[3rem] p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black flex items-center gap-3 tracking-tight">
                <Crown className="text-amber-400 w-7 h-7" />
                Partner Picks
              </h3>
              {isSubscribed ? (
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
                  Unlocked
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Passport Only
                </span>
              )}
            </div>

            {/* Recommendations List */}
            <div className="space-y-6">
              {itinerary.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="bg-white/5 rounded-2xl p-5 border border-white/10 relative overflow-hidden"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-orange-500 p-2.5 rounded-xl text-white">
                      {rec.type === 'hotel' ? (
                        <Hotel className="w-5 h-5" />
                      ) : rec.type === 'restaurant' ? (
                        <Utensils className="w-5 h-5" />
                      ) : (
                        <Camera className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
                      Top-Rated {rec.type}
                    </span>
                  </div>

                  {isSubscribed ? (
                    <>
                      <h4 className="font-black text-lg mb-2 text-white">
                        {rec.name}
                      </h4>
                      <p className="text-slate-400 text-xs mb-4 line-clamp-2 leading-relaxed">
                        {rec.description}
                      </p>
                      <a
                        href={rec.affiliateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full bg-white text-slate-900 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-orange-100 transition-all"
                      >
                        Reserve Spot <ExternalLink className="w-4 h-4" />
                      </a>
                    </>
                  ) : (
                    <div className="py-3 text-center">
                      <div className="filter blur-sm select-none opacity-40 text-left mb-3">
                        <div className="h-4 bg-white/40 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-white/30 rounded w-full mb-1"></div>
                        <div className="h-3 bg-white/20 rounded w-2/3"></div>
                      </div>
                      <button
                        onClick={() =>
                          onOpenPassport(`Unlock verified ${rec.type} bookings`)
                        }
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:scale-102 transition-all cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5" /> Unlock {rec.type}{' '}
                        Booking Info
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Commuter Hub */}
          <div className="bg-white rounded-[3rem] p-8 shadow-xl border border-slate-100">
            <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-slate-900 tracking-tight">
              <Car className="text-emerald-500 w-6 h-6" /> Commuter Hub
            </h3>

            {isSubscribed ? (
              <div className="space-y-3">
                <a
                  href="https://uber.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-between hover:bg-slate-800 transition-all"
                >
                  Ride with Uber <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="https://lyft.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-fuchsia-600 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-between hover:bg-fuchsia-700 transition-all"
                >
                  Summon Lyft <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href={`https://kayak.com/cars/${encodeURIComponent(itinerary.destination)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-orange-500 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-between hover:bg-orange-600 transition-all"
                >
                  Car Rental Fleet <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <Lock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-semibold mb-3">
                  Direct transport & commuter booking shortcuts are reserved for
                  Passport members.
                </p>
                <button
                  onClick={() =>
                    onOpenPassport('Unlock transport booking links')
                  }
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider hover:bg-orange-600 transition-colors cursor-pointer"
                >
                  Unlock Commuter Hub
                </button>
              </div>
            )}
          </div>

          {/* Rate & Share */}
          <div className="bg-white rounded-[3rem] p-8 border border-slate-100 text-center shadow-xl">
            <h4 className="font-black text-slate-900 text-lg mb-4 uppercase tracking-wider">
              Rate this Expedition
            </h4>
            <div className="flex justify-center mb-6">
              <StarRating
                rating={itinerary.overallRating}
                onRate={onRateOverall}
                size={12}
              />
            </div>
            <button
              onClick={() =>
                alert(
                  `Shared! Whisk expedition link copied for ${itinerary.destination}.`
                )
              }
              className="w-full bg-slate-50 hover:bg-orange-50 text-slate-800 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-slate-200 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-orange-500" /> Share Expedition
            </button>
          </div>
        </div>

        {/* FTC Affiliate Disclosure & AI Travel Advisory Notice */}
        <div className="mt-14 p-6 md:p-8 rounded-[2.5rem] bg-slate-100/90 border border-slate-200 text-slate-600 text-xs flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                Mandatory FTC Commercial Disclosure & AI Advisory
              </span>
              <p className="leading-relaxed font-medium">
                Whisk combines Google Gemini AI generative intelligence with
                curated scout databases. Whisk participates in affiliate
                programs (including Kayak, Booking.com, Uber, and OpenTable) and
                may earn referral commissions on bookings made via unlocked
                itinerary links at no extra cost to you. Always verify local
                hours, reservations, and foreign visa advisories prior to
                travel.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenLegal?.('affiliate')}
            className="shrink-0 px-5 py-2.5 rounded-2xl bg-white border border-slate-300 hover:border-orange-500 text-slate-800 hover:text-orange-600 font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          >
            Review Disclaimers
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscriptionReason, setSubscriptionReason] = useState<
    string | undefined
  >(undefined);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab>('terms');

  const openLegalModal = (tab: LegalTab = 'terms') => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

  const [itinerary, setItinerary] = useState<TripItinerary | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentTrips, setRecentTrips] = useState<TripItinerary[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'my-trips'>('home');
  const [toast, setToast] = useState<{
    message: string;
    type: 'error' | 'success';
  } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(id);
    }
  }, [toast]);

  // Load saved trips, profile, and subscription status
  useEffect(() => {
    const savedTrips = localStorage.getItem('whisk_trips');
    const savedProfile = localStorage.getItem('whisk_profile');
    const savedSubscribed = localStorage.getItem('whisk_subscribed');

    if (savedTrips) {
      try {
        setRecentTrips(JSON.parse(savedTrips));
      } catch {
        /* no-op */
      }
    }

    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setUserProfile(parsed);
        if (parsed.isSubscribed || savedSubscribed === 'true') {
          setIsSubscribed(true);
        }
      } catch {
        /* no-op */
      }
    } else {
      // Auto-open AuthModal on first visit so user can create their traveler profile
      const timer = setTimeout(() => {
        setIsAuthModalOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSaveProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('whisk_profile', JSON.stringify(profile));
    if (profile.isAdmin || profile.isSubscribed) {
      setIsSubscribed(true);
      localStorage.setItem('whisk_subscribed', 'true');
    }
    setToast({
      message: profile.isAdmin
        ? `👑 Welcome, Administrator ${profile.name}! Full VIP Access Unlocked.`
        : `🎉 Welcome aboard, ${profile.name}! Your free first trip preview is ready.`,
      type: 'success',
    });
  };

  const handleToggleSubscription = () => {
    setIsSubscribed((prev) => {
      const next = !prev;
      localStorage.setItem('whisk_subscribed', next ? 'true' : 'false');
      setToast({
        message: next
          ? '👑 Admin switched to: Full VIP Mode (All Days & Bookings Unlocked)'
          : '🔒 Admin switched to: Free Client Preview Mode (Paywall Simulated)',
        type: 'success',
      });
      return next;
    });
  };

  const handleLoadExampleTrip = (destination: 'tokyo' | 'amalfi' | 'paris') => {
    const trip = MASTER_DEMO_ITINERARIES[destination];
    setItinerary(trip);
    saveToRecent(trip);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setToast({
      message: `✨ Loaded Master Verified ${trip.destination} Example!`,
      type: 'success',
    });
  };

  const handleSubscribe = (plan: string) => {
    setIsSubscribed(true);
    localStorage.setItem('whisk_subscribed', 'true');
    if (userProfile) {
      const updated = { ...userProfile, isSubscribed: true };
      setUserProfile(updated);
      localStorage.setItem('whisk_profile', JSON.stringify(updated));
    }
    setToast({
      message: `👑 Whisk Passport Activated (${plan})! All days and partner booking links are now unlocked.`,
      type: 'success',
    });
  };

  const openPassportModal = (reason?: string) => {
    setSubscriptionReason(reason);
    setIsSubscriptionModalOpen(true);
  };

  const handleGenerate = async (params: SearchParams) => {
    // If not signed in, prompt profile creation first
    if (!userProfile) {
      setToast({
        message:
          'Please create your traveler profile to generate your trip preview!',
        type: 'error',
      });
      setIsAuthModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      const result = await generateItinerary(params);
      setItinerary(result);
      saveToRecent(result);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setToast({
        message: `✈️ Charted your ${params.destination} route! Free preview ready.`,
        type: 'success',
      });
    } catch {
      alert(
        'The expedition scout hit signal interference! Please try again in a moment.'
      );
    } finally {
      setLoading(false);
    }
  };

  const saveToRecent = (trip: TripItinerary) => {
    const updated = [
      trip,
      ...recentTrips.filter((t) => t.id !== trip.id),
    ].slice(0, 20);
    setRecentTrips(updated);
    localStorage.setItem('whisk_trips', JSON.stringify(updated));
  };

  const handleLogOut = () => {
    setUserProfile(null);
    setIsSubscribed(false);
    localStorage.removeItem('whisk_profile');
    localStorage.removeItem('whisk_subscribed');
    setItinerary(null);
    setActiveTab('home');
    setToast({
      message: 'Signed out of Whisk. Safe travels!',
      type: 'success',
    });
  };

  return (
    <div className="min-h-screen selection:bg-orange-500 selection:text-white bg-[#FFFDF9] text-slate-800">
      <Toast toast={toast} />

      {/* Profile Creation Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSaveProfile={handleSaveProfile}
        onOpenLegal={openLegalModal}
      />

      {/* Subscription Paywall Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onSubscribe={handleSubscribe}
        unlockReason={subscriptionReason}
        onOpenLegal={openLegalModal}
      />

      {/* Legal & Anti-Circumvention Compliance Modal */}
      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
      />

      {/* Traveler Profile, Passport ID, Billing & Email Archive Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userProfile={userProfile}
        isSubscribed={isSubscribed}
        onOpenPassport={() => {
          setIsProfileModalOpen(false);
          openPassportModal('Whisk Passport Unlimited Travel Access');
        }}
        onOpenLegal={openLegalModal}
        onLogOut={handleLogOut}
        onToggleSubscription={handleToggleSubscription}
        onLoadExampleTrip={handleLoadExampleTrip}
      />

      {/* Admin Demo & Showcase Floating Banner */}
      {userProfile?.isAdmin && (
        <aside
          aria-label="Admin Control Bar"
          className="bg-gradient-to-r from-purple-950 via-slate-900 to-amber-950 text-white px-4 py-2 text-xs border-b border-purple-500/30 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-[60]"
        >
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
              <Crown className="w-3 h-3 fill-slate-950" /> Admin Mode
            </span>
            <span className="font-semibold text-slate-200 hidden sm:inline">
              Presenting as{' '}
              <strong className="text-white">{userProfile.name}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSubscription}
              className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                isSubscribed
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow'
                  : 'bg-rose-500 hover:bg-rose-400 text-white shadow'
              }`}
            >
              {isSubscribed
                ? '👑 Paywall: Unlocked (VIP View)'
                : '🔒 Paywall: Simulated (Free View)'}
            </button>
            <div className="hidden md:flex items-center gap-1.5 text-[10px] font-bold text-amber-200">
              <span>Quick Demos:</span>
              <button
                type="button"
                onClick={() => handleLoadExampleTrip('tokyo')}
                className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              >
                Tokyo
              </button>
              <button
                type="button"
                onClick={() => handleLoadExampleTrip('amalfi')}
                className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              >
                Amalfi
              </button>
              <button
                type="button"
                onClick={() => handleLoadExampleTrip('paris')}
                className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              >
                Paris
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              Passport & Emails
            </button>
          </div>
        </aside>
      )}

      {/* Navigation Bar */}
      <Navbar
        userProfile={userProfile}
        isSubscribed={isSubscribed}
        onHome={() => {
          setItinerary(null);
          setActiveTab('home');
        }}
        onMyTrips={() => {
          if (userProfile) setActiveTab('my-trips');
          setItinerary(null);
        }}
        onSignIn={() => setIsAuthModalOpen(true)}
        onLogOut={handleLogOut}
        onOpenPassport={() =>
          openPassportModal('Unlock unlimited itineraries and partner bookings')
        }
        onOpenProfile={() => setIsProfileModalOpen(true)}
        activeTab={activeTab}
      />

      {/* Main View Logic */}
      {!itinerary && activeTab === 'home' && (
        <>
          {/* Wall-to-Wall Polaroid Hero with "Where will you whisk to?" Central Card */}
          <WhiskHeroSection
            userProfile={userProfile}
            isSubscribed={isSubscribed}
            onGenerate={handleGenerate}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenPassport={() =>
              openPassportModal(
                'Unlock unlimited itineraries and partner bookings'
              )
            }
            loading={loading}
          />

          {/* Community Feed of Scout Expeditions */}
          <CommunityFeed
            itineraries={recentTrips}
            onView={(t) => {
              setItinerary(t);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />

          {/* Value Props & Worldly Highlights */}
          <section className="py-28 bg-white border-t border-slate-100">
            <div className="max-w-7xl mx-auto px-4">
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop"
                    className="rounded-[3.5rem] shadow-2xl border-4 border-white"
                    alt="Eiffel Tower, Paris"
                  />
                  <div className="absolute -bottom-8 -right-8 bg-gradient-to-tr from-orange-500 to-amber-500 text-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl">
                    <h5 className="text-3xl font-black leading-tight">
                      150+ <br /> Countries <br /> Mapped
                    </h5>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5" /> Hand-Crafted Travel
                  </div>
                  <h2
                    className="text-4xl md:text-5xl font-black tracking-tight"
                    style={{ color: colors.dark }}
                  >
                    Built for the Modern Global Explorer
                  </h2>
                  <div className="space-y-6">
                    {[
                      {
                        icon: (
                          <ShieldCheck className="w-7 h-7 text-emerald-500" />
                        ),
                        title: '100% Vetted Local Stops',
                        desc: 'No overcrowded tourist traps. Our scouts curate authentic eateries, quiet viewpoints, and neighborhood secrets.',
                      },
                      {
                        icon: <Zap className="w-7 h-7 text-amber-500" />,
                        title: 'AI Speed, Human Warmth',
                        desc: 'Customized in seconds to your travel pace, budget, and specific vibe with real booking availability.',
                      },
                      {
                        icon: <Globe className="w-7 h-7 text-blue-500" />,
                        title: 'Whisk Passport Guarantee',
                        desc: 'One subscription unlocks every destination worldwide, secret itineraries, direct links, and offline routes.',
                      },
                    ].map((item, i) => (
                      <div key={i} className="flex gap-5">
                        <div className="bg-slate-50 p-4 rounded-2xl h-fit border border-slate-100">
                          {item.icon}
                        </div>
                        <div>
                          <h4
                            className="text-lg font-black uppercase tracking-wider mb-1"
                            style={{ color: colors.dark }}
                          >
                            {item.title}
                          </h4>
                          <p className="text-slate-500 font-medium text-sm leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Itinerary Display View */}
      {itinerary && (
        <div className="bg-gradient-to-b from-[#FFFDF9] via-white to-[#FAF6EE] min-h-screen">
          <ItineraryDisplay
            itinerary={itinerary}
            isSubscribed={isSubscribed}
            onRateActivity={() => {}}
            onRateOverall={() => {}}
            onOpenPassport={openPassportModal}
            onOpenLegal={openLegalModal}
          />

          <div className="max-w-7xl mx-auto px-4 pb-32 flex flex-col sm:flex-row items-center justify-center gap-6">
            <button
              onClick={() => {
                setItinerary(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="bg-white border-2 border-slate-200 px-10 py-5 rounded-2xl font-black uppercase tracking-[0.25em] text-xs hover:border-orange-500 text-slate-800 transition-all flex items-center gap-3 shadow-md cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 rotate-180 text-orange-500" />{' '}
              Plan Another Journey
            </button>

            {!isSubscribed && (
              <button
                onClick={() =>
                  openPassportModal(
                    'Unlock full itinerary and all booking links'
                  )
                }
                className="bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.25em] text-xs shadow-xl hover:shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-yellow-200" /> Unlock Whisk
                Passport ($4.99 / mo)
              </button>
            )}
          </div>
        </div>
      )}

      {/* My Expeditions Tab */}
      {!itinerary && activeTab === 'my-trips' && (
        <div className="max-w-7xl mx-auto px-4 py-20 min-h-[70vh]">
          <div className="mb-12">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600 block mb-1">
              Traveler Archive
            </span>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              My Saved Expeditions
            </h2>
          </div>

          {recentTrips.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 p-8">
              <Compass className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-700 mb-2">
                No expeditions charted yet
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                Your saved routes will appear here once generated.
              </p>
              <button
                onClick={() => setActiveTab('home')}
                className="px-8 py-3.5 rounded-xl bg-orange-500 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-colors cursor-pointer"
              >
                Chart Your First Trip
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {recentTrips.map((trip) => (
                <div
                  key={trip.id}
                  onClick={() => {
                    setItinerary(trip);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-100 hover:shadow-xl transition-all cursor-pointer group"
                >
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={getDestinationImage(trip.destination)}
                      alt={trip.destination}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent"></div>
                    <div className="absolute bottom-4 left-5 text-white">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                        {trip.duration}
                      </span>
                      <h4 className="text-lg font-black">{trip.destination}</h4>
                    </div>
                  </div>
                  <div className="p-5">
                    <h5 className="font-bold text-sm text-slate-900 mb-2 line-clamp-1">
                      {trip.title}
                    </h5>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {trip.summary}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 24/7 AI Concierge Bot */}
      <ChatBot />

      {/* Footer */}
      <footer
        style={{ backgroundColor: colors.dark }}
        className="text-white py-24 border-t border-white/5"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 border-b border-white/10 pb-16 mb-12">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-xl">
                <Plane className="w-8 h-8 -rotate-45" />
              </div>
              <div>
                <span className="text-3xl font-black tracking-tighter uppercase block leading-none">
                  Whisk
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-400 block mt-1">
                  Global Subscription Concierge
                </span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-xs font-black uppercase tracking-[0.25em] text-slate-400">
              <a
                href="#destinations"
                className="hover:text-orange-400 transition-colors"
              >
                Destinations
              </a>
              <a
                href="#passport"
                onClick={(e) => {
                  e.preventDefault();
                  openPassportModal('Whisk Passport Unlimited Travel Access');
                }}
                className="hover:text-orange-400 transition-colors"
              >
                Whisk Passport
              </a>
              <a
                href="#scouts"
                className="hover:text-orange-400 transition-colors"
              >
                Global Scouts
              </a>
              <a
                href="#support"
                className="hover:text-orange-400 transition-colors"
              >
                24/7 Concierge
              </a>
            </div>
          </div>

          {/* Legal Framework & Anti-Circumvention Navigation */}
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 text-[11px] font-bold text-slate-400 pb-12 border-b border-white/5 mb-10">
            <button
              type="button"
              onClick={() => openLegalModal('terms')}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Terms of Service & Anti-Circumvention
            </button>
            <span className="hidden md:inline text-slate-600">•</span>
            <button
              type="button"
              onClick={() => openLegalModal('privacy')}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Privacy Policy (GDPR / CCPA)
            </button>
            <span className="hidden md:inline text-slate-600">•</span>
            <button
              type="button"
              onClick={() => openLegalModal('subscription')}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Subscription & Refunds (FTC Click-to-Cancel)
            </button>
            <span className="hidden md:inline text-slate-600">•</span>
            <button
              type="button"
              onClick={() => openLegalModal('affiliate')}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              FTC Affiliate & AI Disclaimers
            </button>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-slate-400 font-semibold gap-4">
            <p>
              © 2026 Whisk Technologies Inc. Bespoke itineraries, worldwide.
              Technological measures protected under 17 U.S.C. § 1201 (DMCA) and
              CFAA.
            </p>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>
                Certified Scout Network • 256-bit Encryption • FTC Compliant
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
