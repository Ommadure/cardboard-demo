import { memo } from 'react';
import type { Clip } from '@/core/types';
import { clipDuration } from '@/core/timeline';
import { clipColor, sourceOf } from '@/lib/colors';
import { CONFLICT, KIND_META, RESOLVED } from '@/lib/changes';
import { Waveform } from './Waveform';
import type { TrackKind } from './constants';
import type { ClipMark } from './types';

interface Props {
  clip: Clip;
  pxPerSec: number;
  kind: TrackKind;
  selected: boolean;
  hovered: boolean;
  mark?: ClipMark;
  anchor: string;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
}

export const ClipBlock = memo(function ClipBlock({ clip, pxPerSec, kind, selected, hovered, mark, anchor, onSelect, onHover }: Props) {
  const left = clip.start * pxPerSec;
  const width = Math.max(3, clipDuration(clip) * pxPerSec);
  const color = clipColor(clip.sourceId, clip.trackId);
  const source = sourceOf(clip.sourceId);
  const label = kind === 'text' && clip.caption ? clip.caption : clip.label;
  const ring = mark?.conflict ? CONFLICT : mark?.resolved ? RESOLVED : selected ? '#6366f1' : mark?.kinds?.length ? KIND_META[mark.kinds[0]!].color : null;
  return (
    <button
      type="button"
      data-anchor={anchor}
      data-testid={`clip-${anchor.replace(':', '-')}`}
      aria-pressed={selected}
      aria-label={`${clip.label} on ${clip.trackId}`}
      title={`${clip.label} · ${source?.label ?? clip.sourceId}`}
      onClick={(e) => { e.stopPropagation(); onSelect?.(clip.id); }}
      onMouseEnter={() => onHover?.(clip.id)}
      onMouseLeave={() => onHover?.(null)}
      className={`absolute top-[5px] bottom-[5px] overflow-hidden rounded-[6px] text-left transition-[filter,transform,box-shadow] duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${selected || hovered || mark?.conflict ? 'z-10' : ''}`}
      style={{
        left, width,
        background: `linear-gradient(180deg, color-mix(in srgb, ${color} 80%, #8b93a7 20%) 0%, color-mix(in srgb, ${color} 60%, #0b0d12 40%) 100%)`,
        boxShadow: [
          'inset 0 1px 0 rgba(255,255,255,0.18)', 'inset 0 0 0 1px rgba(0,0,0,0.25)',
          ring ? `0 0 0 2px ${ring}` : '', hovered ? '0 0 0 4px rgba(231,233,238,0.35)' : '',
        ].filter(Boolean).join(', '),
      }}
    >
      {kind === 'audio' && <span className="text-black/35"><Waveform id={clip.id} width={width} /></span>}
      <span className={`relative block truncate px-1.5 pt-[3px] text-[11px] font-medium leading-tight text-white drop-shadow-[0_1px_0_rgba(0,0,0,.35)] ${kind === 'text' ? 'italic' : ''}`}>
        {label}
      </span>
      {kind !== 'audio' && width > 70 && (
        <span className="tc relative block truncate px-1.5 text-[9.5px] text-white/60">{source?.id ?? clip.sourceId}</span>
      )}
      <span className="absolute right-1 top-1 flex items-center gap-0.5">
        {mark?.conflict && (
          <span className="grid h-3.5 w-3.5 place-items-center rounded-[3px] text-[10px] font-bold leading-none text-white" style={{ background: CONFLICT }} aria-label="Conflict">!</span>
        )}
        {mark?.kinds?.map((k) => {
          const M = KIND_META[k];
          return (
            <span key={k} title={M.label} aria-label={M.label} className="grid h-3.5 w-3.5 place-items-center rounded-[3px] text-white" style={{ background: M.color }}>
              <M.Icon className="h-2.5 w-2.5" strokeWidth={3} />
            </span>
          );
        })}
        {!mark?.kinds?.length && !mark?.conflict && width > 40 && clip.effects.map((fx) => (
          <span key={fx} title={fx} className="h-1.5 w-1.5 rounded-full bg-white/70" />
        ))}
      </span>
    </button>
  );
});
