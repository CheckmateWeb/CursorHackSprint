import type { SceneAnalysis } from '@/lib/types';
import { InteractiveHotspot } from './InteractiveHotspot';

const HIDDEN_OBJECTS = [
  { id: 'hidden-whisper', label: 'Whisper', x: 0.18, y: 0.42, depth: 0.32, color: '#fff4d6' },
  { id: 'hidden-echo', label: 'Echo', x: 0.78, y: 0.58, depth: 0.48, color: '#d6e8ff' },
] as const;

interface Props {
  analysis: SceneAnalysis;
}

export function HiddenHotspots({ analysis }: Props) {
  return (
    <>
      {HIDDEN_OBJECTS.map((obj) => (
        <InteractiveHotspot key={obj.id} object={obj} analysis={analysis} hidden revealDistance={3.5} />
      ))}
    </>
  );
}
