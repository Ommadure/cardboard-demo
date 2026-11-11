import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useRepoStore } from '@/store/useRepoStore';
import { useUiStore } from '@/store/useUiStore';
import { useShortcuts } from '@/hooks/use-shortcuts';
import { run } from '@/lib/run';
import { TopBar } from '@/components/shell/TopBar';
import { Footer } from '@/components/shell/Footer';
import { EmptyState } from '@/components/shell/EmptyState';
import { StorageBanner } from '@/components/shell/StorageBanner';
import { DialogHost } from '@/components/dialogs/DialogHost';
import { WorkspaceView } from '@/pages/WorkspaceView';
import { CompareView } from '@/pages/CompareView';
import { MergeView } from '@/pages/MergeView';

function App() {
  const repo = useRepoStore((s) => s.repo);
  const mode = useUiStore((s) => s.mode);
  useShortcuts(!!repo);
  return (
    <TooltipProvider>
      <div className="dark flex h-[100dvh] min-w-[1100px] flex-col bg-[#0b0d12] text-[#e7e9ee]">
        <TopBar />
        <StorageBanner />
        {!repo ? (
          <EmptyState onLoad={() => run(() => useRepoStore.getState().loadDemo(), 'Demo project loaded')} />
        ) : mode === 'compare' ? <CompareView repo={repo} /> : mode === 'merge' ? <MergeView repo={repo} /> : <WorkspaceView repo={repo} />}
        <Footer />
      </div>
      <DialogHost />
      <Toaster
        theme="dark" position="bottom-right" closeButton
        toastOptions={{ style: { background: '#12151c', border: '1px solid #222733', color: '#e7e9ee', fontSize: 12.5, fontFamily: 'var(--app-font-sans)' } }}
      />
    </TooltipProvider>
  );
}

export default App;
