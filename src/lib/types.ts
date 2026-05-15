export type ArtStyle =
  | 'original'
  | 'oil'
  | 'watercolor'
  | 'surreal'
  | 'cyberpunk'
  | 'pixel';

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

export interface SceneAnalysis {
  palette: ColorPalette;
  mood: Mood;
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
  objects: DetectedObject[];
  narration: string;
  title: string;
}

export interface DetectedObject {
  id: string;
  label: string;
  x: number;
  y: number;
  depth: number;
  color: string;
}

export interface SceneConfig {
  analysis: SceneAnalysis;
  imageUrl: string;
  style: ArtStyle;
}

export type AppPhase = 'landing' | 'analyzing' | 'transition' | 'world' | 'compare';
