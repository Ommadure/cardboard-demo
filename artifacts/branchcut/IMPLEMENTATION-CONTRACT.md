# Shared implementation contract

Core is owned by Adam; UI by the design worker; store by main agent. Do not modify another owner's files.

Core exports (under src/core):
- types.ts: committed shared types; discuss additions rather than breaking signatures.
- seed.ts: `MEDIA_LIBRARY: MediaSource[]`, `createDemoRepo(): RepoState`.
- timeline.ts: `clipDuration(clip): number`, `cloneTimeline(timeline): Timeline`, `findOverlaps(timeline): [Clip, Clip][]`, `validateTimeline(timeline): string[]`, `timelinesEqual(a,b): boolean`.
- diff.ts: `diffTimelines(a,b): Change[]`.
- graph.ts: `isAncestor(commits, ancestorId, descendantId): boolean`, `lowestCommonAncestor(commits,aId,bId): string | null` (throws on ambiguous best bases).
- merge.ts: `threeWayMerge(base,ours,theirs): MergeResult`, `previewResolutions(result,resolutions): {timeline: Timeline; conflicts: Conflict[]}`; original conflicts stay in the returned list, plus new collisions; `applyResolutions(result,resolutions): Timeline` throws unless fully resolved, valid and overlap-free.
- summary.ts: `summarizeChange(change): string`, `summarizeConflict(conflict): string`.

Store API under src/store (main agent will supply before UI phase 3):

`useRepoStore` Zustand hook:
- `repo: RepoState | null`, `storageError: string | null`.
- `loadDemo()`, `reset()`, `clearAll()`, `clearStorageError()`.
- `updateClip(id, patch: Partial<Clip>)`, `addClip(sourceId, trackId, start)`, `deleteClip(id)`.
- `commit(message): string`, `createBranch(name, fromCommitId?): void`, `deleteBranch(name): void`.
- `checkout(target: {type:'branch';name:string}|{type:'detached';commitId:string}, options?: {discard?:boolean}): void`.
- `startMerge(theirsBranch): 'fast-forward' | 'up-to-date' | 'conflicts'`.
- `resolveConflict(id, resolution): void`, `completeMerge(message): string`, `abortMerge(): void`.
- Runtime failures throw Error with user-readable text; UI catches and toasts. Dirty checkout with no discard throws `Uncommitted changes. Confirm discard before checking out.`
- `getHeadId(repo): string`, `isDirty(repo): boolean` exports in useRepoStore.ts.

`useUiStore` Zustand hook:
- `mode: 'workspace'|'compare'|'merge'`, `selectedClipId: string|null`, `selectedCommitId: string|null`, `comparePair: [string,string]`, `playhead: number`, `zoom: number`, `playing: boolean`, `mergeSession: MergeSession|null`, `hoveredClipId:string|null`.
- `setMode(mode)`, `setSelectedClipId(id)`, `setSelectedCommitId(id)`, `setComparePair(pair)`, `setPlayhead(number)`, `setZoom(number)`, `setPlaying(boolean)`, `setMergeSession(session|null)`, `setHoveredClipId(id|null)`.

Phase 1 may temporarily hold load-demo and playback state in App; after engine gate use real stores. No diff/merge UI until main agent reports tests passing.

React 18 requested: parent will pin React/react-dom and their types to 18, adapting scaffold main.tsx. No external APIs/fonts/media calls. DOM/CSS simulated scenes only.
