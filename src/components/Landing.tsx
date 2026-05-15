import { useRef } from 'react';
import { SAMPLE_ARTWORKS } from '@/lib/sampleArtworks';
import { useAppStore } from '@/store/useAppStore';
import './Landing.css';

export function Landing() {
  const fileRef = useRef<HTMLInputElement>(null);
  const setImage = useAppStore((s) => s.setImage);
  const setPhase = useAppStore((s) => s.setPhase);

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setImage(url, file);
    setPhase('analyzing');
  };

  const selectSample = (url: string) => {
    setImage(url);
    setPhase('analyzing');
  };

  return (
    <div className="landing">
      <div className="landing-grain" aria-hidden />
      <header className="landing-header">
        <span className="landing-eyebrow">Immersive Art Experience</span>
        <h1 className="landing-title">Canvas Dreams</h1>
        <p className="landing-tagline">Step Inside the Art.</p>
        <p className="landing-sub">
          Upload a painting, sketch, or illustration — and walk through the world beyond the canvas.
        </p>
      </header>

      <div className="landing-actions">
        <button type="button" className="btn-primary" onClick={() => fileRef.current?.click()}>
          <span className="btn-glow" />
          Upload Your Artwork
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
        <p className="landing-hint">or choose a masterpiece to explore</p>
      </div>

      <div className="sample-grid">
        {SAMPLE_ARTWORKS.map((art) => (
          <button
            key={art.id}
            type="button"
            className="sample-card"
            onClick={() => selectSample(art.url)}
          >
            <img src={art.url} alt={art.name} />
            <span className="sample-name">{art.name}</span>
          </button>
        ))}
      </div>

      <footer className="landing-footer">
        <p>Where Paintings Come Alive</p>
        <p className="landing-credits">Walk Through Imagination</p>
      </footer>
    </div>
  );
}
