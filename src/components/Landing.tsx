import { useEffect, useRef } from 'react';
import { SAMPLE_ARTWORKS } from '@/lib/sampleArtworks';
import { ArtHistoryList } from '@/components/ArtworkInfoPanel';
import { useAppStore } from '@/store/useAppStore';
import './Landing.css';

export function Landing() {
  const fileRef = useRef<HTMLInputElement>(null);
  const setImage = useAppStore((s) => s.setImage);
  const setPhase = useAppStore((s) => s.setPhase);
  const artHistory = useAppStore((s) => s.artHistory);
  const refreshArtHistory = useAppStore((s) => s.refreshArtHistory);

  useEffect(() => {
    refreshArtHistory();
  }, [refreshArtHistory]);

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setImage(url, file, null);
    setPhase('analyzing');
  };

  const selectSample = (id: string, url: string) => {
    setImage(url, null, id);
    setPhase('analyzing');
  };

  return (
    <div className="landing">
      <div className="landing-grain" aria-hidden />
      <header className="landing-header">
        <span className="landing-eyebrow">AR Spatial Expansion</span>
        <h1 className="landing-title">The Living Canvas</h1>
        <p className="landing-tagline">Where paintings spill into your world.</p>
        <p className="landing-sub">
          Scan or upload artwork — AI extrapolates style, depth, and atmosphere into a 360°
          motion-tracked space that wraps around you.
        </p>
      </header>

      <div className="landing-actions">
        <button type="button" className="btn-primary" onClick={() => fileRef.current?.click()}>
          <span className="btn-glow" />
          Scan / Upload Artwork
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <p className="landing-hint">or choose a sample to unleash</p>
      </div>

      <div className="sample-grid">
        {SAMPLE_ARTWORKS.map((art) => (
          <button
            key={art.id}
            type="button"
            className="sample-card"
            onClick={() => selectSample(art.id, art.url)}
          >
            <img src={art.url} alt={art.name} />
            <span className="sample-name">{art.name}</span>
          </button>
        ))}
      </div>

      {artHistory.length > 0 && (
        <section className="landing-history" aria-label="Gallery history">
          <h2>Your gallery history</h2>
          <ArtHistoryList entries={artHistory} />
        </section>
      )}

      <footer className="landing-footer">
        <p>The frame is only the beginning.</p>
        <p className="landing-credits">Move your device — the world follows</p>
      </footer>
    </div>
  );
}
