# Branchcut implementation tasks

Status: proposed plan; application implementation has not started. All file paths below are planned paths, not existing code. Task IDs are dependencies. Each task is small/medium, roughly 1–5 files. Expand tasks further if actual edits exceed that scope.

Verification default: focused tests plus `npm test` and `npm run build` once those commands exist, and a relevant runtime check. Phase checkpoints also require a browser console check. Do not check off unrun verification.

## Phase 1 — Foundation and timeline

### T01: Set up the browser application
- [ ] Acceptance: Vite/React 18/strict TypeScript/Tailwind installed compatibly; dev server uses requested host/port; test and build scripts terminate successfully.
- Verification: run dev server, `npm test -- --passWithNoTests` only for this setup step, `npm run build`; open browser and inspect console.
- Dependencies: none. Owner: Diego [devops]. Scope: medium.
- Likely files: package.json, vite.config.ts, tsconfig.json, index.html, src/main.tsx. Split style setup if needed.

### T02: Define timeline invariants
- [ ] Acceptance: typed base/overflow tracks, duration/index/clone/overlap helpers, finite clip validation; touching boundaries are not collisions.
- Verification: focused helper tests including invalid speed/source bounds, caption convention and non-mutation.
- Dependencies: T01. Owner: Adam [implementation]. Scope: small.
- Likely files: src/core/types.ts, src/core/timeline.ts, src/core/__tests__/timeline.test.ts.

### T03: Encode the exact demo
- [ ] Acceptance: all library sources and six immutable commit snapshots use exact IDs, parents, authors, labels, branch pointers and timing; HEAD main=m2.
- Verification: seed fixture tests assert counts, intervals, forks and no accidental snapshot sharing.
- Dependencies: T02. Owner: Adam [implementation]. Scope: small.
- Likely files: src/core/seed.ts, src/core/__tests__/seed.test.ts.

### T04: Create minimal stores
- [ ] Acceptance: load/reset/clear and separate non-persisted UI state; versioned repository persistence handles storage errors without crashing.
- Verification: store tests for empty/load/reload/reset/clear; no actions/functions serialized.
- Dependencies: T03. Owner: Adam [implementation]. Scope: medium.
- Likely files: src/store/useRepoStore.ts, src/store/useUiStore.ts, src/store/__tests__/repo.test.ts.

### T05: Render the application shell
- [ ] Acceptance: dark desktop layout, panels, footer disclaimer and working load-demo empty state; no extra product features.
- Verification: browser visual check at 1920×1080 and keyboard focus inspection.
- Dependencies: T04. Owner: Adam [implementation]. Scope: medium.
- Likely files: src/App.tsx, src/index.css, src/components/layout/TopBar.tsx, src/components/layout/Sidebar.tsx, src/components/layout/Footer.tsx.

### T06: Render timelines with zoom
- [ ] Acceptance: correct source-colored clip rectangles and six/default or overflow lanes, shared ruler, scroll, 20–120 px/s zoom and deterministic pseudo-waveforms.
- Verification: helper/component tests plus browser main-tip positions and stable rerenders.
- Dependencies: T05. Owner: Adam [implementation]. Scope: medium.
- Likely files: src/components/timeline/Timeline.tsx, Track.tsx, ClipBlock.tsx, Ruler.tsx, waveform.ts.

### Checkpoint 1
- [ ] Demo m2 timeline displays correctly; browser has no console errors; typecheck/build pass.

## Phase 2 — Core engine and tests

### T07: Detect and summarize changes
- [ ] Acceptance: all diff categories, multiple categories per clip, effects-set equality, deterministic sorting and exact six-change seed result; deterministic sentences with one-decimal seconds.
- Verification: complete diff.test.ts and summary.test.ts cases from source plus input non-mutation.
- Dependencies: checkpoint 1. Owner: Adam [implementation]. Scope: medium.
- Likely files: src/core/diff.ts, summary.ts, __tests__/diff.test.ts, __tests__/summary.test.ts.

### T08: Traverse commit graphs
- [ ] Acceptance: ancestry and unique best LCA handle two-parent DAGs; unrelated/ambiguous bases are explicit; seed LCA=m2.
- Verification: graph tests for linear, branched, merge, criss-cross and missing commit references.
- Dependencies: T07. Owner: Adam [implementation]. Scope: small.
- Likely files: src/core/graph.ts, src/core/__tests__/graph.test.ts.

### T09: Merge fields and presence
- [ ] Acceptance: pure three-way merge covers all source presence/field cases; ours is provisional; attribution excludes conflicting fields and produces exact seed counts.
- Verification: source merge cases plus same-ID additions, effects order and independent edits on a conflicted clip.
- Dependencies: T08. Owner: Adam [implementation]. Scope: medium.
- Likely files: src/core/merge.ts, src/core/mergeFields.ts, src/core/types.ts, src/core/__tests__/merge.test.ts.

