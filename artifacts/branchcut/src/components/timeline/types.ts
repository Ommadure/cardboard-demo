import type { ReactNode } from 'react';
import type { ChangeKind, Clip, Timeline, TrackId } from '@/core/types';

export interface ClipMark { kinds?: ChangeKind[]; conflict?: boolean; resolved?: boolean }
export interface Ghost { clip: Clip; kind: 'removed' | 'moved'; toStart?: number; toTrack?: TrackId }
export interface LaneGroup {
  id: string;
  tag?: string;
  title?: ReactNode;
  timeline: Timeline;
  marks?: Record<string, ClipMark>;
  ghosts?: Ghost[];
}
