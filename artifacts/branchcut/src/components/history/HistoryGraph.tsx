import { useMemo } from 'react';
import type { RepoState } from '@/core/types';
import { LANE_COLORS } from '@/lib/colors';

const ROW = 26;
const LANE = 14;
const PAD = 12;

interface Props { repo: RepoState; headId: string; selectedId: string | null; onSelect: (id: string, shift: boolean) => void }

export function HistoryGraph({ repo, headId, selectedId, onSelect }: Props) {
  const { commits, lanes, rowOf, tips } = useMemo(() => {
    const commits = Object.values(repo.commits).sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id));
    const lanes: string[] = ['main'];
    [...commits].reverse().forEach((c) => { const b = c.branch || 'detached'; if (!lanes.includes(b)) lanes.push(b); });
    const rowOf = new Map(commits.map((c, i) => [c.id, i]));
    const tips = new Map<string, string[]>();
    Object.entries(repo.branches).sort(([a], [b]) => (a === 'main' ? -1 : b === 'main' ? 1 : a.localeCompare(b)))
      .forEach(([name, id]) => tips.set(id, [...(tips.get(id) ?? []), name]));
    return { commits, lanes, rowOf, tips };
  }, [repo.commits, repo.branches]);

  const laneOf = (branch: string) => Math.max(0, lanes.indexOf(branch || 'detached'));
  const X = (l: number) => PAD + l * LANE;
  const Y = (r: number) => r * ROW + ROW / 2;
  const w = PAD + lanes.length * LANE;
  const currentBranch = repo.head.type === 'branch' ? repo.head.name : null;

  return (
    <div className="relative" style={{ height: commits.length * ROW }} data-testid="history-graph">
      <svg className="absolute left-0 top-0" width={w} height={commits.length * ROW} aria-hidden>
        {commits.flatMap((c) => c.parents.map((p, i) => {
          const pc = repo.commits[p];
          const pr = rowOf.get(p);
          if (!pc || pr === undefined) return null;
          const x1 = X(laneOf(pc.branch)), y1 = Y(pr), x2 = X(laneOf(c.branch)), y2 = Y(rowOf.get(c.id)!);
          const color = LANE_COLORS[(i === 0 ? laneOf(c.branch) : laneOf(pc.branch)) % LANE_COLORS.length];
          const d = x1 === x2 ? `M${x1} ${y1}V${y2}`
            : i === 0 ? `M${x1} ${y1}C${x1} ${y1 - 12} ${x2} ${y1 - 10} ${x2} ${y1 - 22}V${y2}`
            : `M${x1} ${y1}V${y2 + 22}C${x1} ${y2 + 10} ${x2} ${y2 + 12} ${x2} ${y2}`;
          return <path key={c.id + p} d={d} stroke={color} strokeWidth={1.75} fill="none" opacity={0.9} data-testid={`edge-${p}-${c.id}`} />;
        }))}
        {commits.map((c, r) => {
          const color = LANE_COLORS[laneOf(c.branch) % LANE_COLORS.length];
          const merge = c.parents.length > 1;
          return (
            <g key={c.id}>
              {c.id === headId && <circle cx={X(laneOf(c.branch))} cy={Y(r)} r={8} fill="none" stroke="#e7e9ee" strokeWidth={1.25} opacity={0.8} />}
              <circle cx={X(laneOf(c.branch))} cy={Y(r)} r={merge ? 5 : 4.5} fill={merge ? '#0b0d12' : color} stroke={color} strokeWidth={2} />
            </g>
          );
        })}
      </svg>
      {commits.map((c, r) => (
        <button
          key={c.id}
          type="button"
          data-testid={`graph-commit-${c.id}`}
          onClick={(e) => onSelect(c.id, e.shiftKey)}
          aria-pressed={selectedId === c.id}
          title={`${c.message} — shift-click to compare with the selected commit`}
          className={`absolute right-0 flex items-center gap-1.5 overflow-hidden pr-2 text-left transition-colors duration-150 hover:bg-[#1a1f2a] ${selectedId === c.id ? 'bg-[#6366f1]/12' : ''}`}
          style={{ top: r * ROW, height: ROW, left: 0, paddingLeft: w + 6 }}
        >
          <span className="tc shrink-0 text-[10.5px] text-[#8b93a7]">{c.id.slice(0, 7)}</span>
          {tips.get(c.id)?.map((b) => (
            <span key={b} className={`tc shrink-0 rounded-full border px-1.5 text-[9.5px] leading-[15px] ${b === currentBranch ? 'border-[#6366f1] bg-[#6366f1] text-white' : 'border-[#2c3343] text-[#e7e9ee]'}`} data-testid={`pill-branch-${b}`}>
              {b}
            </span>
          ))}
          {c.id === headId && <span className="tc shrink-0 text-[9px] font-semibold tracking-wider text-[#e7e9ee]/70">HEAD</span>}
          <span className="truncate text-[11px] text-[#8b93a7]/80">{c.message}</span>
        </button>
      ))}
    </div>
  );
}
