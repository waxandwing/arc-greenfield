# Arc

Greenfield rebuild. Calendar-first. Trust-first.

## Authority
- `main` — protected, release-only. Never use it as the active development source.
- `develop` — the only integrated pre-release source of truth.
- `feature/easel-continuity` — the only active implementation branch for this checkpoint.
- `archive/pre-frame-reset-2026-09-02` — preserved rollback point.
- every other branch is historical, abandoned, experimental, accidental, or reference-only unless this file explicitly says otherwise.

Google Drive canonical Product Spec owns product/architecture decisions. Google Drive canonical Brand System owns visual/construction rules. Git owns implementation history. Do not create duplicate handoff, blueprint, audit, or design-system documents in this repository.

## Authoritative rebuild direction
When older phase prose conflicts with later decisions, the constrained rebuild order wins:

frame/shell → navigation → calendar truth → movement/recovery → real planning surface → Day/Easel teaching continuity → integrations/account foundation → long-range completion + secondary systems → release hardening.

The primary product loop outranks convenient implementation order.

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
- real Week planning projection plus hostile Week/Day projection clearance;
- real Month planning projection;
- Week↔Day↔Month exact Section-effective cross-view clearance;
- dedicated Day teaching-continuity projection and teacher-facing presentation;
- exact integrated Day head `07f6f32da53feaf4a3824cad98e69030f84ec1d1`.

### Active checkpoint
Arc→Easel→Arc continuity is being built inside Arc, not as a separate product or data store. The current domain seam binds an Easel session to one exact Arc Day + Course + Section + Unit + Lesson context, then permits only validated Section delivery-state outcomes back into Arc. Easel does not create a parallel class profile, duplicate Lesson, or independent schedule.

### Not complete
- Easel teacher-facing live teaching surface and Day→Easel→Day interaction flow;
- browser-driven Day/Easel keyboard/touch/responsive verification;
- Quarter/Semester/Year Map planning presentation at final density;
- auth and account isolation;
- account-backed/Drive persistence and reconciliation;
- landing-view preference persistence;
- Notes, Ideas, Unit Focus, Must/Should/Could, Tack, Extend, filters, Year markers;
- browser-driven keyboard/touch/responsive release verification across the product.

## Frozen / reference-only work
- `feature/quarter-planning-projection` is an experiment, **not authorized source**. It was stopped when the redevelopment audit showed that continuing long-range projection before Day/Easel would favor comfortable work over the primary teacher loop. Do not merge or cherry-pick it wholesale.
- `feature/same-day-approval-persistence` remains abandoned/reference-only. Same-day approval persistence/UI stays deferred until the ordinary planning loop needs it.
- historical standalone Easel repositories/deployments are reference-only. They may inform classroom-screen behavior, but they do not own Arc state, product architecture, or deployment direction.

Reusable architecture must be rebuilt or deliberately extracted from `develop`; historical code does not become authority because it compiles.

## Code ownership map
Keep one obvious owner per concern.

### App / state
- `src/components/AppFrame.tsx` — composition only.
- `src/app/useArcWorkspace.ts` — canonical workspace state transitions and validated saves. Do not turn it into an Easel/Ideas/Notes/auth dumping ground merely because it has workspace access.
- `src/app/workspaceBootstrap.ts` — restore order and initial persistence notices only.
- `src/app/shiftReconciliation.ts` — policy for preserving/dropping Shift and Undo when upstream planning changes.
- `src/app/useWorkspaceMode.ts` — one mutually exclusive temporary workspace mode.

### Calendar shell / routing
- `src/components/WorkspaceStage.tsx` — selects the active calendar/editor/recovery surface.
- `src/components/CalendarStageHeader.tsx` — calendar-stage controls only.
- `src/components/CalendarViewRail.tsx` — horizon navigation only.
- `src/components/CalendarProjectionView.tsx` — horizon routing/delegation only.
- `src/components/CalendarProjectionPrimitives.tsx` — shared non-interactive calendar projection primitives and term context.
- `src/components/dateLabels.ts` — single UI date-label formatter boundary.
- `src/calendar/schoolCalendar.ts` — calendar-day truth including the shared `isConfirmedInstructionalDay` rule used anywhere teaching progress is recorded.

