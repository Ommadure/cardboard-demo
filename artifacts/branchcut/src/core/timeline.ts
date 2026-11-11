import type { Clip, Timeline } from './types';

const KNOWN_SOURCES: Readonly<Record<string, { duration: number | null; family: 'V' | 'A' | 'C' }>> = {
  'intro.mp4': { duration: 8, family: 'V' },
  'product-hero.mp4': { duration: 10, family: 'V' },
  'product-detail.mp4': { duration: 10, family: 'V' },
  'cta-end.mp4': { duration: 8, family: 'V' },
  'city-broll.mp4': { duration: 6, family: 'V' },
  'office-broll.mp4': { duration: 6, family: 'V' },
  'factory-broll.mp4': { duration: 6, family: 'V' },
  'voiceover.mp3': { duration: 24, family: 'A' },
  'score.mp3': { duration: 24, family: 'A' },
  'whoosh.wav': { duration: 2, family: 'A' },
  caption: { duration: null, family: 'C' },
};
const ALLOWED_EFFECTS = new Set(['fade-in', 'fade-out', 'warm', 'cool', 'bw']);
const TRACK_PATTERN = /^([VAC])([1-9]\d*)$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Timeline duration in seconds after applying the clip's playback speed. */
export function clipDuration(clip: Clip): number {
  return (clip.sourceOut - clip.sourceIn) / clip.speed;
}

/** Return a deep copy of the mutable timeline data. */
export function cloneTimeline(timeline: Timeline): Timeline {
  return { clips: timeline.clips.map((clip) => ({ ...clip, effects: [...clip.effects] })) };
}

/** Find same-track overlaps. Touching half-open intervals are not overlaps. */
export function findOverlaps(timeline: Timeline): [Clip, Clip][] {
  const byTrack = new Map<string, Clip[]>();
  for (const clip of timeline.clips) {
    const list = byTrack.get(clip.trackId) ?? [];
    list.push(clip);
    byTrack.set(clip.trackId, list);
  }

  const overlaps: [Clip, Clip][] = [];
  for (const clips of byTrack.values()) {
    const ordered = [...clips].sort((a, b) => a.start - b.start || a.id.localeCompare(b.id));
    for (let i = 0; i < ordered.length; i += 1) {
      const current = ordered[i];
      for (let j = i + 1; j < ordered.length; j += 1) {
        const next = ordered[j];
        if (next.start >= current.start + clipDuration(current)) break;
        if (next.start + clipDuration(next) > current.start) overlaps.push([current, next]);
      }
    }
  }
  return overlaps.sort((a, b) => a[0].id.localeCompare(b[0].id) || a[1].id.localeCompare(b[1].id));
}

/** Validate intrinsic clip data, IDs, and bounds for the known demo media. */
export function validateTimeline(timeline: Timeline): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const input: unknown = timeline;
  if (!isRecord(input) || !Array.isArray(input.clips)) {
    return ['Timeline must contain a clips array.'];
  }

  for (const value of input.clips) {
    if (!isRecord(value)) {
      errors.push('Timeline contains a malformed clip object.');
      continue;
    }
    const clipId = typeof value.id === 'string' ? value.id : '<unknown>';
    if (typeof value.id !== 'string' || !value.id.trim()) errors.push('Clip id must be a non-empty string.');
    else if (ids.has(value.id)) errors.push(`Duplicate clip id "${value.id}".`);
    else ids.add(value.id);
    if (typeof value.label !== 'string' || !value.label.trim()) errors.push(`Clip "${clipId}" label must be a non-empty string.`);

    const trackMatch = typeof value.trackId === 'string' ? TRACK_PATTERN.exec(value.trackId) : null;
    if (!trackMatch || !Number.isSafeInteger(Number(trackMatch[2]))) {
      errors.push(`Clip "${clipId}" has an invalid track ID.`);
    }
    if (typeof value.sourceId !== 'string' || !Object.hasOwn(KNOWN_SOURCES, value.sourceId)) {
      errors.push(`Clip "${clipId}" has an unknown source ID.`);
    }
    if (value.caption !== undefined && typeof value.caption !== 'string') {
      errors.push(`Clip "${clipId}" caption must be a string when present.`);
    }
    if (!Array.isArray(value.effects)) {
      errors.push(`Clip "${clipId}" effects must be an array.`);
    } else {
      for (const effect of value.effects) {
        if (typeof effect !== 'string' || !ALLOWED_EFFECTS.has(effect)) {
          errors.push(`Clip "${clipId}" has an unknown effect.`);
          break;
        }
      }
    }

    const numericFields = ['sourceIn', 'sourceOut', 'start', 'speed'] as const;
    let finiteNumbers = true;
    for (const name of numericFields) {
      if (typeof value[name] !== 'number' || !Number.isFinite(value[name])) {
        errors.push(`Clip "${clipId}" has a non-finite ${name}.`);
        finiteNumbers = false;
      }
    }
    const sourceIn = value.sourceIn;
    const sourceOut = value.sourceOut;
    const start = value.start;
    const speed = value.speed;
    if (typeof sourceIn === 'number' && sourceIn < 0) errors.push(`Clip "${clipId}" sourceIn must be at least 0.`);
    if (typeof sourceIn === 'number' && typeof sourceOut === 'number' && sourceOut <= sourceIn) {
      errors.push(`Clip "${clipId}" sourceOut must be greater than sourceIn.`);
    }
    if (typeof start === 'number' && start < 0) errors.push(`Clip "${clipId}" start must be at least 0.`);
    if (typeof speed === 'number' && speed <= 0) errors.push(`Clip "${clipId}" speed must be greater than 0.`);
    if (finiteNumbers && typeof sourceIn === 'number' && typeof sourceOut === 'number' && typeof speed === 'number' && speed > 0) {
      const duration = (sourceOut - sourceIn) / speed;
      if (!Number.isFinite(duration) || duration <= 0) errors.push(`Clip "${clipId}" duration must be finite and greater than 0.`);
    }

    if (typeof value.sourceId === 'string' && Object.hasOwn(KNOWN_SOURCES, value.sourceId)) {
      const source = KNOWN_SOURCES[value.sourceId];
      if (trackMatch && trackMatch[1] !== source.family) {
        errors.push(`Clip "${clipId}" source type does not match track "${value.trackId}".`);
      }
      if (source.duration !== null && typeof sourceOut === 'number' && sourceOut > source.duration) {
        errors.push(`Clip "${clipId}" sourceOut exceeds the source duration.`);
      }
      if (source.family === 'C' && (typeof value.caption !== 'string' || !value.caption.trim())) {
        errors.push(`Caption clip "${clipId}" must have caption text.`);
      }
    }
  }
  return errors;
}

/** Compare timeline content, ignoring clip order and effect-array ordering. */
export function timelinesEqual(a: Timeline, b: Timeline): boolean {
  if (a.clips.length !== b.clips.length) return false;
  const right = new Map(b.clips.map((clip) => [clip.id, clip]));
  if (right.size !== b.clips.length) return false;
  return a.clips.every((left) => {
    const other = right.get(left.id);
    if (!other) return false;
    const keys: (keyof Clip)[] = ['label', 'trackId', 'sourceId', 'sourceIn', 'sourceOut', 'start', 'speed', 'caption'];
    return keys.every((key) => left[key] === other[key])
      && new Set(left.effects).size === new Set(other.effects).size
      && [...new Set(left.effects)].every((effect) => new Set(other.effects).has(effect));
  });
}
