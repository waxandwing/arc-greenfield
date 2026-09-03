# Arc

Greenfield rebuild. Calendar-first. Trust-first.

## Active authority
- `main` — release-only. Do not work here.
- `develop` — integrated pre-release source of truth.
- current `feature/*` — one active implementation branch at a time.
- `archive/pre-frame-reset-2026-09-02` — preserved rollback point.

All other historical branches are non-authoritative. Their continued existence is archival only and must never be used as a source for new work, previews, audits, or recovery unless explicitly requested.

## Documentation authority
- Google Drive canonical Product Spec = product/architecture authority.
- Google Drive canonical Brand System = visual/construction authority.
- this README = repository operating contract only.
- Git history = implementation history, not product authority.

Do not add duplicate handoff, audit, blueprint, or design-system documents to this repository.

## Current build scope
Frame → navigation → calendar truth → projections → rendering → hydration → teacher calendar setup → persisted calendar restore → safe period navigation → pre-planning audit hardening → quarter/semester truth → Unit domain foundation → teacher class setup → Unit persistence/editing → Lesson continuity state → recovery consequence preview → atomic Section Shift domain → Shift mutation-safety audit hardening.

Implemented:
- six calendar horizons over one canonical `SchoolCalendar`
- real teacher-defined Classes, Units, Lessons, sparse Section progress, and recovery preview
- flexible vs fixed Lesson dates; fixed dates are immutable recovery anchors
- read-only Recovery review with no mutation path
- Section-specific Lesson date overrides, keeping the shared Course/Lesson plan unchanged for other Sections
- explicit atomic `ShiftOperation` containing every teacher-approved date change
- Shift validates the original `fromDate` so stale previews cannot apply after the schedule changes
- incomplete Shift is rejected when the proposed continuation would collide with another Lesson
- fixed Lessons cannot be moved by Shift
- Shift targets must remain confirmed instructional days inside the Lesson's placed Unit
- no-op Shift changes are rejected; an operation must actually move something
- applying Shift writes only Section-specific overrides; shared Lesson objects are not mutated
- canonical Shift is contract-backed: P5 Lesson 17 → Thursday, P5 Lesson 18 → teacher-chosen Monday, Friday test remains fixed, P2 remains on the shared plan
- Undo is scoped to the affected Section only; newer work in another Section does not invalidate or get overwritten by that Undo
- newer work inside the same Section invalidates the old Undo token rather than being overwritten
- authoritative Section-schedule workspace validation rejects duplicate overrides, orphaned Section/Lesson references, moved fixed Lessons, invalid Unit/calendar dates, and unresolved same-day collisions
- calendar closures and Unit-boundary edits are explicitly tested as invalidators of Section overrides
- Recovery preview reads the Section's effective schedule, including existing Section overrides, across the whole Course rather than only the interrupted Unit
- Recovery preview chooses the earliest fixed anchor by effective date across the Course
- exact dependencies + committed package lockfile
- independent GitHub Actions verification using Node 22 + `npm ci`

## Standing planning rules
- Course owns the shared curriculum plan.
- Unit groups shared curriculum inside a Course.
- Lesson is shared curriculum, not a per-Section copy.
- Section owns actual teaching progress and may carry Section-specific schedule overrides.
- Unit and Lesson identities remain stable independent of placement, delivery state, or Section override.
- Missing delivery state means `not-started`; divergence is sparse.
- In-progress state must preserve enough information to resume.
- `flexible` means eligible for explicit movement review, never silent movement.
- `fixed` means Arc may surface a collision but may not move the Lesson automatically or through Shift.
- Recovery preview is consequence-only and cannot mutate planning state.
- Recovery preview must use the current Section effective schedule, not only shared Lesson dates.
- Shift requires explicit changes for every collision it resolves; no hidden domino movement.
- Shift is atomic: if any change fails validation, none are applied.
- Whole-operation Undo may not overwrite newer work in the affected Section and may not touch unrelated Sections.
- Existing planning objects protect the identities and teaching history they depend on.

## Standing calendar rules
- Missing dates are `unknown`, never silently instructional.
- Arc expands only a weekday pattern explicitly declared by a teacher/source.
- Every view derives from the same calendar state.
- Reloaded data must validate again before Arc uses it.
- Period navigation, recovery, and Shift never invent instructional dates.
- Quarter/Semester dates must be teacher/source-declared; Arc does not infer them.

## Shift audit findings fixed
- Undo previously snapshotted all Sections instead of the affected Section only.
- Section schedule overrides previously lacked one authoritative cross-layer validator.
- no-op Shift operations could previously create misleading operation history.
- Recovery preview previously looked only inside the interrupted Unit and ignored Section overrides, which could produce an incomplete consequence preview.

## Verification status
- Course/Section setup, Units, Lesson continuity, and recovery preview are integrated in `develop`
- atomic Section Shift has passed feature verification; mutation-safety hardening is under final feature verification before integration
- domain contract suite includes calendar truth, projections, hydration, persistence, navigation, terms, Course/Section scope, Units, Lesson divergence/persistence, recovery preview/fixed-date behavior, Section schedule workspace integrity, and atomic Shift/Undo behavior
- dependency installation is reproducible from committed `package-lock.json` using `npm ci`
- TypeScript compile and Vite bundle are required on every verification run
- Vercel Hobby preview builds remain rate-limited; duplicate preview infrastructure is not being created to bypass that limit
- interactive browser click/keyboard automation remains an explicit release gate rather than an assumed pass

## Not built / not cleared yet
- persistence/reload for Section schedule overrides and Shift undo state
- teacher-facing Apply Shift / Undo controls
- explicit teacher-approved allowance for multiple Lessons on the same Section/date; current Shift integrity treats those as collisions
- Unit/Lesson rendering inside the six calendar horizons
- Notes, Ideas
- school/district calendar import adapters
- account-backed persistence/sync
- Easel/integrations
- production deployment

## Release wall
Preview builds come from non-main branches and identify branch + commit SHA. GitHub Actions is an independent required verification surface and must build from the committed lockfile. Nothing moves to `main` until the current rebuild passes the agreed product, functional, visual, accessibility, persistence, regression, exact-build, browser-interaction, and dependency-lock gates and is explicitly cleared for release.
