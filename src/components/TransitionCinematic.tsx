import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import './TransitionCinematic.css';

export function TransitionCinematic() {
  const analysis = useAppStore((s) => s.analysis);
  const imageUrl = useAppStore((s) => s.imageUrl);
  const setPhase = useAppStore((s) => s.setPhase);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFade(true), 800);
    const t2 = setTimeout(() => setPhase('world'), 4200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [setPhase]);

  return (
    <div className={`transition ${fade ? 'transition--fade' : ''}`}>
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="transition-art"
          style={{ filter: `sepia(${analysis?.warmth ?? 0.5})` }}
        />
      )}
      <div className="transition-vignette" />
      <div className="transition-text">
        <p className="transition-eyebrow">The frame breaks open</p>
        <h2 className="transition-title">{analysis?.title ?? 'The Living Canvas'}</h2>
        <p className="transition-mood">{analysis?.artisticEra ?? analysis?.mood}</p>
      </div>
    </div>
  );
}
