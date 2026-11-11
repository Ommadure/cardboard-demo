# Branchcut

Browser-only version control for structured video timelines, with visual diff/merge and simulated playback.

## Run & Operate

- Start the managed `artifacts/branchcut: web` workflow for the app.
- `pnpm --filter @workspace/branchcut run test` — pure core and repository tests
- `pnpm --filter @workspace/branchcut run typecheck` — application TypeScript check
- `pnpm --filter @workspace/branchcut run build` — checked static build
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Branchcut requires no secrets, database, backend or application API. Template API/database libraries are unused.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- React 18, Vite, strict TypeScript, Tailwind, Zustand persist, Vitest.

## Where things live

- `artifacts/branchcut/src/core`: pure timeline, seed, diff, graph, merge and summary code.
- `artifacts/branchcut/src/store`: repository transitions and temporary UI/merge state.
- `artifacts/branchcut/src/components`: desktop editor presentation.
- `README.md`: source prompt assumptions, demo story and static-host instructions.
- `.local/conversation-workspace/files/tasks`: original approved plan and 24-task breakdown.

## Architecture decisions

- Follow the supplied seven phases. Test core before adding dependent Compare/Merge UI.
- Preserve the exact demo's six changes, two conflicts, two theirs-applied and four kept-ours changes.
- All persistence is browser localStorage. No backend/auth/remote fonts/media APIs.
- Final merge completion must validate both field/presence decisions and freshly revealed collisions.
- P2/stretch work is deferred, not required for acceptance.

## Product

Branch, commit, checkout and compare immutable cuts. Resolve three-way merge conflicts visually and preview the simulated timeline.

## User preferences

Keep the implementation inside the supplied frontend-only scope and record reasonable assumptions instead of expanding scope.

## Gotchas

- The shared scaffold originally used React 19; Branchcut alone is pinned to React 18 as requested. Do not move its entry point to React 19-only createRoot options.
- Use managed artifact workflows, not a second manually started Vite server.
- npm test/build/dev scripts run from the application package; dependency installation uses pnpm.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
