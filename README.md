# Arc

Greenfield rebuild. Calendar-first. Trust-first.

## Authority
- `main` — protected, release-only. Never use it as the active development source.
- `develop` — the only integrated pre-release source of truth.
- `feature/day-teaching-continuity` — the only active implementation branch for this checkpoint.
- `archive/pre-frame-reset-2026-09-02` — preserved rollback point.
- every other branch is historical, abandoned, experimental, accidental, or reference-only unless this file explicitly says otherwise.

Google Drive canonical Product Spec owns product/architecture decisions. Google Drive canonical Brand System owns visual/construction rules. Git owns implementation history. Do not create duplicate handoff, blueprint, audit, or design-system documents in this repository.

## Authoritative rebuild direction
When older phase prose conflicts with later decisions, the constrained rebuild order wins:

frame/shell → navigation → calendar truth → movement/recovery → real planning surface → Day/Easel teaching continuity → integrations/account foundation → long-range completion + secondary systems → release hardening.

The primary product loop outranks convenient implementation order. Do not keep extending a technically easy horizon while the teacher's daily continuity loop remains incomplete.

### Integrated and cleared through `develop`
- trustworthy shell and six calendar navigation horizons;
- explicit school-calendar truth, terms, navigation, and local declaration persistence;
- real Course/Section setup;
- Unit and Lesson domain/editing foundations;
- sparse per-Section delivery state;
- recovery consequence preview;
- Section-scoped Shift Apply, local persistence, reload-safe Undo, and hostile recovery preflight;
- exact same-day collision approval **domain only**;
- AppFrame decomposition into discoverable ownership boundaries;
- real Week/Day planning projection plus hostile Week/Day clearance;
- real Month planning projection;
- Week↔Day↔Month exact Section-effective cross-view clearance;
- foundation realignment and primary-loop sequencing checkpoint at `5fe3d0febfd13db07cfde5c58243397289853493`.

### Active checkpoint
Day teaching continuity is being proven as a read-only projection over canonical planning + Section delivery state. It must answer, per Section, what is scheduled today and what unfinished teaching Arc is still holding. Day does not mutate recovery state, invent dates, or become a second recovery engine.

### Not complete
- teacher-facing Day continuity presentation and interaction audit;
- Easel continuity from exact Day/Section/Lesson state;
- Quarter/Semester/Year Map planning presentation at final density;
- auth and account isolation;
- account-backed/Drive persistence and reconciliation;
- landing-view preference persistence;
- Notes, Ideas, Unit Focus, Must/Should/Could, Tack, Extend, filters, Year markers;
- browser-driven keyboard/touch/responsive release verification.

## Frozen / reference-only work
- `feature/quarter-planning-projection` is an experiment, **not authorized source**. It was stopped when the redevelopment audit showed that continuing long-range projection before Day/Easel would favor comfortable work over the primary teacher loop. Do not merge or cherry-pick it wholesale.
- `feature/same-day-approval-persistence` remains abandoned/reference-only. Same-day approval persistence/UI stays deferred until the ordinary planning loop needs it.

Reusable architecture must be rebuilt or deliberately extracted from `develop`; a historical branch does not become authority because its code happens to compile.

## Code ownership map
Keep one obvious owner per concern.

### App / state
- `src/components/AppFrame.tsx` — composition only.
- `src/app/useArcWorkspace.ts` — canonical workspace state transitions and validated saves. Do not add Easel, Ideas, Notes, auth orchestration, or unrelated feature state here simply because the hook already has workspace access.
- `src/app/workspaceBootstrap.ts` — restore order and initial persistence notices only.
- `src/app/shiftReconciliation.ts` — policy for preserving/dropping Shift and Undo when upstream planning changes.
- `src/app/useWorkspaceMode.ts` — one mutually exclusive temporary workspace mode.

### Calendar shell / routing
- `src/components/WorkspaceStage.tsx` — selects the active calendar/editor/recovery surface.
- `src/components/CalendarStageHeader.tsx` — calendar-stage controls only.
- `src/components/CalendarViewRail.tsx` — horizon navigation only.
- `src/components/CalendarProjectionView.tsx` — horizon routing/delegation only. It must not accumulate generic calendar primitives, formatting utilities, or Section-effective planning calculations.
- `src/components/CalendarProjectionPrimitives.tsx` — shared non-interactive calendar projection primitives and term context.
- `src/components/dateLabels.ts` — the single UI date-label formatter boundary.

