export function formatTimecode(sec: number, fps = 30): string {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  const f = Math.floor((s - Math.floor(s)) * fps + 1e-6);
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
}

export function formatSeconds(sec: number): string {
  return `${Number(sec.toFixed(2))}s`;
}
