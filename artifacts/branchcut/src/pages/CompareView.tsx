import { useMemo } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import type { Change, RepoState } from '@/core/types';
import { diffTimelines } from '@/core/diff';
import { getHeadId } from '@/store/useRepoStore';
import { useUiStore } from '@/store/useUiStore';
import { usePlaybackClock } from '@/hooks/use-playback-clock';
import { scrollToAnchor, timelineEnd } from '@/lib/preview';
import { HistorySidebar } from '@/components/history/HistorySidebar';
import { PreviewPlayer } from '@/components/preview/PreviewPlayer';
import { Timeline } from '@/components/timeline/Timeline';
import { TransportBar } from '@/components/timeline/TransportBar';
import type { ClipMark, Ghost, LaneGroup } from '@/components/timeline/types';
import { CommitSelect } from '@/components/compare/CommitSelect';
import { WhatChanged } from '@/components/compare/WhatChanged';
import { btnGhost } from '@/components/shell/styles';

export function CompareView({ repo }: { repo: RepoState }) {
  const pair = useUiStore((s) => s.comparePair);
  const playhead = useUiStore((s) => s.playhead);
  const zoom = useUiStore((s) => s.zoom);
  const selected = useUiStore((s) => s.selectedClipId);
  const hovered = useUiStore((s) => s.hoveredClipId);
  const ui = useUiStore.getState();
  const head = getHeadId(repo);
  const aId = repo.commits[pair[0]] ? pair[0] : head;
  const bId = repo.commits[pair[1]] ? pair[1] : head;
  const A = repo.commits[aId]!;
  const Bc = repo.commits[bId]!;

  const changes = useMemo(() => diffTimelines(A.timeline, Bc.timeline), [A, Bc]);
  const groups = useMemo<LaneGroup[]>(() => {
    const marks: Record<string, ClipMark> = {};
    const ghosts: Ghost[] = [];
    for (const c of changes) {
      if (c.kind === 'removed') { if (c.before) ghosts.push({ clip: c.before, kind: 'removed' }); continue; }
      (marks[c.clipId] ??= { kinds: [] }).kinds!.push(c.kind);
      if (c.kind === 'moved' && c.before && c.after) ghosts.push({ clip: c.before, kind: 'moved', toStart: c.after.start, toTrack: c.after.trackId });
    }
    return [
      { id: 'A', tag: 'A', title: <span><span className="tc text-[#8b93a7]">{A.id.slice(0, 7)}</span> {A.message} <span className="text-[#8b93a7]">· {A.author}</span></span>, timeline: A.timeline },
      { id: 'B', tag: 'B', title: <span><span className="tc text-[#8b93a7]">{Bc.id.slice(0, 7)}</span> {Bc.message} <span className="text-[#8b93a7]">· {Bc.author} · changes drawn here</span></span>, timeline: Bc.timeline, marks, ghosts },
    ];
  }, [changes, A, Bc]);
  const duration = Math.max(1, timelineEnd(A.timeline), timelineEnd(Bc.timeline));
  usePlaybackClock(duration);

  const focus = (c: Change) => {
    const clip = c.after ?? c.before;
    if (clip) ui.setPlayhead(clip.start + 0.01);
    ui.setSelectedClipId(c.clipId);
    requestAnimationFrame(() => scrollToAnchor(`B:${c.clipId}`));
  };

  return (
    <div className="flex min-h-0 flex-1">
      <HistorySidebar repo={repo} />
      <main className="flex min-w-0 flex-1 flex-col bg-[#0b0d12]" data-testid="view-compare">
        <div className="flex shrink-0 items-center gap-2 border-b border-[#222733] bg-[#12151c] px-3 py-1.5">
          <span className="tc grid h-4 w-4 place-items-center rounded bg-[#6366f1] text-[10px] font-bold text-white">A</span>
          <div className="w-[260px]"><CommitSelect repo={repo} value={aId} onChange={(id) => ui.setComparePair([id, bId])} testId="select-pair-a" /></div>
          <button type="button" className={`${btnGhost} w-7 px-0`} aria-label="Swap A and B" onClick={() => ui.setComparePair([bId, aId])} data-testid="button-swap-pair"><ArrowLeftRight className="h-3.5 w-3.5" /></button>
          <span className="tc grid h-4 w-4 place-items-center rounded bg-[#6366f1] text-[10px] font-bold text-white">B</span>
          <div className="w-[260px]"><CommitSelect repo={repo} value={bId} onChange={(id) => ui.setComparePair([aId, id])} testId="select-pair-b" /></div>
        </div>
        <div className="grid min-h-0 flex-[0_0_36%] grid-cols-2 gap-3 px-4 pb-2 pt-2">
          <PreviewPlayer timeline={A.timeline} time={playhead} tag="A" title={A.message} testId="preview-a" />
          <PreviewPlayer timeline={Bc.timeline} time={playhead} tag="B" title={Bc.message} testId="preview-b" />
        </div>
        <section className="flex min-h-0 flex-1 flex-col">
          <TransportBar duration={duration} />
          <Timeline
            groups={groups} pxPerSec={zoom} playhead={playhead} onSeek={ui.setPlayhead}
            selectedClipId={selected} onSelectClip={ui.setSelectedClipId} hoveredClipId={hovered} onHoverClip={ui.setHoveredClipId}
          />
        </section>
      </main>
      <WhatChanged changes={changes} hoveredId={hovered} onHover={ui.setHoveredClipId} onFocus={focus} />
    </div>
  );
}
