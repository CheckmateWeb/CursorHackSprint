import type { ArtHistoryEntry, ArtworkIdentification, Mood } from './types';

const STORAGE_KEY = 'living-canvas-art-history';
const MAX_ENTRIES = 24;

export function loadArtHistory(): ArtHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ArtHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveArtHistory(entries: ArtHistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    /* storage full or private mode */
  }
}

export function createHistoryEntry(
  imageUrl: string,
  identification: ArtworkIdentification,
  mood?: Mood,
): ArtHistoryEntry {
  return {
    id: `art-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    imageUrl,
    thumbnailUrl: imageUrl,
    identifiedAt: new Date().toISOString(),
    identification,
    mood,
  };
}

export function appendArtHistory(entry: ArtHistoryEntry): ArtHistoryEntry[] {
  const prev = loadArtHistory();
  const withoutDup = prev.filter(
    (e) =>
      e.identification.title !== entry.identification.title ||
      e.identification.artist !== entry.identification.artist ||
      e.imageUrl !== entry.imageUrl,
  );
  const next = [entry, ...withoutDup].slice(0, MAX_ENTRIES);
  saveArtHistory(next);
  return next;
}

export function clearArtHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
