import * as React from 'react';
import {
  Anchor,
  Check,
  Download,
  Eye,
  Loader2,
  MapPin,
  Plane,
  Sparkles,
  X,
} from 'lucide-react';
import { TripItinerary } from '../../types';
import { buildStopId } from './ItineraryMap';

type StoryThemeId = 'ivory' | 'obsidian' | 'atelier';

interface StoryTheme {
  id: StoryThemeId;
  label: string;
  outerBg: string;
  outerGradient?: [string, string, string];
  cardBg: string;
  cardBorder: string;
  inkPrimary: string;
  inkSecondary: string;
  inkMuted: string;
  accent: string;
  accentSoft: string;
  mapBg: string;
  mapGrid: string;
  routeStroke: string;
  anchorRingFill: string;
  anchorRingStroke: string;
  dividerColor: string;
  notchBg: string;
}

const STORY_THEMES: Record<StoryThemeId, StoryTheme> = {
  ivory: {
    id: 'ivory',
    label: 'Ivory First Class',
    outerBg: '#EAE3D8',
    cardBg: '#FCF9F4',
    cardBorder: '#E5DCCD',
    inkPrimary: '#141923',
    inkSecondary: '#475569',
    inkMuted: '#8B8376',
    accent: '#D94E34',
    accentSoft: 'rgba(217, 78, 52, 0.14)',
    mapBg: '#F4EFE6',
    mapGrid: 'rgba(20, 25, 35, 0.07)',
    routeStroke: '#141923',
    anchorRingFill: 'rgba(217, 78, 52, 0.18)',
    anchorRingStroke: '#D94E34',
    dividerColor: '#D6CCB9',
    notchBg: '#EAE3D8',
  },
  obsidian: {
    id: 'obsidian',
    label: 'Obsidian Lounge',
    outerBg: '#08090D',
    cardBg: '#12151D',
    cardBorder: '#242938',
    inkPrimary: '#F8F5EE',
    inkSecondary: '#B6BDCB',
    inkMuted: '#727B8E',
    accent: '#DFC083',
    accentSoft: 'rgba(223, 192, 131, 0.16)',
    mapBg: '#0C0E14',
    mapGrid: 'rgba(248, 245, 238, 0.07)',
    routeStroke: '#DFC083',
    anchorRingFill: 'rgba(223, 192, 131, 0.2)',
    anchorRingStroke: '#DFC083',
    dividerColor: '#2A3042',
    notchBg: '#08090D',
  },
  atelier: {
    id: 'atelier',
    label: 'Whisk Atelier',
    outerBg: '#FF3B30',
    outerGradient: ['#FF3B30', '#FF1CF7', '#00B4FF'],
    cardBg: '#FFFFFF',
    cardBorder: 'rgba(15, 23, 42, 0.08)',
    inkPrimary: '#0F172A',
    inkSecondary: '#475569',
    inkMuted: '#94A3B8',
    accent: '#FF3B30',
    accentSoft: 'rgba(255, 59, 48, 0.14)',
    mapBg: '#F8FAFC',
    mapGrid: 'rgba(15, 23, 42, 0.06)',
    routeStroke: '#0099CC',
    anchorRingFill: 'rgba(255, 59, 48, 0.16)',
    anchorRingStroke: '#FF3B30',
    dividerColor: '#E2E8F0',
    notchBg: '#FF3B30',
  },
};

const CITY_IATA_MAP: Record<string, string> = {
  tokyo: 'TYO',
  kyoto: 'KIX',
  osaka: 'OSA',
  paris: 'CDG',
  london: 'LHR',
  'new york': 'NYC',
  manhattan: 'NYC',
  rome: 'FCO',
  barcelona: 'BCN',
  lisbon: 'LIS',
  seoul: 'SEL',
  bali: 'DPS',
  ubud: 'DPS',
  bangkok: 'BKK',
  singapore: 'SIN',
  dubai: 'DXB',
  sydney: 'SYD',
  melbourne: 'MEL',
  amsterdam: 'AMS',
  amalfi: 'NAP',
  positano: 'NAP',
  santorini: 'JTR',
  athens: 'ATH',
  reykjavik: 'KEF',
  iceland: 'KEF',
  zurich: 'ZRH',
  vienna: 'VIE',
  prague: 'PRG',
  istanbul: 'IST',
  marrakech: 'RAK',
  'mexico city': 'MEX',
  oaxaca: 'OAX',
  'buenos aires': 'EZE',
  rio: 'GIG',
  'los angeles': 'LAX',
  miami: 'MIA',
  'san francisco': 'SFO',
  honolulu: 'HNL',
  maui: 'OGG',
  vancouver: 'YVR',
  toronto: 'YYZ',
  montreal: 'YUL',
  edinburgh: 'EDI',
  dublin: 'DUB',
  milan: 'MXP',
  florence: 'FLR',
  venice: 'VCE',
  madrid: 'MAD',
  berlin: 'BER',
  munich: 'MUC',
  copenhagen: 'CPH',
  stockholm: 'ARN',
  oslo: 'OSL',
  helsinki: 'HEL',
  taipei: 'TPE',
  'hong kong': 'HKG',
  hanoi: 'HAN',
  'chiang mai': 'CNX',
  phuket: 'HKT',
  'cape town': 'CPT',
  cairo: 'CAI',
  queenstown: 'ZQN',
  auckland: 'AKL',
  chicago: 'ORD',
  seattle: 'SEA',
  boston: 'BOS',
  austin: 'AUS',
  nashville: 'BNA',
  denver: 'DEN',
};

interface StoryStop {
  id: string;
  dayNumber: number;
  globalOrder: number;
  location: string;
  time: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  isAnchor: boolean;
}

