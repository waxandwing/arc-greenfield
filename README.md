# Arc

Greenfield rebuild. Calendar-first. Trust-first.

## Authority
- `main` — release-only.
- `develop` — integrated pre-release source of truth.
- current `feature/*` — active implementation only.
- `archive/pre-frame-reset-2026-09-02` — preserved rollback point.
- all other branches are historical and non-authoritative.

Google Drive canonical Product Spec owns product/architecture decisions. Google Drive canonical Brand System owns visual/construction rules. Git history is implementation history. This README is only the repository operating contract.

Do not add duplicate handoff, audit, blueprint, or design-system documents here.

## Current system boundary
Calendar truth → Courses/Sections → Units → Lessons → per-Section delivery state → recovery consequence preview → explicit recovery resolution → Section-specific atomic Shift → persisted Section schedule + reload-safe whole-operation Undo → explicit same-day approval domain.

Current gate: the same-day Lesson approval domain is integrated in `develop`. Ordinary live collisions remain errors by default. An approval is exact to one Section, one confirmed instructional date, and one exact Lesson set. Persistence ownership and teacher-facing approval controls remain blocked until approval state can survive Apply, Undo, reload, and upstream reconciliation without loss.

Core rules:
- one shared Course/Unit/Lesson plan; Sections carry actual teaching state.
- missing delivery state means `not-started`; divergence stays sparse.
- calendar truth is explicit; missing dates are never silently instructional.
- recovery reads the Section's effective live schedule, including persisted Section overrides.
- completed/skipped work is not future recovery pressure and cannot be moved by recovery Shift.
- fixed Lessons are anchors; an interrupted fixed Lesson is blocked before an Apply operation is offered.
- recovery resolution offers only confirmed instructional dates inside the affected Lesson's Unit and after the resume date.
- ordinary same-day live collisions remain invalid unless the teacher explicitly approves that exact Section/date/Lesson set.
- same-day approval does not carry to another date, another Section, or an expanded Lesson set.
- same-day approval requires a confirmed instructional date.
- Shift recognizes an exact same-day approval but does not create, infer, broaden, or delete approval state.
- completed/skipped Lessons do not create future collision pressure in Shift or schedule integrity.
- an unscheduled interrupted Lesson may recover from `null` placement without inventing a prior date.
- Shift binds to the exact reviewed effective `fromDate`; stale reviews cannot apply.
- Shift is explicit and atomic: every unapproved collision must be resolved or nothing applies.
- Shift may change only the target Section schedule; shared Lessons and unrelated Sections remain untouched.
- after successful Apply, Arc returns to the calendar where the one available Undo is immediately visible.
- Undo is scoped to the affected Section and refuses to overwrite newer work in that Section.
- durable Section schedule state outranks Undo capability; reload distinguishes no Undo, restored Undo, and discarded unsafe Undo.
- destructive upstream edits must fail rather than orphan or silently repair downstream teaching state.

## Verification
- exact dependency versions are locked in `package-lock.json`.
- CI is read-only and installs only with `npm ci`.
- `npm run build` requires the full domain contract suite, TypeScript compile, and Vite production bundle.
- contract manifest lives in `tests/run-contracts.mjs`.
- recovery has an end-to-end contract covering preview → explicit resolution → Apply → persistence → reload → no duplicate Apply → Undo.
- recovery destination preflight has a separate hostile contract for fixed/live occupancy, closures, completed work, forward-only dates, and duplicate destinations.
- same-day approval has a contract proving default collision failure, exact-set permission, date/Section/set non-transfer, confirmed-date requirement, Shift recognition, and finished-work collision exclusion.
- no feature branch advances to `develop` without an exact-head green gate.
- `develop` must pass again after integration.

## Open gates
- same-day approval persistence with one explicit state owner; current Shift persistence does not yet store approvals.
- teacher-facing same-day approval creation/removal after persistence is proven.
- Unit/Lesson rendering across calendar horizons.
- browser-driven keyboard/click/responsive verification of Apply/Undo and the broader shell.
- account-backed persistence/sync, integrations, and production release.

## Release wall
Nothing moves to `main` until product, functional, visual, accessibility, persistence, regression, exact-build, browser-interaction, and dependency-lock gates are explicitly cleared.
