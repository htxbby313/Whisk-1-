import { MarketingVideoAspect } from '../services/marketingService';
import {
  drawBoardingPassTextureCanvas,
  MarketingBoardingPassSpec,
} from './BoardingPassSocialProofCanvas';

export interface LuxuryReelCompositeOptions {
  footageUrl: string;
  boardingPassDataUrl: string;
  aspectRatio: MarketingVideoAspect;
  destinationLabel: string;
  spotTitle: string;
  spotSubtitle?: string;
  showEditorialCaption?: boolean;
  outroDurationSec?: number;
  crossfadeDurationSec?: number;
  onProgress?: (label: string) => void;
}

export interface SoundscapeBoardingPassOptions {
  ambientVideoUrl: string;
  spec: MarketingBoardingPassSpec;
  aspectRatio: MarketingVideoAspect;
  soundscapeLabel?: string;
  onProgress?: (label: string) => void;
}

export interface PolaroidSlideInput {
  url: string;
  title: string;
  subtitle: string;
}

export interface AnimatedPolaroidReelOptions {
  polaroids: PolaroidSlideInput[];
  boardingPassDataUrl: string;
  aspectRatio: MarketingVideoAspect;
  destinationLabel: string;
  hookHeadline?: string;
  audioBedVideoUrl?: string | null;
  backdropStyle?: 'espresso' | 'linen';
  onProgress?: (label: string) => void;
}

