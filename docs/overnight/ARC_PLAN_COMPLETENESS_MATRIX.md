# Arc Plan Completeness Matrix

Date: 2026-09-13
Branch: `codex/arc-multiprep-arctable-integration`
Starting HEAD: `705732670b5c4d240759d52adaaa5ab6c65c950c`

Status law: **GREEN++** is hostile continuity/recovery proof; **GREEN** is implemented and appropriately verified; **YELLOW** is constrained or incompletely proven; **RED** is missing/broken; **OBSOLETE** is superseded law.

| Teacher action | Expected product behavior | Current implementation | Verification source | Known defect | Status | Action required |
|---|---|---|---|---|---|---|
| Capture | Save an idea before Course/date decisions; persist immediately | Dedicated `arc.captures.v1` Workspace state; Enter/Save; stable ID | `captureWorkspace.contract.ts`; `arc-plan-continuity.smoke.mjs`; evidence 07 | Capture is intentionally text-first, not a resource uploader | GREEN++ | Keep scope lightweight |
| Workspace holding | Hold captures, unscheduled Lessons/Units, and returned Lessons | Contextual Workspace surface separates Captures, Lessons, Units; calendar round trip preserves Lesson ID/content | browser continuity evidence 06, 15, 16; Fridge compatibility contract | Ordering is chronological/list order only | GREEN | Product decision only if teachers need manual ordering |
| Course organization | Define reusable Course plan once | Course setup and validation | course contracts; exact fixture | No archive/prior-year Course workflow | GREEN | Address with reuse architecture, not duplicate planner |
| Section organization | Multiple Sections point to a Course | Six Sections across three Courses in exact fixture | planning/domain contracts; evidence 01–05 | Bell times are not modeled | GREEN | Bell-schedule setup is YELLOW below |
| Unit organization | Create/place Units per Course | Unit setup, protected relationships, Year/Month projections | unit/object-action contracts; evidence 04–05 | No direct Year drag/move | GREEN | Keep edit in governed Unit setup |
| Lesson creation | Create a canonical reusable Lesson | Lesson library and Capture promotion | lesson contracts; capture browser flow | Direct creation still requires an existing Unit by design | GREEN | Capture covers pre-classification entry |
| Lesson editing | Edit title, order, date, content, resources, and Section delivery | Lesson setup preserves IDs/history | Lesson/ArcTable contracts | Editor is a Settings surface rather than in-place inspection | GREEN | Design follow-up only |
| Scheduling | Place a Lesson on confirmed instructional date inside Unit | Date validation plus Workspace placement | object-action/capture contracts; evidence 08 | No direct Month drag scheduling | GREEN | Do not add drag without interaction law |
| Moving | Change date without changing identity/content/history | `moveLesson` and Lesson editor | object-action contract; browser evidence 09–10 | Only shared Lesson move is directly exposed; Section move is via Shift | GREEN++ | None |
| Shifting | Preview and apply Section-specific recovery changes | Recovery preview/draft/apply, fixed-anchor protection, explicit Apply | recovery and shift contracts; phase2 browser suites; evidence 11–14 | General arbitrary sequence Shift is not a standalone planner action | GREEN | Keep broader Shift YELLOW until interaction law exists |
| Copying | New identity; independent mutable content; no history collision | Copy creates an unscheduled Lesson with cloned content/resource IDs | object-action hostile contract | Cross-Course copy is intentionally unsupported | GREEN | None |
| Unplacing | Remove date, retain Lesson/Unit/content/history | Workspace round trip clears Section overrides with consequence reporting | object/fridge contracts; evidence 15 | Undo is single-level and session-local | GREEN++ | Broader undo policy remains YELLOW |
| Deleting | Guard dependencies/history; remove only selected object | Unit/Lesson deletion guards; Task delete | object/task contracts | Capture delete is immediate and has no confirm/undo | YELLOW | Add recoverable Capture delete if product law requires it |
| Crossing out | Distinct from deletion and completion | No governed Lesson cross-out state/control exists | repository search; Lesson editor inspection | Repro: open Lesson library → select Lesson → no Cross out action | RED | Define whether this is Section skip, canonical cancellation, or presentation-only before implementation |
| Marking Important | Mark supported object without implying fixed date | Task Bar Notes support Important | task contracts and Task Bar browser coverage | Lessons/calendar Notes cannot be marked from UI | YELLOW | Extend only after object-scope law is explicit |
| Undo | Restore prior domain truth and IDs | Shift Undo and last Workspace round-trip Undo are exact/persistent where designed | shift/fridge contracts; evidence 14,16 | No general multi-action undo stack for edits/copy/tasks/captures | YELLOW | Decide undo breadth/retention before expanding |
| Recovery | Hold in-progress Section, preview consequences, protect fixed anchors | Section-specific in-progress state, required resume note, preview/apply/undo | recovery contract group; phase2 recovery browser; evidence 11–14,18 | General disruption preview outside incomplete teaching is not exposed | GREEN++ | None for governed recovery path |
| Shared planning | One Course Lesson sequence serves repeated Sections | Course-level Lessons; per-Section delivery/overrides | projection contracts; exact fixture | None observed | GREEN++ | Preserve |
| Section divergence | One Section can move without Course duplication | Section date overrides and delivery state | divergence browser/contracts; evidence 13 | Month shows only compact signals by design | GREEN++ | Preserve exception model |
| Section reconciliation | Returning to canonical date removes ghost override | Applying canonical date removes override; Shift Undo/rejoin covered | shift/section contracts; evidence 14 | No dedicated “Rejoin course” button | GREEN | Consider label only if teacher testing shows need |
| Fixed dates | Fixed Lessons never move in Shift; conflict is surfaced | `datePolicy: fixed`, validators and preview anchor | hostile shift/recovery contracts; evidence 17 | Important and fixed remain separate | GREEN++ | Preserve distinction |
| No-school days | Scheduling/Shift skip or reject non-instructional days | Hydrated calendar truth drives validation and recovery destinations | calendar-edge and shift contracts | None observed | GREEN++ | Preserve |
| Planning periods | P5 reads as teacher time and pulls across Courses | Clickable Period 5 lens: unfinished, next, loose Lessons | Arc Plan browser gate; evidence 02 | Relies on numeric gap inference; no bell-schedule model | GREEN | Add explicit planning-period setup with bell schedule |
| Notes | Create/delete visible teacher Notes at useful depth | Date-scoped Notes project in Day/Week/Month and persist through the canonical planning store | contracts; browser evidence 01, 03, 04 | Existing Notes cannot yet be edited in place | YELLOW | Add in-place edit without creating a parallel Note model |
| Tasks | Must/Should/Could add/edit/move/Important/complete/delete | Note-backed Task Bar furniture | task contracts; a11y/keyboard browsers | No date placement (task law keeps them unscheduled) | GREEN | Keep from becoming project-management UI |
| Day view | Answer what is taught today in period order | Period rail, Section focus, fixed/in-progress cues, P5 lens, date Notes | exact fixture; evidence 01–02,18 | No defect observed in tested fixture | GREEN | Preserve |
| Week view | Read sequence, gaps, drift, fixed dates, selected-day emphasis | Unequal selected-day column; Course/Section rows; accessible Day deep links | projection/browser suites; evidence 03,13–14 | Direct Lesson move is via editor, not inline | GREEN | Preserve non-equal columns |
| Month view | Curriculum direction and constraints without mini-Week cards | Monday-first calendar, Unit bands, compact Lesson/fixed/drift signals, date Notes | month contracts/browser; evidence 04,17 | High-volume visual approval remains incomplete | GREEN | Preserve hierarchy; complete human visual review |
| Year view | Show three Course/Unit shapes, not KPI/Gantt | Course lanes, Unit sequence, Month deep links | exact fixture; evidence 05,19 | Quarter/semester remain metadata only by product law | GREEN | Preserve |
| Workspace | Capture/organize/place/unplace without becoming junk drawer | Purpose-separated contextual surface and stable conversions; no Fridge appearance | browser gate and screenshots 06–08,15–16 | No manual ordering/filtering | GREEN | Observe beta use before adding organization |
| Setup | Progressive calendar, terms, Courses/Sections, Units, Lessons in Settings | Existing progressive setup works with partially configured state | setup/browser/contracts | Teacher name, role, explicit planning period and bell schedule absent | YELLOW | Next governed production lane |
| Persistence | Durable canonical calendar/planning/unit/lesson/shift/capture/task state | Versioned localStorage envelopes and validation | persistence contracts; full browser reload flow | Local-only; no cross-device sync | GREEN | Sync is future architecture, not this pass |
| Refresh recovery | Restore valid state; reject malformed noncritical state safely | Validators fail closed; date context now restored | hostile contracts; browser reload | Capture invalid envelope is dropped with notice, not item-level repaired | GREEN | Item-level repair only with explicit policy |
| Cross-view continuity | Preserve date/Course/Unit context while changing depth | Persisted anchor; Year→Month; Month/Week→Day | navigation-context contract; evidence 19 | Browser history does not encode each view transition | GREEN | URL/history model is YELLOW product decision |
| Multi-prep continuity | Three preps/six Sections stay distinguishable | Exact P1/P2/P3/P4/P6/P7 fixture across all views | browser gate; evidence 01–05 | None observed in tested four-week fixture | GREEN++ | Preserve |
| Reuse | Reuse a Lesson/Unit without marketplace/library sprawl | Lesson Copy is safe and unscheduled; Units can be edited/recreated | copy hostile contract | Prior-year Unit/Course import/reuse not implemented | YELLOW | Define prior-year ownership/migration |
| Import | Bring governed external structure in safely | Official calendar source proposal/review exists | source acquisition contracts/browser suites | No CSV Course/Unit/Lesson importer or re-import dedupe | YELLOW | Separate curriculum-import product lane |
| Accessibility | Semantic controls, focus states, keyboard, zoom/reduced-motion | New deep links are buttons; contextual tools restore focus on Escape; existing a11y suite | a11y + keyboard suites; browser gate | Full 400% manual visual approval not claimed | GREEN | Complete manual assistive-tech pass before launch |
| Responsive behavior | Usable at narrow widths/zoom without clipped utilities | Contextual surface is viewport-contained; existing 390/320 CSS paths | current-shell browser gates; a11y/narrow suites; evidence | Dense Week/Year use horizontal scrolling | YELLOW | Manual 320/390 and 400% acceptance pass |
| Keyboard behavior | All core actions reachable with visible focus | Buttons/inputs/comboboxes; Enter capture; Escape contextual tools | keyboard parity and a11y suites | Drag parity is irrelevant because planner has no drag law | GREEN | Preserve |
| ArcTable independence | Complete free planning loop without opening paid live layer | Dedicated free-only browser path covers views, tasks, Workspace, mutations | `arc-plan-continuity.smoke.mjs`; evidence 20 | “Start class” remains an optional visible entry point | GREEN++ | Keep ArcTable optional; no functional dependency found |

