import { useState } from 'react';
import { toast } from 'sonner';
import type { RepoState } from '@/core/types';
import { isAncestor } from '@/core/graph';
import { getHeadId, useRepoStore } from '@/store/useRepoStore';
import { run } from '@/lib/run';
import { btn, btnPrimary } from '@/components/shell/styles';
import { FormDialog } from './Shell';

export function MergeDialog({ repo, onClose }: { repo: RepoState; onClose: () => void }) {
  const startMerge = useRepoStore((s) => s.startMerge);
  const ours = repo.head.type === 'branch' ? repo.head.name : null;
  const headId = getHeadId(repo);
  const options = Object.entries(repo.branches).filter(([n]) => n !== ours);
  const [pick, setPick] = useState(options[0]?.[0] ?? '');
  const hint = (tip: string) =>
    isAncestor(repo.commits, tip, headId) ? 'Already up to date' : isAncestor(repo.commits, headId, tip) ? 'Fast-forward' : 'Three-way merge';
  const submit = () => {
    const r = run(() => startMerge(pick));
    if (!r.ok) return;
    if (r.value === 'up-to-date') toast.info(`Already up to date: ${ours} contains ${pick}.`);
    else if (r.value === 'fast-forward') toast.success(`Fast-forwarded ${ours} to ${pick}.`);
    else toast(`Merging ${pick} into ${ours}. Review conflicts.`);
    onClose();
  };
  return (
    <FormDialog
      title={ours ? `Merge into ${ours}` : 'Merge'} testId="dialog-merge" onClose={onClose}
      description={ours ? 'Choose the branch whose changes should come in.' : 'Check out a branch before merging.'}
      footer={<>
        <button type="button" className={btn} onClick={onClose}>Cancel</button>
        <button type="button" className={btnPrimary} disabled={!ours || !pick} onClick={submit} data-testid="button-confirm-merge">Merge {pick}</button>
      </>}
    >
      <div role="radiogroup" className="space-y-1.5">
        {options.map(([name, tip]) => (
          <button
            key={name} type="button" role="radio" aria-checked={pick === name} onClick={() => setPick(name)} data-testid={`option-merge-${name}`}
            className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors duration-150 ${pick === name ? 'border-[#6366f1] bg-[#6366f1]/10' : 'border-[#222733] hover:bg-[#171b24]'}`}
          >
            <span className={`h-3 w-3 rounded-full border-2 ${pick === name ? 'border-[#6366f1] bg-[#6366f1]' : 'border-[#3a4152]'}`} />
            <span className="tc text-[12.5px] text-[#e7e9ee]">{name}</span>
            <span className="truncate text-[11px] text-[#8b93a7]">{repo.commits[tip]?.message}</span>
            <span className="ml-auto shrink-0 text-[10.5px] text-[#8b93a7]">{hint(tip)}</span>
          </button>
        ))}
      </div>
    </FormDialog>
  );
}