export interface LuxuryReelCompositeResult {
  videoBlobUrl: string;
  mimeType: string;
  fileExtension: 'mp4' | 'webm';
  totalDurationSec: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image asset for Reel compositing.`));
    img.src = src;
  });
}

function loadVideo(src: string, muted = false): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = muted;
    video.playsInline = true;
    video.preload = 'auto';
    const onReady = () => {
      cleanup();
      resolve(video);
    };
    const onErr = () => {
      cleanup();
      reject(new Error('Could not decode video asset for studio finishing.'));
    };
    const cleanup = () => {
      video.removeEventListener('loadeddata', onReady);
      video.removeEventListener('error', onErr);
    };
    video.addEventListener('loadeddata', onReady);
    video.addEventListener('error', onErr);
    video.src = src;
    video.load();
  });
}

interface AudioCaptureRig {
  audioCtx: AudioContext | null;
  gainNode: GainNode | null;
  audioTracks: MediaStreamTrack[];
  cleanup: () => void;
}

async function attachVideoAudioCapture(
  video: HTMLVideoElement,
  totalDurationSec: number
): Promise<AudioCaptureRig> {
  try {
    const AudioCtxCtor =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxCtor) {
      video.muted = true;
      return { audioCtx: null, gainNode: null, audioTracks: [], cleanup: () => {} };
    }

    const audioCtx = new AudioCtxCtor();
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    // Keep video unmuted so MediaElementAudioSourceNode receives real stereo audio,
    // routing ONLY into MediaStreamAudioDestinationNode (silent during render, crisp in recording)
    video.muted = false;
    video.volume = 1.0;

    const source = audioCtx.createMediaElementSource(video);
    const gainNode = audioCtx.createGain();
    const dest = audioCtx.createMediaStreamDestination();

    const now = audioCtx.currentTime;
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(1.0, now + 0.45);
    if (totalDurationSec > 1.5) {
      gainNode.gain.setValueAtTime(1.0, now + Math.max(0.6, totalDurationSec - 0.65));
      gainNode.gain.linearRampToValueAtTime(0.001, now + totalDurationSec);
    }

    source.connect(gainNode);
    gainNode.connect(dest);

    return {
      audioCtx,
      gainNode,
      audioTracks: dest.stream.getAudioTracks(),
      cleanup: () => {
        try {
          source.disconnect();
          gainNode.disconnect();
          audioCtx.close().catch(() => {});
        } catch {
          // Ignore close errors
        }
      },
    };
  } catch {
    video.muted = true;
    return { audioCtx: null, gainNode: null, audioTracks: [], cleanup: () => {} };
  }
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

function drawCover(
  ctx: CanvasRenderingContext2D,
  source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  scale = 1,
  offsetX = 0,
  offsetY = 0
) {
  if (!srcW || !srcH) return;
  const coverScale = Math.max(dstW / srcW, dstH / srcH) * scale;
  const drawW = srcW * coverScale;
  const drawH = srcH * coverScale;
  const dx = (dstW - drawW) / 2 + offsetX;
  const dy = (dstH - drawH) / 2 + offsetY;
  ctx.drawImage(source, dx, dy, drawW, drawH);
}

function drawContainFramedPass(
  ctx: CanvasRenderingContext2D,
  passImg: HTMLImageElement,
  dstW: number,
  dstH: number,
  settleProgress: number
) {
  const easeOut = 1 - Math.pow(1 - Math.min(Math.max(settleProgress, 0), 1), 3);
  const scale = 1.032 - 0.032 * easeOut;

  if (dstH >= dstW) {
    drawCover(ctx, passImg, passImg.naturalWidth, passImg.naturalHeight, dstW, dstH, scale);
  } else {
    const bgGrad = ctx.createLinearGradient(0, 0, dstW, dstH);
    bgGrad.addColorStop(0, '#0F1B2E');
    bgGrad.addColorStop(1, '#192942');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, dstW, dstH);

    const cardH = dstH * 0.88 * scale;
    const cardW = cardH * (passImg.naturalWidth / Math.max(passImg.naturalHeight, 1));
    const x = (dstW - cardW) / 2;
    const y = (dstH - cardH) / 2;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 42;
    ctx.shadowOffsetY = 18;
    ctx.drawImage(passImg, x, y, cardW, cardH);
    ctx.restore();
  }

  const sheenPos = -0.35 + settleProgress * 1.7;
  const sheenGrad = ctx.createLinearGradient(
    dstW * (sheenPos - 0.28),
    0,
    dstW * (sheenPos + 0.28),
    dstH * 0.55
  );
  sheenGrad.addColorStop(0, 'rgba(255, 245, 224, 0)');
  sheenGrad.addColorStop(0.5, 'rgba(255, 245, 224, 0.09)');
  sheenGrad.addColorStop(1, 'rgba(255, 245, 224, 0)');
  ctx.fillStyle = sheenGrad;
  ctx.fillRect(0, 0, dstW, dstH);
}

function drawEditorialLowerThird(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  destinationLabel: string,
  spotTitle: string,
  spotSubtitle: string | undefined,
  alpha: number
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;

  const scrim = ctx.createLinearGradient(0, h * 0.68, 0, h);
  scrim.addColorStop(0, 'rgba(12, 16, 24, 0)');
  scrim.addColorStop(1, 'rgba(12, 16, 24, 0.56)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, h * 0.68, w, h * 0.32);

  const padX = Math.round(w * 0.075);
  const baseY = Math.round(h * 0.855);

  ctx.fillStyle = 'rgba(241, 210, 148, 0.88)';
  ctx.fillRect(padX, baseY - 62, 34, 2);

  ctx.font = `600 ${Math.round(w * 0.022)}px "Plus Jakarta Sans", -apple-system, sans-serif`;
  ctx.fillStyle = 'rgba(255, 248, 236, 0.86)';
  ctx.fillText(`${destinationLabel.toUpperCase()}  ·  WHISK.TRAVEL`, padX, baseY - 32);

  ctx.font = `600 ${Math.round(w * 0.044)}px "Playfair Display", Georgia, serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(spotTitle.slice(0, 38), padX, baseY + 14);

