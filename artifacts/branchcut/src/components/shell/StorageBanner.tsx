import { AlertTriangle, X } from 'lucide-react';
import { useRepoStore } from '@/store/useRepoStore';
import { useDialogs } from '@/hooks/use-dialogs';
import { btn, btnDanger } from './styles';

export function StorageBanner() {
  const error = useRepoStore((s) => s.storageError);
  const clear = useRepoStore((s) => s.clearStorageError);
  const open = useDialogs((s) => s.open);
  if (!error) return null;
  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-[#f43f5e]/30 bg-[#f43f5e]/10 px-3 py-1.5 text-[12px] text-[#fecdd3]" role="alert" data-testid="banner-storage-error">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span className="min-w-0 flex-1">{error}</span>
      <button type="button" className={`${btn} h-6`} onClick={() => open({ type: 'reset' })} data-testid="button-storage-reset">Reset demo</button>
      <button type="button" className={`${btnDanger} h-6`} onClick={() => open({ type: 'clear' })} data-testid="button-storage-clear">Clear all</button>
      <button type="button" className="grid h-6 w-6 place-items-center rounded text-[#fecdd3]/70 hover:text-white" aria-label="Dismiss" onClick={clear}><X className="h-3.5 w-3.5" /></button>
    </div>
  );
}
