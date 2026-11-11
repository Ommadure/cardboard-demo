import type { RepoState } from '@/core/types';
import { inputCls } from '@/components/shell/styles';

export function CommitSelect({ repo, value, onChange, testId }: { repo: RepoState; value: string; onChange: (id: string) => void; testId: string }) {
  const commits = Object.values(repo.commits).sort((a, b) => b.createdAt - a.createdAt);
  const tips = (id: string) => Object.entries(repo.branches).filter(([, c]) => c === id).map(([n]) => n);
  return (
    <select className={`${inputCls} tc`} value={value} onChange={(e) => onChange(e.target.value)} data-testid={testId} aria-label={testId}>
      {commits.map((c) => {
        const t = tips(c.id);
        return <option key={c.id} value={c.id}>{c.id.slice(0, 7)} {t.length ? `[${t.join(', ')}] ` : ''}— {c.message}</option>;
      })}
    </select>
  );
}
