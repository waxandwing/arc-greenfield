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
Frame → navigation → calendar truth → projections → rendering → hydration → teacher calendar setup → persisted calendar restore → safe period navigation → pre-planning audit hardening → quarter/semester truth → Unit domain foundation → teacher class setup → Unit persistence/editing → Lesson continuity state.

Implemented:
- six calendar horizons over one `SchoolCalendar`
- explicit instructional/no-school states, provenance, readiness, navigation, persistence, and term structure
- teacher-facing calendar and Quarter/Semester setup
- Course / Section / Unit / Lesson domain separation
- teacher-facing **Classes**, **Units**, and **Lessons** editors using real teacher-defined data
- Lesson is one shared curriculum object attached to a Unit and Course
- Lesson identity remains stable while Section delivery state diverges independently
- Lesson planned dates are optional and, when present, must stay inside the placed Unit on a confirmed instructional day
- Section delivery state supports `not-started`, `in-progress`, `completed`, and `skipped`
- in-progress Lessons require a resume note so Arc can preserve exactly where that Section stopped
- in-progress/completed Lessons require the actual teaching date
- missing Section delivery state is derived as `not-started`; Arc stores only real divergence rather than pre-creating every Lesson × Section combination
- canonical divergence is supported: one shared Lesson can be complete in one Section, interrupted in another, and untouched in a third
- Lesson continuity persistence is versioned and revalidated against current calendar, Classes, Units, and ownership on restore
- duplicate Lesson IDs, duplicate Lesson/Section delivery records, orphan Units, orphan Sections, wrong Courses/calendars, invalid planned dates, and non-instructional teaching dates are rejected
- Units containing Lessons are protected from destructive removal
- Sections with recorded Lesson progress are protected from destructive removal
- Lessons with recorded teaching history cannot be casually removed
- cross-Course Lesson moves with existing teaching history are refused rather than clearing history
- class, Unit, and calendar edits are revalidated against existing Lesson continuity before Arc accepts them
- exact dependencies + committed package lockfile
- independent GitHub Actions verification using Node 22 + `npm ci`

## Standing planning rules
- Course owns the shared curriculum plan.
- Unit groups shared curriculum inside a Course.
- Lesson is shared curriculum, not a per-Section copy.
- Section owns actual teaching progress.
- Teacher-facing language may say **Classes**; internal Course/Section distinctions remain precise.
- Unit and Lesson identities are stable independent of placement and delivery state.
- Calendar placement is independently mutable only while downstream objects remain valid.
- Missing delivery state means `not-started`; divergence is sparse.
- In-progress state must preserve enough information to resume.
- Existing planning objects protect the identities and teaching history they depend on.
- Arc blocks destructive edits rather than silently deleting, detaching, or auto-repairing downstream state.

## Standing calendar rules
- Missing dates are `unknown`, never silently instructional.
- Arc expands only a weekday pattern explicitly declared by a teacher/source.
- Complete-looking is not enough; structural planning requires confirmed truth.
- Every view derives from the same calendar state.
- Editing reopens the original declarations; Arc does not reverse-engineer a pattern.
- Persistence stores declarations, not hydrated runtime objects.
- Reloaded data must validate again before Arc uses it.
- Period navigation never invents unavailable years or term boundaries.
- Editing calendar dates must not change calendar identity or erase unrelated calendar structures.
- Quarter/Semester dates must be teacher/source-declared; Arc does not infer them.
- If quarters and semesters are both configured, every quarter must fit wholly inside one semester.

## Verification status
- Course/Section setup, Unit setup, and Lesson continuity are integrated through feature-branch verification
- domain contract suite includes calendar truth, projections, hydration, persistence, navigation, manual setup, terms, Course/Section scope, Units, planning workspace, Unit workspace, Lesson delivery divergence, Lesson workspace persistence, and cross-layer dependency integrity
- dependency installation is reproducible from committed `package-lock.json` using `npm ci`
- TypeScript compile and Vite bundle are required on every verification run
- Vercel Hobby preview builds remain rate-limited; this is not being bypassed with duplicate preview infrastructure
- interactive browser click/keyboard automation remains an explicit release gate rather than an assumed pass

## Not built yet
- Unit/Lesson rendering inside the six calendar horizons
- recovery preview / Shift behavior
- Notes, Ideas
- school/district calendar import adapters
- account-backed persistence/sync
- Easel/integrations
- production deployment

## Release wall
Preview builds come from non-main branches and identify branch + commit SHA. GitHub Actions is an independent required verification surface and must build from the committed lockfile. Nothing moves to `main` until the current rebuild passes the agreed product, functional, visual, accessibility, persistence, regression, exact-build, browser-interaction, and dependency-lock gates and is explicitly cleared for release.
