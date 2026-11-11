import { useMemo } from 'react';
import { GitBranchPlus, GitMerge, LogIn } from 'lucide-react';
import type { RepoState } from '@/core/types';
import { useUiStore } from '@/store/useUiStore';
import { useDialogs } from '@/hooks/use-dialogs';
import { usePlaybackClock } from '@/hooks/use-playback-clock';
import { requestCheckout } from '@/lib/checkout';
import { timelineEnd } from '@/lib/preview';
import { HistorySidebar } from '@/components/history/HistorySidebar';
import { Inspector } from '@/components/inspector/Inspector';
import { PreviewPlayer } from '@/components/preview/PreviewPlayer';
import { Timeline } from '@/components/timeline/Timeline';
import { TransportBar } from '@/components/timeline/TransportBar';
import { btn } from '@/components/shell/styles';

export function WorkspaceView({ repo }: { repo: RepoState }) {
  const working = repo.working;
  const duration = useMemo(() => Math.max(1, timelineEnd(working)), [working]);
  usePlaybackClock(duration);
  const playhead = useUiStore((s) => s.playhead);
  const zoom = useUiStore((s) => s.zoom);
  const selected = useUiStore((s) => s.selectedClipId);
  const hovered = useUiStore((s) => s.hoveredClipId);
  const merging = useUiStore((s) => !!s.mergeSession);
  const open = useDialogs((s) => s.open);
  const ui = useUiStore.getState();
  const groups = useMemo(() => [{ id: 'W', timeline: working }], [working]);
  const detached = repo.head.type === 'detached' ? repo.head.commitId : null;

  return (
    <div className="flex min-h-0 flex-1">
      <HistorySidebar repo={repo} />
      <main className="flex min-w-0 flex-1 flex-col bg-[#0b0d12]" data-testid="view-workspace">
        {detached && (
          <div className="flex shrink-0 items-center gap-2 border-b border-[#222733] bg-[#3b82f6]/[0.08] px-3 py-1.5 text-[12px] text-[#bfdbfe]" data-testid="banner-detached">
            Viewing <span className="tc text-[#e7e9ee]">{detached.slice(0, 7)}</span> — {repo.commits[detached]?.message}. Read-only.
            <button type="button" className={`${btn} ml-auto h-6`} onClick={() => open({ type: 'branch', from: detached })} data-testid="button-branch-here"><GitBranchPlus className="h-3 w-3" />Branch from here</button>
            <button type="button" className={`${btn} h-6`} onClick={() => requestCheckout({ type: 'branch', name: 'main' })} data-testid="button-back-main"><LogIn className="h-3 w-3" />Back to main</button>
          </div>
        )}
        {merging && (
          <div className="flex shrink-0 items-center gap-2 border-b border-[#222733] bg-[#f43f5e]/[0.08] px-3 py-1.5 text-[12px] text-[#fecdd3]">
            A merge is in progress. Editing is locked until you complete or abort it.
            <button type="button" className={`${btn} ml-auto h-6`} onClick={() => ui.setMode('merge')} data-testid="button-open-merge"><GitMerge className="h-3 w-3" />Open merge</button>
          </div>
        )}
        <div className="min-h-0 flex-1 px-4 pb-2 pt-3">
          <PreviewPlayer timeline={working} time={playhead} />
        </div>
        <section className="flex h-[340px] shrink-0 flex-col">
          <TransportBar duration={duration} />
          <Timeline
            groups={groups} pxPerSec={zoom} playhead={playhead} onSeek={ui.setPlayhead}
            selectedClipId={selected} onSelectClip={ui.setSelectedClipId} hoveredClipId={hovered} onHoverClip={ui.setHoveredClipId}
          />
        </section>
      </main>
      <Inspector repo={repo} />
    </div>
  );
}
