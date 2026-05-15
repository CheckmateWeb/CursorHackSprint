import type { ColorPalette, DetectedObject, Mood, SceneAnalysis, WeatherEffect } from './types';

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

function colorDistance(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function kMeansColors(pixels: [number, number, number][], k: number): [number, number, number][] {
  if (pixels.length === 0) return [[128, 128, 128]];
  const centroids: [number, number, number][] = [];
  const step = Math.max(1, Math.floor(pixels.length / k));
  for (let i = 0; i < k; i++) {
    centroids.push([...pixels[Math.min(i * step, pixels.length - 1)]]);
  }

  for (let iter = 0; iter < 8; iter++) {
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
): Mood {
  if (brightness < 0.35 && saturation < 0.4) return 'melancholic';
  if (saturation > 0.55 && warmth > 0.55) return 'joyful';
  if (contrast > 0.45 && brightness < 0.5) return 'dramatic';
  if (saturation < 0.35 && brightness > 0.5) return 'ethereal';
  if (warmth < 0.4 && contrast > 0.35) return 'mysterious';
  return 'serene';
}

function inferWeather(
  palette: ColorPalette,
  brightness: number,
  hasWater: boolean,
): WeatherEffect {
  const sky = palette.sky.toLowerCase();
  if (sky.includes('4a') || brightness < 0.3) return 'dream';
  if (hasWater && brightness > 0.5) return 'fog';
  if (brightness < 0.45) return 'rain';
  if (brightness > 0.7) return 'clear';
  return 'fog';
}

function buildNarration(mood: Mood, objects: DetectedObject[], isNight: boolean): string {
  const moodLines: Record<Mood, string> = {
    serene: 'A hush settles over the canvas — time slows, and every brushstroke breathes.',
    melancholic: 'Shadows hold memories here. You walk through quiet longing painted in light.',
    joyful: 'Color sings in every direction. The world hums with warmth and possibility.',
    mysterious: 'Something waits just beyond sight. The painting whispers secrets to those who listen.',
    dramatic: 'Light clashes with darkness in cathedral silence. Each step echoes with intent.',
    ethereal: 'You float between dream and pigment — neither fully real, nor willing to leave.',
  };
  const time = isNight ? 'Moonlight drapes the scene in silver reverie.' : 'Sunlight filters through imagined air.';
  const obj =
    objects.length > 0
      ? ` You sense ${objects.slice(0, 2).map((o) => o.label.toLowerCase()).join(' and ')} lingering in the depth.`
      : '';
  return `${moodLines[mood]} ${time}${obj}`;
}

function detectObjects(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  palette: ColorPalette,
): DetectedObject[] {
  const regions = [
    { label: 'Horizon', x: 0.5, y: 0.35, depth: 0.85 },
    { label: 'Foreground', x: 0.5, y: 0.75, depth: 0.2 },
    { label: 'Light Source', x: 0.7, y: 0.25, depth: 0.9 },
  ];
  const objects: DetectedObject[] = [];
  const grid = 4;
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
        n = 0;
      for (let y = y0; y < y1; y += 2) {
        for (let x = x0; x < x1; x += 2) {
          const i = (y * w + x) * 4;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          n++;
        }
      }
      if (n === 0) continue;
      r /= n;
      g /= n;
      b /= n;
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (lum < 0.15 || lum > 0.92) continue;
      const labels = ['Silhouette', 'Form', 'Texture', 'Glow', 'Shadow', 'Brushwork'];
      objects.push({
        id: `obj-${idx++}`,
        label: labels[idx % labels.length],
        x: (gx + 0.5) / grid,
        y: (gy + 0.5) / grid,
        depth: 0.3 + (gy / grid) * 0.6,
        color: rgbToHex(r, g, b),
      });
      if (objects.length >= 6) break;
    }
    if (objects.length >= 6) break;
  }
  return objects.length > 0 ? objects : regions.map((r, i) => ({ ...r, id: `r-${i}`, color: palette.accent }));
}

export async function analyzePainting(imageUrl: string): Promise<SceneAnalysis> {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  const maxSize = 256;
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
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
    topBrightness = 0,
    bottomBrightness = 0;

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

      if ((x + y) % 3 === 0) pixels.push([r, g, b]);
      totalR += r;
      totalG += g;
      totalB += b;
      totalLum += lum;
      satSum += sat;
      minLum = Math.min(minLum, lum);
      maxLum = Math.max(maxLum, lum);
      blueSum += b;
      greenSum += g;
      if (y < h * 0.35) topBrightness += lum;
      if (y > h * 0.65) bottomBrightness += lum;
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
  const topAvg = topBrightness / (w * Math.floor(h * 0.35) || 1);
  const bottomAvg = bottomBrightness / (w * Math.floor(h * 0.35) || 1);

  const clusters = kMeansColors(pixels, 5);
  const [c0, c1, c2, c3, c4] = clusters;
  const palette: ColorPalette = {
    dominant: rgbToHex(...(c2 ?? c0)),
    secondary: rgbToHex(...(c1 ?? c0)),
    accent: rgbToHex(...(c4 ?? c3 ?? c0)),
    sky: rgbToHex(...(c4 ?? c3 ?? c0)),
    ground: rgbToHex(...(c0 ?? c1)),
  };

  const hasWater = blueSum / count > avgB * 1.05 && bottomAvg > topAvg * 0.8;
  const hasSky = topAvg > brightness * 1.1;
  const hasTrees = greenSum / count > avgG * 1.08 && bottomAvg < topAvg;
  const isNight = brightness < 0.38 && topAvg < 0.45;

  const mood = inferMood(warmth, brightness, saturation, contrast);
  const weather = inferWeather(palette, brightness, hasWater);
  const objects = detectObjects(data, w, h, palette);
  const depthLayers = Math.min(6, Math.max(3, Math.floor(contrast * 10)));

  const titles = [
    'Threshold of Wonder',
    'Echoes in Pigment',
    'The Living Canvas',
    'Dreams in Oil and Light',
    'Beyond the Frame',
  ];
  const title = titles[Math.floor(warmth * titles.length) % titles.length];

  return {
    palette,
    mood,
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
    objects,
    narration: buildNarration(mood, objects, isNight),
    title,
  };
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
