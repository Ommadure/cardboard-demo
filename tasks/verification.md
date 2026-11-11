# Branchcut verification record

## Build scope

Implemented the seven-phase required application surface in `artifacts/branchcut`. The original prompt and approved plan remain preserved under `.local/conversation-workspace/files`.

This record distinguishes executed checks from implemented-but-unexercised browser behavior. It is not a claim that every acceptance item has passed an interactive browser test.

## Executed checks

- Phase-1 application started with the managed web workflow; 1920×1080 screenshot showed the load-demo empty state and exact disclaimer without browser runtime errors.
- Engine gate before dependent comparison/merge UI: 31 core tests passed, plus TypeScript checking.
- Validation/store integration gate: 55 unit tests passed after adding repository transitions and stronger stored-input validation.
- Final core/store suite: **6 test files / 57 tests passed** using `pnpm --filter @workspace/branchcut run test`.
- TypeScript and Vite production build succeeded using `pnpm --filter @workspace/branchcut run build`. Vite emitted non-blocking source-map location warnings for scaffolded Radix UI wrappers; exit status was 0.
- Final workflow started cleanly. A fresh 1920×1080 screenshot showed the finished empty state, corrected three-branch copy and footer. Browser logs contained only Vite connection messages and React's development-tools notice.
- Static build output is `artifacts/branchcut/dist/public`; the artifact already declares static serving and an index fallback. No live publication was performed.

## Automated coverage

- Diff categories, multi-category clips, effect-set comparison, exact six-change seeded diff, deterministic ordering and input immutability.
- Ancestry/LCA for linear, branched and two-parent graphs, unique seed merge base, unrelated/ambiguous histories.
- Field/presence merge cases, same-ID additions, effect-set equality, per-field provenance, dynamic overflow collisions and newly exposed collisions after resolution.
- Exact two-conflict/two-theirs-applied/four-ours-retained demo result and all four seeded resolution combinations.
- Clip timing/source/family/effect validation and malformed runtime data.
- Working versus committed snapshot independence, author “You,” blank/no-op commits, branch origins and protections, dirty checkout confirmation and detached read-only restrictions.
- Fast-forward without extra commit, already-up-to-date, dirty merge rejection, atomic two-parent completion and side-effect-free abort.
- Persistence round-trip including dirty work, version validation, corrupt JSON protection, graph reference/cycle validation, quota errors, reset and clear.

## Implemented UI: browser interaction not yet exercised

Repository dialogs and history graph; clip inspector and source-library insertion; simulated preview, transport and keyboard shortcuts; Compare players/timelines/ghosts/list linking; merge cards, live preview, completion guards and overflow lanes; destructive confirmations and storage-recovery banner.

No browser click-through/e2e suite or separate code review was run for this first build. Screenshots only establish the initial, signed-out/empty screen; they do not establish how dialogs, the loaded workspace, Compare or Merge render after interaction.

## Pending verification

- [ ] Interactive demonstration: load → compare m2/mc2 → captions fast-forward → broll merge → resolve → complete → reload.
- [ ] Browser editing/commit/branch/checkout and destructive-confirmation paths.
- [ ] Loaded 1920×1080 and 1100px desktop layout, focus/dialog behavior and synchronized preview playhead.
- [ ] Real browser rendering measurement with 25 clips and unchanged ClipBlock render profiling.
- [ ] Runtime network inspection. Source uses local assets/system fonts and no application API, but network behavior has not been measured.
- [ ] Separately serve the production directory and execute the same interactive flow.

Do not mark these checks complete merely because a unit suite or static build passed. No P2/stretch feature, video rendering/export, backend, authentication or external application API has been added.
