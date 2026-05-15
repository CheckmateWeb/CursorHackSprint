import { useAppStore } from '@/store/useAppStore';
import { Landing } from '@/components/Landing';
import { AnalyzingOverlay } from '@/components/AnalyzingOverlay';
import { TransitionCinematic } from '@/components/TransitionCinematic';
import { LivingCanvas } from '@/components/spatial/LivingCanvas';
import { RoomGlow } from '@/components/spatial/RoomGlow';
import { WorldHUD } from '@/components/WorldHUD';
import { ComparePanel } from '@/components/ComparePanel';

export default function App() {
  const phase = useAppStore((s) => s.phase);
  const imageUrl = useAppStore((s) => s.imageUrl);
  const analysis = useAppStore((s) => s.analysis);
  const expansion = useAppStore((s) => s.expansion);
  const style = useAppStore((s) => s.style);

  return (
    <>
      {phase === 'landing' && <Landing />}
      {phase === 'analyzing' && <AnalyzingOverlay />}
      {phase === 'transition' && <TransitionCinematic />}
      {(phase === 'world' || phase === 'compare') && imageUrl && analysis && expansion && (
        <>
          <LivingCanvas
            imageUrl={imageUrl}
            analysis={analysis}
            expansion={expansion}
            style={style}
          />
          <RoomGlow />
          <ComparePanel />
          <WorldHUD />
        </>
      )}
    </>
  );
}
