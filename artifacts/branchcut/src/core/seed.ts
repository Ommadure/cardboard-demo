import type { Commit, MediaSource, RepoState, Timeline, Clip, TrackId } from './types';
import { cloneTimeline } from './timeline';

export const MEDIA_LIBRARY: MediaSource[] = [
  { id: 'intro.mp4', label: 'Intro', duration: 8, type: 'video', color: 'indigo' },
  { id: 'product-hero.mp4', label: 'Product hero', duration: 10, type: 'video', color: 'teal' },
  { id: 'product-detail.mp4', label: 'Product detail', duration: 10, type: 'video', color: 'orange' },
  { id: 'cta-end.mp4', label: 'Call to action', duration: 8, type: 'video', color: 'pink' },
  { id: 'city-broll.mp4', label: 'City b-roll', duration: 6, type: 'video', color: 'slate' },
  { id: 'office-broll.mp4', label: 'Office b-roll', duration: 6, type: 'video', color: 'stone' },
  { id: 'factory-broll.mp4', label: 'Factory b-roll', duration: 6, type: 'video', color: 'amber' },
  { id: 'voiceover.mp3', label: 'Voiceover', duration: 24, type: 'audio', color: '' },
  { id: 'score.mp3', label: 'Music', duration: 24, type: 'audio', color: '' },
  { id: 'whoosh.wav', label: 'Whoosh', duration: 2, type: 'audio', color: '' },
  { id: 'caption', label: 'Captions', duration: null, type: 'text', color: '' },
];

function clip(
  id: string, label: string, trackId: TrackId, sourceId: string,
  sourceIn: number, sourceOut: number, start: number, caption?: string,
  effects: Clip['effects'] = [],
): Clip {
  return { id, label, trackId, sourceId, sourceIn, sourceOut, start, speed: 1, effects: [...effects], ...(caption ? { caption } : {}) };
}

const rough: Timeline = {
  clips: [
    clip('c_intro', 'Intro', 'V1', 'intro.mp4', 0, 6, 0),
    clip('c_hero', 'Product hero', 'V1', 'product-hero.mp4', 0, 5, 6),
    clip('c_detail', 'Product detail', 'V1', 'product-detail.mp4', 2, 8, 11),
    clip('c_cta', 'Call to action', 'V1', 'cta-end.mp4', 0, 5, 17),
    clip('c_broll1', 'City b-roll', 'V2', 'city-broll.mp4', 0, 3, 8),
    clip('c_broll2', 'Office b-roll', 'V2', 'office-broll.mp4', 1, 4, 14),
  ],
};
const withAudio: Timeline = {
  clips: [...rough.clips, clip('c_vo', 'Voiceover', 'A1', 'voiceover.mp3', 0, 22, 0), clip('c_music', 'Music', 'A2', 'score.mp3', 0, 22, 0)],
};
const captionsTightened: Timeline = {
  clips: withAudio.clips.map((item) => item.id === 'c_intro' ? { ...item, sourceOut: 4 } : { ...item, effects: [...item.effects] }),
};
const captionsTip: Timeline = {
  clips: [
    ...captionsTightened.clips.filter((item) => item.id !== 'c_broll2').map((item) =>
      item.id === 'c_cta' ? { ...item, effects: ['fade-out' as const] } : { ...item, effects: [...item.effects] }),
    clip('c_cap1', 'Caption 1', 'C1', 'caption', 0, 4, 1, 'Meet the new dashboard'),
    clip('c_cap2', 'Caption 2', 'C1', 'caption', 0, 4, 7, 'Everything in one view'),
    clip('c_cap3', 'Caption 3', 'C1', 'caption', 0, 3, 14, 'Switch layouts in one click'),
  ],
};
const brollSwapped: Timeline = {
  clips: withAudio.clips.map((item) => item.id === 'c_broll2'
    ? { ...item, label: 'Factory b-roll', sourceId: 'factory-broll.mp4', start: 15, effects: [...item.effects] }
    : { ...item, effects: [...item.effects] }),
};
const brollTip: Timeline = {
  clips: [
    ...brollSwapped.clips.map((item) => {
      if (item.id === 'c_intro') return { ...item, sourceOut: 5 };
      if (item.id === 'c_broll1') return { ...item, start: 9 };
      return { ...item, effects: [...item.effects] };
    }),
    clip('c_sfx', 'Whoosh', 'A3', 'whoosh.wav', 0, 2, 6),
  ],
};

function makeCommit(id: string, parents: string[], branch: string, message: string, author: string, createdAt: number, timeline: Timeline): Commit {
  return { id, parents: [...parents], branch, message, author, createdAt, timeline: cloneTimeline(timeline) };
}

export function createDemoRepo(): RepoState {
  const commits: Record<string, Commit> = {
    m1: makeCommit('m1', [], 'main', 'Rough cut', 'Team', 1, rough),
    m2: makeCommit('m2', ['m1'], 'main', 'Add voiceover & music', 'Team', 2, withAudio),
    mc1: makeCommit('mc1', ['m2'], 'captions', 'Tighten intro', 'Maya', 3, captionsTightened),
    mc2: makeCommit('mc2', ['mc1'], 'captions', 'Add captions', 'Maya', 4, captionsTip),
    lb1: makeCommit('lb1', ['m2'], 'broll', 'Swap b-roll', 'Leo', 5, brollSwapped),
    lb2: makeCommit('lb2', ['lb1'], 'broll', 'Trim intro & add SFX', 'Leo', 6, brollTip),
  };
  return { commits, branches: { main: 'm2', captions: 'mc2', broll: 'lb2' }, head: { type: 'branch', name: 'main' }, working: cloneTimeline(commits.m2.timeline) };
}
