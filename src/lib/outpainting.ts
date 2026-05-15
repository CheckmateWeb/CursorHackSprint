import type { SceneAnalysis } from './types';
import type { ExpansionTextures } from './types';
import {
  canUseAI,
  expandDirectionAI,
  expansionMode,
  type ExpansionProgress,
} from './aiOutpaint';

export type { ExpansionProgress };

export async function synthesizeExpansion(
  imageUrl: string,
  analysis: SceneAnalysis,
  onProgress?: (p: ExpansionProgress) => void,
): Promise<ExpansionTextures & { mode: 'ai' | 'local' }> {
  const img = await loadImage(imageUrl);
  const maxW = 1600;
  const scale = Math.min(1, maxW / Math.max(img.width, img.height));
  const cw = Math.floor(img.width * scale);
  const ch = Math.floor(img.height * scale);

  const core = document.createElement('canvas');
  core.width = cw;
  core.height = ch;
  const ctx = core.getContext('2d')!;
  ctx.drawImage(img, 0, 0, cw, ch);

  onProgress?.({ stage: 'Preparing canvas…', percent: 10 });

  let wideCanvas = core;
  let mode: 'ai' | 'local' = expansionMode();

  if (canUseAI()) {
    onProgress?.({ stage: 'AI extending left (matching brushstrokes)…', percent: 25 });
    const leftExpanded = await expandDirectionAI(core, 'left', analysis, (s) =>
      onProgress?.({ stage: s, percent: 35 }),
    );
    if (leftExpanded) {
      wideCanvas = leftExpanded;
      onProgress?.({ stage: 'AI extending right…', percent: 55 });
      const rightExpanded = await expandDirectionAI(wideCanvas, 'right', analysis, (s) =>
        onProgress?.({ stage: s, percent: 70 }),
      );
      if (rightExpanded) wideCanvas = rightExpanded;
    } else {
      mode = 'local';
      wideCanvas = createWideCanvasWithPatches(core, analysis);
    }
  } else {
    onProgress?.({ stage: 'Synthesizing texture patches (add API key for AI)…', percent: 30 });
    wideCanvas = createWideCanvasWithPatches(core, analysis);
  }

  onProgress?.({ stage: 'Building 360° environment…', percent: 85 });

  const equirect = buildEquirectangularFromWide(wideCanvas, analysis);
  const panorama = buildPanoramaFromWide(wideCanvas, ch, analysis);
  const back = buildBackFace(ctx, cw, ch, analysis);
  const leftStrip = buildSideStrip(ctx, cw, ch, 'left', analysis);
  const rightStrip = buildSideStrip(ctx, cw, ch, 'right', analysis);

  onProgress?.({ stage: 'Ready', percent: 100 });

  return {
    mode,
    equirectUrl: equirect.toDataURL('image/jpeg', 0.95),
    panoramaUrl: panorama.toDataURL('image/jpeg', 0.92),
    backUrl: back.toDataURL('image/jpeg', 0.88),
    leftStripUrl: leftStrip.toDataURL('image/jpeg', 0.85),
    rightStripUrl: rightStrip.toDataURL('image/jpeg', 0.85),
  };
}

/** Patch-based texture synthesis from painting edges (no API) */
function createWideCanvasWithPatches(source: HTMLCanvasElement, analysis: SceneAnalysis): HTMLCanvasElement {
  const sw = source.width;
  const sh = source.height;
  const ext = Math.floor(sw * 0.72);
  const canvas = document.createElement('canvas');
  canvas.width = sw + ext * 2;
  canvas.height = sh;
  const ctx = canvas.getContext('2d')!;

  const sky = ctx.createLinearGradient(0, 0, 0, sh);
  sky.addColorStop(0, analysis.palette.sky);
  sky.addColorStop(1, analysis.palette.ground);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, sh);

  patchFill(ctx, source, 0, 0, ext, sh, { x: 0, y: 0, w: Math.floor(sw * 0.3), h: sh });
  ctx.drawImage(source, ext, 0);
  patchFill(ctx, source, ext + sw, 0, ext, sh, {
    x: Math.floor(sw * 0.7),
    y: 0,
    w: Math.floor(sw * 0.3),
    h: sh,
  });

  softenExtensionBands(ctx, ext, ext + sw, canvas.width, sh);
  addSwirlStrokes(ctx, canvas.width, sh, analysis.palette.accent, analysis.warmth * 0.65);
  if (analysis.medium === 'watercolor') addWatercolorBleed(ctx, canvas.width, sh, analysis.palette.accent);

  return canvas;
}

