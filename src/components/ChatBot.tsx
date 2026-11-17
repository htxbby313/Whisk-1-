import * as React from 'react';
import {
  Brain,
  Compass,
  ExternalLink,
  Globe,
  Layers,
  LocateFixed,
  MapPin,
  MessageCircle,
  RotateCcw,
  Send,
  Smile,
  X,
  Zap,
} from 'lucide-react';
import { sendChatMessageStream } from '../../geminiService';
import { ChatMessage, ChatMode, GroundingSource } from '../../types';
import { useAuth } from '../context/AuthContext';
import {
  addChatMessageToFirestore,
  ensureChatSession,
  subscribeChatMessages,
} from '../services/firestoreService';

const INITIAL_GREETING: ChatMessage = {
  role: 'ai',
  text: "Hey Bestie! I'm connected to live Search & Google Maps intel. Ask me for hidden cafes, multi-day routes, or fast packing tips—where are we dreaming of next?",
  mode: 'standard',
};

const MODE_META: Record<
  ChatMode,
  { label: string; badge: string; roleTitle: string; placeholder: string }
> = {
  standard: {
    label: 'Chat',
    badge: 'Search Grounded',
    roleTitle: 'Travel Bestie (Web Search)',
    placeholder: 'Ask anything about destinations, flights, or vibes...',
  },
  maps: {
    label: 'Maps',
    badge: 'Google Maps',
    roleTitle: 'Local Maps Guide',
    placeholder: 'Ask for real restaurants, hotels, or nearby spots...',
  },
  fast: {
    label: 'Quick',
    badge: 'Flash Lite',
    roleTitle: 'Quick-Reply Buddy',
    placeholder: 'Quick question? Currency, weather, packing tip...',
  },
  thinking: {
    label: 'Deep',
    badge: 'Deep Reasoning',
    roleTitle: 'Master Deep-Reasoning Planner',
    placeholder: 'Complex multi-city route, seasonality, or accessibility strategy...',
  },
  complex: {
    label: 'Architect',
    badge: 'Trip Architect',
    roleTitle: 'Interactive Trip Architect',
    placeholder: 'Rework itinerary order, compare budgets, or optimize transfers...',
  },
};

