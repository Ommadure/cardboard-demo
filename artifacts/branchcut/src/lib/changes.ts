import { ArrowLeftRight, Minus, PencilLine, Plus, Scissors, type LucideIcon } from 'lucide-react';
import type { Change, ChangeKind, Clip } from '@/core/types';
import { clipDuration } from '@/core/timeline';
import { sourceOf } from './colors';

export const KIND_ORDER: ChangeKind[] = ['added', 'removed', 'trimmed', 'moved', 'modified'];
export const KIND_META: Record<ChangeKind, { color: string; label: string; Icon: LucideIcon }> = {
  added: { color: '#22c55e', label: 'Added', Icon: Plus },
  removed: { color: '#ef4444', label: 'Removed', Icon: Minus },
  moved: { color: '#3b82f6', label: 'Moved', Icon: ArrowLeftRight },
  trimmed: { color: '#f59e0b', label: 'Trimmed', Icon: Scissors },
  modified: { color: '#a855f7', label: 'Modified', Icon: PencilLine },
};
export const CONFLICT = '#f43f5e';
export const RESOLVED = '#22c55e';

export function countHeader(changes: Change[]): string {
  if (!changes.length) return 'No changes';
  const parts = KIND_ORDER.map((k) => [k, changes.filter((c) => c.kind === k).length] as const)
    .filter(([, n]) => n > 0).map(([k, n]) => `${n} ${k}`);
  return `${changes.length} change${changes.length === 1 ? '' : 's'}: ${parts.join(', ')}`;
}

const r = (n: number) => Number(n.toFixed(2));
export function clipSummary(c?: Clip): string {
  if (!c) return '—';
  return `${c.trackId} · ${r(c.start)}s–${r(c.start + clipDuration(c))}s`;
}

export function fmtField(field: keyof Clip | undefined, v: unknown): string {
  if (v === undefined || v === null) return '—';
  if (Array.isArray(v)) return v.length ? v.join(', ') : 'none';
  if (typeof v === 'number') {
    if (field === 'speed') return `${r(v)}x`;
    return `${r(v)}s`;
  }
  if (field === 'sourceId' && typeof v === 'string') return sourceOf(v)?.label ?? v;
  return String(v);
}
