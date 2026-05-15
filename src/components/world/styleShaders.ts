import type { ArtStyle } from '@/lib/types';

export interface StyleUniforms {
  tint: string;
  opacityMul: number;
  bloom: number;
}

export const styleUniforms: Record<ArtStyle, StyleUniforms> = {
  original: { tint: '#f5f2eb', opacityMul: 1, bloom: 0.15 },
  oil: { tint: '#f8f4e8', opacityMul: 0.98, bloom: 0.12 },
  watercolor: { tint: '#eef4f8', opacityMul: 0.9, bloom: 0.18 },
  surreal: { tint: '#f2eef8', opacityMul: 0.92, bloom: 0.22 },
  cyberpunk: { tint: '#e8f8f6', opacityMul: 0.95, bloom: 0.25 },
  pixel: { tint: '#f0f2f0', opacityMul: 0.95, bloom: 0.1 },
};