export const ChatBot: React.FC = () => {
  const { user, authReady } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const [mode, setMode] = React.useState<ChatMode>('standard');
  const [sessionId, setSessionId] = React.useState<string>('default_bestie_thread');
  const [messages, setMessages] = React.useState<ChatMessage[]>([INITIAL_GREETING]);
  const [streamingText, setStreamingText] = React.useState<string>('');
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [useLocation, setUseLocation] = React.useState(false);
  const [coords, setCoords] = React.useState<{ latitude: number; longitude: number } | undefined>();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingText, isLoading]);

  // Subscribe to Firestore chat thread when authenticated
  React.useEffect(() => {
    if (!authReady || !user) {
      setMessages([INITIAL_GREETING]);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = subscribeChatMessages(user.uid, sessionId, (loaded) => {
        if (loaded.length === 0) {
          setMessages([INITIAL_GREETING]);
        } else {
          setMessages(loaded);
        }
      });
    } catch (err) {
      console.error('Failed to subscribe to chat messages:', err);
    }

    return () => {
      unsubscribe?.();
    };
  }, [authReady, user, sessionId]);

  const handleToggleLocation = () => {
    if (useLocation) {
      setUseLocation(false);
      setCoords(undefined);
      return;
    }
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setUseLocation(true);
        },
        () => {
          setUseLocation(false);
        },
        { timeout: 6000 }
      );
    }
  };

  const handleNewChat = () => {
    const nextId = `session_${Date.now()}`;
    setSessionId(nextId);
    setMessages([INITIAL_GREETING]);
    setStreamingText('');
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userText = input.trim();
    const userMessage: ChatMessage = {
      role: 'user',
      text: userText,
      mode,
      createdAt: new Date().toISOString(),
    };

    const historyForModel = messages
      .filter((m) => m.text && m.text.trim().length > 0)
      .slice(-12)
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

    if (!user) {
      setMessages((prev) => [...prev, userMessage]);
    }
    setInput('');
    setIsLoading(true);
    setStreamingText('');

    try {
      if (user) {
        await ensureChatSession(user.uid, sessionId, userText.slice(0, 80), mode);
        await addChatMessageToFirestore(user.uid, sessionId, userMessage);
      }

      let liveAccumulated = '';
      const result = await sendChatMessageStream(
        userText,
        historyForModel,
        (chunkText) => {
          liveAccumulated += chunkText;
          setStreamingText(liveAccumulated);
        },
        mode,
        mode === 'maps' ? coords : undefined
      );

      const aiMessage: ChatMessage = {
        role: 'ai',
        text: result.text || liveAccumulated || "Ouch, my connection dropped! Let's try again?",
        mode,
        model: result.model,
        groundingSources: result.sources,
        createdAt: new Date().toISOString(),
      };

      setStreamingText('');
      if (user) {
        await addChatMessageToFirestore(user.uid, sessionId, aiMessage);
      } else {
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setStreamingText('');
      const fallbackMsg: ChatMessage = {
        role: 'ai',
        text: "My brain hit a brief detour! Let's try asking that one more time.",
        mode,
      };
      if (!user) {
        setMessages((prev) => [...prev, fallbackMsg]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const activeMeta = MODE_META[mode];

  return (
    <div className="fixed bottom-8 right-8 z-[200]">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open Whisk Travel Bestie chat"
          className="vibrant-gradient text-white p-5 rounded-full shadow-[var(--shadow-orange)] hover:scale-110 transition-all group border-4 border-white cursor-pointer"
        >
          <MessageCircle className="w-8 h-8 group-hover:rotate-12 transition-transform" />
        </button>
      ) : (
        <div className="bg-white rounded-[2.5rem] w-[92vw] max-w-[440px] h-[680px] shadow-2xl border-4 border-[var(--whisk-orange)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
          {/* Header */}
          <div className="vibrant-gradient p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="bg-white/25 p-2 rounded-2xl">
                  <Smile className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-lg tracking-tight leading-none">Whisk Bestie</h4>
                  <span className="text-[11px] font-bold text-white/90">{activeMeta.roleTitle}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleNewChat}
                  title="Start a new chat thread"
                  className="hover:bg-white/20 p-2 rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chat"
                  className="hover:bg-white/20 p-2 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Role / Model Mode Switcher */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['standard', 'maps', 'fast', 'thinking', 'complex'] as ChatMode[]).map((mKey) => (
                <button
                  key={mKey}
                  onClick={() => setMode(mKey)}
                  className={`text-[10px] uppercase font-black px-3 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
                    mode === mKey
                      ? 'bg-white text-[var(--whisk-orange)] shadow-sm'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {mKey === 'standard' && <Globe className="w-3 h-3" />}
                  {mKey === 'maps' && <MapPin className="w-3 h-3" />}
                  {mKey === 'fast' && <Zap className="w-3 h-3" />}
                  {mKey === 'thinking' && <Brain className="w-3 h-3" />}
                  {mKey === 'complex' && <Layers className="w-3 h-3" />}
                  {MODE_META[mKey].label}
                </button>
              ))}
              {mode === 'maps' && (
                <button
                  onClick={handleToggleLocation}
                  title="Share current location with Google Maps grounding"
                  className={`ml-auto text-[10px] font-black px-2.5 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
                    useLocation
                      ? 'bg-emerald-400 text-slate-900'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <LocateFixed className="w-3 h-3" />
                  {useLocation ? 'GPS On' : 'Near Me'}
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Message Thread */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-[var(--whisk-sky)]/30">
            {messages.map((m, i) => (
              <div key={m.id || i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] p-4 rounded-3xl text-sm font-medium leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'vibrant-gradient text-white rounded-tr-none shadow-lg'
                      : 'bg-white text-slate-800 shadow-lg shadow-slate-200/50 border border-white rounded-tl-none'
                  }`}
                >
                  {m.role === 'ai' && m.mode && (
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-[var(--whisk-purple)] uppercase tracking-widest mb-1.5">
                      {m.mode === 'thinking' ? (
                        <Brain className="w-3.5 h-3.5" />
                      ) : m.mode === 'complex' ? (
                        <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      ) : m.mode === 'maps' ? (
                        <MapPin className="w-3.5 h-3.5 text-[var(--whisk-orange)]" />
                      ) : m.mode === 'fast' ? (
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <Compass className="w-3.5 h-3.5 text-[var(--whisk-cyan)]" />
                      )}
                      {MODE_META[m.mode]?.badge || 'Travel Bestie'}
                    </div>
                  )}

                  {m.text}

                  {/* Grounding Sources (Google Maps & Google Search links) */}
                  {m.role === 'ai' && m.groundingSources && m.groundingSources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Verified Sources
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {m.groundingSources.slice(0, 6).map((src: GroundingSource, idx: number) => (
                          <a
                            key={idx}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                              src.sourceType === 'maps'
                                ? 'bg-orange-50 text-[var(--whisk-orange)] hover:bg-orange-100'
                                : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
                            }`}
                          >
                            {src.sourceType === 'maps' ? (
                              <MapPin className="w-3 h-3 shrink-0" />
                            ) : (
                              <Globe className="w-3 h-3 shrink-0" />
                            )}
                            <span className="truncate max-w-[140px]">{src.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Live streaming partial response */}
            {streamingText && (
              <div className="flex justify-start">
                <div className="max-w-[88%] p-4 rounded-3xl rounded-tl-none bg-white text-slate-800 shadow-lg border border-white text-sm font-medium leading-relaxed whitespace-pre-wrap">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-[var(--whisk-orange)] uppercase tracking-widest mb-1.5">
                    <Compass className="w-3.5 h-3.5 animate-spin" /> {activeMeta.badge}
                  </div>
                  {streamingText}
                </div>
              </div>
            )}

            {isLoading && !streamingText && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-3xl rounded-tl-none shadow-lg flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-[var(--whisk-orange)] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[var(--whisk-orange)] rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-[var(--whisk-orange)] rounded-full animate-bounce delay-200"></div>
                  </div>
                  <span className="text-xs text-slate-400 font-bold italic">
                    {mode === 'maps'
                      ? 'Checking Google Maps...'
                      : mode === 'thinking'
                      ? 'Planning deeply...'
                      : 'Checking my notes...'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="p-4 bg-white border-t border-slate-100 flex gap-2.5">
            <input
              type="text"
              placeholder={activeMeta.placeholder}
              className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 px-4 text-sm outline-none focus:ring-4 focus:ring-[var(--focus-ring)] focus:border-[var(--whisk-cyan)] transition-all font-medium"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="vibrant-gradient text-white p-3.5 rounded-2xl hover:scale-105 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
