import { ArrowRight } from 'lucide-react';
import { BrandMark } from './BrandMark';

const LANES = [
  { y: 18, c: '#6366f1', d: 'M10 18H290' },
  { y: 40, c: '#22c55e', d: 'M60 18C80 18 80 40 100 40H220C240 40 240 18 260 18' },
  { y: 62, c: '#f59e0b', d: 'M60 18C80 18 80 62 100 62H180' },
];

export function EmptyState({ onLoad }: { onLoad: () => void }) {
  return (
    <div className="grid flex-1 place-items-center bg-[radial-gradient(ellipse_at_50%_35%,#141826_0%,#0b0d12_60%)] p-6">
      <div className="bc-rise w-[440px] rounded-[10px] border border-[#222733] bg-[#12151c] p-7 shadow-[0_20px_60px_-20px_rgba(0,0,0,.7)]" data-testid="card-empty-state">
        <svg viewBox="0 0 300 80" className="mb-5 h-16 w-full" aria-hidden>
          {LANES.map((l) => <path key={l.c} d={l.d} stroke={l.c} strokeWidth="2" fill="none" opacity="0.85" />)}
          {[[30, 18, '#6366f1'], [60, 18, '#6366f1'], [130, 40, '#22c55e'], [190, 40, '#22c55e'], [130, 62, '#f59e0b'], [180, 62, '#f59e0b'], [260, 18, '#6366f1']].map(([x, y, c], i) => (
            <circle key={i} cx={x as number} cy={y as number} r="4.5" fill="#0b0d12" stroke={c as string} strokeWidth="2" />
          ))}
        </svg>
        <div className="mb-2 flex items-center gap-2">
          <BrandMark size={18} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b93a7]">Branchcut</span>
        </div>
        <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-[#e7e9ee]">Version control for video timelines.</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[#8b93a7]">
          Branch a cut, edit in parallel, see exactly what diverged, and merge it back. Maya and Leo's launch video is ready to inspect.
        </p>
        <button
          type="button"
          onClick={onLoad}
          autoFocus
          data-testid="button-load-demo"
          className="group mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#6366f1] text-[14px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.2)] transition-[transform,filter] duration-150 hover:brightness-110 active:scale-[0.99]"
        >
          Load demo project
          <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
        </button>
        <p className="tc mt-3 text-center text-[10.5px] text-[#8b93a7]/70">6 tracks · 3 branches · runs entirely in your browser</p>
      </div>
    </div>
  );
}
