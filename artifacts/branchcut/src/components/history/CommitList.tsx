import { Eye, GitBranchPlus, GitCompare, GitMerge, LogIn } from 'lucide-react';
import type { Commit, RepoState } from '@/core/types';
import { requestCheckout } from '@/lib/checkout';
import { useDialogs } from '@/hooks/use-dialogs';
import { useUiStore } from '@/store/useUiStore';

const mini = 'inline-flex h-6 items-center gap-1 rounded border border-[#222733] bg-[#171b24] px-1.5 text-[10.5px] text-[#e7e9ee] transition-colors duration-150 hover:bg-[#1d2230] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]/60';

export function CommitList({ repo, headId, selectedId }: { repo: RepoState; headId: string; selectedId: string | null }) {
  const commits = Object.values(repo.commits).sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id));
  const branchesAt = (id: string) => Object.entries(repo.branches).filter(([, c]) => c === id).map(([n]) => n);
  return (
    <ol className="py-1" data-testid="commit-list">
      {commits.map((c) => (
        <Row key={c.id} c={c} head={c.id === headId} selected={c.id === selectedId} branches={branchesAt(c.id)} headId={headId} />
      ))}
    </ol>
  );
}

function Row({ c, head, selected, branches, headId }: { c: Commit; head: boolean; selected: boolean; branches: string[]; headId: string }) {
  const { setSelectedCommitId, setComparePair, setMode } = useUiStore.getState();
  const open = useDialogs((s) => s.open);
  return (
    <li
      data-testid={`row-commit-${c.id}`}
      className={`border-l-2 px-3 py-1.5 transition-colors duration-150 ${selected ? 'border-[#6366f1] bg-[#6366f1]/[0.08]' : head ? 'border-[#e7e9ee]/40' : 'border-transparent hover:bg-[#161a23]'}`}
    >
      <button type="button" className="block w-full text-left focus-visible:outline-none" onClick={() => setSelectedCommitId(selected ? null : c.id)} aria-expanded={selected}>
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[12px] font-medium text-[#e7e9ee]">{c.message}</span>
          {c.parents.length > 1 && <GitMerge className="h-3 w-3 shrink-0 text-[#8b93a7]" aria-label="Merge commit" />}
        </div>
        <div className="tc flex gap-2 text-[10.5px] text-[#8b93a7]">
          <span>{c.id.slice(0, 7)}</span><span>{c.author}</span>{head && <span className="text-[#e7e9ee]/70">HEAD</span>}
        </div>
      </button>
      {selected && (
        <div className="bc-rise mt-1.5 flex flex-wrap gap-1">
          {branches.map((b) => (
            <button key={b} type="button" className={mini} onClick={() => requestCheckout({ type: 'branch', name: b })} data-testid={`button-checkout-${b}`}>
              <LogIn className="h-3 w-3" />Checkout {b}
            </button>
          ))}
          <button type="button" className={mini} onClick={() => requestCheckout({ type: 'detached', commitId: c.id })} data-testid={`button-view-${c.id}`}>
            <Eye className="h-3 w-3" />View
          </button>
          <button type="button" className={mini} onClick={() => open({ type: 'branch', from: c.id })} data-testid={`button-branch-from-${c.id}`}>
            <GitBranchPlus className="h-3 w-3" />Branch
          </button>
          {!head && (
            <button type="button" className={mini} onClick={() => { setComparePair([c.id, headId]); setMode('compare'); }} data-testid={`button-compare-head-${c.id}`}>
              <GitCompare className="h-3 w-3" />vs HEAD
            </button>
          )}
        </div>
      )}
    </li>
  );
}
