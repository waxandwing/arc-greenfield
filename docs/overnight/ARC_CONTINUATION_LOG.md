# Arc + ArcTable continuation log

## Guardrails and starting state

- Date: 2026-09-13
- Branch: `codex/arc-multiprep-arctable-integration`
- Starting HEAD: `3cd321249722d772632e85bd72f3c8f6e11a832d`
- Starting worktree: clean and tracking `origin/codex/arc-multiprep-arctable-integration`
- Protected: `main` and `design/v1-current-laws-reconciliation` will not be modified.
- Delivery boundary: no merge, deployment, or Vercel/configuration mutation.

## ArcTable dependency map before continuation

```text
AppFrame
├── projectArcTableSession
│   └── legacy easelSessionProjection
├── applyArcTableTeachingOutcome
│   └── legacy easelTeachingOutcome
│       ├── easelSessionProjection
│       ├── dayContinuityProjection
│       └── canonical Lesson/Unit/Planning validators
├── useArcTableSession
│   └── arcTableLiveState persistence
└── ArcTableSurfaces
    ├── ArcTableTeacherMonitor
    └── ArcTableStudentSurface
```

Legacy donor inventory: `easelSessionProjection.ts`, `easelTeachingOutcome.ts`, and their three contract suites (`easelSessionProjection.contract.ts`, `easelTeachingOutcome.contract.ts`, `easelCoreLoop.hostile.contract.ts`). No roster, people-picker, pass-state, or media-state subsystem exists elsewhere in the current repository.

## Pre-change baseline

The following baseline gates were observed passing at starting HEAD:

- `npm run test:contracts` — 40 contract groups
- `npm run typecheck`
- `npm run build:bundle`
- `node tests/arctable-continuity.smoke.mjs`
- `git diff --check`

The four legacy phase-browser commands were dispatched during the initial baseline, but their completion output was not captured. The final sweep later exposed their obsolete header-action selectors. They were migrated to the current Settings workflow and subsequently passed; this log does not misstate them as baseline passes.

## Production decisions

- Classroom elapsed duration remains derived solely from immutable `startedAt`.
- Classroom countdown, cleanup countdown, people, passes, and media belong to the durable live-session boundary; none may create a second planner or mutate Lesson planning truth.
- Because no legacy roster, pass, or media model exists, this pass adds section-scoped live tools rather than inventing canonical school-wide data.
- Validated Easel projection/outcome donors remain untouched behind ArcTable-named adapters.

## Queue completion matrix

| Queue lane | Steps | Status | Evidence |
|---|---:|---|---|
| Branch, guardrails, inventory, baseline | 1–20 | VERIFIED | Clean starting worktree, dependency map above, and observed baseline outputs recorded without overstating the four uncaptured legacy phase runs |
| Classroom timer | 21–40 | VERIFIED | Version-2 live state, deterministic countdown contract, Plan View/refresh/paused browser assertions, fresh timer screenshot |
| Cleanup | 41–50 | VERIFIED | Independent cleanup countdown, start/pause/resume/cancel/complete, Plan View continuity, teacher/student evidence |
| People picker | 51–60 | VERIFIED | Repository inventory found no roster donor; Section live roster, keyboard selection, live announcement, projection privacy, contract/browser coverage |
| Pass tools | 61–70 | VERIFIED | Repository inventory found no pass donor; requested/active/inactive Section state, keyboard labels, Plan View persistence, Student privacy, End Class clearing |
| Media | 71–80 | VERIFIED with one YELLOW integration | Image behavior is browser-proven; slide rendering/state is implemented but not exercised against a real external deck |
| Production asset audit | 81–90 | VERIFIED | Function-to-asset checklist in production report; no inert controls; Student DOM privacy assertion |
| Planner/accessibility audit | 91–97 | VERIFIED | Period 5 planning gap; Week width measurement; Month fixed/drift/continuity; Year underlays; Workspace language; updated obsolete tests; browser accessibility gate |
| Evidence/report/final verification | 98–100 | VERIFIED | Twelve fresh evidence states captured; report updated; build, 41 contract groups, type-check, bundle, seven browser gates, and `git diff --check` passed. Coherent commits and protected-branch push are the authorized terminal actions immediately following this log. |

## Tool constraint

The required 12ui target comparison was attempted with the pinned 0.2.65 CLI against the approved Teacher Monitor image. Platform review rejected repository/reference upload to the external service because that data egress was not explicitly authorized. No workaround was attempted. Manual side-by-side image review and local browser verification were completed instead; this constraint does not block product behavior.
