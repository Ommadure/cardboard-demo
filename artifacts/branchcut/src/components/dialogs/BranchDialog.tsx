import { useState } from 'react';
import type { RepoState } from '@/core/types';
import { getHeadId, useRepoStore } from '@/store/useRepoStore';
import { run } from '@/lib/run';
import { btn, btnPrimary, inputCls, labelCls } from '@/components/shell/styles';
import { FormDialog } from './Shell';

export function BranchDialog({ repo, from, onClose }: { repo: RepoState; from?: string; onClose: () => void }) {
  const createBranch = useRepoStore((s) => s.createBranch);
  const [name, setName] = useState('');
  const [start, setStart] = useState(from ?? getHeadId(repo));
  const commits = Object.values(repo.commits).sort((a, b) => b.createdAt - a.createdAt);
  const submit = () => {
    const r = run(() => createBranch(name, start), `Created and checked out ${name.trim()}`);
    if (r.ok) onClose();
  };
  return (
    <FormDialog
      title="New branch" testId="dialog-branch" onClose={onClose}
      description="The new branch is checked out immediately."
      footer={<>
        <button type="button" className={btn} onClick={onClose}>Cancel</button>
        <button type="button" className={btnPrimary} disabled={!name.trim()} onClick={submit} data-testid="button-confirm-branch">Create branch</button>
      </>}
    >
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <div>
          <label className={labelCls} htmlFor="branch-name">Name</label>
          <input id="branch-name" autoFocus className={`${inputCls} tc`} value={name} onChange={(e) => setName(e.target.value)} placeholder="color-grade" data-testid="input-branch-name" />
        </div>
        <div>
          <label className={labelCls} htmlFor="branch-from">Start from</label>
          <select id="branch-from" className={inputCls} value={start} onChange={(e) => setStart(e.target.value)} data-testid="select-branch-from">
            {commits.map((c) => (
              <option key={c.id} value={c.id}>{c.id.slice(0, 7)} — {c.message}{c.id === getHeadId(repo) ? ' (HEAD)' : ''}</option>
            ))}
          </select>
        </div>
      </form>
    </FormDialog>
  );
}
