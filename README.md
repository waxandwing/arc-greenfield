# Arc

Clean frame-first rebuild.

## Branch contract
- `main` — release-ready only
- `develop` — integrated pre-release work
- `feature/*` — active implementation
- `archive/pre-frame-reset-2026-09-02` — preserved rollback point

## Current build scope
Frame + navigation + calendar truth foundation.

Implemented:
- global shell geometry and canonical brand tokens
- responsive calendar stage and overlay layer
- accessibility baseline
- one canonical calendar-view state owner
- Year Map / Semester / Quarter / Month / Week / Day navigation
- functional Arc home action returning to Month
- canonical `SchoolCalendar` domain model
- explicit day kinds: instructional / no-school / teacher-workday / holiday / break / unknown
- source/confidence fields for calendar-day provenance
- timezone-safe ISO date math
- next/previous instructional-day movement
- instructional-day range calculation
- quarter/semester boundary lookup
- structural calendar validation
- readiness preflight that blocks structural planning when calendar days are unknown
- dependency-free calendar contract test via `npm run test:calendar`

Calendar truth rule: a missing day is `unknown`, never silently assumed to be instructional.

Intentionally excluded:
- school/district data ingestion UI
- calendar rendering logic
- previous/next/today period controls
- Units, Lessons, Notes, Ideas, Shift UI, Search, Help, Profile
- landing-preference persistence
- Easel and integrations
- production deployment

No production deployment belongs in this pass.
