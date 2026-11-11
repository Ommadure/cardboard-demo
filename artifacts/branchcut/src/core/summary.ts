import type { Change, Conflict } from './types';
import { clipDuration } from './timeline';

function seconds(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
}

function printable(value: unknown): string {
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'none';
  if (value === undefined) return 'unset';
  return String(value);
}

export function summarizeChange(change: Change): string {
  const clip = change.after ?? change.before;
  switch (change.kind) {
    case 'added':
      return `Added "${change.label}" on ${clip?.trackId ?? 'unknown track'} at ${seconds(clip?.start ?? 0)}s`;
    case 'removed':
      return `Removed "${change.label}" from ${clip?.trackId ?? 'unknown track'}`;
    case 'moved': {
      const from = change.detail?.fromTrack;
      const to = change.detail?.toTrack;
      if (from && to && from !== to) return `Moved "${change.label}" from ${from} to ${to}`;
      return `Moved "${change.label}" from ${seconds(change.detail?.fromStart ?? 0)}s to ${seconds(change.detail?.toStart ?? 0)}s`;
    }
    case 'trimmed': {
      const beforeDuration = change.before ? clipDuration(change.before) : 0;
      const afterDuration = change.after ? clipDuration(change.after) : 0;
      return `Trimmed "${change.label}" from ${seconds(beforeDuration)}s to ${seconds(afterDuration)}s`;
    }
    case 'modified': {
      const fields = change.detail?.fields ?? [];
      const descriptions = fields.map((field) => {
        if (field === 'effects' && change.before && change.after) {
          const before = new Set(change.before.effects);
          const after = new Set(change.after.effects);
          const added = [...after].filter((effect) => !before.has(effect));
          const removed = [...before].filter((effect) => !after.has(effect));
          return [...added.map((effect) => `Added effect ${effect}`), ...removed.map((effect) => `Removed effect ${effect}`)].join(', ');
        }
        return field;
      });
      return `Changed ${descriptions.join(', ') || 'details'} on "${change.label}"`;
    }
  }
}

export function summarizeConflict(conflict: Conflict): string {
  if (conflict.kind === 'field') {
    return `"${conflict.label}": ${String(conflict.field)} was set to ${printable(conflict.ours)} on your branch and ${printable(conflict.theirs)} on theirs`;
  }
  if (conflict.kind === 'delete-modify') {
    const deletedBy = conflict.oursDeleted ? 'your branch' : 'their branch';
    return `"${conflict.label}" was deleted on ${deletedBy} and modified on the other branch`;
  }
  return `"${conflict.label}" overlaps "${conflict.collidesWith ?? 'another clip'}" on the same track`;
}