### Planning projection / presentation
- `src/planning/planningProjection.ts` — canonical range projection from shared Course/Unit/Lesson state + Section-effective dates/delivery state.
- `src/planning/planningLessonSignals.ts` — exact shared-Lesson aggregation from canonical per-Section placements.
- `src/planning/monthPlanningProjection.ts` — Month geometry aggregation only.
- `src/planning/dayContinuityProjection.ts` — read-only Day continuity projection. It may surface unfinished teaching but may not mutate/reschedule.
- `src/planning/easelSessionProjection.ts` — read-only Arc→Easel handoff. It binds one explicit Section + Lesson candidate from Day and preserves exact Arc identity/state. It never guesses between carryover and today’s plan.
- `src/planning/easelTeachingOutcome.ts` — thin Easel→Arc adapter over the existing delivery-state rules. It may return validated Section delivery state; it may not Shift the calendar or create another recovery model.
- `src/components/PlanningDayContinuityView.tsx` — Day continuity presentation only.
- `src/components/PlanningWeekDayView.tsx` — Week planning presentation only.
- `src/components/PlanningMonthView.tsx` — Month planning presentation only.
- `src/calendar/**` — school-calendar truth and calendar-only projections.
- `src/planning/**` — Course/Section/Unit/Lesson/delivery/recovery/Shift domain and persistence boundaries.

A UI component is not a state store. A view is not a second domain model. A controller does not absorb unrelated domains because it can reach them.

## Arc ↔ Easel continuity rules
- Easel is Arc’s live teaching surface, not a separate product or planning database.
- Arc Day provides the launch truth. Easel must bind to an explicit Section + Lesson candidate; it cannot silently choose between unfinished carryover and a different Lesson planned today.
- the same shared Lesson may be open for different Sections while preserving distinct per-Section delivery state and resume notes.
- unscheduled in-progress teaching may enter Easel without inventing a date.
- a Section-specific Shift changes which Day candidate is scheduled; it must not create a duplicate carryover candidate.
- opening/projecting an Easel session is read-only.
- Easel outcomes reuse Arc’s existing delivery-state rules.
- Easel may record `completed`, `stopped` with a concrete resume note, or `skipped` for not-started work.
- completed/skipped history is terminal inside Easel and cannot be rewritten there.
- already-started work cannot be relabeled skipped.
- stale Easel sessions refuse to overwrite newer Arc delivery state.
- teaching progress may be recorded only on a confirmed instructional day under the current Arc calendar model.
- Easel never performs Shift. A stopped Lesson becomes ordinary in-progress Section state; the existing Arc Recovery pipeline owns consequence preview and schedule repair.

## Cross-view truth
- Day, Week, and Month are lenses over one Section-effective schedule.
- shared Unit/Lesson identity never forks by view.
- a Section override moves only that Section’s effective placement and leaves no ghost on the shared date.
- distinct Sections may share a display name and still remain distinct by stable ID.
- Month grouping must reconstruct exact Section identity/name/delivery/fixed/Shift truth from Week/Day placements.
- Day may additionally surface genuine in-progress carryover. That is teaching-state truth, not a new schedule placement.
- outside-month padding retains real planning continuity.
- Unit bands may cross weekend/no-school dates without converting them to instructional days.
- malformed date geometry and duplicate placements fail closed.

## Accessibility truth
- no UI may claim ARIA grid behavior unless keyboard grid interaction is implemented.
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

Permanent gates include calendar truth, terms, Course/Section, Units, Lessons/delivery, recovery/Shift/Undo/persistence, Week/Day hostile projection, Month projection, shared Lesson-signal identity, Week↔Day↔Month truth, Day continuity, Arc→Easel session projection, and Easel→Arc teaching outcomes.

No feature advances to `develop` without an exact-head green gate. `develop` must pass again after integration.

## Next authorized work
1. integrate the exact green Arc↔Easel domain-continuity head and require `develop` to pass independently;
2. build the minimal Easel live teaching surface from that exact verified state, including explicit Day launch and return without creating a second planning store;
3. prove browser-level Arc Day → Easel → Arc continuity before expanding secondary Easel tools;
4. add only the classroom tools that support the proven teaching loop (timer/clock/cleanup/media/etc.) without turning Easel into a widget pile;
5. return to Quarter/Semester/Year Map as natural zoom-outs of the proven calendar language;
6. close auth/account isolation and account/Drive persistence before external beta;
7. complete physical browser accessibility/responsive verification before release.

## Release wall
Nothing moves to `main` until product, functional, visual, accessibility, persistence, account-isolation, regression, exact-build, browser-interaction, and dependency-lock gates are explicitly cleared.
