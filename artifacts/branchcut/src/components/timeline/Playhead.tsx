import { RULER_H } from './constants';

export function Playhead({ time, pxPerSec, height }: { time: number; pxPerSec: number; height: number }) {
  return (
    <div
      className="pointer-events-none absolute top-0 left-0 z-[35] will-change-transform"
      style={{ transform: `translateX(${time * pxPerSec}px)`, height }}
      data-testid="timeline-playhead"
    >
      <div className="absolute -left-[5px] top-[6px] h-3 w-[11px] rounded-[2px] bg-[#e7e9ee] [clip-path:polygon(0_0,100%_0,100%_60%,50%_100%,0_60%)]" />
      <div className="absolute left-0 w-px bg-[#e7e9ee]/90" style={{ top: RULER_H - 6, bottom: 0 }} />
    </div>
  );
}
