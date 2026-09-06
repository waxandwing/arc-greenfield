# ARC Batch Execution Spine

Effective: 2026-09-06

Implementation proceeds in numbered coherent batches, not isolated one-off tasks, except during audits, urgent Red regressions, safety/data-integrity fixes, or narrowly isolated defects where batching reduces reliability.

## B01 — Week Shell + Spatial Ownership
One canonical desktop Week composition: calendar dominance, tabs, planner/environment separation, edge furniture boundaries, open/closed geometry, whitespace recovery, z-index/layer ownership, no clipping/overlap/duplicate layers, small-laptop baseline.

## B02 — Week Planning Object Hierarchy
Canonical Week object grammar: Class/Section context, Unit spans, Lesson subordination, multiple Lessons/day, Note/Idea forms, non-plan events/After School placement, red Important semantics.

## B03 — Object Selection + Contextual Actions
Selection/focus states, contextual pop-up toolbar, Move, Shift, Copy, Delete, Unplace/Drawer, range edits, guards, stable identity/history.

## B04 — Creation + Quick-Add Flows
Calendar-first Unit/Lesson/Note creation, minimum-required commitment, Full Edit path, range creation, same-day Lesson support, class/course targeting, minimal form chrome.

## B05 — Furniture + Task Bar Composition
Fridge Door, Drawer, Must/Should/Could Task Bar, utility drawers, open/closed states, Clean Up semantics, no calendar squeeze/reflow or dead whitespace.

## B06 — Accessibility + Responsive Interface Hardening
Keyboard/non-drag parity, focus, semantics, WCAG AA, zoom/reflow, small laptop, touch, reduced motion, no color-only meaning, overflow audit.

## B07 — Interaction Engine Reconciliation
Create/edit/move/unplace/delete contracts, Unit/Lesson range truth, Section divergence, fixed anchors, Undo/recovery hooks, cross-view mutation truth and regressions.

## B08 — Persistence + Authenticated State Integrity
One persistence layer for canonical objects and UI state; save/reload; sign-in continuity; two-account isolation; destructive-path safety; Supabase/auth integration boundary.

## B09 — Progressive Setup + School Truth
Non-blocking/resumable setup, NCES identity, official source, Read dates, server extraction, unreviewed proposal, miniature review, explicit commit, early-release/bell review, PDF/CSV fallback, re-import diff, malformed/interrupted setup.

## B10 — Fridge + Capture Workflow
Finite Door, Drawer overflow, capture object types, stacking without semantic mutation, lightweight scheduling, movement parity, Clean Up, discovery, Locate/Find foundation, retained deeper data.

## B11 — Day + Recovery + Live Teaching Continuity
Carryover, planned vs taught truth, teaching states, Recovery/Undo, fixed anchors, Section isolation, collision behavior, Catch-Up Review, Day → Live Classroom → writeback/return.

## B12 — Cross-View Expansion + Release Finishing
Month/Quarter/Semester/Year Map, cross-view truth, Unit span continuity, Monday-first rules, Personal lane, Daily Board projection, dark mode, stress/performance, human beta prep, final Green audits.

## Dependency order
B01 → B02 → B03/B04 → B05/B06 → B07 → B08 → B09 → B10 → B11 → B12.

B03+B04 may be combined when they touch the same objects. B05+B06 may be hardened together after composition stabilizes. Audits run continuously but are not implementation batches.

## Current active batch
B01 — Week Shell + Spatial Ownership.

B02 may be prepared, but it cannot be treated as implementation-complete until B01 is Green.
