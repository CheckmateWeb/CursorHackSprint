import type {
  ColorPalette,
  DepthPlane,
  DetectedObject,
  Mood,
  PaintMedium,
  SceneAnalysis,
  SpatialSoundSource,
  WeatherEffect,
} from './types';

/** Max analysis dimension — keeps 2MP uploads under ~2s on typical hardware. */
const ANALYSIS_MAX_SIZE = 384;

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

function colorDistance(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

/** k-means++ seeding for more stable dominant palette clusters. */
function pickCentroidsKMeansPlusPlus(pixels: [number, number, number][], k: number): [number, number, number][] {
  const centroids: [number, number, number][] = [[...pixels[Math.floor(Math.random() * pixels.length)]]];
  while (centroids.length < k) {
    const distances = pixels.map((px) => {
      let min = Infinity;
      for (const c of centroids) min = Math.min(min, colorDistance(px, c));
      return min * min;
    });
    const total = distances.reduce((s, d) => s + d, 0) || 1;
    let r = Math.random() * total;
    for (let i = 0; i < pixels.length; i++) {
      r -= distances[i];
      if (r <= 0) {
        centroids.push([...pixels[i]]);
        break;
      }
    }
    if (centroids.length === pixels.length) break;
  }
  return centroids;
}

function kMeansColors(pixels: [number, number, number][], k: number): [number, number, number][] {
  if (pixels.length === 0) return [[128, 128, 128]];
  const centroids = pickCentroidsKMeansPlusPlus(pixels, k);

  for (let iter = 0; iter < 12; iter++) {
    const buckets: [number, number, number][][] = Array.from({ length: k }, () => []);
    for (const px of pixels) {
      let best = 0;
      let bestDist = Infinity;
      centroids.forEach((c, i) => {
        const d = colorDistance(px, c);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      buckets[best].push(px);
    }
    for (let i = 0; i < k; i++) {
      if (buckets[i].length === 0) continue;
      const n = buckets[i].length;
      centroids[i] = [
        buckets[i].reduce((s, p) => s + p[0], 0) / n,
        buckets[i].reduce((s, p) => s + p[1], 0) / n,
        buckets[i].reduce((s, p) => s + p[2], 0) / n,
      ];
    }
  }
  return centroids.sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]));
}

function inferMood(
  warmth: number,
  brightness: number,
  saturation: number,
  contrast: number,
  isNight: boolean,
): Mood {
  const scores: Record<Mood, number> = {
    melancholic: 0,
    joyful: 0,
    dramatic: 0,
    ethereal: 0,
    mysterious: 0,
    serene: 0.15,
  };

  if (brightness < 0.35) scores.melancholic += 0.45;
  if (saturation < 0.38 && brightness < 0.5) scores.melancholic += 0.25;
  if (isNight) scores.melancholic += 0.2;

  if (saturation > 0.5 && warmth > 0.52 && brightness > 0.42) scores.joyful += 0.55;
  if (warmth > 0.58 && brightness > 0.55) scores.joyful += 0.2;

  if (contrast > 0.42 && brightness < 0.55) scores.dramatic += 0.5;
  if (contrast > 0.5) scores.dramatic += 0.15;

  if (saturation < 0.38 && brightness > 0.48) scores.ethereal += 0.45;
  if (brightness > 0.62 && saturation < 0.45) scores.ethereal += 0.2;

  if (warmth < 0.42 && contrast > 0.32) scores.mysterious += 0.45;
  if (brightness < 0.45 && saturation < 0.45) scores.mysterious += 0.15;

  if (brightness >= 0.4 && brightness <= 0.65 && contrast < 0.4) scores.serene += 0.35;

  let best: Mood = 'serene';
  let bestScore = -1;
  (Object.keys(scores) as Mood[]).forEach((m) => {
    if (scores[m] > bestScore) {
      bestScore = scores[m];
      best = m;
    }
  });
  return best;
}

function inferWeather(
  palette: ColorPalette,
  brightness: number,
  hasWater: boolean,
  isNight: boolean,
  saturation: number,
): WeatherEffect {
  const sky = palette.sky.toLowerCase();
  if (isNight || brightness < 0.28) return 'dream';
  if (hasWater && brightness > 0.45 && saturation < 0.42) return 'fog';
  if (brightness < 0.4 && saturation < 0.35) return 'rain';
  if (brightness > 0.72 && saturation > 0.4) return 'clear';
  if (sky.includes('e8') || sky.includes('f0')) return 'clear';
  return 'fog';
}

