import { useMemo } from 'react';
import { previewResolutions } from '@/core/merge';
import { findOverlaps } from '@/core/timeline';
import { getHeadId, useRepoStore } from '@/store/useRepoStore';
import { useUiStore, type Mode } from '@/store/useUiStore';

const MODES: { id: Mode; label: string }[] = [
  { id: 'workspace', label: 'Workspace' }, { id: 'compare', label: 'Compare' }, { id: 'merge', label: 'Merge' },
];

export function ModeTabs() {
  const mode = useUiStore((s) => s.mode);
  const session = useUiStore((s) => s.mergeSession);
  const unresolved = useMemo(() => {
    if (!session) return 0;
    const preview = previewResolutions(session.result, session.resolutions);
    const active = new Set(findOverlaps(preview.timeline).map(([a, b]) =>
      `collision:${[a.id, b.id].sort((x, y) => x.localeCompare(y)).join(':')}`));
    return preview.conflicts.filter((c) => !session.resolutions[c.id] &&
      (c.kind !== 'collision' || active.has(c.id))).length;
  }, [session]);
  const select = (m: Mode) => {
    const ui = useUiStore.getState();
    if (m === 'compare') {
      const repo = useRepoStore.getState().repo;
      const [a, b] = ui.comparePair;
      if (repo && (!repo.commits[a] || !repo.commits[b])) ui.setComparePair([a in repo.commits ? a : getHeadId(repo), getHeadId(repo)]);
    }
    ui.setMode(m);
  };
  return (
    <div role="tablist" aria-label="Mode" className="flex rounded-md border border-[#222733] bg-[#0b0d12] p-0.5">
      {MODES.map((m) => (
        <button
          key={m.id} type="button" role="tab" aria-selected={mode === m.id} onClick={() => select(m.id)} data-testid={`tab-${m.id}`}
          className={`relative flex h-6 items-center gap-1.5 rounded-[5px] px-3 text-[11.5px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]/60 ${mode === m.id ? 'bg-[#222733] text-[#e7e9ee] shadow-[inset_0_1px_0_rgba(255,255,255,.06)]' : 'text-[#8b93a7] hover:text-[#e7e9ee]'}`}
        >
          {m.label}
          {m.id === 'merge' && session && (
            <span className={`tc grid h-4 min-w-4 place-items-center rounded px-1 text-[9.5px] font-bold text-white ${unresolved ? 'bg-[#f43f5e]' : 'bg-[#22c55e]'}`}>{unresolved || 'ok'}</span>
          )}
        </button>
      ))}
    </div>
  );
}
