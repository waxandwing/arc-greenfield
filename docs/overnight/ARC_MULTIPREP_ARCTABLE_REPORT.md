# Arc Multi-Prep + ArcTable production report

Date: 2026-09-13

Branch: `codex/arc-multiprep-arctable-integration`

Design base: `f543ff25f86277809d68daeda5bb2a7bbe34a17f` (`design/v1-current-laws-reconciliation`)

Continuation starting HEAD: `3cd321249722d772632e85bd72f3c8f6e11a832d`
Overall status: **GREEN** — the core planning/live-class path and classroom tools are implemented, durable, accessible, and covered. Real slide-deck interoperability remains YELLOW.

## Status vocabulary

- **GREEN++**: implemented and proven across domain contracts, browser interaction, persistence boundaries, and hostile/continuity checks where relevant.
- **GREEN**: implemented, accessible, persistent where required, and covered by appropriate verification.
- **YELLOW**: intentionally limited or not yet proven end-to-end against a real external integration.
- **RED**: missing, broken, or falsely represented as functional. There are no known RED rows in this report.

Rendering alone never earns GREEN.

## Public architecture and donor boundary

There is still one canonical Arc planner. ArcTable is a temporary, Section-specific live projection that returns one explicit teaching outcome to the existing Lesson delivery-state model.

```text
AppFrame
  ├─ useArcTableSession
  │    └─ arcTableLiveState + arcTableTools
  ├─ ArcTableTeacherMonitor
  │    └─ live timer / cleanup / people / passes / media
  └─ ArcTableStudentSurface
       └─ deliberately projected public state only

arcTableSession ──────────→ easelSessionProjection (validated donor)
arcTableTeachingOutcome ──→ easelTeachingOutcome (validated donor)
```

Legacy Easel donors remain intentionally untouched:

- `src/planning/easelSessionProjection.ts`
- `src/planning/easelTeachingOutcome.ts`
- their projection, outcome, and hostile core-loop contracts

No legacy roster, pass-state, or media subsystem existed. The new tool state is scoped to the live Section and stored inside the existing durable ArcTable session boundary; it is not a second planning model.

## Brutally accurate state table

| State / capability | Visual presence | Verified functionality | Status |
|---|---|---|---|
| Day | Six-period teaching rail plus explicit Period 5 planning time and one focused teaching moment | Browser verifies Periods 1/2/3/4/6/7, Period 5 gap, focus, and P4 launch | **GREEN** |
| Week | Selected day is materially wider; surrounding days remain readable | Browser measures unequal columns and verifies Section drift/fixed work remains visible | **GREEN** |
| Month | Compact Unit bands, Lesson signals, Fixed labels, drift labels, and real gaps | Browser verifies Unit continuity, a fixed assessment, Period 6 drift, and no full-card expansion | **GREEN** |
| Year | Course rows with subtle structural underlays and Unit sequence | Browser verifies all Courses and one underlay per Course at Unit resolution | **GREEN** |
| Workspace | All visible and accessible language says Workspace | Capture-before-Course, holding, placement, return, and undo retain existing contracts; no visible “Fridge” in browser | **GREEN** |
| Live identity | Course, Section, Unit, Lesson, phase, and class elapsed context | Identity and immutable `startedAt` survive Plan View and refresh; outcome remains Section-only | **GREEN++** |
| Classroom timer | Production normal ring, editable duration, 5/10/15 presets, Start/Pause/Resume/Reset | Independent deterministic origin; running and paused states survive Plan View and refresh; completion settles explicitly | **GREEN++** |
| Cleanup | Production cleanup ring/accent, distance-readable Student mode | Separate countdown supports start, pause, resume, cancel, completion, Plan View persistence, and never ends class | **GREEN++** |
| People picker | Section-labeled production people surface and live result | Empty state, normalized names, duplicate prevention, keyboard operation, live announcement, persistence, deliberate projection, no planning mutation | **GREEN** |
| Pass tools | Production available/active plates with requested/active/inactive state | Section-scoped, keyboard-native, persistent through Plan View, private on Student Surface, cleared with End Class | **GREEN** |
| Artwork/image media | Real media apparatus with intentional empty and active states | Safe source schemes, selection, Plan View restore, deliberate Student projection, teacher-only edit controls | **GREEN** |
| Presentation/slide media | Same apparatus supports a `slides` item and isolated iframe | State and render path are contract/type/build covered, but no real external deck was exercised end-to-end | **YELLOW** |
| Projected Student Surface | Distinct quiet surface, normal/cleanup timer rings, media and optional picked student | No private pass data, no hidden keyboard-reachable controls, only one visible Exit projection action, 390px reflow | **GREEN** |
| End Class | Explicit outcome dialog | Complete/stop-with-required-note/never-started-skip; clears live tools only after confirmation | **GREEN++** |

## Classroom timer truth