interface ProjectedPoint {
  stop: StoryStop;
  x: number;
  y: number;
}

function deriveOriginCode(departureAirport?: string): { code: string; label: string } {
  if (departureAirport) {
    const match = departureAirport.match(/\b([A-Z]{3})\b/);
    if (match) {
      const cleanedLabel = departureAirport
        .replace(match[1], '')
        .replace(/^[\s—\-–]+/, '')
        .split('(')[0]
        .trim();
      return { code: match[1], label: cleanedLabel || 'Origin' };
    }
  }
  return { code: 'WHK', label: 'Home Hub' };
}

function deriveDestinationCode(destination: string): { code: string; label: string } {
  const lower = destination.toLowerCase();
  const primaryCity = destination.split(',')[0]?.trim() || destination;
  for (const [key, code] of Object.entries(CITY_IATA_MAP)) {
    if (lower.includes(key)) {
      return { code, label: primaryCity };
    }
  }
  const letters = primaryCity.replace(/[^a-zA-Z]/g, '').toUpperCase();
  return {
    code: (letters.slice(0, 3) || 'DST').padEnd(3, 'X'),
    label: primaryCity,
  };
}

function formatBoardingDateRange(startDate?: string, endDate?: string, duration?: string): string {
  const fmt = (iso?: string) => {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
    const d = new Date(`${iso}T12:00:00Z`);
    if (Number.isNaN(d.getTime())) return null;
    return d
      .toLocaleDateString('en-US', { month: 'short', day: '2-digit', timeZone: 'UTC' })
      .toUpperCase();
  };
  const s = fmt(startDate);
  const e = fmt(endDate);
  if (s && e) return `${s} – ${e}`;
  if (s) return s;
  return (duration || 'CURATED').toUpperCase();
}

function projectStops(
  stops: StoryStop[],
  width: number,
  height: number,
  paddingX: number,
  paddingY: number
): ProjectedPoint[] {
  const geoStops = stops.filter(
    (s) =>
      typeof s.latitude === 'number' &&
      Number.isFinite(s.latitude) &&
      typeof s.longitude === 'number' &&
      Number.isFinite(s.longitude)
  );

  const usableW = width - paddingX * 2;
  const usableH = height - paddingY * 2;

  if (geoStops.length < 2) {
    // Graceful curated arc layout if coordinates aren't hydrated yet
    const sample = stops.slice(0, 8);
    if (sample.length === 0) return [];
    return sample.map((stop, idx) => {
      const t = sample.length === 1 ? 0.5 : idx / (sample.length - 1);
      const x = paddingX + t * usableW;
      const y = paddingY + usableH * (0.55 - Math.sin(t * Math.PI) * 0.34 + (idx % 2 === 0 ? 0.08 : -0.06));
      return { stop, x, y };
    });
  }

  const avgLatRad =
    (geoStops.reduce((sum, s) => sum + (s.latitude || 0), 0) / geoStops.length) * (Math.PI / 180);
  const cosLat = Math.max(0.25, Math.cos(avgLatRad));

  const rawPts = geoStops.map((s) => ({
    stop: s,
    rx: (s.longitude as number) * cosLat,
    ry: -(s.latitude as number),
  }));

  const minX = Math.min(...rawPts.map((p) => p.rx));
  const maxX = Math.max(...rawPts.map((p) => p.rx));
  const minY = Math.min(...rawPts.map((p) => p.ry));
  const maxY = Math.max(...rawPts.map((p) => p.ry));

  const spanX = Math.max(maxX - minX, 0.004);
  const spanY = Math.max(maxY - minY, 0.004);
  const scale = Math.min(usableW / spanX, usableH / spanY);

  const drawnW = spanX * scale;
  const drawnH = spanY * scale;
  const offsetX = paddingX + (usableW - drawnW) / 2;
  const offsetY = paddingY + (usableH - drawnH) / 2;

  return rawPts.map((p) => ({
    stop: p.stop,
    x: offsetX + (p.rx - minX) * scale,
    y: offsetY + (p.ry - minY) * scale,
  }));
}

