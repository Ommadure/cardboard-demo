import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Clip, Conflict, Timeline } from '@/core/types';
import { summarizeConflict } from '@/core/summary';
import { clipSummary, fmtField } from '@/lib/changes';

type Choice = 'ours' | 'theirs' | 'both';
interface Props {
  conflict: Conflict;
  active: boolean;
  oursBranch: string;
  theirsBranch: string;
  merged: Timeline;
  hovered: boolean;
  onResolve: (id: string, r: Choice) => void;
  onHover: (id: string | null) => void;
  onFocus: (c: Conflict) => void;
}

function choices(c: Conflict): { r: Choice; label: string }[] {
  if (c.kind === 'field') return [{ r: 'ours', label: 'Take ours' }, { r: 'theirs', label: 'Take theirs' }];
  if (c.kind === 'delete-modify') {
    return c.oursDeleted
      ? [{ r: 'theirs', label: 'Keep clip (their version)' }, { r: 'ours', label: 'Delete clip' }]
      : [{ r: 'ours', label: 'Keep clip (our version)' }, { r: 'theirs', label: 'Delete clip' }];
  }
  const a = c.oursClip?.label ?? c.clipId;
  const b = c.theirsClip?.label ?? c.collidesWith ?? '';
  return [{ r: 'ours', label: `Keep ${a}` }, { r: 'theirs', label: `Keep ${b}` }, { r: 'both', label: `Keep both (move ${b} to a new track)` }];
}

function columns(c: Conflict, ours: string, theirs: string): { head: string; value: string; side?: Choice }[] {
  if (c.kind === 'field') return [
    { head: 'Base', value: fmtField(c.field, c.base) },
    { head: `Ours · ${ours}`, value: fmtField(c.field, c.ours), side: 'ours' },
    { head: `Theirs · ${theirs}`, value: fmtField(c.field, c.theirs), side: 'theirs' },
  ];
  if (c.kind === 'delete-modify') return [
    { head: 'Base', value: clipSummary(c.baseClip) },
    { head: `Ours · ${ours}`, value: c.oursDeleted ? 'Deleted' : clipSummary(c.oursClip), side: 'ours' },
    { head: `Theirs · ${theirs}`, value: c.theirsDeleted ? 'Deleted' : clipSummary(c.theirsClip), side: 'theirs' },
  ];
  const label = (x?: Clip) => (x ? `${x.label}\n${clipSummary(x)}` : '—');
  return [
    { head: 'Base', value: 'No overlap' },
    { head: 'Clip 1', value: label(c.oursClip), side: 'ours' },
    { head: 'Clip 2', value: label(c.theirsClip), side: 'theirs' },
  ];
}

const KIND_LABEL = { field: 'Field', 'delete-modify': 'Delete vs modify', collision: 'Overlap' } as const;

export function ConflictCard({ conflict: c, active, oursBranch, theirsBranch, hovered, onResolve, onHover, onFocus }: Props) {
  const resolved = !!c.resolution;
  const cleared = c.kind === 'collision' && !active && !resolved;
  const tone = resolved || cleared ? '#22c55e' : '#f43f5e';
  return (
    <article
      onMouseEnter={() => onHover(c.clipId)} onMouseLeave={() => onHover(null)}
      data-testid={`card-conflict-${c.id}`}
      data-resolved={resolved || cleared}
      className={`bc-rise rounded-lg border p-3 transition-[border-color,background-color] duration-200 ${hovered ? 'bg-[#171b24]' : 'bg-[#12151c]'}`}
      style={{ borderColor: `color-mix(in srgb, ${tone} ${resolved ? 70 : 45}%, #222733)`, background: resolved ? 'rgba(34,197,94,0.06)' : undefined }}
    >
      <header className="mb-1 flex items-center gap-1.5">
        {resolved || cleared ? <CheckCircle2 className="h-3.5 w-3.5 text-[#22c55e]" /> : <AlertTriangle className="h-3.5 w-3.5 text-[#f43f5e]" />}
        <button type="button" onClick={() => onFocus(c)} className="truncate text-[13px] font-semibold text-[#e7e9ee] hover:underline" data-testid={`button-focus-${c.id}`}>{c.label}</button>
        <span className="tc ml-auto shrink-0 rounded border border-[#222733] px-1.5 text-[9.5px] uppercase tracking-wider text-[#8b93a7]">
          {KIND_LABEL[c.kind]}{c.field ? ` · ${String(c.field)}` : ''}
        </span>
      </header>
      <p className="mb-2 text-[11.5px] leading-snug text-[#8b93a7]">{cleared ? 'No longer overlapping after your other choices.' : summarizeConflict(c)}</p>
      <div className="mb-2.5 grid grid-cols-3 gap-1">
        {columns(c, oursBranch, theirsBranch).map((col) => {
          const chosen = col.side && c.resolution === col.side;
          return (
            <div key={col.head} className={`rounded-md border px-1.5 py-1 ${chosen ? 'border-[#22c55e]/70 bg-[#22c55e]/10' : 'border-[#222733] bg-[#0b0d12]'}`}>
              <div className="truncate text-[9.5px] font-medium uppercase tracking-wider text-[#8b93a7]">{col.head}</div>
              <div className="tc whitespace-pre-line break-words text-[11px] leading-snug text-[#e7e9ee]">{col.value}</div>
            </div>
          );
        })}
      </div>
      {!cleared && (
        <div className="flex flex-wrap gap-1" role="group" aria-label={`Resolve ${c.label}`}>
          {choices(c).map(({ r, label }) => {
            const on = c.resolution === r;
            return (
              <button
                key={r} type="button" aria-pressed={on} onClick={() => onResolve(c.id, r)} data-testid={`button-resolve-${r}-${c.id}`}
                className={`h-7 rounded-md border px-2 text-[11.5px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]/60 ${on ? 'border-[#22c55e] bg-[#22c55e] text-[#05210f]' : 'border-[#222733] bg-[#171b24] text-[#e7e9ee] hover:bg-[#1d2230]'}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </article>
  );
}
