import { useAppStore } from '@/store/useAppStore';
import './RoomGlow.css';

export function RoomGlow() {
  const analysis = useAppStore((s) => s.analysis);
  const unleashed = useAppStore((s) => s.enteredWorld);
  const progress = useAppStore((s) => s.expansionProgress);

  if (!analysis || !unleashed) return null;

  const warmth = analysis.warmth;
  const color = analysis.palette.accent;
  const secondary = analysis.palette.dominant;
  const intensity = 0.15 + (progress / 100) * 0.35;

  return (
    <div
      className="room-glow"
      style={{
        ['--glow-a' as string]: color,
        ['--glow-b' as string]: secondary,
        opacity: intensity,
        animationDuration: `${2.5 - warmth}s`,
      }}
      aria-hidden
    />
  );
}
