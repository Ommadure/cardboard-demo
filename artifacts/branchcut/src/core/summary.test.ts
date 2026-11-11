import { describe, expect, it } from 'vitest';
import type { Change, Clip, Conflict } from './types';
import { summarizeChange, summarizeConflict } from './summary';

const clip: Clip = {
  id: 'x', label: 'Hero', trackId: 'V1', sourceId: 'hero.mp4',
  sourceIn: 0, sourceOut: 5, start: 3, speed: 1, effects: [],
};
const change = (kind: Change['kind'], extras: Partial<Change> = {}): Change => ({ clipId: 'x', kind, label: 'Hero', ...extras });

describe('plain-English summaries', () => {
  it('summarizes every change kind deterministically', () => {
    expect(summarizeChange(change('added', { after: clip }))).toBe('Added "Hero" on V1 at 3s');
    expect(summarizeChange(change('removed', { before: clip }))).toBe('Removed "Hero" from V1');
    expect(summarizeChange(change('moved', { detail: { fromStart: 1, toStart: 2.25 } }))).toBe('Moved "Hero" from 1s to 2.3s');
    expect(summarizeChange(change('trimmed', {
      before: clip, after: { ...clip, sourceOut: 2.5 },
    }))).toBe('Trimmed "Hero" from 5s to 2.5s');
    expect(summarizeChange(change('modified', {
      before: clip, after: { ...clip, effects: ['fade-out'] }, detail: { fields: ['effects'] },
    }))).toBe('Changed Added effect fade-out on "Hero"');
  });

  it('summarizes a field conflict', () => {
    const conflict: Conflict = {
      id: 'field:x:sourceOut', clipId: 'x', label: 'Hero', kind: 'field',
      field: 'sourceOut', base: 6, ours: 4, theirs: 5,
    };
    expect(summarizeConflict(conflict)).toBe('"Hero": sourceOut was set to 4 on your branch and 5 on theirs');
  });

  it('summarizes presence and collision conflicts', () => {
    expect(summarizeConflict({
      id: 'delete-modify:x', clipId: 'x', label: 'Hero', kind: 'delete-modify', oursDeleted: true,
    })).toContain('deleted on your branch');
    expect(summarizeConflict({
      id: 'collision:x:y', clipId: 'x', label: 'Hero', kind: 'collision', collidesWith: 'Other',
    })).toContain('overlaps "Other"');
  });
});
