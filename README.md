# Arc

Greenfield rebuild. Calendar-first. Trust-first.

## Authority
- `main` — release-only. It is not the source for active development.
- `develop` — the only integrated pre-release source of truth.
- `feature/appframe-decomposition` — the only active implementation branch for this foundation pass.
- `archive/pre-frame-reset-2026-09-02` — preserved rollback point.
- every other branch is historical, abandoned, accidental, or reference-only and must not be used as source for new work, previews, audits, or recovery.

Google Drive canonical Product Spec owns product/architecture decisions. Google Drive canonical Brand System owns visual/construction rules. Git history is implementation history. This README is only the repository operating contract.

Do not add duplicate handoff, audit, blueprint, or design-system documents here.

## Current redevelopment position
The newer constrained rebuild order is authoritative when it conflicts with the older phase list:

frame/shell → navigation → calendar truth → movement/recovery → Day/Easel continuity → integrations → visual polish/secondary systems.

Integrated through `develop`:
- trustworthy shell and six calendar horizons;
- explicit school-calendar truth, terms, navigation, and local declaration persistence;
- real Course/Section setup;
- Unit and Lesson domain/editing foundations with per-Section delivery state;
- recovery consequence preview;
- explicit Section-scoped Shift Apply, local persistence, reload-safe Undo, and hostile recovery preflight;
- exact same-day collision approval domain only.

Not yet complete:
- auth and account isolation;
- landing-view preference persistence;
- Unit/Lesson rendering as actual planning objects across calendar horizons;
- Day as a real teaching-continuity surface;
- Easel continuity;
- Notes, Ideas, Unit Focus, Must/Should/Could, Tack, Extend, filters, Year markers;
- account-backed/Drive persistence and reconciliation;
- browser-driven keyboard/touch/responsive release verification.

The old `feature/same-day-approval-persistence` branch is abandoned/reference-only. Its unintegrated persistence work was intentionally stopped after audit showed it was over-engineering an exception before the primary calendar planning loop is rendered. Same-day stacking remains collision-safe by default; its already-integrated exact approval domain may be completed later when ordinary calendar planning can expose the real teacher action that needs it.

## Code ownership map
Keep responsibilities discoverable. New subsystems must enter through the correct boundary rather than accumulating in the shell.

- `src/components/AppFrame.tsx` — composition only. It assembles the shell and connects callbacks. Do not put persistence, domain validation, recovery math, or feature-specific business rules here.
- `src/app/useArcWorkspace.ts` — canonical workspace state transitions and the coordination of validated saves. If this begins owning a new product subsystem such as Ideas, Easel, auth, or Notes, create a dedicated app/domain boundary instead of extending it indefinitely.
- `src/app/workspaceBootstrap.ts` — restore order and initial persistence notices only.
- `src/app/shiftReconciliation.ts` — cross-layer policy for preserving or dropping Shift/Undo state when upstream planning changes.
- `src/app/useWorkspaceMode.ts` — one temporary workspace mode. Do not reintroduce independent editor booleans that can disagree.
- `src/components/WorkspaceStage.tsx` — selects which calendar/editor/recovery surface is rendered. It does not own their data rules.
- `src/components/CalendarStageHeader.tsx` — calendar-stage controls and action entry points only.
- `src/components/CalendarViewRail.tsx` — calendar horizon navigation only.
- `src/calendar/**` — school-calendar truth and projections.
- `src/planning/**` — Course/Section/Unit/Lesson/delivery/recovery/Shift domain rules and persistence boundaries.

Guardrail: a UI composition file should not become a second state store. A controller should not absorb unrelated domains just because it already has access to their state. Prefer a clear new boundary over another conditional inside an existing large file.

## Operational findings
- Every preview/build must expose the exact Git commit fingerprint.
- GitHub Actions is the canonical source/build gate and runs read-only from the committed lockfile.
- Vercel remains the intended preview platform.
- A legacy Cloudflare Workers GitHub integration is still attempting builds on this repository. It is not Arc authority and must be disconnected outside this repository; its status must not be mistaken for the Arc verification gate.
- `main` and `develop` are policy-governed but are not currently technically protected by the accessible GitHub configuration. Branch protection/rulesets remain an external repository-admin cleanup item.

## Core rules
- calendar remains the center of the product;
- one shared Course/Unit/Lesson plan; Sections carry actual teaching state;
- missing delivery state means `not-started`; divergence stays sparse;
- calendar truth is explicit; missing dates are never silently instructional;
- preview before consequence; no silent loss; fixed dates stay fixed;
- recovery reads the Section's effective live schedule, including persisted Section overrides;
- completed/skipped work is not future recovery pressure and cannot be moved by recovery Shift;
- ordinary same-day live collisions remain invalid unless an exact teacher approval exists;
- Shift binds to the exact reviewed effective `fromDate`; stale reviews cannot apply;
- Shift changes only the target Section schedule; shared Lessons and unrelated Sections remain untouched;
- Undo is Section-scoped and refuses to overwrite newer work;
- destructive upstream edits fail rather than orphan or silently repair downstream state;
- no fake controls, fake source data, fake saves, or fake deployment claims.

## Verification
- exact dependency versions are locked in `package-lock.json`;
- CI installs only with `npm ci`;
- `npm run build` requires the full domain contract suite, TypeScript compile, and Vite production bundle;
- contract manifest lives in `tests/run-contracts.mjs`;
- no feature branch advances to `develop` without an exact-head green gate;
- `develop` must pass again after integration;
- browser interaction is a separate release gate and is never inferred from source/build success.

## Next authorized work
1. integrate this verified AppFrame foundation refactor;
2. render real Units/Lessons across calendar horizons, beginning with Week/Day planning truth;
3. build Day/Easel teaching continuity from that same state;
4. restore missing platform obligations: auth/account isolation and account/Drive persistence before external beta;
5. only then resume secondary exception systems such as teacher-facing same-day stacking, Tack/Extend, Ideas, priorities, and filters as their primary workflows require them.

## Release wall
Nothing moves to `main` until product, functional, visual, accessibility, persistence, account-isolation, regression, exact-build, browser-interaction, and dependency-lock gates are explicitly cleared.
