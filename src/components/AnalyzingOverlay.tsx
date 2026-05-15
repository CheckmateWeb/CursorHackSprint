import { useEffect } from 'react';
import { analyzePainting, simulateAnalysisProgress } from '@/lib/imageAnalysis';
import { synthesizeExpansion } from '@/lib/outpainting';
import { useAppStore } from '@/store/useAppStore';
import './AnalyzingOverlay.css';

const STEPS = [
  'Scanning the frame and reading pigment…',
  'Mapping depth planes for volumetric layers…',
  'Synthesizing outpainted worlds beyond the crop…',
  'Placing spatial sound in 360° around you…',
  'The canvas is preparing to spill into your space…',
];

export function AnalyzingOverlay() {
  const imageUrl = useAppStore((s) => s.imageUrl);
  const progress = useAppStore((s) => s.analysisProgress);
  const setAnalysis = useAppStore((s) => s.setAnalysis);
  const setExpansion = useAppStore((s) => s.setExpansion);
  const setProgress = useAppStore((s) => s.setAnalysisProgress);
  const setPhase = useAppStore((s) => s.setPhase);

  const stepIndex = Math.min(STEPS.length - 1, Math.floor((progress / 100) * STEPS.length));

  useEffect(() => {
    if (!imageUrl) return;
    let cancelled = false;

    (async () => {
      const progressSim = simulateAnalysisProgress(setProgress, 4200);
      const analysis = await analyzePainting(imageUrl);
      if (cancelled) return;
      setAnalysis(analysis);
      const expansion = await synthesizeExpansion(imageUrl, analysis);
      if (cancelled) return;
      setExpansion(expansion);
      await progressSim;
      if (cancelled) return;
      setPhase('transition');
    })();

    return () => {
      cancelled = true;
    };
  }, [imageUrl, setAnalysis, setExpansion, setProgress, setPhase]);

  return (
    <div className="analyzing">
      <div className="analyzing-frame">
        {imageUrl && <img src={imageUrl} alt="" className="analyzing-preview" />}
        <div className="analyzing-scanline" />
        <div className="analyzing-frame-border" aria-hidden />
      </div>
      <div className="analyzing-content">
        <h2 className="analyzing-title">Unleashing the Canvas</h2>
        <p className="analyzing-step">{STEPS[stepIndex]}</p>
        <div className="analyzing-bar">
          <div className="analyzing-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="analyzing-pct">{progress}%</span>
      </div>
    </div>
  );
}
