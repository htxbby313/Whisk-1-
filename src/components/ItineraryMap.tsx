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
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  Anchor,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  Coffee,
  Compass,
  ExternalLink,
  Footprints,
  Loader2,
  MapPin,
  Maximize2,
  Navigation,
  RefreshCw,
  Share2,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { Activity, AnchorNearbySpot, DayPlan, TripItinerary } from '../../types';

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

export function buildStopId(dayNumber: number, dayOrder: number, location: string): string {
  return `d${dayNumber}-a${dayOrder}-${location}`;
}

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

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/**
 * Fetches curated cafes & hidden spots strictly inside the walkable buffer using
 * the modern Maps JS Places library (Place.searchNearby), with seamless fallback
 * to the server-side /api/maps/anchor-nearby proxy.
 */
const AnchorNearbyResolver: React.FC<{
  anchorStop: MappedStop | null;
  radiusMeters: number;
  destination: string;
  onLoadingChange: (loading: boolean) => void;
  onResolved: (spots: AnchorNearbySpot[], error: string | null) => void;
}> = ({ anchorStop, radiusMeters, destination, onLoadingChange, onResolved }) => {
  const placesLib = useMapsLibrary('places') as any;

  React.useEffect(() => {
    if (!anchorStop) {
      onLoadingChange(false);
      onResolved([], null);
      return;
    }

    let cancelled = false;
    onLoadingChange(true);

    (async () => {
      const anchorNameLower = anchorStop.location.trim().toLowerCase();
      const cafeTypes = ['cafe', 'coffee_shop', 'bakery', 'tea_house'];
      const hiddenTypes = ['art_gallery', 'book_store', 'historical_landmark', 'museum', 'park', 'plaza'];
      const cafeTypeSet = new Set(cafeTypes);

      // 1. Primary: Modern Places API (New) JS SDK (Place.searchNearby)
      if (placesLib?.Place?.searchNearby) {
        try {
          const fields = [
            'id',
            'displayName',
            'formattedAddress',
            'location',
            'rating',
            'userRatingCount',
            'primaryType',
            'primaryTypeDisplayName',
            'types',
            'editorialSummary',
            'googleMapsURI',
          ];
          const restriction = {
            center: { lat: anchorStop.latitude, lng: anchorStop.longitude },
            radius: radiusMeters,
          };

          const [cafeRes, hiddenRes] = await Promise.allSettled([
            placesLib.Place.searchNearby({
              fields,
              locationRestriction: restriction,
              includedPrimaryTypes: cafeTypes,
              maxResultCount: 10,
              language: 'en',
            }),
            placesLib.Place.searchNearby({
              fields,
              locationRestriction: restriction,
              includedPrimaryTypes: hiddenTypes,
              maxResultCount: 10,
              language: 'en',
            }),
          ]);

          const dedup: Record<string, AnchorNearbySpot> = {};
          const ingest = (placesList: any[], preferred: 'cafe' | 'hidden_spot') => {
            for (const p of placesList || []) {
              const id = typeof p?.id === 'string' ? p.id : '';
              const name =
                typeof p?.displayName === 'string'
                  ? p.displayName.trim()
                  : p?.displayName?.text?.trim() || '';
              const loc = p?.location;
              const pLat = typeof loc?.lat === 'function' ? loc.lat() : loc?.lat;
              const pLng = typeof loc?.lng === 'function' ? loc.lng() : loc?.lng;
              if (!id || !name || typeof pLat !== 'number' || typeof pLng !== 'number') continue;

              const distanceMeters = haversineMeters(
                anchorStop.latitude,
                anchorStop.longitude,
                pLat,
                pLng
              );
              // Strictly enforce walking radius boundary
              if (distanceMeters > radiusMeters) continue;
              if (distanceMeters < 15 && anchorNameLower && name.toLowerCase().includes(anchorNameLower)) {
                continue;
              }

              const primaryType = typeof p?.primaryType === 'string' ? p.primaryType : '';
              const types: string[] = Array.isArray(p?.types) ? p.types : [];
              const isCafe =
                preferred === 'cafe' ||
                cafeTypeSet.has(primaryType) ||
                types.some((t) => cafeTypeSet.has(t));
              const category: 'cafe' | 'hidden_spot' = isCafe ? 'cafe' : 'hidden_spot';

              const typeLabel =
                (typeof p?.primaryTypeDisplayName === 'string'
                  ? p.primaryTypeDisplayName
                  : p?.primaryTypeDisplayName?.text) ||
                (primaryType
                  ? primaryType
                      .split('_')
                      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ')
                  : category === 'cafe'
                  ? 'Cafe'
                  : 'Hidden Spot');

              const mapsUri =
                p?.googleMapsURI ||
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  name
                )}&query_place_id=${encodeURIComponent(id)}`;

              const existing = dedup[id];
              if (!existing || (existing.category !== 'cafe' && category === 'cafe')) {
                dedup[id] = {
                  id,
                  name,
                  category,
                  typeLabel,
                  formattedAddress: p?.formattedAddress || `${name}, ${destination}`,
                  latitude: pLat,
                  longitude: pLng,
                  distanceMeters,
                  walkMinutes: Math.max(1, Math.round(distanceMeters / 80)),
                  rating: typeof p?.rating === 'number' ? p.rating : undefined,
                  userRatingCount:
                    typeof p?.userRatingCount === 'number' ? p.userRatingCount : undefined,
                  editorialSummary:
                    typeof p?.editorialSummary === 'string'
                      ? p.editorialSummary
                      : p?.editorialSummary?.text || undefined,
                  mapsUri,
                };
              }
            }
          };

          if (cafeRes.status === 'fulfilled') ingest(cafeRes.value?.places || [], 'cafe');
          if (hiddenRes.status === 'fulfilled') ingest(hiddenRes.value?.places || [], 'hidden_spot');

          const spots = Object.values(dedup).sort((a, b) => a.distanceMeters - b.distanceMeters);
          if (spots.length > 0) {
            if (!cancelled) {
              onResolved(spots, null);
              onLoadingChange(false);
            }
            return;
          }
        } catch (sdkErr: any) {
          const msg = String(sdkErr?.message || sdkErr || '');
          if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('OVER_QUERY_LIMIT')) {
            window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
          }
          // Fall through seamlessly to server-side /api/maps/anchor-nearby proxy
        }
      }

      // 2. Fallback: Server-side proxy (Places API New REST + Google Maps Grounding)
      try {
        const res = await fetch('/api/maps/anchor-nearby', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: anchorStop.latitude,
            longitude: anchorStop.longitude,
            radiusMeters,
            anchorName: anchorStop.location,
            destination,
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
          if (!cancelled) {
            onResolved(
              [],
              'Google Maps Places quota reached; unable to load nearby walkable spots right now.'
            );
          }
          return;
        }

        if (!res.ok) {
          throw new Error(data?.error || 'Could not find nearby walkable spots');
        }

        if (!cancelled) {
          const safePlaces: AnchorNearbySpot[] = Array.isArray(data?.places) ? data.places : [];
          onResolved(safePlaces, null);
        }
      } catch (err: any) {
        if (!cancelled) {
          onResolved([], err?.message || 'Unable to load nearby cafes & hidden spots.');
        }
      } finally {
        if (!cancelled) onLoadingChange(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [placesLib, anchorStop, radiusMeters, destination, onLoadingChange, onResolved]);

  return null;
};

const MapViewportController: React.FC<{
  points: MappedStop[];
  selectedStop: MappedStop | null;
  selectedNearbySpot: AnchorNearbySpot | null;
  fitSignal: number;
  hasActiveAnchor: boolean;
}> = ({ points, selectedStop, selectedNearbySpot, fitSignal, hasActiveAnchor }) => {
  const map = useMap();

  React.useEffect(() => {
    const g = (window as any).google;
    if (!map || points.length === 0 || !g?.maps?.LatLngBounds || hasActiveAnchor) return;

    if (points.length === 1) {
      map.panTo({ lat: points[0].latitude, lng: points[0].longitude });
      map.setZoom(14);
      return;
    }

    const bounds = new g.maps.LatLngBounds();
    points.forEach((p) => bounds.extend({ lat: p.latitude, lng: p.longitude }));
    map.fitBounds(bounds, { top: 56, right: 56, bottom: 56, left: 56 });
  }, [map, points, fitSignal, hasActiveAnchor]);

  React.useEffect(() => {
    if (!map || !selectedStop) return;
    map.panTo({ lat: selectedStop.latitude, lng: selectedStop.longitude });
    const currentZoom = map.getZoom();
    if (typeof currentZoom === 'number' && currentZoom < 14) {
      map.setZoom(14);
    }
  }, [map, selectedStop]);

  React.useEffect(() => {
    if (!map || !selectedNearbySpot) return;
    map.panTo({ lat: selectedNearbySpot.latitude, lng: selectedNearbySpot.longitude });
    const currentZoom = map.getZoom();
    if (typeof currentZoom === 'number' && currentZoom < 15) {
      map.setZoom(15);
    }
  }, [map, selectedNearbySpot]);

  return null;
};

/**
 * Renders a soft translucent 10–15 minute walkable stroll buffer circle
 * (plus an inner 5-minute stroll halo) around the active Anchor stop.
 */
const AnchorBufferCircle: React.FC<{
  anchorStop: MappedStop | null;
  radiusMeters: number;
}> = ({ anchorStop, radiusMeters }) => {
  const map = useMap();

  React.useEffect(() => {
    const g = (window as any).google;
    if (!map || !anchorStop || !g?.maps?.Circle) return;

    const center = { lat: anchorStop.latitude, lng: anchorStop.longitude };

    const outerCircle = new g.maps.Circle({
      map,
      center,
      radius: radiusMeters,
      strokeColor: '#FF3B30',
      strokeOpacity: 0.72,
      strokeWeight: 2,
      fillColor: '#FF3B30',
      fillOpacity: 0.11,
      clickable: false,
      zIndex: 4,
    });

    const innerCircle = new g.maps.Circle({
      map,
      center,
      radius: Math.round(radiusMeters * 0.5),
      strokeColor: '#FF3B30',
      strokeOpacity: 0.28,
      strokeWeight: 1,
      fillColor: '#FF3B30',
      fillOpacity: 0.04,
      clickable: false,
      zIndex: 3,
    });

    const bounds = outerCircle.getBounds();
    if (bounds) {
      map.fitBounds(bounds, { top: 44, right: 44, bottom: 44, left: 44 });
    }

    return () => {
      outerCircle.setMap(null);
      innerCircle.setMap(null);
    };
  }, [map, anchorStop, radiusMeters]);

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

    const byDay: Record<number, MappedStop[]> = {};
    for (const stop of visibleStops) {
      if (!byDay[stop.dayNumber]) byDay[stop.dayNumber] = [];
      byDay[stop.dayNumber].push(stop);
    }

    const dayNumbers = Object.keys(byDay)
      .map(Number)
      .sort((a, b) => a - b);

    for (const dayNum of dayNumbers) {
      const dayStops = byDay[dayNum] || [];
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
      for (let i = 0; i < dayNumbers.length - 1; i++) {
        const currentList = byDay[dayNumbers[i]] || [];
        const nextList = byDay[dayNumbers[i + 1]] || [];
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
  isAnchor: boolean;
  isActiveAnchor: boolean;
  isContextBridge?: boolean;
  onSelect: (stop: MappedStop) => void;
  registerMarker: (id: string, marker: AdvancedMarkerRef) => void;
}

const ItineraryMarkerItem: React.FC<MarkerItemProps> = ({
  stop,
  isSelected,
  isAnchor,
  isActiveAnchor,
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
      title={`${isAnchor ? 'Anchor · ' : ''}Day ${stop.dayNumber} · ${stop.location}${
        stop.formattedAddress ? ` — ${stop.formattedAddress}` : ''
      }`}
      zIndex={isActiveAnchor ? 1200 : isSelected ? 1000 : isAnchor ? 900 : isContextBridge ? 10 : stop.globalOrder}
      clickable
      onClick={() => onSelect(stop)}
    >
      <Pin
        background={isActiveAnchor ? '#FF3B30' : isContextBridge ? '#64748B' : color.bg}
        borderColor={isActiveAnchor || isAnchor ? '#FFC300' : '#FFFFFF'}
        glyphColor="#FFFFFF"
        glyphText={
          isActiveAnchor
            ? '★'
            : isContextBridge
            ? `D${stop.dayNumber}`
            : String(stop.globalOrder)
        }
        scale={isActiveAnchor ? 1.32 : isSelected ? 1.24 : isAnchor ? 1.15 : isContextBridge ? 0.85 : 1.0}
      />
    </AdvancedMarker>
  );
};

interface NearbyMarkerProps {
  spot: AnchorNearbySpot;
  isSelected: boolean;
  onSelect: (spot: AnchorNearbySpot) => void;
  registerNearbyMarker: (id: string, marker: AdvancedMarkerRef) => void;
}

const NearbySpotMarkerItem: React.FC<NearbyMarkerProps> = ({
  spot,
  isSelected,
  onSelect,
  registerNearbyMarker,
}) => {
  const [markerRef, marker] = useAdvancedMarkerRef();

  React.useEffect(() => {
    registerNearbyMarker(spot.id, marker);
    return () => registerNearbyMarker(spot.id, null);
  }, [marker, spot.id, registerNearbyMarker]);

  const isCafe = spot.category === 'cafe';

  return (
    <AdvancedMarker
      ref={markerRef}
      position={{ lat: spot.latitude, lng: spot.longitude }}
      title={`${spot.name} (${spot.walkMinutes} min walk · ${spot.typeLabel})`}
      zIndex={isSelected ? 1150 : 750}
      clickable
      onClick={() => onSelect(spot)}
    >
      <Pin
        background={isCafe ? '#D97706' : '#059669'}
        borderColor="#FFFFFF"
        glyphColor="#FFFFFF"
        glyphText={isCafe ? 'C' : '✦'}
        scale={isSelected ? 1.18 : 0.9}
      />
    </AdvancedMarker>
  );
};

interface ItineraryMapProps {
  itinerary: TripItinerary;
  onCoordinatesHydrated?: (itineraryId: string, updatedDays: DayPlan[]) => void;
  selectedDay?: number | 'all';
  onSelectDay?: (day: number | 'all') => void;
  anchorStopIds?: string[];
  activeAnchorId?: string | null;
  onToggleAnchorStop?: (stopId: string) => void;
  onSetActiveAnchor?: (stopId: string | null) => void;
  walkMinutes?: 10 | 15;
  onWalkMinutesChange?: (minutes: 10 | 15) => void;
  savedPlaceNames?: Set<string>;
  onSavePlace?: (place: {
    name: string;
    type: 'place' | 'restaurant';
    destination: string;
    description: string;
    mapsUri?: string;
  }) => void;
  onOpenStoryExporter?: () => void;
}

export const ItineraryMap: React.FC<ItineraryMapProps> = ({
  itinerary,
  onCoordinatesHydrated,
  selectedDay: controlledDay,
  onSelectDay,
  anchorStopIds: controlledAnchorIds,
  activeAnchorId: controlledActiveAnchorId,
  onToggleAnchorStop,
  onSetActiveAnchor,
  walkMinutes: controlledWalkMinutes,
  onWalkMinutesChange,
  savedPlaceNames,
  onSavePlace,
  onOpenStoryExporter,
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

  // Walkable Anchor Buffer state (controlled or uncontrolled fallback)
  const [internalAnchorIds, setInternalAnchorIds] = React.useState<string[]>([]);
  const [internalActiveAnchorId, setInternalActiveAnchorId] = React.useState<string | null>(null);
  const [internalWalkMinutes, setInternalWalkMinutes] = React.useState<10 | 15>(10);

  const [nearbySpots, setNearbySpots] = React.useState<AnchorNearbySpot[]>([]);
  const [nearbyLoading, setNearbyLoading] = React.useState<boolean>(false);
  const [nearbyError, setNearbyError] = React.useState<string | null>(null);
  const [nearbyFilter, setNearbyFilter] = React.useState<'all' | 'cafe' | 'hidden_spot'>('all');
  const [selectedNearbySpotId, setSelectedNearbySpotId] = React.useState<string | null>(null);

  const anchorStopIds = controlledAnchorIds ?? internalAnchorIds;
  const activeAnchorId =
    controlledActiveAnchorId !== undefined ? controlledActiveAnchorId : internalActiveAnchorId;
  const walkMinutes = controlledWalkMinutes ?? internalWalkMinutes;
  const radiusMeters = walkMinutes === 15 ? 1200 : 800;

  const setWalkMinutes = React.useCallback(
    (mins: 10 | 15) => {
      setInternalWalkMinutes(mins);
      onWalkMinutesChange?.(mins);
    },
    [onWalkMinutesChange]
  );

  const setActiveAnchor = React.useCallback(
    (stopId: string | null) => {
      setInternalActiveAnchorId(stopId);
      onSetActiveAnchor?.(stopId);
      setSelectedNearbySpotId(null);
      if (!stopId) {
        setNearbySpots([]);
        setNearbyError(null);
      }
    },
    [onSetActiveAnchor]
  );

  const handleToggleAnchor = React.useCallback(
    (stop: MappedStop) => {
      const isAlreadyActive = activeAnchorId === stop.id;
      if (isAlreadyActive) {
        setActiveAnchor(null);
        return;
      }

      if (!anchorStopIds.includes(stop.id)) {
        if (onToggleAnchorStop) {
          onToggleAnchorStop(stop.id);
        } else {
          setInternalAnchorIds((prev) => (prev.includes(stop.id) ? prev : [...prev, stop.id]));
        }
      }
      setActiveAnchor(stop.id);
      setSelectedStopId(null);
    },
    [activeAnchorId, anchorStopIds, onToggleAnchorStop, setActiveAnchor]
  );

  const handleRemovePinnedAnchor = React.useCallback(
    (stopId: string) => {
      if (onToggleAnchorStop) {
        onToggleAnchorStop(stopId);
      } else {
        setInternalAnchorIds((prev) => prev.filter((id) => id !== stopId));
      }
      if (activeAnchorId === stopId) {
        setActiveAnchor(null);
      }
    },
    [activeAnchorId, onToggleAnchorStop, setActiveAnchor]
  );

  const selectedDay = controlledDay !== undefined ? controlledDay : internalDay;
  const setSelectedDay = React.useCallback(
    (next: number | 'all') => {
      setInternalDay(next);
      onSelectDay?.(next);
      setSelectedStopId(null);
      setSelectedNearbySpotId(null);
      setFitSignal((prev) => prev + 1);
    },
    [onSelectDay]
  );

  const markerInstancesRef = React.useRef<Record<string, AdvancedMarkerRef>>({});
  const nearbyMarkerInstancesRef = React.useRef<Record<string, AdvancedMarkerRef>>({});
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

  const registerNearbyMarker = React.useCallback(
    (id: string, marker: AdvancedMarkerRef) => {
      if (marker) {
        nearbyMarkerInstancesRef.current[id] = marker;
      } else {
        delete nearbyMarkerInstancesRef.current[id];
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
      (day.activities || []).forEach((act, actIdx) => {
        if (hasValidCoords(act)) {
          globalCounter += 1;
          dayCounter += 1;
          stops.push({
            id: buildStopId(day.dayNumber, actIdx + 1, act.location),
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
      });
    }
    return stops;
  }, [itinerary.days]);

  const activeAnchorStop = React.useMemo(
    () => (activeAnchorId ? allMappedStops.find((s) => s.id === activeAnchorId) || null : null),
    [allMappedStops, activeAnchorId]
  );

  const pinnedAnchorStops = React.useMemo(
    () => allMappedStops.filter((s) => anchorStopIds.includes(s.id)),
    [allMappedStops, anchorStopIds]
  );

  const handleNearbyResolved = React.useCallback(
    (spots: AnchorNearbySpot[], error: string | null) => {
      setNearbySpots(spots);
      setNearbyError(error);
      setSelectedNearbySpotId(null);
    },
    []
  );

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
    setSelectedNearbySpotId(null);
    setInternalActiveAnchorId(null);
    setInternalAnchorIds([]);
    setNearbySpots([]);
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
    if (activeAnchorStop && !list.some((s) => s.id === activeAnchorStop.id)) {
      list.push(activeAnchorStop);
    }
    return list;
  }, [visibleStops, prevBridgeStop, nextBridgeStop, activeAnchorStop]);

  const filteredNearbySpots = React.useMemo(() => {
    if (nearbyFilter === 'all') return nearbySpots;
    return nearbySpots.filter((s) => s.category === nearbyFilter);
  }, [nearbySpots, nearbyFilter]);

  const cafeCount = React.useMemo(
    () => nearbySpots.filter((s) => s.category === 'cafe').length,
    [nearbySpots]
  );

  const hiddenSpotCount = React.useMemo(
    () => nearbySpots.filter((s) => s.category === 'hidden_spot').length,
    [nearbySpots]
  );

  const selectedStop = React.useMemo(
    () => allRenderableStops.find((s) => s.id === selectedStopId) || null,
    [allRenderableStops, selectedStopId]
  );

  const selectedNearbySpot = React.useMemo(
    () => filteredNearbySpots.find((s) => s.id === selectedNearbySpotId) || null,
    [filteredNearbySpots, selectedNearbySpotId]
  );

  const activeInfoWindowMarker = selectedStop
    ? markerInstancesRef.current[selectedStop.id] || null
    : null;

  const activeNearbyMarker = selectedNearbySpot
    ? nearbyMarkerInstancesRef.current[selectedNearbySpot.id] || null
    : null;

  const initialCenter = React.useMemo(() => {
    if (visibleStops.length > 0) {
      return { lat: visibleStops[0].latitude, lng: visibleStops[0].longitude };
    }
    return { lat: 35.6762, lng: 139.6503 };
  }, [visibleStops]);

  const handleSelectStop = React.useCallback(
    (stop: MappedStop) => {
      setSelectedNearbySpotId(null);
      if (selectedDay !== 'all' && stop.dayNumber !== selectedDay) {
        setSelectedDay(stop.dayNumber);
        setSelectedStopId(stop.id);
        return;
      }
      setSelectedStopId(stop.id);
    },
    [selectedDay, setSelectedDay]
  );

  const handleSelectNearbySpot = React.useCallback((spot: AnchorNearbySpot) => {
    setSelectedStopId(null);
    setSelectedNearbySpotId(spot.id);
  }, []);

  const handleFitAll = () => {
    setSelectedStopId(null);
    setSelectedNearbySpotId(null);
    if (activeAnchorId) {
      setActiveAnchor(null);
    }
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
    <div
      id="whisk-interactive-map"
      className="bg-white rounded-[3rem] p-6 sm:p-10 shadow-xl border border-slate-100 space-y-6 scroll-mt-24"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="vibrant-gradient p-3.5 rounded-2xl text-white shadow-lg shrink-0">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-black text-[var(--whisk-orange)] uppercase tracking-[0.25em]">
              Interactive Route & Walkable Buffers
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-[var(--whisk-navy)] tracking-tight">
              {itinerary.destination} Mapped Stops
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-600 tabular-nums whitespace-nowrap">
            {geocoding
              ? 'Populating addresses...'
              : `${allMappedStops.length} of ${totalActivities} stops mapped`}
          </span>
          {visibleStops.length > 0 && (
            <button
              type="button"
              onClick={handleFitAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-[var(--whisk-navy)] transition-colors cursor-pointer whitespace-nowrap"
              title="Reset map bounds to fit all visible stops"
            >
              <Maximize2 className="w-3.5 h-3.5" /> Fit Route
            </button>
          )}
          {onOpenStoryExporter && (
            <button
              type="button"
              onClick={onOpenStoryExporter}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--whisk-navy)] hover:bg-slate-800 text-xs font-bold text-white transition-colors cursor-pointer whitespace-nowrap shadow-sm"
              title="Export 9:16 Boarding Pass Story graphic"
            >
              <Share2 className="w-3.5 h-3.5" /> Export Story
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
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
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
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {prevDayNumber !== null ? `Day ${prevDayNumber}` : 'Prev'}
              </button>
              <button
                type="button"
                disabled={nextDayNumber === null}
                onClick={() => nextDayNumber !== null && setSelectedDay(nextDayNumber)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer whitespace-nowrap"
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

      {/* Walkable Anchor Buffer Quick Bar */}
      {allMappedStops.length > 0 && (
        <div
          className={`rounded-2xl px-4 py-3 border flex flex-wrap items-center justify-between gap-3 transition-colors ${
            activeAnchorStop
              ? 'bg-rose-50/70 border-rose-200/80'
              : 'bg-slate-50/90 border-slate-200/70'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                activeAnchorStop
                  ? 'bg-[#FF3B30] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-[#FF3B30]'
              }`}
            >
              <Anchor className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              {activeAnchorStop ? (
                <>
                  <div className="text-[10px] font-black uppercase tracking-wider text-[#FF3B30]">
                    Active Walkable Anchor · {walkMinutes}-Min Stroll ({radiusMeters}m)
                  </div>
                  <div className="text-xs sm:text-sm font-black text-[var(--whisk-navy)] truncate">
                    {activeAnchorStop.location}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    10–15 Min Walkable Anchor Buffers
                  </div>
                  <div className="text-xs font-semibold text-slate-600">
                    Set any stop as an Anchor to map a walkable stroll radius & uncover cafes and hidden spots strictly inside it.
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {activeAnchorStop ? (
              <>
                <div className="inline-flex rounded-xl bg-white border border-rose-200/80 p-0.5">
                  <button
                    type="button"
                    onClick={() => setWalkMinutes(10)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                      walkMinutes === 10
                        ? 'bg-[#FF3B30] text-white'
                        : 'text-slate-600 hover:text-[var(--whisk-navy)]'
                    }`}
                  >
                    10 min · 800m
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalkMinutes(15)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                      walkMinutes === 15
                        ? 'bg-[#FF3B30] text-white'
                        : 'text-slate-600 hover:text-[var(--whisk-navy)]'
                    }`}
                  >
                    15 min · 1.2km
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveAnchor(null)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer whitespace-nowrap"
                >
                  <X className="w-3.5 h-3.5" /> Clear Buffer
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleToggleAnchor(visibleStops[0] || allMappedStops[0])}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FF3B30] hover:bg-red-600 text-white text-xs font-black transition-colors cursor-pointer whitespace-nowrap shadow-sm"
              >
                <Footprints className="w-3.5 h-3.5" />
                Set Stop #{(visibleStops[0] || allMappedStops[0]).globalOrder} as Anchor
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pinned Anchor Switcher when user has pinned multiple anchors */}
      {pinnedAnchorStops.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Trip Anchors ({pinnedAnchorStops.length}):
          </span>
          {pinnedAnchorStops.map((stop) => {
            const isActive = activeAnchorId === stop.id;
            return (
              <div
                key={stop.id}
                className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 transition-all ${
                  isActive
                    ? 'bg-[#FF3B30] text-white border-[#FF3B30] shadow-sm'
                    : 'bg-white text-[var(--whisk-navy)] border-slate-200 hover:border-[#FF3B30]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveAnchor(isActive ? null : stop.id)}
                  className="inline-flex items-center gap-1.5 font-bold cursor-pointer whitespace-nowrap"
                >
                  <Anchor className="w-3 h-3" />
                  <span className="max-w-[160px] truncate">{stop.location}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemovePinnedAnchor(stop.id)}
                  title="Remove Anchor"
                  className={`p-0.5 rounded-md cursor-pointer ${
                    isActive ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-100 text-slate-400'
                  }`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Map Canvas Container */}
      <div className="w-full h-[430px] md:h-[500px] rounded-[2rem] overflow-hidden border border-slate-200/80 relative bg-slate-50">
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
              Enable Google Maps Platform to visualize every stop and walkable anchor buffer.
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
          <APIProvider apiKey={apiKey} libraries={['marker', 'places']} language="en" region="US">
            <GoogleMap
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              defaultCenter={initialCenter}
              defaultZoom={12}
              gestureHandling="greedy"
              style={{ width: '100%', height: '100%' }}
              onClick={() => {
                setSelectedStopId(null);
                setSelectedNearbySpotId(null);
              }}
            >
              <MapStatusWatcher />
              <AnchorNearbyResolver
                anchorStop={activeAnchorStop}
                radiusMeters={radiusMeters}
                destination={itinerary.destination}
                onLoadingChange={setNearbyLoading}
                onResolved={handleNearbyResolved}
              />
              <MapViewportController
                points={visibleStops}
                selectedStop={selectedStop}
                selectedNearbySpot={selectedNearbySpot}
                fitSignal={fitSignal}
                hasActiveAnchor={Boolean(activeAnchorStop)}
              />
              <AnchorBufferCircle anchorStop={activeAnchorStop} radiusMeters={radiusMeters} />
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
                  isAnchor={anchorStopIds.includes(stop.id)}
                  isActiveAnchor={activeAnchorStop?.id === stop.id}
                  onSelect={handleSelectStop}
                  registerMarker={registerMarker}
                />
              ))}

              {activeAnchorStop && !visibleStops.some((s) => s.id === activeAnchorStop.id) && (
                <ItineraryMarkerItem
                  key={`anchor-focus-${activeAnchorStop.id}`}
                  stop={activeAnchorStop}
                  isSelected={selectedStop?.id === activeAnchorStop.id}
                  isAnchor
                  isActiveAnchor
                  onSelect={handleSelectStop}
                  registerMarker={registerMarker}
                />
              )}

              {selectedDay !== 'all' && prevBridgeStop && (
                <ItineraryMarkerItem
                  key={`bridge-prev-${prevBridgeStop.id}`}
                  stop={prevBridgeStop}
                  isSelected={selectedStop?.id === prevBridgeStop.id}
                  isAnchor={anchorStopIds.includes(prevBridgeStop.id)}
                  isActiveAnchor={activeAnchorStop?.id === prevBridgeStop.id}
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
                  isAnchor={anchorStopIds.includes(nextBridgeStop.id)}
                  isActiveAnchor={activeAnchorStop?.id === nextBridgeStop.id}
                  isContextBridge
                  onSelect={handleSelectStop}
                  registerMarker={registerMarker}
                />
              )}

              {/* Curated Cafes & Hidden Spots strictly within the active walkable buffer */}
              {activeAnchorStop &&
                filteredNearbySpots.map((spot) => (
                  <NearbySpotMarkerItem
                    key={spot.id}
                    spot={spot}
                    isSelected={selectedNearbySpot?.id === spot.id}
                    onSelect={handleSelectNearbySpot}
                    registerNearbyMarker={registerNearbyMarker}
                  />
                ))}

              {/* Itinerary Stop InfoWindow */}
              {selectedStop && activeInfoWindowMarker && (
                <InfoWindow
                  anchor={activeInfoWindowMarker}
                  maxWidth={310}
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
                      <button
                        type="button"
                        onClick={() => handleToggleAnchor(selectedStop)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black transition-colors cursor-pointer ${
                          activeAnchorId === selectedStop.id
                            ? 'bg-[#FF3B30] text-white'
                            : 'bg-rose-50 text-[#FF3B30] hover:bg-rose-100'
                        }`}
                      >
                        <Anchor className="w-3 h-3" />
                        {activeAnchorId === selectedStop.id ? 'Clear Buffer' : `${walkMinutes}m Walk Anchor`}
                      </button>

                      <a
                        href={buildExternalMapsUrl(selectedStop)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-black text-[#FF7A00] hover:underline"
                      >
                        Maps <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </InfoWindow>
              )}

              {/* Nearby Walkable Cafe / Hidden Spot InfoWindow */}
              {selectedNearbySpot && activeNearbyMarker && (
                <InfoWindow
                  anchor={activeNearbyMarker}
                  maxWidth={300}
                  onCloseClick={() => setSelectedNearbySpotId(null)}
                >
                  <div className="p-1.5 space-y-2 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          selectedNearbySpot.category === 'cafe'
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-emerald-50 text-emerald-800'
                        }`}
                      >
                        {selectedNearbySpot.category === 'cafe' ? 'Curated Cafe' : 'Hidden Spot'} ·{' '}
                        {selectedNearbySpot.typeLabel}
                      </span>
                    </div>

                    <h4 className="font-black text-sm text-slate-900 leading-snug">
                      {selectedNearbySpot.name}
                    </h4>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-600 tabular-nums">
                      <span className="inline-flex items-center gap-1 text-[#FF3B30]">
                        <Footprints className="w-3.5 h-3.5" />
                        {selectedNearbySpot.walkMinutes} min stroll ({selectedNearbySpot.distanceMeters}m)
                      </span>
                      {typeof selectedNearbySpot.rating === 'number' && (
                        <span className="inline-flex items-center gap-0.5 text-amber-600">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {selectedNearbySpot.rating.toFixed(1)}
                          {selectedNearbySpot.userRatingCount
                            ? ` (${selectedNearbySpot.userRatingCount})`
                            : ''}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] font-medium text-slate-500 leading-snug">
                      {selectedNearbySpot.formattedAddress}
                    </p>

                    {selectedNearbySpot.editorialSummary && (
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {selectedNearbySpot.editorialSummary}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                      {onSavePlace && (
                        <button
                          type="button"
                          onClick={() =>
                            onSavePlace({
                              name: selectedNearbySpot.name,
                              type: selectedNearbySpot.category === 'cafe' ? 'restaurant' : 'place',
                              destination: itinerary.destination,
                              description:
                                selectedNearbySpot.editorialSummary ||
                                `${selectedNearbySpot.typeLabel} · ${selectedNearbySpot.walkMinutes} min walk from ${
                                  activeAnchorStop?.location || 'anchor'
                                }`,
                              mapsUri: selectedNearbySpot.mapsUri,
                            })
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-black text-slate-700 hover:text-[#FF3B30] cursor-pointer"
                        >
                          {savedPlaceNames?.has(selectedNearbySpot.name.toLowerCase()) ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" /> Saved
                            </>
                          ) : (
                            <>
                              <Bookmark className="w-3 h-3" /> Save Spot
                            </>
                          )}
                        </button>
                      )}
                      <a
                        href={selectedNearbySpot.mapsUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-black text-[#FF7A00] hover:underline ml-auto"
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

      {/* Route & Walkable Buffer Legend */}
      {visibleStops.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-500">
          {visibleStops.length > 1 && (
            <span className="inline-flex items-center gap-2">
              <span className="w-5 h-0.5 bg-[var(--whisk-orange)] inline-block rounded" />
              Same-day route order
            </span>
          )}
          {dayList.length > 1 && (
            <span className="inline-flex items-center gap-2">
              <span className="w-5 border-t-2 border-dashed border-slate-500 inline-block" />
              Day-to-day bridge
            </span>
          )}
          {activeAnchorStop && (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#FF3B30]/20 border border-[#FF3B30] inline-block" />
                {walkMinutes}-min walkable buffer ({radiusMeters}m)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#D97706] inline-block" />
                Curated Cafes (C)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#059669] inline-block" />
                Hidden Spots (✦)
              </span>
            </>
          )}
        </div>
      )}

      {/* Curated Cafes & Hidden Spots Strictly Inside the Walkable Anchor Buffer */}
      {activeAnchorStop && (
        <div className="rounded-[2rem] border border-rose-200/70 bg-gradient-to-br from-rose-50/50 via-white to-amber-50/40 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#FF3B30]">
                <Footprints className="w-3.5 h-3.5" />
                Strictly Within {walkMinutes}-Min Stroll ({radiusMeters}m) of {activeAnchorStop.location}
              </div>
              <h4 className="text-lg font-black text-[var(--whisk-navy)] tracking-tight mt-0.5">
                Curated Cafes & Hidden Gems Nearby
              </h4>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setNearbyFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black cursor-pointer transition-colors whitespace-nowrap tabular-nums ${
                  nearbyFilter === 'all'
                    ? 'bg-[var(--whisk-navy)] text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                All ({nearbySpots.length})
              </button>
              <button
                type="button"
                onClick={() => setNearbyFilter('cafe')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-black cursor-pointer transition-colors whitespace-nowrap tabular-nums ${
                  nearbyFilter === 'cafe'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-amber-50'
                }`}
              >
                <Coffee className="w-3 h-3" /> Cafes ({cafeCount})
              </button>
              <button
                type="button"
                onClick={() => setNearbyFilter('hidden_spot')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-black cursor-pointer transition-colors whitespace-nowrap tabular-nums ${
                  nearbyFilter === 'hidden_spot'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50'
                }`}
              >
                <Sparkles className="w-3 h-3" /> Hidden Spots ({hiddenSpotCount})
              </button>
            </div>
          </div>

          {nearbyLoading ? (
            <div className="py-8 flex items-center justify-center gap-2.5 text-slate-500 text-xs font-bold">
              <Loader2 className="w-4 h-4 animate-spin text-[#FF3B30]" />
              Scanning cafes & hidden gems within {radiusMeters}m...
            </div>
          ) : nearbyError ? (
            <div className="py-5 px-4 rounded-2xl bg-white border border-rose-200 text-xs font-semibold text-rose-700">
              {nearbyError}
            </div>
          ) : filteredNearbySpots.length === 0 ? (
            <div className="py-6 px-4 rounded-2xl bg-white border border-slate-200/80 text-center space-y-2">
              <p className="text-xs font-bold text-slate-600">
                No matching {nearbyFilter === 'cafe' ? 'cafes' : nearbyFilter === 'hidden_spot' ? 'hidden spots' : 'spots'} found inside the {walkMinutes}-minute radius.
              </p>
              {walkMinutes === 10 && (
                <button
                  type="button"
                  onClick={() => setWalkMinutes(15)}
                  className="text-xs font-black text-[#FF3B30] hover:underline cursor-pointer"
                >
                  Expand stroll radius to 15 minutes (1.2km) →
                </button>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredNearbySpots.map((spot) => {
                const isSelected = selectedNearbySpotId === spot.id;
                const isCafe = spot.category === 'cafe';
                const isSaved = Boolean(savedPlaceNames?.has(spot.name.toLowerCase()));
                return (
                  <div
                    key={spot.id}
                    onClick={() => handleSelectNearbySpot(spot)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectNearbySpot(spot);
                      }
                    }}
                    className={`p-4 rounded-2xl border bg-white transition-all text-left flex flex-col justify-between gap-2.5 cursor-pointer ${
                      isSelected
                        ? isCafe
                          ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                          : 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${
                            isCafe ? 'text-amber-700' : 'text-emerald-700'
                          }`}
                        >
                          {isCafe ? <Coffee className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                          {spot.typeLabel}
                        </span>
                        <span className="text-[11px] font-black text-[#FF3B30] tabular-nums whitespace-nowrap">
                          {spot.walkMinutes} min · {spot.distanceMeters}m
                        </span>
                      </div>

                      <div className="text-sm font-black text-[var(--whisk-navy)] leading-snug line-clamp-1">
                        {spot.name}
                      </div>

                      <div className="text-[11px] font-medium text-slate-500 line-clamp-2 leading-snug">
                        {spot.editorialSummary || spot.formattedAddress}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 tabular-nums">
                        {typeof spot.rating === 'number' && (
                          <span className="inline-flex items-center gap-0.5 text-amber-600">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            {spot.rating.toFixed(1)}
                          </span>
                        )}
                        <a
                          href={spot.mapsUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-0.5 text-[var(--whisk-orange)] hover:underline"
                        >
                          Maps <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>

                      {onSavePlace && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSavePlace({
                              name: spot.name,
                              type: isCafe ? 'restaurant' : 'place',
                              destination: itinerary.destination,
                              description:
                                spot.editorialSummary ||
                                `${spot.typeLabel} · ${spot.walkMinutes} min stroll from ${activeAnchorStop.location}`,
                              mapsUri: spot.mapsUri,
                            });
                          }}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition-colors ${
                            isSaved
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {isSaved ? <Check className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
                          {isSaved ? 'Saved' : 'Save'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Synchronized Stop Selector List with Auto-Populated Verified Addresses & Anchor Pinning */}
      {visibleStops.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleStops.map((stop, idx) => {
            const color = getDayColor(stop.dayNumber);
            const isSelected = selectedStopId === stop.id;
            const isActiveAnchor = activeAnchorId === stop.id;
            const isPinnedAnchor = anchorStopIds.includes(stop.id);
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
                  isActiveAnchor
                    ? 'bg-rose-50/70 border-[#FF3B30] shadow-sm'
                    : isSelected
                    ? 'bg-orange-50/70 border-[var(--whisk-orange)] shadow-sm'
                    : 'bg-slate-50/80 border-slate-100 hover:bg-white hover:border-slate-200'
                }`}
              >
                <span
                  style={{ backgroundColor: isActiveAnchor ? '#FF3B30' : color.bg }}
                  className="w-7 h-7 rounded-xl text-white text-xs font-black flex items-center justify-center shrink-0 shadow-sm mt-0.5 tabular-nums"
                >
                  {isActiveAnchor ? '★' : stop.globalOrder}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span>Day {stop.dayNumber}</span>
                      <span>·</span>
                      <span className="truncate">{stop.time}</span>
                    </div>
                    {isPinnedAnchor && (
                      <span className="text-[#FF3B30] shrink-0">Anchor</span>
                    )}
                  </div>
                  <div className="text-sm font-black text-[var(--whisk-navy)] truncate">
                    {stop.location}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 line-clamp-2 leading-snug">
                    {stop.formattedAddress || `${stop.location}, ${itinerary.destination}`}
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleAnchor(stop);
                      }}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black transition-colors cursor-pointer whitespace-nowrap ${
                        isActiveAnchor
                          ? 'bg-[#FF3B30] text-white'
                          : isPinnedAnchor
                          ? 'bg-rose-100 text-[#FF3B30] hover:bg-rose-200'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-[#FF3B30] hover:text-[#FF3B30]'
                      }`}
                    >
                      <Anchor className="w-2.5 h-2.5" />
                      {isActiveAnchor ? `${walkMinutes}m Buffer On` : 'Set Anchor'}
                    </button>

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
                        From #{prevStop.globalOrder}
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
