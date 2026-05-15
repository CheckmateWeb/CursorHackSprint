import type { ArtStyle } from '@/lib/types';

export interface StyleUniforms {
  tint: string;
  opacityMul: number;
  bloom: number;
  bloomThreshold: number;
  scanline: boolean;
  noiseOpacity: number;
  chromatic: boolean;
}

export const styleUniforms: Record<ArtStyle, StyleUniforms> = {
  original: { tint: '#ffffff', opacityMul: 1, bloom: 0.4, bloomThreshold: 0.6, scanline: false, noiseOpacity: 0, chromatic: false },
  oil: { tint: '#fff8e7', opacityMul: 0.95, bloom: 0.35, bloomThreshold: 0.55, scanline: false, noiseOpacity: 0.035, chromatic: false },
  watercolor: { tint: '#e8f4fc', opacityMul: 0.75, bloom: 0.55, bloomThreshold: 0.5, scanline: false, noiseOpacity: 0.05, chromatic: false },
  surreal: { tint: '#f0e6ff', opacityMul: 0.85, bloom: 0.95, bloomThreshold: 0.35, scanline: false, noiseOpacity: 0, chromatic: false },
  cyberpunk: { tint: '#00fff2', opacityMul: 0.9, bloom: 1.0, bloomThreshold: 0.45, scanline: false, noiseOpacity: 0, chromatic: true },
  pixel: { tint: '#c8ffc8', opacityMul: 0.88, bloom: 0.2, bloomThreshold: 0.7, scanline: true, noiseOpacity: 0, chromatic: false },
};
