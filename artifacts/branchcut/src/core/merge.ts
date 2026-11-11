import type { Change, Clip, Conflict, MergeResult, Resolutions, Timeline, TrackId } from './types';
import { cloneTimeline, findOverlaps, validateTimeline } from './timeline';

const FIELD_ORDER: (keyof Clip)[] = [
  'label', 'trackId', 'sourceId', 'sourceIn', 'sourceOut', 'start', 'speed', 'effects', 'caption',
];
type Provenance = 'ours' | 'theirs' | 'both' | 'conflict' | 'unchanged';

function equalValue(field: keyof Clip, a: unknown, b: unknown): boolean {
  if (field === 'effects') {
    const left = a as Clip['effects'] | undefined;
    const right = b as Clip['effects'] | undefined;
    if (!left || !right) return left === right;
    const leftSet = new Set(left);
    const rightSet = new Set(right);
    return leftSet.size === rightSet.size && [...leftSet].every((effect) => rightSet.has(effect));
  }
  return a === b;
}

function sameClip(a: Clip, b: Clip): boolean {
  return FIELD_ORDER.every((field) => equalValue(field, a[field], b[field]));
}

function copyClip(clip: Clip): Clip {
  return { ...clip, effects: [...clip.effects] };
}

function conflictLabel(base?: Clip, ours?: Clip, theirs?: Clip): string {
  return ours?.label ?? theirs?.label ?? base?.label ?? 'Untitled clip';
}

function makeFieldConflict(clipId: string, field: keyof Clip, base: unknown, ours: unknown, theirs: unknown, clips: {
  base?: Clip; ours?: Clip; theirs?: Clip;
}): Conflict {
  return {
    id: `field:${clipId}:${String(field)}`, clipId, label: conflictLabel(clips.base, clips.ours, clips.theirs),
    kind: 'field', field, base, ours, theirs,
    ...(clips.base ? { baseClip: copyClip(clips.base) } : {}),
    ...(clips.ours ? { oursClip: copyClip(clips.ours) } : {}),
    ...(clips.theirs ? { theirsClip: copyClip(clips.theirs) } : {}),
  };
}

function collisionConflict(a: Clip, b: Clip): Conflict {
  const [first, second] = [a, b].sort((x, y) => x.id.localeCompare(y.id));
  return {
    id: `collision:${first.id}:${second.id}`, clipId: first.id, label: first.label,
    kind: 'collision', collidesWith: second.id,
    oursClip: copyClip(first), theirsClip: copyClip(second),
  };
}

function conflictFieldPairs(conflicts: Conflict[]): Set<string> {
  const ids = new Set<string>();
  for (const conflict of conflicts) {
    if (conflict.kind === 'field') ids.add(conflict.clipId);
  }
  return ids;
}

function makeSummaryChanges(
  baseTimeline: Timeline,
  sideTimeline: Timeline,
  provenance: Map<string, Map<keyof Clip, Provenance>>,
  source: 'ours' | 'theirs',
): Change[] {
  const baseById = new Map(baseTimeline.clips.map((clip) => [clip.id, clip]));
  const sideById = new Map(sideTimeline.clips.map((clip) => [clip.id, clip]));
  const output: Change[] = [];

  for (const [id, after] of sideById) {
    const before = baseById.get(id);
    if (!before) {
      const origin = provenance.get(id)?.get('label');
      if (origin === source || (source === 'ours' && origin === 'both')) {
        output.push({ clipId: id, kind: 'added', label: after.label, after: copyClip(after) });
      }
      continue;
    }
    const fields = provenance.get(id);
    if (!fields) continue;
    const applies = (field: keyof Clip): boolean => fields.get(field) === source
      || (source === 'ours' && fields.get(field) === 'both');
    const moveFields = (['start', 'trackId'] as const).filter(applies);
    const trimFields = (['sourceIn', 'sourceOut', 'speed'] as const).filter(applies);
    const modifiedFields = (['sourceId', 'label', 'caption', 'effects'] as const).filter(applies);
    if (moveFields.length) {
      output.push({
        clipId: id, kind: 'moved', label: after.label, before: copyClip(before), after: copyClip(after),
        detail: { fromStart: before.start, toStart: after.start, fromTrack: before.trackId, toTrack: after.trackId },
      });
    }
    if (trimFields.length) {
      output.push({
        clipId: id, kind: 'trimmed', label: after.label, before: copyClip(before), after: copyClip(after),
        detail: {
          ...(trimFields.includes('sourceIn') ? { fromIn: before.sourceIn, toIn: after.sourceIn } : {}),
          ...(trimFields.includes('sourceOut') ? { fromOut: before.sourceOut, toOut: after.sourceOut } : {}),
        },
      });
    }
    if (modifiedFields.length) {
      output.push({
        clipId: id, kind: 'modified', label: after.label, before: copyClip(before), after: copyClip(after),
        detail: { fields: [...modifiedFields] },
      });
    }
  }
  for (const [id, before] of baseById) {
    if (!sideById.has(id) && provenance.get(id)?.get('label') === source) {
      output.push({ clipId: id, kind: 'removed', label: before.label, before: copyClip(before) });
    }
  }
  const order = { added: 0, removed: 1, moved: 2, trimmed: 3, modified: 4 } as const;
  return output.sort((a, b) => {
    const aClip = a.after ?? a.before;
    const bClip = b.after ?? b.before;
    return (aClip?.start ?? 0) - (bClip?.start ?? 0) || order[a.kind] - order[b.kind] || a.clipId.localeCompare(b.clipId);
  });
}

