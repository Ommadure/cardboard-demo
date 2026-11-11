# Branchcut: readiness review and implementation plan

## Verdict and scope

The requested frontend-only prototype is feasible with the specified stack. This is a document-level readiness assessment, not evidence of a working application. No application code, tests, browser checks, or deployment have been performed.

Source: `attached_assets/Pasted--Replit-Agent-Prompt-Branchcut-Version-Control-for-Vide_1794374941851.txt`, read in full.

Deliver the seven phases in the source's order. Include P1 inspector/editing because the final acceptance checklist requires it. Include deterministic summaries as the specified P1/Compare-phase scope. Defer every P2/stretch feature until the required checklist passes. Do not implement the optional AI changelog: it conflicts with the stronger no-external-API requirement.

## Proposed interpretation decisions

These are the simplest scoped resolutions to the prompt's inconsistencies. They are proposed for the build, not implemented or user-approved architecture.

1. **Tracks:** retain the six default tracks; extend the type to explicitly permit numbered overflow tracks. Keep track family semantics (video overlay, audio indicator, caption) rather than treating every overflow lane as V3. Render all present lanes in deterministic order. Allocate the lowest unused suitable overflow lane so “keep both” cannot collide there. No general-purpose track-management feature.
2. **Captions:** use `sourceId: 'caption'`, `sourceIn: 0`, `sourceOut: requested duration`, `speed: 1`, and `effects: []` unless explicitly edited. Exempt captions from finite media-source duration limits; require valid finite positive timing.
3. **Validation:** require unique clip IDs, finite numbers, `sourceIn >= 0`, `sourceOut > sourceIn`, `speed > 0`, `start >= 0`, and real-media source bounds. Validate source/track families. Source changes revalidate bounds. Invalid inspector drafts never corrupt stored clips. Overlap detection remains separate from individual clip validity; do not silently ripple or move edits.
4. **Resolutions:** the provisional unresolved state follows ours, including deletion. Recompute collision conflicts after field/presence resolutions, including collisions previously suppressed by field conflicts. Completion requires all resolutions, valid clips, and no remaining same-track overlaps. Keep `applyResolutions` returning a Timeline for valid complete inputs; reject unresolved/invalid results with typed domain errors. A separate pure preview/evaluation helper returns provisional timelines and outstanding conflicts for the UI. New collisions get cards rather than allowing a broken merge.
5. **Collision ownership:** record both clip IDs and explicit ours/theirs candidate identities rather than inferring ownership from list order. For shared-provenance clips, choose stable deterministic candidate ordering and label the actual clips in the buttons. “Keep both” relocates the named second candidate, not an arbitrary clip.
6. **Attribution:** calculate provenance per field before grouping into Change records. Exclude unresolved fields, not entire clips, from automatic summaries. A single clip may legitimately have non-conflicting changes from both branches. Effects compare as sets. Branch labels mean target/source branches, not editor authors.
7. **Repository state:** detached checkout is read-only; disable editing, commit, and merge, while permitting branch creation from that commit. Block merges while the working copy is dirty; instruct the user to commit or use the existing discard-confirmation checkout flow. Never discard implicitly. Abort has no repository side effects. Merge completion validates and changes snapshots/pointers atomically.
8. **Reload:** persist repository data only. Refresh intentionally cancels an unfinished, non-persisted merge session without changing committed state. Validate hydrated data and show a recoverable storage error for invalid/incompatible data, with explicit reset/clear actions. Never silently overwrite incompatible saved work. Handle storage quota/unavailability without crashing and tell the user persistence failed.
9. **Graph:** determine lowest common ancestors using ancestry, not timestamps or first traversal match. Use the unique best common ancestor; clearly reject unrelated histories or multiple incomparable best ancestors. Recursive virtual merge bases are out of scope.
10. **Phase ordering:** Phase 1 may build the static shell and raw timeline renderer; no diff/merge-dependent UI is built until Phase 2's engine tests pass. This reconciles the engine-first instruction with the explicitly ordered phases.
11. **Purity:** random IDs are generated at store/application boundaries. Core conflict identities and output ordering are deterministic; core algorithms have no DOM, React, storage, clock, random, or network dependencies.
12. **Runtime scope:** no backend, authentication, database, external application APIs, analytics, remote fonts, or media fetching. Use a system-font fallback or locally bundled Inter. Dev tooling traffic is not application functionality. Publishing a live site is a separate user-approved step; this build must first be static-deployment-ready.

## Evidence and risks

| Finding | Source sections | Severity | Resolution |
|---|---|---|---|
| Fixed TrackId cannot represent required overflow lanes | 7.3, 7.5 | High | Decision 1 |
| A resolution can expose new collisions, yet completion promises no overlaps | F6, 7.5 | High | Decisions 4–5 |
| Clip-level summaries can misattribute independent/conflicting field changes | F6, 7.5 | High correctness risk | Decision 6 |
| Captions specify duration but lack source bounds | 5.1–5.2, F3, 7.3 | Medium | Decisions 2–3 |
| Dirty merges, detached actions, and refresh during merge need explicit policies | F2, F5, 7.7 | Medium | Decisions 7–8 |
| General DAGs can have multiple best merge bases | F5, 7.8 | Medium, outside seed path | Decision 9 |
| Optional AI changelog contradicts no API calls | 0, 11 | Medium scope conflict | Exclude it |

The seed arithmetic is internally consistent by inspection:

