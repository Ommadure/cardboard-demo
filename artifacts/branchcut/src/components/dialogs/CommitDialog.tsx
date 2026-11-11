import { useMemo, useState } from 'react';
import type { RepoState } from '@/core/types';
import { diffTimelines } from '@/core/diff';
import { summarizeChange } from '@/core/summary';
import { getHeadId, useRepoStore } from '@/store/useRepoStore';
import { KIND_META, countHeader } from '@/lib/changes';
import { run } from '@/lib/run';
import { btn, btnPrimary, inputCls, labelCls } from '@/components/shell/styles';
import { FormDialog } from './Shell';

export function CommitDialog({ repo, onClose }: { repo: RepoState; onClose: () => void }) {
  const commit = useRepoStore((s) => s.commit);
  const [msg, setMsg] = useState('');
  const changes = useMemo(() => diffTimelines(repo.commits[getHeadId(repo)]!.timeline, repo.working), [repo]);
  const branch = repo.head.type === 'branch' ? repo.head.name : '';
  const submit = () => {
    const r = run(() => commit(msg), (id) => `Committed ${id.slice(0, 7)} to ${branch}`);
    if (r.ok) onClose();
  };
  return (
    <FormDialog
      title={`Commit to ${branch}`} testId="dialog-commit" onClose={onClose}
      description={countHeader(changes)}
      footer={<>
        <button type="button" className={btn} onClick={onClose}>Cancel</button>
        <button type="button" className={btnPrimary} disabled={!msg.trim()} onClick={submit} data-testid="button-confirm-commit">Commit</button>
      </>}
    >
      <ul className="bc-scroll max-h-40 space-y-1 overflow-y-auto rounded-md border border-[#222733] bg-[#0b0d12] p-2">
        {changes.map((c) => {
          const M = KIND_META[c.kind];
          return (
            <li key={c.clipId + c.kind} className="flex items-center gap-2 text-[12px] text-[#e7e9ee]">
              <span className="grid h-4 w-4 shrink-0 place-items-center rounded text-white" style={{ background: M.color }}><M.Icon className="h-2.5 w-2.5" strokeWidth={3} /></span>
              {summarizeChange(c)}
            </li>
          );
        })}
      </ul>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <label className={labelCls} htmlFor="commit-message">Message</label>
        <input id="commit-message" autoFocus className={inputCls} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Describe the cut change" data-testid="input-commit-message" />
        <p className="mt-1.5 text-[10.5px] text-[#8b93a7]">Author: You</p>
      </form>
    </FormDialog>
  );
}
