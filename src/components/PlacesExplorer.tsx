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
import { GroundingSource } from '../../types';

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
}

export const PlacesExplorer: React.FC<PlacesExplorerProps> = ({
  defaultDestination = '',
  savedPlaceNames,
  onSavePlace,
}) => {
  const [destination, setDestination] = React.useState(defaultDestination);
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resultText, setResultText] = React.useState('');
  const [sources, setSources] = React.useState<GroundingSource[]>([]);
  const [coords, setCoords] = React.useState<{ latitude: number; longitude: number } | undefined>();
  const [usingGps, setUsingGps] = React.useState(false);

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
    try {
      const res = await searchMapsPlaces({
        query: query.trim() || 'Best restaurants, boutique hotels, and hidden gems',
        destination: destination.trim() || undefined,
        latitude: usingGps ? coords?.latitude : undefined,
        longitude: usingGps ? coords?.longitude : undefined,
      });
      setResultText(res.text);
      setSources(res.sources || []);
    } catch (err: any) {
      setError(err?.message || 'Unable to fetch Google Maps places right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border-4 border-white space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-orange-50 text-[var(--whisk-orange)] px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest mb-2">
            <MapPin className="w-3.5 h-3.5" /> Live Google Maps Explorer
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-[var(--whisk-navy)] tracking-tight">
            Find Verified Real-World Spots
          </h3>
        </div>
        <button
          type="button"
          onClick={handleLocate}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            usingGps
              ? 'bg-emerald-500 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <LocateFixed className="w-4 h-4" />
          {usingGps ? 'Using My Location' : 'Use My Location'}
        </button>
      </div>

      <form onSubmit={handleSearch} className="grid sm:grid-cols-5 gap-3">
        <input
          type="text"
          placeholder="City or area (e.g., Kyoto)"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="sm:col-span-2 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-[var(--whisk-navy)] outline-none focus:border-[var(--whisk-cyan)]"
        />
        <input
          type="text"
          placeholder="Ask Google Maps (e.g., cozy ramen or step-free museums)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:col-span-2 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-medium text-[var(--whisk-navy)] outline-none focus:border-[var(--whisk-cyan)]"
        />
        <button
          type="submit"
          disabled={loading || (!query.trim() && !destination.trim())}
          className="vibrant-gradient text-white rounded-2xl px-5 py-3.5 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-102 transition-all disabled:opacity-50 cursor-pointer"
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
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            Verified Google Maps Places ({sources.length})
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
