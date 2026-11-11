import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { Clip, Commit, RepoState, TrackId } from '../core/types';
import { createDemoRepo, MEDIA_LIBRARY } from '../core/seed';
import { cloneTimeline, timelinesEqual, validateTimeline } from '../core/timeline';
import { isAncestor, lowestCommonAncestor } from '../core/graph';
import { applyResolutions, threeWayMerge } from '../core/merge';
import { useUiStore } from './useUiStore';

export function getHeadId(repo: RepoState): string {
  return repo.head.type === 'branch' ? repo.branches[repo.head.name]! : repo.head.commitId;
}
export function isDirty(repo: RepoState): boolean {
  return !timelinesEqual(repo.working, repo.commits[getHeadId(repo)]!.timeline);
}
const own = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key);
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const safeId = (id: string) => !['__proto__', 'prototype', 'constructor'].includes(id);

/** Validate persisted input, not just its version tag, before it becomes application state. */
export function validRepo(value: unknown): value is RepoState {
  if (!record(value) || !record(value.commits) || !record(value.branches) || !record(value.head)) return false;
  if (!record(value.working) || !Array.isArray(value.working.clips)) return false;
  try {
    const candidate = value as unknown as RepoState;
    if (validateTimeline(candidate.working).length) return false;
    const commits = Object.entries(value.commits);
    if (!commits.length || commits.length > 10000) return false;
    for (const [id, item] of commits) {
      if (!safeId(id) || !record(item) || item.id !== id || !Array.isArray(item.parents) ||
          item.parents.length > 2 || !item.parents.every(p => typeof p === 'string' && own(value.commits as object, p)) ||
          typeof item.branch !== 'string' || typeof item.author !== 'string' || typeof item.message !== 'string' ||
          typeof item.createdAt !== 'number' || !Number.isFinite(item.createdAt) || !record(item.timeline) ||
          !Array.isArray(item.timeline.clips) || validateTimeline(item.timeline as unknown as Commit['timeline']).length) return false;
    }
    for (const [name, id] of Object.entries(candidate.branches)) {
      if (!safeId(name) || typeof id !== 'string' || !own(candidate.commits, id)) return false;
    }
    if (!own(candidate.branches, 'main')) return false;
    if (candidate.head.type === 'branch') {
      if (typeof candidate.head.name !== 'string' || !own(candidate.branches, candidate.head.name)) return false;
    } else if (candidate.head.type === 'detached') {
      if (typeof candidate.head.commitId !== 'string' || !own(candidate.commits, candidate.head.commitId)) return false;
    } else return false;
    // A three-color traversal rejects cycles even when every parent ID exists.
    const active = new Set<string>(), visited = new Set<string>();
    const visit = (id: string): boolean => {
      if (active.has(id)) return false;
      if (visited.has(id)) return true;
      active.add(id);
      for (const parent of candidate.commits[id]!.parents) if (!visit(parent)) return false;
      active.delete(id); visited.add(id); return true;
    };
    return commits.every(([id]) => visit(id));
  } catch {
    return false;
  }
}

let storageLocked = false;
let initialStorageError: string | null = null;
function reportStorage(message: string) {
  initialStorageError = message;
  queueMicrotask(() => {
    if (useRepoStore.getState().storageError !== message) useRepoStore.setState({ storageError: message });
  });
}
const safeStorage: StateStorage = {
  getItem(name) {
    try {
      const raw = localStorage.getItem(name);
      if (raw === null) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!record(parsed) || parsed.version !== 1 || !record(parsed.state) ||
          !(parsed.state.repo === null || validRepo(parsed.state.repo))) {
        storageLocked = true;
        reportStorage('Saved project is incompatible or damaged. It has not been overwritten. Reset demo or clear all to recover.');
        return null;
      }
      return raw;
    } catch {
      storageLocked = true;
      reportStorage('Browser storage could not be read. Your saved project has not been overwritten.');
      return null;
    }
  },
  setItem(name, value) {
    if (storageLocked) return;
    try { localStorage.setItem(name, value); }
    catch {
      storageLocked = true;
      reportStorage('Could not save to browser storage. Changes are in memory only; keep this tab open.');
    }
  },
  removeItem(name) {
    try { localStorage.removeItem(name); }
    catch { reportStorage('Could not clear browser storage. Check browser storage permissions.'); }
  },
};

