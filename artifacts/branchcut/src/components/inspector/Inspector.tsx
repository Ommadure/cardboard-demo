import { Lock, MousePointerClick, Plus } from 'lucide-react';
import type { RepoState } from '@/core/types';
import { useUiStore } from '@/store/useUiStore';
import { useDialogs } from '@/hooks/use-dialogs';
import { PanelHeader } from '@/components/shell/Panel';
import { btnGhost } from '@/components/shell/styles';
import { ClipForm } from './ClipForm';

export function Inspector({ repo }: { repo: RepoState }) {
  const selected = useUiStore((s) => s.selectedClipId);
  const merging = useUiStore((s) => !!s.mergeSession);
  const open = useDialogs((s) => s.open);
  const clip = repo.working.clips.find((c) => c.id === selected) ?? null;
  const reason = repo.head.type === 'detached' ? 'Viewing a commit. Read-only — create a branch to edit.' : merging ? 'Merge in progress. Editing is locked.' : null;
  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-l border-[#222733] bg-[#12151c]" data-testid="panel-inspector">
      <PanelHeader title="Inspector" meta={
        <button type="button" className={`${btnGhost} h-6 px-1.5 text-[11px]`} disabled={!!reason} onClick={() => open({ type: 'addClip' })} data-testid="button-add-clip">
          <Plus className="h-3 w-3" />Add clip at playhead
        </button>
      } />
      {reason && (
        <div className="flex items-center gap-2 border-b border-[#222733] bg-[#f59e0b]/[0.07] px-3 py-2 text-[11px] text-[#fcd34d]" data-testid="text-readonly-reason">
          <Lock className="h-3 w-3 shrink-0" />{reason}
        </div>
      )}
      <div className="bc-scroll min-h-0 flex-1 overflow-y-auto">
        {clip ? <ClipForm key={clip.id} clip={clip} repo={repo} readOnly={!!reason} /> : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
            <MousePointerClick className="h-5 w-5 text-[#8b93a7]/60" />
            <p className="text-[12px] leading-relaxed text-[#8b93a7]">Select a clip to edit its position, source range, speed and effects.</p>
            <p className="tc text-[10.5px] text-[#8b93a7]/60">{repo.working.clips.length} clips in working copy</p>
          </div>
        )}
      </div>
    </aside>
  );
}
