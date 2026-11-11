import { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';
import type { RepoState } from '@/core/types';
import { useUiStore } from '@/store/useUiStore';
import { btn, btnGhost, btnPrimary, labelCls } from '@/components/shell/styles';
import { CommitSelect } from '@/components/compare/CommitSelect';
import { FormDialog } from './Shell';

export function CompareDialog({ repo, onClose }: { repo: RepoState; onClose: () => void }) {
  const pair = useUiStore((s) => s.comparePair);
  const [a, setA] = useState(repo.commits[pair[0]] ? pair[0] : Object.keys(repo.commits)[0]!);
  const [b, setB] = useState(repo.commits[pair[1]] ? pair[1] : Object.keys(repo.commits)[0]!);
  const submit = () => {
    const ui = useUiStore.getState();
    ui.setComparePair([a, b]);
    ui.setMode('compare');
    onClose();
  };
  return (
    <FormDialog
      title="Compare two versions" testId="dialog-compare" onClose={onClose}
      description="A is the earlier cut, B the later one. Changes are drawn on B."
      footer={<>
        <button type="button" className={btn} onClick={onClose}>Cancel</button>
        <button type="button" className={btnPrimary} onClick={submit} data-testid="button-confirm-compare">Compare</button>
      </>}
    >
      <div className="space-y-2">
        <div><span className={labelCls}>A · before</span><CommitSelect repo={repo} value={a} onChange={setA} testId="select-compare-a" /></div>
        <button type="button" className={`${btnGhost} mx-auto flex`} onClick={() => { setA(b); setB(a); }} data-testid="button-swap-compare"><ArrowUpDown className="h-3.5 w-3.5" />Swap</button>
        <div><span className={labelCls}>B · after</span><CommitSelect repo={repo} value={b} onChange={setB} testId="select-compare-b" /></div>
      </div>
    </FormDialog>
  );
}
