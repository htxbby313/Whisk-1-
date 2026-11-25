export type MarketingPassThemeId = 'ivory' | 'obsidian' | 'atelier';

export interface MarketingBoardingPassSpec {
  originCode: string;
  originLabel: string;
  destCode: string;
  destLabel: string;
  title: string;
  dateDisplay: string;
  duration: string;
  cabinLabel: string;
  passCode: string;
  viralHook: string;
  socialProofMetric: string;
  socialProofQuote: string;
  socialProofAuthor: string;
  anchorSpots: Array<{ name: string; subtitle: string }>;
  themeId: MarketingPassThemeId;
  customBackdropDataUrl?: string | null;
}

export interface ThemePalette {
  id: MarketingPassThemeId;
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
  divider: string;
  notchBg: string;
  sceneBgHex: number;
  metalHex: number;
}

export const MARKETING_PASS_THEMES: Record<MarketingPassThemeId, ThemePalette> = {
  ivory: {
    id: 'ivory',
    label: 'Ivory First Class',
    outerBg: '#EAE3D8',
    cardBg: '#FCF9F4',
    cardBorder: '#E2D8C7',
    inkPrimary: '#141923',
    inkSecondary: '#475569',
    inkMuted: '#8B8376',
    accent: '#D94E34',
    accentSoft: 'rgba(217, 78, 52, 0.14)',
    divider: '#D6CCB9',
    notchBg: '#EAE3D8',
    sceneBgHex: 0xeae4da,
    metalHex: 0xc9a363,
  },
  obsidian: {
    id: 'obsidian',
    label: 'Obsidian Lounge',
    outerBg: '#090B10',
    cardBg: '#121620',
    cardBorder: '#262C3D',
    inkPrimary: '#F8F5EE',
    inkSecondary: '#B6BDCB',
    inkMuted: '#788196',
    accent: '#DFC083',
    accentSoft: 'rgba(223, 192, 131, 0.16)',
    divider: '#2B3144',
    notchBg: '#090B10',
    sceneBgHex: 0x0b0e15,
    metalHex: 0xd9b878,
  },
  atelier: {
    id: 'atelier',
    label: 'Whisk Atelier',
    outerBg: '#FF3B30',
    outerGradient: ['#FF3B30', '#FF6B2B', '#00B4FF'],
    cardBg: '#FFFFFF',
    cardBorder: 'rgba(15, 23, 42, 0.10)',
    inkPrimary: '#0F172A',
    inkSecondary: '#475569',
    inkMuted: '#94A3B8',
    accent: '#FF3B30',
    accentSoft: 'rgba(255, 59, 48, 0.12)',
    divider: '#E2E8F0',
    notchBg: '#FF542E',
    sceneBgHex: 0x161925,
    metalHex: 0xf46042,
  },
};

