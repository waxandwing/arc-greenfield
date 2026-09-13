# Arc Plan Free Product Continuity Report

Date: 2026-09-13
Branch: `codex/arc-multiprep-arctable-integration`
Starting HEAD: `705732670b5c4d240759d52adaaa5ab6c65c950c`
Final pushed HEAD: reported in the final push transcript because a tracked file cannot contain the SHA of the commit that contains itself.

## Decision

Arc Plan is usable as an independent multi-prep planner across the tested four-week scenario. The pass fixed true Course-free Capture with stable identity, durable temporal context across refresh/deep navigation, a useful P5 planning-period lens, calendar Note projection/authoring, and safe Lesson Copy. The shared shell was then corrected against the current Figma authority: edge-to-edge working territory replaced the notebook spine/page shell and the visible Fridge/legacy furniture was replaced by quiet contextual utilities. ArcTable was exercised only as a compatibility regression; no ArcTable feature work was added.

The free product is not fully feature-complete. Calendar Notes can be created and deleted but not edited in place, general undo is narrower than the assignment’s ideal, and curriculum CSV/prior-year reuse remain incomplete. Those are explicit YELLOW items, not hidden follow-up. Lesson Cross out remains the explicit RED item because its canonical meaning is unresolved.

## Planning architecture and free-product boundary

- One canonical chain remains: school calendar → Courses/Sections → Units → Lessons → Section delivery/overrides → Day/Week/Month/Year projections.
- Workspace Capture is independent while unclassified. Promotion removes the Capture and creates one Lesson with the same ID and text; no duplicate planning truth is created.
- Repeated Sections share Course Lessons. Divergence remains a Section override/delivery exception, not a copied Course plan.
- ArcTable consumes canonical Lesson/Section identity but is not entered in the free-product continuity scenario.

## Exact production fixture

- P1/P4 AP Art History; P2/P6 2D Art 1; P3/P7 3D Art 1; P5 Planning.
- Three Courses, six teaching Sections, nine Units, 37 Lessons spanning Sep 2–Oct 6, including a multi-phase two-day teaching plan, fixed assessment, holiday, no-school day, teacher workday, one in-progress P4 Lesson, P6 divergence, one unscheduled Lesson, three seeded Captures, one calendar Note, and Must/Should/Could tasks.
- The same fixture drives all 20 Arc Plan evidence frames and the browser continuity assertions.

## Results by surface and operation

- **Day — GREEN:** correct P1–P7 order, repeated Course Sections, P5, fixed/in-progress context, and date Notes.
- **Planning period — GREEN:** P5 opens a compact cross-Course lens for unfinished teaching, next Lesson, and loose Workspace Lesson work.
- **Week — GREEN:** selected-day emphasis, shared Course rows, Section divergence, fixed state, and keyboard Day deep links.
- **Month — GREEN:** Unit/Lesson/fixed/no-school continuity and date Notes are projected; high-volume human visual approval remains separate.
- **Year — GREEN:** all three Courses and three Units each remain distinct; Unit buttons deepen into Month without a Quarter/Semester screen.
- **Workspace/Capture — GREEN++:** capture-before-classification, immediate persistence, stable ID promotion, calendar round trip, and exact Undo are browser- and contract-proven. Workspace behavior is preserved in a contextual surface without Fridge appearance.
- **Move — GREEN++:** shared Lesson ID/content/history survives move and refresh.
- **Shift/recovery — GREEN++:** explicit preview/apply/cancel boundary, fixed anchors, no-school validation, Section isolation, persistence, and Undo.
- **Copy/reuse — YELLOW:** Lesson copy safely creates an unscheduled independent identity; prior-year Course/Unit reuse is not implemented.
- **Unplace — GREEN++:** Lesson identity/content/Unit association/history survive; Section date overrides are explicitly removed; one-step Undo restores exact placement.
- **Fixed dates — GREEN++:** hostile contracts and browser scenario preserve the assessment through shifts and undo.
- **Section divergence/reconciliation — GREEN++:** shared Course truth remains intact; Section overrides persist and can be removed/undone without ghosts.
- **Incomplete Lesson — GREEN++:** P4 stop point and resume note remain Section-specific; other Sections are unaffected.
- **Import — YELLOW:** official calendar source acquisition/review exists; curriculum CSV import does not.
- **Accessibility — GREEN:** semantic/keyboard suites cover core UI. Automated success is not claimed as human visual approval.
- **Visual shell — GREEN:** current Figma composition authority is reflected in an edge-to-edge planner, slim rails, variable emphasis, and exclusive contextual utilities. Legacy notebook/spine/edge furniture is absent in the captured evidence.
- **Responsive — YELLOW:** governed narrow CSS and current-shell smoke coverage exist; dense Week/Year horizontal scrolling and 400% human acceptance remain design follow-up.
- **ArcTable regression — GREEN:** the multi-prep + ArcTable continuity browser gate passed after the Plan shell correction.

## Unresolved RED

1. **Lesson Cross out.** Reproduce: Settings → Lesson library → select a Lesson. Only Copy, Unplace, and Delete exist. Product law must decide whether Cross out is canonical cancellation, Section skip, or presentation state before implementation.

## Unresolved YELLOW

- **Incomplete implementation:** teacher name/role, explicit bell schedule/planning-period setup, in-place calendar Note editing, broad Important scope, general multi-action undo, curriculum CSV import.
- **Incomplete verification:** human screen-reader review and manual 400% zoom approval.
- **Unresolved product decision:** browser-history/URL depth, Cross out semantics, general Shift entry point, undo retention breadth.
- **Visual/design follow-up:** dense Week/Year at extreme zoom; Lesson editor density; high-volume Month visual approval.
- **Intentionally deferred capability:** prior-year Course/Unit reuse beyond safe Lesson Copy; cloud/cross-device persistence.

