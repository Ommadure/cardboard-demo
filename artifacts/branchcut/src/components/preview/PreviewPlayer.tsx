import type { ReactNode } from 'react';
import { Mic, Music, Waves } from 'lucide-react';
import type { Timeline } from '@/core/types';
import { activeClip, activeOnFamily, effectFilter, fadeOpacity } from '@/lib/preview';
import { formatTimecode } from '@/lib/timecode';
import { NoSignal, SceneCard } from './SceneCard';

const AUDIO_ICON: Record<string, typeof Music> = { A1: Mic, A2: Music, A3: Waves };

export function PreviewPlayer({ timeline, time, tag, title, testId = 'preview' }: { timeline: Timeline; time: number; tag?: string; title?: ReactNode; testId?: string }) {
  const v1 = activeClip(timeline, 'V1', time);
  const overlays = activeOnFamily(timeline, 'V', time).filter((c) => c.trackId !== 'V1');
  const captions = activeOnFamily(timeline, 'C', time);
  const audio = activeOnFamily(timeline, 'A', time);
  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5" data-testid={testId}>
      {title && <div className="flex items-center gap-2 truncate text-[11.5px] text-[#8b93a7]">{tag && <span className="tc grid h-4 w-4 place-items-center rounded bg-[#6366f1] text-[10px] font-bold text-white">{tag}</span>}{title}</div>}
      <div className="grid min-h-0 flex-1 place-items-center">
        <div className="relative max-w-full overflow-hidden rounded-lg border border-[#222733] bg-[#07080b] shadow-[0_18px_50px_-20px_rgba(0,0,0,.8)] [container-type:inline-size]" style={{ aspectRatio: '16 / 9', height: '100%' }}>
          {v1 ? <SceneCard key={v1.id} clip={v1} time={time} /> : <NoSignal />}
          {overlays.map((c, i) => (
            <div key={c.id} className="absolute right-[3%] aspect-video w-[35%] overflow-hidden rounded-[0.8cqw] border border-white/25 shadow-[0_8px_30px_rgba(0,0,0,.5)]" style={{ bottom: `${5 + i * 30}%` }}>
              <SceneCard clip={c} time={time} pip />
            </div>
          ))}
          {captions.map((c) => (
            <div key={c.id} className="absolute inset-x-0 bottom-[6%] flex justify-center px-[20%]" style={{ opacity: fadeOpacity(c, time), filter: effectFilter(c.effects) }}>
              <span className="rounded-[0.6cqw] bg-black/75 px-[1.4cqw] py-[0.5cqw] text-center font-bold text-white" style={{ fontSize: '2.6cqw' }} data-testid={`caption-${c.id}`}>
                {c.caption ?? c.label}
              </span>
            </div>
          ))}
          <span className="tc absolute right-[1.5%] top-[2.5%] rounded bg-black/50 px-[0.8cqw] text-white/80" style={{ fontSize: '1.3cqw' }}>{formatTimecode(time)}</span>
        </div>
      </div>
      <div className="flex h-5 shrink-0 items-center gap-2 text-[11px]">
        {audio.length === 0 ? <span className="text-[#8b93a7]/70">No active audio</span> : audio.map((a) => {
          const Icon = AUDIO_ICON[a.trackId] ?? Waves;
          return (
            <span key={a.id} className="flex items-center gap-1 rounded-full border border-[#222733] bg-[#12151c] px-2 py-px text-[#e7e9ee]" data-testid={`audio-active-${a.id}`}>
              <Icon className="h-3 w-3 text-[#8b93a7]" />{a.label}
              <span className="ml-0.5 flex items-end gap-px">{[3, 6, 4].map((h, i) => <span key={i} className="w-px bg-[#22c55e]" style={{ height: h }} />)}</span>
            </span>
          );
        })}
        <span className="ml-auto text-[10.5px] italic text-[#8b93a7]" data-testid="text-simulated-notice">Preview is simulated from timeline data.</span>
      </div>
    </div>
  );
}
