import { create } from 'zustand';
import type { MergeSession } from '../core/types';

export type Mode = 'workspace' | 'compare' | 'merge';
interface UiState {
  mode: Mode;
  selectedClipId: string | null;
  selectedCommitId: string | null;
  comparePair: [string, string];
  playhead: number;
  zoom: number;
  playing: boolean;
  mergeSession: MergeSession | null;
  hoveredClipId: string | null;
  setMode: (mode: Mode) => void;
  setSelectedClipId: (id: string | null) => void;
  setSelectedCommitId: (id: string | null) => void;
  setComparePair: (pair: [string, string]) => void;
  setPlayhead: (time: number) => void;
  setZoom: (zoom: number) => void;
  setPlaying: (playing: boolean) => void;
  setMergeSession: (session: MergeSession | null) => void;
  setHoveredClipId: (id: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  mode: 'workspace',
  selectedClipId: null,
  selectedCommitId: null,
  comparePair: ['m2', 'mc2'],
  playhead: 8,
  zoom: 40,
  playing: false,
  mergeSession: null,
  hoveredClipId: null,
  setMode: (mode) => set({ mode }),
  setSelectedClipId: (selectedClipId) => set({ selectedClipId }),
  setSelectedCommitId: (selectedCommitId) => set({ selectedCommitId }),
  setComparePair: (comparePair) => set({ comparePair }),
  setPlayhead: (playhead) => set({ playhead: Math.max(0, playhead) }),
  setZoom: (zoom) => set({ zoom: Math.max(20, Math.min(120, zoom)) }),
  setPlaying: (playing) => set({ playing }),
  setMergeSession: (mergeSession) => set({ mergeSession }),
  setHoveredClipId: (hoveredClipId) => set({ hoveredClipId }),
}));
