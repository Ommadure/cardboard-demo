import { useEffect } from 'react';
import { useUiStore } from '@/store/useUiStore';

const TYPING = 'input, textarea, select, [contenteditable="true"], [role="listbox"], [role="menu"]';

/** Space play/pause, Left/Right ±1s. Ignored while typing or when a dialog is open. */
export function useShortcuts(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest(TYPING)) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      const s = useUiStore.getState();
      if (e.code === 'Space') {
        if (t?.closest('button')) return;
        e.preventDefault();
        s.setPlaying(!s.playing);
      } else if (e.key === 'ArrowLeft') { e.preventDefault(); s.setPlayhead(s.playhead - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); s.setPlayhead(s.playhead + 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}