## ArcTable-only dependency findings

- Arc Plan’s canonical Lesson content, dates, Units, Sections, delivery outcomes, Workspace, Tasks, and view navigation operate without entering ArcTable.
- “Start class” / “Resume in ArcTable” are the only ArcTable calls to action in Arc Plan. They are optional and do not block planning.
- Live timer, people, passes, cleanup, and selected media intentionally remain ArcTable-only; none is required to answer the Arc Plan product questions.
- The prior false dependency was Workspace Capture: it claimed Course-free capture but opened the Unit-bound Lesson editor. This pass replaced it with an independent Capture boundary and identity-preserving promotion.

## Visual authority correction

- Current Figma file `guts`, frame `Arc Workspace — Wednesday 10:55 AM` (`1:2139`) is the interaction/composition authority used for the corrected shell.
- Current Arc/ArcTable production assets and typography remain the material authority.
- Governance and contracts remain behavioral authority; V1/V2/Master are behavioral donors only.
- The journal gutter/spine, bounded notebook page, visible Fridge treatment, permanent edge furniture, and bottom task tab were removed.
- Settings, Workspace, and Tasks now use a quiet utility rail with one viewport-contained contextual surface at a time. Internal `b01`/`fridge` compatibility names remain intentionally unchanged.

## Design follow-up (not functional defects)

- Week and Year are dense at 320–390px and rely on deliberate horizontal scrolling.
- The contextual utility surface is deliberately layered over the working territory; manual zoom review should decide whether extreme zoom should switch it to a full-screen sheet.
- Lesson setup is information-dense and still reads more like a configuration workspace than an editorial Lesson inspector.
- Month’s compact signals are functionally coherent but need human visual approval for high-volume real calendars.