/** Merge snapshots by stable clip ID and field, retaining ours as unresolved provisional state. */
export function threeWayMerge(base: Timeline, ours: Timeline, theirs: Timeline): MergeResult {
  const baseById = new Map(base.clips.map((clip) => [clip.id, clip]));
  const oursById = new Map(ours.clips.map((clip) => [clip.id, clip]));
  const theirsById = new Map(theirs.clips.map((clip) => [clip.id, clip]));
  const allIds = [...new Set([...baseById.keys(), ...oursById.keys(), ...theirsById.keys()])].sort();
  const merged: Clip[] = [];
  const conflicts: Conflict[] = [];
  const provenance = new Map<string, Map<keyof Clip, Provenance>>();

  for (const id of allIds) {
    const b = baseById.get(id);
    const o = oursById.get(id);
    const t = theirsById.get(id);
    const fieldOrigins = new Map<keyof Clip, Provenance>();
    provenance.set(id, fieldOrigins);

    if (!o && !t) continue;
    if (!b && o && !t) {
      merged.push(copyClip(o));
      for (const field of FIELD_ORDER) fieldOrigins.set(field, 'ours');
      continue;
    }
    if (!b && t && !o) {
      merged.push(copyClip(t));
      for (const field of FIELD_ORDER) fieldOrigins.set(field, 'theirs');
      continue;
    }
    if (b && (!o || !t)) {
      const survivor = o ?? t;
      if (!survivor) continue;
      const survivorChanged = !sameClip(b, survivor);
      if (!survivorChanged) {
        // A clean one-sided deletion is itself an automatically attributable change.
        fieldOrigins.set('label', o ? 'theirs' : 'ours');
        continue;
      }
      conflicts.push({
        id: `delete-modify:${id}`, clipId: id, label: conflictLabel(b, o, t), kind: 'delete-modify',
        oursDeleted: !o, theirsDeleted: !t,
        baseClip: copyClip(b),
        ...(o ? { oursClip: copyClip(o) } : {}),
        ...(t ? { theirsClip: copyClip(t) } : {}),
      });
      // The provisional state always follows ours, including deletion.
      if (o) merged.push(copyClip(o));
      fieldOrigins.set('label', 'conflict');
      continue;
    }
    if (!o || !t) continue;

    const output = copyClip(o);
    for (const field of FIELD_ORDER) {
      const baseValue = b?.[field];
      const oursValue = o[field];
      const theirsValue = t[field];
      let origin: Provenance;
      if (equalValue(field, oursValue, theirsValue)) {
        origin = b
          ? (!equalValue(field, baseValue, oursValue) ? 'both' : 'unchanged')
          : 'both';
      } else if (b && equalValue(field, baseValue, oursValue)) {
        origin = 'theirs';
        (output as unknown as Record<string, unknown>)[field] = field === 'effects' ? [...(theirsValue as Clip['effects'])] : theirsValue;
      } else if (b && equalValue(field, baseValue, theirsValue)) {
        origin = 'ours';
      } else {
        origin = 'conflict';
        conflicts.push(makeFieldConflict(id, field, baseValue, oursValue, theirsValue, { base: b, ours: o, theirs: t }));
      }
      fieldOrigins.set(field, origin);
    }
    merged.push(output);
  }

  const timeline = { clips: merged };
  const fieldConflictIds = conflictFieldPairs(conflicts);
  for (const [a, b] of findOverlaps(timeline)) {
    if (!fieldConflictIds.has(a.id) && !fieldConflictIds.has(b.id)) conflicts.push(collisionConflict(a, b));
  }
  conflicts.sort((a, b) => a.id.localeCompare(b.id));

  return {
    merged: cloneTimeline(timeline),
    conflicts,
    appliedFromTheirs: makeSummaryChanges(base, theirs, provenance, 'theirs'),
    keptFromOurs: makeSummaryChanges(base, ours, provenance, 'ours'),
  };
}

function overflowTrack(trackId: TrackId, timeline: Timeline): TrackId {
  const family = trackId[0];
  const used = new Set(timeline.clips.map((clip) => clip.trackId));
  let number = 1;
  while (used.has(`${family}${number}` as TrackId)) number += 1;
  return `${family}${number}` as TrackId;
}

function overlapsPair(timeline: Timeline, firstId: string, secondId: string): boolean {
  return findOverlaps(timeline).some(([a, b]) =>
    (a.id === firstId && b.id === secondId) || (a.id === secondId && b.id === firstId),
  );
}

