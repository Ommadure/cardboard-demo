import { Minus, Plus } from 'lucide-react';
import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP, clampZoom } from './constants';

export function ZoomControl({ zoom, onZoom }: { zoom: number; onZoom: (z: number) => void }) {
  const btn = 'grid h-5 w-5 place-items-center rounded text-[#8b93a7] transition-colors duration-150 hover:bg-[#222733] hover:text-[#e7e9ee] disabled:opacity-30';
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" aria-label="Zoom out" data-testid="button-zoom-out" className={btn} disabled={zoom <= ZOOM_MIN} onClick={() => onZoom(clampZoom(zoom - ZOOM_STEP))}><Minus className="h-3 w-3" /></button>
      <input
        type="range" min={ZOOM_MIN} max={ZOOM_MAX} step={1} value={zoom}
        onChange={(e) => onZoom(clampZoom(Number(e.target.value)))}
        className="bc-range w-28" aria-label="Zoom" data-testid="input-zoom"
      />
      <button type="button" aria-label="Zoom in" data-testid="button-zoom-in" className={btn} disabled={zoom >= ZOOM_MAX} onClick={() => onZoom(clampZoom(zoom + ZOOM_STEP))}><Plus className="h-3 w-3" /></button>
      <span className="tc w-14 text-right text-[10.5px] text-[#8b93a7]" data-testid="text-zoom">{zoom} px/s</span>
    </div>
  );
}