const MOOD_NARRATION: Record<Mood, string[]> = {
  serene: [
    'A hush settles over the canvas — time slows, and every brushstroke breathes.',
    'Stillness pools between colors like sunlight on quiet water.',
  ],
  melancholic: [
    'Shadows hold memories here. You walk through quiet longing painted in light.',
    'The scene carries the weight of something beautiful that has already passed.',
  ],
  joyful: [
    'Color sings in every direction. The world hums with warmth and possibility.',
    'Pigment celebrates itself — bold, bright, unafraid to be alive.',
  ],
  mysterious: [
    'Something waits just beyond sight. The painting whispers secrets to those who listen.',
    'Edges dissolve into questions. Each step draws you deeper into the unknown.',
  ],
  dramatic: [
    'Light clashes with darkness in cathedral silence. Each step echoes with intent.',
    'Contrast carves the air — heroic, urgent, impossible to ignore.',
  ],
  ethereal: [
    'You float between dream and pigment — neither fully real, nor willing to leave.',
    'Forms shimmer at the edge of perception, as if the canvas exhales light.',
  ],
};

function buildNarration(mood: Mood, objects: DetectedObject[], isNight: boolean, weather: WeatherEffect): string {
  const lines = MOOD_NARRATION[mood];
  const opener = lines[Math.floor(Math.random() * lines.length)];
  const time = isNight
    ? 'Moonlight drapes the scene in silver reverie.'
    : weather === 'rain'
      ? 'A soft grey veil softens every distant contour.'
      : 'Sunlight filters through imagined air.';
  const obj =
    objects.length > 0
      ? ` You sense ${objects
          .slice(0, 2)
          .map((o) => o.label.toLowerCase())
          .join(' and ')} lingering in the depth.`
      : '';
  return `${opener} ${time}${obj}`;
}

function inferMedium(saturation: number, contrast: number, warmth: number): PaintMedium {
  if (saturation > 0.5 && contrast > 0.4) return 'oil';
  if (saturation < 0.4 && contrast < 0.35) return 'watercolor';
  if (warmth > 0.6) return 'acrylic';
  if (saturation < 0.25) return 'digital';
  return 'mixed';
}

function buildDepthPlanes(layerCount: number): DepthPlane[] {
  const roles: DepthPlane['role'][] = ['foreground', 'midground', 'background'];
  return Array.from({ length: layerCount }, (_, i) => {
    const t = i / Math.max(1, layerCount - 1);
    return {
      id: `plane-${i}`,
      role: roles[Math.min(2, Math.floor(t * 3))] ?? 'midground',
      depth: 0.15 + t * 0.85,
      scale: 1.2 - t * 0.35,
      opacity: 0.55 + (1 - t) * 0.4,
      offsetY: -0.2 + t * 0.35,
    };
  });
}

function buildSpatialSounds(
  hasWater: boolean,
  hasSky: boolean,
  objects: DetectedObject[],
): SpatialSoundSource[] {
  const sounds: SpatialSoundSource[] = [];
  if (hasWater) {
    sounds.push({
      id: 'water-l',
      label: 'Flowing water',
      pan: -0.75,
      depth: 0.35,
      type: 'water',
    });
  }
  if (hasSky) {
    sounds.push({ id: 'wind', label: 'Wind', pan: 0.4, depth: 0.8, type: 'wind' });
  }
  objects.slice(0, 2).forEach((o, i) => {
    sounds.push({
      id: `obj-snd-${i}`,
      label: o.label,
      pan: o.x * 2 - 1,
      depth: o.depth,
      type: 'chime',
    });
  });
  sounds.push({ id: 'ambient', label: 'Room tone', pan: 0, depth: 0.5, type: 'ambient' });
  return sounds;
}

function inferArtisticEra(mood: Mood, saturation: number, warmth: number): string {
  if (saturation > 0.55 && warmth > 0.55) return 'Post-Impressionist swirl';
  if (mood === 'melancholic') return 'Old Masters chiaroscuro';
  if (mood === 'joyful' && warmth > 0.5) return 'American Modern diner glow';
  if (mood === 'ethereal') return 'Symbolist dreamscape';
  return 'Contemporary atmospheric';
}

function generateTitle(mood: Mood, palette: ColorPalette, warmth: number, isNight: boolean): string {
  const accent = palette.accent.replace('#', '');
  const hueHint =
    parseInt(accent.slice(0, 2), 16) > parseInt(accent.slice(4, 6), 16) ? 'Amber' : 'Azure';
  const moodTitles: Record<Mood, string[]> = {
    serene: ['Whispers of', 'Stillness in'],
    melancholic: ['Echoes of', 'Shadows in'],
    joyful: ['Radiance of', 'Song of'],
    mysterious: ['Secrets of', 'Veil of'],
    dramatic: ['Storm of', 'Throne of'],
    ethereal: ['Dreams of', 'Mist of'],
  };
  const timeWord = isNight ? 'Midnight' : warmth > 0.55 ? 'Dusk' : 'Dawn';
  const prefix = moodTitles[mood][Math.floor(warmth * moodTitles[mood].length) % moodTitles[mood].length];
  return `${prefix} ${hueHint} ${timeWord}`;
}