function drawRoundedRect(
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

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Draws a crisp boarding pass face texture for the 3D Three.js Boarding Pass mesh (1024x1536).
 */
export function drawBoardingPassTextureCanvas(spec: MarketingBoardingPassSpec): HTMLCanvasElement {
  const W = 1024;
  const H = 1536;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const theme = MARKETING_PASS_THEMES[spec.themeId];

  // Base paper card stock
  ctx.fillStyle = theme.cardBg;
  ctx.fillRect(0, 0, W, H);

  // Subtle linen paper grain
  ctx.fillStyle = spec.themeId === 'obsidian' ? 'rgba(255,255,255,0.018)' : 'rgba(15,23,42,0.016)';
  for (let i = 0; i < 420; i++) {
    const gx = (i * 197) % W;
    const gy = (i * 353) % H;
    ctx.fillRect(gx, gy, 3, 2);
  }

  // Top color accent ribbon
  if (spec.themeId === 'atelier') {
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, '#FF3B30');
    grad.addColorStop(0.35, '#FFC300');
    grad.addColorStop(0.7, '#00D97E');
    grad.addColorStop(1, '#00B4FF');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 24);
  } else {
    ctx.fillStyle = theme.accent;
    ctx.fillRect(0, 0, W, 14);
  }

  const pad = 74;
  const innerW = W - pad * 2;
  let y = 104;

  // Header strip
  ctx.fillStyle = theme.accent;
  ctx.font = '800 24px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('WHISK AIR  ·  BOARDING PASS', pad, y);

  ctx.textAlign = 'right';
  ctx.fillStyle = theme.inkMuted;
  ctx.font = '700 24px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(spec.passCode, W - pad, y);
  ctx.textAlign = 'left';

  y += 30;
  ctx.strokeStyle = theme.divider;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(W - pad, y);
  ctx.stroke();

  // IATA Route Codes
  y += 140;
  ctx.fillStyle = theme.inkPrimary;
  ctx.font = '900 124px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(spec.originCode, pad, y);

  ctx.textAlign = 'right';
  ctx.fillText(spec.destCode, W - pad, y);
  ctx.textAlign = 'left';

  // Dashed route arc & plane arrow
  const lineLeft = pad + 292;
  const lineRight = W - pad - 292;
  const midY = y - 42;
  ctx.save();
  ctx.strokeStyle = theme.divider;
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(lineLeft, midY);
  ctx.lineTo(lineRight, midY);
  ctx.stroke();
  ctx.restore();

  const cx = W / 2;
  ctx.fillStyle = theme.accent;
  ctx.beginPath();
  ctx.moveTo(cx + 22, midY);
  ctx.lineTo(cx - 12, midY - 14);
  ctx.lineTo(cx - 4, midY);
  ctx.lineTo(cx - 12, midY + 14);
  ctx.closePath();
  ctx.fill();

  y += 40;
  ctx.fillStyle = theme.inkMuted;
  ctx.font = '700 24px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(spec.originLabel.toUpperCase().slice(0, 18), pad, y);
  ctx.textAlign = 'right';
  ctx.fillText(spec.destLabel.toUpperCase().slice(0, 18), W - pad, y);
  ctx.textAlign = 'left';

  // Trip headline
  y += 74;
  ctx.fillStyle = theme.inkPrimary;
  ctx.font = '800 42px "Plus Jakarta Sans", system-ui, sans-serif';
  const titleLines = wrapText(ctx, spec.title, innerW, 2);
  for (const line of titleLines) {
    ctx.fillText(line, pad, y);
    y += 52;
  }

  // Metadata row
  y += 22;
  const cols = [
    { label: 'DATES', value: spec.dateDisplay },
    { label: 'DURATION', value: spec.duration.toUpperCase() },
    { label: 'CABIN / PACE', value: spec.cabinLabel.toUpperCase() },
  ];
  const colW = innerW / 3;
  cols.forEach((col, i) => {
    const mx = pad + i * colW;
    ctx.fillStyle = theme.inkMuted;
    ctx.font = '700 19px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(col.label, mx, y);
    ctx.fillStyle = theme.inkPrimary;
    ctx.font = '800 26px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(col.value.slice(0, 15), mx, y + 36);
  });

  // Social proof box
  y += 88;
  drawRoundedRect(ctx, pad, y, innerW, 178, 26);
  ctx.fillStyle = spec.themeId === 'obsidian' ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)';
  ctx.fill();
  ctx.strokeStyle = theme.divider;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = theme.accent;
  ctx.font = '800 20px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(spec.socialProofMetric.toUpperCase(), pad + 32, y + 46);

  ctx.fillStyle = theme.inkPrimary;
  ctx.font = '700 27px "Plus Jakarta Sans", system-ui, sans-serif';
  const quoteLines = wrapText(ctx, `“${spec.socialProofQuote}”`, innerW - 64, 2);
  quoteLines.forEach((qLine, qi) => {
    ctx.fillText(qLine, pad + 32, y + 92 + qi * 36);
  });

  // Featured walkable anchor stops
  y += 228;
  ctx.fillStyle = theme.accent;
  ctx.font = '800 21px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('VERIFIED WALKABLE ANCHOR SPOTS', pad, y);

  y += 26;
  spec.anchorSpots.slice(0, 3).forEach((spot, idx) => {
    const rowY = y + idx * 92;
    if (idx > 0) {
      ctx.strokeStyle = theme.divider;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pad, rowY - 12);
      ctx.lineTo(W - pad, rowY - 12);
      ctx.stroke();
    }
    drawRoundedRect(ctx, pad, rowY + 4, 58, 48, 12);
    ctx.fillStyle = theme.accentSoft;
    ctx.fill();
    ctx.fillStyle = theme.accent;
    ctx.font = '900 22px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`0${idx + 1}`, pad + 29, rowY + 36);
    ctx.textAlign = 'left';

    ctx.fillStyle = theme.inkPrimary;
    ctx.font = '800 30px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(spot.name.slice(0, 30), pad + 78, rowY + 30);

    ctx.fillStyle = theme.inkMuted;
    ctx.font = '600 21px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(spot.subtitle.slice(0, 42), pad + 78, rowY + 62);
  });

  // Perforated tear-line
  const tearY = H - 230;
  ctx.save();
  ctx.strokeStyle = theme.divider;
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 14]);
  ctx.beginPath();
  ctx.moveTo(pad, tearY);
  ctx.lineTo(W - pad, tearY);
  ctx.stroke();
  ctx.restore();

  // Barcode + @whisk.travel handle
  const barcodeY = tearY + 42;
  const bars = [
    4, 2, 6, 3, 2, 5, 2, 7, 3, 2, 4, 6, 2, 3, 5, 2, 4, 3, 6, 2, 5, 3, 2, 6, 4, 2, 5, 3, 4, 2, 6,
  ];
  let bx = pad;
  ctx.fillStyle = theme.inkPrimary;
  bars.forEach((bw, i) => {
    const sw = bw * 2.5;
    if (bx + sw < W - pad - 290 && i % 2 === 0) {
      ctx.fillRect(bx, barcodeY, sw, 82);
    }
    bx += sw + 4;
  });

  ctx.textAlign = 'right';
  ctx.fillStyle = theme.inkMuted;
  ctx.font = '700 20px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('PLAN YOUR ROUTE AT', W - pad, barcodeY + 30);
  ctx.fillStyle = theme.inkPrimary;
  ctx.font = '900 36px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('whisk.travel', W - pad, barcodeY + 74);

  ctx.textAlign = 'left';
  ctx.fillStyle = theme.inkMuted;
  ctx.font = '700 19px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('@whisk.travel  ·  INSTAGRAM & TIKTOK', pad, H - 46);
  ctx.textAlign = 'right';
  ctx.fillStyle = theme.accent;
  ctx.font = '800 19px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('READY FOR BOARDING', W - pad, H - 46);
  ctx.textAlign = 'left';

  return canvas;
}

