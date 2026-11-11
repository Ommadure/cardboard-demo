import type { Clip, EffectId, Timeline, TrackId } from '@/core/types';
import { clipDuration } from '@/core/timeline';

export const clipEnd = (c: Clip) => c.start + clipDuration(c);
export const timelineEnd = (t: Timeline) => t.clips.reduce((m, c) => Math.max(m, clipEnd(c)), 0);

export function activeClip(t: Timeline, trackId: TrackId, time: number): Clip | null {
  return t.clips.find((c) => c.trackId === trackId && time >= c.start && time < clipEnd(c)) ?? null;
}
export function activeOnFamily(t: Timeline, family: 'V' | 'A' | 'C', time: number): Clip[] {
  return t.clips
    .filter((c) => c.trackId.startsWith(family) && time >= c.start && time < clipEnd(c))
    .sort((a, b) => Number(a.trackId.slice(1)) - Number(b.trackId.slice(1)));
}

const FILTERS: Partial<Record<EffectId, string>> = {
  warm: 'sepia(0.4) saturate(1.2)', cool: 'hue-rotate(160deg) saturate(1.1)', bw: 'grayscale(1)',
};
export function effectFilter(effects: EffectId[]): string {
  const parts = effects.map((e) => FILTERS[e]).filter(Boolean);
  return parts.length ? parts.join(' ') : 'none';
}
export function fadeOpacity(c: Clip, time: number): number {
  let o = 1;
  if (c.effects.includes('fade-in')) o = Math.min(o, (time - c.start) / 0.5);
  if (c.effects.includes('fade-out')) o = Math.min(o, (clipEnd(c) - time) / 0.5);
  return Math.max(0, Math.min(1, o));
}
export function scrollToAnchor(anchor: string) {
  const el = document.querySelector(`[data-anchor="${CSS.escape(anchor)}"]`);
  el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}
