import { useEffect, useMemo, useState } from 'react';
import { GitMerge, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Change, Conflict, MergeSession, RepoState } from '@/core/types';
import { applyResolutions, previewResolutions } from '@/core/merge';
import { findOverlaps } from '@/core/timeline';
import { useRepoStore } from '@/store/useRepoStore';
import { useUiStore } from '@/store/useUiStore';
import { useDialogs } from '@/hooks/use-dialogs';
import { usePlaybackClock } from '@/hooks/use-playback-clock';
import { errorText, run } from '@/lib/run';
import { scrollToAnchor, timelineEnd } from '@/lib/preview';
import { PreviewPlayer } from '@/components/preview/PreviewPlayer';
import { Timeline } from '@/components/timeline/Timeline';
import { TransportBar } from '@/components/timeline/TransportBar';
import type { ClipMark, LaneGroup } from '@/components/timeline/types';
import { ChangeItem } from '@/components/compare/WhatChanged';
import { ConflictCard } from '@/components/merge/ConflictCard';
import { PanelHeader } from '@/components/shell/Panel';
import { btn, btnPrimary, inputCls, labelCls } from '@/components/shell/styles';

const pairId = (a: string, b: string) => { const [x, y] = [a, b].sort((p, q) => p.localeCompare(q)); return `collision:${x}:${y}`; };

export function MergeView({ repo }: { repo: RepoState }) {
  const session = useUiStore((s) => s.mergeSession);
  const open = useDialogs((s) => s.open);
  if (!session) {
    const branch = repo.head.type === 'branch' ? repo.head.name : null;
    return (
      <div className="grid flex-1 place-items-center bg-[#0b0d12]" data-testid="view-merge-empty">
        <div className="bc-rise w-[400px] rounded-[10px] border border-[#222733] bg-[#12151c] p-6 text-center">
          <GitMerge className="mx-auto mb-3 h-6 w-6 text-[#6366f1]" />
          <h2 className="text-[15px] font-semibold text-[#e7e9ee]">No merge in progress</h2>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#8b93a7]">
            {branch ? <>Bring another branch into <span className="tc text-[#e7e9ee]">{branch}</span>. Non-overlapping edits apply automatically; you decide the rest.</> : 'Check out a branch first. Detached commits cannot receive merges.'}
          </p>
          <button type="button" className={`${btnPrimary} mt-4`} disabled={!branch} onClick={() => open({ type: 'merge' })} data-testid="button-start-merge">Choose branch to merge</button>
        </div>
      </div>
    );
  }
  return <ActiveMerge key={session.theirsId + session.oursId} session={session} />;
}

