import { describe, expect, it } from 'vitest';
import type { Clip, Resolutions, Timeline } from './types';
import { applyResolutions, previewResolutions, threeWayMerge } from './merge';
import { createDemoRepo } from './seed';
import { findOverlaps, validateTimeline } from './timeline';
import { lowestCommonAncestor, isAncestor } from './graph';

function clip(id: string, overrides: Partial<Clip> = {}): Clip {
  return {
    id, label: id, trackId: 'V1', sourceId: 'intro.mp4',
    sourceIn: 0, sourceOut: 4, start: 0, speed: 1, effects: [],
    ...overrides,
  };
}
const timeline = (...clips: Clip[]): Timeline => ({ clips });
const only = (timelineValue: Timeline, id: string): Clip | undefined => timelineValue.clips.find((item) => item.id === id);

describe('three-way merge', () => {
  it('combines changes made only by either side and preserves field-level provenance', () => {
    const base = timeline(clip('x'));
    const ours = timeline(clip('x', { start: 2 }));
    const theirs = timeline(clip('x', { sourceOut: 3 }));
    const result = threeWayMerge(base, ours, theirs);
    expect(result.conflicts).toEqual([]);
    expect(only(result.merged, 'x')).toMatchObject({ start: 2, sourceOut: 3 });
    expect(result.keptFromOurs.map((change) => change.kind)).toEqual(['moved']);
    expect(result.appliedFromTheirs.map((change) => change.kind)).toEqual(['trimmed']);
  });

  it('accepts the same change made on both sides without a conflict', () => {
    const base = timeline(clip('x'));
    const same = timeline(clip('x', { label: 'Shared update', effects: ['warm', 'bw'] }));
    const reversedEffectOrder = timeline(clip('x', { label: 'Shared update', effects: ['bw', 'warm'] }));
    const result = threeWayMerge(base, same, reversedEffectOrder);
    expect(result.conflicts).toEqual([]);
    expect(only(result.merged, 'x')).toMatchObject({ label: 'Shared update' });
    expect(only(result.merged, 'x')?.effects).toEqual(['warm', 'bw']);
  });

  it('creates stable field conflicts and uses ours provisionally', () => {
    const result = threeWayMerge(
      timeline(clip('x', { sourceOut: 6 })),
      timeline(clip('x', { sourceOut: 4 })),
      timeline(clip('x', { sourceOut: 5 })),
    );
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0]).toMatchObject({
      id: 'field:x:sourceOut', kind: 'field', base: 6, ours: 4, theirs: 5,
    });
    expect(only(result.merged, 'x')?.sourceOut).toBe(4);
    expect(() => applyResolutions(result, {})).toThrow(/unresolved/);
    expect(applyResolutions(result, { 'field:x:sourceOut': 'theirs' }).clips[0].sourceOut).toBe(5);
  });

  it('handles delete-vs-modify in either direction with ours as provisional state', () => {
    const base = timeline(clip('x'));
    const deletedOurs = threeWayMerge(base, timeline(), timeline(clip('x', { label: 'Changed' })));
    expect(deletedOurs.conflicts[0]).toMatchObject({
      kind: 'delete-modify', oursDeleted: true, theirsDeleted: false,
    });
    expect(only(deletedOurs.merged, 'x')).toBeUndefined();
    const keepTheirs = applyResolutions(deletedOurs, { 'delete-modify:x': 'theirs' });
    expect(only(keepTheirs, 'x')?.label).toBe('Changed');

    const deletedTheirs = threeWayMerge(base, timeline(clip('x', { label: 'Changed' })), timeline());
    expect(deletedTheirs.conflicts[0]).toMatchObject({
      kind: 'delete-modify', oursDeleted: false, theirsDeleted: true,
    });
    expect(only(deletedTheirs.merged, 'x')?.label).toBe('Changed');
    expect(applyResolutions(deletedTheirs, { 'delete-modify:x': 'theirs' }).clips).toEqual([]);
  });

  it('includes additions made on only one side', () => {
    const result = threeWayMerge(timeline(), timeline(clip('ours')), timeline(clip('theirs', { trackId: 'A1', sourceId: 'voiceover.mp3' })));
    expect(result.conflicts).toEqual([]);
    expect(result.merged.clips.map((item) => item.id)).toEqual(['ours', 'theirs']);
    expect(result.appliedFromTheirs.map((change) => change.clipId)).toEqual(['theirs']);
    expect(result.keptFromOurs.map((change) => change.clipId)).toEqual(['ours']);
  });

  it('merges same-ID additions field-by-field, conflicting only where values differ', () => {
    const base = timeline();
    const ours = timeline(clip('new', { label: 'Ours label', effects: ['warm'] }));
    const theirs = timeline(clip('new', { label: 'Theirs label', effects: ['warm'] }));
    const result = threeWayMerge(base, ours, theirs);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0]).toMatchObject({ kind: 'field', clipId: 'new', field: 'label' });
    expect(only(applyResolutions(result, { [result.conflicts[0].id]: 'theirs' }), 'new')?.label).toBe('Theirs label');

    const matching = threeWayMerge(base, ours, timeline(clip('new', { label: 'Ours label', effects: ['warm'] })));
    expect(matching.conflicts).toEqual([]);
    expect(only(matching.merged, 'new')).toBeDefined();
  });

  it('treats effect arrays as sets while merging additions/removals', () => {
    const result = threeWayMerge(
      timeline(clip('x', { effects: ['warm'] })),
      timeline(clip('x', { effects: ['warm', 'bw'] })),
      timeline(clip('x', { effects: ['warm', 'cool'] })),
    );
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].field).toBe('effects');
    expect(only(result.merged, 'x')?.effects).toEqual(['warm', 'bw']);
    expect(only(applyResolutions(result, { [result.conflicts[0].id]: 'theirs' }), 'x')?.effects).toEqual(['warm', 'cool']);

    const duplicates = threeWayMerge(
      timeline(clip('same', { effects: ['warm'] })),
      timeline(clip('same', { effects: ['warm', 'bw', 'bw'] })),
      timeline(clip('same', { effects: ['bw', 'warm'] })),
    );
    expect(duplicates.conflicts).toEqual([]);
    expect(only(duplicates.merged, 'same')?.effects).toEqual(['warm', 'bw', 'bw']);
  });

  it('does not claim a conflicting start as an automatically moved change', () => {
    const result = threeWayMerge(
      timeline(clip('x', { start: 0 })),
      timeline(clip('x', { start: 2 })),
      timeline(clip('x', { start: 3, effects: ['fade-out'] })),
    );
    expect(result.conflicts.map((conflict) => conflict.field)).toEqual(['start']);
    expect(result.appliedFromTheirs.map((change) => change.kind)).toEqual(['modified']);
    expect(result.keptFromOurs).toEqual([]);
  });

  it('detects existing collisions and moves both clips to a dynamic overflow track', () => {
    const oursClip = clip('a');
    const theirsClip = clip('b');
    const result = threeWayMerge(
      timeline(clip('occupied-v2', { trackId: 'V2', start: 20 })),
      timeline(oursClip, clip('occupied-v2', { trackId: 'V2', start: 20 })),
      timeline(theirsClip, clip('occupied-v2', { trackId: 'V2', start: 20 })),
    );
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].kind).toBe('collision');
    const resolved = applyResolutions(result, { [result.conflicts[0].id]: 'both' });
    expect(only(resolved, 'b')?.trackId).toBe('V3');
    expect(findOverlaps(resolved)).toEqual([]);
    expect(validateTimeline(resolved)).toEqual([]);
    expect(result.merged.clips.find((item) => item.id === 'b')?.trackId).toBe('V1');
  });

  it('freshly rechecks collisions exposed by a field resolution and permits a later resolution', () => {
    const result = threeWayMerge(
      timeline(clip('a', { sourceOut: 4 }), clip('b', { start: 5 })),
      timeline(clip('a', { sourceOut: 3 }), clip('b', { start: 5 })),
      timeline(clip('a', { sourceOut: 6 }), clip('b', { start: 5 })),
    );
    expect(result.conflicts.map((conflict) => conflict.id)).toEqual(['field:a:sourceOut']);
    const afterField = previewResolutions(result, { 'field:a:sourceOut': 'theirs' });
    expect(afterField.conflicts.map((conflict) => conflict.kind).sort()).toEqual(['collision', 'field']);
    const collision = afterField.conflicts.find((conflict) => conflict.kind === 'collision');
    expect(collision).toBeDefined();
    const all: Resolutions = { 'field:a:sourceOut': 'theirs', [collision!.id]: 'ours' };
    expect(findOverlaps(applyResolutions(result, all))).toEqual([]);
  });

  it('validates final resolutions and never mutates input snapshots', () => {
    const result = threeWayMerge(
      timeline(clip('a', { sourceOut: 4 })),
      timeline(clip('a', { sourceOut: 3 })),
      timeline(clip('a', { sourceOut: 6 })),
    );
    const snapshot = JSON.stringify(result);
    const resolved = applyResolutions(result, { 'field:a:sourceOut': 'theirs' });
    resolved.clips[0].effects.push('bw');
    expect(JSON.stringify(result)).toBe(snapshot);
    expect(() => applyResolutions({ ...result, merged: timeline(clip('invalid', { sourceOut: 0 })) }, {})).toThrow(/unresolved/);
  });

  it('matches the seed merge result, exact provenance counts, and all four resolution combinations', () => {
    const repo = createDemoRepo();
    const base = repo.commits.m2.timeline;
    const ours = repo.commits.mc2.timeline;
    const theirs = repo.commits.lb2.timeline;
    expect(lowestCommonAncestor(repo.commits, 'mc2', 'lb2')).toBe('m2');
    expect(isAncestor(repo.commits, 'm2', 'mc2')).toBe(true);
    const result = threeWayMerge(base, ours, theirs);
    expect(result.conflicts).toHaveLength(2);
    expect(result.conflicts.map(({ kind, clipId, field }) => ({ kind, clipId, field }))).toEqual([
      { kind: 'delete-modify', clipId: 'c_broll2', field: undefined },
      { kind: 'field', clipId: 'c_intro', field: 'sourceOut' },
    ]);
    expect(result.appliedFromTheirs).toHaveLength(2);
    expect(result.appliedFromTheirs.map((change) => `${change.clipId}:${change.kind}`).sort()).toEqual(['c_broll1:moved', 'c_sfx:added']);
    expect(result.keptFromOurs).toHaveLength(4);
    const [field, deletion] = result.conflicts;
    for (const fieldChoice of ['ours', 'theirs'] as const) {
      for (const deleteChoice of ['ours', 'theirs'] as const) {
        const resolutions: Resolutions = { [field.id]: fieldChoice, [deletion.id]: deleteChoice };
        const final = applyResolutions(result, resolutions);
        expect(findOverlaps(final)).toEqual([]);
        expect(validateTimeline(final)).toEqual([]);
        expect(final.clips.filter((item) => item.id.startsWith('c_cap')).length).toBe(3);
      }
    }
  });

  it('detects the seed fast-forward and already-up-to-date relations', () => {
    const repo = createDemoRepo();
    expect(isAncestor(repo.commits, repo.branches.main, repo.branches.captions)).toBe(true);
    expect(isAncestor(repo.commits, repo.branches.captions, repo.branches.main)).toBe(false);
    expect(isAncestor(repo.commits, repo.branches.main, repo.branches.main)).toBe(true);
  });
});
