import type { Change } from '@/core/types';
import { summarizeChange } from '@/core/summary';
import { KIND_META, KIND_ORDER, countHeader } from '@/lib/changes';
import { PanelHeader } from '@/components/shell/Panel';

export function ChangeItem({ change, hovered, onHover, onFocus }: { change: Change; hovered: boolean; onHover: (id: string | null) => void; onFocus: (c: Change) => void }) {
  const M = KIND_META[change.kind];
  return (
    <li>
      <button
        type="button"
        onMouseEnter={() => onHover(change.clipId)} onMouseLeave={() => onHover(null)}
        onFocus={() => onHover(change.clipId)} onBlur={() => onHover(null)}
        onClick={() => onFocus(change)}
        data-testid={`change-${change.kind}-${change.clipId}`}
        className={`flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-[12px] leading-snug transition-colors duration-150 focus-visible:outline-none ${hovered ? 'bg-[#1d2230] text-[#e7e9ee]' : 'text-[#c9cdd8] hover:bg-[#171b24]'}`}
      >
        <span className="mt-px grid h-4 w-4 shrink-0 place-items-center rounded text-white" style={{ background: M.color }} aria-label={M.label}>
          <M.Icon className="h-2.5 w-2.5" strokeWidth={3} />
        </span>
        {summarizeChange(change)}
      </button>
    </li>
  );
}

export function WhatChanged({ changes, hoveredId, onHover, onFocus }: { changes: Change[]; hoveredId: string | null; onHover: (id: string | null) => void; onFocus: (c: Change) => void }) {
  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-l border-[#222733] bg-[#12151c]" data-testid="panel-what-changed">
      <PanelHeader title="What changed" />
      <p className="border-b border-[#222733] px-3 py-2 text-[12.5px] font-medium text-[#e7e9ee]" data-testid="text-change-count">{countHeader(changes)}</p>
      <div className="bc-scroll min-h-0 flex-1 overflow-y-auto p-2">
        {changes.length === 0 && <p className="px-2 py-6 text-center text-[12px] text-[#8b93a7]">These two versions have identical timelines.</p>}
        {KIND_ORDER.map((k) => {
          const list = changes.filter((c) => c.kind === k);
          if (!list.length) return null;
          return (
            <section key={k} className="mb-2">
              <h3 className="mb-0.5 flex items-center gap-1.5 px-2 text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: KIND_META[k].color }}>
                {KIND_META[k].label}<span className="tc text-[#8b93a7]">{list.length}</span>
              </h3>
              <ul>{list.map((c) => <ChangeItem key={c.clipId + c.kind} change={c} hovered={hoveredId === c.clipId} onHover={onHover} onFocus={onFocus} />)}</ul>
            </section>
          );
        })}
      </div>
    </aside>
  );
}
