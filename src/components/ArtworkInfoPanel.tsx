import type { ArtHistoryEntry, ArtworkIdentification } from '@/lib/types';
import './ArtworkInfoPanel.css';

interface Props {
  artwork: ArtworkIdentification;
  compact?: boolean;
}

export function ArtworkInfoPanel({ artwork, compact = false }: Props) {
  const pct = Math.round(artwork.confidence * 100);
  const sourceLabel =
    artwork.source === 'catalog'
      ? 'Masterpiece match'
      : artwork.source === 'ai'
        ? 'AI art historian'
        : artwork.source === 'sample'
          ? 'Sample library'
          : 'Style analysis';

  return (
    <article className={`artwork-info ${compact ? 'artwork-info--compact' : ''}`}>
      <header className="artwork-info__header">
        <span className="artwork-info__badge">{sourceLabel}</span>
        {artwork.isKnownMasterpiece && (
          <span className="artwork-info__masterpiece">Recognized masterpiece</span>
        )}
      </header>
      <h3 className="artwork-info__title">{artwork.title}</h3>
      <p className="artwork-info__artist">{artwork.artist}</p>
      <dl className="artwork-info__meta">
        {artwork.year && (
          <>
            <dt>Year</dt>
            <dd>{artwork.year}</dd>
          </>
        )}
        {artwork.movement && (
          <>
            <dt>Movement</dt>
            <dd>{artwork.movement}</dd>
          </>
        )}
        {artwork.medium && (
          <>
            <dt>Medium</dt>
            <dd>{artwork.medium}</dd>
          </>
        )}
        <dt>Confidence</dt>
        <dd>{pct}%</dd>
      </dl>
      {!compact && <p className="artwork-info__history">{artwork.history}</p>}
    </article>
  );
}

interface HistoryProps {
  entries: ArtHistoryEntry[];
  onSelect?: (entry: ArtHistoryEntry) => void;
}

export function ArtHistoryList({ entries, onSelect }: HistoryProps) {
  if (entries.length === 0) {
    return (
      <p className="art-history-empty">
        Upload artwork to build your gallery history — title, artist, and context are saved here.
      </p>
    );
  }

  return (
    <ul className="art-history-list">
      {entries.map((entry) => (
        <li key={entry.id}>
          <button
            type="button"
            className="art-history-item"
            onClick={() => onSelect?.(entry)}
            title={entry.identification.history}
          >
            <img src={entry.thumbnailUrl} alt="" className="art-history-thumb" />
            <div className="art-history-text">
              <strong>{entry.identification.title}</strong>
              <span>{entry.identification.artist}</span>
              <time dateTime={entry.identifiedAt}>
                {new Date(entry.identifiedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </time>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
