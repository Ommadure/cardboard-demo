export type TrackId = `V${number}` | `A${number}` | `C${number}`;
export type EffectId = 'fade-in' | 'fade-out' | 'warm' | 'cool' | 'bw';
export interface Clip {
  id: string;
  label: string;
  trackId: TrackId;
  sourceId: string;
  sourceIn: number;
  sourceOut: number;
  start: number;
  speed: number;
  effects: EffectId[];
  caption?: string;
}
export interface Timeline { clips: Clip[] }
export interface Commit {
  id: string;
  parents: string[];
  branch: string;
  message: string;
  author: string;
  createdAt: number;
  timeline: Timeline;
}
export interface RepoState {
  commits: Record<string, Commit>;
  branches: Record<string, string>;
  head: { type: 'branch'; name: string } | { type: 'detached'; commitId: string };
  working: Timeline;
}
export interface MediaSource {
  id: string;
  label: string;
  duration: number | null;
  type: 'video' | 'audio' | 'text';
  color: string;
}
export type ChangeKind = 'added' | 'removed' | 'moved' | 'trimmed' | 'modified';
export interface Change {
  clipId: string;
  kind: ChangeKind;
  label: string;
  before?: Clip;
  after?: Clip;
  detail?: {
    fromStart?: number; toStart?: number;
    fromTrack?: TrackId; toTrack?: TrackId;
    fromIn?: number; toIn?: number; fromOut?: number; toOut?: number;
    fields?: string[];
  };
}
export type ConflictKind = 'field' | 'delete-modify' | 'collision';
export interface Conflict {
  id: string;
  clipId: string;
  label: string;
  kind: ConflictKind;
  field?: keyof Clip;
  base?: unknown;
  ours?: unknown;
  theirs?: unknown;
  baseClip?: Clip;
  oursClip?: Clip;
  theirsClip?: Clip;
  oursDeleted?: boolean;
  theirsDeleted?: boolean;
  collidesWith?: string;
  resolution?: 'ours' | 'theirs' | 'both';
}
export type Resolutions = Record<string, 'ours' | 'theirs' | 'both'>;
export interface MergeResult {
  merged: Timeline;
  conflicts: Conflict[];
  appliedFromTheirs: Change[];
  keptFromOurs: Change[];
}
export interface MergeSession {
  oursId: string;
  theirsId: string;
  baseId: string;
  oursBranch: string;
  theirsBranch: string;
  result: MergeResult;
  resolutions: Resolutions;
}
