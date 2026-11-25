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
  ArrowLeft,
  ArrowRight,
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

function formatShortDayDate(iso?: string): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

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

/**
 * Draws solid color-coded route polylines within each day AND dashed connector
 * bridges linking the last stop of Day N -> first stop of Day N+1.
 */
const MapRoutePolylines: React.FC<{
  visibleStops: MappedStop[];
  prevBridgeStop: MappedStop | null;
  nextBridgeStop: MappedStop | null;
  selectedDay: number | 'all';
}> = ({ visibleStops, prevBridgeStop, nextBridgeStop, selectedDay }) => {
  const map = useMap();

  React.useEffect(() => {
    const g = (window as any).google;
    if (!map || !g?.maps?.Polyline || visibleStops.length === 0) return;

    const polylines: any[] = [];

    // Group visible stops by dayNumber to draw solid per-day directional routes
    const byDay = new Map<number, MappedStop[]>();
    for (const stop of visibleStops) {
      const list = byDay.get(stop.dayNumber) || [];
      list.push(stop);
      byDay.set(stop.dayNumber, list);
    }

    const dayNumbers = Array.from(byDay.keys()).sort((a, b) => a - b);

    for (const dayNum of dayNumbers) {
      const dayStops = byDay.get(dayNum) || [];
      if (dayStops.length < 2) continue;
      const color = getDayColor(dayNum).bg;
      const line = new g.maps.Polyline({
        path: dayStops.map((s) => ({ lat: s.latitude, lng: s.longitude })),
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 0.9,
        strokeWeight: 4,
        icons: g.maps.SymbolPath?.FORWARD_CLOSED_ARROW
          ? [
              {
                icon: {
                  path: g.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 2.6,
                  strokeColor: '#FFFFFF',
                  fillColor: color,
                  fillOpacity: 1,
                },
                offset: '50%',
                repeat: '95px',
              },
            ]
          : undefined,
        map,
      });
      polylines.push(line);
    }

    const dashedIcon = g.maps.SymbolPath?.CIRCLE
      ? [
          {
            icon: {
              path: 'M 0,-1 0,1',
              strokeOpacity: 0.85,
              scale: 3,
              strokeColor: '#475569',
            },
            offset: '0',
            repeat: '14px',
          },
        ]
      : undefined;

    if (selectedDay === 'all') {
      // Connect last stop of each day to first stop of the following day with a dashed bridge
      for (let i = 0; i < dayNumbers.length - 1; i++) {
        const currentList = byDay.get(dayNumbers[i]) || [];
        const nextList = byDay.get(dayNumbers[i + 1]) || [];
        const tail = currentList[currentList.length - 1];
        const head = nextList[0];
        if (tail && head) {
          const bridge = new g.maps.Polyline({
            path: [
              { lat: tail.latitude, lng: tail.longitude },
              { lat: head.latitude, lng: head.longitude },
            ],
            geodesic: true,
            strokeOpacity: dashedIcon ? 0 : 0.45,
            strokeColor: '#475569',
            strokeWeight: 2,
            icons: dashedIcon,
            map,
          });
          polylines.push(bridge);
        }
      }
    } else {
      // Single-day mode: draw dashed bridges to Previous Day's last stop and Next Day's first stop
      const firstOfDay = visibleStops[0];
      const lastOfDay = visibleStops[visibleStops.length - 1];

      if (prevBridgeStop && firstOfDay) {
        polylines.push(
          new g.maps.Polyline({
            path: [
              { lat: prevBridgeStop.latitude, lng: prevBridgeStop.longitude },
              { lat: firstOfDay.latitude, lng: firstOfDay.longitude },
            ],
            geodesic: true,
            strokeOpacity: dashedIcon ? 0 : 0.45,
            strokeColor: '#64748B',
            strokeWeight: 2,
            icons: dashedIcon,
            map,
          })
        );
      }

      if (nextBridgeStop && lastOfDay) {
        polylines.push(
          new g.maps.Polyline({
            path: [
              { lat: lastOfDay.latitude, lng: lastOfDay.longitude },
              { lat: nextBridgeStop.latitude, lng: nextBridgeStop.longitude },
            ],
            geodesic: true,
            strokeOpacity: dashedIcon ? 0 : 0.45,
            strokeColor: '#64748B',
            strokeWeight: 2,
            icons: dashedIcon,
            map,
          })
        );
      }
    }

    return () => {
      polylines.forEach((p) => p.setMap(null));
    };
  }, [map, visibleStops, prevBridgeStop, nextBridgeStop, selectedDay]);

  return null;
};

