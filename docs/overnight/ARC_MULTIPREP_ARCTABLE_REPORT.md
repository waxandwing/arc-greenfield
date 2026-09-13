# Arc Multi-Prep + ArcTable integration report

Date: 2026-09-12  
Branch: `codex/arc-multiprep-arctable-integration`  
Starting/base HEAD: `f543ff25f86277809d68daeda5bb2a7bbe34a17f` (`design/v1-current-laws-reconciliation`)  
Overall status: **YELLOW** — the requested core continuity path is implemented and tested; Month remains intentionally conservative, and two historical browser scripts encode superseded navigation/action placement.

## What shipped

- Day is now a true teaching-day lens: a six-period multi-prep rail preserves the full day while one period is the clear working focus. The focused Lesson has the explicit `Start class` / `Resume in ArcTable` transition.
- Week gives the selected instructional day materially more width while keeping the surrounding week readable.
- Month remains a compact pacing and continuity lens. Unit spans sit above Lesson signals; it does not expand into full Lesson cards.
- Year is organized as `Course → Unit sequence`. Each Course retains a distinct, subtle structural underlay and shared-plan Section count.
- The visible “Fridge” metaphor is retired. The same reversible holding-place behavior is preserved as **Workspace**, including loose Lessons/Units, move-to-date, return-to-Workspace, undo, and capture-before-Course-placement.
- ArcTable now has a dedicated public session/outcome boundary, durable live-session storage, a Teacher Monitor, and a distinct projected Student Surface.
- A teacher can move `live → Plan View → live` without changing Lesson identity, Section identity, timer origin, phase, materials, voice expectation, cleanup state, or board lock.
- `End Class` is deliberately different from opening Plan View. It records only the active Section outcome: complete, stop with a required resume note, or skip only while the launch still represents a never-started class.
- Calendar setup error focus was repaired so the rendered error summary receives focus reliably.

## Evidence sources used

### Figma

File `guts` (`CfWcuQPY4ljYXondICj2ZX`), page **Arc Multi-Prep Synthesis** (`6:46`) was inspected frame-by-frame:

- `7:46` — State 1 / My Teaching Day
- `8:46` — State 2 / Working Inside a Class
- `8:105` — State 3 / Planning a Course
- `8:183` — State 4 / Longer Horizon Across Preps
- `8:243` — State 5 / Plan in Motion
- `12:46` — Product Architecture
- `12:60` — Plan View / Week + Workspace
- `12:155` — Live Monitor / ArcTable
- `12:199` — Plan View while P4 stays Live
- `14:49` — ArcTable Teacher Monitor
- `15:46` — ArcTable Projected Student View

The implementation follows the hierarchy and interaction laws in those frames, not a pixel-for-pixel reconstruction of a single static canvas.

### ARC ASSETS 910

The archive was inventoried before use. The production/manifests/fonts subset contained 317 production files, 21 manifest files, and 192 font files. `manifests/AUDIT_STATUS.txt` reports the asset library as GREEN++ but the broader product as not yet GOLD. `production/logos/arctable/PLACEMENT.md` and `GOLD-AUDIT.md` were used to select approved placements.

Integrated production assets:

- Arc mark, planner paper, and note paper
- Instrument Serif and League Spartan
- ArcTable compact light/dark headers
- ArcTable breeze-block tile, board panel, timer well, progress rail, normal/cleanup timer rings, cream paper, and green texture

No “gold” badge or audit language is exposed in the product UI.

## State-by-state status

| State | Status | Evidence / note |
|---|---|---|
| Day | **GREEN** | Six-period rail plus one focused teaching moment; repeated preps remain visible and each period can become current. |
| Week | **GREEN** | Selected day is wider than surrounding days; multi-prep context and Workspace remain available. |
| Month | **YELLOW** | Correct compact Unit/Lesson continuity and no oversized Lesson cards. Dense months are deliberately information-heavy and pre-school-year cells retain explicit unknown status. |
| Year | **GREEN** | All Courses shown at Unit resolution with distinct structural underlays and readable Unit sequences. |
| Workspace | **GREEN** | Visible metaphor and copy replaced; capture, unscheduled holding, placement, return, and undo survive. Internal legacy identifiers remain temporarily to preserve persisted contracts. |
| ArcTable Teacher Monitor | **GREEN** | Course/Section/Lesson context, phase progress, live timer, materials, voice, board lock, student preview, people/pass tools, cleanup, Plan View, and explicit End Class. |
| Projected Student Surface | **GREEN** | Quiet full-screen prompt with directions, timer, materials, phase, voice, and cleanup; teacher controls are absent. |
| Live → Plan → Live | **GREEN** | Browser gate proves stable `startedAt`, Lesson id, Section id, and phase across the round trip. |

## Verification

Passing:

- `npm run test:contracts` — 40/40 contract groups, including ArcTable persistence and all existing calendar/planning/recovery contracts
- `npm run typecheck`
- `npm run build:bundle`
- `node tests/arctable-continuity.smoke.mjs`
- `node tests/phase2-nondrag-keyboard-parity.mjs`
- `node tests/phase2-object-actions-section-divergence.mjs`
- `node tests/phase2-recovery-undo-continuity.mjs`
- `node tests/phase2-calendar-edge-planning-truth.mjs`
- `git diff --check`

Historical test mismatches, documented rather than masked:

- `tests/browser-a11y.smoke.mjs` reaches the repaired setup-error focus check, then expects all six internal calendar horizons to be visible. Current navigation law exposes only Day, Week, Month, and Year.
- `tests/phase2-planning-truth.mjs` expects a visible `Set classes` header action. Current product architecture places that action in Settings furniture.

The new smoke gate covers the requested multi-prep seed (AP Art History, 2D Art 1, 3D Art 1 across Periods 1/2/3/4/6/7), Day/Week/Month/Year, Workspace, P4 ArcTable launch, teacher controls, the distinct Student Surface, live-plan-live continuity, and a Section-scoped teaching outcome.

## Screenshot evidence

- `evidence/01-day-multiprep.png`
- `evidence/02-week-workspace.png`
- `evidence/03-month-continuity.png`
- `evidence/03-year-horizon.png`
- `evidence/04-plan-while-live.png`
- `evidence/05-teacher-monitor.png`
- `evidence/06-student-surface.png`

## Architecture and debt notes

- There is still one canonical planner. ArcTable projects a temporary live-teaching session from current Day continuity and writes back through the existing Lesson delivery-state model.
- The existing Easel implementation remains the validated donor underneath ArcTable-named adapter modules. This keeps old contracts intact while presenting one new public product boundary; deleting the donor is follow-up cleanup, not a prerequisite for the feature.
- Existing `fridge*` function names, storage contracts, CSS hooks, and test IDs remain internal compatibility seams. Visible product language and accessible labels use Workspace.
- Month density and the two historical browser expectations are the remaining explicit YELLOW items. No deploy, Vercel mutation, merge, or main-branch edit was performed.