function chooseField(timeline: Timeline, conflict: Conflict, choice: 'ours' | 'theirs'): void {
  const clip = timeline.clips.find((item) => item.id === conflict.clipId);
  if (!clip || !conflict.field) return;
  const selected = choice === 'ours' ? conflict.ours : conflict.theirs;
  (clip as unknown as Record<string, unknown>)[conflict.field] = conflict.field === 'effects' && Array.isArray(selected)
    ? [...selected] : selected;
}

function resolveDeleteModify(timeline: Timeline, conflict: Conflict, choice: 'ours' | 'theirs'): void {
  const selectedDeleted = choice === 'ours' ? conflict.oursDeleted : conflict.theirsDeleted;
  const selectedClip = choice === 'ours' ? conflict.oursClip : conflict.theirsClip;
  const index = timeline.clips.findIndex((clip) => clip.id === conflict.clipId);
  if (selectedDeleted) {
    if (index >= 0) timeline.clips.splice(index, 1);
  } else if (selectedClip) {
    if (index >= 0) timeline.clips[index] = copyClip(selectedClip);
    else timeline.clips.push(copyClip(selectedClip));
  }
}

function applyCollisionChoice(timeline: Timeline, conflict: Conflict, choice: 'ours' | 'theirs' | 'both'): void {
  const firstId = conflict.clipId;
  const secondId = conflict.collidesWith;
  if (!secondId || !overlapsPair(timeline, firstId, secondId)) return;
  if (choice === 'both') {
    const second = timeline.clips.find((clip) => clip.id === secondId);
    if (second) second.trackId = overflowTrack(second.trackId, timeline);
    return;
  }
  const keepId = choice === 'ours' ? firstId : secondId;
  const discardId = keepId === firstId ? secondId : firstId;
  const index = timeline.clips.findIndex((clip) => clip.id === discardId);
  if (index >= 0) timeline.clips.splice(index, 1);
}

function applyChoices(result: MergeResult, resolutions: Resolutions): { timeline: Timeline; activeCollisions: Conflict[] } {
  const timeline = cloneTimeline(result.merged);
  for (const conflict of result.conflicts) {
    if (conflict.kind === 'field') {
      const choice = resolutions[conflict.id];
      if (choice === 'ours' || choice === 'theirs') chooseField(timeline, conflict, choice);
    } else if (conflict.kind === 'delete-modify') {
      const choice = resolutions[conflict.id];
      if (choice === 'ours' || choice === 'theirs') resolveDeleteModify(timeline, conflict, choice);
    }
  }

  const processed = new Set<string>();
  for (let pass = 0; pass < 100; pass += 1) {
    let changed = false;
    const overlaps = findOverlaps(timeline);
    for (const [a, b] of overlaps) {
      const current = collisionConflict(a, b);
      if (processed.has(current.id)) continue;
      processed.add(current.id);
      const choice = resolutions[current.id];
      if (choice) {
        applyCollisionChoice(timeline, current, choice);
        changed = true;
      }
    }
    if (!changed) break;
  }

  const activeCollisions = findOverlaps(timeline).map(([a, b]) => {
    const conflict = collisionConflict(a, b);
    conflict.resolution = resolutions[conflict.id];
    return conflict;
  });
  return { timeline, activeCollisions };
}

/** Preview resolutions; original conflicts are retained and newly exposed collisions are appended. */
export function previewResolutions(result: MergeResult, resolutions: Resolutions): { timeline: Timeline; conflicts: Conflict[] } {
  const { timeline, activeCollisions } = applyChoices(result, resolutions);
  const original = result.conflicts.map((conflict) => ({ ...conflict, resolution: resolutions[conflict.id] }));
  const known = new Set(original.map((conflict) => conflict.id));
  const additional = activeCollisions.filter((conflict) => !known.has(conflict.id));
  return {
    timeline: cloneTimeline(timeline),
    conflicts: [...original, ...additional].sort((a, b) => a.id.localeCompare(b.id)),
  };
}

/** Apply every required resolution and reject invalid or overlapping final timelines. */
export function applyResolutions(result: MergeResult, resolutions: Resolutions): Timeline {
  for (const conflict of result.conflicts) {
    if (conflict.kind === 'collision') continue; // A field choice may remove this collision before it needs a decision.
    if (!resolutions[conflict.id]) throw new Error(`Conflict "${conflict.id}" is unresolved.`);
  }
  const { timeline, activeCollisions } = applyChoices(result, resolutions);
  if (activeCollisions.length) throw new Error(`Conflict "${activeCollisions[0].id}" is unresolved.`);
  const validationErrors = validateTimeline(timeline);
  if (validationErrors.length) throw new Error(`Merged timeline is invalid: ${validationErrors.join(' ')}`);
  const overlaps = findOverlaps(timeline);
  if (overlaps.length) throw new Error(`Merged timeline has overlapping clips "${overlaps[0][0].id}" and "${overlaps[0][1].id}".`);
  return cloneTimeline(timeline);
}