/**
 * Renders a 10-15 minute walking buffer circle (~850m radius) around the active anchor or
 * selected spot to visually guide travelers within walking micro-buffers and avoid transit fatigue.
 */
const MapWalkingBufferCircle: React.FC<{
  selectedStop: MappedStop | null;
  anchorStop: MappedStop | null;
  enabled: boolean;
}> = ({ selectedStop, anchorStop, enabled }) => {
  const map = useMap();

  React.useEffect(() => {
    const g = (window as any).google;
    const target = selectedStop || anchorStop;
    if (!map || !g?.maps?.Circle || !target || !enabled) return;

    const circle = new g.maps.Circle({
      center: { lat: target.latitude, lng: target.longitude },
      radius: 850,
      fillColor: '#FF7A00',
      fillOpacity: 0.12,
      strokeColor: '#FF7A00',
      strokeOpacity: 0.65,
      strokeWeight: 1.5,
      map,
    });

    return () => {
      circle.setMap(null);
    };
  }, [map, selectedStop, anchorStop, enabled]);

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
            Browse the verified stop addresses below or open any stop directly in Google Maps.
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
  isContextBridge?: boolean;
  onSelect: (stop: MappedStop) => void;
  registerMarker: (id: string, marker: AdvancedMarkerRef) => void;
}

const ItineraryMarkerItem: React.FC<MarkerItemProps> = ({
  stop,
  isSelected,
  isContextBridge = false,
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
      title={`Day ${stop.dayNumber} · ${stop.location}${stop.formattedAddress ? ` — ${stop.formattedAddress}` : ''}`}
      zIndex={isSelected ? 1000 : isContextBridge ? 10 : stop.globalOrder}
      clickable
      onClick={() => onSelect(stop)}
    >
      <Pin
        background={isContextBridge ? '#64748B' : color.bg}
        borderColor="#FFFFFF"
        glyphColor="#FFFFFF"
        glyphText={isContextBridge ? `D${stop.dayNumber}` : String(stop.globalOrder)}
        scale={isSelected ? 1.25 : isContextBridge ? 0.85 : 1.0}
      />
    </AdvancedMarker>
  );
};

interface ItineraryMapProps {
  itinerary: TripItinerary;
  onCoordinatesHydrated?: (itineraryId: string, updatedDays: DayPlan[]) => void;
  selectedDay?: number | 'all';
  onSelectDay?: (day: number | 'all') => void;
}

