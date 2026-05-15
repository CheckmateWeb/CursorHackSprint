import { useEffect, useState } from 'react';
import { analyzePainting, simulateAnalysisProgress } from '@/lib/imageAnalysis';
import { identifyArtwork } from '@/lib/artIdentification';
import { synthesizeExpansion } from '@/lib/outpainting';
import { canUseAI } from '@/lib/aiOutpaint';
import { ArtworkInfoPanel } from '@/components/ArtworkInfoPanel';
import { useAppStore } from '@/store/useAppStore';
import './AnalyzingOverlay.css';

const STEPS = [
  'Identifying artwork and artist…',
  'Scanning the frame and reading pigment…',
  'Mapping depth planes for volumetric layers…',
  'Generating extended painting detail…',
  'Placing spatial sound in 360° around you…',
  'The canvas is preparing to spill into your space…',
];

export function AnalyzingOverlay() {
  const imageUrl = useAppStore((s) => s.imageUrl);
  const sampleId = useAppStore((s) => s.sampleId);
  const artwork = useAppStore((s) => s.artwork);
  const progress = useAppStore((s) => s.analysisProgress);
  const setAnalysis = useAppStore((s) => s.setAnalysis);
  const setArtwork = useAppStore((s) => s.setArtwork);
  const recordArtworkHistory = useAppStore((s) => s.recordArtworkHistory);
  const setExpansion = useAppStore((s) => s.setExpansion);
  const setProgress = useAppStore((s) => s.setAnalysisProgress);
  const setPhase = useAppStore((s) => s.setPhase);
  const [status, setStatus] = useState('');

  const stepIndex = Math.min(STEPS.length - 1, Math.floor((progress / 100) * STEPS.length));

  useEffect(() => {
    if (!imageUrl) return;
    let cancelled = false;

    (async () => {
      const progressSim = simulateAnalysisProgress(setProgress, 5000);
      const analysis = await analyzePainting(imageUrl);
      if (cancelled) return;
      setAnalysis(analysis);

      const identification = await identifyArtwork({
        imageUrl,
        analysis,
        sampleId,
        onStatus: setStatus,
      });
      if (cancelled) return;
      setArtwork(identification);
      recordArtworkHistory(identification);

      const expansion = await synthesizeExpansion(imageUrl, analysis, (p) => {
        if (!cancelled) setStatus(p.stage);
      });
      if (cancelled) return;
      setExpansion(expansion);
      setStatus(
        expansion.mode === 'ai'
          ? 'AI expansion complete'
          : 'Local synthesis complete — add VITE_REPLICATE_API_TOKEN for AI',
      );
      await progressSim;
      if (cancelled) return;
      setPhase('transition');
    })();

    return () => {
      cancelled = true;
    };
  }, [imageUrl, sampleId, setAnalysis, setArtwork, recordArtworkHistory, setExpansion, setProgress, setPhase]);

  return (
    <div className="analyzing">
      <div className="analyzing-frame">
        {imageUrl && <img src={imageUrl} alt="" className="analyzing-preview" />}
        <div className="analyzing-scanline" />
      </div>
      <div className="analyzing-content">
        <h2 className="analyzing-title">Unleashing the Canvas</h2>
        <p className="analyzing-step">{status || STEPS[stepIndex]}</p>
        {!canUseAI() && (
          <p className="analyzing-api-hint">
            Using texture synthesis. Set <code>VITE_REPLICATE_API_TOKEN</code> in <code>.env</code> for
            AI outpainting.
          </p>
        )}
        <div className="analyzing-bar">
          <div className="analyzing-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="analyzing-pct">{progress}%</span>
        {artwork && (
          <div className="analyzing-ident">
            <ArtworkInfoPanel artwork={artwork} compact />
          </div>
        )}
      </div>
    </div>
  );
}
