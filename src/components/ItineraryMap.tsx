import * as React from 'react';
import {
  APILoadingStatus,
  APIProvider,
  AdvancedMarker,
  AdvancedMarkerRef,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  Compass,
  ExternalLink,
  Loader2,
  MapPin,
  Maximize2,
  Navigation,
  RefreshCw,
} from 'lucide-react';
import { Activity, DayPlan, TripItinerary } from '../../types';

export interface MappedStop {
  id: string;
  dayNumber: number;
  dayTheme: string;
  dayOrder: number;
  globalOrder: number;
  time: string;
  location: string;
  description: string;
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  placeId?: string;
}

const DAY_PIN_PALETTE = [
  { bg: '#FF7A00', badgeBg: 'bg-orange-50', badgeText: 'text-orange-700', dot: 'bg-[#FF7A00]' },
  { bg: '#FF007A', badgeBg: 'bg-pink-50', badgeText: 'text-pink-700', dot: 'bg-[#FF007A]' },
  { bg: '#0099CC', badgeBg: 'bg-sky-50', badgeText: 'text-sky-700', dot: 'bg-[#0099CC]' },
  { bg: '#7000FF', badgeBg: 'bg-purple-50', badgeText: 'text-purple-700', dot: 'bg-[#7000FF]' },
  { bg: '#10B981', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-700', dot: 'bg-[#10B981]' },
  { bg: '#F59E0B', badgeBg: 'bg-amber-50', badgeText: 'text-amber-700', dot: 'bg-[#F59E0B]' },
];

function getDayColor(dayNumber: number) {
  return DAY_PIN_PALETTE[(Math.max(1, dayNumber) - 1) % DAY_PIN_PALETTE.length];
}

function hasValidCoords(
  act: Activity
): act is Activity & { latitude: number; longitude: number } {
  return (
    typeof act?.latitude === 'number' &&
    Number.isFinite(act.latitude) &&
    typeof act?.longitude === 'number' &&
    Number.isFinite(act.longitude)
  );
}

const MapViewportController: React.FC<{
  points: MappedStop[];
  selectedStop: MappedStop | null;
  fitSignal: number;
}> = ({ points, selectedStop, fitSignal }) => {
  const map = useMap();

  React.useEffect(() => {
    const g = (window as any).google;
    if (!map || points.length === 0 || !g?.maps?.LatLngBounds) return;

    if (points.length === 1) {
      map.panTo({ lat: points[0].latitude, lng: points[0].longitude });
      map.setZoom(14);
      return;
    }

    const bounds = new g.maps.LatLngBounds();
    points.forEach((p) => bounds.extend({ lat: p.latitude, lng: p.longitude }));
    map.fitBounds(bounds, { top: 56, right: 56, bottom: 56, left: 56 });
  }, [map, points, fitSignal]);

  React.useEffect(() => {
    if (!map || !selectedStop) return;
    map.panTo({ lat: selectedStop.latitude, lng: selectedStop.longitude });
    const currentZoom = map.getZoom();
    if (typeof currentZoom === 'number' && currentZoom < 14) {
      map.setZoom(14);
    }
  }, [map, selectedStop]);

  return null;
};

const MapStatusWatcher: React.FC = () => {
  const status = useApiLoadingStatus();

  React.useEffect(() => {
    if (status === APILoadingStatus.AUTH_FAILURE) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }
  }, [status]);

  if (status === APILoadingStatus.AUTH_FAILURE || status === APILoadingStatus.FAILED) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-50/90 backdrop-blur-sm p-6 text-center">
        <div className="max-w-sm space-y-2">
          <Compass className="w-8 h-8 text-[var(--whisk-orange)] mx-auto" />
          <p className="text-sm font-black text-[var(--whisk-navy)]">
            Interactive map unavailable right now
          </p>
          <p className="text-xs text-slate-500">
            Browse the itinerary coordinates below or open any stop directly in Google Maps.
          </p>
        </div>
      </div>
    );
  }

  return null;
};

interface MarkerItemProps {
  stop: MappedStop;
  isSelected: boolean;
  onSelect: (stop: MappedStop) => void;
  registerMarker: (id: string, marker: AdvancedMarkerRef) => void;
}

