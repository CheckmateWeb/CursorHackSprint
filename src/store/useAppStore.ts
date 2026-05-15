import { create } from 'zustand';
import type {
  AppPhase,
  ArtHistoryEntry,
  ArtStyle,
  ArtworkIdentification,
  ExpansionTextures,
  SceneAnalysis,
} from '@/lib/types';
import { appendArtHistory, createHistoryEntry, loadArtHistory } from '@/lib/artHistory';

interface AppState {
  phase: AppPhase;
  imageUrl: string | null;
  imageFile: File | null;
  sampleId: string | null;
  analysis: SceneAnalysis | null;
  artwork: ArtworkIdentification | null;
  artHistory: ArtHistoryEntry[];
  expansion: ExpansionTextures | null;
  style: ArtStyle;
  compareMode: boolean;
  narrationEnabled: boolean;
  audioEnabled: boolean;
  enteredWorld: boolean;
  expansionProgress: number;
  analysisProgress: number;

  setPhase: (phase: AppPhase) => void;
  setImage: (url: string, file?: File | null, sampleId?: string | null) => void;
  setAnalysis: (analysis: SceneAnalysis) => void;
  setArtwork: (artwork: ArtworkIdentification | null) => void;
  recordArtworkHistory: (artwork?: ArtworkIdentification) => void;
  refreshArtHistory: () => void;
  setExpansion: (expansion: ExpansionTextures) => void;
  setStyle: (style: ArtStyle) => void;
  setCompareMode: (on: boolean) => void;
  setNarrationEnabled: (on: boolean) => void;
  setAudioEnabled: (on: boolean) => void;
  setEnteredWorld: (on: boolean) => void;
  setExpansionProgress: (n: number) => void;
  setAnalysisProgress: (n: number) => void;
  reset: () => void;
}

const initial = {
  phase: 'landing' as AppPhase,
  imageUrl: null,
  imageFile: null,
  sampleId: null,
  analysis: null,
  artwork: null,
  artHistory: loadArtHistory(),
  expansion: null,
  style: 'original' as ArtStyle,
  compareMode: false,
  narrationEnabled: true,
  audioEnabled: true,
  enteredWorld: false,
  expansionProgress: 0,
  analysisProgress: 0,
};

export const useAppStore = create<AppState>((set) => ({
  ...initial,
  setPhase: (phase) => set({ phase }),
  setImage: (imageUrl, imageFile = null, sampleId = null) =>
    set({ imageUrl, imageFile, sampleId, artwork: null }),
  setAnalysis: (analysis) => set({ analysis }),
  setArtwork: (artwork) => set({ artwork }),
  recordArtworkHistory: (artworkOverride) => {
    const { imageUrl, artwork, analysis } = useAppStore.getState();
    const resolved = artworkOverride ?? artwork;
    if (!imageUrl || !resolved) return;
    const entry = createHistoryEntry(imageUrl, resolved, analysis?.mood);
    const artHistory = appendArtHistory(entry);
    set({ artHistory });
  },
  refreshArtHistory: () => set({ artHistory: loadArtHistory() }),
  setExpansion: (expansion) => set({ expansion }),
  setStyle: (style) => set({ style }),
  setCompareMode: (compareMode) => set({ compareMode }),
  setNarrationEnabled: (narrationEnabled) => set({ narrationEnabled }),
  setAudioEnabled: (audioEnabled) => set({ audioEnabled }),
  setEnteredWorld: (enteredWorld) => set({ enteredWorld }),
  setExpansionProgress: (expansionProgress) => set({ expansionProgress }),
  setAnalysisProgress: (analysisProgress) => set({ analysisProgress }),
  reset: () => set(initial),
}));
