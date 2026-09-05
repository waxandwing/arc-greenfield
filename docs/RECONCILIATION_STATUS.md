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
- Regression tests cover stable ID/rich-data retention across Fridge → Task Bar → Calendar.

## Current gate
Do not merge until GitHub Verify Arc Greenfield passes typecheck, tests, and build on the current head.

## Next after green CI
1. Add a non-drag Fridge → Calendar scheduling chooser.
2. Complete Task Bar → Calendar non-drag scheduling path.
3. Migrate ArcShell workspace ownership from component-local history to the prepared Zustand Arc store in a controlled pass.
4. Add progressive full-detail Calendar editing while keeping Fridge/Task surfaces simplified.
5. Audit focus return, Escape, keyboard movement, reduced motion, reload, Undo/Redo, and object identity.
6. Reconcile the resulting shell back into the canonical Figma desktop frame.
