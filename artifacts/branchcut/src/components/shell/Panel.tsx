import type { ReactNode } from 'react';

export function PanelHeader({ title, meta }: { title: string; meta?: ReactNode }) {
  return (
    <div className="flex h-8 shrink-0 items-center justify-between border-b border-[#222733] px-3">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#8b93a7]">{title}</span>
      {meta}
    </div>
  );
}

export function Kv({ k, v, testId }: { k: string; v: ReactNode; testId?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 text-[12px]">
      <span className="text-[#8b93a7]">{k}</span>
      <span className="tc truncate text-right text-[#e7e9ee]" data-testid={testId}>{v}</span>
    </div>
  );
}
