import type { Commit } from './types';

function parentsOf(commits: Record<string, Commit>, id: string): string[] {
  const commit = commits[id];
  if (!commit) throw new Error(`Unknown commit "${id}".`);
  return commit.parents;
}

function ancestorDistances(commits: Record<string, Commit>, startId: string): Map<string, number> {
  if (!commits[startId]) throw new Error(`Unknown commit "${startId}".`);
  const distances = new Map<string, number>([[startId, 0]]);
  const queue = [startId];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const id = queue[cursor];
    const distance = distances.get(id) ?? 0;
    for (const parent of parentsOf(commits, id)) {
      if (!commits[parent]) throw new Error(`Commit "${id}" references unknown parent "${parent}".`);
      const old = distances.get(parent);
      if (old === undefined || old > distance + 1) {
        distances.set(parent, distance + 1);
        queue.push(parent);
      }
    }
  }
  return distances;
}

export function isAncestor(commits: Record<string, Commit>, ancestorId: string, descendantId: string): boolean {
  if (!commits[ancestorId]) throw new Error(`Unknown commit "${ancestorId}".`);
  return ancestorDistances(commits, descendantId).has(ancestorId);
}

/** Find the unique best common ancestor, rejecting unrelated or ambiguous histories. */
export function lowestCommonAncestor(commits: Record<string, Commit>, aId: string, bId: string): string | null {
  const a = ancestorDistances(commits, aId);
  const b = ancestorDistances(commits, bId);
  const common = [...a.keys()].filter((id) => b.has(id));
  if (!common.length) return null;
  const best = common.filter((candidate) => !common.some((other) =>
    other !== candidate && isAncestor(commits, candidate, other),
  ));
  if (best.length !== 1) throw new Error(`Ambiguous merge base for "${aId}" and "${bId}".`);
  return best[0];
}
