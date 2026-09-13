# Arc Multi-Prep + ArcTable production report

Date: 2026-09-13

Branch: `codex/arc-multiprep-arctable-integration`

Design base: `f543ff25f86277809d68daeda5bb2a7bbe34a17f` (`design/v1-current-laws-reconciliation`)

Jury-fix starting HEAD: `a5f2969b1ce1e1446a15e566baea20e025f4d481`

Final branch HEAD: the report-bearing protected-branch commit; the exact SHA is recorded in the post-push terminal summary because a commit cannot contain its own SHA.

Overall status: **GREEN** — canonical Lesson content now feeds ArcTable, classroom tools are hardened, Google Slides is proven with one real public deck, and the Teacher Monitor composition is corrected without replacing continuity plumbing. Unsupported slide providers and the unavailable external 12ui comparison remain explicit YELLOW items.

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
  │    ├─ arcTableLiveState + arcTableTools
  │    └─ Arc-owned Section roster/pass configuration
  ├─ ArcTableTeacherMonitor
  │    └─ live timer / cleanup / people / passes / media
  └─ ArcTableStudentSurface
       └─ deliberately projected public state only

arcTableSession ──────────→ easelSessionProjection (validated donor)
canonical Lesson content ─→ planning/day projection ─→ ArcTable session
arcTableTeachingOutcome ──→ easelTeachingOutcome (validated donor)
```

The validated Easel seam remains the donor boundary. Its session projection was minimally extended to carry canonical Lesson content; teaching-outcome behavior remains untouched:

- `src/planning/easelSessionProjection.ts`
- `src/planning/easelTeachingOutcome.ts`
- their projection, outcome, and hostile core-loop contracts

No legacy roster, pass-state, or media subsystem existed. A lightweight Arc-owned Section configuration now persists only names and pass definitions; active selections, pass ownership/status, timers, cleanup, and media projection remain transient live state. This is not an SIS or a second Lesson model.

## Lesson-content boundary

Before this jury pass, ArcTable received Lesson/Course/Unit/Section identity, dates, delivery status, and the Section-specific resume note. ArcTable then invented three generic directions, `Lesson materials`, and a four-phase count.

The canonical `Lesson` now adds four deliberately small, backward-compatible fields:

- `directions: string[]`
- `materials: string[]`
- `phases: string[]`
- `resources: { id, title, kind, source }[]`

Old stored Lessons hydrate those optional-at-storage fields to empty arrays. The fields flow through planning projection, Day continuity, the retained Easel donor seam, `arcTableSession`, and live-state creation. Empty Lessons remain usable and render honest empty states; generic teaching copy is no longer fabricated. Live edits remain transient and never write back automatically. Only the existing explicit End Class outcome updates Section delivery truth.

## Brutally accurate state table

| State / capability | Visual presence | Verified functionality | Status |
|---|---|---|---|
| Day | Six-period teaching rail plus explicit Period 5 planning time and one focused teaching moment | Browser verifies Periods 1/2/3/4/6/7, Period 5 gap, focus, and P4 launch | **GREEN** |
| Week | Selected day is materially wider; surrounding days remain readable | Browser measures unequal columns and verifies Section drift/fixed work remains visible | **GREEN** |
| Month | Compact Unit bands, Lesson signals, Fixed labels, drift labels, and real gaps | Browser verifies Unit continuity, a fixed assessment, Period 6 drift, and no full-card expansion | **GREEN** |
| Year | Course rows with subtle structural underlays and Unit sequence | Browser verifies all Courses and one underlay per Course at Unit resolution | **GREEN** |
| Workspace | All visible and accessible language says Workspace | Capture-before-Course, holding, placement, return, and undo retain existing contracts; no visible “Fridge” in browser | **GREEN** |
| Live identity | Course, Section, Unit, Lesson, phase, and class elapsed context | Identity and immutable `startedAt` survive Plan View and refresh; outcome remains Section-only | **GREEN++** |
| Lesson content integration | Authored directions, materials, phases, and references dominate the teaching field | Domain projection and browser prove canonical content on Teacher and Student surfaces; live tools do not mutate source Lesson content | **GREEN++** |
| Classroom timer | Production normal ring, editable duration, 5/10/15 presets, Start/Pause/Resume/Reset | One shared 120-minute maximum; maximum and above-limit browser coverage; independent origin; Plan View/refresh continuity | **GREEN++** |
| Cleanup | Production cleanup ring/accent, distance-readable Student mode | Separate countdown supports start, pause, resume, cancel, completion, Plan View persistence, and never ends class | **GREEN++** |
| People state engine | Explicit Random and Round-robin modes, live result, opt-in projection | Empty/duplicate handling, keyboard operation, live announcement, impossible selected ID repair | **GREEN++** |
| Reusable Section roster | Lightweight name-only roster edited from ArcTable | Persists across separate sessions of the same Section; another Section remains isolated; selection stays transient | **GREEN** |
| Pass state engine | Configurable pass definitions and requested/active/inactive state | Unique IDs, optional person association, request ownership, Plan View continuity, End Class clearing, Student privacy | **GREEN++** |
| Classroom pass workflow | Defaults plus teacher-defined types without SIS/history scope | Browser proves request → active → returned and Section isolation | **GREEN** |
| Artwork/image media | Real media apparatus with intentional empty and active states | Safe source schemes, selection, Plan View restore, deliberate Student projection, teacher-only edit controls | **GREEN** |
| Google Slides media | Edit/present/pub URLs normalize to a sandboxed view-only embed | Real public deck renders on Teacher Monitor and Student Surface and survives Plan View | **GREEN** |
| Other slide providers | Rejected with a visible error instead of a broken frame | No provider beyond Google Slides is claimed interoperable | **YELLOW** |
| Projected Student Surface | Distinct quiet surface, normal/cleanup timer rings, media and optional picked student | No class elapsed, pass data, editor controls, or visible/hidden exit button; Escape returns teacher; 390px reflow | **GREEN++** |
| End Class | Explicit outcome dialog | Complete/stop-with-required-note/never-started-skip; clears live tools only after confirmation | **GREEN++** |
| Visual composition | Teaching field exceeds 70% width; compact utility rail; tools layer only when open | Browser asserts no permanent tool panels and no equal-weight rounded-card stack; fresh captures manually reviewed | **GREEN** |

## Classroom timer truth

- `startedAt` remains immutable metadata for elapsed class duration.
- `timer` owns independent duration, remaining seconds, status, and deterministic running origin.
- `cleanupTimer` is a second countdown with independent status and duration.
- Countdown states are `idle`, `running`, `paused`, and `completed`; cleanup is an explicit instructional mode derived from the cleanup countdown rather than a cosmetic boolean.
- Live state schema is version 2. Stored version-1 sessions migrate forward, including an active legacy cleanup state.
- Version-2 hostile persistence repairs duplicate IDs, impossible selected/active references, bad pass ownership, excessive remaining time, and invalid run origins without crashing the planner.

## People, pass, and media privacy

- People, passes, and media each carry the active `sectionId`; reusable roster/pass definitions use a separate Arc-owned Section key.
- People selection and all pass details remain teacher-only unless a teacher explicitly projects the selected person.
- The Student Surface never renders pass labels or states.
- Only the active media item is shown, and only after the teacher enables projection.
- Live tools are proven not to modify canonical Lesson source content.
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
- Manual image review confirmed the approved editorial hierarchy: the teaching field dominates, utilities form a quiet rail, open tools layer into the workspace, production assets retain functional meaning, and Student Surface stays presentation-first.
- The required 12ui target comparison was attempted again with the pinned CLI after this jury correction. Platform review blocked repository/reference upload because destination-specific data egress was not explicitly authorized. No workaround was attempted. This external comparison remains **YELLOW**; local side-by-side review and browser geometry assertions passed.
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

Passing after the jury fix:

- `npm run build` — 42 contract groups, type-check, production bundle
- `node tests/arctable-continuity.smoke.mjs`
- `node tests/browser-a11y.smoke.mjs`
- `node tests/phase2-planning-truth.mjs`
- existing keyboard parity, Section divergence, recovery/undo, and calendar-edge planning gates
- canonical Lesson-content, Section roster, pass-person, timer-limit, malformed-state, Student privacy, and real Google Slides checks inside the updated contract/browser suites
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
- `evidence/10b-google-slides.png`
- `evidence/11-cleanup-teacher.png`
- `evidence/12-cleanup-student.png`

## Guardrails honored

- Existing `fridge*` internal compatibility seams remain intact.
- Existing Easel outcome behavior and compatibility seam remain intact; only the session projection payload gained canonical Lesson content.
- `main` and `design/v1-current-laws-reconciliation` were not modified.
- No merge, deployment, or Vercel configuration change was performed.

## Jury-pass changed-file summary

- Canonical Lesson and projection: `lessons.ts`, `lessonWorkspace.contract.ts`, `planningProjection.ts`, `dayContinuityProjection.ts`, `easelSessionProjection.ts` and its contract, `LessonSetup.tsx`, `lessonSetup.css`.
- Live state/tools: `arcTableLiveState.ts` and contract, `arcTableTools.ts` and contract, new `arcTableSectionConfig.ts` and contract, `useArcTableSession.ts`, planning exports.
- Surfaces/visuals: `ArcTableSurfaces.tsx`, `arctable.css`.
- End-to-end verification/evidence: `arctable-continuity.smoke.mjs`, contract runner, and refreshed evidence images.

## Jury-pass commits

- `2144af2 feat(lessons): project canonical teaching content`
- `7b91dad feat(arctable): harden classroom tools and projection`
- documentation/evidence commit containing this report (exact final SHA reported after push)

## Remaining YELLOW items

- Slide providers other than Google Slides are intentionally unsupported and rejected.
- The external 12ui target-comparison service could not be used without explicit authorization to upload the repository/reference payload; local visual acceptance was completed.

Known RED bugs: none observed in the completed verification suite.
