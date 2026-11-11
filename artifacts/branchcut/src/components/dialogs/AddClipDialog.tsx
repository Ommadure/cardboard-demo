import { useState } from 'react';
import type { TrackId } from '@/core/types';
import { MEDIA_LIBRARY } from '@/core/seed';
import { useRepoStore } from '@/store/useRepoStore';
import { useUiStore } from '@/store/useUiStore';
import { run } from '@/lib/run';
import { btn, btnPrimary, inputCls, labelCls } from '@/components/shell/styles';
import { FormDialog } from './Shell';

const TRACKS_FOR: Record<string, TrackId[]> = { video: ['V1', 'V2'], audio: ['A1', 'A2', 'A3'], text: ['C1'] };

export function AddClipDialog({ onClose }: { onClose: () => void }) {
  const addClip = useRepoStore((s) => s.addClip);
  const [sourceId, setSourceId] = useState(MEDIA_LIBRARY[0]!.id);
  const type = MEDIA_LIBRARY.find((m) => m.id === sourceId)?.type ?? 'video';
  const [track, setTrack] = useState<TrackId>('V1');
  const [start, setStart] = useState(String(Number(useUiStore.getState().playhead.toFixed(2))));
  const tracks = TRACKS_FOR[type]!;
  const effectiveTrack = tracks.includes(track) ? track : tracks[0]!;
  const n = Number(start);
  const valid = start.trim() !== '' && Number.isFinite(n) && n >= 0;
  const submit = () => {
    if (!valid) return;
    const r = run(() => addClip(sourceId, effectiveTrack, n), `Added clip on ${effectiveTrack} at ${n}s`);
    if (r.ok) onClose();
  };
  return (
    <FormDialog
      title="Add clip" testId="dialog-add-clip" onClose={onClose} description="Places a 3-second clip from the media library at the playhead."
      footer={<>
        <button type="button" className={btn} onClick={onClose}>Cancel</button>
        <button type="button" className={btnPrimary} disabled={!valid} onClick={submit} data-testid="button-confirm-add-clip">Add clip</button>
      </>}
    >
      <form className="grid grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <div className="col-span-2">
          <label className={labelCls} htmlFor="add-source">Source</label>
          <select id="add-source" className={inputCls} value={sourceId} onChange={(e) => setSourceId(e.target.value)} data-testid="select-add-source">
            {MEDIA_LIBRARY.map((m) => <option key={m.id} value={m.id}>{m.id} · {m.type}{m.duration ? ` · ${m.duration}s` : ''}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="add-track">Track</label>
          <select id="add-track" className={inputCls} value={effectiveTrack} onChange={(e) => setTrack(e.target.value as TrackId)} data-testid="select-add-track">
            {tracks.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="add-start">Start (s)</label>
          <input id="add-start" type="number" step={0.1} min={0} className={`${inputCls} tc`} value={start} onChange={(e) => setStart(e.target.value)} data-testid="input-add-start" />
          {!valid && <p className="mt-1 text-[10.5px] text-[#f87171]">Start must be 0 or later.</p>}
        </div>
      </form>
    </FormDialog>
  );
}