export const ItineraryMap: React.FC<ItineraryMapProps> = ({
  itinerary,
  onCoordinatesHydrated,
  selectedDay: controlledDay,
  onSelectDay,
}) => {
  const [apiKey, setApiKey] = React.useState<string>(
    () => (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || ''
  );
  const [keyLoading, setKeyLoading] = React.useState<boolean>(!apiKey);
  const [geocoding, setGeocoding] = React.useState<boolean>(false);
  const [geocodeError, setGeocodeError] = React.useState<string | null>(null);
  const [internalDay, setInternalDay] = React.useState<number | 'all'>('all');
  const [selectedStopId, setSelectedStopId] = React.useState<string | null>(null);
  const [fitSignal, setFitSignal] = React.useState<number>(0);
  const [showWalkRadius, setShowWalkRadius] = React.useState<boolean>(true);

  const selectedDay = controlledDay !== undefined ? controlledDay : internalDay;
  const setSelectedDay = React.useCallback(
    (next: number | 'all') => {
      setInternalDay(next);
      onSelectDay?.(next);
      setSelectedStopId(null);
      setFitSignal((prev) => prev + 1);
    },
    [onSelectDay]
  );

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

  React.useEffect(() => {
    if ((itinerary as any)?.mapsQuotaExceeded) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }
  }, [itinerary]);

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
        // Non-fatal fallback
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
        setGeocodeError('Map geocoding quota reached; showing available addresses.');
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error || 'Could not resolve stop addresses');
      }

      if (Array.isArray(data?.days)) {
        onCoordinatesHydrated?.(itinerary.id, data.days);
      }
    } catch (err: any) {
      setGeocodeError(err?.message || 'Unable to load stop coordinates');
    } finally {
      setGeocoding(false);
    }
  }, [itinerary.id, itinerary.destination, itinerary.days, onCoordinatesHydrated]);

  React.useEffect(() => {
    if (!itinerary?.id || totalActivities === 0) return;
    if (allMappedStops.length === totalActivities) return;
    if (hydratedTripIdsRef.current[itinerary.id]) return;

    hydratedTripIdsRef.current[itinerary.id] = true;
    hydrateMissingCoordinates();
  }, [itinerary?.id, totalActivities, allMappedStops.length, hydrateMissingCoordinates]);

  React.useEffect(() => {
    setInternalDay('all');
    setSelectedStopId(null);
    setFitSignal((prev) => prev + 1);
  }, [itinerary.id]);

  const dayList = React.useMemo(
    () => (itinerary.days || []).map((d) => d.dayNumber).sort((a, b) => a - b),
    [itinerary.days]
  );

  const visibleStops = React.useMemo(() => {
    if (selectedDay === 'all') return allMappedStops;
    return allMappedStops.filter((s) => s.dayNumber === selectedDay);
  }, [allMappedStops, selectedDay]);

  // Previous-day ending stop and Next-day starting stop for seamless Day N-1 <-> Day N <-> Day N+1 linking
  const { prevDayNumber, nextDayNumber, prevBridgeStop, nextBridgeStop } = React.useMemo(() => {
    if (selectedDay === 'all') {
      return {
        prevDayNumber: null as number | null,
        nextDayNumber: dayList.length > 0 ? dayList[0] : null,
        prevBridgeStop: null as MappedStop | null,
        nextBridgeStop: null as MappedStop | null,
      };
    }
    const idx = dayList.indexOf(selectedDay);
    const prevNum = idx > 0 ? dayList[idx - 1] : null;
    const nextNum = idx >= 0 && idx < dayList.length - 1 ? dayList[idx + 1] : null;

    const prevStops = prevNum !== null ? allMappedStops.filter((s) => s.dayNumber === prevNum) : [];
    const nextStops = nextNum !== null ? allMappedStops.filter((s) => s.dayNumber === nextNum) : [];

    return {
      prevDayNumber: prevNum,
      nextDayNumber: nextNum,
      prevBridgeStop: prevStops.length > 0 ? prevStops[prevStops.length - 1] : null,
      nextBridgeStop: nextStops.length > 0 ? nextStops[0] : null,
    };
  }, [selectedDay, dayList, allMappedStops]);

  const allRenderableStops = React.useMemo(() => {
    const list = [...visibleStops];
    if (prevBridgeStop && !list.some((s) => s.id === prevBridgeStop.id)) {
      list.push(prevBridgeStop);
    }
    if (nextBridgeStop && !list.some((s) => s.id === nextBridgeStop.id)) {
      list.push(nextBridgeStop);
    }
    return list;
  }, [visibleStops, prevBridgeStop, nextBridgeStop]);

  const selectedStop = React.useMemo(
    () => allRenderableStops.find((s) => s.id === selectedStopId) || null,
    [allRenderableStops, selectedStopId]
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

  const handleSelectStop = React.useCallback(
    (stop: MappedStop) => {
      if (selectedDay !== 'all' && stop.dayNumber !== selectedDay) {
        setSelectedDay(stop.dayNumber);
        setSelectedStopId(stop.id);
        return;
      }
      setSelectedStopId(stop.id);
    },
    [selectedDay, setSelectedDay]
  );

  const handleFitAll = () => {
    setSelectedStopId(null);
    setFitSignal((prev) => prev + 1);
  };

  const buildExternalMapsUrl = (stop: MappedStop) => {
    const query = encodeURIComponent(
      stop.formattedAddress || `${stop.location}, ${itinerary.destination}`
    );
    if (stop.placeId) {
      return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${encodeURIComponent(stop.placeId)}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${stop.latitude},${stop.longitude}`;
  };

  const buildDirectionsUrl = (from: MappedStop, to: MappedStop) =>
    `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      from.formattedAddress || `${from.latitude},${from.longitude}`
    )}&destination=${encodeURIComponent(
      to.formattedAddress || `${to.latitude},${to.longitude}`
    )}`;

  return (
    <div className="bg-white rounded-[3rem] p-6 sm:p-10 shadow-xl border border-slate-100 space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="vibrant-gradient p-3.5 rounded-2xl text-white shadow-lg shrink-0">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-black text-[var(--whisk-orange)] uppercase tracking-[0.25em]">
              Interactive Route Map
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-[var(--whisk-navy)] tracking-tight">
              {itinerary.destination} Mapped Stops
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-600 tabular-nums">
            {geocoding
              ? 'Populating addresses...'
              : `${allMappedStops.length} of ${totalActivities} stops mapped`}
          </span>
          {visibleStops.length > 0 && (
            <button
              type="button"
              onClick={handleFitAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-[var(--whisk-navy)] transition-colors cursor-pointer"
              title="Reset map bounds to fit all visible stops"
            >
              <Maximize2 className="w-3.5 h-3.5" /> Fit Route
            </button>
          )}
        </div>
      </div>

      {/* Day Tabs with Prev / Next Day Connectors */}
      {dayList.length > 1 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedDay('all')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  selectedDay === 'all'
                    ? 'vibrant-gradient text-white shadow-md'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                Full Trip ({allMappedStops.length})
              </button>

              {itinerary.days.map((day) => {
                const count = allMappedStops.filter((s) => s.dayNumber === day.dayNumber).length;
                const color = getDayColor(day.dayNumber);
                const active = selectedDay === day.dayNumber;
                const dayDate = formatShortDayDate(day.date);

                return (
                  <button
                    key={day.dayNumber}
                    type="button"
                    onClick={() => setSelectedDay(day.dayNumber)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-[var(--whisk-navy)] text-white shadow-md'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${color.dot}`} />
                    Day {day.dayNumber}
                    {dayDate ? ` · ${dayDate}` : ''} ({count})
                  </button>
                );
              })}
            </div>

            {/* Prev / Next Day Stepper & Walk Radius Toggle */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowWalkRadius((prev) => !prev)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                  showWalkRadius
                    ? 'bg-orange-50 border-orange-200 text-orange-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title="Toggle 12-minute walkable anchor micro-buffer radius on map"
              >
                <span>🚶</span>
                <span className="hidden sm:inline">12-min Walk Radius</span>
              </button>
              <button
                type="button"
                disabled={selectedDay === 'all' || prevDayNumber === null}
                onClick={() => prevDayNumber !== null && setSelectedDay(prevDayNumber)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {prevDayNumber !== null ? `Day ${prevDayNumber}` : 'Prev'}
              </button>
              <button
                type="button"
                disabled={nextDayNumber === null}
                onClick={() => nextDayNumber !== null && setSelectedDay(nextDayNumber)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                {nextDayNumber !== null ? `Day ${nextDayNumber}` : 'Next'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Day-to-Day Handoff Bridge Bar */}
          {selectedDay !== 'all' && (prevBridgeStop || nextBridgeStop) && (
            <div className="grid sm:grid-cols-2 gap-2.5 text-xs">
              {prevBridgeStop && visibleStops[0] ? (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      From Day {prevDayNumber} Final Stop
                    </div>
                    <div className="font-bold text-[var(--whisk-navy)] truncate">
                      {prevBridgeStop.location} → {visibleStops[0].location}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => prevDayNumber !== null && setSelectedDay(prevDayNumber)}
                    className="text-[11px] font-bold text-[var(--whisk-orange)] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    ← Day {prevDayNumber}
                  </button>
                </div>
              ) : (
                <div className="hidden sm:block" />
              )}

              {nextBridgeStop && visibleStops[visibleStops.length - 1] && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Next Up · Day {nextDayNumber} Start
                    </div>
                    <div className="font-bold text-[var(--whisk-navy)] truncate">
                      {visibleStops[visibleStops.length - 1].location} → {nextBridgeStop.location}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => nextDayNumber !== null && setSelectedDay(nextDayNumber)}
                    className="text-[11px] font-bold text-[var(--whisk-orange)] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Day {nextDayNumber} →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Map Canvas Container */}
      <div className="w-full h-[420px] md:h-[480px] rounded-[2rem] overflow-hidden border border-slate-200/80 relative bg-slate-50">
        {keyLoading || (geocoding && allMappedStops.length === 0) ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--whisk-orange)]" />
            <span className="text-sm font-bold tracking-tight">
              {geocoding ? 'Pinning stops and verified addresses...' : 'Loading Interactive Map...'}
            </span>
          </div>
        ) : !apiKey ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center gap-2">
            <MapPin className="w-8 h-8 text-slate-300" />
            <p className="text-sm font-bold text-[var(--whisk-navy)]">
              Google Maps key is not configured yet
            </p>
            <p className="text-xs text-slate-500 max-w-md">
              Enable Google Maps Platform to visualize every stop and day-to-day route line.
            </p>
          </div>
        ) : visibleStops.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center gap-3">
            <MapPin className="w-8 h-8 text-slate-300" />
            <p className="text-sm font-bold text-[var(--whisk-navy)]">
              {geocodeError || 'No pinned coordinates available for this selection yet.'}
            </p>
            <button
              type="button"
              onClick={hydrateMissingCoordinates}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[var(--whisk-navy)] hover:border-[var(--whisk-orange)] cursor-pointer"
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
              <MapRoutePolylines
                visibleStops={visibleStops}
                prevBridgeStop={prevBridgeStop}
                nextBridgeStop={nextBridgeStop}
                selectedDay={selectedDay}
              />
              <MapWalkingBufferCircle
                selectedStop={selectedStop}
                anchorStop={visibleStops[0] || null}
                enabled={showWalkRadius}
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

              {selectedDay !== 'all' && prevBridgeStop && (
                <ItineraryMarkerItem
                  key={`bridge-prev-${prevBridgeStop.id}`}
                  stop={prevBridgeStop}
                  isSelected={selectedStop?.id === prevBridgeStop.id}
                  isContextBridge
                  onSelect={handleSelectStop}
                  registerMarker={registerMarker}
                />
              )}

              {selectedDay !== 'all' && nextBridgeStop && (
                <ItineraryMarkerItem
                  key={`bridge-next-${nextBridgeStop.id}`}
                  stop={nextBridgeStop}
                  isSelected={selectedStop?.id === nextBridgeStop.id}
                  isContextBridge
                  onSelect={handleSelectStop}
                  registerMarker={registerMarker}
                />
              )}

              {selectedStop && activeAnchorMarker && (
                <InfoWindow
                  anchor={activeAnchorMarker}
                  maxWidth={300}
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

                    <p className="text-[11px] font-semibold text-slate-600 leading-snug flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#FF7A00] shrink-0 mt-0.5" />
                      <span>
                        {selectedStop.formattedAddress ||
                          `${selectedStop.location}, ${itinerary.destination}`}
                      </span>
                    </p>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {selectedStop.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                      <a
                        href={buildExternalMapsUrl(selectedStop)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-black text-[#FF7A00] hover:underline"
                      >
                        Open in Google Maps <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </APIProvider>
        )}
      </div>

      {/* Route Legend */}
      {visibleStops.length > 1 && (
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-500">
          <span className="inline-flex items-center gap-2">
            <span className="w-5 h-0.5 bg-[var(--whisk-orange)] inline-block rounded" />
            Same-day route order
          </span>
          {dayList.length > 1 && (
            <span className="inline-flex items-center gap-2">
              <span className="w-5 border-t-2 border-dashed border-slate-500 inline-block" />
              Day-to-day transition bridge
            </span>
          )}
        </div>
      )}

      {/* Synchronized Stop Selector List with Auto-Populated Verified Addresses */}
      {visibleStops.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleStops.map((stop, idx) => {
            const color = getDayColor(stop.dayNumber);
            const isSelected = selectedStopId === stop.id;
            const prevStop = idx > 0 ? visibleStops[idx - 1] : prevBridgeStop;
            return (
              <div
                key={stop.id}
                onClick={() => handleSelectStop(stop)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectStop(stop);
                  }
                }}
                className={`text-left p-4 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-orange-50/70 border-[var(--whisk-orange)] shadow-sm'
                    : 'bg-slate-50/80 border-slate-100 hover:bg-white hover:border-slate-200'
                }`}
              >
                <span
                  style={{ backgroundColor: color.bg }}
                  className="w-7 h-7 rounded-xl text-white text-xs font-black flex items-center justify-center shrink-0 shadow-sm mt-0.5 tabular-nums"
                >
                  {stop.globalOrder}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <span>Day {stop.dayNumber}</span>
                    <span>·</span>
                    <span className="truncate">{stop.time}</span>
                  </div>
                  <div className="text-sm font-black text-[var(--whisk-navy)] truncate">
                    {stop.location}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 line-clamp-2 leading-snug">
                    {stop.formattedAddress || `${stop.location}, ${itinerary.destination}`}
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <a
                      href={buildExternalMapsUrl(stop)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--whisk-orange)] hover:underline"
                    >
                      Maps <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    {prevStop && (
                      <a
                        href={buildDirectionsUrl(prevStop, stop)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-[var(--whisk-navy)] hover:underline"
                      >
                        Directions from #{prevStop.globalOrder}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
