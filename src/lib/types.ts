export type ArtStyle =
  | 'original'
  | 'oil'
  | 'watercolor'
  | 'surreal'
  | 'cyberpunk'
  | 'pixel';

export type PaintMedium = 'oil' | 'watercolor' | 'acrylic' | 'digital' | 'mixed';

export type Mood =
  | 'serene'
  | 'melancholic'
  | 'joyful'
  | 'mysterious'
  | 'dramatic'
  | 'ethereal';

export type WeatherEffect = 'clear' | 'rain' | 'fog' | 'snow' | 'dream';

export interface ColorPalette {
  dominant: string;
  secondary: string;
  accent: string;
  sky: string;
  ground: string;
}

export interface DetectedObject {
  id: string;
  label: string;
  x: number;
  y: number;
  depth: number;
  color: string;
}

/** Depth slice for volumetric diorama layers */
export interface DepthPlane {
  id: string;
  role: 'foreground' | 'midground' | 'background';
  depth: number;
  scale: number;
  opacity: number;
  offsetY: number;
}

/** Spatial sound source tied to painting regions */
export interface SpatialSoundSource {
  id: string;
  label: string;
  /** -1 left … 1 right */
  pan: number;
  /** 0 near … 1 far */
  depth: number;
  type: 'water' | 'wind' | 'chime' | 'ambient' | 'pulse';
}

export interface SceneAnalysis {
  palette: ColorPalette;
  mood: Mood;
  medium: PaintMedium;
  warmth: number;
  brightness: number;
  contrast: number;
  saturation: number;
  hasWater: boolean;
  hasSky: boolean;
  hasTrees: boolean;
  isNight: boolean;
  weather: WeatherEffect;
  depthLayers: number;
  depthPlanes: DepthPlane[];
  objects: DetectedObject[];
  spatialSounds: SpatialSoundSource[];
  narration: string;
  title: string;
  /** Suggested era / style for audio (e.g. impressionist swirl) */
  artisticEra: string;
}

export interface ExpansionTextures {
  panoramaUrl: string;
  backUrl: string;
  leftStripUrl: string;
  rightStripUrl: string;
}

export interface SceneConfig {
  analysis: SceneAnalysis;
  imageUrl: string;
  style: ArtStyle;
  expansion: ExpansionTextures;
}

export type AppPhase = 'landing' | 'analyzing' | 'transition' | 'world' | 'compare';