## Production decision questions

1. Can a teacher use Arc Plan for four weeks without ArcTable? **Yes, for the tested planning loop; GREEN.**
2. Can a teacher manage three preps? **Yes; GREEN++.**
3. Can repeated Sections share planning without duplication? **Yes; GREEN++.**
4. Can one Section diverge safely? **Yes; GREEN++.**
5. Can a divergent Section rejoin? **Yes through canonical-date override removal/Undo; GREEN.**
6. Can plans move around holidays? **Yes; GREEN++.**
7. Can fixed assessments remain fixed? **Yes; GREEN++.**
8. Can a teacher capture first and organize later? **Yes; GREEN++.**
9. Can scheduled work return to Workspace? **Yes; GREEN++.**
10. Can mistaken scheduling be recovered? **Yes for Shift and Workspace round trip; broader undo is YELLOW.**
11. Does changing views preserve planning truth? **Yes; GREEN. Date context now survives refresh.**
12. Is planning period useful? **Yes in the exact P5 fixture; GREEN.**
13. Does Month provide useful continuity? **Yes for Units/Lessons/constraints/date Notes; GREEN.**
14. Does Year provide useful Course/Unit shape? **Yes; GREEN.**
15. Is Arc Plan understandable without opening ArcTable? **Yes; GREEN++.**
16. Does Arc Plan feel complete rather than crippled? **The core planning loop does; broader recovery/reuse and unresolved Cross out semantics prevent an unqualified GREEN++.**

Three largest functional weaknesses: unresolved Cross out semantics, limited undo breadth, and missing curriculum/prior-year import/reuse. Three largest remaining design weaknesses: extreme-zoom density, Lesson editor density, and Month at high content volume. Cross out is a blocker only if it remains in launch copy. Import/reuse and broader undo can wait until after first public beta if their limitations are stated. The next product-law decision should define **Cross out**, followed by undo breadth and retention.

## Visual authority and correction

- Visual/interaction authority: current Figma `guts`, frame `Arc Workspace — Wednesday 10:55 AM` (`1:2139`).
- Material/style authority: current Arc/ArcTable production assets and approved typography.
- Behavioral authority: current governance/contracts. V1/V2/Master were not used as visual references.
- Retired: journal gutter/spine, bounded book/page shell, visible Fridge treatment, permanent legacy side furniture, bottom task tab, and old planner proportions.
- Preserved: all canonical storage, continuity, Workspace behavior, Task behavior, Settings behavior, and internal compatibility seams.

## Evidence

All evidence is under `docs/overnight/evidence/arc-plan/`:

1. `01-plan-day-multiprep.png`
2. `02-plan-day-planning-period.png`
3. `03-plan-week-selected.png`
4. `04-plan-month-continuity.png`
5. `05-plan-year-courses.png`
6. `06-plan-workspace-populated.png`
7. `07-plan-capture.png`
8. `08-plan-capture-placed.png`
9. `09-plan-move-before.png`
10. `10-plan-move-after.png`
11. `11-plan-shift-preview.png`
12. `12-plan-shift-applied.png`
13. `13-plan-section-divergence.png`
14. `14-plan-section-reconciled.png`
15. `15-plan-unplaced-workspace.png`
16. `16-plan-undo-recovery.png`
17. `17-plan-fixed-date-protection.png`
18. `18-plan-incomplete-lesson.png`
19. `19-plan-cross-view-continuity.png`
20. `20-plan-free-only.png`

## Verification ledger

Observed in the final reconciliation run:

- `git diff --check` — PASS at baseline.
- `npm run test:contracts` — PASS, including Capture, navigation-context, copy, shift, recovery, projection, persistence, and ArcTable contracts.
- `npm run typecheck` — PASS.
- `npm run build` — PASS after the current-shell correction.
- `npm run test:browser-plan` — PASS after the current-shell correction; all 20 evidence files captured.
- `node tests/b01-furniture.smoke.mjs` — PASS; no notebook spine/page shell, dominant working territory, exclusive contextual tools, Escape/focus, and 1280px containment.
- `node tests/b01-furniture-independent.mjs` — PASS; independent fixture, keyboard exclusivity, 44px targets, 1366px containment, and runtime cleanliness.
- `node tests/rgav-shell-independent.mjs` — PASS; Settings-owned preferences, title-based switching, Last used persistence, navigation/home/reload, keyboard skip, overflow, and runtime cleanliness.
- `npm run test:browser-a11y` — PASS; landmarks, 200/400% zoom stress, 320/390 reflow, reduced motion, and runtime cleanliness.
- `node tests/rgav-phase2-independent.mjs` — PASS.
- `node tests/phase2-nondrag-keyboard-parity.mjs` — PASS.
- `node tests/phase2-planning-truth.mjs` — PASS.
- `node tests/phase2-object-actions-section-divergence.mjs` — PASS.
- `node tests/phase2-recovery-undo-continuity.mjs` — PASS.
- `node tests/phase2-calendar-edge-planning-truth.mjs` — PASS.
- `node tests/phase3-source-calendar-review.mjs` — PASS.
- `node tests/arctable-continuity.smoke.mjs` — PASS.

Final command outputs and the exact pushed SHA are reported only after the last code change and push. No merge, deployment, Vercel call, Vercel configuration change, `main` modification, or reconciliation-branch modification occurred.