- `startedAt` remains immutable metadata for elapsed class duration.
- `timer` owns independent duration, remaining seconds, status, and deterministic running origin.
- `cleanupTimer` is a second countdown with independent status and duration.
- Countdown states are `idle`, `running`, `paused`, and `completed`; cleanup is an explicit instructional mode derived from the cleanup countdown rather than a cosmetic boolean.
- Live state schema is version 2. Stored version-1 sessions migrate forward, including an active legacy cleanup state.

## People, pass, and media privacy

- People, passes, and media each carry the active `sectionId`.
- People selection and all pass details remain teacher-only unless a teacher explicitly projects the selected person.
- The Student Surface never renders pass labels or states.
- Only the active media item is shown, and only after the teacher enables projection.
- Live tools are proven not to modify canonical planning workspace data.
- End Class removes the live-session boundary, resolving transient people/pass/media state without inventing durable student records.

## ARC ASSETS 910 function audit

The archive subset contained 317 production files, 21 manifest files, and 192 font files. `AUDIT_STATUS.txt` calls the asset library GREEN++ but does not call the product GOLD. `PLACEMENT.md` and `GOLD-AUDIT.md` governed identity placement. No audit/gold label is exposed in product UI.

### Wired because behavior exists

- Arc mark, planner/note paper, Instrument Serif, League Spartan
- ArcTable compact light/dark headers
- board panel, progress rail, timer well, normal timer ring, cleanup timer ring
- cleanup corner accent, people surface, pass available/active plates, media apparatus frame

### Represented functionally without redundant image layers

- progress markers: semantic progress rail and CSS fill
- clock plate: readable live system clock and separate class duration
- student display surface: dedicated Student component/surface
- tools/people/pass tabs and teacher sidebar: semantic native controls and responsive sidebar

### Deliberately not wired because behavior is outside this pass

- Now/Next tabs, resource QR frame, hold/reconnecting plates
- blackout/pause surface
- group marker, groups folder, unit magnet, activity chip
- notes and resources folders
- decorative accents and separator variants already covered by the authored surface system

These remain honest YELLOW inventory items rather than controls that pretend to work.

## Design and accessibility audit

- Approved Figma file `guts` (`CfWcuQPY4ljYXondICj2ZX`), page `Arc Multi-Prep Synthesis` (`6:46`), was reviewed against Day, Week/Workspace, plan-while-live, Teacher Monitor, and Student Surface frames.
- Manual image review confirmed authored tactile/editorial character, central working space, variable emphasis, production identity placement, and distinct teacher/student hierarchy.
- The required 12ui target comparison was attempted after installing the pinned CLI, but platform review blocked repository/reference upload to the external service because that egress was not explicitly authorized. No workaround was attempted. Local visual review and browser evidence continued independently.
- Native buttons/inputs/selects provide keyboard operation and accessible names. Picker results use a polite live region.
- Focus visibility is browser-verified. ArcTable motion is suppressed under `prefers-reduced-motion: reduce`.
- Planner shell tests cover 200%/400% zoom and 320/390px widths. ArcTable additionally covers Teacher and Student reflow at 390px.
- A verified Student overflow at 390px was fixed in this pass.

## Verification

Verified before functional changes:

- `npm run test:contracts`
- `npm run typecheck`
- `npm run build:bundle`
- `node tests/arctable-continuity.smoke.mjs`
- `git diff --check`

The four legacy phase-browser commands were dispatched during the initial baseline, but their completion output was not captured. The final verification sweep later exposed stale header-action selectors in all four. They were migrated to the current Settings workflow and then passed individually and in the final suite; they are not claimed as pre-change passes.

Passing after functional changes:

- `npm run build` — 41 contract groups, type-check, production bundle
- `node tests/arctable-continuity.smoke.mjs`
- `node tests/browser-a11y.smoke.mjs`
- `node tests/phase2-planning-truth.mjs`
- existing keyboard parity, Section divergence, recovery/undo, and calendar-edge planning gates
- `git diff --check`

Six obsolete browser tests were updated to current product law:

- visible navigation is Day / Week / Month / Year; Semester and Quarter remain internal boundary concepts
- calendar, Course/Section, Unit, and Lesson setup lives in Settings furniture instead of permanent header actions

## Fresh evidence

- `evidence/01-day-multiprep.png`
- `evidence/02-week-workspace.png`
- `evidence/03-month-continuity.png`
- `evidence/03-year-horizon.png`
- `evidence/04-plan-while-live.png`
- `evidence/05-teacher-monitor.png`
- `evidence/06-student-surface.png`
- `evidence/07-timer-running.png`
- `evidence/08-people-picker.png`
- `evidence/09-pass-tools.png`
- `evidence/10-media.png`
- `evidence/11-cleanup-teacher.png`
- `evidence/12-cleanup-student.png`

## Guardrails honored

- Existing `fridge*` internal compatibility seams remain intact.
- Existing validated Easel donor code remains intact.
- `main` and `design/v1-current-laws-reconciliation` were not modified.
- No merge, deployment, or Vercel configuration change was performed.
