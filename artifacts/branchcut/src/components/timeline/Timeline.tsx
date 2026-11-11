import { useMemo } from 'react';
import { clipDuration } from '@/core/timeline';
import { timelineEnd } from '@/lib/preview';
import { ClipBlock } from './ClipBlock';
import { GhostBlock, MoveArrow } from './GhostBlock';
import { Playhead } from './Playhead';
import { Ruler } from './Ruler';
import { TrackLabel } from './TrackGutter';
import { GROUP_H, GUTTER_W, ROW_H, RULER_H, orderTracks, trackMeta } from './constants';
import type { LaneGroup } from './types';

interface Props {
  groups: LaneGroup[];
  pxPerSec: number;
  playhead: number;
  onSeek: (t: number) => void;
  selectedClipId: string | null;
  onSelectClip?: (id: string | null) => void;
  hoveredClipId: string | null;
  onHoverClip?: (id: string | null) => void;
}

/** One scroll container for all groups: shared ruler, zoom, horizontal scroll and playhead. */
export function Timeline({ groups, pxPerSec, playhead, onSeek, selectedClipId, onSelectClip, hoveredClipId, onHoverClip }: Props) {
  const tracks = useMemo(() => orderTracks(groups.map((g) => g.timeline)), [groups]);
  const end = Math.max(24, ...groups.map((g) => Math.max(timelineEnd(g.timeline), ...(g.ghosts ?? []).map((x) => x.clip.start + clipDuration(x.clip)))));
  const duration = Math.ceil(end) + 4;
  const width = duration * pxPerSec;
  const height = RULER_H + groups.reduce((h, g) => h + (g.title ? GROUP_H : 0) + tracks.length * ROW_H, 0);

  return (
    <div className="bc-scroll relative min-h-0 flex-1 overflow-auto bg-[#0b0d12]" data-testid="timeline-scroll">
      <div className="relative" style={{ width: GUTTER_W + width, height }}>
        <div className="sticky left-0 top-0 z-50 border-b border-r border-[#222733] bg-[#12151c]" style={{ width: GUTTER_W, height: RULER_H }} />
        <div className="sticky top-0 z-30 flex" style={{ height: RULER_H, marginTop: -RULER_H, paddingLeft: GUTTER_W }}>
          <Ruler duration={duration} pxPerSec={pxPerSec} onSeek={onSeek} />
        </div>
        {groups.map((g) => (
          <div key={g.id} data-testid={`lane-group-${g.id}`}>
            {g.title && (
              <div className="flex" style={{ height: GROUP_H }}>
                <div className="sticky left-0 z-40 flex shrink-0 items-center gap-1.5 border-b border-r border-[#222733] bg-[#171b24] px-2.5" style={{ width: GUTTER_W }}>
                  {g.tag && <span className="tc grid h-4 w-4 place-items-center rounded bg-[#6366f1] text-[10px] font-bold text-white">{g.tag}</span>}
                </div>
                <div className="flex flex-1 items-center border-b border-[#222733] bg-[#151923]">
                  <div className="sticky truncate px-2 text-[11px] text-[#e7e9ee]" style={{ left: GUTTER_W }}>{g.title}</div>
                </div>
              </div>
            )}
            {tracks.map((id, i) => {
              const kind = trackMeta(id).kind;
              const ghosts = (g.ghosts ?? []).filter((x) => x.clip.trackId === id);
              const arrows = (g.ghosts ?? []).filter((x) => x.kind === 'moved' && x.clip.trackId === id && x.toTrack === id);
              return (
                <div key={id} className="flex" style={{ height: ROW_H }}>
                  <TrackLabel id={id} />
                  <div
                    data-testid={`track-${g.id}-${id}`}
                    className={`bc-grid relative border-b border-[#222733]/70 ${i % 2 ? 'bg-[#0d1016]' : ''}`}
                    style={{ width, backgroundSize: `${pxPerSec}px 100%` }}
                    onClick={() => onSelectClip?.(null)}
                  >
                    {ghosts.map((x) => (
                      <GhostBlock key={'gh' + x.clip.id} ghost={x} pxPerSec={pxPerSec} anchor={`${g.id}:${x.clip.id}${x.kind === 'moved' ? ':ghost' : ''}`} hovered={hoveredClipId === x.clip.id} onHover={onHoverClip} />
                    ))}
                    {g.timeline.clips.filter((c) => c.trackId === id).map((c) => (
                      <ClipBlock
                        key={c.id} clip={c} pxPerSec={pxPerSec} kind={kind} anchor={`${g.id}:${c.id}`}
                        selected={selectedClipId === c.id} hovered={hoveredClipId === c.id} mark={g.marks?.[c.id]}
                        onSelect={onSelectClip} onHover={onHoverClip}
                      />
                    ))}
                    {arrows.map((x) => <MoveArrow key={'ar' + x.clip.id} ghost={x} pxPerSec={pxPerSec} />)}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div className="pointer-events-none absolute top-0" style={{ left: GUTTER_W }}>
          <Playhead time={playhead} pxPerSec={pxPerSec} height={height} />
        </div>
      </div>
    </div>
  );
}
