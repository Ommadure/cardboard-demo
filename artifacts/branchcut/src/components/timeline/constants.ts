import type { Timeline, TrackId } from '@/core/types';

export type TrackKind = 'video' | 'audio' | 'text';
export const TRACKS: { id: TrackId; name: string; kind: TrackKind }[] = [
  { id: 'V1', name: 'Video', kind: 'video' },
  { id: 'V2', name: 'B-roll', kind: 'video' },
  { id: 'A1', name: 'Voiceover', kind: 'audio' },
  { id: 'A2', name: 'Music', kind: 'audio' },
  { id: 'A3', name: 'SFX', kind: 'audio' },
  { id: 'C1', name: 'Captions', kind: 'text' },
];
export const ROW_H = 44;
export const RULER_H = 26;
export const GROUP_H = 24;
export const GUTTER_W = 96;
export const ZOOM_MIN = 20;
export const ZOOM_MAX = 120;
export const ZOOM_STEP = 4;
export const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z)));

const FAMILY: Record<string, number> = { V: 0, A: 1, C: 2 };
export function trackMeta(id: TrackId): { id: TrackId; name: string; kind: TrackKind } {
  const known = TRACKS.find((t) => t.id === id);
  if (known) return known;
  const kind: TrackKind = id[0] === 'V' ? 'video' : id[0] === 'A' ? 'audio' : 'text';
  return { id, name: 'Overflow', kind };
}
export function orderTracks(timelines: Timeline[]): TrackId[] {
  const set = new Set<TrackId>(TRACKS.map((t) => t.id));
  timelines.forEach((t) => t.clips.forEach((c) => set.add(c.trackId)));
  return [...set].sort((a, b) => (FAMILY[a[0]!] ?? 9) - (FAMILY[b[0]!] ?? 9) || Number(a.slice(1)) - Number(b.slice(1)));
}
