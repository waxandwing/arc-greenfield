# Arc

Greenfield rebuild. Calendar-first. Trust-first.

## Authority
- `main` — protected, release-only. It is not the source for active development.
- `develop` — the only integrated pre-release source of truth.
- `feature/week-day-month-consistency-audit` — the only active implementation branch for this milestone.
- `archive/pre-frame-reset-2026-09-02` — preserved rollback point.
- every other branch is historical, abandoned, accidental, or reference-only and must not be used as source for new work, previews, audits, or recovery.

Google Drive canonical Product Spec owns product/architecture decisions. Google Drive canonical Brand System owns visual/construction rules. Git history is implementation history. This README is only the repository operating contract.

Do not add duplicate handoff, audit, blueprint, or design-system documents here.

## Current redevelopment position
The constrained rebuild order is authoritative when it conflicts with the older phase checklist:

frame/shell → navigation → calendar truth → movement/recovery → real planning projection → Day/Easel continuity → integrations → visual polish/secondary systems.

Integrated through `develop` before this audit:
- trustworthy shell and six calendar horizons;
- explicit school-calendar truth, terms, navigation, and local declaration persistence;
- real Course/Section setup;
- Unit and Lesson domain/editing foundations with per-Section delivery state;
- recovery consequence preview;
- explicit Section-scoped Shift Apply, local persistence, reload-safe Undo, and hostile recovery preflight;
- exact same-day collision approval domain only;
- AppFrame decomposition into discoverable app/component boundaries;
- real Week/Day planning projection plus hostile Week/Day clearance;
- real Month planning projection at Month-appropriate density.

This audit proves Week, Day, and Month are different lenses over the same Section-effective planning truth before longer-range horizons are allowed to build on it.

Not yet complete:
- auth and account isolation;
- landing-view preference persistence;
- Quarter/Semester/Year Map planning projection;
- Day as a full teaching-continuity surface;
- Easel continuity;
- Notes, Ideas, Unit Focus, Must/Should/Could, Tack, Extend, filters, Year markers;
- account-backed/Drive persistence and reconciliation;
- browser-driven keyboard/touch/responsive release verification.

The old `feature/same-day-approval-persistence` branch is abandoned/reference-only. Its unintegrated persistence work was intentionally stopped after audit showed it was over-engineering an exception before the primary calendar planning loop was rendered.

## Code ownership map
Keep responsibilities discoverable. New subsystems must enter through the correct boundary rather than accumulating in the shell.

- `src/components/AppFrame.tsx` — composition only.
- `src/app/useArcWorkspace.ts` — canonical workspace state transitions and coordination of validated saves.
- `src/app/workspaceBootstrap.ts` — restore order and initial persistence notices only.
- `src/app/shiftReconciliation.ts` — cross-layer policy for preserving or dropping Shift/Undo state when upstream planning changes.
- `src/app/useWorkspaceMode.ts` — one temporary workspace mode.
- `src/components/WorkspaceStage.tsx` — selects which calendar/editor/recovery surface is rendered.
- `src/components/CalendarStageHeader.tsx` — calendar-stage controls and action entry points only.
- `src/components/CalendarViewRail.tsx` — calendar horizon navigation only.
- `src/components/CalendarProjectionView.tsx` — calendar/date/term rendering and delegation to planning renderers; it does not calculate Section-effective planning state itself.
- `src/components/PlanningWeekDayView.tsx` — Week/Day planning presentation only.
- `src/components/PlanningMonthView.tsx` — Month planning presentation only.
- `src/components/planningDateLabels.ts` — shared planning-view date labels; do not duplicate local Intl date helpers across planning renderers.
- `src/calendar/**` — school-calendar truth and calendar-only projections.
- `src/planning/planningProjection.ts` — canonical range projection of shared Course/Unit/Lesson state plus Section-effective dates and delivery state.
- `src/planning/monthPlanningProjection.ts` — Month-specific aggregation over canonical Month geometry and `planningProjection`; it groups each shared Lesson into one signal with explicit per-Section scope and splits Unit spans only for visual week geometry.
- `src/planning/**` — Course/Section/Unit/Lesson/delivery/recovery/Shift domain rules and persistence boundaries.

Guardrail: a UI composition file should not become a second state store. A controller should not absorb unrelated domains just because it already has access to their state. A calendar view must not reimplement effective Lesson dates, delivery-state defaults, or Unit ownership rules that already exist in the planning domain.

## Week / Day planning rules
- Week defaults to Monday–Friday. Weekend dates remain part of calendar truth and are still reachable through Day; a weekend-display preference can be added later.
- shared Unit spans render once per Course, not once per Section.
- overlapping Units remain distinct and render in separate Unit lanes rather than painting over each other.
- Sections render as separate class rows beneath the shared Course/Unit context.
- Lesson placement uses each Section's effective date, including persisted Shift overrides.
- missing delivery state projects as `not-started`; projection never writes redundant delivery rows.
- fixed/flexible identity and Section-specific Shift identity remain visible.
- in-progress Lessons carry the saved resume note into the planning view.
- if actual taught date differs from the displayed plan/effective date, the tile exposes the actual taught date instead of implying they are the same.
- setup degrades progressively: Classes alone show class rows; placed Units add shared Unit bands; Lessons add dated work. Empty projection layers are render-only and are never persisted as fake user data.
- Day and Week are lenses over the same `projectPlanningRange` rules.
- projection date arrays must be unique and strictly ascending; malformed date geometry fails closed.

