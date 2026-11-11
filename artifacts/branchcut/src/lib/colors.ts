import type { MediaSource, TrackId } from '@/core/types';
import { MEDIA_LIBRARY } from '@/core/seed';

const NAMED: Record<string, string> = {
  indigo: '#6366f1', teal: '#14b8a6', orange: '#f97316', pink: '#ec4899',
  slate: '#64748b', stone: '#a8a29e', amber: '#d97706',
};
const TRACK_FALLBACK: Record<string, string> = { A1: '#2f8f9d', A2: '#7c6bc4', A3: '#b7793f', C1: '#56607a' };

export const SOURCES = new Map<string, MediaSource>(MEDIA_LIBRARY.map((m) => [m.id, m]));
export const sourceOf = (id: string) => SOURCES.get(id);

export function clipColor(sourceId: string, trackId: TrackId): string {
  const named = SOURCES.get(sourceId)?.color;
  if (named) return NAMED[named] ?? named;
  return TRACK_FALLBACK[trackId] ?? (trackId.startsWith('A') ? '#2f8f9d' : trackId.startsWith('C') ? '#56607a' : '#64748b');
}

export const LANE_COLORS = ['#6366f1', '#2dd4bf', '#f472b6', '#facc15', '#38bdf8', '#fb923c'];
