# ARC COO Green-Gate Program

Status owner: product/operations
Effective: 2026-09-06

## Purpose
Keep product, UI, UX, frontend, backend, and Git moving in one direction while preventing silent drift. Arc does not advance by feature count. It advances only when the current gate is Green.

## Authority order
1. ARC — MASTER OPERATING DOCUMENT — Current Truth + Build Plan
2. ARC — Canonical Product Spec — Greenfield Rebuild
3. ARC — Desktop Interaction Blueprint — Canonical Handoff
4. ARC — Canonical Brand System & Construction Rules
5. Current approved implementation on the active Green-gate branch
6. Historical prototypes/screenshots only when explicitly promoted by the canonical documents

When sources conflict, stop and reconcile. Never pick the newest-looking artifact by default.

## Current sequence
### G1 — Canonical Desktop Week
Goal: one structurally correct desktop Week view.

Required before Green:
- Calendar is the structural center.
- No permanent left rail.
- Class > Unit > Lesson hierarchy is visually and structurally correct.
- Units spanning multiple days render as one continuous range/bar, not repeated disconnected objects.
- Lessons remain subordinate to their Unit relationship.
- Notes remain square/post-it-like and can support column-like freeform teacher notes.
- Furniture opens/closes without leaving dead structural whitespace or covering calendar content.
- No object is accidentally nested inside unrelated furniture or panels.
- Layering/z-index is audited; no hidden, clipped, duplicate, or baked-looking layers.
- Desktop preview is visually inspected before review/share.
- No feature additions inside G1 unless required to satisfy canonical Week behavior.

### G2 — Interaction truth
After G1 Green only:
- create/edit/delete
- drag/move
- resize/range edits
- Unit/Lesson nesting behavior
- accessible keyboard movement
- undo contract
- no contradictory object state between visible UI and model

### G3 — Persistence model
After G2 Green only:
- account/teacher
- school and schedule
- classes
- units
- lessons
- notes
- date/range truth
- furniture state
- settings
- history/undo strategy

### G4 — Supabase/auth persistence
Pass condition: create > save > reload > sign back in > exact state remains; two-account isolation passes.

### G5 — Backend services
Reintroduce Phase 3 acquisition/review work only through guarded proposal boundaries. External calendar/school data may propose; it may not silently become planner truth.

### G6 — View expansion
Week reference implementation informs Month, Quarter, Year, Day. Shared object rules; no view-specific reinvention of Unit/Lesson semantics.

## UI/UX reconciliation gate
Every UI or UX change must be checked against both:
- interaction consequence (what the teacher can understand/do), and
- structural consequence (DOM/component ownership, nesting, range truth, persistence impact).

A visually attractive change is Red if it breaks object truth, hierarchy, accessibility, or persistence.
A functionally correct change is Red if the interface miscommunicates hierarchy or makes the planner feel like panels/forms rather than Arc.

## Discrepancy protocol
Any discovered discrepancy becomes an explicit tracked item before more work proceeds in the affected area.
Severity:
- RED: structural contradiction, data-loss risk, wrong hierarchy, inaccessible core path, source-of-truth conflict, hidden/overlapping UI, incorrect persistence.
- YELLOW: usable but inconsistent, visually misleading, incomplete state, polish/spacing issue that may compound.
- GREEN: canonical, tested, visually audited, and safe to reuse.

For each discrepancy record:
- observed behavior
- canonical expected behavior
- impacted layer(s): UX/UI/frontend/model/backend/persistence
- severity
- owner/workstream
- fix
- retest evidence

## Merge rules
- Main is not a scratchpad.
- Feature experiments stay isolated.
- No merge into the active reference path while a related Red discrepancy remains unresolved.
- Any PR touching Week structure must include a canonical-law checklist in its description.
- Any PR changing object semantics must identify persistence/schema impact.
- Any PR changing hierarchy must be reviewed from both UI and UX perspectives.

## Definition of Green for G1
G1 is Green only when the Week screen is simultaneously:
1. visually faithful,
2. structurally/nestingly correct,
3. understandable without explanation,
4. free of overlap/clipping/phantom whitespace,
5. consistent with canonical documents,
6. safe to use as the reference implementation for later views.
