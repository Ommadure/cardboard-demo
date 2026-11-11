import { toast } from 'sonner';
import { useRepoStore } from '@/store/useRepoStore';
import { useDialogs } from '@/hooks/use-dialogs';
import { describeTarget } from '@/lib/checkout';
import { run } from '@/lib/run';
import { AddClipDialog } from './AddClipDialog';
import { BranchDialog } from './BranchDialog';
import { CommitDialog } from './CommitDialog';
import { CompareDialog } from './CompareDialog';
import { MergeDialog } from './MergeDialog';
import { ConfirmDialog } from './Shell';

export function DialogHost() {
  const dialog = useDialogs((s) => s.dialog);
  const close = useDialogs((s) => s.close);
  const repo = useRepoStore((s) => s.repo);
  const store = useRepoStore.getState;
  if (!dialog) return null;
  switch (dialog.type) {
    case 'reset':
      return <ConfirmDialog testId="dialog-reset" title="Reset demo?" description="All commits, branches and uncommitted edits are replaced with the original demo project." confirmLabel="Reset demo" onClose={close}
        onConfirm={() => { run(() => store().reset(), 'Demo project restored'); close(); }} />;
    case 'clear':
      return <ConfirmDialog testId="dialog-clear" title="Clear everything?" description="Deletes the project from this browser and returns to the start screen. This cannot be undone." confirmLabel="Clear all" onClose={close}
        onConfirm={() => { run(() => store().clearAll(), 'Project cleared'); close(); }} />;
    default:
      break;
  }
  if (!repo) return null;
  switch (dialog.type) {
    case 'commit': return <CommitDialog repo={repo} onClose={close} />;
    case 'branch': return <BranchDialog repo={repo} from={dialog.from} onClose={close} />;
    case 'merge': return <MergeDialog repo={repo} onClose={close} />;
    case 'compare': return <CompareDialog repo={repo} onClose={close} />;
    case 'addClip': return <AddClipDialog onClose={close} />;
    case 'discard': {
      const t = dialog.target;
      return <ConfirmDialog testId="dialog-discard" title="Discard uncommitted changes?"
        description={<>Your working copy has edits that are not committed. Checking out {t.type === 'branch' ? <b className="tc text-[#e7e9ee]">{t.name}</b> : <b className="tc text-[#e7e9ee]">{t.commitId.slice(0, 7)}</b>} will throw them away.</>}
        confirmLabel="Discard and check out" onClose={close}
        onConfirm={() => { try { store().checkout(t, { discard: true }); toast.success(describeTarget(t)); } catch (e) { toast.error(e instanceof Error ? e.message : 'Checkout failed.'); } close(); }} />;
    }
    case 'deleteBranch':
      return <ConfirmDialog testId="dialog-delete-branch" title={`Delete branch ${dialog.name}?`} description="Only the branch pointer is removed. Its commits stay in history." confirmLabel="Delete branch" onClose={close}
        onConfirm={() => { run(() => store().deleteBranch(dialog.name), `Deleted branch ${dialog.name}`); close(); }} />;
    default:
      return null;
  }
}
