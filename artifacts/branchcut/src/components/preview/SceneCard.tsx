import type { Clip } from '@/core/types';
import { clipColor, sourceOf } from '@/lib/colors';
import { effectFilter, fadeOpacity } from '@/lib/preview';
import { formatTimecode } from '@/lib/timecode';

function variant(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % 3;
}

/** Full-frame simulated shot built from clip data. Motif is derived from the source id. */
export function SceneCard({ clip, time, pip = false }: { clip: Clip; time: number; pip?: boolean }) {
  const c = clipColor(clip.sourceId, clip.trackId);
  const src = sourceOf(clip.sourceId);
  const local = clip.sourceIn + (time - clip.start) * clip.speed;
  const v = variant(clip.sourceId);
  const drift = ((time - clip.start) * 1.6) % 100;
  return (
    <div
      className="absolute inset-0 overflow-hidden [container-type:inline-size]"
      data-testid={`scene-${clip.id}`}
      style={{
        filter: effectFilter(clip.effects),
        opacity: fadeOpacity(clip, time),
        background: `radial-gradient(120% 90% at 78% 18%, color-mix(in srgb, ${c} 70%, #ffffff 12%) 0%, transparent 55%), linear-gradient(140deg, color-mix(in srgb, ${c} 72%, #0b0d12) 0%, color-mix(in srgb, ${c} 26%, #0b0d12) 100%)`,
      }}
    >
      {v === 0 && (
        <>
          <div className="absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-black/45 to-black/5" />
          <div className="absolute rounded-full" style={{ width: '22cqw', height: '22cqw', right: '14cqw', top: '10cqw', background: `radial-gradient(circle, color-mix(in srgb, ${c} 30%, #fff) 0%, transparent 70%)`, transform: `translateY(${drift * 0.05}cqw)` }} />
          <div className="absolute inset-x-0 h-px bg-white/25" style={{ bottom: '38%' }} />
        </>
      )}
      {v === 1 && (
        <div className="absolute grid grid-cols-3 gap-[1.2cqw]" style={{ right: '6cqw', top: '8cqw', width: '42cqw', transform: `translateX(${-drift * 0.04}cqw)` }}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="rounded-[0.8cqw] border border-white/20 bg-white/10" style={{ height: i % 4 === 0 ? '12cqw' : '8cqw' }} />
          ))}
        </div>
      )}
      {v === 2 && (
        <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(115deg, rgba(255,255,255,.07) 0 2cqw, transparent 2cqw 7cqw)', transform: `translateX(${-drift * 0.08}cqw)` }} />
      )}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,.45)_100%)]" />
      {!pip && ['left-[3%] top-[5%] border-l border-t', 'right-[3%] top-[5%] border-r border-t', 'left-[3%] bottom-[5%] border-l border-b', 'right-[3%] bottom-[5%] border-r border-b'].map((p) => (
        <span key={p} className={`absolute h-[4cqw] w-[4cqw] border-white/35 ${p}`} />
      ))}
      <div className="absolute flex flex-col" style={{ left: pip ? '6cqw' : '7cqw', bottom: pip ? '7cqw' : '22cqw' }}>
        <span className="tc uppercase tracking-[0.12em] text-white/60" style={{ fontSize: pip ? '5cqw' : '1.5cqw' }}>{clip.trackId} · {src?.id ?? clip.sourceId}</span>
        <span className="font-semibold leading-[0.95] tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,.35)]" style={{ fontSize: pip ? '10cqw' : '6.4cqw' }}>{clip.label}</span>
        {!pip && <span className="tc mt-[1cqw] text-white/55" style={{ fontSize: '1.4cqw' }}>SRC {formatTimecode(local)} · {clip.speed}x{clip.effects.length ? ' · ' + clip.effects.join(' / ') : ''}</span>}
      </div>
    </div>
  );
}

export function NoSignal() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[#07080b] [container-type:inline-size]" data-testid="scene-no-signal">
      <div className="absolute inset-0 opacity-[0.07]" style={{ background: 'repeating-linear-gradient(0deg, #e7e9ee 0 1px, transparent 1px 4px)' }} />
      <span className="tc uppercase tracking-[0.3em] text-[#8b93a7]" style={{ fontSize: '1.8cqw' }}>No signal</span>
    </div>
  );
}
