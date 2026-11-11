import { describe, expect, it } from 'vitest';
import type { Clip, Timeline } from './types';
import { clipDuration, cloneTimeline, findOverlaps, timelinesEqual, validateTimeline } from './timeline';

function clip(overrides: Partial<Clip> = {}): Clip {
  return {
    id: 'clip', label: 'Clip', trackId: 'V1', sourceId: 'intro.mp4',
    sourceIn: 0, sourceOut: 4, start: 0, speed: 1, effects: [],
    ...overrides,
  };
}

describe('timeline helpers', () => {
  it('calculates duration after speed', () => {
    expect(clipDuration(clip({ sourceIn: 1, sourceOut: 7, speed: 2 }))).toBe(3);
  });

  it('clones timeline and nested effect arrays without mutating source', () => {
    const source: Timeline = { clips: [clip({ effects: ['warm'] })] };
    const copy = cloneTimeline(source);
    copy.clips[0].effects.push('bw');
    copy.clips[0].label = 'Changed';
    expect(source.clips[0].effects).toEqual(['warm']);
    expect(source.clips[0].label).toBe('Clip');
  });

  it('finds sorted same-track overlaps and treats touching endpoints as non-overlap', () => {
    const timeline = { clips: [
      clip({ id: 'b', start: 2 }),
      clip({ id: 'a', start: 0 }),
      clip({ id: 'touch', start: 6 }),
      clip({ id: 'other-track', trackId: 'V2', start: 0 }),
    ] };
    expect(findOverlaps(timeline).map(([a, b]) => [a.id, b.id])).toEqual([['a', 'b']]);
  });

  it('validates invalid timing, source bounds, caption content, and duplicate IDs', () => {
    const errors = validateTimeline({ clips: [
      clip({ id: 'bad', sourceIn: -1, sourceOut: 0, start: -2, speed: 0 }),
      clip({ id: 'bad', sourceId: 'intro.mp4', sourceOut: 9 }),
      clip({ id: 'cap', sourceId: 'caption', caption: '  ' }),
    ] });
    expect(errors.join('\n')).toContain('Duplicate clip id "bad"');
    expect(errors.join('\n')).toContain('sourceOut exceeds the source duration');
    expect(errors.join('\n')).toContain('must have caption text');
    expect(errors.length).toBeGreaterThanOrEqual(6);
  });

  it('rejects unknown sources/tracks/effects and malformed runtime clip objects without throwing', () => {
    const malformed = {
      clips: [
        { id: 'unknown-source', label: 'Unknown', trackId: 'V1', sourceId: 'mystery.mp4', sourceIn: 0, sourceOut: 1, start: 0, speed: 1, effects: [] },
        { id: 'bad-track', label: 'Bad', trackId: 'V0', sourceId: 'intro.mp4', sourceIn: 0, sourceOut: 1, start: 0, speed: 1, effects: ['sparkle'] },
        { id: 9, label: 3, trackId: 'V1.5', sourceId: 'intro.mp4', sourceIn: '0', sourceOut: 1, start: 0, speed: 1, effects: true, caption: 4 },
        null,
      ],
    } as unknown as Timeline;
    expect(() => validateTimeline(malformed)).not.toThrow();
    const errors = validateTimeline(malformed).join('\n');
    expect(errors).toContain('unknown source ID');
    expect(errors).toContain('invalid track ID');
    expect(errors).toContain('unknown effect');
    expect(errors).toContain('effects must be an array');
    expect(errors).toContain('label must be a non-empty string');
    expect(errors).toContain('caption must be a string');
    expect(errors).toContain('malformed clip object');
  });

  it('rejects known media types placed on incompatible track families', () => {
    const errors = validateTimeline({ clips: [
      clip({ id: 'video-on-audio', sourceId: 'intro.mp4', trackId: 'A1' }),
      clip({ id: 'audio-on-video', sourceId: 'voiceover.mp3', trackId: 'V1' }),
      clip({ id: 'caption-on-audio', sourceId: 'caption', trackId: 'A2', caption: 'Hello' }),
    ] });
    expect(errors).toHaveLength(3);
    expect(errors.every((error) => error.includes('track'))).toBe(true);
  });

  it('compares timelines independent of clip order and effect ordering', () => {
    const a = { clips: [clip({ id: 'a', effects: ['warm', 'warm', 'bw'] }), clip({ id: 'b' })] };
    const b = { clips: [clip({ id: 'b' }), clip({ id: 'a', effects: ['bw', 'warm'] })] };
    expect(timelinesEqual(a, b)).toBe(true);
    expect(timelinesEqual(a, { clips: [clip({ id: 'a' }), clip({ id: 'b' })] })).toBe(false);
  });
});