## Month planning rules
- Month is for multi-week pacing and continuity, not a miniature Week grid.
- canonical `projectMonth` owns visible calendar week geometry; Month planning never recomputes month boundaries.
- a Unit crossing a Sunday splits into visual week segments while retaining one stable Unit identity.
- Unit pacing is shown above each calendar week; each Unit segment remains a separate lane so overlapping Units cannot paint over one another.
- a shared Lesson becomes one compact signal per date/Course/Lesson identity rather than duplicate cards for each Section.
- every Month Lesson signal carries one explicit Section-scope object per actual Section: ID, display name, Shift ownership, and delivery status stay together. Parallel Section ID/name/status arrays are prohibited.
- distinct Sections may share the same display name without being collapsed.
- duplicate placement of the same Section/Lesson/date fails closed instead of being silently deduplicated.
- Section-specific Shift remains visible on the exact affected Section; unrelated Sections remain on the shared date.
- fixed identity and meaningful delivery-state summary remain visible at Month density, derived from Section scope rather than stored as a second aggregate truth.
- Month titles stay at the 16px core-UI floor; 14px is metadata only.
- outside-month padding dates remain visible as calendar continuity and are visually subordinate without deleting their planning truth.
- Month uses semantic groups and labels rather than claiming ARIA grid behavior that has not been implemented.

## Cross-view truth rules
- Month signals must be reconstructable exactly from the same per-Section placements used by Week/Day.
- reconstruction includes Lesson/Course identity, fixed/flexible policy, Section identity/name, delivery status, and whether that Section is on a shared or Section-specific effective date.
- an override moves only that Section's effective placement; it may not leave a duplicate ghost on the shared date.
- adjacent-month padding retains real planning truth.
- Month Unit week segments must reconstruct the Unit's exact visible calendar-date coverage, including weekend/no-school dates inside a continuous Unit span; those dates do not become instructional days merely because the Unit band crosses them.

## Operations
- every preview/build exposes the exact Git commit fingerprint.
- GitHub Actions is the canonical source/build gate and runs read-only from the committed lockfile.
- Vercel is the intended preview platform.
- the legacy Cloudflare Workers repository integration has been disconnected.
- `main` is protected against unreviewed release changes; `develop` remains the controlled integration branch for the current rebuild workflow.

## Core rules
- calendar remains the center of the product;
- one shared Course/Unit/Lesson plan; Sections carry actual teaching state;
- missing delivery state means `not-started`; divergence stays sparse;
- calendar truth is explicit; missing dates are never silently instructional;
- preview before consequence; no silent loss; fixed dates stay fixed;
- recovery reads the Section's effective live schedule, including persisted Section overrides;
- completed/skipped work is not future recovery pressure and cannot be moved by recovery Shift;
- ordinary same-day live collisions remain invalid unless an exact teacher approval exists;
- Shift changes only the target Section schedule; shared Lessons and unrelated Sections remain untouched;
- Undo is Section-scoped and refuses to overwrite newer work;
- destructive upstream edits fail rather than orphan or silently repair downstream state;
- no fake controls, fake source data, fake saves, or fake deployment claims.

## Verification
- exact dependency versions are locked in `package-lock.json`;
- CI installs only with `npm ci`;
- `npm run build` requires the full domain contract suite, TypeScript compile, and Vite production bundle;
- contract manifest lives in `tests/run-contracts.mjs`;
- Week/Day hostile projection is permanently gated;
- Month projection is permanently gated;
- Week↔Day↔Month consistency is permanently gated, including duplicate display names, adjacent-month Section Shift, holidays, overlapping/continuous Unit coverage, and exact Section-effective state reconstruction;
- no feature branch advances to `develop` without an exact-head green gate;
- `develop` must pass again after integration;
- browser interaction is a separate release gate and is never inferred from source/build success.

## Next authorized work
1. integrate the verified Week↔Day↔Month consistency audit;
2. extend the same planning truth into Quarter at Quarter-appropriate density;
3. hostile-audit Quarter against the already-cleared horizons before Semester/Year Map;
4. extend the same truth into Semester and Year Map at their own density, with audits between layers;
5. build Day/Easel teaching continuity from that same state;
6. restore missing platform obligations: auth/account isolation and account/Drive persistence before external beta;
7. only then resume secondary exception systems as their primary workflows require them.

## Release wall
Nothing moves to `main` until product, functional, visual, accessibility, persistence, account-isolation, regression, exact-build, browser-interaction, and dependency-lock gates are explicitly cleared.
