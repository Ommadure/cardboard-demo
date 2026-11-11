import { beforeEach, describe, expect, it, vi } from 'vitest';
import { diffTimelines } from '../core/diff';
import { findOverlaps } from '../core/timeline';
import type { Clip } from '../core/types';

vi.hoisted(() => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
    },
  });
});
import { getHeadId, isDirty, useRepoStore, validRepo } from './useRepoStore';
import { useUiStore } from './useUiStore';

const store = () => useRepoStore.getState();
const repo = () => store().repo!;

beforeEach(() => { store().reset(); });

describe('repository transitions', () => {
  it('loads exactly the seeded history, branches and working copy', () => {
    expect(Object.keys(repo().commits)).toHaveLength(6);
    expect(repo().branches).toEqual({ main: 'm2', captions: 'mc2', broll: 'lb2' });
    expect(getHeadId(repo())).toBe('m2');
    expect(isDirty(repo())).toBe(false);
  });
  it('updates a working clip without mutating the committed snapshot', () => {
    store().updateClip('c_intro', { sourceOut: 4 });
    expect(isDirty(repo())).toBe(true);
    expect(repo().commits.m2!.timeline.clips.find(c => c.id === 'c_intro')!.sourceOut).toBe(6);
    const id = store().commit('Tighter opener');
    expect(repo().commits[id]!.author).toBe('You');
    expect(repo().commits[id]!.parents).toEqual(['m2']);
    store().updateClip('c_intro', { sourceOut: 3 });
    expect(repo().commits[id]!.timeline.clips.find(c => c.id === 'c_intro')!.sourceOut).toBe(4);
  });
  it('rejects blank messages and no-op commits without changing history', () => {
    expect(() => store().commit(' ')).toThrow('message');
    expect(() => store().commit('Nothing changed')).toThrow('no changes');
    expect(Object.keys(repo().commits)).toHaveLength(6);
  });
  it('rejects invalid edits atomically', () => {
    const before = JSON.stringify(repo());
    for (const patch of [{ speed: 0 }, { start: -1 }, { sourceIn: 8 }, { sourceOut: 100 }, { start: Infinity }]) {
      expect(() => store().updateClip('c_intro', patch)).toThrow();
      expect(JSON.stringify(repo())).toBe(before);
    }
  });
  it('adds at the chosen track and playhead and deletes the same clip', () => {
    store().addClip('whoosh.wav', 'A3', 12);
    const added = repo().working.clips.find(c => !repo().commits.m2!.timeline.clips.some(old => old.id === c.id))!;
    expect(added).toMatchObject({ sourceId: 'whoosh.wav', sourceOut: 2, trackId: 'A3', start: 12 });
    expect(useUiStore.getState().selectedClipId).toBe(added.id);
    store().deleteClip(added.id);
    expect(isDirty(repo())).toBe(false);
  });
  it('rejects incompatible source families and permits caption timing', () => {
    expect(() => store().addClip('voiceover.mp3', 'V1', 0)).toThrow();
    store().addClip('caption', 'C1', 23);
    expect(repo().working.clips.at(-1)).toMatchObject({ sourceIn: 0, sourceOut: 3, caption: 'Your caption' });
  });
  it('requires explicit discard for dirty checkout', () => {
    store().updateClip('c_intro', { sourceOut: 4 });
    expect(() => store().checkout({ type: 'branch', name: 'broll' })).toThrow('Confirm discard');
    expect(getHeadId(repo())).toBe('m2');
    store().checkout({ type: 'branch', name: 'broll' }, { discard: true });
    expect(getHeadId(repo())).toBe('lb2');
    expect(isDirty(repo())).toBe(false);
  });
  it('detached snapshots are read-only but permit creating a branch', () => {
    store().checkout({ type: 'detached', commitId: 'mc1' });
    expect(() => store().updateClip('c_intro', { start: 1 })).toThrow('read-only');
    expect(() => store().commit('x')).toThrow('read-only');
    expect(() => store().startMerge('broll')).toThrow('read-only');
    store().createBranch('review', 'mc1');
    expect(repo().head).toEqual({ type: 'branch', name: 'review' });
    expect(repo().branches.review).toBe('mc1');
  });
  it('protects main and current branches and rejects invalid and duplicate names', () => {
    expect(() => store().deleteBranch('main')).toThrow();
    store().checkout({ type: 'branch', name: 'captions' });
    expect(() => store().deleteBranch('captions')).toThrow();
    expect(() => store().createBranch('captions')).toThrow('already');
    expect(() => store().createBranch('__proto__')).toThrow();
    expect(() => store().createBranch('bad branch')).toThrow();
    store().deleteBranch('broll');
    expect(repo().branches.broll).toBeUndefined();
    expect(repo().commits.lb2).toBeDefined();
  });
  it('branches from a selected commit without changing main', () => {
    store().createBranch('alt-intro', 'm1');
    expect(repo().branches['alt-intro']).toBe('m1');
    expect(repo().branches.main).toBe('m2');
    expect(repo().working.clips).toHaveLength(6);
  });
});

