import { create } from 'zustand';
import type { AppPhase, ArtStyle, SceneAnalysis } from '@/lib/types';

interface AppState {
  phase: AppPhase;
  imageUrl: string | null;
  imageFile: File | null;
  analysis: SceneAnalysis | null;
  style: ArtStyle;
  compareMode: boolean;
  narrationEnabled: boolean;
  audioEnabled: boolean;
  enteredWorld: boolean;
  pointerLocked: boolean;
  analysisProgress: number;

  setPhase: (phase: AppPhase) => void;
  setImage: (url: string, file?: File | null) => void;
  setAnalysis: (analysis: SceneAnalysis) => void;
  setStyle: (style: ArtStyle) => void;
  setCompareMode: (on: boolean) => void;
  setNarrationEnabled: (on: boolean) => void;
  setAudioEnabled: (on: boolean) => void;
  setEnteredWorld: (on: boolean) => void;
  setPointerLocked: (on: boolean) => void;
  setAnalysisProgress: (n: number) => void;
  reset: () => void;
}

const initial = {
  phase: 'landing' as AppPhase,
  imageUrl: null,
  imageFile: null,
  analysis: null,
  style: 'original' as ArtStyle,
  compareMode: false,
  narrationEnabled: true,
  audioEnabled: true,
  enteredWorld: false,
  pointerLocked: false,
  analysisProgress: 0,
};

export const useAppStore = create<AppState>((set) => ({
  ...initial,
  setPhase: (phase) => set({ phase }),
  setImage: (imageUrl, imageFile = null) => set({ imageUrl, imageFile }),
  setAnalysis: (analysis) => set({ analysis }),
  setStyle: (style) => set({ style }),
  setCompareMode: (compareMode) => set({ compareMode }),
  setNarrationEnabled: (narrationEnabled) => set({ narrationEnabled }),
  setAudioEnabled: (audioEnabled) => set({ audioEnabled }),
  setEnteredWorld: (enteredWorld) => set({ enteredWorld }),
  setPointerLocked: (pointerLocked) => set({ pointerLocked }),
  setAnalysisProgress: (analysisProgress) => set({ analysisProgress }),
  reset: () => set(initial),
}));
