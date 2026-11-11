# Branchcut

**Version control for video timelines.**

Branchcut is a desktop-first, browser-only prototype exploring how editors could branch a structured video timeline, inspect changes, and merge parallel cuts without learning git. The timelines are real structured data; media and playback are simulated. No video is decoded, rendered, uploaded or exported.

Independent prototype inspired by Cardboard's public 'Hard problems' page. Not affiliated. Uses mock data.

## Demo GIF

Recording placeholder: add a 45-second capture after the working demo is accepted. No recording is bundled or claimed as completed.

## Demo story: Maya and Leo

1. Click **Load demo project**. `main` points to `m2`, “Add voiceover & music,” after the rough cut.
2. Compare `m2` with `mc2`, Maya's `captions` tip: exactly **6 changes**—3 captions added, office b-roll removed, intro trimmed, and CTA fade-out added.
3. From `main`, merge `captions`. This **fast-forwards** main to `mc2` without a new commit.
4. Merge Leo's `broll` branch into main. The common ancestor is `m2`.
5. Review **2 conflicts**: intro `sourceOut` (4 versus 5 seconds), and deleted office b-roll versus Leo's modified factory b-roll.
6. Leo's SFX addition and city b-roll move apply automatically; Maya's three captions and CTA effect remain.
7. Choose either side for each conflict, then complete the merge. The result has no same-track overlaps and a new commit with **two parents**.

Each of the four combinations of the seeded conflict choices is valid. All repository state survives a page reload in the same browser/profile/origin.

## Run, test, and build

This repository uses pnpm workspaces and Node.js. Install dependencies from the root:

```sh
pnpm install
pnpm --filter @workspace/branchcut run test
pnpm --filter @workspace/branchcut run typecheck
pnpm --filter @workspace/branchcut run build
```

In Replit, run the configured **Branchcut** web workflow or open Preview. It supplies the allocated service port and base path. No API server or database is used by Branchcut.

The source prompt's npm commands also work inside the application package:

```sh
cd artifacts/branchcut
npm test
npm run build
# Outside Replit, starts on 0.0.0.0:5000 by default:
npm run dev
```

Use pnpm, not npm, to install dependencies in this workspace. Dev configuration accepts `PORT` and `BASE_PATH` when the hosting environment provides them; static builds default to `/`.

## Static deployment

`pnpm --filter @workspace/branchcut run build` outputs the static site in `artifacts/branchcut/dist/public`. Serve that directory using a static host. The registered Replit artifact already declares this output and its index fallback. Publishing is a separate user action; building does not publish.

There are no required secrets, server-side environment variables, databases, integrations or external application APIs. Application assets and styling are local. Vite's development connection and Replit development tooling are not application backend features.

## Data model

- **Clip:** stable ID, label, track, source, source in/out, timeline start, playback speed, effect set, optional caption text.
- **Timeline:** a flat clip array. Duration is `(sourceOut - sourceIn) / speed`.
- **Commit:** ID, zero/one/two parents, original branch name, message, author, time, immutable full timeline snapshot.
- **Repository:** commit map, branch-tip pointers, branch/detached HEAD and an independent working copy.
- **Merge session:** target/source/base IDs, result, conflict decisions. Session UI is temporary and is not persisted.

Default tracks are V1 main video, V2 overlay, A1 voiceover, A2 music, A3 SFX and C1 captions. Collision “keep both” can allocate further type-compatible numbered tracks. Captions use `sourceId: 'caption'`, sourceIn 0 and sourceOut equal to duration, without a finite media-source limit.

Pure algorithms live in `artifacts/branchcut/src/core`, repository/UI state in `src/store`, and presentation in `src/components` and `src/pages`. Core code has no React/DOM/storage imports or external requests.

## How the diff works

Clips match by stable ID, not by their order in an array. Missing/new IDs are removed/added. Start or track changes are moved; source in/out or speed changes are trimmed; source/label/caption/effect changes are modified. A clip can emit multiple categories. Effects compare as sets, so order alone is not a change.

Changes are sorted deterministically by timeline position and kind. A before/after snapshot gives the timeline ghosts and plain-English templates their source data. Summaries are deterministic—no AI or API is involved.

## How three-way merging works

The graph computes a unique lowest common ancestor. If the source is already an ancestor of the target, the target is up to date. If the target is an ancestor of the source, its pointer fast-forwards.

For divergent histories, compare each clip ID and each field:

```ts
if (equal(ours, theirs)) return ours;
if (equal(base, ours)) return theirs;
if (equal(base, theirs)) return ours;
return conflict(base, ours, theirs);
```

One-sided additions and unchanged-versus-deleted clips merge automatically. Deletion versus modification becomes a presence conflict. Differing same-ID additions merge field by field against an absent base. Unresolved fields use ours provisionally, including ours' deletion state.

Attribution is computed per field, so one conflict does not hide independent automatic changes to the same clip. Collision checks use half-open time ranges: two clips may touch but not overlap on one track. Resolution previews recompute collisions; newly revealed collisions must also be resolved. Completion rejects unresolved, invalid or overlapping results, then creates a snapshot and advances the target branch atomically.

Criss-cross histories with multiple incomparable best ancestors and unrelated histories are rejected explicitly; recursive virtual merge bases are not implemented.

## Assumptions and limitations

- Mock media, invented timeline format, no Cardboard affiliation.
- DOM/CSS scene cards simulate V1, overlay tracks, effects and captions; active audio is indicated but silent.
- No backend, auth, network collaboration, external application API, real media decoding/render/export or actual project-file import.
- No ripple editing or drag-to-edit clips; use inspector inputs. Ruler/playhead dragging is supported.
- Desktop minimum width is 1100px. Mobile layouts are outside scope.
- Inter is used if installed locally, otherwise system fonts; no remote font fetches.
- Detached commits are read-only. Create a branch to edit; newly created commits use author “You.”
- Branch creation checks out the new branch. Dirty work must be committed first. Checkout can discard it only after confirmation.
- Dirty work blocks merge. An unfinished merge is canceled by refreshing without changing committed repository state.
- `localStorage` key is `branchcut:v1`, version 1. This is local persistence, not a backup or cross-device sync.
- Incompatible or corrupted saved data is not silently overwritten. Reset/clear is the explicit recovery action. Storage failures are reported; in-memory work should not be mistaken for durable saves.
- Effect arrays are merged as a whole set, not independent per-effect toggles.
- No stretch features displace the required workflow. The optional AI changelog is excluded because it contradicts the no-API scope.

## Verification

Core unit tests cover the required diff/graph/merge/summary cases, deterministic behavior, malformed data and every seeded conflict-choice combination. Store tests cover edits, snapshots, author defaults, branch guards/origins, dirty checkout and merge, detached state, atomic completion/abort and persistence.

Actual execution results and any remaining unverified checks are recorded in `tasks/verification.md`. A passing unit test is not a claim that a browser interaction was tested.

## What I'd do next

- Ripple-aware merging.
- CRDT-based real-time collaboration.
- Import real formats such as OpenTimelineIO.
- Integrate a real editor's API or MCP server.
- Research conflict-resolution UX with working video editors.
