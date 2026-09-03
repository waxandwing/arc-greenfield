# Arc

Clean frame-first rebuild.

## Branch contract
- `main` — release-ready only
- `develop` — integrated pre-release work
- `feature/*` — active implementation
- `archive/pre-frame-reset-2026-09-02` — preserved rollback point

## Current build scope
Frame + navigation only.

Implemented:
- global shell geometry
- canonical brand tokens
- responsive calendar stage
- overlay layer for future secondary tools
- accessibility baseline
- one canonical calendar-view state owner
- Year Map / Semester / Quarter / Month / Week / Day navigation
- functional Arc home action returning to Month
- desktop rail and horizontally scrollable mobile bottom navigation

Intentionally excluded:
- calendar data or date logic
- previous/next/today controls
- Ideas, Shift, Search, Help, Profile
- persistence of landing preference
- Easel and integrations
- production deployment

No production deployment belongs in this pass.
