import { memo } from 'react';
import { waveformFor } from '@/lib/waveform';

/** Bars every 3px; regenerated only when width bucket changes. */
export const Waveform = memo(function Waveform({ id, width }: { id: string; width: number }) {
  const count = Math.max(4, Math.floor(width / 3));
  const amps = waveformFor(id, count);
  return (
    <svg className="absolute inset-x-0 bottom-0 h-[26px] w-full pointer-events-none" preserveAspectRatio="none" viewBox={`0 0 ${count * 3} 26`} aria-hidden>
      {amps.map((a, i) => {
        const h = a * 22;
        return <rect key={i} x={i * 3} y={13 - h / 2} width={1.6} height={h} rx={0.8} fill="currentColor" />;
      })}
    </svg>
  );
});