/**
 * Renders a full 1080x1920 (9:16) shareable Social Proof + Whisk Boarding Pass PNG for Instagram Reels/Stories & TikTok.
 */
export async function renderMarketingSocialProofPng(
  spec: MarketingBoardingPassSpec
): Promise<string> {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const theme = MARKETING_PASS_THEMES[spec.themeId];

  // 1. Backdrop (custom AI image or curated editorial theme)
  if (spec.customBackdropDataUrl) {
    try {
      const bgImg = await loadImage(spec.customBackdropDataUrl);
      const scale = Math.max(W / bgImg.width, H / bgImg.height);
      const drawW = bgImg.width * scale;
      const drawH = bgImg.height * scale;
      ctx.drawImage(bgImg, (W - drawW) / 2, (H - drawH) / 2, drawW, drawH);
      // Editorial contrast scrim
      const scrim = ctx.createLinearGradient(0, 0, 0, H);
      scrim.addColorStop(0, 'rgba(9, 11, 16, 0.72)');
      scrim.addColorStop(0.45, 'rgba(9, 11, 16, 0.36)');
      scrim.addColorStop(1, 'rgba(9, 11, 16, 0.80)');
      ctx.fillStyle = scrim;
      ctx.fillRect(0, 0, W, H);
    } catch {
      ctx.fillStyle = theme.outerBg;
      ctx.fillRect(0, 0, W, H);
    }
  } else if (theme.outerGradient) {
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, theme.outerGradient[0]);
    grad.addColorStop(0.52, theme.outerGradient[1]);
    grad.addColorStop(1, theme.outerGradient[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = theme.outerBg;
    ctx.fillRect(0, 0, W, H);
  }

  const lightBackdrop = !spec.customBackdropDataUrl && spec.themeId === 'ivory';
  const topInk = lightBackdrop ? '#141923' : '#FFFFFF';
  const topSubInk = lightBackdrop ? '#475569' : 'rgba(255,255,255,0.82)';

  // 2. Top Brand Header + Whisk Logo
  try {
    const logoImg = await loadImage('/whisk-logo.svg');
    ctx.drawImage(logoImg, 78, 76, 72, 72);
  } catch {
    // Graceful fallback if SVG load fails
  }

  ctx.fillStyle = topInk;
  ctx.font = '900 38px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('Whisk', 168, 116);
  ctx.fillStyle = topSubInk;
  ctx.font = '700 22px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('@whisk.travel  ·  whisk.travel', 168, 146);

  // 3. Viral Hook Banner
  ctx.fillStyle = topInk;
  ctx.font = '900 54px "Plus Jakarta Sans", system-ui, sans-serif';
  const hookLines = wrapText(ctx, spec.viralHook, W - 156, 2);
  let hookY = 236;
  for (const line of hookLines) {
    ctx.fillText(line, 78, hookY);
    hookY += 64;
  }

  // 4. Centerpiece Whisk Boarding Pass Card
  const cardX = 78;
  const cardY = hookY + 24;
  const cardW = W - 156;
  const cardH = H - cardY - 146;

  const ticketCanvas = drawBoardingPassTextureCanvas(spec);

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.34)';
  ctx.shadowBlur = 72;
  ctx.shadowOffsetY = 28;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 44);
  ctx.fillStyle = theme.cardBg;
  ctx.fill();
  ctx.restore();

  ctx.save();
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 44);
  ctx.clip();
  ctx.drawImage(ticketCanvas, cardX, cardY, cardW, cardH);
  ctx.restore();

  // Ticket outline & side perforation notches
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 44);
  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 2;
  ctx.stroke();

  const notchY = cardY + cardH * (1 - 230 / 1536);
  ctx.fillStyle = spec.customBackdropDataUrl ? '#0B0E15' : theme.notchBg;
  ctx.beginPath();
  ctx.arc(cardX, notchY, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cardX + cardW, notchY, 24, 0, Math.PI * 2);
  ctx.fill();

  // 5. Bottom CTA Strip
  ctx.textAlign = 'center';
  ctx.fillStyle = topInk;
  ctx.font = '800 28px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('Build your free walkable itinerary at whisk.travel', W / 2, H - 68);
  ctx.textAlign = 'left';

  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Exports the Whisk brand logo in vector SVG or high-resolution PNG formats for social media profiles and video overlays.
 */
