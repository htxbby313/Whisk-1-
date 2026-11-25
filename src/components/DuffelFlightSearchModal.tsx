import * as React from 'react';
import {
  Plane,
  X,
  Clock,
  ArrowRight,
  ShieldCheck,
  Luggage,
  Sparkles,
  ExternalLink,
  Loader2,
  AlertCircle,
  RefreshCw,
  Armchair
} from 'lucide-react';
import { FlightOffer } from '../../types';

interface DuffelFlightSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  originAirport?: string;
  destination: string;
  departureDate?: string;
}

export const DuffelFlightSearchModal: React.FC<DuffelFlightSearchModalProps> = ({
  isOpen,
  onClose,
  originAirport = 'DFW',
  destination,
  departureDate,
}) => {
  const [origin, setOrigin] = React.useState<string>(originAirport || 'DFW');
  const [cabinClass, setCabinClass] = React.useState<'economy' | 'premium' | 'business'>('economy');
  const [offers, setOffers] = React.useState<FlightOffer[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [provider, setProvider] = React.useState<string>('Duffel API');

  const destinationCity = React.useMemo(() => {
    return destination.split(',')[0].trim();
  }, [destination]);

  const searchFlights = React.useCallback(async () => {
    if (!destination) return;
    setLoading(true);
    setError(null);
    try {
      const originQuery = encodeURIComponent(origin.trim() || 'DFW');
      const destQuery = encodeURIComponent(destinationCity);
      const dateQuery = departureDate ? encodeURIComponent(departureDate) : '';
      const url = `/api/flights/search?origin=${originQuery}&destination=${destQuery}&date=${dateQuery}&cabinClass=${cabinClass}`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to search live flights');
      }
      setOffers(data.offers || []);
      if (data.provider) setProvider(data.provider);
    } catch (err: any) {
      setError(err?.message || 'Flight search temporarily unavailable');
    } finally {
      setLoading(false);
    }
  }, [origin, destinationCity, departureDate, cabinClass, destination]);

  React.useEffect(() => {
    if (isOpen) {
      searchFlights();
    }
  }, [isOpen, searchFlights]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] shadow-2xl border-4 border-white max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 sm:p-8 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[var(--whisk-orange)] flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5" /> Live Flight Search & Seat Pricing
              </span>
              <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200/80 px-2.5 py-0.5 rounded-full">
                ⚡ Powered by {provider}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--whisk-navy)] tracking-tight">
              {origin} → {destinationCity}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Real-time airline seats, cabin fare classes, and baggage allowances.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-[var(--whisk-navy)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters & Cabin Class Toggles */}
        <div className="px-6 sm:px-8 py-4 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cabin:</span>
            <div className="flex bg-white p-1 rounded-2xl border border-slate-200/70 shadow-2xs">
              {(['economy', 'premium', 'business'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCabinClass(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black capitalize transition-all cursor-pointer ${
                    cabinClass === c
                      ? 'vibrant-gradient text-white shadow-xs'
                      : 'text-slate-600 hover:text-[var(--whisk-navy)]'
                  }`}
                >
                  {c === 'premium' ? 'Premium Economy' : c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Origin:</span>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value.toUpperCase())}
              className="w-24 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-black text-[var(--whisk-navy)] text-center outline-none focus:border-[var(--whisk-orange)]"
              maxLength={4}
            />
            <button
              type="button"
              onClick={searchFlights}
              className="p-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
              title="Refresh live flights"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Flight Offers List */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[var(--whisk-orange)] animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-600">
                Pinging Duffel API & live airline carrier seat matrices...
              </p>
              <p className="text-xs text-slate-400">Verifying live fares, cabin classes, and seat inventory</p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <p className="text-sm font-bold text-rose-700">{error}</p>
              <button
                type="button"
                onClick={searchFlights}
                className="vibrant-gradient text-white px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Retry Live Search
              </button>
            </div>
          ) : offers.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm font-bold">
              No live flights found for this route. Try adjusting your departure airport.
            </div>
          ) : (
            offers.map((offer) => (
              <div
                key={offer.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 hover:border-orange-200 hover:shadow-lg transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-xs text-[var(--whisk-navy)] shrink-0 shadow-2xs">
                      {offer.airlineCode || offer.airline.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-black text-base text-[var(--whisk-navy)] leading-tight">
                        {offer.airline}
                      </h4>
                      <div className="text-[11px] font-bold text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{offer.flightNumber}</span>
                        {offer.aircraft && <span>· {offer.aircraft}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                    <div className="text-xl sm:text-2xl font-black text-[var(--whisk-navy)] tabular-nums">
                      {offer.price}
                    </div>
                    <div className="text-[11px] font-bold text-slate-400 capitalize">
                      {offer.cabinClass} · one-way / leg
                    </div>
                  </div>
                </div>

                {/* Timing & Route Bar */}
                <div className="grid grid-cols-3 items-center gap-2 text-center py-1">
                  <div className="text-left">
                    <div className="text-xl font-black text-[var(--whisk-navy)] leading-none mb-1">
                      {offer.departureTime}
                    </div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {offer.departureAirport}
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {offer.duration}
                    </span>
                    <div className="w-full h-0.5 bg-slate-200 relative flex items-center justify-center">
                      <Plane className="w-3.5 h-3.5 text-[var(--whisk-orange)] absolute" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 mt-1">
                      {offer.stops === 0 ? 'Non-stop' : `${offer.stops} stop`}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-black text-[var(--whisk-navy)] leading-none mb-1">
                      {offer.arrivalTime}
                    </div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {offer.arrivalAirport}
                    </div>
                  </div>
                </div>

                {/* Footer with Seats Remaining and Book Action */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2 font-medium">
                    {offer.seatsRemaining && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-amber-700 bg-amber-50 border border-amber-200/80">
                        <Armchair className="w-3 h-3 text-amber-500" /> Only {offer.seatsRemaining} seats left at this fare
                      </span>
                    )}
                    {offer.baggageIncluded && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-slate-600 bg-slate-100 font-semibold">
                        <Luggage className="w-3 h-3 text-slate-500" /> Carry-on included
                      </span>
                    )}
                  </div>

                  <a
                    href={offer.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="vibrant-gradient text-white py-2.5 px-4 rounded-xl font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 hover:opacity-95 transition-opacity shadow-xs"
                  >
                    Select Seat & Book <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
