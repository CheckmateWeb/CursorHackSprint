import { useAppStore } from '@/store/useAppStore';
import { Landing } from '@/components/Landing';
import { AnalyzingOverlay } from '@/components/AnalyzingOverlay';
import { TransitionCinematic } from '@/components/TransitionCinematic';
import { PaintingWorld } from '@/components/world/PaintingWorld';
import { WorldHUD } from '@/components/WorldHUD';
import { ComparePanel } from '@/components/ComparePanel';

export default function App() {
  const phase = useAppStore((s) => s.phase);
  const imageUrl = useAppStore((s) => s.imageUrl);
  const analysis = useAppStore((s) => s.analysis);
  const style = useAppStore((s) => s.style);

  return (
    <>
      {phase === 'landing' && <Landing />}
      {phase === 'analyzing' && <AnalyzingOverlay />}
      {phase === 'transition' && <TransitionCinematic />}
      {(phase === 'world' || phase === 'compare') && imageUrl && analysis && (
        <>
          <PaintingWorld imageUrl={imageUrl} analysis={analysis} style={style} />
          <ComparePanel />
          <WorldHUD />
        </>
      )}
    </>
  );
}
