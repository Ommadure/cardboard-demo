import { Captions, Film, Layers, Mic, Music, Waves } from 'lucide-react';
import type { TrackId } from '@/core/types';
import { GUTTER_W, trackMeta } from './constants';

const ICONS: Record<string, typeof Film> = { V1: Film, V2: Layers, A1: Mic, A2: Music, A3: Waves, C1: Captions };

export function TrackLabel({ id }: { id: TrackId }) {
  const meta = trackMeta(id);
  const Icon = ICONS[id] ?? (meta.kind === 'video' ? Layers : meta.kind === 'audio' ? Waves : Captions);
  return (
    <div
      data-testid={`track-label-${id}`}
      className="sticky left-0 z-40 flex shrink-0 items-center gap-2 border-b border-r border-[#222733] bg-[#12151c] px-2.5"
      style={{ width: GUTTER_W }}
    >
      <span className="tc w-6 text-[11px] font-semibold text-[#e7e9ee]">{id}</span>
      <Icon className="h-3 w-3 shrink-0 text-[#8b93a7]" />
      <span className="truncate text-[10.5px] text-[#8b93a7]">{meta.name}</span>
    </div>
  );
}
