import { useCallback, useRef } from 'react';
import { RULER_H } from './constants';

interface Props { duration: number; pxPerSec: number; onSeek: (t: number) => void }

export function Ruler({ duration, pxPerSec, onSeek }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const labelEvery = pxPerSec >= 60 ? 1 : pxPerSec >= 32 ? 2 : 5;
  const ticks = [];
  for (let s = 0; s <= duration; s++) {
    const major = s % labelEvery === 0;
    ticks.push(
      <div key={s} className="absolute bottom-0" style={{ left: s * pxPerSec }}>
        <div className={`w-px ${major ? 'h-2.5 bg-[#8b93a7]/70' : 'h-1.5 bg-[#8b93a7]/30'}`} />
        {major && <span className="tc absolute bottom-3 left-1 text-[10px] text-[#8b93a7]">{s}s</span>}
      </div>,
    );
  }
  const seekFrom = useCallback((clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    onSeek(Math.min(duration, Math.max(0, (clientX - r.left) / pxPerSec)));
  }, [duration, pxPerSec, onSeek]);

  return (
    <div
      ref={ref}
      role="slider"
      aria-label="Timeline ruler: click or drag to move the playhead"
      aria-valuemin={0}
      aria-valuemax={duration}
      data-testid="timeline-ruler"
      className="relative shrink-0 cursor-ew-resize select-none border-b border-[#222733] bg-[#0f1218]"
      style={{ height: RULER_H, width: duration * pxPerSec }}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); seekFrom(e.clientX); }}
      onPointerMove={(e) => { if (e.buttons === 1) seekFrom(e.clientX); }}
    >
      {ticks}
    </div>
  );
}