/**
 * Depth map for Adrian's 3D layers: brighter + higher in frame → farther (sky),
 * darker + lower → nearer (foreground). Normalized 0 (near) … 1 (far).
 */
function buildDepthMap(data: Uint8ClampedArray, w: number, h: number): Float32Array {
  const depth = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const vertical = y / h;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
      const skyBias = 1 - vertical;
      const combined = lum * 0.55 + skyBias * 0.45;
      depth[y * w + x] = Math.min(1, Math.max(0, combined));
    }
  }
  return depth;
}

/** Bucket depth histogram into 3–6 layers for parallax / mesh placement. */
function depthLayersFromMap(depth: Float32Array, contrast: number): number {
  const bins = 8;
  const hist = new Array(bins).fill(0);
  for (let i = 0; i < depth.length; i++) {
    const b = Math.min(bins - 1, Math.floor(depth[i] * bins));
    hist[b]++;
  }
  const occupied = hist.filter((c) => c > depth.length * 0.04).length;
  return Math.min(6, Math.max(3, occupied + Math.floor(contrast * 4)));
}

type RegionStats = {
  gx: number;
  gy: number;
  r: number;
  g: number;
  b: number;
  lum: number;
  sat: number;
};

function labelRegion(stats: RegionStats, hasWater: boolean, hasSky: boolean, hasTrees: boolean): string {
  const { gy, lum, sat, b, g, r } = stats;
  if (gy <= 1 && lum > 0.55 && hasSky) return 'Sky Glow';
  if (gy >= 2 && b > r && b > g && hasWater) return 'Water Shimmer';
  if (gy >= 2 && g > r && g > b && hasTrees) return 'Foliage Mass';
  if (lum < 0.22) return 'Deep Shadow';
  if (lum > 0.78 && sat < 0.25) return 'Highlight';
  if (sat > 0.45) return 'Color Bloom';
  if (gy <= 1) return 'Distant Ridge';
  if (gy >= 2) return 'Foreground Form';
  return 'Brushwork';
}

function detectObjects(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  palette: ColorPalette,
  depth: Float32Array,
  hasWater: boolean,
  hasSky: boolean,
  hasTrees: boolean,
): DetectedObject[] {
  const grid = 4;
  const objects: DetectedObject[] = [];
  let idx = 0;

  for (let gy = 0; gy < grid; gy++) {
    for (let gx = 0; gx < grid; gx++) {
      const x0 = Math.floor((gx / grid) * w);
      const y0 = Math.floor((gy / grid) * h);
      const x1 = Math.floor(((gx + 1) / grid) * w);
      const y1 = Math.floor(((gy + 1) / grid) * h);
      let r = 0,
        g = 0,
        b = 0,
        lum = 0,
        sat = 0,
        n = 0;
      let depthSum = 0;

      for (let y = y0; y < y1; y += 2) {
        for (let x = x0; x < x1; x += 2) {
          const i = (y * w + x) * 4;
          const pr = data[i];
          const pg = data[i + 1];
          const pb = data[i + 2];
          const pl = (0.299 * pr + 0.587 * pg + 0.114 * pb) / 255;
          const max = Math.max(pr, pg, pb) / 255;
          const min = Math.min(pr, pg, pb) / 255;
          r += pr;
          g += pg;
          b += pb;
          lum += pl;
          sat += max === 0 ? 0 : (max - min) / max;
          depthSum += depth[y * w + x];
          n++;
        }
      }
      if (n === 0) continue;
      const stats: RegionStats = {
        gx,
        gy,
        r: r / n,
        g: g / n,
        b: b / n,
        lum: lum / n,
        sat: sat / n,
      };
      if (stats.lum < 0.08 || stats.lum > 0.97) continue;

      objects.push({
        id: `obj-${idx++}`,
        label: labelRegion(stats, hasWater, hasSky, hasTrees),
        x: (gx + 0.5) / grid,
        y: (gy + 0.5) / grid,
        depth: 0.15 + (depthSum / n) * 0.8,
        color: rgbToHex(stats.r, stats.g, stats.b),
      });
      if (objects.length >= 6) break;
    }
    if (objects.length >= 6) break;
  }

  return objects.length > 0
    ? objects
    : [
        { id: 'r-0', label: 'Horizon', x: 0.5, y: 0.35, depth: 0.85, color: palette.accent },
        { id: 'r-1', label: 'Foreground', x: 0.5, y: 0.75, depth: 0.2, color: palette.dominant },
      ];
}

