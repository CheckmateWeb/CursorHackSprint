import { useEffect } from 'react';
import { analyzePainting, simulateAnalysisProgress } from '@/lib/imageAnalysis';
import { useAppStore } from '@/store/useAppStore';
import './AnalyzingOverlay.css';

const STEPS = [
  'Reading colors and emotional atmosphere…',
  'Estimating depth and spatial layers…',
  'Reconstructing the painted world…',
  'Composing ambient soundscape…',
  'Awakening brushstrokes and light…',
];

export function AnalyzingOverlay() {
  const imageUrl = useAppStore((s) => s.imageUrl);
  const progress = useAppStore((s) => s.analysisProgress);
  const setAnalysis = useAppStore((s) => s.setAnalysis);
  const setProgress = useAppStore((s) => s.setAnalysisProgress);
  const setPhase = useAppStore((s) => s.setPhase);

  const stepIndex = Math.min(STEPS.length - 1, Math.floor((progress / 100) * STEPS.length));

  useEffect(() => {
    if (!imageUrl) return;
    let cancelled = false;

    (async () => {
      const [analysis] = await Promise.all([
        analyzePainting(imageUrl),
        simulateAnalysisProgress(setProgress, 3400),
      ]);
      if (cancelled) return;
      setAnalysis(analysis);
      setPhase('transition');
    })();

    return () => {
      cancelled = true;
    };
  }, [imageUrl, setAnalysis, setProgress, setPhase]);

  return (
    <div className="analyzing">
      <div className="analyzing-frame">
        {imageUrl && <img src={imageUrl} alt="" className="analyzing-preview" />}
        <div className="analyzing-scanline" />
      </div>
      <div className="analyzing-content">
        <h2 className="analyzing-title">Entering the Canvas</h2>
        <p className="analyzing-step">{STEPS[stepIndex]}</p>
        <div className="analyzing-bar">
          <div className="analyzing-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="analyzing-pct">{progress}%</span>
      </div>
    </div>
  );
}