interface RepoStore {
  repo: RepoState | null;
  storageError: string | null;
  loadDemo(): void;
  reset(): void;
  clearAll(): void;
  clearStorageError(): void;
  updateClip(id: string, patch: Partial<Clip>): void;
  addClip(sourceId: string, trackId: TrackId, start: number): void;
  deleteClip(id: string): void;
  commit(message: string): string;
  createBranch(name: string, fromCommitId?: string): void;
  deleteBranch(name: string): void;
  checkout(target: RepoState['head'], options?: { discard?: boolean }): void;
  startMerge(theirsBranch: string): 'fast-forward' | 'up-to-date' | 'conflicts';
  resolveConflict(id: string, resolution: 'ours' | 'theirs' | 'both'): void;
  completeMerge(message: string): string;
  abortMerge(): void;
}
function resetUi() {
  useUiStore.setState({
    mode: 'workspace', selectedClipId: null, selectedCommitId: null,
    comparePair: ['m2', 'mc2'], playhead: 8, playing: false, mergeSession: null,
  });
}
function assertValid(timeline: RepoState['working']) {
  const errors = validateTimeline(timeline);
  if (errors.length) throw new Error(errors[0]);
}
const id = () => crypto.randomUUID().replaceAll('-', '').slice(0, 10);

export const useRepoStore = create<RepoStore>()(persist((set, get) => {
  const requireRepo = (): RepoState => {
    const repo = get().repo;
    if (!repo) throw new Error('Load the demo project first.');
    return repo;
  };
  const editable = () => {
    const repo = requireRepo();
    if (repo.head.type === 'detached') throw new Error('This commit is read-only. Create or check out a branch to edit.');
    if (useUiStore.getState().mergeSession) throw new Error('Complete or abort the active merge first.');
    return repo;
  };
  const clean = (repo: RepoState) => {
    if (isDirty(repo)) throw new Error('Commit your uncommitted changes before merging or creating a branch.');
  };
  const demo = () => {
    storageLocked = false; initialStorageError = null;
    resetUi();
    set({ repo: createDemoRepo(), storageError: null });
  };
  return {
    repo: null,
    storageError: initialStorageError,
    loadDemo: () => {
      if (storageLocked) throw new Error('Use Reset demo or Clear all to replace incompatible saved data.');
      demo();
    },
    reset: demo,
    clearAll: () => {
      storageLocked = false; initialStorageError = null;
      safeStorage.removeItem('branchcut:v1'); resetUi();
      set({ repo: null, storageError: null });
    },
    clearStorageError: () => set({ storageError: null }),
    updateClip: (clipId, patch) => {
      const repo = editable();
      if (!repo.working.clips.some(c => c.id === clipId)) throw new Error('Clip not found.');
      const working = cloneTimeline(repo.working);
      working.clips = working.clips.map(c => c.id === clipId ? { ...c, ...patch, id: c.id, effects: [...(patch.effects ?? c.effects)] } : c);
      assertValid(working);
      set({ repo: { ...repo, working } });
    },
    addClip: (sourceId, trackId, start) => {
      const repo = editable();
      const source = MEDIA_LIBRARY.find(s => s.id === sourceId);
      if (!source) throw new Error('Choose a media source.');
      const clip: Clip = {
        id: `c_${id()}`, label: source.label, sourceId, trackId, start,
        sourceIn: 0, sourceOut: Math.min(source.duration ?? 3, 3),
        speed: 1, effects: [],
        ...(source.type === 'text' ? { caption: 'Your caption' } : {}),
      };
      const working = { clips: [...cloneTimeline(repo.working).clips, clip] };
      assertValid(working);
      set({ repo: { ...repo, working } });
      useUiStore.getState().setSelectedClipId(clip.id);
    },
    deleteClip: (clipId) => {
      const repo = editable();
      if (!repo.working.clips.some(c => c.id === clipId)) throw new Error('Clip not found.');
      set({ repo: { ...repo, working: { clips: repo.working.clips.filter(c => c.id !== clipId) } } });
      useUiStore.getState().setSelectedClipId(null);
    },
    commit: (message) => {
      const repo = editable();
      if (!message.trim()) throw new Error('Enter a commit message.');
      if (!isDirty(repo)) throw new Error('There are no changes to commit.');
      assertValid(repo.working);
      const commitId = id();
      const branch = repo.head.type === 'branch' ? repo.head.name : '';
      const commit: Commit = {
        id: commitId, parents: [getHeadId(repo)], branch, message: message.trim(),
        author: 'You', createdAt: Date.now(), timeline: cloneTimeline(repo.working),
      };
      set({ repo: { ...repo, commits: { ...repo.commits, [commitId]: commit }, branches: { ...repo.branches, [branch]: commitId } } });
      return commitId;
    },
    createBranch: (name, fromCommitId) => {
      const repo = requireRepo();
      if (useUiStore.getState().mergeSession) throw new Error('Complete or abort the active merge first.');
      clean(repo);
      const branch = name.trim();
      if (!/^[a-zA-Z0-9][a-zA-Z0-9/_-]{0,49}$/.test(branch) || !safeId(branch)) throw new Error('Use 1–50 letters, numbers, hyphens, underscores or slashes.');
      if (own(repo.branches, branch)) throw new Error('That branch already exists.');
      const from = fromCommitId ?? getHeadId(repo);
      if (!own(repo.commits, from)) throw new Error('Starting commit not found.');
      set({ repo: { ...repo, branches: { ...repo.branches, [branch]: from }, head: { type: 'branch', name: branch }, working: cloneTimeline(repo.commits[from]!.timeline) } });
      useUiStore.getState().setSelectedCommitId(null);
      useUiStore.getState().setSelectedClipId(null);
    },
    deleteBranch: (name) => {
      const repo = requireRepo();
      if (useUiStore.getState().mergeSession) throw new Error('Complete or abort the active merge first.');
      if (name === 'main' || (repo.head.type === 'branch' && repo.head.name === name)) throw new Error('Cannot delete main or the current branch.');
      if (!own(repo.branches, name)) throw new Error('Branch not found.');
      const branches = { ...repo.branches }; delete branches[name];
      set({ repo: { ...repo, branches } });
    },
    checkout: (target, options) => {
      const repo = requireRepo();
      if (useUiStore.getState().mergeSession) throw new Error('Complete or abort the active merge first.');
      const targetId = target.type === 'branch' ? (own(repo.branches, target.name) ? repo.branches[target.name] : undefined) : target.commitId;
      if (!targetId || !own(repo.commits, targetId)) throw new Error('Checkout target not found.');
      if (isDirty(repo) && !options?.discard) throw new Error('Uncommitted changes. Confirm discard before checking out.');
      set({ repo: { ...repo, head: target, working: cloneTimeline(repo.commits[targetId]!.timeline) } });
      useUiStore.setState({ selectedClipId: null, selectedCommitId: targetId, mode: 'workspace' });
    },
    startMerge: (theirsBranch) => {
      const repo = editable(); clean(repo);
      if (!own(repo.branches, theirsBranch)) throw new Error('Source branch not found.');
      const oursId = getHeadId(repo), theirsId = repo.branches[theirsBranch]!;
      if (isAncestor(repo.commits, theirsId, oursId)) return 'up-to-date';
      const oursBranch = repo.head.type === 'branch' ? repo.head.name : '';
      if (isAncestor(repo.commits, oursId, theirsId)) {
        set({ repo: { ...repo, branches: { ...repo.branches, [oursBranch]: theirsId }, working: cloneTimeline(repo.commits[theirsId]!.timeline) } });
        useUiStore.getState().setSelectedClipId(null);
        return 'fast-forward';
      }
      const baseId = lowestCommonAncestor(repo.commits, oursId, theirsId);
      if (!baseId) throw new Error('These histories do not have a common ancestor.');
      const result = threeWayMerge(repo.commits[baseId]!.timeline, repo.commits[oursId]!.timeline, repo.commits[theirsId]!.timeline);
      useUiStore.setState({
        mode: 'merge', selectedClipId: null, playing: false,
        mergeSession: { oursId, theirsId, baseId, oursBranch, theirsBranch, result, resolutions: {} },
      });
      return 'conflicts';
    },
    resolveConflict: (conflictId, resolution) => {
      const session = useUiStore.getState().mergeSession;
      if (!session) throw new Error('No active merge.');
      useUiStore.getState().setMergeSession({ ...session, resolutions: { ...session.resolutions, [conflictId]: resolution } });
    },
    completeMerge: (message) => {
      const repo = requireRepo(), session = useUiStore.getState().mergeSession;
      if (!session) throw new Error('No active merge.');
      if (repo.head.type !== 'branch' || repo.head.name !== session.oursBranch ||
          getHeadId(repo) !== session.oursId || isDirty(repo)) throw new Error('The target branch changed. Abort and restart the merge.');
      if (!message.trim()) throw new Error('Enter a merge message.');
      const timeline = applyResolutions(session.result, session.resolutions);
      assertValid(timeline);
      const commitId = id();
      const commit: Commit = {
        id: commitId, parents: [session.oursId, session.theirsId], branch: session.oursBranch,
        message: message.trim(), author: 'You', createdAt: Date.now(), timeline: cloneTimeline(timeline),
      };
      set({ repo: { ...repo, commits: { ...repo.commits, [commitId]: commit }, branches: { ...repo.branches, [session.oursBranch]: commitId }, working: cloneTimeline(timeline) } });
      useUiStore.setState({ mergeSession: null, mode: 'workspace', selectedClipId: null, selectedCommitId: commitId });
      return commitId;
    },
    abortMerge: () => useUiStore.setState({ mergeSession: null, mode: 'workspace' }),
  };
}, {
  name: 'branchcut:v1', version: 1,
  storage: createJSONStorage(() => safeStorage),
  partialize: (state) => ({ repo: state.repo }),
}));
