# Arc reconciliation status

Branch: `codex/reconcile-founder-laws`
Pull request: draft PR #48
Deployment: **blocked; no Vercel deployment or preview deployment authorized**

## Implemented in branch
- Founder laws are repository-local implementation authority.
- No-left-rail shell direction is encoded.
- Fridge and Settings are outer-edge drawer surfaces.
- The calendar no longer sits beside the prior Ideas/Priority workbench in ArcShell.
- Must Do / Should Do / Could Do is a horizontal Task Bar.
- Task metadata belongs to the same stable planning object used by Fridge and Calendar.
- Legacy Priority records migrate into stable Task Bar objects.
- Week display is driven by persisted SchoolCalendar.weekendsVisible.
- Week = Mon–Fri by default; Week = Sun–Sat, Sunday-first when weekends are enabled.
- Year attendance display helper remains Mon–Fri Monday-first.
- Unit/Lesson/Idea-Note Fridge objects have distinct physical grammar.
- Calendar object actions are contextual on selection.
- Fridge supports drag-in and explicit Must/Should/Could movement paths.
- Fridge has an explicit non-drag Schedule path into Calendar.
- Task Bar has an explicit non-drag Schedule path into Calendar.
- Scheduling preserves the same stable object and retained rich data.
- ArcShell now reads and writes canonical workspace/history/selection through the Zustand Arc store rather than owning a second component-local workspace state.
- Undo/Redo and persistence are routed through that same client state owner.
- Regression tests cover stable ID/rich-data retention across Fridge → Task Bar → Calendar.

## Verification history
A full GitHub verification run passed typecheck, tests, production build, and canonical-build-contract checks before the latest scheduling and state-owner commits.

The current head must receive its own green verification before any merge decision.

## Current gate
- Keep PR #48 draft and unmerged.
- Do not deploy to Vercel under any circumstance.
- Do not treat a successful GitHub build as deployment permission.
- Remaining architectural work includes richer Calendar editing and the full interaction/a11y audit.

## Next after current green CI
1. Add progressive full-detail Calendar editing while keeping Fridge/Task surfaces simplified.
2. Audit focus return, Escape, keyboard movement, reduced motion, reload, Undo/Redo, and object identity.
3. Reconcile the resulting shell back into the canonical Figma desktop frame.
