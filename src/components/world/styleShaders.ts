import type { ArtStyle } from '@/lib/types';

export interface StyleUniforms {
  tint: string;
  opacityMul: number;
  bloom: number;
}

export const styleUniforms: Record<ArtStyle, StyleUniforms> = {
  original: { tint: '#ffffff', opacityMul: 1, bloom: 0.4 },
  oil: { tint: '#fff8e7', opacityMul: 0.95, bloom: 0.35 },
  watercolor: { tint: '#e8f4fc', opacityMul: 0.75, bloom: 0.55 },
  surreal: { tint: '#f0e6ff', opacityMul: 0.85, bloom: 0.7 },
  cyberpunk: { tint: '#00fff2', opacityMul: 0.9, bloom: 0.9 },
  pixel: { tint: '#c8ffc8', opacityMul: 0.88, bloom: 0.2 },
};
