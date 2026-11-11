import { AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Clip, EffectId, RepoState, TrackId } from '@/core/types';
import { MEDIA_LIBRARY } from '@/core/seed';
import { clipDuration, findOverlaps } from '@/core/timeline';
import { useRepoStore } from '@/store/useRepoStore';
import { sourceOf, clipColor } from '@/lib/colors';
import { errorText } from '@/lib/run';
import { btnDanger, inputCls } from '@/components/shell/styles';
import { orderTracks } from '@/components/timeline/constants';
import { Field, NumberField, TextField } from './fields';

const EFFECTS: EffectId[] = ['fade-in', 'fade-out', 'warm', 'cool', 'bw'];
const r = (n: number) => Number(n.toFixed(2));

export function ClipForm({ clip, repo, readOnly }: { clip: Clip; repo: RepoState; readOnly: boolean }) {
  const updateClip = useRepoStore((s) => s.updateClip);
  const deleteClip = useRepoStore((s) => s.deleteClip);
  const src = sourceOf(clip.sourceId);
  const type = src?.type ?? 'video';
  const family = clip.trackId[0]!;
  const apply = (patch: Partial<Clip>): string | null => {
    try { updateClip(clip.id, patch); return null; } catch (e) { return errorText(e); }
  };
  const applyToast = (patch: Partial<Clip>) => { const e = apply(patch); if (e) toast.error(e); };
  const tracks = orderTracks([repo.working]).filter((t) => t.startsWith(family));
  const maxOut = src?.duration ?? null;
  const overlaps = findOverlaps(repo.working).filter(([a, b]) => a.id === clip.id || b.id === clip.id).map(([a, b]) => (a.id === clip.id ? b : a));

  return (
    <div className="bc-rise flex flex-col gap-3 px-3 py-3" data-testid={`inspector-clip-${clip.id}`}>
      <div className="flex items-center gap-2">
        <span className="h-3.5 w-3.5 shrink-0 rounded-[4px]" style={{ background: clipColor(clip.sourceId, clip.trackId) }} />
        <span className="truncate text-[14px] font-semibold text-[#e7e9ee]" data-testid="text-clip-label">{clip.label}</span>
        <span className="tc ml-auto text-[10px] text-[#8b93a7]">{clip.id}</span>
      </div>
      <TextField id="clip-label" label="Label" value={clip.label} disabled={readOnly} onCommit={(v) => apply({ label: v })} />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Track" htmlFor="clip-track">
          <select id="clip-track" data-testid="select-clip-track" className={inputCls} disabled={readOnly} value={clip.trackId} onChange={(e) => applyToast({ trackId: e.target.value as TrackId })}>
            {tracks.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Source" htmlFor="clip-source">
          <select
            id="clip-source" data-testid="select-clip-source" className={inputCls} disabled={readOnly || type === 'text'} value={clip.sourceId}
            onChange={(e) => {
              const s = sourceOf(e.target.value);
              if (s?.duration != null && clip.sourceOut > s.duration) { toast.error(`Out point ${clip.sourceOut}s exceeds ${s.label} length (${s.duration}s).`); return; }
              applyToast({ sourceId: e.target.value });
            }}
          >
            {MEDIA_LIBRARY.filter((m) => m.type === type).map((m) => <option key={m.id} value={m.id}>{m.id}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumberField id="clip-start" label="Start" suffix="s" value={clip.start} disabled={readOnly}
          validate={(n) => (n < 0 ? 'Start must be 0 or later.' : null)} onCommit={(n) => apply({ start: n })} />
        <NumberField id="clip-speed" label="Speed" suffix="x" step={0.25} value={clip.speed} disabled={readOnly}
          validate={(n) => (n <= 0 ? 'Speed must be above 0.' : n > 8 ? 'Speed must be 8x or less.' : null)} onCommit={(n) => apply({ speed: n })} />
        <NumberField id="clip-in" label="Source in" suffix="s" value={clip.sourceIn} disabled={readOnly}
          validate={(n) => (n < 0 ? 'In point must be 0 or later.' : n >= clip.sourceOut ? 'In must be before out.' : null)} onCommit={(n) => apply({ sourceIn: n })} />
        <NumberField id="clip-out" label="Source out" suffix="s" value={clip.sourceOut} disabled={readOnly}
          validate={(n) => (n <= clip.sourceIn ? 'Out must be after in.' : maxOut !== null && n > maxOut ? `Source is ${maxOut}s long.` : null)} onCommit={(n) => apply({ sourceOut: n })} />
      </div>
      <div className="tc flex justify-between rounded-md bg-[#0b0d12] px-2 py-1.5 text-[11px] text-[#8b93a7]">
        <span>Duration <span className="text-[#e7e9ee]">{r(clipDuration(clip))}s</span></span>
        <span>Ends <span className="text-[#e7e9ee]">{r(clip.start + clipDuration(clip))}s</span></span>
        {maxOut !== null && <span>Source <span className="text-[#e7e9ee]">{maxOut}s</span></span>}
      </div>
      {overlaps.length > 0 && (
        <p className="flex items-start gap-1.5 rounded-md border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-2 py-1.5 text-[11px] text-[#fcd34d]" data-testid="text-overlap-warning">
          <AlertTriangle className="mt-px h-3 w-3 shrink-0" />Overlaps {overlaps.map((o) => o.label).join(', ')} on {clip.trackId}.
        </p>
      )}
      <Field label="Effects">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Effects">
          {EFFECTS.map((fx) => {
            const on = clip.effects.includes(fx);
            return (
              <button
                key={fx} type="button" disabled={readOnly} aria-pressed={on} data-testid={`toggle-effect-${fx}`}
                onClick={() => applyToast({ effects: on ? clip.effects.filter((e) => e !== fx) : [...clip.effects, fx] })}
                className={`tc h-6 rounded-md border px-2 text-[10.5px] transition-colors duration-150 disabled:opacity-40 ${on ? 'border-[#6366f1] bg-[#6366f1]/20 text-[#e7e9ee]' : 'border-[#222733] bg-[#0b0d12] text-[#8b93a7] hover:text-[#e7e9ee]'}`}
              >
                {fx}
              </button>
            );
          })}
        </div>
      </Field>
      {type === 'text' && (
        <TextField id="clip-caption" label="Caption text" multiline value={clip.caption ?? ''} disabled={readOnly} onCommit={(v) => apply({ caption: v })} />
      )}
      {!readOnly && (
        <button type="button" className={`${btnDanger} mt-1 self-start`} data-testid="button-delete-clip" onClick={() => { try { deleteClip(clip.id); toast.success(`Deleted ${clip.label}`); } catch (e) { toast.error(errorText(e)); } }}>
          <Trash2 className="h-3.5 w-3.5" />Delete clip
        </button>
      )}
    </div>
  );
}
