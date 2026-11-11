import { describe, expect, it } from 'vitest';
import type { Commit, Timeline } from './types';
import { createDemoRepo } from './seed';
import { isAncestor, lowestCommonAncestor } from './graph';

const empty: Timeline = { clips: [] };
function commits(...rows: [string, string[]][]): Record<string, Commit> {
  return Object.fromEntries(rows.map(([id, parents]) => [id, {
    id, parents, branch: 'main', message: id, author: 'Test', createdAt: 0, timeline: empty,
  }]));
}

describe('commit graph ancestry', () => {
  it('handles linear ancestry and LCA', () => {
    const graph = commits(['a', []], ['b', ['a']], ['c', ['b']]);
    expect(isAncestor(graph, 'a', 'c')).toBe(true);
    expect(isAncestor(graph, 'c', 'a')).toBe(false);
    expect(lowestCommonAncestor(graph, 'b', 'c')).toBe('b');
  });

  it('finds a branch point', () => {
    const graph = commits(['base', []], ['left', ['base']], ['right', ['base']]);
    expect(lowestCommonAncestor(graph, 'left', 'right')).toBe('base');
  });

  it('walks both parents of merge commits', () => {
    const graph = commits(['base', []], ['left', ['base']], ['right', ['base']], ['merge', ['left', 'right']]);
    expect(isAncestor(graph, 'right', 'merge')).toBe(true);
    expect(lowestCommonAncestor(graph, 'merge', 'right')).toBe('right');
  });

  it('uses the demo LCA and handles unrelated/ambiguous histories', () => {
    const repo = createDemoRepo();
    expect(lowestCommonAncestor(repo.commits, 'mc2', 'lb2')).toBe('m2');
    expect(lowestCommonAncestor(commits(['a', []], ['b', []]), 'a', 'b')).toBeNull();
    const ambiguous = commits(['a', []], ['b', []], ['left', ['a', 'b']], ['right', ['a', 'b']]);
    expect(() => lowestCommonAncestor(ambiguous, 'left', 'right')).toThrow(/Ambiguous/);
  });

  it('reports unknown commit IDs clearly', () => {
    expect(() => isAncestor({}, 'missing', 'other')).toThrow(/Unknown commit/);
    expect(() => lowestCommonAncestor(commits(['a', []]), 'a', 'missing')).toThrow(/Unknown commit/);
  });
});