### T10: Resolve collisions safely
- [ ] Acceptance: stable conflict IDs/pair ownership; resolution preview exposes new collisions; completion rejects unresolved/invalid/overlapping results; keep-both allocates free typed overflow lanes.
- Verification: all four seed combinations; boundary overlaps; multi-clip collisions; field-choice-induced collisions; collision ownership and determinism tests.
- Dependencies: T09. Owner: Adam [implementation]. Scope: medium.
- Likely files: src/core/merge.ts, src/core/resolutions.ts, src/core/collisions.ts, src/core/types.ts, src/core/__tests__/resolutions.test.ts.

### Checkpoint 2
- [ ] `npm test` and build pass; exact seed 6 changes / 2 conflicts / 2 theirs-applied / 4 kept-ours verified. Engine independent of React/DOM; no console errors.

## Phase 3 — Repository features

### T11: Implement immutable repository transitions
- [ ] Acceptance: commit with author default “You,” create branch from HEAD or selected commit, delete branch/checkout, protected main/current branch and read-only detached HEAD; dirty checkout requires discard confirmation; empty messages rejected.
- Verification: store/action tests prove snapshot immutability, author default, selected-commit branch origin and failed actions have no side effects.
- Dependencies: checkpoint 2. Owner: Adam [implementation]. Scope: medium.
- Likely files: src/core/repository.ts, src/core/__tests__/repository.test.ts, src/store/useRepoStore.ts, src/store/__tests__/repo.test.ts.

### T12: Wire repository controls
- [ ] Acceptance: branch dropdown, commit/new-branch dialogs including origin at a selected commit, checkout/delete controls, selection and dirty badge work; canceling destructive confirmations preserves state.
- Verification: component tests and browser create/edit/commit/branch/checkout flow.
- Dependencies: T11. Owner: Adam [implementation]. Scope: medium.
- Likely files: src/components/layout/TopBar.tsx, src/components/common/ConfirmDialog.tsx, src/components/common/RepoDialog.tsx, src/components/layout/Sidebar.tsx, src/components/__tests__/repoControls.test.tsx.

### T13: Draw history and validate hydration
- [ ] Acceptance: graph has deterministic branch lanes, branch-name pills on tips, two-parent links, a commit list below the graph, commit selection and compare-pair selection; persisted data is validated and incompatible data gives recoverable feedback.
- Verification: graph/component and hydration tests; browser reload/reset/clear and exact seeded history.
- Dependencies: T12. Owner: Adam [implementation]. Scope: medium.
- Likely files: src/components/graph/HistoryGraph.tsx, src/store/hydration.ts, src/store/useRepoStore.ts, src/store/__tests__/hydration.test.ts, src/components/graph/HistoryGraph.test.tsx.

### Checkpoint 3
- [ ] Tests/build pass; graph matches seed; reload preserves valid state and dirty work; no console errors.

## Phase 4 — Preview and inspector

### T14: Simulate playback
- [ ] Acceptance: scene cards, PiP, captions, CSS effects and silent audio indicators reflect half-open clip intervals; playback/timecode/scrub/playhead stay synchronized.
- Verification: preview helper tests for clip boundaries/fade ramps; browser scrubbing and playback.
- Dependencies: checkpoint 3. Owner: Adam [implementation]. Scope: medium.
- Likely files: src/core/preview.ts, src/core/__tests__/preview.test.ts, src/components/preview/PreviewPlayer.tsx, SceneCard.tsx, src/components/timeline/Playhead.tsx.

### T15: Edit clips through the inspector
- [ ] Acceptance: requested fields and effects update live, invalid drafts are rejected accessibly, caption-specific fields work; Add clip uses library media and unique IDs on the user-chosen track at the playhead; delete works and detached state stays read-only.
- Verification: inspector tests and browser edit → preview → dirty badge → commit sequence.
- Dependencies: T14. Owner: Adam [implementation]. Scope: medium.
- Likely files: src/components/inspector/Inspector.tsx, MediaPicker.tsx, src/store/useRepoStore.ts, src/components/inspector/Inspector.test.tsx.

### Checkpoint 4
- [ ] Tests/build pass; edit/preview/commit workflow works without console errors.

## Phase 5 — Compare

### T16: Display synchronized comparison
- [ ] Acceptance: arbitrary commit pair, stacked timelines/shared zoom and scroll, synchronized A/B players, change badges and red/dashed ghosts with movement arrows; use specified palette: added #22c55e, removed #ef4444, moved #3b82f6, trimmed #f59e0b, modified #a855f7.
- Verification: comparison component tests plus seed visual comparison and scrub sync.
- Dependencies: checkpoint 4. Owner: Adam [implementation]. Scope: medium.
- Likely files: src/components/compare/CompareView.tsx, src/components/timeline/Timeline.tsx, ClipBlock.tsx, DiffOverlay.tsx, src/components/compare/CompareView.test.tsx.