function ActiveMerge({ session }: { session: MergeSession }) {
  const ui = useUiStore.getState();
  const playhead = useUiStore((s) => s.playhead);
  const zoom = useUiStore((s) => s.zoom);
  const selected = useUiStore((s) => s.selectedClipId);
  const hovered = useUiStore((s) => s.hoveredClipId);
  const resolveConflict = useRepoStore((s) => s.resolveConflict);
  const completeMerge = useRepoStore((s) => s.completeMerge);
  const abortMerge = useRepoStore((s) => s.abortMerge);
  const [message, setMessage] = useState(`Merge '${session.theirsBranch}' into '${session.oursBranch}'`);

  const preview = useMemo(() => previewResolutions(session.result, session.resolutions), [session]);
  const active = useMemo(() => new Set(findOverlaps(preview.timeline).map(([a, b]) => pairId(a.id, b.id))), [preview]);
  const isOpen = (c: Conflict) => !session.resolutions[c.id] && (c.kind !== 'collision' || active.has(c.id));
  const unresolved = preview.conflicts.filter(isOpen);
  const visible = preview.conflicts.filter((c) => c.kind !== 'collision' || active.has(c.id) || session.resolutions[c.id] || session.result.conflicts.some((o) => o.id === c.id));
  const blocker = useMemo(() => { try { applyResolutions(session.result, session.resolutions); return null; } catch (e) { return errorText(e); } }, [session]);
  const autoCount = session.result.appliedFromTheirs.length + session.result.keptFromOurs.length;

  const groups = useMemo<LaneGroup[]>(() => {
    const marks: Record<string, ClipMark> = {};
    for (const c of preview.conflicts) {
      const open = !session.resolutions[c.id] && (c.kind !== 'collision' || active.has(c.id));
      if (c.kind === 'collision' && !open && !session.resolutions[c.id]) continue;
      for (const id of [c.clipId, c.collidesWith]) if (id) marks[id] = open ? { conflict: true } : { resolved: true };
    }
    return [{ id: 'M', tag: 'M', title: <span>Merged result <span className="text-[#8b93a7]">· live preview of your choices</span></span>, timeline: preview.timeline, marks }];
  }, [preview, session.resolutions, active]);
  const duration = Math.max(1, timelineEnd(preview.timeline));
  usePlaybackClock(duration);

  useEffect(() => { ui.setPlaying(false); }, [ui.setPlaying]);

  const focusClip = (id: string, start?: number) => {
    if (start !== undefined) ui.setPlayhead(start + 0.01);
    ui.setSelectedClipId(id);
    requestAnimationFrame(() => scrollToAnchor(`M:${id}`));
  };
  const focusChange = (c: Change) => focusClip(c.clipId, (c.after ?? c.before)?.start);
  const focusConflict = (c: Conflict) => focusClip(c.clipId, (c.oursClip ?? c.theirsClip ?? c.baseClip)?.start);
  const resolve = (id: string, r: 'ours' | 'theirs' | 'both') => run(() => resolveConflict(id, r));
  const complete = () => run(() => completeMerge(message), (id) => `Merge commit ${id.slice(0, 7)} created on ${session.oursBranch}`);
  const abort = () => { if (run(() => abortMerge()).ok) toast('Merge aborted. Nothing changed.'); };

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="view-merge">
      <div className="flex shrink-0 items-center gap-3 border-b border-[#222733] bg-[#12151c] px-4 py-2">
        <GitMerge className="h-4 w-4 text-[#6366f1]" />
        <span className="text-[13px] text-[#e7e9ee]">Merging <span className="tc font-semibold">{session.theirsBranch}</span> into <span className="tc font-semibold">{session.oursBranch}</span></span>
        <span className="tc text-[11px] text-[#8b93a7]">base {session.baseId.slice(0, 7)}</span>
        <span className="ml-auto text-[12.5px] font-medium text-[#e7e9ee]" data-testid="text-merge-summary">
          <span className="text-[#f43f5e]">{visible.length} conflicts</span>, {autoCount} changes applied automatically
        </span>
        <span className={`tc rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${unresolved.length ? 'bg-[#f43f5e]/15 text-[#fda4af]' : 'bg-[#22c55e]/15 text-[#86efac]'}`} data-testid="text-unresolved">
          {unresolved.length ? `${unresolved.length} unresolved` : 'All resolved'}
        </span>
      </div>
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[280px] shrink-0 flex-col border-r border-[#222733] bg-[#12151c]" data-testid="panel-auto-applied">
          <PanelHeader title="Applied automatically" meta={<span className="tc text-[10.5px] text-[#8b93a7]">{autoCount}</span>} />
          <div className="bc-scroll min-h-0 flex-1 overflow-y-auto p-2">
            {[{ from: session.theirsBranch, list: session.result.appliedFromTheirs, id: 'theirs' }, { from: session.oursBranch, list: session.result.keptFromOurs, id: 'ours' }].map((g) => (
              <section key={g.id} className="mb-3" data-testid={`auto-${g.id}`}>
                <h3 className="mb-0.5 flex items-center gap-1.5 px-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#8b93a7]">
                  From <span className="tc normal-case tracking-normal text-[#e7e9ee]">{g.from}</span><span className="tc">{g.list.length}</span>
                </h3>
                {g.list.length === 0 ? <p className="px-2 text-[11.5px] text-[#8b93a7]/70">Nothing from this side.</p> : (
                  <ul>{g.list.map((c) => <ChangeItem key={c.clipId + c.kind} change={c} hovered={hovered === c.clipId} onHover={ui.setHoveredClipId} onFocus={focusChange} />)}</ul>
                )}
              </section>
            ))}
          </div>
        </aside>
        <main className="flex min-w-0 flex-1 flex-col bg-[#0b0d12]">
          <div className="min-h-0 flex-1 px-4 pb-2 pt-3"><PreviewPlayer timeline={preview.timeline} time={playhead} testId="preview-merge" /></div>
          <section className="flex h-[340px] shrink-0 flex-col">
            <TransportBar duration={duration} />
            <Timeline groups={groups} pxPerSec={zoom} playhead={playhead} onSeek={ui.setPlayhead}
              selectedClipId={selected} onSelectClip={ui.setSelectedClipId} hoveredClipId={hovered} onHoverClip={ui.setHoveredClipId} />
          </section>
        </main>
        <aside className="flex w-[320px] shrink-0 flex-col border-l border-[#222733] bg-[#12151c]" data-testid="panel-conflicts">
          <PanelHeader title="Conflicts" meta={<span className="tc text-[10.5px] text-[#8b93a7]">{visible.length - unresolved.length}/{visible.length} resolved</span>} />
          <div className="bc-scroll min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
            {visible.map((c) => (
              <ConflictCard key={c.id} conflict={c} active={active.has(c.id)} oursBranch={session.oursBranch} theirsBranch={session.theirsBranch}
                merged={preview.timeline} hovered={hovered === c.clipId} onResolve={resolve} onHover={ui.setHoveredClipId} onFocus={focusConflict} />
            ))}
          </div>
          <form className="shrink-0 space-y-2 border-t border-[#222733] p-3" onSubmit={(e) => { e.preventDefault(); if (!blocker && message.trim()) complete(); }}>
            <label className={labelCls} htmlFor="merge-message">Merge message</label>
            <input id="merge-message" className={inputCls} value={message} onChange={(e) => setMessage(e.target.value)} data-testid="input-merge-message" />
            {(blocker || !message.trim()) && (
              <p className="text-[10.5px] leading-snug text-[#fda4af]" data-testid="text-merge-blocker">
                {unresolved.length ? `Resolve ${unresolved.length} more conflict${unresolved.length === 1 ? '' : 's'} to finish.` : blocker ?? 'Enter a merge message.'}
              </p>
            )}
            <div className="flex gap-2">
              <button type="button" className={`${btn} flex-1`} onClick={abort} data-testid="button-abort-merge"><X className="h-3.5 w-3.5" />Abort merge</button>
              <button type="submit" className={`${btnPrimary} flex-1`} disabled={!!blocker || !message.trim()} data-testid="button-complete-merge"><GitMerge className="h-3.5 w-3.5" />Complete merge</button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}