export async function exportWhiskLogoAsset(
  variant: 'svg' | 'png-transparent' | 'png-avatar-light' | 'png-avatar-dark' | 'png-wordmark-light' | 'png-wordmark-dark'
): Promise<void> {
  if (variant === 'svg') {
    const res = await fetch('/whisk-logo.svg');
    const svgText = await res.text();
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whisk-logo-vector.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  const logoImg = await loadImage('/whisk-logo.svg');
  const canvas = document.createElement('canvas');

  if (variant === 'png-wordmark-light' || variant === 'png-wordmark-dark') {
    canvas.width = 1600;
    canvas.height = 520;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (variant === 'png-wordmark-dark') {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(logoImg, 88, 80, 360, 360);
    ctx.fillStyle = variant === 'png-wordmark-dark' ? '#FFFFFF' : '#0F172A';
    ctx.font = '900 184px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('Whisk', 496, 294);
    ctx.fillStyle = variant === 'png-wordmark-dark' ? '#94A3B8' : '#475569';
    ctx.font = '700 54px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('whisk.travel  ·  @whisk.travel', 504, 384);
  } else {
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (variant === 'png-avatar-light') {
      ctx.fillStyle = '#FCF9F4';
      ctx.fillRect(0, 0, 1024, 1024);
      ctx.drawImage(logoImg, 112, 112, 800, 800);
    } else if (variant === 'png-avatar-dark') {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, 1024, 1024);
      ctx.drawImage(logoImg, 112, 112, 800, 800);
    } else {
      ctx.drawImage(logoImg, 0, 0, 1024, 1024);
    }
  }

  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `whisk-${variant}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