### Planning projection / presentation
- `src/planning/planningProjection.ts` — canonical range projection from shared Course/Unit/Lesson state + Section-effective dates/delivery state.
- `src/planning/planningLessonSignals.ts` — exact shared-Lesson aggregation from canonical per-Section range placements. Section ID/name/Shift/status remain one object; duplicate Section/Lesson/date placement fails closed.
- `src/planning/monthPlanningProjection.ts` — Month geometry aggregation only; it reuses canonical range and Lesson-signal projection.
- `src/planning/dayContinuityProjection.ts` — read-only Day-specific continuity projection. It may combine today’s effective schedule with unfinished prior teaching state, but it may not mutate, reschedule, or duplicate Recovery/Shift rules.
- `src/components/PlanningWeekDayView.tsx` — Week/Day planning presentation only until Day continuity receives its dedicated presentation boundary.
- `src/components/PlanningMonthView.tsx` — Month planning presentation only.
- `src/calendar/**` — school-calendar truth and calendar-only projections.
- `src/planning/**` — Course/Section/Unit/Lesson/delivery/recovery/Shift domain and persistence boundaries.

A UI component is not a state store. A view is not a second domain model. A controller does not absorb unrelated domains because it can reach them.

## Cross-view truth
- Day, Week, and Month are lenses over one Section-effective schedule.
- shared Unit/Lesson identity never forks by view.
- a Section override moves only that Section's effective placement and leaves no ghost on the shared date.
- distinct Sections may share a display name and still remain distinct by stable ID.
- Month grouping must reconstruct exact Section identity, name, delivery state, fixed/flexible policy, and Shift ownership from Week/Day placements.
- Day continuity may additionally surface genuine in-progress carryover from an earlier teaching day, including unscheduled work or work whose Unit plan span has ended. That carryover is teaching-state truth, not a new schedule placement.
- outside-month padding retains real planning continuity.
- Unit bands may cross weekend/no-school dates without converting them to instructional days.
- malformed date geometry and duplicate placements fail closed.

## Accessibility truth
- no UI may claim ARIA grid behavior unless keyboard grid interaction is actually implemented.
- core UI/body text remains at least 16px; 14px is metadata only with adequate contrast.
- no state is communicated only through color/opacity.
- drag remains optional; every eventual drag operation needs a non-drag route.
- browser keyboard/touch/responsive behavior is a separate release gate and is never inferred from source compilation.

## Operations
- every preview/build exposes exact Git commit fingerprint.
- GitHub Actions is the canonical read-only source/build gate.
- exact dependency tree comes only from committed `package-lock.json` + `npm ci`.
- Vercel is the intended preview platform.
- legacy Cloudflare repository integration is disconnected.
- `main` is protected; `develop` is controlled integration truth.

## Core trust rules
- calendar stays at the center;
- one shared Course/Unit/Lesson plan; Sections carry actual teaching state;
- missing delivery state means `not-started`; divergence remains sparse;
- missing calendar truth is unknown, never silently instructional;
- preview before consequence; no silent loss; fixed dates stay fixed;
- completed/skipped work is not future recovery pressure;
- Shift changes only its target Section;
- Undo is Section-scoped and refuses to overwrite newer work;
- destructive upstream edits fail rather than orphan or silently repair downstream state;
- no fake controls, data, saves, or deployment claims.

## Verification
`npm run build` must pass:
1. the full domain contract manifest in `tests/run-contracts.mjs`;
2. TypeScript compile;
3. Vite production bundle.

Permanent gates include calendar truth, terms, Course/Section, Units, Lessons/delivery, recovery/Shift/Undo/persistence, Week/Day hostile projection, Month projection, shared Lesson-signal identity, Week↔Day↔Month cross-view truth, and Day teaching-continuity projection.

No feature advances to `develop` without an exact-head green gate. `develop` must pass again after integration.

## Next authorized work
1. finish the Day continuity projection/presentation and hostile-audit it on the exact feature head;
2. integrate only after the exact feature head is green, then require `develop` to pass independently;
3. build Easel from the exact Day/Section/Lesson state and prove Arc → Easel → Arc continuity;
4. return to Quarter/Semester/Year Map as natural zoom-outs of the proven calendar language, not separate dashboards;
5. close auth/account isolation and account/Drive persistence before external beta;
6. resume secondary systems only when the primary workflow requires them;
7. complete physical browser accessibility/responsive verification before release.

## Release wall
Nothing moves to `main` until product, functional, visual, accessibility, persistence, account-isolation, regression, exact-build, browser-interaction, and dependency-lock gates are explicitly cleared.
