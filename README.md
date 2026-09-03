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
Frame → navigation → calendar truth → projections → rendering → hydration → teacher calendar setup → persisted calendar restore → safe period navigation.

Implemented:
- global shell geometry and canonical brand tokens
- responsive calendar stage and accessibility baseline
- Year Map / Semester / Quarter / Month / Week / Day navigation
- one canonical `SchoolCalendar` domain model
- explicit instructional / no-school / workday / holiday / break / unknown states
- source + confidence provenance
- timezone-safe date math
- instructional-day movement and ranges
- quarter / semester boundary lookup
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
- calendar truth, projection, hydration, persistence, and navigation contracts gated into every build

## Standing calendar rules
- Missing dates are `unknown`, never silently instructional.
- Arc expands only a weekday pattern explicitly declared by a teacher/source.
- Complete-looking is not enough; structural planning requires confirmed truth.
- Every view derives from the same calendar state.
- Editing reopens the original declarations; Arc does not reverse-engineer a pattern.
- Persistence stores declarations, not hydrated runtime objects.
- Reloaded data must validate again before Arc uses it.
- Period navigation never invents unavailable years or term boundaries.

## Not built yet
- school/district import adapters
- term-boundary editing UI
- account-backed persistence/sync
- Units, Lessons, Notes, Ideas, Shift
- Easel/integrations
- production deployment

## Release wall
Preview builds come from non-main branches and identify branch + commit SHA. Nothing moves to `main` until the current rebuild passes the agreed product, functional, visual, accessibility, persistence, regression, and exact-build gates and is explicitly cleared for release.
