import type { Change, Clip, Timeline } from './types';

function effectSetsEqual(a: Clip['effects'], b: Clip['effects']): boolean {
  const left = new Set(a);
  const right = new Set(b);
  return left.size === right.size && [...left].every((effect) => right.has(effect));
}

const kindOrder = { added: 0, removed: 1, moved: 2, trimmed: 3, modified: 4 } as const;

/** Return stable, per-clip changes from timeline a to timeline b. */
export function diffTimelines(a: Timeline, b: Timeline): Change[] {
  const left = new Map(a.clips.map((clip) => [clip.id, clip]));
  const right = new Map(b.clips.map((clip) => [clip.id, clip]));
  const changes: Change[] = [];

  for (const after of b.clips) {
    const before = left.get(after.id);
    if (!before) {
      changes.push({ clipId: after.id, kind: 'added', label: after.label, after: { ...after, effects: [...after.effects] } });
      continue;
    }
    const moved = before.start !== after.start || before.trackId !== after.trackId;
    if (moved) {
      changes.push({
        clipId: after.id, kind: 'moved', label: after.label,
        before: { ...before, effects: [...before.effects] }, after: { ...after, effects: [...after.effects] },
        detail: { fromStart: before.start, toStart: after.start, fromTrack: before.trackId, toTrack: after.trackId },
      });
    }
    const trimmed = before.sourceIn !== after.sourceIn || before.sourceOut !== after.sourceOut || before.speed !== after.speed;
    if (trimmed) {
      changes.push({
        clipId: after.id, kind: 'trimmed', label: after.label,
        before: { ...before, effects: [...before.effects] }, after: { ...after, effects: [...after.effects] },
        detail: { fromIn: before.sourceIn, toIn: after.sourceIn, fromOut: before.sourceOut, toOut: after.sourceOut },
      });
    }
    const fields: string[] = [];
    if (before.sourceId !== after.sourceId) fields.push('sourceId');
    if (before.label !== after.label) fields.push('label');
    if (before.caption !== after.caption) fields.push('caption');
    if (!effectSetsEqual(before.effects, after.effects)) fields.push('effects');
    if (fields.length) {
      changes.push({
        clipId: after.id, kind: 'modified', label: after.label,
        before: { ...before, effects: [...before.effects] }, after: { ...after, effects: [...after.effects] },
        detail: { fields },
      });
    }
  }
  for (const before of a.clips) {
    if (!right.has(before.id)) {
      changes.push({ clipId: before.id, kind: 'removed', label: before.label, before: { ...before, effects: [...before.effects] } });
    }
  }
  const position = (change: Change): number => {
    if (change.after) return change.after.start;
    if (change.before) return change.before.start;
    return change.detail?.toStart ?? change.detail?.fromStart ?? 0;
  };
  return changes.sort((x, y) => position(x) - position(y) || kindOrder[x.kind] - kindOrder[y.kind] || x.clipId.localeCompare(y.clipId));
}
