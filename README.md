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
Frame → navigation → calendar truth → projections → rendering → hydration → teacher calendar setup → persisted calendar restore → safe period navigation → pre-planning audit hardening → quarter/semester truth → Unit domain foundation.

Implemented and integrated through terms:
- global shell geometry and canonical brand tokens
- responsive calendar stage and accessibility baseline
- Year Map / Semester / Quarter / Month / Week / Day navigation
- one canonical `SchoolCalendar` domain model
- explicit instructional / no-school / workday / holiday / break / unknown states
- source + confidence provenance
- timezone-safe date math
- instructional-day movement and ranges
- readiness gates requiring complete confirmed calendar truth
- one pure projection layer for all six horizons
- rendered calendar skeletons for all six horizons
- explicit hydration from a teacher/source-declared weekly pattern
- validated exception overrides
- teacher-facing manual calendar setup
- exact declaration preservation for editing
- Cancel-safe editing
- versioned persistence and reload re-validation
- view-aware previous / Today / next controls
- teacher-facing Quarter and Semester configuration
- stable term identities and cross-term validation
- term context across Day / Week / Month / Quarter / Semester / Year Map
- stable calendar identity across edits
- AA-safe focus, control-border, and text-action contrast tokens
- exact dependencies + committed package lockfile
- independent GitHub Actions verification using Node 22 + `npm ci`

Current Unit-domain foundation:
- `Course` is the shared curriculum identity.
- `Section` is a specific teaching group that references a Course and school calendar.
- `Unit` belongs to a Course and calendar, never directly to a Section.
- Multiple Sections may share one Course/Unit plan without duplicating curriculum objects.
- Section-specific teaching progress is intentionally not stored on Unit; that belongs to the later delivery/recovery state layer.
- A Unit has stable identity and may exist unplaced.
- Placing, moving, or unplacing a Unit does not change its identity or Course ownership.
- Unit placement requires a complete confirmed school calendar and at least one instructional day.
- Unit placement cannot cross outside the loaded school year or silently attach to another calendar.
- Unit quarter/semester membership and instructional-day count are derived from current calendar truth rather than stored as stale foreign keys.
- Course and Section ownership have explicit validation helpers.
- the former calendar-only contract compiler has been replaced by a domain-wide contract suite.

## Standing planning rules
- Course owns the shared curriculum plan.
- Section owns the eventual per-group teaching state.
- Unit is a stable curriculum object, not a date range identity.
- Calendar placement is optional and independently mutable.
- Moving a Unit never changes its identity.
- A Unit cannot be structurally placed against incomplete/unconfirmed calendar truth.
- Unit term membership is derived, never duplicated.
- Unit UI must not be built against fake Course/Section data; real planning scope comes first.

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
- terms are integrated in `develop`
- Unit domain is under active feature verification
- domain contract suite now includes calendar truth, projections, hydration, persistence, navigation, manual setup, term configuration, Course/Section scope, and Unit behavior
- dependency installation is reproducible from committed `package-lock.json` using `npm ci`
- TypeScript compile and Vite bundle remain required on every verification run
- Vercel Hobby preview builds are rate-limited; this is not being bypassed with duplicate preview infrastructure
- interactive browser click/keyboard automation remains an explicit release gate rather than an assumed pass

## Not built yet
- Course/Section teacher-facing setup or persistence
- Unit teacher-facing UI or persistence
- Lessons, delivery-state divergence, Notes, Ideas, Shift
- school/district calendar import adapters
- account-backed persistence/sync
- Easel/integrations
- production deployment

## Release wall
Preview builds come from non-main branches and identify branch + commit SHA. GitHub Actions is an independent required verification surface and must build from the committed lockfile. Nothing moves to `main` until the current rebuild passes the agreed product, functional, visual, accessibility, persistence, regression, exact-build, browser-interaction, and dependency-lock gates and is explicitly cleared for release.
