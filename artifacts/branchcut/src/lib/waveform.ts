/** Deterministic pseudo-waveform seeded by clip id (FNV-1a + mulberry32). */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cache = new Map<string, number[]>();

/** Returns amplitudes 0..1, one per sample; stable for a given id + count. */
export function waveformFor(id: string, count: number): number[] {
  const key = id + ':' + count;
  const hit = cache.get(key);
  if (hit) return hit;
  const r = rng(hash(id));
  const out: number[] = [];
  let env = 0.5;
  for (let i = 0; i < count; i++) {
    env += (r() - 0.5) * 0.25;
    env = Math.min(0.95, Math.max(0.2, env));
    out.push(Math.min(1, Math.max(0.06, env * (0.45 + r() * 0.75))));
  }
  cache.set(key, out);
  return out;
}
