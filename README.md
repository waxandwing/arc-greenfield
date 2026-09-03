# Arc

Clean frame-first rebuild.

## Branch contract
- `main` — release-ready only
- `develop` — integrated pre-release work
- `feature/*` — active implementation
- `archive/pre-frame-reset-2026-09-02` — preserved rollback point

## Current build scope
Frame + navigation + calendar truth + projections + render skeleton + hydration boundary.

Implemented:
- global shell geometry and canonical brand tokens
- responsive calendar stage and overlay layer
- accessibility baseline
- one canonical calendar-view state owner
- Year Map / Semester / Quarter / Month / Week / Day navigation
- functional Arc home action returning to Month
- canonical `SchoolCalendar` domain model
- explicit day kinds: instructional / no-school / teacher-workday / holiday / break / unknown
- source/confidence provenance for every calendar day
- timezone-safe ISO date math
- next/previous instructional-day movement
- instructional-day range calculation
- quarter/semester boundary lookup
- structural calendar validation
- readiness preflight that blocks structural planning when dates are unknown or not confirmed
- one pure projection layer for Day / Week / Month / Quarter / Semester / Year Map
- Monday-aligned week and month-grid calculations
- projection flags for weekend and school-year membership without changing calendar truth
- rendered calendar components for all six horizons, ready to consume real canonical calendar state
- honest unconfigured state when no real calendar has been supplied
- explicit hydration boundary that expands a declared instructional-week pattern across school-year bounds
- exception overrides with provenance preservation and duplicate/out-of-range rejection
- one public calendar-domain API through `src/calendar/index.ts`
- calendar truth, projection, and hydration contract tests gated into every build

Calendar truth rule: a missing day is `unknown`, never silently assumed to be instructional.

Hydration rule: Arc may expand only a weekday pattern that a teacher/source explicitly declares. Exceptions override that pattern. No undeclared weekday assumption becomes calendar truth.

Readiness rule: complete-looking is not enough. Structural planning requires every school-year date to be explicit and confirmed.

Projection rule: every calendar horizon is derived from the same `SchoolCalendar`; views may change presentation, never date truth.

Live-workspace rule: fabricated render fixtures never appear in the actual Arc shell. Until real calendar state exists, the shell says that calendar setup is required.

Intentionally excluded:
- school/district import adapters and setup UI
- persisted calendar storage
- previous/next/today period controls
- Units, Lessons, Notes, Ideas, Shift UI, Search, Help, Profile
- landing-preference persistence
- Easel and integrations
- production deployment

No production deployment belongs in this pass.
