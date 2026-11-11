import { create } from 'zustand';
import type { RepoState } from '@/core/types';

export type DialogSpec =
  | { type: 'commit' }
  | { type: 'branch'; from?: string }
  | { type: 'merge' }
  | { type: 'compare' }
  | { type: 'addClip' }
  | { type: 'discard'; target: RepoState['head'] }
  | { type: 'deleteBranch'; name: string }
  | { type: 'reset' }
  | { type: 'clear' };

/** UI-only dialog router (not repository state). */
export const useDialogs = create<{ dialog: DialogSpec | null; open: (d: DialogSpec) => void; close: () => void }>((set) => ({
  dialog: null,
  open: (dialog) => set({ dialog }),
  close: () => set({ dialog: null }),
}));
