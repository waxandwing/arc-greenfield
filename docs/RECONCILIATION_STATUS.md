# Arc reconciliation status

Branch: `codex/reconcile-founder-laws`
Pull request: draft PR #48
Deployment: **blocked; no Vercel deployment or preview deployment authorized**

## Implemented in branch
- Founder laws are repository-local implementation authority.
- No-left-rail shell direction is encoded.
- Fridge and Settings are outer-edge drawer surfaces that do not own calendar width.
- Must Do / Should Do / Could Do is a horizontal Task Bar.
- Task metadata belongs to the same stable planning object used by Fridge and Calendar.
- Legacy Priority records migrate into stable Task Bar objects.
- Week = Mon–Fri by default; Week = Sun–Sat, Sunday-first when weekends are enabled.
- Year attendance display remains Mon–Fri Monday-first.
- Unit/Lesson/Idea-Note Fridge objects have distinct physical grammar.
- Calendar object actions are contextual on selection.
- Fridge supports drag-in and explicit Must/Should/Could movement paths.
- Fridge and Task Bar both have explicit non-drag scheduling paths into Calendar.
- ArcShell now reads and writes canonical workspace/history/selection through the Zustand Arc store.
- Calendar full planning details are hidden behind the intentional contextual `More…` action; Fridge and Task Bar stay simpler.
- Delete is dependency-aware and guarded by confirmation.
- Closing Fridge or Settings restores focus to the exact pull-tab that opened it.
- Resource links in Calendar details are limited to valid http/https URLs.
- Regression tests cover key stable-object and weekday laws.

## Verification history
The prior head passed install, typecheck, tests, production build, and canonical-build-contract checks.

The current head is undergoing the same GitHub verification. No green CI result authorizes deployment.

## Current gate
- Keep PR #48 draft and unmerged.
- Do not deploy to Vercel under any circumstance.
- Keyboard/focus/drag-fallback/reload/Undo/Redo interaction audit is still required.
- Day/class-period projection and class isolation remain unresolved design work.
- Canonical Figma must be reconciled to this implemented shell after the interaction audit.
