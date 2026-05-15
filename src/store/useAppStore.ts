import { create } from 'zustand';
import type { AppPhase, ArtStyle, ExpansionTextures, SceneAnalysis } from '@/lib/types';

interface AppState {
  phase: AppPhase;
  imageUrl: string | null;
  imageFile: File | null;
  analysis: SceneAnalysis | null;
  expansion: ExpansionTextures | null;
  style: ArtStyle;
  compareMode: boolean;
  narrationEnabled: boolean;
  audioEnabled: boolean;
  enteredWorld: boolean;
<<<<<<< HEAD
  pointerLocked: boolean;
=======
  expansionProgress: number;
>>>>>>> origin/master
  analysisProgress: number;

  setPhase: (phase: AppPhase) => void;
  setImage: (url: string, file?: File | null) => void;
  setAnalysis: (analysis: SceneAnalysis) => void;
  setExpansion: (expansion: ExpansionTextures) => void;
  setStyle: (style: ArtStyle) => void;
  setCompareMode: (on: boolean) => void;
  setNarrationEnabled: (on: boolean) => void;
  setAudioEnabled: (on: boolean) => void;
  setEnteredWorld: (on: boolean) => void;
<<<<<<< HEAD
  setPointerLocked: (on: boolean) => void;
=======
  setExpansionProgress: (n: number) => void;
>>>>>>> origin/master
  setAnalysisProgress: (n: number) => void;
  reset: () => void;
}

const initial = {
  phase: 'landing' as AppPhase,
  imageUrl: null,
  imageFile: null,
  analysis: null,
  expansion: null,
  style: 'original' as ArtStyle,
  compareMode: false,
  narrationEnabled: true,
  audioEnabled: true,
  enteredWorld: false,
<<<<<<< HEAD
  pointerLocked: false,
=======
  expansionProgress: 0,
>>>>>>> origin/master
  analysisProgress: 0,
};

export const useAppStore = create<AppState>((set) => ({
  ...initial,
  setPhase: (phase) => set({ phase }),
  setImage: (imageUrl, imageFile = null) => set({ imageUrl, imageFile }),
  setAnalysis: (analysis) => set({ analysis }),
  setExpansion: (expansion) => set({ expansion }),
  setStyle: (style) => set({ style }),
  setCompareMode: (compareMode) => set({ compareMode }),
  setNarrationEnabled: (narrationEnabled) => set({ narrationEnabled }),
  setAudioEnabled: (audioEnabled) => set({ audioEnabled }),
  setEnteredWorld: (enteredWorld) => set({ enteredWorld }),
<<<<<<< HEAD
  setPointerLocked: (pointerLocked) => set({ pointerLocked }),
=======
  setExpansionProgress: (expansionProgress) => set({ expansionProgress }),
>>>>>>> origin/master
  setAnalysisProgress: (analysisProgress) => set({ analysisProgress }),
  reset: () => set(initial),
}));
