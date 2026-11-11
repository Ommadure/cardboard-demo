import { toast } from 'sonner';
import type { RepoState } from '@/core/types';
import { useRepoStore } from '@/store/useRepoStore';
import { useDialogs } from '@/hooks/use-dialogs';
import { errorText } from './run';

export function describeTarget(t: RepoState['head']) {
  return t.type === 'branch' ? `Checked out ${t.name}` : `Viewing ${t.commitId} (read-only)`;
}

/** Checkout; on dirty working copy, asks for discard confirmation then retries. */
export function requestCheckout(target: RepoState['head']) {
  try {
    useRepoStore.getState().checkout(target);
    toast.success(describeTarget(target));
  } catch (e) {
    const msg = errorText(e);
    if (msg.startsWith('Uncommitted changes')) useDialogs.getState().open({ type: 'discard', target });
    else toast.error(msg);
  }
}
