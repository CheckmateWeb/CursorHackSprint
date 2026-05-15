export type QualityTier = 'high' | 'low';

export function getQualityTier(): QualityTier {
  if (typeof window === 'undefined') return 'high';
  const narrow = window.innerWidth < 768;
  const lowCores = typeof navigator !== 'undefined' && (navigator.hardwareConcurrency ?? 8) <= 4;
  return narrow || lowCores ? 'low' : 'high';
}

export function scaleCount(base: number, tier: QualityTier, lowFactor = 0.35): number {
  return tier === 'low' ? Math.max(8, Math.floor(base * lowFactor)) : base;
}