/** Blur extension zones so patches blend smoothly (no blocky pixels) */
function softenExtensionBands(
  ctx: CanvasRenderingContext2D,
  leftWidth: number,
  rightStart: number,
  w: number,
  h: number,
): void {
  const full = document.createElement('canvas');
  full.width = w;
  full.height = h;
  full.getContext('2d')!.drawImage(ctx.canvas, 0, 0);

  const blendBand = (x: number, bw: number) => {
    if (bw <= 0) return;
    const slice = document.createElement('canvas');
    slice.width = bw;
    slice.height = h;
    const s = slice.getContext('2d')!;
    s.drawImage(full, x, 0, bw, h, 0, 0, bw, h);
    const blurred = document.createElement('canvas');
    blurred.width = bw;
    blurred.height = h;
    const bl = blurred.getContext('2d')!;
    bl.filter = 'blur(12px) saturate(1.08)';
    bl.drawImage(slice, 0, 0);
    bl.filter = 'none';
    ctx.drawImage(blurred, x, 0, bw, h);
  };

  blendBand(0, leftWidth);
  blendBand(rightStart, w - rightStart);
}

function patchFill(
  dest: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  sample: { x: number; y: number; w: number; h: number },
): void {
  const patch = 14;
  const step = 10;
  for (let y = 0; y < dh; y += step) {
    for (let x = 0; x < dw; x += step) {
      const sx = sample.x + Math.floor(Math.random() * Math.max(1, sample.w - patch));
      const sy = sample.y + Math.floor(Math.random() * Math.max(1, sample.h - patch));
      const pw = patch + Math.floor(Math.random() * 6);
      const ph = patch + Math.floor(Math.random() * 6);
      const fade = 1 - x / dw;
      dest.globalAlpha = (0.12 + Math.random() * 0.18) * (0.5 + fade * 0.5);
      dest.drawImage(source, sx, sy, pw, ph, dx + x, dy + y, pw + 4, ph + 4);
    }
  }
  dest.globalAlpha = 1;
}

function buildEquirectangularFromWide(
  wide: HTMLCanvasElement,
  analysis: SceneAnalysis,
): HTMLCanvasElement {
  const W = 2048;
  const H = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.42);
  sky.addColorStop(0, analysis.palette.sky);
  sky.addColorStop(1, 'transparent');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H * 0.42);

  const ground = ctx.createLinearGradient(0, H * 0.58, 0, H);
  ground.addColorStop(0, 'transparent');
  ground.addColorStop(1, analysis.palette.ground);
  ctx.fillStyle = ground;
  ctx.fillRect(0, H * 0.58, W, H * 0.42);

  const bandY = H * 0.08;
  const bandH = H * 0.84;
  ctx.drawImage(wide, 0, bandY, W, bandH);

  addSwirlStrokes(ctx, W, H, analysis.palette.accent, analysis.warmth);
  return canvas;
}

