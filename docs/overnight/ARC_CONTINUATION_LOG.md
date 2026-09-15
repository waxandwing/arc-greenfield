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
- The validated Easel projection/outcome seam remains behind ArcTable-named adapters; the jury pass minimally extends only the projection payload with canonical Lesson content.

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

## Jury fix pass — 2026-09-13

Starting HEAD: `a5f2969b1ce1e1446a15e566baea20e025f4d481`

| Jury lane | Status | Observed evidence |
|---|---|---|
| Canonical Lesson → ArcTable | GREEN++ | Removed generic directions/material defaults; added minimal canonical directions, materials, phases, and resources; projection and Teacher/Student browser assertions pass |
| Timer limit | GREEN++ | Shared 120-minute maximum; domain clamps and UI visibly constrains 121 to 120; immutable class `startedAt` unchanged |
| Student privacy | GREEN++ | Class elapsed and Exit projection removed; no buttons/private passes/editor controls; Escape returns to Teacher Monitor |
| People engine | GREEN++ | Explicit random/round-robin modes, duplicate/empty/keyboard/invalid-ID coverage |
| Reusable roster | GREEN | Section configuration persists name-only roster across separate P4 sessions; P1 isolation proven |
| Pass engine | GREEN++ | Configurable definitions, optional person ownership, request/active/returned, unique-ID hardening, Plan View continuity |
| Google Slides | GREEN | Real public deck normalized to sandboxed embed, rendered in Teacher/Student, and retained through Plan View |
| Other slide providers | YELLOW | Rejected visibly; no generic interoperability claim |
| Version-2 integrity | GREEN++ | Hostile repair covers impossible selections/media, duplicate roster/pass/media IDs, ownership, countdown bounds and run origins |
| Visual composition | GREEN | Teaching field >70%; compact utility rail; closed tools consume no workspace; rounded utility-card count reduced to at most one |
| External 12ui comparison | YELLOW | Re-attempted; platform rejected destination-specific repository/reference upload. No workaround used. |

Transient/live boundary remains explicit: timers, cleanup, picker result, pass status/ownership, active media, projection choices, phase position, voice, and board state never auto-save into canonical Lesson truth. Section delivery outcome is still the only End Class writeback.

### Observed final verification

- `npm run build` — 42 contract groups, type-check, production bundle
- `node tests/arctable-continuity.smoke.mjs`
- `node tests/browser-a11y.smoke.mjs`
- `node tests/phase2-planning-truth.mjs`
- `node tests/phase2-nondrag-keyboard-parity.mjs`
- `node tests/phase2-object-actions-section-divergence.mjs`
- `node tests/phase2-recovery-undo-continuity.mjs`
- `node tests/phase2-calendar-edge-planning-truth.mjs`
- `git diff --check`

No uncaptured command is represented as passing.

## Import + onboarding implementation — 2026-09-13

Starting HEAD: `a8ec1be`

The implementation reused the existing calendar proposal/review lane, canonical planning stores, Capture promotion, and current Arc Plan shell. It added independent setup capabilities, resumable unconfirmed drafts, explicit teaching-day/Planning truth, a single curriculum CSV review pipeline, stable import provenance, re-import conflict classification, and a rollback-tested Course/Unit/Lesson transaction.

### Status

- **GREEN++**: explicit Planning/day order, partial onboarding persistence, parse/review no-write boundary, hostile CSV parsing, atomic commit/rollback, provenance, duplicate-title identity, identical re-import, local/upstream conflict protection.
- **GREEN**: current-family onboarding/review composition, existing official calendar lane, manual bell/Course entry routing, compatibility projection for older planning state.
- **YELLOW**: removed-upstream deletion review, inline row correction, date-aware placement without governed date semantics, bell-schedule file/alternate-day parsing, Course/Section file parsing, prior-Arc reuse, optional profile UI.
- **YELLOW**: the required 12ui method was consulted, but its executable is not installed in this workspace; local screenshot review plus 200%/400% and 390px browser geometry were used.
- **RED**: none observed.

The dedicated report is `docs/overnight/ARC_IMPORT_ONBOARDING_REPORT.md`; implementation-audit notes are `docs/overnight/ARC_IMPORT_ONBOARDING_IMPLEMENTATION_NOTES.md`; fresh evidence is under `docs/overnight/evidence/import-onboarding/`.

No merge, deployment, Vercel mutation, base-branch modification, ArcTable rename, or continuity-architecture replacement occurred.

Observed final sweep: `npm run build` (50 contract groups, type-check, production bundle), import/onboarding browser gate, Arc Plan continuity, browser accessibility, planning truth, keyboard parity, Section divergence, recovery/Undo, calendar-edge truth, ArcTable continuity, and `git diff --check` all passed.