describe('merge lifecycle', () => {
  it('fast-forwards without a commit and detects already-up-to-date', () => {
    expect(store().startMerge('captions')).toBe('fast-forward');
    expect(repo().branches.main).toBe('mc2');
    expect(Object.keys(repo().commits)).toHaveLength(6);
    expect(store().startMerge('captions')).toBe('up-to-date');
    expect(useUiStore.getState().mergeSession).toBeNull();
  });
  it('blocks a dirty merge without discarding work', () => {
    store().updateClip('c_intro', { label: 'My intro' });
    expect(() => store().startMerge('captions')).toThrow('uncommitted');
    expect(getHeadId(repo())).toBe('m2');
    expect(isDirty(repo())).toBe(true);
  });
  it('creates exactly the specified review session and aborts without side effects', () => {
    store().startMerge('captions');
    const before = JSON.stringify(repo());
    expect(store().startMerge('broll')).toBe('conflicts');
    const session = useUiStore.getState().mergeSession!;
    expect(session.result.conflicts).toHaveLength(2);
    expect(session.result.appliedFromTheirs).toHaveLength(2);
    expect(session.result.keptFromOurs).toHaveLength(4);
    expect(() => store().updateClip('c_intro', { start: 2 })).toThrow('active merge');
    expect(() => store().completeMerge('Merge')).toThrow();
    expect(JSON.stringify(repo())).toBe(before);
    store().abortMerge();
    expect(JSON.stringify(repo())).toBe(before);
    expect(useUiStore.getState().mode).toBe('workspace');
  });
  for (const intro of ['ours', 'theirs'] as const) {
    for (const presence of ['ours', 'theirs'] as const) {
      it(`commits an overlap-free two-parent merge with ${intro}/${presence}`, () => {
        store().startMerge('captions');
        store().startMerge('broll');
        const session = useUiStore.getState().mergeSession!;
        for (const conflict of session.result.conflicts) store().resolveConflict(conflict.id, conflict.kind === 'field' ? intro : presence);
        const id = store().completeMerge("Merge 'broll' into 'main'");
        expect(repo().commits[id]!.parents).toEqual(['mc2', 'lb2']);
        expect(repo().branches.main).toBe(id);
        expect(findOverlaps(repo().working)).toHaveLength(0);
        expect(useUiStore.getState().mergeSession).toBeNull();
        expect(isDirty(repo())).toBe(false);
      });
    }
  }
});

describe('persistence boundaries', () => {
  it('persists repository data but not runtime actions or unfinished merge sessions', () => {
    store().startMerge('captions');
    store().startMerge('broll');
    const saved = JSON.parse(localStorage.getItem('branchcut:v1')!);
    expect(saved.version).toBe(1);
    expect(Object.keys(saved.state)).toEqual(['repo']);
    expect(saved.state.repo.branches.main).toBe('mc2');
    expect(saved.state.mergeSession).toBeUndefined();
  });
  it('round-trips valid persisted state and preserves dirty work', async () => {
    store().updateClip('c_intro', { label: 'Saved draft' });
    const saved = localStorage.getItem('branchcut:v1')!;
    useRepoStore.setState({ repo: null });
    localStorage.setItem('branchcut:v1', saved);
    await useRepoStore.persist.rehydrate();
    expect(repo().working.clips.find(c => c.id === 'c_intro')!.label).toBe('Saved draft');
    expect(isDirty(repo())).toBe(true);
  });
  it('validates stored references, cycles and intrinsic clip data', () => {
    const candidate = structuredClone(repo());
    expect(validRepo(candidate)).toBe(true);
    candidate.commits.m1!.parents = ['m2'];
    expect(validRepo(candidate)).toBe(false);
    candidate.commits.m1!.parents = [];
    candidate.branches.main = 'missing';
    expect(validRepo(candidate)).toBe(false);
    expect(validRepo({ commits: {}, head: {}, working: null })).toBe(false);
    const broken = structuredClone(repo());
    broken.working.clips[0] = { ...broken.working.clips[0], speed: 0 } as Clip;
    expect(validRepo(broken)).toBe(false);
  });
  it('does not overwrite incompatible storage when rehydrating', async () => {
    const bad = JSON.stringify({ version: 99, state: { repo: { old: true } } });
    localStorage.setItem('branchcut:v1', bad);
    await useRepoStore.persist.rehydrate();
    await Promise.resolve();
    expect(localStorage.getItem('branchcut:v1')).toBe(bad);
    expect(store().storageError).toContain('incompatible');
    expect(() => store().loadDemo()).toThrow('Reset');
    store().reset();
    expect(validRepo(repo())).toBe(true);
  });
  it('does not overwrite malformed JSON and exposes an explicit recovery error', async () => {
    localStorage.setItem('branchcut:v1', '{broken');
    await useRepoStore.persist.rehydrate();
    await Promise.resolve();
    expect(localStorage.getItem('branchcut:v1')).toBe('{broken');
    expect(store().storageError).toContain('could not be read');
    store().reset();
  });
  it('keeps quota-failed edits in memory and reports that they were not saved', async () => {
    const lastSaved = localStorage.getItem('branchcut:v1');
    const write = vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => { throw new Error('Quota exceeded'); });
    store().updateClip('c_intro', { label: 'Unsaved draft' });
    await Promise.resolve();
    expect(repo().working.clips.find(c => c.id === 'c_intro')!.label).toBe('Unsaved draft');
    expect(localStorage.getItem('branchcut:v1')).toBe(lastSaved);
    expect(store().storageError).toContain('memory only');
    write.mockRestore();
    store().reset();
  });
  it('clear returns to empty, and reset restores exact seed', () => {
    store().clearAll();
    expect(store().repo).toBeNull();
    store().reset();
    expect(diffTimelines(repo().commits.m2!.timeline, repo().commits.mc2!.timeline)).toHaveLength(6);
  });
});