### T17: Link plain-English change lists
- [ ] Acceptance: category counts, grouped sentences, hover highlight and click-to-scroll target the right changed/removed clips; keyboard access works.
- Verification: list tests and browser exact six seed changes, including removed ghost targeting.
- Dependencies: T16. Owner: Adam [implementation]. Scope: small.
- Likely files: src/components/compare/ChangeList.tsx, ChangeList.test.tsx, CompareView.tsx.

### Checkpoint 5
- [ ] Tests/build pass; m2→mc2 has exact six changes with correct counts, icons/colors, ghosts and synchronized previews; no console errors.

## Phase 6 — Merge

### T18: Implement repository merge transitions
- [ ] Acceptance: dirty/detached guards, up-to-date/no-op and fast-forward behavior; divergent merge uses committed snapshots; abort has no effects and completion creates an atomic two-parent snapshot.
- Verification: store tests for all paths, branch pointers, validation failure and reload-cancels-session policy.
- Dependencies: checkpoint 5. Owner: Adam [implementation]. Scope: medium.
- Likely files: src/core/repository.ts, src/store/useRepoStore.ts, src/store/useUiStore.ts, src/store/__tests__/mergeStore.test.ts.

### T19: Resolve conflicts in the merge view
- [ ] Acceptance: ours/theirs provenance lists, Base/Ours/Theirs cards and correct delete/modify labels; live provisional preview, newly exposed collision cards and accessible resolved indicators; complete disabled until truly valid.
- Verification: component tests and browser intro/delete-modify/collision choices, abort and editable merge message.
- Dependencies: T18. Owner: Adam [implementation]. Scope: medium.
- Likely files: src/components/merge/MergeView.tsx, ConflictCard.tsx, ConflictComparison.tsx, src/components/layout/TopBar.tsx, src/components/merge/MergeView.test.tsx.

### Checkpoint 6
- [ ] Tests/build pass; full captions fast-forward → broll conflict flow works; completion has no overlaps and graph draws two parents; no console errors.

## Phase 7 — Polish and deployment readiness

### T20: Finish interaction polish
- [ ] Acceptance: toasts, all destructive confirmations, input-safe Space/arrows, visible focus and non-color states; desktop layout and simulated-preview notice/disclaimer are clear.
- Verification: keyboard/dialog/focus browser checks at 1920×1080; verify shortcuts do not hijack typing.
- Dependencies: checkpoint 6. Owner: Adam [implementation]. Scope: medium.
- Likely files: src/components/common/Toast.tsx, ConfirmDialog.tsx, src/hooks/usePlaybackShortcuts.ts, src/index.css, src/App.tsx.

### T21: Verify the complete demonstration
- [ ] Acceptance: repeatable automated browser flow covers source acceptance checklist and persistence; no application external requests or browser errors.
- Verification: complete unit/store suite, build and real-browser end-to-end run; record tooling and actual results, not assumed passes.
- Dependencies: T20. Owner: Mei [quality]. Scope: medium.
- Likely files: e2e/demo.spec.ts, browser test config, tasks/verification.md.

### T22: Measure timeline rendering
- [ ] Acceptance: benchmark 25 clips on a recorded browser/viewport; proposed target: loaded working-copy edits settle within 100 ms on the test machine and unchanged memoized ClipBlocks do not rerender on unrelated selection updates.
- Verification: record browser performance/React profiling evidence over repeated edits; investigate failures without silently relaxing the target.
- Dependencies: T21. Owner: Samantha [performance]. Scope: small.
- Likely files: tasks/verification.md, src/components/timeline/ClipBlock.tsx, src/components/timeline/Timeline.tsx.

### T23: Document the prototype
- [ ] Acceptance: README covers every Section 10 topic, the demo GIF placeholder and explicit assumptions/limitations, without claiming stretch work is implemented.
- Verification: documentation reviewed against exact source checklist and actual implementation.
- Dependencies: T22. Owner: Adam [documentation]. Scope: small.
- Likely files: README.md, tasks/verification.md.

### T24: Prepare static deployment
- [ ] Acceptance: run/build/static-host configuration verified; no publication without approval.
- Verification: production build served locally and smoke-tested; record commands and results.
- Dependencies: T23. Owner: Diego [devops]. Scope: small.
- Likely files: .replit, tasks/verification.md.

### Final checkpoint
- [ ] All Section 9 items verified with recorded evidence; high/critical reviews resolved; remaining limitations/debt recorded; user can open and review working project.
- [ ] Optional work has not displaced required scope. P2 starts only if explicitly pursued after completion.
