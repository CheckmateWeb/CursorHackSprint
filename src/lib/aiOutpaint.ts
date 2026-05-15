import type { SceneAnalysis } from './types';

export type ExpansionMode = 'ai' | 'local';

export interface ExpansionProgress {
  stage: string;
  percent: number;
}

function buildPrompt(analysis: SceneAnalysis): string {
  return [
    `Seamless continuation of a ${analysis.artisticEra} artwork.`,
    `${analysis.medium} paint medium, ${analysis.mood} atmosphere.`,
    `Match exact brushstrokes, colors ${analysis.palette.dominant} and ${analysis.palette.accent}.`,
    'Same artist style, no borders, no frame, painterly texture, museum quality.',
  ].join(' ');
}

function getToken(): string | null {
  const t = import.meta.env.VITE_REPLICATE_API_TOKEN;
  return typeof t === 'string' && t.length > 8 ? t : null;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Pad canvas and mask for directional outpaint (black = generate, white = keep) */
function buildPaddedCanvas(
  source: HTMLCanvasElement,
  direction: 'left' | 'right' | 'top' | 'bottom',
  padRatio = 0.45,
): { imageUrl: string; maskUrl: string } {
  const sw = source.width;
  const sh = source.height;
  let cw = sw;
  let ch = sh;
  let ox = 0;
  let oy = 0;

  if (direction === 'left' || direction === 'right') {
    cw = Math.floor(sw * (1 + padRatio));
    ox = direction === 'left' ? Math.floor(sw * padRatio) : 0;
  } else {
    ch = Math.floor(sh * (1 + padRatio));
    oy = direction === 'top' ? Math.floor(sh * padRatio) : 0;
  }

  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(source, ox, oy);

  const mask = document.createElement('canvas');
  mask.width = cw;
  mask.height = ch;
  const mctx = mask.getContext('2d')!;
  mctx.fillStyle = '#000000';
  mctx.fillRect(0, 0, cw, ch);
  mctx.fillStyle = '#ffffff';
  mctx.fillRect(ox, oy, sw, sh);

  return {
    imageUrl: canvas.toDataURL('image/png'),
    maskUrl: mask.toDataURL('image/png'),
  };
}

async function getLatestVersion(modelRef: string): Promise<string | null> {
  const token = getToken();
  if (!token) return null;
  const [owner, name] = modelRef.split('/');
  try {
    const res = await fetch(`https://api.replicate.com/v1/models/${owner}/${name}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { latest_version?: { id: string } };
    return data.latest_version?.id ?? null;
  } catch {
    return null;
  }
}

async function runReplicateInpaint(
  imageUrl: string,
  maskUrl: string,
  prompt: string,
  onStatus?: (s: string) => void,
): Promise<string | null> {
  const token = getToken();
  if (!token) return null;

  onStatus?.('Connecting to AI outpainting…');

  const version =
    (await getLatestVersion('emaph/outpaint-controlnet-union')) ??
    (await getLatestVersion('stability-ai/stable-diffusion-inpainting'));

  const modelVersion = version
    ? { version }
    : { model: 'stability-ai/stable-diffusion-inpainting' };

  const body = {
    ...modelVersion,
    input: {
      image: imageUrl,
      mask: maskUrl,
      prompt,
      negative_prompt: 'blurry, low quality, frame, border, text, watermark, photo, 3d render',
      num_inference_steps: 28,
      guidance_scale: 7.5,
    },
  };

  try {
    const create = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!create.ok) {
      console.warn('Replicate create failed', await create.text());
      return null;
    }

    let prediction = (await create.json()) as {
      id: string;
      status: string;
      output?: string | string[];
      error?: string;
    };

    while (prediction.status === 'starting' || prediction.status === 'processing') {
      onStatus?.('AI is painting extended regions…');
      await new Promise((r) => setTimeout(r, 1500));
      const poll = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      prediction = (await poll.json()) as typeof prediction;
    }

    if (prediction.status !== 'succeeded' || !prediction.output) {
      console.warn('Replicate failed', prediction.error);
      return null;
    }

    const outUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    const imgRes = await fetch(outUrl);
    const blob = await imgRes.blob();
    return blobToDataUrl(blob);
  } catch (e) {
    console.warn('Replicate error', e);
    return null;
  }
}

/** Expand one direction with AI, return merged canvas or null */
export async function expandDirectionAI(
  source: HTMLCanvasElement,
  direction: 'left' | 'right',
  analysis: SceneAnalysis,
  onStatus?: (s: string) => void,
): Promise<HTMLCanvasElement | null> {
  const { imageUrl, maskUrl } = buildPaddedCanvas(source, direction, 0.5);
  const result = await runReplicateInpaint(imageUrl, maskUrl, buildPrompt(analysis), onStatus);
  if (!result) return null;

  const img = await loadImage(result);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  canvas.getContext('2d')!.drawImage(img, 0, 0);
  return canvas;
}

export function canUseAI(): boolean {
  return !!getToken();
}

export function expansionMode(): ExpansionMode {
  return canUseAI() ? 'ai' : 'local';
}