  if (spotSubtitle) {
    ctx.font = `500 ${Math.round(w * 0.023)}px "Plus Jakarta Sans", -apple-system, sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.fillText(spotSubtitle.slice(0, 56), padX, baseY + 48);
  }

  ctx.restore();
}

function pickBestRecorderMime(withAudio: boolean): { mimeType: string; ext: 'mp4' | 'webm' } {
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('This browser does not support video compositing (MediaRecorder unavailable).');
  }
  const candidates: Array<{ mimeType: string; ext: 'mp4' | 'webm' }> = withAudio
    ? [
        { mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4' },
        { mimeType: 'video/mp4', ext: 'mp4' },
        { mimeType: 'video/webm;codecs=vp9,opus', ext: 'webm' },
        { mimeType: 'video/webm;codecs=vp8,opus', ext: 'webm' },
        { mimeType: 'video/webm', ext: 'webm' },
      ]
    : [
        { mimeType: 'video/mp4;codecs=avc1.42E01E', ext: 'mp4' },
        { mimeType: 'video/mp4', ext: 'mp4' },
        { mimeType: 'video/webm;codecs=vp9', ext: 'webm' },
        { mimeType: 'video/webm;codecs=vp8', ext: 'webm' },
        { mimeType: 'video/webm', ext: 'webm' },
      ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c.mimeType)) return c;
  }
  return { mimeType: 'video/webm', ext: 'webm' };
}

/**
 * 1. Composites clean luxury AI destination footage (preserving its authentic stereo audio!)
 *    with a subtle editorial location plate and a silky cross-dissolve into the exact Whisk Boarding Pass end-card.
 */
export async function compositeLuxuryBoardingPassReel(
  options: LuxuryReelCompositeOptions
): Promise<LuxuryReelCompositeResult> {
  const {
    footageUrl,
    boardingPassDataUrl,
    aspectRatio,
    destinationLabel,
    spotTitle,
    spotSubtitle,
    showEditorialCaption = true,
    outroDurationSec = 3.6,
    crossfadeDurationSec = 0.85,
    onProgress,
  } = options;

  onProgress?.('Preparing studio finisher & Boarding Pass end-card...');
  const [video, passImg] = await Promise.all([
    loadVideo(footageUrl, false),
    loadImage(boardingPassDataUrl),
  ]);

  const width = aspectRatio === '9:16' ? 720 : 1280;
  const height = aspectRatio === '9:16' ? 1280 : 720;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable for Reel compositing.');

  const footageDur =
    Number.isFinite(video.duration) && video.duration > 1.2 ? video.duration : 6.0;
  const safeFade = Math.min(crossfadeDurationSec, Math.max(0.4, footageDur * 0.25));
  const totalDurationSec = footageDur + outroDurationSec - safeFade;

  // Keep footage looping softly for audio tail if outro extends past footage end
  video.loop = true;

  const audioRig = await attachVideoAudioCapture(video, totalDurationSec);
  const canvasStream = canvas.captureStream(30);
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioRig.audioTracks,
  ]);

  const { mimeType, ext } = pickBestRecorderMime(audioRig.audioTracks.length > 0);
  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 6_500_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const recordingFinished = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    recorder.onerror = () => reject(new Error('Failed while finalizing luxury Reel video.'));
  });

  onProgress?.('Compositing cinema footage + sound → crisp Whisk Boarding Pass finale...');
  video.currentTime = 0;
  recorder.start(200);
  await video.play().catch(() => {});

  const startMs = performance.now();
  const totalMs = totalDurationSec * 1000;
  const fadeStartSec = Math.max(0.5, footageDur - safeFade);

  const vignetteGrad = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.36,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.72
  );
  vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
  vignetteGrad.addColorStop(1, 'rgba(10, 14, 22, 0.24)');

  await new Promise<void>((resolve) => {
    const drawFrame = (now: number) => {
      const elapsedSec = (now - startMs) / 1000;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#0D131F';
      ctx.fillRect(0, 0, width, height);

      if (elapsedSec < footageDur) {
        drawCover(
          ctx,
          video,
          video.videoWidth || width,
          video.videoHeight || height,
          width,
          height,
          1.0
        );
        ctx.fillStyle = vignetteGrad;
        ctx.fillRect(0, 0, width, height);

        if (showEditorialCaption) {
          const fadeIn = Math.min(1, Math.max(0, (elapsedSec - 0.55) / 0.65));
          const fadeOut = Math.min(1, Math.max(0, (fadeStartSec - 0.15 - elapsedSec) / 0.55));
          drawEditorialLowerThird(
            ctx,
            width,
            height,
            destinationLabel,
            spotTitle,
            spotSubtitle,
            Math.min(fadeIn, fadeOut)
          );
        }
      }

      if (elapsedSec >= fadeStartSec) {
        const dissolveT = Math.min(1, (elapsedSec - fadeStartSec) / safeFade);
        const smoothDissolve = dissolveT * dissolveT * (3 - 2 * dissolveT);
        const outroProgress = Math.min(1, (elapsedSec - fadeStartSec) / outroDurationSec);

        ctx.save();
        ctx.globalAlpha = smoothDissolve;
        drawContainFramedPass(ctx, passImg, width, height, outroProgress);
        ctx.restore();
      }

      if (elapsedSec * 1000 < totalMs) {
        requestAnimationFrame(drawFrame);
      } else {
        video.pause();
        recorder.stop();
        resolve();
      }
    };
    requestAnimationFrame(drawFrame);
  });

  const blob = await recordingFinished;
  combinedStream.getTracks().forEach((t) => t.stop());
  audioRig.cleanup();

  return {
    videoBlobUrl: URL.createObjectURL(blob),
    mimeType,
    fileExtension: ext,
    totalDurationSec: Math.round(totalDurationSec * 10) / 10,
  };
}

/**
 * 2. Pure Boarding Pass + Live Trip Soundscape & Bokeh Lights Reel:
 *    Floats the razor-sharp standalone Whisk Boarding Pass card over softly blurred
 *    live city/market lights while real horns, market chatter & café sounds play in stereo.
 */
export async function compositeSoundscapeBoardingPassReel(
  options: SoundscapeBoardingPassOptions
): Promise<LuxuryReelCompositeResult> {
  const { ambientVideoUrl, spec, aspectRatio, soundscapeLabel, onProgress } = options;

  onProgress?.('Loading live trip soundscape & rendering crisp Boarding Pass card...');
  const video = await loadVideo(ambientVideoUrl, false);
  const passCanvas = drawBoardingPassTextureCanvas(spec);

  const width = aspectRatio === '9:16' ? 720 : 1280;
  const height = aspectRatio === '9:16' ? 1280 : 720;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable.');

  const totalDurationSec =
    Number.isFinite(video.duration) && video.duration > 2 ? Math.min(video.duration, 12) : 8.0;

  const audioRig = await attachVideoAudioCapture(video, totalDurationSec);
  const canvasStream = canvas.captureStream(30);
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioRig.audioTracks,
  ]);

  const { mimeType, ext } = pickBestRecorderMime(audioRig.audioTracks.length > 0);
  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 6_500_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const recordingFinished = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    recorder.onerror = () => reject(new Error('Failed to render Soundscape Boarding Pass Reel.'));
  });

  onProgress?.('Compositing floating Boarding Pass + bokeh lights + live trip audio...');
  video.currentTime = 0;
  recorder.start(200);
  await video.play().catch(() => {});

  const startMs = performance.now();
  const totalMs = totalDurationSec * 1000;

  // Card dimensions centered cleanly with breathing margin
  const isVertical = height > width;
  const cardW = isVertical ? Math.round(width * 0.78) : Math.round(height * 0.56);
  const cardH = Math.round(cardW * (passCanvas.height / passCanvas.width));
  const cardRadius = Math.round(cardW * 0.055);

  await new Promise<void>((resolve) => {
    const drawFrame = (now: number) => {
      const elapsedSec = (now - startMs) / 1000;
      const progress = Math.min(1, elapsedSec / totalDurationSec);

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#0A0D14';
      ctx.fillRect(0, 0, width, height);

      // Softly blurred living city & market lights background
      ctx.save();
      ctx.filter = 'blur(20px) brightness(0.66) saturate(1.18)';
      drawCover(
        ctx,
        video,
        video.videoWidth || width,
        video.videoHeight || height,
        width,
        height,
        1.14
      );
      ctx.restore();

      // Subtle atmospheric dark vignette so the Boarding Pass pops like an Apple/Aman campaign
      const vig = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.25,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.72
      );
      vig.addColorStop(0, 'rgba(10, 14, 22, 0.06)');
      vig.addColorStop(1, 'rgba(7, 10, 18, 0.58)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);

      // Subtle whisper top brand mark
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = `600 ${Math.round(width * 0.022)}px "Plus Jakarta Sans", -apple-system, sans-serif`;
      ctx.fillStyle = 'rgba(255, 248, 236, 0.82)';
      ctx.fillText(
        `SOUNDS OF ${(spec.destLabel || 'YOUR TRIP').toUpperCase()}  ·  WHISK.TRAVEL`,
        width / 2,
        isVertical ? Math.round(height * 0.075) : Math.round(height * 0.065)
      );
      ctx.restore();

      // Floating razor-sharp Whisk Boarding Pass card with gentle levitation & subtle entrance
      const introEase = 1 - Math.pow(1 - Math.min(1, elapsedSec / 0.9), 3);
      const floatY = Math.sin(elapsedSec * 1.35) * 6;
      const cardX = (width - cardW) / 2;
      const cardY = (height - cardH) / 2 + floatY + (1 - introEase) * 26 - (isVertical ? 8 : 0);

      ctx.save();
      ctx.globalAlpha = introEase;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.52)';
      ctx.shadowBlur = 46;
      ctx.shadowOffsetY = 22;

      drawRoundedRectPath(ctx, cardX, cardY, cardW, cardH, cardRadius);
      ctx.fillStyle = '#FCF9F4';
      ctx.fill();
      ctx.restore();

      // Clipped crisp Boarding Pass face + gentle diagonal warm sheen
      ctx.save();
      ctx.globalAlpha = introEase;
      drawRoundedRectPath(ctx, cardX, cardY, cardW, cardH, cardRadius);
      ctx.clip();
      ctx.drawImage(passCanvas, cardX, cardY, cardW, cardH);

      const sheenT = (progress * 1.65) % 1.65;
      const sheenX = cardX + cardW * (-0.4 + sheenT);
      const sheenGrad = ctx.createLinearGradient(
        sheenX - cardW * 0.24,
        cardY,
        sheenX + cardW * 0.24,
        cardY + cardH * 0.4
      );
      sheenGrad.addColorStop(0, 'rgba(255, 246, 226, 0)');
      sheenGrad.addColorStop(0.5, 'rgba(255, 246, 226, 0.14)');
      sheenGrad.addColorStop(1, 'rgba(255, 246, 226, 0)');
      ctx.fillStyle = sheenGrad;
      ctx.fillRect(cardX, cardY, cardW, cardH);
      ctx.restore();

      // Minimal bottom acoustic waveform pulse & destination audio cue
      const barCount = 15;
      const barSpacing = 7;
      const barsTotalW = (barCount - 1) * barSpacing;
      const barBaseY = isVertical ? Math.round(height * 0.915) : Math.round(height * 0.935);

      ctx.save();
      ctx.fillStyle = 'rgba(241, 210, 148, 0.84)';
      for (let i = 0; i < barCount; i++) {
        const distFromCenter = 1 - Math.abs(i - (barCount - 1) / 2) / ((barCount - 1) / 2);
        const wave =
          0.35 +
          0.65 * Math.abs(Math.sin(elapsedSec * (3.1 + (i % 3) * 0.7) + i * 0.85));
        const bh = Math.max(4, Math.round((6 + 18 * distFromCenter) * wave));
        const bx = width / 2 - barsTotalW / 2 + i * barSpacing;
        ctx.fillRect(bx - 1.5, barBaseY - bh / 2, 3, bh);
      }

      if (soundscapeLabel) {
        ctx.textAlign = 'center';
        ctx.font = `500 ${Math.round(width * 0.02)}px "Plus Jakarta Sans", -apple-system, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
        ctx.fillText(soundscapeLabel.slice(0, 62), width / 2, barBaseY + 32);
      }
      ctx.restore();

