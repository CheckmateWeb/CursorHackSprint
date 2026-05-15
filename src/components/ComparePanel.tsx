import { useAppStore } from '@/store/useAppStore';
import './WorldHUD.css';

export function ComparePanel() {
  const imageUrl = useAppStore((s) => s.imageUrl);
  const compareMode = useAppStore((s) => s.compareMode);

  if (!compareMode || !imageUrl) return null;

  return (
    <div className="compare-panel">
      <img src={imageUrl} alt="Original artwork" />
      <span className="compare-label">Original Canvas</span>
    </div>
  );
}
