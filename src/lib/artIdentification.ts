import type { ArtworkIdentification, SceneAnalysis } from './types';
import { KNOWN_MASTERPIECES, SAMPLE_IDENTIFICATIONS } from './knownArtworks';

const hashCache = new Map<string, string>();

function getToken(): string | null {
  const t = import.meta.env.VITE_REPLICATE_API_TOKEN;
  return typeof t === 'string' && t.length > 8 ? t : null;
}

export function canUseArtAI(): boolean {
  return !!getToken();
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

/** Difference hash for rough visual similarity */
async function computeDHash(imageUrl: string, size = 9): Promise<string> {
  const cached = hashCache.get(imageUrl);
  if (cached) return cached;

  const img = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  const w = size + 1;
  const h = size;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  let bits = '';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * w + x) * 4;
      const j = (y * w + x + 1) * 4;
      const lumA = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const lumB = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
      bits += lumA > lumB ? '1' : '0';
    }
  }
  hashCache.set(imageUrl, bits);
  return bits;
}

function hamming(a: string, b: string): number {
  let d = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) if (a[i] !== b[i]) d++;
  return d + Math.abs(a.length - b.length);
}

async function matchCatalog(imageUrl: string): Promise<ArtworkIdentification | null> {
  let uploadHash: string;
  try {
    uploadHash = await computeDHash(imageUrl);
  } catch {
    return null;
  }

  let best: { ident: ArtworkIdentification; dist: number } | null = null;

  for (const work of KNOWN_MASTERPIECES) {
    try {
      const refHash = await computeDHash(work.referenceUrl);
      const dist = hamming(uploadHash, refHash);
      const threshold = Math.floor(uploadHash.length * 0.22);
      if (dist <= threshold && (!best || dist < best.dist)) {
        best = {
          ident: {
            ...work.identification,
            confidence: Math.max(0.72, 1 - dist / uploadHash.length),
          },
          dist,
        };
      }
    } catch {
      /* CORS or network — skip reference */
    }
  }

  return best?.ident ?? null;
}

function heuristicIdentification(analysis: SceneAnalysis): ArtworkIdentification {
  const era = analysis.artisticEra;
  const artistHints: Record<string, string> = {
    impressionist: 'Likely 19th-century European (Monet, Renoir, Degas circle)',
    'post-impressionist': 'Likely Post-Impressionist (Van Gogh, Cézanne, Gauguin era)',
    romantic: 'Likely Romantic period (Turner, Friedrich, Delacroix era)',
    baroque: 'Likely Baroque or Dutch Golden Age',
    contemporary: 'Contemporary or modern artist',
    abstract: 'Abstract or non-representational artist',
  };

  return {
    title: analysis.title,
    artist: artistHints[era] ?? 'Unknown artist',
    year: 'Undated',
    movement: era.charAt(0).toUpperCase() + era.slice(1),
    medium: `${analysis.medium} (detected from pixels)`,
    history: `We could not match this image to a known masterpiece in our catalog. Visual analysis suggests a ${analysis.mood}, ${era} character with ${analysis.medium} handling. Upload a clearer photo of a famous work, or add VITE_REPLICATE_API_TOKEN for AI art historian identification.`,
    confidence: 0.35,
    source: 'heuristic',
    isKnownMasterpiece: false,
  };
}

async function identifyWithReplicate(
  imageUrl: string,
  onStatus?: (s: string) => void,
): Promise<ArtworkIdentification | null> {
  const token = getToken();
  if (!token) return null;

  onStatus?.('Consulting AI art historian…');

  const prompt = `You are a museum curator. Identify this artwork if it is a famous painting, drawing, or print in art history.
If you recognize it, respond with ONLY valid JSON (no markdown):
{"title":"...","artist":"...","year":"...","movement":"...","medium":"...","history":"2-3 sentences of art-historical context","confidence":0.0-1.0,"isKnownMasterpiece":true}
If unknown or an amateur/original work, use:
{"title":"Untitled artwork","artist":"Unknown artist","year":"Undated","movement":"...","medium":"...","history":"brief description of what you see","confidence":0.2,"isKnownMasterpiece":false}`;

  try {
    const create = await fetch('https://api.replicate.com/v1/models/yorickvp/llava-13b/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'wait=60',
      },
      body: JSON.stringify({
        input: {
          image: imageUrl,
          prompt,
          max_tokens: 512,
        },
      }),
    });

    if (!create.ok) return null;

    let prediction = (await create.json()) as {
      status: string;
      output?: string | string[];
      error?: string;
      id?: string;
    };

    if (prediction.status === 'starting' || prediction.status === 'processing') {
      const id = prediction.id;
      if (!id) return null;
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        const poll = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        prediction = (await poll.json()) as typeof prediction;
        if (prediction.status !== 'starting' && prediction.status !== 'processing') break;
      }
    }

    if (prediction.status !== 'succeeded' || !prediction.output) return null;

    const text = Array.isArray(prediction.output) ? prediction.output.join('') : prediction.output;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as {
      title?: string;
      artist?: string;
      year?: string;
      movement?: string;
      medium?: string;
      history?: string;
      confidence?: number;
      isKnownMasterpiece?: boolean;
    };

    if (!parsed.title || !parsed.artist) return null;

    return {
      title: parsed.title,
      artist: parsed.artist,
      year: parsed.year,
      movement: parsed.movement,
      medium: parsed.medium,
      history: parsed.history ?? 'Identified by AI visual analysis.',
      confidence: Math.min(1, Math.max(0.2, parsed.confidence ?? 0.7)),
      source: 'ai',
      isKnownMasterpiece: !!parsed.isKnownMasterpiece,
    };
  } catch (e) {
    console.warn('Art identification AI failed', e);
    return null;
  }
}

export interface IdentifyOptions {
  imageUrl: string;
  analysis: SceneAnalysis;
  sampleId?: string | null;
  onStatus?: (s: string) => void;
}

export async function identifyArtwork({
  imageUrl,
  analysis,
  sampleId,
  onStatus,
}: IdentifyOptions): Promise<ArtworkIdentification> {
  if (sampleId && SAMPLE_IDENTIFICATIONS[sampleId]) {
    const s = SAMPLE_IDENTIFICATIONS[sampleId];
    onStatus?.(`Recognized sample: ${s.displayName}`);
    const { displayName: _, ...ident } = s;
    return ident;
  }

  onStatus?.('Searching masterpiece catalog…');
  const catalog = await matchCatalog(imageUrl);
  if (catalog) {
    onStatus?.(`Matched: ${catalog.title}`);
    return catalog;
  }

  const ai = await identifyWithReplicate(imageUrl, onStatus);
  if (ai) {
    onStatus?.(`Identified: ${ai.title}`);
    return ai;
  }

  onStatus?.('Building stylistic profile…');
  return heuristicIdentification(analysis);
}