      if (elapsedSec * 1000 < totalMs) {
        requestAnimationFrame(drawFrame);
      } else {
        video.pause();
        recorder.stop();
        resolve();
      }
    };
    requestAnimationFrame(drawFrame);
  });

  const blob = await recordingFinished;
  combinedStream.getTracks().forEach((t) => t.stop());
  audioRig.cleanup();

  return {
    videoBlobUrl: URL.createObjectURL(blob),
    mimeType,
    fileExtension: ext,
    totalDurationSec: Math.round(totalDurationSec * 10) / 10,
  };
}

/**
 * 3. Instant Animated Polaroid Stack → Crisp Whisk Boarding Pass Reel:
 *    Animates 3–5 authentic Whisk Polaroid prints gliding gently onto a luxury backdrop
 *    with slow Ken Burns photo drift, serif handwritten captions, optional real audio bed,
 *    and a smooth cross-dissolve into the razor-sharp Whisk Boarding Pass.
 */
export async function renderAnimatedPolaroidReel(
  options: AnimatedPolaroidReelOptions
): Promise<LuxuryReelCompositeResult> {
  const {
    polaroids,
    boardingPassDataUrl,
    aspectRatio,
    destinationLabel,
    hookHeadline,
    audioBedVideoUrl,
    backdropStyle = 'espresso',
    onProgress,
  } = options;

  if (!polaroids.length) {
    throw new Error('Select at least one Polaroid image to animate.');
  }

  onProgress?.('Loading Whisk Polaroid prints & Boarding Pass...');
  const [loadedPolaroids, passImg, audioVideo] = await Promise.all([
    Promise.all(polaroids.slice(0, 5).map((p) => loadImage(p.url))),
    loadImage(boardingPassDataUrl),
    audioBedVideoUrl ? loadVideo(audioBedVideoUrl, false).catch(() => null) : Promise.resolve(null),
  ]);

  const width = aspectRatio === '9:16' ? 720 : 1280;
  const height = aspectRatio === '9:16' ? 1280 : 720;
  const isVertical = height > width;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable.');

  const secPerPolaroid = 2.1;
  const polaroidPhaseSec = loadedPolaroids.length * secPerPolaroid + 0.55;
  const crossfadeSec = 0.85;
  const outroSec = 3.4;
  const totalDurationSec = polaroidPhaseSec + outroSec - crossfadeSec;

  let audioRig: AudioCaptureRig = {
    audioCtx: null,
    gainNode: null,
    audioTracks: [],
    cleanup: () => {},
  };
  if (audioVideo) {
    audioVideo.loop = true;
    audioRig = await attachVideoAudioCapture(audioVideo, totalDurationSec);
  }

  const canvasStream = canvas.captureStream(30);
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioRig.audioTracks,
  ]);

  const { mimeType, ext } = pickBestRecorderMime(audioRig.audioTracks.length > 0);
  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 6_500_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const recordingFinished = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    recorder.onerror = () => reject(new Error('Failed to render Animated Polaroid Reel.'));
  });

  onProgress?.('Animating Polaroid stack → Whisk Boarding Pass...');
  if (audioVideo) {
    audioVideo.currentTime = 0;
    await audioVideo.play().catch(() => {});
  }
  recorder.start(200);

  const startMs = performance.now();
  const totalMs = totalDurationSec * 1000;
  const fadeStartSec = polaroidPhaseSec - crossfadeSec;

  // Choreographed poses for each landing Polaroid card
  const poses = [
    { angle: -0.075, dx: -18, dy: -20 },
    { angle: 0.062, dx: 22, dy: 12 },
    { angle: -0.042, dx: -12, dy: 28 },
    { angle: 0.052, dx: 16, dy: -8 },
    { angle: -0.025, dx: 0, dy: 6 },
  ];

  const cardW = isVertical ? Math.round(width * 0.72) : Math.round(height * 0.56);
  const framePad = Math.round(cardW * 0.062);
  const photoW = cardW - framePad * 2;
  const photoH = Math.round(photoW * 1.02);
  const chinH = Math.round(cardW * 0.23);
  const cardH = framePad + photoH + chinH;

  await new Promise<void>((resolve) => {
    const drawFrame = (now: number) => {
      const elapsedSec = (now - startMs) / 1000;
      const progress = Math.min(1, elapsedSec / totalDurationSec);

      ctx.clearRect(0, 0, width, height);

      // Editorial desk backdrop
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      if (backdropStyle === 'linen') {
        bgGrad.addColorStop(0, '#EFE9DF');
        bgGrad.addColorStop(1, '#DDD2C1');
      } else {
        bgGrad.addColorStop(0, '#141720');
        bgGrad.addColorStop(1, '#231D1A');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Soft warm sunbeam glow drifting subtly across the desk
      const glowX = width * (0.25 + progress * 0.5);
      const glowY = height * 0.26;
      const sunGlow = ctx.createRadialGradient(glowX, glowY, 20, glowX, glowY, width * 0.72);
      sunGlow.addColorStop(
        0,
        backdropStyle === 'linen' ? 'rgba(255, 248, 232, 0.42)' : 'rgba(242, 198, 128, 0.14)'
      );
      sunGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sunGlow;
      ctx.fillRect(0, 0, width, height);

      // Subtle editorial top header
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = `600 ${Math.round(width * 0.022)}px "Plus Jakarta Sans", -apple-system, sans-serif`;
      ctx.fillStyle =
        backdropStyle === 'linen' ? 'rgba(20, 25, 35, 0.64)' : 'rgba(248, 240, 224, 0.76)';
      ctx.fillText(
        `WHISK.TRAVEL  ·  ${destinationLabel.toUpperCase()}`,
        width / 2,
        isVertical ? Math.round(height * 0.095) : Math.round(height * 0.085)
      );
      if (hookHeadline && isVertical) {
        ctx.font = `600 ${Math.round(width * 0.036)}px "Playfair Display", Georgia, serif`;
        ctx.fillStyle = backdropStyle === 'linen' ? '#141923' : '#FAF6EE';
        ctx.fillText(hookHeadline.slice(0, 38), width / 2, Math.round(height * 0.142));
      }
      ctx.restore();

      // Render each Polaroid print arriving gently onto the stack
      loadedPolaroids.forEach((img, idx) => {
        const appearAt = idx * secPerPolaroid;
        if (elapsedSec < appearAt) return;

        const localT = elapsedSec - appearAt;
        const enterEase = 1 - Math.pow(1 - Math.min(1, localT / 0.85), 3);
        const pose = poses[idx % poses.length];

        const startOffsetY = height * 0.24;
        const startAngle = pose.angle + (idx % 2 === 0 ? -0.14 : 0.14);
        const curAngle = startAngle + (pose.angle - startAngle) * enterEase;
        const curX = width / 2 + pose.dx * enterEase;
        const curY =
          height * (isVertical ? 0.53 : 0.54) +
          pose.dy * enterEase +
          startOffsetY * (1 - enterEase) +
          Math.sin(elapsedSec * 1.1 + idx) * 2.5;
        const cardScale = 1.08 - 0.08 * enterEase;

        ctx.save();
        ctx.globalAlpha = Math.min(1, localT / 0.35);
        ctx.translate(curX, curY);
        ctx.rotate(curAngle);
        ctx.scale(cardScale, cardScale);

        // Soft studio shadow + tactile warm cream Polaroid paper
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.36)';
        ctx.shadowBlur = 34;
        ctx.shadowOffsetY = 18;
        ctx.fillStyle = '#FCF9F3';
        drawRoundedRectPath(ctx, -cardW / 2, -cardH / 2, cardW, cardH, 6);
        ctx.fill();
        ctx.restore();

        // Subtle paper hairline border
        ctx.strokeStyle = 'rgba(20, 25, 35, 0.08)';
        ctx.lineWidth = 1.2;
        drawRoundedRectPath(ctx, -cardW / 2, -cardH / 2, cardW, cardH, 6);
        ctx.stroke();

        // Clipped Polaroid photo window with slow Ken Burns zoom
        const px = -cardW / 2 + framePad;
        const py = -cardH / 2 + framePad;
        ctx.save();
        ctx.beginPath();
        ctx.rect(px, py, photoW, photoH);
        ctx.clip();

        const kbScale = 1.0 + Math.min(1, localT / (secPerPolaroid * 2.2)) * 0.075;
        const drawScale = Math.max(photoW / img.naturalWidth, photoH / img.naturalHeight) * kbScale;
        const dw = img.naturalWidth * drawScale;
        const dh = img.naturalHeight * drawScale;
        ctx.drawImage(img, px + (photoW - dw) / 2, py + (photoH - dh) / 2, dw, dh);
        ctx.restore();

        // Polaroid chin editorial caption
        const slideMeta = polaroids[idx];
        ctx.textAlign = 'left';
        ctx.font = `600 ${Math.round(cardW * 0.048)}px "Playfair Display", Georgia, serif`;
        ctx.fillStyle = '#181E2B';
        ctx.fillText(
          (slideMeta?.title || destinationLabel).slice(0, 26),
          px + 4,
          py + photoH + Math.round(chinH * 0.48)
        );

        ctx.font = `500 ${Math.round(cardW * 0.03)}px "Plus Jakarta Sans", -apple-system, sans-serif`;
        ctx.fillStyle = '#6E695F';
        ctx.fillText(
          (slideMeta?.subtitle || 'whisk.travel').slice(0, 36),
          px + 4,
          py + photoH + Math.round(chinH * 0.78)
        );

        ctx.restore();
      });

      // Smooth cross-dissolve onto the exact razor-sharp Whisk Boarding Pass
      if (elapsedSec >= fadeStartSec) {
        const dissolveT = Math.min(1, (elapsedSec - fadeStartSec) / crossfadeSec);
        const smoothDissolve = dissolveT * dissolveT * (3 - 2 * dissolveT);
        const outroProgress = Math.min(1, (elapsedSec - fadeStartSec) / outroSec);

        ctx.save();
        ctx.globalAlpha = smoothDissolve;
        drawContainFramedPass(ctx, passImg, width, height, outroProgress);
        ctx.restore();
      }

      if (elapsedSec * 1000 < totalMs) {
        requestAnimationFrame(drawFrame);
      } else {
        if (audioVideo) audioVideo.pause();
        recorder.stop();
        resolve();
      }
    };
    requestAnimationFrame(drawFrame);
  });

  const blob = await recordingFinished;
  combinedStream.getTracks().forEach((t) => t.stop());
  audioRig.cleanup();

  return {
    videoBlobUrl: URL.createObjectURL(blob),
    mimeType,
    fileExtension: ext,
    totalDurationSec: Math.round(totalDurationSec * 10) / 10,
  };
}
