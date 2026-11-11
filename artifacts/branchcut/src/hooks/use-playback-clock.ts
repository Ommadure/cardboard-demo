import { useEffect, useRef } from 'react';
import { useUiStore } from '@/store/useUiStore';

/** Drives the shared playhead while playing; stops at the end of the visible timeline. */
export function usePlaybackClock(duration: number) {
  const playing = useUiStore((s) => s.playing);
  const dur = useRef(duration);
  dur.current = duration;
  useEffect(() => {
    if (!playing) return;
    const s0 = useUiStore.getState();
    if (s0.playhead >= dur.current - 0.02) s0.setPlayhead(0);
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const s = useUiStore.getState();
      const next = s.playhead + (now - last) / 1000;
      last = now;
      if (next >= dur.current) { s.setPlayhead(dur.current); s.setPlaying(false); return; }
      s.setPlayhead(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);
}