function smearExtend(
  dest: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  x: number,
  width: number,
  y: number,
  height: number,
  side: 'left' | 'right',
  analysis: SceneAnalysis,
): void {
  const edgeW = Math.min(48, source.width);
  const strip = document.createElement('canvas');
  strip.width = edgeW;
  strip.height = source.height;
  const sctx = strip.getContext('2d')!;
  const sx = side === 'left' ? 0 : source.width - edgeW;
  sctx.drawImage(source, sx, 0, edgeW, source.height, 0, 0, edgeW, source.height);

  dest.save();
  dest.beginPath();
  dest.rect(x, y, width, height);
  dest.clip();

  const layers = 6;
  for (let i = 0; i < layers; i++) {
    const t = i / layers;
    dest.globalAlpha = 0.12 + t * 0.2;
    dest.filter = `blur(${4 + i * 5}px) saturate(${1.1 + analysis.saturation * 0.2})`;
    if (side === 'left') {
      dest.translate(x + width, y);
      dest.scale(-width / edgeW, height / source.height);
    } else {
      dest.translate(x, y);
      dest.scale(width / edgeW, height / source.height);
    }
    dest.drawImage(strip, 0, 0, edgeW, source.height);
    dest.setTransform(1, 0, 0, 1, 0, 0);
  }
  dest.restore();
  dest.filter = 'none';
  dest.globalAlpha = 1;
}

function buildPanoramaFromWide(
  wide: HTMLCanvasElement,
  ch: number,
  analysis: SceneAnalysis,
): HTMLCanvasElement {
  const panW = Math.max(wide.width * 2, 2400);
  const panH = ch;
  const canvas = document.createElement('canvas');
  canvas.width = panW;
  canvas.height = panH;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, panH);
  grad.addColorStop(0, analysis.palette.sky);
  grad.addColorStop(0.55, analysis.palette.secondary);
  grad.addColorStop(1, analysis.palette.ground);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, panW, panH);

  const ox = (panW - wide.width) / 2;
  ctx.drawImage(wide, ox, 0, wide.width, panH);
  addSwirlStrokes(ctx, panW, panH, analysis.palette.accent, analysis.warmth);

  return canvas;
}

function buildBackFace(
  sourceCtx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  analysis: SceneAnalysis,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d')!;
  ctx.filter = 'blur(22px) brightness(0.65) saturate(1.3)';
  ctx.drawImage(sourceCtx.canvas, 0, 0, cw, ch);
  ctx.filter = 'none';
  ctx.globalAlpha = 0.5;
  ctx.scale(-1, 1);
  ctx.drawImage(sourceCtx.canvas, -cw, 0, cw, ch);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  addSwirlStrokes(ctx, cw, ch, analysis.palette.accent, analysis.warmth);
  return canvas;
}

function buildSideStrip(
  sourceCtx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  side: 'left' | 'right',
  analysis: SceneAnalysis,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d')!;
  smearExtend(ctx, sourceCtx.canvas, 0, cw, 0, ch, side, analysis);
  return canvas;
}

function addSwirlStrokes(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  intensity: number,
): void {
  ctx.strokeStyle = color;
  for (let i = 0; i < 36; i++) {
    ctx.globalAlpha = 0.06 * intensity + Math.random() * 0.04;
    ctx.lineWidth = 6 + Math.random() * 28;
    ctx.beginPath();
    const cx = Math.random() * w;
    const cy = Math.random() * h;
    ctx.moveTo(cx, cy);
    ctx.bezierCurveTo(
      cx + (Math.random() - 0.5) * w * 0.2,
      cy + (Math.random() - 0.5) * h * 0.15,
      cx + (Math.random() - 0.5) * w * 0.25,
      cy + (Math.random() - 0.5) * h * 0.2,
      cx + (Math.random() - 0.5) * w * 0.3,
      cy + (Math.random() - 0.5) * h * 0.25,
    );
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function addWatercolorBleed(ctx: CanvasRenderingContext2D, w: number, h: number, color: string): void {
  for (let i = 0; i < 50; i++) {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.02 + Math.random() * 0.05;
    ctx.beginPath();
    ctx.ellipse(
      Math.random() * w,
      Math.random() * h,
      40 + Math.random() * 100,
      25 + Math.random() * 70,
      Math.random() * Math.PI,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