- `m2 → mc2`: three caption additions, office b-roll removal, intro trim, CTA effect = exactly six changes.
- `LCA(mc2, lb2) = m2`; merging captions into main first is a fast-forward.
- Then merging broll gives the intro sourceOut conflict and b-roll delete/modify conflict; theirs contributes SFX addition and city b-roll move; ours retains three captions plus CTA effect.
- All four seed resolution combinations are overlap-free by interval arithmetic. Intro ends at 4 or 5 before hero starts at 6; city b-roll ends at 12 before optional factory b-roll starts at 15. This is not a substitute for executable tests.

## Architecture and dependencies

Use Vite, React 18, strict TypeScript, Tailwind, Zustand persist, and Vitest, as requested. Verify compatible package versions from official documentation during setup. Do not silently substitute a backend template or a different React major.

Pure timeline types/helpers and seed → pure diff/graph/merge/summary → repository transitions → store/UI adapters → compare and merge views.

Keep repo snapshots immutable and working state independent. The UI owns selections, zoom, playback and temporary merge sessions. Shared typed contracts are defined before parallel UI work. Keep files small by responsibility; do not scatter tiny abstractions merely to meet a file count.

Tasks and checkpoints are recorded in `tasks/todo.md`, the single task-status target. No existing incomplete plan was present.

## Routing and review

| Owner | Capability | Responsibility | Why |
|---|---|---|---|
| Adam | implementation | Core algorithms, repository behavior, UI integration | Strongest implementation fit |
| Virat | api-design | Pure function/store contracts and resolution types | Interface design applies without HTTP |
| Mei | quality | Unit/store coverage and browser acceptance flow | Strongest QA fit |
| Samantha | performance | Timeline stability and measured rendering checks | Performance specialist |
| Priya | security | Stored/untrusted data handling and destructive actions | Security specialist; no auth work |
| Diego | devops | Vite run command and static-build configuration | Platform/deployment fit |

Completed readiness assignments: Adam reviewed implementation feasibility under documentation; Mei independently reviewed quality and seed expectations. No relevant prior Branchcut lessons existed. Reference skill memory describes its own Python orchestration project and is not Branchcut architecture.

Cross-review: Adam reviewed the quality plan and Mei reviewed the consolidated readiness documentation; both returned `approve_with_comments`. Their comments were incorporated: corrected the rationale for including summaries; explicitly covered author “You,” branching from a selected commit, tip pills/commit list, playhead-based clip placement and the specified change palette; clarified rendering measurement and task scope. No reviewer disagreement required escalation. Their source findings are consolidated in the Evidence and risks table above. This is approval of planning coverage, not application correctness.

During implementation, use the product-manager review matrix: implementation → performance/quality/security; contracts → security/implementation; quality → implementation; devops → security; documentation → implementation. High/critical findings hold completion. Lower-priority unresolved concerns are recorded, not hidden. No agent approves its own work.

The prescribed seven phases are sequential. Inside a phase, independent tests, components, or documentation can run concurrently after shared contracts are stable, with explicit non-overlapping ownership.

## Verification strategy

- `npm test` runs `vitest run`, not an indefinite watch process.
- `npm run build` includes TypeScript checking and the Vite static build.
- `npm run dev` serves on `0.0.0.0:5000`, with the requested allowed-host configuration restricted to development configuration.
- Run all source-required core tests, plus non-mutation, deterministic ordering/IDs, invalid timing, touching-versus-overlapping intervals, resolution-induced collisions, multiple overflow collisions, and ambiguous/unrelated graph cases.
- Store tests cover immutable snapshots, branch protections, dirty checkout/merge policy, detached restrictions, fast-forward/up-to-date, atomic two-parent completion, abort, persistence hydration/reset/clear and storage errors.
- Browser smoke: empty state → load demo → compare m2/mc2 → fast-forward captions → merge broll → resolve both conflicts → verify two parents/no overlaps → reload. Separately check inspector editing, commit/branch, synchronized previews, overflow lanes and destructive confirmations.
- Check no browser console errors after every phase. From Phase 2 onward, tests pass before moving on; build/type checks run at each checkpoint.
- Verify 1920×1080 layout, minimum 1100px desktop width, focus states, non-color badges, dialog focus, text-input-safe shortcuts, and absence of application external requests.
- Check available real-browser tooling before claiming runtime verification. If Chrome DevTools MCP is unavailable, use an available real-browser alternative and record it; if none works, report browser verification as blocked rather than claiming success.

## Skills by stage

Applied now: using-agent-skills, find-it, reading-uploaded-files, product-manager, delegation, planning-and-task-breakdown. The existing prompt already supplies a PRD/TRD; do not replace it with a speculative new product specification.

During the build, load relevant skills in context: agent-mem/context-engineering; api-and-interface-design; incremental-implementation/test-driven-development; frontend-ui-engineering/browser-testing-with-devtools; security-and-hardening; performance-optimization; debugging-and-error-recovery when needed; source-driven-development/package-management; code-review-and-quality/git-workflow-and-versioning; documentation-and-adrs; shipping-and-launch. Use the prompt's written quality bar; do not add unrelated compliance, authentication, or service integrations.

Do not invoke every available skill indiscriminately. Media generation, business formation, ads, email, and external-service setup are not needed for this application.

## Completion boundary

Feasibility is supported by specification review. Build success remains unproven until implementation and all required checks pass. The target deliverable is a working project, test/build evidence, README, and a static-deployment-ready build—not a mockup, generated picture, or real video editor.

No publication, external-service writes, or paid resources are authorized by this review. Begin the application in a Replit Build project after the review is accepted; carry the source prompt and both planning files into it.
