import { clipDuration } from '@/core/timeline';
import { KIND_META } from '@/lib/changes';
import { ROW_H } from './constants';
import type { Ghost } from './types';

export function GhostBlock({ ghost, pxPerSec, anchor, hovered, onHover }: { ghost: Ghost; pxPerSec: number; anchor: string; hovered: boolean; onHover?: (id: string | null) => void }) {
  const { clip, kind } = ghost;
  const removed = kind === 'removed';
  const M = KIND_META[kind];
  return (
    <div
      data-anchor={anchor}
      data-testid={`ghost-${kind}-${clip.id}`}
      onMouseEnter={() => onHover?.(clip.id)}
      onMouseLeave={() => onHover?.(null)}
      className="absolute top-[5px] bottom-[5px] overflow-hidden rounded-[6px] border border-dashed"
      style={{
        left: clip.start * pxPerSec,
        width: Math.max(3, clipDuration(clip) * pxPerSec),
        borderColor: M.color,
        background: removed
          ? 'repeating-linear-gradient(135deg, rgba(239,68,68,.32) 0 4px, rgba(239,68,68,.08) 4px 9px)'
          : 'rgba(59,130,246,.07)',
        boxShadow: hovered ? '0 0 0 3px rgba(231,233,238,0.35)' : undefined,
      }}
      title={`${M.label}: ${clip.label}`}
    >
      <span className={`flex items-center gap-1 truncate px-1.5 pt-[3px] text-[11px] font-medium ${removed ? 'text-[#fca5a5] line-through decoration-[#ef4444]' : 'text-[#93c5fd]'}`}>
        <M.Icon className="h-2.5 w-2.5 shrink-0" strokeWidth={3} />
        {clip.label}
      </span>
      {!removed && <span className="tc block px-1.5 text-[9.5px] text-[#93c5fd]/70">was here</span>}
    </div>
  );
}

export function MoveArrow({ ghost, pxPerSec }: { ghost: Ghost; pxPerSec: number }) {
  if (ghost.toStart === undefined) return null;
  const half = clipDuration(ghost.clip) / 2;
  const x1 = (ghost.clip.start + half) * pxPerSec;
  const x2 = (ghost.toStart + half) * pxPerSec;
  const y = ROW_H - 3;
  const dir = x2 >= x1 ? 1 : -1;
  return (
    <svg className="pointer-events-none absolute inset-0 z-20 overflow-visible" width="100%" height={ROW_H} aria-hidden>
      <line x1={x1} y1={y} x2={x2 - dir * 5} y2={y} stroke="#3b82f6" strokeWidth={1.5} />
      <circle cx={x1} cy={y} r={2} fill="#3b82f6" />
      <path d={`M${x2} ${y} l${-dir * 6} -3.5 v7 z`} fill="#3b82f6" />
    </svg>
  );
}
