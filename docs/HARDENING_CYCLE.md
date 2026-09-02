# Arc Hardening Cycle

## Protected baseline

- Branch: `rebuild/workspace-operations`
- Known-good SHA: `2b3d88041c56df751e198b1fcee4a05015ba378e`
- Verify run: `#423`
- Status at hardening start: typecheck, unit/integration, production build, Chromium rendered checks, rendered evidence upload, and canonical build contract all green.

This SHA is the rollback point for the hardening cycle. New work must move forward from it; do not rewrite or replace it with a prior Arc build.

## Hardening lanes

1. Visual and UI hierarchy
2. Large-workspace performance
3. Day and Recovery refinement
4. Hostile beta and accessibility release gate

## Rules

- Calendar remains the center of Arc.
- No feature expansion during the visual hardening lane.
- No silent loss.
- Fixed dates remain fixed.
- Collision checks happen before consequence.
- Every meaningful hardening pass receives the full exact-head verification gate.
- A failing gate is repaired before the next lane advances.
- Production stays untouched until the release candidate is explicitly approved.
