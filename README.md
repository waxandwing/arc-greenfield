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

## Current integrated scope
Frame → navigation → calendar truth → projections → rendering → hydration → teacher calendar setup → persisted calendar restore → safe period navigation → pre-planning audit hardening → quarter/semester truth.

Implemented:
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
- view navigation locked while setup/editing is open
- versioned persistence of the teacher's original calendar declaration
- reload restore that re-validates and re-hydrates instead of trusting serialized runtime state
- explicit invalid/unavailable storage status rather than silent fallback
- view-aware previous / Today / next controls
- Day moves one calendar day; Week seven days; Month one month with safe day clamping
- Quarter/Semester move only through confirmed term boundaries
- Year Map does not fake navigation to an unloaded school year
- Today is available only when the current local date belongs to the loaded school year
- unavailable Quarter/Semester views remain visibly unavailable instead of opening dead calendar states
- readable localized calendar labels and weekday orientation
- teacher-facing Quarter and Semester configuration, separate from date editing
- stable term identities across edits
- term dates are never inferred
- same-type overlaps, malformed dates, duplicate IDs, and out-of-year term boundaries are rejected
- when both systems exist, each quarter must fit entirely inside one semester
- term edits preserve calendar identity, instructional-day declarations, and exceptions
- term boundaries survive persistence and rehydration
- Day / Week / Month expose quiet current term context
- Quarter / Semester show confirmed term span
- Year Map exposes the full configured term structure
- active Quarter/Semester view falls back safely if an edit leaves its anchor outside any remaining term
- stable calendar identity across label/date edits
- AA-safe focus, control-border, and text-action contrast tokens
- exact top-level runtime/build dependency versions pinned
- committed npm package lockfile for the full dependency tree
- independent GitHub Actions verification gate using Node 22 + `npm ci`
- calendar truth, projection, hydration, persistence, navigation, manual-setup, and term-configuration contracts gated into every build

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
- pre-planning audit hardening is integrated in `develop`
- quarter/semester truth milestone is integrated in `develop`
- current term milestone is verified independently in GitHub Actions
- seven calendar contracts pass
- dependency installation is reproducible from committed `package-lock.json` using `npm ci`
- TypeScript compile passes
- Vite production bundle passes
- Vercel Hobby preview builds are currently rate-limited; that is an infrastructure limit, not being bypassed with another preview project
- interactive browser click/keyboard automation remains an explicit release gate rather than an assumed pass

## Not built yet
- school/district calendar import adapters
- account-backed persistence/sync
- Units, Lessons, Notes, Ideas, Shift
- Easel/integrations
- production deployment

## Release wall
Preview builds come from non-main branches and identify branch + commit SHA. GitHub Actions is an independent required verification surface and must build from the committed lockfile. Nothing moves to `main` until the current rebuild passes the agreed product, functional, visual, accessibility, persistence, regression, exact-build, browser-interaction, and dependency-lock gates and is explicitly cleared for release.
