import type { SceneAnalysis } from './types';
import type { ExpansionTextures } from './types';

/**
 * Synthesizes extended imagery beyond the frame via edge sampling,
 * mirroring, and style-aware blur — simulates AI outpainting client-side.
 */
export async function synthesizeExpansion(
  imageUrl: string,
  analysis: SceneAnalysis,
): Promise<ExpansionTextures> {
  const img = await loadImage(imageUrl);
  const w = Math.min(1024, img.width);
  const h = Math.min(768, img.height);
  const scale = Math.min(w / img.width, h / img.height);
  const cw = Math.floor(img.width * scale);
  const ch = Math.floor(img.height * scale);

  const core = document.createElement('canvas');
  core.width = cw;
  core.height = ch;
  const ctx = core.getContext('2d')!;
  ctx.drawImage(img, 0, 0, cw, ch);

  const panorama = buildPanorama(ctx, cw, ch, analysis);
  const back = buildBackFace(ctx, cw, ch, analysis);
  const leftStrip = buildSideStrip(ctx, cw, ch, 'left', analysis);
  const rightStrip = buildSideStrip(ctx, cw, ch, 'right', analysis);

  return {
    panoramaUrl: panorama.toDataURL('image/jpeg', 0.92),
    backUrl: back.toDataURL('image/jpeg', 0.88),
    leftStripUrl: leftStrip.toDataURL('image/jpeg', 0.85),
    rightStripUrl: rightStrip.toDataURL('image/jpeg', 0.85),
  };
}

function buildPanorama(
  sourceCtx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  analysis: SceneAnalysis,
): HTMLCanvasElement {
  const panW = cw * 3;
  const panH = ch;
  const canvas = document.createElement('canvas');
  canvas.width = panW;
  canvas.height = panH;
  const ctx = canvas.getContext('2d')!;

  const sky = analysis.palette.sky;
  const ground = analysis.palette.ground;
  const grad = ctx.createLinearGradient(0, 0, 0, panH);
  grad.addColorStop(0, sky);
  grad.addColorStop(0.55, analysis.palette.secondary);
  grad.addColorStop(1, ground);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, panW, panH);

  ctx.drawImage(sourceCtx.canvas, cw, 0, cw, ch);

  extrapolateStrip(ctx, sourceCtx.canvas, 0, cw, ch, 'left', analysis);
  extrapolateStrip(ctx, sourceCtx.canvas, cw * 2, cw, ch, 'right', analysis);

  if (analysis.medium === 'oil' || analysis.mood === 'ethereal') {
    addSwirlStrokes(ctx, panW, panH, analysis.palette.accent, analysis.warmth);
  }
  if (analysis.medium === 'watercolor') {
    addWatercolorBleed(ctx, panW, panH, analysis.palette.accent);
  }

  return canvas;
}

function extrapolateStrip(
  dest: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  dx: number,
  sw: number,
  sh: number,
  side: 'left' | 'right',
  analysis: SceneAnalysis,
): void {
  const strip = document.createElement('canvas');
  strip.width = 8;
  strip.height = sh;
  const sctx = strip.getContext('2d')!;
  const sx = side === 'left' ? 0 : source.width - 8;
  sctx.drawImage(source, sx, 0, 8, sh, 0, 0, 8, sh);

  for (let x = 0; x < sw; x += 8) {
    dest.globalAlpha = 0.35 + (x / sw) * 0.45;
    if (side === 'left') {
      dest.drawImage(strip, dx + sw - x - 8, 0, 8, sh);
    } else {
      dest.drawImage(strip, dx + x, 0, 8, sh);
    }
  }
  dest.globalAlpha = 1;

  dest.filter = `blur(${analysis.medium === 'watercolor' ? 12 : 6}px) saturate(${1 + analysis.saturation * 0.3})`;
  dest.globalCompositeOperation = 'overlay';
  dest.fillStyle = analysis.palette.dominant;
  dest.fillRect(dx, 0, sw, sh);
  dest.filter = 'none';
  dest.globalCompositeOperation = 'source-over';
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
  ctx.filter = 'blur(18px) brightness(0.7) saturate(1.2)';
  ctx.drawImage(sourceCtx.canvas, 0, 0, cw, ch);
  ctx.filter = 'none';
  ctx.globalAlpha = 0.85;
  ctx.scale(-1, 1);
  ctx.drawImage(sourceCtx.canvas, -cw, 0, cw, ch);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = analysis.palette.sky;
  ctx.fillRect(0, 0, cw, ch * 0.4);
  addSwirlStrokes(ctx, cw, ch, analysis.palette.accent, analysis.warmth * 0.8);
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
  extrapolateStrip(ctx, sourceCtx.canvas, 0, cw, ch, side, analysis);
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
  ctx.globalAlpha = 0.12 * intensity;
  for (let i = 0; i < 24; i++) {
    ctx.lineWidth = 4 + Math.random() * 20;
    ctx.beginPath();
    const cx = Math.random() * w;
    const cy = Math.random() * h * 0.6;
    ctx.moveTo(cx, cy);
    ctx.bezierCurveTo(
      cx + (Math.random() - 0.5) * 200,
      cy + (Math.random() - 0.5) * 100,
      cx + (Math.random() - 0.5) * 300,
      cy + (Math.random() - 0.5) * 150,
      cx + (Math.random() - 0.5) * 400,
      cy + (Math.random() - 0.5) * 200,
    );
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function addWatercolorBleed(ctx: CanvasRenderingContext2D, w: number, h: number, color: string): void {
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.03 + Math.random() * 0.06;
    const rw = 30 + Math.random() * 120;
    const rh = 20 + Math.random() * 80;
    ctx.beginPath();
    ctx.ellipse(Math.random() * w, Math.random() * h, rw, rh, Math.random() * Math.PI, 0, Math.PI * 2);
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
