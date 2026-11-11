import type { RepoState } from '@/core/types';
import { getHeadId } from '@/store/useRepoStore';
import { useUiStore } from '@/store/useUiStore';
import { PanelHeader } from '@/components/shell/Panel';
import { HistoryGraph } from './HistoryGraph';
import { CommitList } from './CommitList';

export function HistorySidebar({ repo }: { repo: RepoState }) {
  const selected = useUiStore((s) => s.selectedCommitId);
  const headId = getHeadId(repo);
  const onSelect = (id: string, shift: boolean) => {
    const ui = useUiStore.getState();
    if (shift && selected && selected !== id) {
      const pair = [selected, id].sort((a, b) => repo.commits[a]!.createdAt - repo.commits[b]!.createdAt) as [string, string];
      ui.setComparePair(pair);
      ui.setMode('compare');
      return;
    }
    ui.setSelectedCommitId(selected === id ? null : id);
  };
  return (
    <aside className="flex w-[280px] shrink-0 flex-col border-r border-[#222733] bg-[#12151c]" data-testid="sidebar-history">
      <PanelHeader title="History" meta={<span className="text-[10px] text-[#8b93a7]/70">Shift-click to compare</span>} />
      <div className="bc-scroll max-h-[46%] shrink-0 overflow-auto border-b border-[#222733] py-1">
        <HistoryGraph repo={repo} headId={headId} selectedId={selected} onSelect={onSelect} />
      </div>
      <PanelHeader title="Commits" meta={<span className="tc text-[10.5px] text-[#8b93a7]">{Object.keys(repo.commits).length}</span>} />
      <div className="bc-scroll min-h-0 flex-1 overflow-y-auto">
        <CommitList repo={repo} headId={headId} selectedId={selected} />
      </div>
    </aside>
  );
}
