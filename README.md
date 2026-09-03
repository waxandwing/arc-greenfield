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
Frame → navigation → calendar truth → projections → rendering → hydration → teacher calendar setup → persisted calendar restore → safe period navigation → pre-planning audit hardening → quarter/semester truth → Unit domain foundation → teacher class setup → Unit persistence/editing → Lesson continuity state → recovery consequence preview.

Implemented:
- six calendar horizons over one `SchoolCalendar`
- explicit instructional/no-school states, provenance, readiness, navigation, persistence, and term structure
- teacher-facing calendar, term, Class, Unit, and Lesson setup using real teacher-defined data
- Course / Section / Unit / Lesson separation with stable identities and cross-layer validation
- sparse per-Section Lesson delivery state with preserved resume notes
- fixed vs flexible Lesson date policy
- fixed Lessons require real planned dates and act as recovery anchors
- legacy saved Lessons that predate date-policy support migrate to `flexible`, never `fixed`
- pure `RecoveryPreview` derives the next confirmed instructional resume day from the same canonical school calendar
- recovery preview preserves the exact interruption note
- flexible Lessons affected before the next fixed anchor are surfaced as consequences
- fixed anchors are surfaced but never moved by preview logic
- canonical recovery case is contract-backed: Period 5 resumes Thursday, Thursday Lesson 18 is surfaced as affected, Friday test remains the fixed anchor
- recovery preview carries `mutationApplied: false` and is contract-tested as a pure read of planning state
- teacher-facing **Recovery review** appears only when real in-progress Section state exists
- Recovery review is read-only and contains no Apply/Shift mutation path
- if no future confirmed instructional day exists, recovery blocks explicitly rather than inventing a date
- Units, Sections, Lessons, calendar edits, and cross-Course moves continue to protect downstream teaching history
- exact dependencies + committed package lockfile
- independent GitHub Actions verification using Node 22 + `npm ci`

## Standing planning rules
- Course owns the shared curriculum plan.
- Unit groups shared curriculum inside a Course.
- Lesson is shared curriculum, not a per-Section copy.
- Section owns actual teaching progress.
- Unit and Lesson identities are stable independent of placement and delivery state.
- Missing delivery state means `not-started`; divergence is sparse.
- In-progress state must preserve enough information to resume.
- `flexible` means recovery may surface the Lesson for movement review; it does not mean Arc may move it silently.
- `fixed` means Arc may surface a collision but may not move the Lesson automatically.
- Recovery preview is always consequence-only. Preview may not mutate Lessons, dates, Units, or delivery state.
- Existing planning objects protect the identities and teaching history they depend on.
- Arc blocks destructive edits rather than silently deleting, detaching, or auto-repairing downstream state.

## Standing calendar rules
- Missing dates are `unknown`, never silently instructional.
- Arc expands only a weekday pattern explicitly declared by a teacher/source.
- Complete-looking is not enough; structural planning requires confirmed truth.
- Every view derives from the same calendar state.
- Persistence stores declarations, not hydrated runtime objects.
- Reloaded data must validate again before Arc uses it.
- Period navigation and recovery never invent unavailable years, term boundaries, or instructional dates.
- Quarter/Semester dates must be teacher/source-declared; Arc does not infer them.

## Verification status
- Course/Section setup, Units, Lesson continuity, and recovery preview are integrated in `develop`
- the exact recovery-preview feature head passed the lockfile-backed domain/build gate before integration
- `develop` must pass the same independent gate after every integration checkpoint commit
- domain contract suite includes calendar truth, projections, hydration, persistence, navigation, manual setup, terms, Course/Section scope, Units, planning workspace, Unit workspace, Lesson divergence/persistence, cross-layer dependency integrity, and recovery-preview/fixed-date behavior
- dependency installation is reproducible from committed `package-lock.json` using `npm ci`
- TypeScript compile and Vite bundle are required on every verification run
- Vercel Hobby preview builds remain rate-limited; this is not being bypassed with duplicate preview infrastructure
- interactive browser click/keyboard automation remains an explicit release gate rather than an assumed pass

## Not built yet
- Unit/Lesson rendering inside the six calendar horizons
- recovery apply / Shift mutation and whole-operation undo
- Notes, Ideas
- school/district calendar import adapters
- account-backed persistence/sync
- Easel/integrations
- production deployment

## Release wall
Preview builds come from non-main branches and identify branch + commit SHA. GitHub Actions is an independent required verification surface and must build from the committed lockfile. Nothing moves to `main` until the current rebuild passes the agreed product, functional, visual, accessibility, persistence, regression, exact-build, browser-interaction, and dependency-lock gates and is explicitly cleared for release.
