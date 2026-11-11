import { describe, expect, it } from 'vitest';
import type { Clip, Timeline } from './types';
import { createDemoRepo } from './seed';
import { diffTimelines } from './diff';

function clip(overrides: Partial<Clip> = {}): Clip {
  return {
    id: 'clip', label: 'Clip', trackId: 'V1', sourceId: 'intro.mp4',
    sourceIn: 0, sourceOut: 4, start: 0, speed: 1, effects: [],
    ...overrides,
  };
}

const timeline = (...clips: Clip[]): Timeline => ({ clips });

describe('diffTimelines', () => {
  it('detects added, removed, moved on start/track, trimmed in/out/speed, and modified fields', () => {
    const before = timeline(
      clip({ id: 'removed' }),
      clip({ id: 'move-start' }),
      clip({ id: 'move-track' }),
      clip({ id: 'trim-in' }),
      clip({ id: 'trim-out' }),
      clip({ id: 'trim-speed' }),
      clip({ id: 'modified', effects: [], caption: 'old' }),
    );
    const after = timeline(
      clip({ id: 'added', label: 'New' }),
      clip({ id: 'move-start', start: 5 }),
      clip({ id: 'move-track', trackId: 'V2' }),
      clip({ id: 'trim-in', sourceIn: 1 }),
      clip({ id: 'trim-out', sourceOut: 3 }),
      clip({ id: 'trim-speed', speed: 2 }),
      clip({ id: 'modified', sourceId: 'other', caption: 'new', effects: ['warm'] }),
    );
    const changes = diffTimelines(before, after);
    expect(changes.filter((change) => change.kind === 'added').map((change) => change.clipId)).toEqual(['added']);
    expect(changes.filter((change) => change.kind === 'removed').map((change) => change.clipId)).toEqual(['removed']);
    expect(changes.filter((change) => change.kind === 'moved').map((change) => change.clipId).sort()).toEqual(['move-start', 'move-track']);
    expect(changes.filter((change) => change.kind === 'trimmed').map((change) => change.clipId).sort()).toEqual(['trim-in', 'trim-out', 'trim-speed']);
    const modified = changes.find((change) => change.kind === 'modified');
    expect(modified?.clipId).toBe('modified');
    expect(modified?.detail?.fields).toEqual(['sourceId', 'caption', 'effects']);
  });

  it('emits independent move and trim changes for one clip', () => {
    const changes = diffTimelines(timeline(clip()), timeline(clip({ start: 2, sourceOut: 3 })));
    expect(changes.map((change) => change.kind)).toEqual(['moved', 'trimmed']);
  });

  it('treats effects as a set', () => {
    expect(diffTimelines(timeline(clip({ effects: ['warm', 'bw'] })), timeline(clip({ effects: ['bw', 'warm'] })))).toEqual([]);
    expect(diffTimelines(timeline(clip({ effects: ['warm', 'warm', 'bw'] })), timeline(clip({ effects: ['bw', 'warm'] })))).toEqual([]);
  });

  it('returns the exact six expected seed changes', () => {
    const repo = createDemoRepo();
    const changes = diffTimelines(repo.commits.m2.timeline, repo.commits.mc2.timeline);
    expect(changes).toHaveLength(6);
    expect(changes.reduce<Record<string, number>>((counts, change) => {
      counts[change.kind] = (counts[change.kind] ?? 0) + 1;
      return counts;
    }, {})).toEqual({ trimmed: 1, modified: 1, added: 3, removed: 1 });
  });

  it('does not mutate either input timeline', () => {
    const before = timeline(clip({ effects: ['warm'] }));
    const after = timeline(clip({ start: 3, effects: ['bw'] }));
    const beforeSnapshot = JSON.stringify(before);
    const afterSnapshot = JSON.stringify(after);
    diffTimelines(before, after);
    expect(JSON.stringify(before)).toBe(beforeSnapshot);
    expect(JSON.stringify(after)).toBe(afterSnapshot);
  });
});
