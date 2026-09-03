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
Frame → navigation → calendar truth → projections → rendering → hydration → teacher calendar setup → persisted calendar restore → safe period navigation → pre-planning audit hardening → quarter/semester truth → Unit domain foundation → teacher class setup → Unit persistence and editing.

Implemented:
- six calendar horizons over one `SchoolCalendar`
- explicit instructional/no-school states, provenance, readiness, navigation, persistence, and term structure
- teacher-facing calendar and Quarter/Semester setup
- Course / Section / Unit domain separation
- teacher-facing **Classes** setup with stable Course/Section identity and versioned persistence
- first real **Units** editor using teacher-defined Courses rather than sample data
- Unit identity remains stable across edits, placement changes, persistence, and reload
- Units may remain unscheduled
- placed Units require at least one confirmed instructional day and must stay inside the loaded school year
- Unit workspace persistence is versioned and revalidated against current calendar + Course ownership on restore
- duplicate Unit IDs, missing Courses, wrong calendars, and invalid placements are rejected
- Courses referenced by Units are protected from destructive removal
- changing calendar dates is refused when the change would strand an existing Unit outside the year or remove every instructional day from its placement
- Arc does not auto-shift or silently repair those conflicts; teacher must resolve the Unit placement first
- Unit and class editing remain temporary editor states and do not permanently reduce calendar space
- domain-wide contract suite covers calendar, term, Course/Section, Unit, planning-workspace persistence, Unit-workspace persistence, and cross-layer calendar/Unit integrity
- exact dependencies + committed package lockfile
- independent GitHub Actions verification using Node 22 + `npm ci`

## Standing planning rules
- Course owns the shared curriculum plan.
- Section owns the eventual per-group teaching state.
- Teacher-facing language may say **Classes**; internal Course/Section distinctions remain precise.
- Unit is a stable curriculum object, not a date range identity.
- Calendar placement is optional and independently mutable.
- Moving a Unit never changes its identity.
- A Unit cannot be structurally placed against incomplete/unconfirmed calendar truth.
- Unit term membership is derived, never duplicated.
- UI must not rely on fake Course/Section data.
- persisted planning scope must be re-validated before use.
- existing planning objects protect the identities they depend on.
- a calendar edit that invalidates an existing Unit must be blocked rather than silently accepted.

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
- Term boundaries of the same type may not overlap.
- Quarter/Semester dates must be teacher/source-declared; Arc does not infer them.
- If quarters and semesters are both configured, every quarter must fit wholly inside one semester.
- Editing terms must not alter instructional-day truth or calendar identity.

## Verification status
- teacher-facing Course/Section setup and browser persistence are integrated in `develop`
- Unit persistence/editor is under active feature verification
- domain contract suite includes calendar truth, projections, hydration, persistence, navigation, manual setup, term configuration, Course/Section scope, Unit behavior, planning workspace, Unit workspace, and cross-layer calendar/Unit integrity
- dependency installation is reproducible from committed `package-lock.json` using `npm ci`
- TypeScript compile and Vite bundle are required on every verification run
- Vercel Hobby preview builds remain rate-limited; this is not being bypassed with duplicate preview infrastructure
- interactive browser click/keyboard automation remains an explicit release gate rather than an assumed pass

## Not built yet
- Unit rendering inside the six calendar horizons
- Lessons and per-Section delivery-state divergence
- Notes, Ideas, Shift
- school/district calendar import adapters
- account-backed persistence/sync
- Easel/integrations
- production deployment

## Release wall
Preview builds come from non-main branches and identify branch + commit SHA. GitHub Actions is an independent required verification surface and must build from the committed lockfile. Nothing moves to `main` until the current rebuild passes the agreed product, functional, visual, accessibility, persistence, regression, exact-build, browser-interaction, and dependency-lock gates and is explicitly cleared for release.