const ItineraryMarkerItem: React.FC<MarkerItemProps> = ({
  stop,
  isSelected,
  onSelect,
  registerMarker,
}) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const color = getDayColor(stop.dayNumber);

  React.useEffect(() => {
    registerMarker(stop.id, marker);
    return () => registerMarker(stop.id, null);
  }, [marker, stop.id, registerMarker]);

  return (
    <AdvancedMarker
      ref={markerRef}
      position={{ lat: stop.latitude, lng: stop.longitude }}
      title={`Day ${stop.dayNumber} · ${stop.location}`}
      zIndex={isSelected ? 1000 : stop.globalOrder}
      clickable
      onClick={() => onSelect(stop)}
    >
      <Pin
        background={color.bg}
        borderColor="#FFFFFF"
        glyphColor="#FFFFFF"
        glyphText={String(stop.globalOrder)}
        scale={isSelected ? 1.25 : 1.0}
      />
    </AdvancedMarker>
  );
};

interface ItineraryMapProps {
  itinerary: TripItinerary;
  onCoordinatesHydrated?: (itineraryId: string, updatedDays: DayPlan[]) => void;
}

export const ItineraryMap: React.FC<ItineraryMapProps> = ({
  itinerary,
  onCoordinatesHydrated,
}) => {
  const [apiKey, setApiKey] = React.useState<string>(
    () => (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || ''
  );
  const [keyLoading, setKeyLoading] = React.useState<boolean>(!apiKey);
  const [geocoding, setGeocoding] = React.useState<boolean>(false);
  const [geocodeError, setGeocodeError] = React.useState<string | null>(null);
  const [selectedDay, setSelectedDay] = React.useState<number | 'all'>('all');
  const [selectedStopId, setSelectedStopId] = React.useState<string | null>(null);
  const [fitSignal, setFitSignal] = React.useState<number>(0);

  const markerInstancesRef = React.useRef<Record<string, AdvancedMarkerRef>>({});
  const hydratedTripIdsRef = React.useRef<Record<string, boolean>>({});

  const registerMarker = React.useCallback(
    (id: string, marker: AdvancedMarkerRef) => {
      if (marker) {
        markerInstancesRef.current[id] = marker;
      } else {
        delete markerInstancesRef.current[id];
      }
    },
    []
  );

  // Trigger Tier 2 quota notice if itinerary generation flagged quota exhaustion
  React.useEffect(() => {
    if ((itinerary as any)?.mapsQuotaExceeded) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }
  }, [itinerary]);

  // Fetch client Maps API key from server config if not injected into Vite env
  React.useEffect(() => {
    if (apiKey) {
      setKeyLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/maps/config');
        const data = await res.json().catch(() => ({}));
        if (!cancelled && data?.apiKey) {
          setApiKey(String(data.apiKey));
        }
      } catch (_err) {
        // Non-fatal fallback handled cleanly in UI
      } finally {
        if (!cancelled) setKeyLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  const totalActivities = React.useMemo(
    () =>
      (itinerary.days || []).reduce(
        (sum, d) => sum + (Array.isArray(d.activities) ? d.activities.length : 0),
        0
      ),
    [itinerary.days]
  );

  const allMappedStops = React.useMemo<MappedStop[]>(() => {
    const stops: MappedStop[] = [];
    let globalCounter = 0;

    for (const day of itinerary.days || []) {
      let dayCounter = 0;
      for (const act of day.activities || []) {
        if (hasValidCoords(act)) {
          globalCounter += 1;
          dayCounter += 1;
          stops.push({
            id: `d${day.dayNumber}-a${dayCounter}-${act.location}`,
            dayNumber: day.dayNumber,
            dayTheme: day.theme,
            dayOrder: dayCounter,
            globalOrder: globalCounter,
            time: act.time,
            location: act.location,
            description: act.description,
            latitude: act.latitude,
            longitude: act.longitude,
            formattedAddress: act.formattedAddress,
            placeId: act.placeId,
          });
        }
      }
    }
    return stops;
  }, [itinerary.days]);

  const hydrateMissingCoordinates = React.useCallback(async () => {
    if (!itinerary?.id || !itinerary?.destination || !Array.isArray(itinerary.days)) return;

    setGeocoding(true);
    setGeocodeError(null);
    try {
      const res = await fetch('/api/maps/geocode-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: itinerary.destination,
          days: itinerary.days,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (
        res.status === 429 ||
        data?.quotaExceeded ||
        data?.error === 'RESOURCE_EXHAUSTED' ||
        data?.error?.status === 'RESOURCE_EXHAUSTED'
      ) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        if (Array.isArray(data?.days)) {
          onCoordinatesHydrated?.(itinerary.id, data.days);
        }
        setGeocodeError('Map geocoding quota reached; showing available coordinates.');
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error || 'Could not resolve location coordinates');
      }

      if (Array.isArray(data?.days)) {
        onCoordinatesHydrated?.(itinerary.id, data.days);
      }
    } catch (err: any) {
      setGeocodeError(err?.message || 'Unable to load location coordinates');
    } finally {
      setGeocoding(false);
    }
  }, [itinerary.id, itinerary.destination, itinerary.days, onCoordinatesHydrated]);

  // Hydrate missing coordinates automatically for saved/legacy trips lacking coordinates
  React.useEffect(() => {
    if (!itinerary?.id || totalActivities === 0) return;
    if (allMappedStops.length === totalActivities) return;
    if (hydratedTripIdsRef.current[itinerary.id]) return;

    hydratedTripIdsRef.current[itinerary.id] = true;
    hydrateMissingCoordinates();
  }, [itinerary?.id, totalActivities, allMappedStops.length, hydrateMissingCoordinates]);

  // Reset filter selection when switching trips
  React.useEffect(() => {
    setSelectedDay('all');
    setSelectedStopId(null);
    setFitSignal((prev) => prev + 1);
  }, [itinerary.id]);

  const visibleStops = React.useMemo(() => {
    if (selectedDay === 'all') return allMappedStops;
    return allMappedStops.filter((s) => s.dayNumber === selectedDay);
  }, [allMappedStops, selectedDay]);

  const selectedStop = React.useMemo(
    () => visibleStops.find((s) => s.id === selectedStopId) || null,
    [visibleStops, selectedStopId]
  );

  const activeAnchorMarker = selectedStop
    ? markerInstancesRef.current[selectedStop.id] || null
    : null;

  const initialCenter = React.useMemo(() => {
    if (visibleStops.length > 0) {
      return { lat: visibleStops[0].latitude, lng: visibleStops[0].longitude };
    }
    return { lat: 35.6762, lng: 139.6503 };
  }, [visibleStops]);

  const handleSelectStop = React.useCallback((stop: MappedStop) => {
    setSelectedStopId(stop.id);
  }, []);

  const handleFitAll = () => {
    setSelectedStopId(null);
    setFitSignal((prev) => prev + 1);
  };

  const buildExternalMapsUrl = (stop: MappedStop) => {
    const query = encodeURIComponent(`${stop.location}, ${itinerary.destination}`);
    if (stop.placeId) {
      return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${encodeURIComponent(stop.placeId)}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${stop.latitude},${stop.longitude}`;
  };

  return (
    <div className="bg-white rounded-[3.5rem] p-8 md:p-12 shadow-xl border-4 border-white space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="vibrant-gradient p-3.5 rounded-2xl text-white shadow-lg">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-black text-[var(--whisk-orange)] uppercase tracking-[0.35em]">
              Interactive Trip Map
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-[var(--whisk-navy)] tracking-tight">
              {itinerary.destination} Route & Stops
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-black text-slate-600">
            {geocoding
              ? 'Locating stops...'
              : `${allMappedStops.length} of ${totalActivities} stops pinned`}
          </span>
          {visibleStops.length > 0 && (
            <button
              type="button"
              onClick={handleFitAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-black text-[var(--whisk-navy)] transition-colors cursor-pointer"
              title="Reset map bounds to fit all visible stops"
            >
              <Maximize2 className="w-3.5 h-3.5" /> Fit All
            </button>
          )}
        </div>
      </div>

      {/* Day Filter Controls */}
      {(itinerary.days || []).length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedDay('all');
              setSelectedStopId(null);
              setFitSignal((prev) => prev + 1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              selectedDay === 'all'
                ? 'vibrant-gradient text-white shadow-md'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            All Days ({allMappedStops.length})
          </button>

          {itinerary.days.map((day) => {
            const count = allMappedStops.filter((s) => s.dayNumber === day.dayNumber).length;
            const color = getDayColor(day.dayNumber);
            const active = selectedDay === day.dayNumber;

            return (
              <button
                key={day.dayNumber}
                type="button"
                onClick={() => {
                  setSelectedDay(day.dayNumber);
                  setSelectedStopId(null);
                  setFitSignal((prev) => prev + 1);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  active
                    ? 'bg-[var(--whisk-navy)] text-white shadow-md'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${color.dot}`} />
                Day {day.dayNumber} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Map Canvas Container (Explicit CSS Height per CF2) */}
      <div className="w-full h-[420px] md:h-[480px] rounded-[2rem] overflow-hidden border-2 border-slate-100 shadow-inner relative bg-slate-50">
        {keyLoading || (geocoding && allMappedStops.length === 0) ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--whisk-orange)]" />
            <span className="text-sm font-black tracking-tight">
              {geocoding ? 'Pinning itinerary locations on Google Maps...' : 'Loading Google Maps...'}
            </span>
          </div>
        ) : !apiKey ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center gap-2">
            <MapPin className="w-8 h-8 text-slate-300" />
            <p className="text-sm font-black text-[var(--whisk-navy)]">
              Google Maps key is not configured yet
            </p>
            <p className="text-xs text-slate-500 max-w-md">
              Enable Google Maps Platform to visualize every itinerary stop on an interactive map.
            </p>
          </div>
        ) : visibleStops.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center gap-3">
            <MapPin className="w-8 h-8 text-slate-300" />
            <p className="text-sm font-black text-[var(--whisk-navy)]">
              {geocodeError || 'No pinned coordinates available for this selection yet.'}
            </p>
            <button
              type="button"
              onClick={hydrateMissingCoordinates}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-black text-[var(--whisk-navy)] hover:border-[var(--whisk-orange)] cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Locating Stops
            </button>
          </div>
        ) : (
          <APIProvider apiKey={apiKey} libraries={['marker']} language="en" region="US">
            <GoogleMap
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              defaultCenter={initialCenter}
              defaultZoom={12}
              gestureHandling="greedy"
              style={{ width: '100%', height: '100%' }}
              onClick={() => setSelectedStopId(null)}
            >
              <MapStatusWatcher />
              <MapViewportController
                points={visibleStops}
                selectedStop={selectedStop}
                fitSignal={fitSignal}
              />

              {visibleStops.map((stop) => (
                <ItineraryMarkerItem
                  key={stop.id}
                  stop={stop}
                  isSelected={selectedStop?.id === stop.id}
                  onSelect={handleSelectStop}
                  registerMarker={registerMarker}
                />
              ))}

              {selectedStop && activeAnchorMarker && (
                <InfoWindow
                  anchor={activeAnchorMarker}
                  maxWidth={290}
                  onCloseClick={() => setSelectedStopId(null)}
                >
                  <div className="p-1.5 space-y-2 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          getDayColor(selectedStop.dayNumber).badgeBg
                        } ${getDayColor(selectedStop.dayNumber).badgeText}`}
                      >
                        Day {selectedStop.dayNumber} · Stop #{selectedStop.globalOrder}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {selectedStop.time}
                      </span>
                    </div>

                    <h4 className="font-black text-sm text-slate-900 leading-snug">
                      {selectedStop.location}
                    </h4>

                    {selectedStop.formattedAddress && (
                      <p className="text-[11px] font-semibold text-slate-500 leading-snug">
                        {selectedStop.formattedAddress}
                      </p>
                    )}

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {selectedStop.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                      <span className="text-[10px] font-mono text-slate-400">
                        {selectedStop.latitude.toFixed(4)}, {selectedStop.longitude.toFixed(4)}
                      </span>
                      <a
                        href={buildExternalMapsUrl(selectedStop)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-black text-[#FF7A00] hover:underline"
                      >
                        Google Maps <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </APIProvider>
        )}
      </div>

      {/* Synchronized Stop Selector List */}
      {visibleStops.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleStops.map((stop) => {
            const color = getDayColor(stop.dayNumber);
            const isSelected = selectedStopId === stop.id;
            return (
              <button
                key={stop.id}
                type="button"
                onClick={() => handleSelectStop(stop)}
                className={`text-left p-4 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-orange-50/70 border-[var(--whisk-orange)] shadow-sm'
                    : 'bg-slate-50/80 border-slate-100 hover:bg-white hover:border-slate-200'
                }`}
              >
                <span
                  style={{ backgroundColor: color.bg }}
                  className="w-7 h-7 rounded-xl text-white text-xs font-black flex items-center justify-center shrink-0 shadow-sm mt-0.5"
                >
                  {stop.globalOrder}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <span>Day {stop.dayNumber}</span>
                    <span>·</span>
                    <span className="truncate">{stop.time}</span>
                  </div>
                  <div className="text-sm font-black text-[var(--whisk-navy)] truncate mt-0.5">
                    {stop.location}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