export async function analyzePainting(imageUrl: string): Promise<SceneAnalysis> {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, ANALYSIS_MAX_SIZE / Math.max(img.width, img.height));
  canvas.width = Math.floor(img.width * scale);
  canvas.height = Math.floor(img.height * scale);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const { data, width: w, height: h } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const pixels: [number, number, number][] = [];
  let totalR = 0,
    totalG = 0,
    totalB = 0,
    totalLum = 0,
    minLum = 1,
    maxLum = 0,
    satSum = 0,
    blueSum = 0,
    greenSum = 0,
    topLum = 0,
    topCount = 0,
    bottomLum = 0,
    bottomCount = 0,
    lowerBlue = 0,
    lowerCount = 0;

  const topEnd = Math.floor(h * 0.33);
  const bottomStart = Math.floor(h * 0.66);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const max = Math.max(r, g, b) / 255;
      const min = Math.min(r, g, b) / 255;
      const sat = max === 0 ? 0 : (max - min) / max;

      if ((x + y) % 4 === 0) pixels.push([r, g, b]);
      totalR += r;
      totalG += g;
      totalB += b;
      totalLum += lum;
      satSum += sat;
      minLum = Math.min(minLum, lum);
      maxLum = Math.max(maxLum, lum);
      blueSum += b;
      greenSum += g;

      if (y < topEnd) {
        topLum += lum;
        topCount++;
      }
      if (y >= bottomStart) {
        bottomLum += lum;
        bottomCount++;
        lowerBlue += b;
        lowerCount++;
      }
    }
  }

  const count = w * h;
  const avgR = totalR / count;
  const avgG = totalG / count;
  const avgB = totalB / count;
  const brightness = totalLum / count;
  const saturation = satSum / count;
  const contrast = maxLum - minLum;
  const warmth = (avgR + avgG * 0.5) / (avgB + 1) / 255;
  const topAvg = topCount > 0 ? topLum / topCount : brightness;
  const bottomAvg = bottomCount > 0 ? bottomLum / bottomCount : brightness;

  const clusters = kMeansColors(pixels, 5);
  const sorted = [...clusters].sort((a, b) => a[2] - b[2]);
  const skyCluster = sorted[sorted.length - 1] ?? clusters[0];
  const groundCluster = sorted[0] ?? clusters[0];

  const palette: ColorPalette = {
    dominant: rgbToHex(...(clusters[2] ?? clusters[0])),
    secondary: rgbToHex(...(clusters[1] ?? clusters[0])),
    accent: rgbToHex(...(clusters[clusters.length - 1] ?? clusters[0])),
    sky: rgbToHex(...skyCluster),
    ground: rgbToHex(...groundCluster),
  };

  const lowerBlueAvg = lowerCount > 0 ? lowerBlue / lowerCount : avgB;
  const hasWater =
    lowerBlueAvg > avgB * 1.06 && bottomAvg > topAvg * 0.75 && avgB > avgR * 0.9;
  const hasSky = topAvg > brightness * 1.08 && topAvg > bottomAvg * 0.95;
  const hasTrees =
    greenSum / count > avgG * 1.06 && bottomAvg < topAvg * 1.05 && avgG > avgB * 0.85;
  const isNight =
    brightness < 0.4 && topAvg < 0.42 && topAvg < bottomAvg * 1.15 && saturation < 0.5;

  const depthMap = buildDepthMap(data, w, h);
  const depthLayers = depthLayersFromMap(depthMap, contrast);
  const mood = inferMood(warmth, brightness, saturation, contrast, isNight);
  const weather = inferWeather(palette, brightness, hasWater, isNight, saturation);
  const objects = detectObjects(data, w, h, palette, depthMap, hasWater, hasSky, hasTrees);
  const medium = inferMedium(saturation, contrast, warmth);
  const depthPlanes = buildDepthPlanes(depthLayers);
  const spatialSounds = buildSpatialSounds(hasWater, hasSky, objects);
  const artisticEra = inferArtisticEra(mood, saturation, warmth);
  const title = generateTitle(mood, palette, warmth, isNight);
  const narration = buildNarration(mood, objects, isNight, weather);

  return {
    palette,
    mood,
    medium,
    warmth,
    brightness,
    contrast,
    saturation,
    hasWater,
    hasSky,
    hasTrees,
    isNight,
    weather,
    depthLayers,
    depthPlanes,
    objects,
    spatialSounds,
    artisticEra,
    narration,
    title,
  };
}

/** Optional TTS — call when `narrationEnabled` is true in the store. */
export function speakNarration(text: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.92;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
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

export function simulateAnalysisProgress(
  onProgress: (n: number) => void,
  durationMs = 3200,
): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      onProgress(Math.round(eased * 100));
      if (t >= 1) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
