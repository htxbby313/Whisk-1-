import * as React from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { LANDMARK_POLAROIDS } from '../data/destinationMedia';

const LOCAL_NOTES = [
  {
    label: 'Our Vibe',
    text: 'Built by friends tired of paid ads and generic airport-hotel lists—we hunt down the real soul of every neighborhood.',
  },
  {
    label: 'Expert Vetting',
    text: 'Every spot is cross-referenced with local intel and live data. If a place slips, we drop it fast.',
  },
  {
    label: 'Community First',
    text: 'Thousands of travelers use Whisk for neighborhood pizza in Rome, sunset trails in Maui, and trusted word-of-mouth picks.',
  },
];

const SLIDE_INTERVAL_MS = 5500;

export const TravelShowcaseSection: React.FC = () => {
  const totalSlides = LANDMARK_POLAROIDS.length;
  const [slideIndex, setSlideIndex] = React.useState(() =>
    Math.floor(Math.random() * totalSlides)
  );
  const [isPaused, setIsPaused] = React.useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  const [failedIndices, setFailedIndices] = React.useState<Record<number, boolean>>({});

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(media.matches);
    const onChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  React.useEffect(() => {
    if (isPaused || prefersReducedMotion || totalSlides <= 1) return;
    const timer = window.setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % totalSlides);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isPaused, prefersReducedMotion, totalSlides]);

  const handlePrev = React.useCallback(() => {
    setSlideIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const handleNext = React.useCallback(() => {
    setSlideIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const activeSlide = LANDMARK_POLAROIDS[slideIndex] || LANDMARK_POLAROIDS[0];
  const hasImageFailed = Boolean(failedIndices[slideIndex]);
  const formattedIndex = String(slideIndex + 1).padStart(2, '0');
  const formattedTotal = String(totalSlides).padStart(2, '0');

  return (
    <section aria-label="Curated destinations and local travel notes" className="py-16 md:py-20 relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <div className="flex flex-col gap-5">
          {/* Dominant widescreen slideshow stage (~80% visual presence) */}
          <div
            className="relative w-full aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto lg:h-[520px] xl:h-[560px] rounded-[2rem] overflow-hidden border border-slate-200/90 shadow-xl bg-slate-900 select-none"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocusCapture={() => setIsPaused(true)}
            onBlurCapture={() => setIsPaused(false)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handlePrev();
              } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                handleNext();
              }
            }}
          >
            {hasImageFailed ? (
              <div
                className={`w-full h-full bg-gradient-to-br ${activeSlide.fallbackGradient} flex flex-col items-center justify-center p-8 text-white`}
              >
                <MapPin className="w-10 h-10 mb-3 opacity-90" />
                <p className="text-2xl font-extrabold tracking-tight">{activeSlide.name}</p>
                <p className="text-sm text-white/85 mt-1">{activeSlide.region}</p>
              </div>
            ) : (
              <img
                key={activeSlide.url}
                src={activeSlide.url}
                referrerPolicy="no-referrer"
                onError={() =>
                  setFailedIndices((prev) => ({ ...prev, [slideIndex]: true }))
                }
                className="w-full h-full object-cover animate-in fade-in duration-300"
                alt={`${activeSlide.name} — ${activeSlide.region}`}
              />
            )}

            {/* Measured contrast scrim for caption & navigation legibility */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/80 via-black/35 to-transparent"
              aria-hidden="true"
            />

            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 md:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="min-w-0 text-white">
                <p className="text-xs font-medium text-white/80 tracking-wide">
                  Destination Spotlight <span aria-hidden="true">·</span> {activeSlide.region}
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight mt-1 truncate">
                  {activeSlide.name}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous destination photo"
                  className="w-11 h-11 rounded-full bg-black/45 hover:bg-black/65 text-white border border-white/25 backdrop-blur-sm flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span
                  className="min-w-[4.25rem] text-center text-xs font-semibold text-white/95 tabular-nums tracking-wide"
                  aria-live="polite"
                >
                  {formattedIndex} / {formattedTotal}
                </span>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next destination photo"
                  className="w-11 h-11 rounded-full bg-black/45 hover:bg-black/65 text-white border border-white/25 backdrop-blur-sm flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Slim editorial note cards directly underneath (~20% visual footprint) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5 items-stretch">
            {/* Slim Service Note Card */}
            <article className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--whisk-terracotta)] mb-1">
                  How Whisk works
                </p>
                <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-[var(--whisk-navy)] leading-snug mb-2">
                  Better Trips, Fast.
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  No sponsored lists or weeks lost in travel forums. Whisk cross-checks live Search and Google Maps data to craft a hand-picked personal route in the time it takes to grab an espresso.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                <span>Live Search &amp; Maps grounded</span>
                <span aria-hidden="true">·</span>
                <span>Zero paid placements</span>
                <span aria-hidden="true">·</span>
                <span>Ready in seconds</span>
              </div>
            </article>

            {/* Slim Always-Visible Local Facts Note Card (No Tabs) */}
            <article className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 flex flex-col justify-center">
              <div className="flex items-baseline justify-between gap-4 mb-3">
                <h3 className="text-lg md:text-xl font-extrabold tracking-tight text-[var(--whisk-navy)]">
                  As a local...
                </h3>
                <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
                  Traveler field notes
                </span>
              </div>
              <ul className="divide-y divide-slate-100">
                {LOCAL_NOTES.map((note) => (
                  <li
                    key={note.label}
                    className="py-2.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4"
                  >
                    <span className="sm:w-32 shrink-0 text-xs font-bold text-[var(--whisk-navy)]">
                      {note.label}
                    </span>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {note.text}
                    </p>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
};
