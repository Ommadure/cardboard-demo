import { Check, ChevronDown, GitBranch, GitBranchPlus, GitCommitHorizontal, GitCompare, GitMerge, MoreHorizontal, RotateCcw, Trash2 } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { isDirty, useRepoStore } from '@/store/useRepoStore';
import { useUiStore } from '@/store/useUiStore';
import { useDialogs } from '@/hooks/use-dialogs';
import { requestCheckout } from '@/lib/checkout';
import { BrandMark } from './BrandMark';
import { ModeTabs } from './ModeTabs';
import { btn, btnGhost, btnPrimary } from './styles';

const menu = 'border-[#222733] bg-[#12151c] text-[#e7e9ee]';
const item = 'text-[12px] focus:bg-[#1d2230] focus:text-[#e7e9ee]';

export function TopBar() {
  const repo = useRepoStore((s) => s.repo);
  const storageError = useRepoStore((s) => s.storageError);
  const merging = useUiStore((s) => !!s.mergeSession);
  const open = useDialogs((s) => s.open);
  const dirty = repo ? isDirty(repo) : false;
  const branch = repo?.head.type === 'branch' ? repo.head.name : null;
  const branches = repo ? Object.keys(repo.branches).sort((a, b) => (a === 'main' ? -1 : b === 'main' ? 1 : a.localeCompare(b))) : [];
  const deletable = branches.filter((b) => b !== 'main' && b !== branch);

  return (
    <header className="flex h-11 shrink-0 items-center gap-2.5 border-b border-[#222733] bg-[#12151c] px-3" data-testid="topbar">
      <div className="flex items-center gap-2">
        <BrandMark />
        <span className="text-[13px] font-semibold tracking-tight text-[#e7e9ee]">Branchcut</span>
      </div>
      {repo && (
        <>
          <span className="h-4 w-px bg-[#222733]" />
          <span className="text-[12px] text-[#8b93a7]" data-testid="text-project-name">Launch video</span>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-7 items-center gap-1.5 rounded-md border border-[#222733] bg-[#0b0d12] px-2 text-[11.5px] text-[#e7e9ee] transition-colors duration-150 hover:border-[#2f3646] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]/60" data-testid="button-branch-menu">
              <GitBranch className="h-3 w-3 text-[#6366f1]" />
              <span className="tc" data-testid="text-current-branch">{branch ?? `detached @ ${repo.head.type === 'detached' ? repo.head.commitId.slice(0, 7) : ''}`}</span>
              <ChevronDown className="h-3 w-3 text-[#8b93a7]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className={`${menu} w-60`}>
              <DropdownMenuLabel className="text-[10.5px] uppercase tracking-wider text-[#8b93a7]">Check out</DropdownMenuLabel>
              {branches.map((b) => (
                <DropdownMenuItem key={b} className={item} disabled={merging} onSelect={() => { if (b !== branch) requestCheckout({ type: 'branch', name: b }); }} data-testid={`menu-checkout-${b}`}>
                  <Check className={`h-3 w-3 ${b === branch ? 'opacity-100' : 'opacity-0'}`} />
                  <span className="tc">{b}</span>
                  <span className="tc ml-auto text-[10px] text-[#8b93a7]">{repo.branches[b]!.slice(0, 7)}</span>
                </DropdownMenuItem>
              ))}
              {deletable.length > 0 && <DropdownMenuSeparator className="bg-[#222733]" />}
              {deletable.map((b) => (
                <DropdownMenuItem key={'d' + b} className={`${item} text-[#fca5a5] focus:text-[#fca5a5]`} disabled={merging} onSelect={() => open({ type: 'deleteBranch', name: b })} data-testid={`menu-delete-${b}`}>
                  <Trash2 className="h-3 w-3" />Delete {b}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {dirty && (
            <span className="flex items-center gap-1.5 rounded-full border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-2 py-0.5 text-[11px] text-[#fcd34d]" data-testid="badge-uncommitted">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />Uncommitted changes
            </span>
          )}
        </>
      )}
      {repo && <div className="mx-auto"><ModeTabs /></div>}
      <div className={`flex items-center gap-1.5 ${repo ? '' : 'ml-auto'}`}>
        {repo && (
          <>
            <button type="button" className={btnPrimary} disabled={!dirty || !branch || merging} onClick={() => open({ type: 'commit' })} data-testid="button-commit" title={!branch ? 'Detached commits are read-only' : !dirty ? 'No changes to commit' : 'Commit working copy'}>
              <GitCommitHorizontal className="h-3.5 w-3.5" />Commit
            </button>
            <button type="button" className={btn} disabled={merging} onClick={() => open({ type: 'branch' })} data-testid="button-new-branch"><GitBranchPlus className="h-3.5 w-3.5" />New branch</button>
            <button type="button" className={btn} disabled={!branch || merging} onClick={() => open({ type: 'merge' })} data-testid="button-merge"><GitMerge className="h-3.5 w-3.5" />Merge…</button>
            <button type="button" className={btn} onClick={() => open({ type: 'compare' })} data-testid="button-compare"><GitCompare className="h-3.5 w-3.5" />Compare…</button>
          </>
        )}
        {(repo || storageError) && (
          <DropdownMenu>
            <DropdownMenuTrigger className={`${btnGhost} w-7 px-0`} aria-label="Project menu" data-testid="button-overflow"><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={`${menu} w-44`}>
              <DropdownMenuItem className={item} onSelect={() => open({ type: 'reset' })} data-testid="menu-reset-demo"><RotateCcw className="h-3 w-3" />Reset demo</DropdownMenuItem>
              <DropdownMenuItem className={`${item} text-[#fca5a5] focus:text-[#fca5a5]`} onSelect={() => open({ type: 'clear' })} data-testid="menu-clear-all"><Trash2 className="h-3 w-3" />Clear all</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
