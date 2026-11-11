import type { ReactNode } from 'react';
import { Pause, Play, SkipBack } from 'lucide-react';
import { formatTimecode } from '@/lib/timecode';
import { useUiStore } from '@/store/useUiStore';
import { ZoomControl } from './ZoomControl';

export function TransportBar({ duration, children }: { duration: number; children?: ReactNode }) {
  const playhead = useUiStore((s) => s.playhead);
  const playing = useUiStore((s) => s.playing);
  const zoom = useUiStore((s) => s.zoom);
  const { setPlaying, setPlayhead, setZoom } = useUiStore.getState();
  const b = 'grid h-7 w-7 place-items-center rounded-md text-[#e7e9ee] transition-colors duration-150 hover:bg-[#222733] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]/60';
  return (
    <div className="flex h-9 shrink-0 items-center gap-2 border-y border-[#222733] bg-[#12151c] px-2">
      <button type="button" className={b} onClick={() => setPlayhead(0)} aria-label="Go to start" data-testid="button-rewind"><SkipBack className="h-3.5 w-3.5" /></button>
      <button type="button" className={`${b} ${playing ? 'bg-[#6366f1]/20 text-[#c7c8fb]' : ''}`} onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause' : 'Play'} data-testid="button-play">
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </button>
      <span className="tc rounded bg-[#0b0d12] px-2 py-0.5 text-[12px] text-[#e7e9ee]" data-testid="text-playhead">{formatTimecode(playhead)}</span>
      <span className="tc text-[11px] text-[#8b93a7]">/ {formatTimecode(duration)}</span>
      <span className="ml-2 hidden text-[10.5px] text-[#8b93a7]/70 xl:inline">
        <kbd className="tc rounded border border-[#222733] px-1">Space</kbd> play · <kbd className="tc rounded border border-[#222733] px-1">←</kbd> <kbd className="tc rounded border border-[#222733] px-1">→</kbd> 1s
      </span>
      <div className="ml-auto flex items-center gap-3">
        {children}
        <ZoomControl zoom={zoom} onZoom={setZoom} />
      </div>
    </div>
  );
}
