import * as React from 'react';
import {
  Bookmark,
  Check,
  ExternalLink,
  Loader2,
  LocateFixed,
  MapPin,
  Search,
} from 'lucide-react';
import { searchMapsPlaces } from '../../geminiService';
import { DiscoveredSpot, GroundingSource } from '../../types';

interface PlacesExplorerProps {
  defaultDestination?: string;
  savedPlaceNames: Set<string>;
  onSavePlace: (place: {
    name: string;
    type: 'place';
    destination: string;
    description: string;
    mapsUri?: string;
  }) => Promise<void>;
  onSpotsDiscovered?: (spots: DiscoveredSpot[]) => void | Promise<void>;
}

export const PlacesExplorer: React.FC<PlacesExplorerProps> = ({
  defaultDestination = '',
  savedPlaceNames,
  onSavePlace,
  onSpotsDiscovered,
}) => {
  const [destination, setDestination] = React.useState(defaultDestination);
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resultText, setResultText] = React.useState('');
  const [sources, setSources] = React.useState<GroundingSource[]>([]);
  const [coords, setCoords] = React.useState<{ latitude: number; longitude: number } | undefined>();
  const [usingGps, setUsingGps] = React.useState(false);
  const [rememberedCount, setRememberedCount] = React.useState(0);

  React.useEffect(() => {
    if (defaultDestination) {
      setDestination(defaultDestination);
    }
  }, [defaultDestination]);

  const handleLocate = () => {
    if (usingGps) {
      setUsingGps(false);
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
          setUsingGps(true);
        },
        () => {
          setError('Could not access browser location. You can still search any city!');
        },
        { timeout: 6000 }
      );
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() && !destination.trim()) return;
    setLoading(true);
    setError(null);
    setRememberedCount(0);
    try {
      const res = await searchMapsPlaces({
        query: query.trim() || 'Best restaurants, boutique hotels, and hidden gems',
        destination: destination.trim() || undefined,
        latitude: usingGps ? coords?.latitude : undefined,
        longitude: usingGps ? coords?.longitude : undefined,
      });
      const foundSources = res.sources || [];
      setResultText(res.text);
      setSources(foundSources);

      const discovered: DiscoveredSpot[] = foundSources.slice(0, 4).map((src) => ({
        name: src.title,
        destination: destination.trim() || query.trim() || 'Explore',
        description: src.snippet || `Verified spot in ${destination.trim() || 'Explore'}`,
        mapsUri: src.uri,
      }));
      if (discovered.length > 0 && onSpotsDiscovered) {
        await onSpotsDiscovered(discovered);
        setRememberedCount(discovered.length);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to fetch Google Maps places right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl sm:rounded-[2.5rem] lg:rounded-[3rem] p-5 sm:p-8 lg:p-12 shadow-xl border-2 sm:border-4 border-white space-y-5 sm:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[var(--whisk-orange)] text-[11px] font-black uppercase tracking-widest mb-1.5 sm:mb-2">
            <MapPin className="w-3.5 h-3.5" /> Free Spot Finder
          </div>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-[var(--whisk-navy)] tracking-tight">
            Find Verified Real-World Spots
          </h3>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Free on the homepage — Whisk saves spots you explore here to personalize your future trips.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLocate}
          className={`self-start md:self-auto px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            usingGps
              ? 'bg-emerald-500 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <LocateFixed className="w-4 h-4" />
          {usingGps ? 'Using My Location' : 'Use My Location'}
        </button>
      </div>

      <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          type="text"
          placeholder="City or area (e.g., Kyoto)"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="md:col-span-2 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-[var(--whisk-navy)] outline-none focus:border-[var(--whisk-cyan)]"
        />
        <input
          type="text"
          placeholder="Ask Google Maps (e.g., cozy ramen or step-free museums)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="md:col-span-2 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-medium text-[var(--whisk-navy)] outline-none focus:border-[var(--whisk-cyan)]"
        />
        <button
          type="submit"
          disabled={loading || (!query.trim() && !destination.trim())}
          className="vibrant-gradient text-white rounded-2xl px-5 py-3.5 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Explore
        </button>
      </form>

      {error && (
        <div className="bg-rose-50 text-rose-700 text-xs font-bold px-4 py-3 rounded-2xl">
          {error}
        </div>
      )}

      {sources.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              Verified Google Maps Places ({sources.length})
            </div>
            {rememberedCount > 0 && (
              <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Saved {rememberedCount} spot{rememberedCount === 1 ? '' : 's'} for your future itineraries
              </div>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {sources.map((src, idx) => {
              const isSaved = savedPlaceNames.has(src.title.toLowerCase());
              return (
                <div
                  key={idx}
                  className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-black text-sm text-[var(--whisk-navy)] leading-snug">
                        {src.title}
                      </h4>
                      <button
                        type="button"
                        onClick={() =>
                          onSavePlace({
                            name: src.title,
                            type: 'place',
                            destination: destination || 'Explore',
                            description: src.snippet || 'Verified Google Maps spot',
                            mapsUri: src.uri,
                          })
                        }
                        className={`p-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                          isSaved
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-white text-slate-400 hover:text-[var(--whisk-orange)]'
                        }`}
                        title={isSaved ? 'Saved to My Places' : 'Save place'}
                      >
                        {isSaved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      </button>
                    </div>
                    {src.snippet && (
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 italic">
                        "{src.snippet}"
                      </p>
                    )}
                  </div>
                  <a
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[var(--whisk-orange)] hover:underline"
                  >
                    <MapPin className="w-3.5 h-3.5" /> Open in Google Maps
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {resultText && (
        <div className="bg-slate-50/80 rounded-2xl p-5 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap border border-slate-100">
          {resultText}
        </div>
      )}
    </div>
  );
};
