import type { ArtStyle } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';
import { spatialAudio } from '@/lib/spatialAudio';
import './WorldHUD.css';

const STYLES: { id: ArtStyle; label: string }[] = [
  { id: 'original', label: 'Original' },
  { id: 'oil', label: 'Oil' },
  { id: 'watercolor', label: 'Watercolor' },
  { id: 'surreal', label: 'Surreal' },
  { id: 'cyberpunk', label: 'Cyberpunk' },
  { id: 'pixel', label: 'Pixel' },
];

export function WorldHUD() {
  const analysis = useAppStore((s) => s.analysis);
  const style = useAppStore((s) => s.style);
  const setStyle = useAppStore((s) => s.setStyle);
  const compareMode = useAppStore((s) => s.compareMode);
  const setCompareMode = useAppStore((s) => s.setCompareMode);
  const narrationEnabled = useAppStore((s) => s.narrationEnabled);
  const setNarrationEnabled = useAppStore((s) => s.setNarrationEnabled);
  const audioEnabled = useAppStore((s) => s.audioEnabled);
  const setAudioEnabled = useAppStore((s) => s.setAudioEnabled);
  const unleashed = useAppStore((s) => s.enteredWorld);
  const setUnleashed = useAppStore((s) => s.setEnteredWorld);
  const expansionProgress = useAppStore((s) => s.expansionProgress);
  const reset = useAppStore((s) => s.reset);

  const toggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    if (!next) spatialAudio.stop();
    else if (analysis && unleashed) {
      void spatialAudio.init().then(() => spatialAudio.start(analysis));
    }
  };

  if (!unleashed) {
    return (
      <div className="hud-enter">
        <div className="hud-enter-panel">
          <h2>{analysis?.title}</h2>
          <p className="hud-era">{analysis?.artisticEra}</p>
          <p className="hud-enter-narration">
            {narrationEnabled
              ? analysis?.narration
              : 'The artwork will expand beyond its frame into the space around you.'}
          </p>
          <button type="button" className="btn-enter" onClick={() => setUnleashed(true)}>
            Unleash the Canvas
          </button>
          <p className="hud-controls-hint">
            Allow motion access · Turn your device to look around · Drag on desktop
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="hud">
      <header className="hud-top">
        <div className="hud-title-block">
          <span className="hud-eyebrow">Spatial expansion</span>
          <h1>{analysis?.title}</h1>
          <span className="hud-mood">
            {analysis?.mood} · {analysis?.medium}
            {expansionProgress < 100 ? ` · ${expansionProgress}%` : ''}
          </span>
        </div>
        <button type="button" className="hud-exit" onClick={reset} aria-label="Exit">
          Exit
        </button>
      </header>

      {narrationEnabled && analysis && (
        <aside className="hud-narration">{analysis.narration}</aside>
      )}

      <footer className="hud-bottom">
        <div className="hud-styles">
          {STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={style === s.id ? 'active' : ''}
              onClick={() => setStyle(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="hud-toggles">
          <button type="button" onClick={() => setCompareMode(!compareMode)}>
            {compareMode ? 'Hide' : 'Show'} Frame
          </button>
          <button type="button" onClick={() => setNarrationEnabled(!narrationEnabled)}>
            Narration {narrationEnabled ? 'On' : 'Off'}
          </button>
          <button type="button" onClick={toggleAudio}>
            Spatial Audio {audioEnabled ? 'On' : 'Off'}
          </button>
        </div>
      </footer>
    </div>
  );
}