function buildSmoothSvgPath(points: ProjectedPoint[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    d += ` Q ${prev.x.toFixed(1)} ${prev.y.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return d;
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length >= maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 4) {
      last = last.slice(0, -1);
    }
    if (words.join(' ').length > lines.join(' ').length) {
      lines[maxLines - 1] = `${last.trim()}…`;
    }
  }
  return lines;
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

interface StoryExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  itinerary: TripItinerary;
  anchorStopIds: string[];
  onToggleAnchorStop?: (stopId: string) => void;
  walkMinutes?: 10 | 15;
}

export const StoryExporterModal: React.FC<StoryExporterModalProps> = ({
  isOpen,
  onClose,
  itinerary,
  anchorStopIds,
  onToggleAnchorStop,
  walkMinutes = 10,
}) => {
  const [themeId, setThemeId] = React.useState<StoryThemeId>('ivory');
  const [showBufferRings, setShowBufferRings] = React.useState<boolean>(true);
  const [showSocialProof, setShowSocialProof] = React.useState<boolean>(true);
  const [screenshotMode, setScreenshotMode] = React.useState<boolean>(false);
  const [downloading, setDownloading] = React.useState<boolean>(false);
  const [downloadedNotice, setDownloadedNotice] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!isOpen) {
      setScreenshotMode(false);
      setDownloadedNotice(false);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (screenshotMode) {
          setScreenshotMode(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, screenshotMode, onClose]);

  const allStops = React.useMemo<StoryStop[]>(() => {
    const list: StoryStop[] = [];
    let globalOrder = 0;
    for (const day of itinerary.days || []) {
      let dayOrder = 0;
      for (const act of day.activities || []) {
        globalOrder += 1;
        dayOrder += 1;
        const id = buildStopId(day.dayNumber, dayOrder, act.location);
        list.push({
          id,
          dayNumber: day.dayNumber,
          globalOrder,
          location: act.location,
          time: act.time,
          formattedAddress: act.formattedAddress,
          latitude: act.latitude,
          longitude: act.longitude,
          isAnchor: anchorStopIds.includes(id),
        });
      }
    }
    return list;
  }, [itinerary.days, anchorStopIds]);

  // Showcase user-selected Anchor spots first; if none pinned yet, auto-highlight signature stops across days
  const featuredAnchors = React.useMemo<StoryStop[]>(() => {
    const pinned = allStops.filter((s) => s.isAnchor);
    if (pinned.length > 0) return pinned.slice(0, 4);

    const picks: StoryStop[] = [];
    const seenDays = new Set<number>();
    for (const stop of allStops) {
      if (!seenDays.has(stop.dayNumber)) {
        seenDays.add(stop.dayNumber);
        picks.push(stop);
      }
      if (picks.length >= 4) break;
    }
    if (picks.length < 3) {
      for (const stop of allStops) {
        if (!picks.some((p) => p.id === stop.id)) {
          picks.push(stop);
        }
        if (picks.length >= 3) break;
      }
    }
    return picks;
  }, [allStops]);

  const featuredAnchorIdSet = React.useMemo(
    () => new Set(featuredAnchors.map((a) => a.id)),
    [featuredAnchors]
  );

  const theme = STORY_THEMES[themeId];
  const origin = React.useMemo(
    () => deriveOriginCode(itinerary.departureAirport),
    [itinerary.departureAirport]
  );
  const dest = React.useMemo(
    () => deriveDestinationCode(itinerary.destination),
    [itinerary.destination]
  );
  const dateDisplay = React.useMemo(
    () => formatBoardingDateRange(itinerary.startDate, itinerary.endDate, itinerary.duration),
    [itinerary.startDate, itinerary.endDate, itinerary.duration]
  );

  const previewMapPoints = React.useMemo(
    () => projectStops(allStops, 300, 156, 26, 22),
    [allStops]
  );
  const previewSvgPath = React.useMemo(
    () => buildSmoothSvgPath(previewMapPoints),
    [previewMapPoints]
  );

  const boardingPassCode = React.useMemo(() => {
    const seed = `${origin.code}${dest.code}${itinerary.days.length}${allStops.length}`;
    const num = Math.abs(
      seed.split('').reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7)
    )
      .toString()
      .slice(0, 3)
      .padStart(3, '0');
    return `WK ${num}`;
  }, [origin.code, dest.code, itinerary.days.length, allStops.length]);

  const handleDownloadStoryPng = React.useCallback(async () => {
    setDownloading(true);
    try {
      const W = 1080;
      const H = 1920;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Outer 9:16 editorial canvas backdrop
      if (theme.outerGradient) {
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, theme.outerGradient[0]);
        grad.addColorStop(0.5, theme.outerGradient[1]);
        grad.addColorStop(1, theme.outerGradient[2]);
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = theme.outerBg;
      }
      ctx.fillRect(0, 0, W, H);

      // Subtle atmospheric sheen on Ivory/Obsidian
      if (themeId === 'ivory') {
        const glow = ctx.createRadialGradient(W * 0.15, H * 0.1, 40, W * 0.5, H * 0.5, W);
        glow.addColorStop(0, 'rgba(255,255,255,0.5)');
        glow.addColorStop(1, 'rgba(217,78,52,0.06)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);
      } else if (themeId === 'obsidian') {
        const glow = ctx.createRadialGradient(W * 0.85, H * 0.12, 40, W * 0.5, H * 0.4, W);
        glow.addColorStop(0, 'rgba(223,192,131,0.16)');
        glow.addColorStop(1, 'rgba(8,9,13,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);
      }

      // 2. Main Luxury Boarding Pass Card
      const cardX = 76;
      const cardY = 128;
      const cardW = W - 152;
      const cardH = H - 256;
      const tearY = cardY + cardH - 280;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
      ctx.shadowBlur = 64;
      ctx.shadowOffsetY = 24;
      drawRoundedRectPath(ctx, cardX, cardY, cardW, cardH, 48);
      ctx.fillStyle = theme.cardBg;
      ctx.fill();
      ctx.restore();

      drawRoundedRectPath(ctx, cardX, cardY, cardW, cardH, 48);
      ctx.strokeStyle = theme.cardBorder;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Top accent hairline for Atelier
      if (themeId === 'atelier') {
        const barGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
        barGrad.addColorStop(0, '#FF3B30');
        barGrad.addColorStop(0.35, '#FFC300');
        barGrad.addColorStop(0.7, '#00D97E');
        barGrad.addColorStop(1, '#00B4FF');
        ctx.save();
        drawRoundedRectPath(ctx, cardX, cardY, cardW, cardH, 48);
        ctx.clip();
        ctx.fillStyle = barGrad;
        ctx.fillRect(cardX, cardY, cardW, 14);
        ctx.restore();
      }

      const innerX = cardX + 64;
      const innerW = cardW - 128;

      // 3. Boarding Pass Header Strip
      let cursorY = cardY + 86;
      ctx.fillStyle = theme.accent;
      ctx.font = '800 22px "Plus Jakarta Sans", Inter, system-ui, sans-serif';
      ctx.letterSpacing = '6px' as any;
      ctx.fillText('WHISK AIR  ·  BOARDING PASS', innerX, cursorY);

      ctx.textAlign = 'right';
      ctx.fillStyle = theme.inkMuted;
      ctx.font = '700 22px "Plus Jakarta Sans", Inter, system-ui, sans-serif';
      ctx.fillText(boardingPassCode, innerX + innerW, cursorY);
      ctx.textAlign = 'left';

      // Thin divider
      cursorY += 32;
      ctx.strokeStyle = theme.dividerColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(innerX, cursorY);
      ctx.lineTo(innerX + innerW, cursorY);
      ctx.stroke();

      // 4. Origin -> Destination IATA Codes
      cursorY += 126;
      ctx.fillStyle = theme.inkPrimary;
      ctx.font = '900 108px "Plus Jakarta Sans", Inter, system-ui, sans-serif';
      ctx.fillText(origin.code, innerX, cursorY);

      ctx.textAlign = 'right';
      ctx.fillText(dest.code, innerX + innerW, cursorY);
      ctx.textAlign = 'left';

      // Center flight route line + chevron
      const lineLeft = innerX + 258;
      const lineRight = innerX + innerW - 258;
      const midLineY = cursorY - 36;
      ctx.save();
      ctx.strokeStyle = theme.dividerColor;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(lineLeft, midLineY);
      ctx.lineTo(lineRight, midLineY);
      ctx.stroke();
      ctx.restore();

      // Accent plane diamond in center
      const midX = (lineLeft + lineRight) / 2;
      ctx.fillStyle = theme.accent;
      ctx.beginPath();
      ctx.moveTo(midX + 18, midLineY);
      ctx.lineTo(midX - 10, midLineY - 12);
      ctx.lineTo(midX - 4, midLineY);
      ctx.lineTo(midX - 10, midLineY + 12);
      ctx.closePath();
      ctx.fill();

      // Subtitles below codes
      cursorY += 36;
      ctx.fillStyle = theme.inkMuted;
      ctx.font = '700 22px "Plus Jakarta Sans", Inter, system-ui, sans-serif';
      ctx.fillText(origin.label.toUpperCase().slice(0, 20), innerX, cursorY);
      ctx.textAlign = 'right';
      ctx.fillText(dest.label.toUpperCase().slice(0, 20), innerX + innerW, cursorY);
      ctx.textAlign = 'left';

      // 5. Trip Title
      cursorY += 56;
      ctx.fillStyle = theme.inkPrimary;
      ctx.font = '800 36px "Plus Jakarta Sans", Inter, system-ui, sans-serif';
      const titleLines = wrapCanvasText(ctx, itinerary.title, innerW, 2);
      for (const line of titleLines) {
        ctx.fillText(line, innerX, cursorY);
        cursorY += 46;
      }

      // 6. Metadata Grid (DATES | DURATION | CLASS)
      cursorY += 12;
      const metaColW = innerW / 3;
      const metaItems = [
        { k: 'DATES', v: dateDisplay },
        { k: 'DURATION', v: (itinerary.duration || `${itinerary.days.length} DAYS`).toUpperCase() },
        { k: 'CABIN / PACE', v: (itinerary.budget || 'BESPOKE').toUpperCase() },
      ];
      metaItems.forEach((item, i) => {
        const mx = innerX + i * metaColW;
        ctx.fillStyle = theme.inkMuted;
        ctx.font = '700 18px "Plus Jakarta Sans", Inter, system-ui, sans-serif';
        ctx.fillText(item.k, mx, cursorY);
        ctx.fillStyle = theme.inkPrimary;
        ctx.font = '800 24px "Plus Jakarta Sans", Inter, system-ui, sans-serif';
        ctx.fillText(item.v.slice(0, 16), mx, cursorY + 34);
      });

      // 7. Stylized Cartographic Route Map Frame
      cursorY += 72;
      const mapBoxX = innerX;
      const mapBoxY = cursorY;
      const mapBoxW = innerW;
      const mapBoxH = 420;

      drawRoundedRectPath(ctx, mapBoxX, mapBoxY, mapBoxW, mapBoxH, 32);
      ctx.fillStyle = theme.mapBg;
      ctx.fill();
      ctx.strokeStyle = theme.dividerColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Clip map box for grid & rings
      ctx.save();
      drawRoundedRectPath(ctx, mapBoxX, mapBoxY, mapBoxW, mapBoxH, 32);
      ctx.clip();

      // Subtle latitude/longitude gridlines
      ctx.strokeStyle = theme.mapGrid;
      ctx.lineWidth = 1.5;
      for (let gx = mapBoxX + 70; gx < mapBoxX + mapBoxW; gx += 78) {
        ctx.beginPath();
        ctx.moveTo(gx, mapBoxY);
        ctx.lineTo(gx, mapBoxY + mapBoxH);
        ctx.stroke();
      }
      for (let gy = mapBoxY + 64; gy < mapBoxY + mapBoxH; gy += 72) {
        ctx.beginPath();
        ctx.moveTo(mapBoxX, gy);
        ctx.lineTo(mapBoxX + mapBoxW, gy);
        ctx.stroke();
      }

      // Project stops into map box
      const canvasPts = projectStops(allStops, mapBoxW, mapBoxH, 76, 68).map((p) => ({
        ...p,
        x: mapBoxX + p.x,
        y: mapBoxY + p.y,
      }));

      // Draw translucent walkable Anchor Buffer rings first
      if (showBufferRings) {
        for (const pt of canvasPts) {
          if (!featuredAnchorIdSet.has(pt.stop.id)) continue;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 64, 0, Math.PI * 2);
          ctx.fillStyle = theme.anchorRingFill;
          ctx.fill();
          ctx.strokeStyle = theme.anchorRingStroke;
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 6]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Draw smooth route path
      if (canvasPts.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(canvasPts[0].x, canvasPts[0].y);
        for (let i = 1; i < canvasPts.length; i++) {
          const prev = canvasPts[i - 1];
          const curr = canvasPts[i];
          const mx = (prev.x + curr.x) / 2;
          const my = (prev.y + curr.y) / 2;
          ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
        }
        const lastPt = canvasPts[canvasPts.length - 1];
        ctx.lineTo(lastPt.x, lastPt.y);
        ctx.strokeStyle = theme.routeStroke;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }

      // Draw numbered stop nodes & highlight Anchor nodes
      for (const pt of canvasPts) {
        const isAnchor = featuredAnchorIdSet.has(pt.stop.id);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isAnchor ? 15 : 10, 0, Math.PI * 2);
        ctx.fillStyle = isAnchor ? theme.accent : theme.cardBg;
        ctx.fill();
        ctx.strokeStyle = isAnchor ? theme.cardBg : theme.routeStroke;
        ctx.lineWidth = isAnchor ? 4 : 3;
        ctx.stroke();
      }

      // Map box corner caption
      ctx.fillStyle = theme.inkMuted;
      ctx.font = '700 18px "Plus Jakarta Sans", Inter, system-ui, sans-serif';
      ctx.fillText(
        `PLOTTED ROUTE  ·  ${allStops.length} STOPS`,
        mapBoxX + 28,
        mapBoxY + mapBoxH - 24
      );
      if (showBufferRings) {
        ctx.textAlign = 'right';
        ctx.fillStyle = theme.accent;
        ctx.fillText(
          `${walkMinutes}M WALK BUFFERS`,
          mapBoxX + mapBoxW - 28,
          mapBoxY + mapBoxH - 24
        );
        ctx.textAlign = 'left';
      }
      ctx.restore();

      // 8. Curated Anchor Spots List
      cursorY = mapBoxY + mapBoxH + 58;
      ctx.fillStyle = theme.accent;
      ctx.font = '800 20px "Plus Jakarta Sans", Inter, system-ui, sans-serif';
      ctx.fillText(
        anchorStopIds.length > 0 ? 'PINNED ANCHOR SPOTS' : 'SIGNATURE ANCHOR SPOTS',
        innerX,
        cursorY
      );

      cursorY += 28;
      featuredAnchors.slice(0, 4).forEach((anchor, idx) => {
        const rowY = cursorY + idx * 82;
        // Subtle separator
        if (idx > 0) {
          ctx.strokeStyle = theme.dividerColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(innerX, rowY - 14);
          ctx.lineTo(innerX + innerW, rowY - 14);
          ctx.stroke();
        }

        // Index pill
        drawRoundedRectPath(ctx, innerX, rowY, 54, 44, 12);
        ctx.fillStyle = theme.accentSoft;
        ctx.fill();
        ctx.fillStyle = theme.accent;
        ctx.font = '900 20px "Plus Jakarta Sans", Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`0${idx + 1}`, innerX + 27, rowY + 29);
        ctx.textAlign = 'left';

        // Stop Name
        ctx.fillStyle = theme.inkPrimary;
        ctx.font = '800 28px "Plus Jakarta Sans", Inter, system-ui, sans-serif';
        const stopName =
          anchor.location.length > 34 ? `${anchor.location.slice(0, 33)}…` : anchor.location;
        ctx.fillText(stopName, innerX + 74, rowY + 24);

        // Day & Stroll subtitle
        ctx.fillStyle = theme.inkMuted;
        ctx.font = '600 20px "Plus Jakarta Sans", Inter, system-ui, sans-serif';
        ctx.fillText(
          `DAY ${anchor.dayNumber}  ·  ${walkMinutes}-MIN WALKABLE ZONE`,
          innerX + 74,
          rowY + 52
        );
      });

      // 9. Perforated Boarding Pass Tear-Line + Side Notches
      ctx.save();
      ctx.strokeStyle = theme.dividerColor;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      ctx.moveTo(cardX + 36, tearY);
      ctx.lineTo(cardX + cardW - 36, tearY);
      ctx.stroke();
      ctx.restore();

      // Left & right punch notches matching outer backdrop
      ctx.fillStyle = theme.notchBg;
      ctx.beginPath();
      ctx.arc(cardX, tearY, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cardX + cardW, tearY, 26, 0, Math.PI * 2);
      ctx.fill();

      // 10. Boarding Pass Stub: Minimalist Vector Barcode + @whisk.travel Watermark
      const barcodeY = tearY + 54;
      const barcodeH = 88;
      const bars = [
        4, 2, 6, 3, 2, 5, 2, 7, 3, 2, 4, 6, 2, 3, 5, 2, 4, 3, 6, 2, 5, 3, 2, 6, 4, 2, 5, 3, 4, 2,
        7, 2, 3, 5, 2, 4, 6, 2, 3, 5, 4, 2, 6, 3, 2, 5,
      ];
      let bx = innerX;
      ctx.fillStyle = theme.inkPrimary;
      bars.forEach((bw, idx) => {
        const scaledW = bw * 2.4;
        if (bx + scaledW < innerX + innerW - 260) {
          if (idx % 2 === 0) {
            ctx.fillRect(bx, barcodeY, scaledW, barcodeH);
          }
        }
        bx += scaledW + 4;
      });

      // Right side stub badge
      ctx.textAlign = 'right';
      ctx.fillStyle = theme.inkMuted;
      ctx.font = '700 18px "Plus Jakarta Sans", Inter, system-ui, sans-serif';
      ctx.fillText('CURATED WITH', innerX + innerW, barcodeY + 34);
      ctx.fillStyle = theme.inkPrimary;
      ctx.font = '900 32px "Plus Jakarta Sans", Inter, system-ui, sans-serif';
      ctx.fillText('@whisk.travel', innerX + innerW, barcodeY + 76);
      ctx.textAlign = 'left';

      // Bottom fine serial footer inside stub
      ctx.fillStyle = theme.inkMuted;
      ctx.font = '700 18px "Plus Jakarta Sans", Inter, system-ui, sans-serif';
      ctx.fillText(
        `${origin.code}-${dest.code}  ·  ${itinerary.days.length} DAYS  ·  WHISK PASSPORT`,
        innerX,
        cardY + cardH - 54
      );
      ctx.textAlign = 'right';
      ctx.fillStyle = theme.accent;
      ctx.font = '800 18px "Plus Jakarta Sans", Inter, system-ui, sans-serif';
      ctx.fillText(
        showSocialProof ? 'PLANNED ON WHISK.TRAVEL' : 'READY FOR BOARDING',
        innerX + innerW,
        cardY + cardH - 54
      );
      ctx.textAlign = 'left';

      if (showSocialProof) {
        ctx.textAlign = 'center';
        ctx.fillStyle = themeId === 'ivory' ? 'rgba(20, 25, 35, 0.72)' : 'rgba(255, 255, 255, 0.88)';
        ctx.font = '800 24px "Plus Jakarta Sans", Inter, system-ui, sans-serif';
        ctx.fillText('Build your free walkable boarding pass at whisk.travel', W / 2, H - 54);
        ctx.textAlign = 'left';
      }

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const slug = itinerary.destination
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `whisk-story-${slug || 'trip'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloadedNotice(true);
      setTimeout(() => setDownloadedNotice(false), 3200);
    } finally {
      setDownloading(false);
    }
  }, [
    theme,
    themeId,
    boardingPassCode,
    origin,
    dest,
    itinerary.title,
    itinerary.duration,
    itinerary.budget,
    itinerary.days.length,
    itinerary.destination,
    dateDisplay,
    allStops,
    showBufferRings,
    showSocialProof,
    featuredAnchorIdSet,
    walkMinutes,
    anchorStopIds.length,
    featuredAnchors,
  ]);

  if (!isOpen) return null;

  const outerStyle: React.CSSProperties = theme.outerGradient
    ? {
        background: `linear-gradient(145deg, ${theme.outerGradient[0]}, ${theme.outerGradient[1]} 52%, ${theme.outerGradient[2]})`,
      }
    : { backgroundColor: theme.outerBg };

  const boardingPassCard = (
    <div
      style={outerStyle}
      className="relative w-full max-w-[360px] aspect-[9/16] rounded-[2rem] p-5 shadow-2xl flex items-center justify-center overflow-hidden select-none mx-auto"
    >
      {/* Inner Luxury Boarding Pass */}
      <div
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
          color: theme.inkPrimary,
        }}
        className="w-full h-full rounded-[1.5rem] border shadow-xl flex flex-col justify-between relative overflow-hidden"
      >
        {themeId === 'atelier' && (
          <div className="h-1.5 w-full vibrant-gradient shrink-0" />
        )}

        {/* Main Upper Ticket Section */}
        <div className="px-5 pt-4 pb-3 flex-1 flex flex-col justify-between min-h-0">
          {/* Header Strip */}
          <div className="space-y-2.5">
            <div
              style={{ borderColor: theme.dividerColor }}
              className="flex items-center justify-between pb-2 border-b text-[9px] font-black tracking-[0.22em] uppercase"
            >
              <span style={{ color: theme.accent }}>WHISK AIR · BOARDING PASS</span>
              <span style={{ color: theme.inkMuted }} className="tabular-nums">
                {boardingPassCode}
              </span>
            </div>

            {/* IATA Route Hero */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <div>
                <div className="text-[32px] leading-none font-black tracking-tight tabular-nums">
                  {origin.code}
                </div>
                <div
                  style={{ color: theme.inkMuted }}
                  className="text-[8px] font-bold uppercase tracking-widest mt-1 max-w-[92px] truncate"
                >
                  {origin.label}
                </div>
              </div>

              <div className="flex-1 flex items-center gap-1.5 px-1">
                <div
                  style={{ borderColor: theme.dividerColor }}
                  className="flex-1 border-t border-dashed"
                />
                <Plane
                  style={{ color: theme.accent }}
                  className="w-3.5 h-3.5 rotate-45 shrink-0"
                />
                <div
                  style={{ borderColor: theme.dividerColor }}
                  className="flex-1 border-t border-dashed"
                />
              </div>

              <div className="text-right">
                <div className="text-[32px] leading-none font-black tracking-tight tabular-nums">
                  {dest.code}
                </div>
                <div
                  style={{ color: theme.inkMuted }}
                  className="text-[8px] font-bold uppercase tracking-widest mt-1 max-w-[92px] truncate ml-auto"
                >
                  {dest.label}
                </div>
              </div>
            </div>

            {/* Title & Meta Strip */}
            <div className="text-[12px] font-extrabold leading-snug line-clamp-2 tracking-tight">
              {itinerary.title}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-0.5">
              <div>
                <div
                  style={{ color: theme.inkMuted }}
                  className="text-[7px] font-bold uppercase tracking-[0.18em]"
                >
                  Dates
                </div>
                <div className="text-[9px] font-black tracking-tight truncate tabular-nums">
                  {dateDisplay}
                </div>
              </div>
              <div>
                <div
                  style={{ color: theme.inkMuted }}
                  className="text-[7px] font-bold uppercase tracking-[0.18em]"
                >
                  Duration
                </div>
                <div className="text-[9px] font-black tracking-tight truncate uppercase">
                  {itinerary.duration || `${itinerary.days.length} Days`}
                </div>
              </div>
              <div>
                <div
                  style={{ color: theme.inkMuted }}
                  className="text-[7px] font-bold uppercase tracking-[0.18em]"
                >
                  Cabin
                </div>
                <div className="text-[9px] font-black tracking-tight truncate uppercase">
                  {itinerary.budget || 'Bespoke'}
                </div>
              </div>
            </div>
          </div>

          {/* Stylized Plotted Map Route */}
          <div
            style={{
              backgroundColor: theme.mapBg,
              borderColor: theme.dividerColor,
            }}
            className="rounded-2xl border overflow-hidden relative my-2"
          >
            <svg
              viewBox="0 0 300 156"
              className="w-full h-[126px] block"
              aria-label="Plotted trip route map"
            >
              {/* Subtle Cartographic Grid */}
              {[50, 100, 150, 200, 250].map((gx) => (
                <line
                  key={`v-${gx}`}
                  x1={gx}
                  y1={0}
                  x2={gx}
                  y2={156}
                  stroke={theme.mapGrid}
                  strokeWidth="1"
                />
              ))}
              {[38, 78, 118].map((gy) => (
                <line
                  key={`h-${gy}`}
                  x1={0}
                  y1={gy}
                  x2={300}
                  y2={gy}
                  stroke={theme.mapGrid}
                  strokeWidth="1"
                />
              ))}

              {/* Walkable Anchor Buffer Rings */}
              {showBufferRings &&
                previewMapPoints
                  .filter((pt) => featuredAnchorIdSet.has(pt.stop.id))
                  .map((pt) => (
                    <circle
                      key={`ring-${pt.stop.id}`}
                      cx={pt.x}
                      cy={pt.y}
                      r={20}
                      fill={theme.anchorRingFill}
                      stroke={theme.anchorRingStroke}
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                  ))}

              {/* Smooth Route Polyline */}
              {previewSvgPath && (
                <path
                  d={previewSvgPath}
                  fill="none"
                  stroke={theme.routeStroke}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Stop Dots */}
              {previewMapPoints.map((pt) => {
                const isAnchor = featuredAnchorIdSet.has(pt.stop.id);
                return (
                  <circle
                    key={`dot-${pt.stop.id}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={isAnchor ? 5 : 3.2}
                    fill={isAnchor ? theme.accent : theme.cardBg}
                    stroke={isAnchor ? theme.cardBg : theme.routeStroke}
                    strokeWidth={isAnchor ? 1.8 : 1.5}
                  />
                );
              })}
            </svg>

            <div className="px-3 pb-1.5 flex items-center justify-between text-[7.5px] font-bold uppercase tracking-[0.16em]">
              <span style={{ color: theme.inkMuted }}>
                Plotted Route · {allStops.length} Stops
              </span>
              {showBufferRings && (
                <span style={{ color: theme.accent }}>{walkMinutes}m Walk Buffers</span>
              )}
            </div>
          </div>

          {/* Curated Anchor Spots */}
          <div className="space-y-1.5">
            <div
              style={{ color: theme.accent }}
              className="text-[8px] font-black uppercase tracking-[0.2em]"
            >
              {anchorStopIds.length > 0 ? 'Pinned Anchor Spots' : 'Signature Anchor Spots'}
            </div>
            <div className="divide-y" style={{ borderColor: theme.dividerColor }}>
              {featuredAnchors.slice(0, 4).map((anchor, idx) => (
                <div
                  key={anchor.id}
                  style={{ borderColor: theme.dividerColor }}
                  className="py-1.5 flex items-center gap-2.5"
                >
                  <span
                    style={{
                      backgroundColor: theme.accentSoft,
                      color: theme.accent,
                    }}
                    className="w-6 h-5 rounded-md text-[8px] font-black flex items-center justify-center shrink-0 tabular-nums"
                  >
                    0{idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-extrabold leading-tight truncate">
                      {anchor.location}
                    </div>
                    <div
                      style={{ color: theme.inkMuted }}
                      className="text-[7.5px] font-semibold uppercase tracking-wider"
                    >
                      Day {anchor.dayNumber} · {walkMinutes}-min walkable zone
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Perforation Tear-Line with Boarding Pass Notches */}
        <div className="relative flex items-center">
          <div
            style={{ backgroundColor: theme.notchBg }}
            className="w-4 h-8 rounded-r-full -ml-2 shrink-0"
          />
          <div
            style={{ borderColor: theme.dividerColor }}
            className="flex-1 border-t border-dashed mx-1"
          />
          <div
            style={{ backgroundColor: theme.notchBg }}
            className="w-4 h-8 rounded-l-full -mr-2 shrink-0"
          />
        </div>

        {/* Boarding Pass Stub Footer */}
        <div className="px-5 pt-2 pb-4 space-y-2">
          <div className="flex items-center justify-between gap-3">
            {/* Crisp Vector Barcode */}
            <div className="flex items-stretch gap-[1.5px] h-7 opacity-85" aria-hidden="true">
              {[2, 1, 3, 1.5, 1, 2.5, 1, 3.5, 1.5, 1, 2, 3, 1, 1.5, 2.5, 1, 2, 1.5, 3, 1, 2.5, 1.5, 1, 3, 2, 1, 2].map(
                (w, i) => (
                  <span
                    key={i}
                    style={{
                      width: `${w}px`,
                      backgroundColor: i % 2 === 0 ? theme.inkPrimary : 'transparent',
                    }}
                    className="block h-full"
                  />
                )
              )}
            </div>

            <div className="text-right shrink-0">
              <div
                style={{ color: theme.inkMuted }}
                className="text-[7px] font-bold uppercase tracking-[0.2em]"
              >
                Curated With
              </div>
              <div className="text-[12px] font-black tracking-tight">@whisk.travel</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[7.5px] font-bold uppercase tracking-[0.16em]">
            <span style={{ color: theme.inkMuted }}>
              {origin.code}-{dest.code} · {itinerary.days.length} Days
            </span>
            <span style={{ color: theme.accent }}>
              {showSocialProof ? 'Planned on whisk.travel' : 'Ready for Boarding'}
            </span>
          </div>
        </div>
      </div>
      {showSocialProof && (
        <div
          className={`absolute bottom-1.5 inset-x-0 text-center text-[8.5px] font-extrabold tracking-wide ${
            themeId === 'ivory' ? 'text-slate-800/75' : 'text-white/90'
          }`}
        >
          Build your free walkable boarding pass at whisk.travel
        </div>
      )}
    </div>
  );

  if (screenshotMode) {
    return (
      <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[380px]">{boardingPassCard}</div>
        <button
          type="button"
          onClick={() => setScreenshotMode(false)}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" /> Exit Screenshot View
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[110] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200/70 w-full max-w-4xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Bar */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="vibrant-gradient p-2.5 rounded-xl text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--whisk-orange)]">
                Instagram & TikTok Story Exporter
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[var(--whisk-navy)] tracking-tight">
                Luxury Boarding Pass Story Card (9:16)
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            aria-label="Close Story Exporter"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Vertical Boarding Pass Preview + Minimal Controls */}
        <div className="grid md:grid-cols-[1fr_320px] gap-6 p-6 sm:p-8 items-start">
          {/* Left: Live 9:16 Story Preview */}
          <div className="flex flex-col items-center justify-center bg-slate-50 rounded-[2rem] p-4 sm:p-6 border border-slate-100">
            {boardingPassCard}
            <p className="text-[11px] font-semibold text-slate-400 mt-3 text-center">
              Exact 9:16 vertical format (1080×1920 PNG) · Ready for Instagram Stories & TikTok
            </p>
          </div>

          {/* Right: Customization & Export Controls */}
          <div className="space-y-6">
            {/* Theme Selector */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                Boarding Pass Aesthetic
              </label>
              <div className="space-y-2">
                {(Object.values(STORY_THEMES) as StoryTheme[]).map((t) => {
                  const active = themeId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setThemeId(t.id)}
                      className={`w-full px-3.5 py-2.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        active
                          ? 'border-[var(--whisk-navy)] bg-slate-50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          style={
                            t.outerGradient
                              ? {
                                  background: `linear-gradient(135deg, ${t.outerGradient[0]}, ${t.outerGradient[1]}, ${t.outerGradient[2]})`,
                                }
                              : { backgroundColor: t.cardBg, borderColor: t.cardBorder }
                          }
                          className="w-6 h-6 rounded-lg border shrink-0 shadow-inner"
                        />
                        <span className="text-xs font-black text-[var(--whisk-navy)]">
                          {t.label}
                        </span>
                      </div>
                      {active && <Check className="w-4 h-4 text-[var(--whisk-navy)]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Walkable Buffer Rings Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div>
                <div className="text-xs font-black text-[var(--whisk-navy)]">
                  Show Anchor Stroll Rings
                </div>
                <div className="text-[11px] font-medium text-slate-500">
                  Plot {walkMinutes}-min walkable halos on route map
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={showBufferRings}
                onClick={() => setShowBufferRings((v) => !v)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  showBufferRings ? 'bg-[#FF3B30]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute top-1 ${
                    showBufferRings ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Social Proof Tagline Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div>
                <div className="text-xs font-black text-[var(--whisk-navy)]">
                  Show whisk.travel Proof Tag
                </div>
                <div className="text-[11px] font-medium text-slate-500">
                  Add @whisk.travel shareable CTA strip
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={showSocialProof}
                onClick={() => setShowSocialProof((v) => !v)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  showSocialProof ? 'bg-[#FF3B30]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute top-1 ${
                    showSocialProof ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Choose Featured Anchor Spots */}
            {onToggleAnchorStop && allStops.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                    Anchor Spots ({anchorStopIds.length}/4)
                  </label>
                  <span className="text-[10px] font-semibold text-slate-400">
                    Tap to pin on pass
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {allStops.slice(0, 12).map((stop) => {
                    const isPinned = anchorStopIds.includes(stop.id);
                    return (
                      <button
                        key={stop.id}
                        type="button"
                        onClick={() => onToggleAnchorStop(stop.id)}
                        className={`w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer ${
                          isPinned
                            ? 'bg-rose-50 border-[#FF3B30]/50 text-[var(--whisk-navy)] font-bold'
                            : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 font-semibold'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5 min-w-0">
                          {isPinned ? (
                            <Anchor className="w-3.5 h-3.5 text-[#FF3B30] shrink-0" />
                          ) : (
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span className="truncate">{stop.location}</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 shrink-0">
                          D{stop.dayNumber}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Primary Export Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                disabled={downloading}
                onClick={handleDownloadStoryPng}
                className="w-full vibrant-gradient text-white py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-60"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Rendering 1080×1920 PNG...
                  </>
                ) : downloadedNotice ? (
                  <>
                    <Check className="w-4 h-4" /> Saved to Downloads
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Download Story PNG (9:16)
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setScreenshotMode(true)}
                className="w-full py-3 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-[var(--whisk-navy)] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" /> Full-Screen Screenshot Mode
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
