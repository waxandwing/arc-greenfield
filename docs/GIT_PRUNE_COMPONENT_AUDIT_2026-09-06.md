# Arc Git Prune + Component Audit — 2026-09-06

## Authority
- Repository: `waxandwing/arc-greenfield`
- Current implementation authority: protected `develop @ c72976ca3a0919cedbdeb4d4dc7896ac30678614`
- `main` is not the active implementation line.
- No Vercel deployment is authorized.

## Git hygiene snapshot
- Open pull requests: **0** at audit start.
- Branch refs discovered: **126**.
- The branch count is materially higher than needed for active development and obscures the canonical path.

## Keep active
These branches have a current operating purpose:
- `develop`
- `design/b01-canonical-week-asset-match`
- `ops/coo-green-gate-program`
- `ops/git-prune-component-audit-2026-09-06` (temporary audit branch; delete after merge/closure)

## Keep as explicit mining/archive evidence
Do not merge wholesale. Retain only because the Master or current work still names them as mining/reference sources:
- `main`
- `codex/reconcile-founder-laws`
- `codex/b00-5-core-prune`
- `architecture/fridge-scheduling-drag-contracts`
- `codex/day-notes-magnets`
- `codex/day-notes-persistence-slice`
- `archive/audit-cleanup-duplicate-2026-09-03`
- `archive/pre-frame-reset-2026-09-02`

## Safe branch-deletion families after confirming GitHub retains merged/closed PR history
These branch families are superseded by merged work, duplicated audit reruns, scratch merge testing, or completed milestone branches. They should not remain in the active branch picker once branch deletion is performed by an owner/admin surface.

### Completed Phase 1/2/3 implementation branches
- `design/phase1-shell-art-direction`
- `design/phase2-behavior-ui-brand-gate`
- `design/phase2-planning-ui-gate`
- `fix/calendar-monday-alignment`
- `fix/persisted-home-view`
- `fix/phase1-shell-semantics`
- `feature/phase2-*`
- `feature/phase3-*`
- completed `feature/calendar-*`, `feature/course-section-setup`, `feature/unit-*`, `feature/lesson-*`, and completed recovery/shift implementation branches whose results are already represented on `develop` and in closed PRs

### Scratch / backup / merge-test families
- `codex/ignore-this-backup`
- `codex/merge-safety-backup*`
- `codex/merge-staging`
- `codex/merge-test*`
- `feature/redevelopment-audit-cleanup*`
- `preview-repair-2026-09-03`

### Duplicate audit reruns
- `audit/day-interface-hostile-two-pass*`
- `feature/architecture-verification-*`
- `feature/object-actions-final*`
- `feature/object-actions-impl*`
- other numbered/final/temp rerun branches where the exact accepted result is already merged and the closed PR retains the audit record

## Review before branch deletion
These names imply deferred behavior that may still be useful when its canonical phase opens. Do not delete until the relevant future workstream confirms the donor has been mined or is unnecessary:
- `feature/fridge-*`
- `feature/object-local-actions-fridge`
- `feature/persistent-priority-depth`
- `feature/same-day-*`
- `feature/unified-undo-drag`
- `feature/drag-reactive-preview`
- `feature/day-teaching-continuity`
- `feature/month-continuity-interface`
- `feature/quarter-planning-projection`
- `feature/week-continuity-interface`
- `feature/week-day-*`
- `easel/develop` (legacy terminology; preserve only until any unique historical evidence is explicitly mined)

## Runtime/component audit

### Composition chain
`src/main.tsx` → `App.tsx` → `AppFrame.tsx` → `WorkspaceStage.tsx` → canonical setup/recovery/calendar surfaces.

`AppFrame` owns composition/navigation integration and delegates persistent planning state to `useArcWorkspace`; `WorkspaceStage` is a mode router, not an independent state store.

### Confirmed reachable component families
- Calendar shell/navigation: `AppFrame`, `CalendarStageHeader`, `CalendarViewRail`, `CalendarViewPreferences`
- Calendar projections: `CalendarProjectionView`, `CalendarProjectionPrimitives`, `PlanningWeekDayView`, `PlanningMonthView`, `PlanningDayContinuityView`
- Setup: `CalendarSetup`, `TermBoundarySetup`, `ClassSetup`, `UnitSetup`, `LessonSetup`
- Recovery: `RecoveryReview`
- Phase 3 official-source acquisition/review components are reachable through the setup path and protected by dedicated browser workflows.

### Dead runtime residue removed in this audit
- `src/styles/buildFingerprint.css`
- its unconditional import from `src/main.tsx`

The BuildFingerprint component was previously retired, so retaining and globally loading its stylesheet served no live component.

## Enforcement added on audit branch
`tsconfig.app.json` now fails typecheck on:
- unused locals
- unused parameters
- switch fallthrough
- inconsistent file-name casing

This turns dead-code detection into a standing compiler gate rather than an occasional manual cleanup.

## Functional evidence required before merge
The audit branch must pass the same current repository gates as `develop`:
- contracts
- typecheck (including the stricter unused-code rules)
- production bundle build
- browser/accessibility gate
- frozen Phase 2 planning truth / recovery / keyboard parity gates
- applicable Phase 3 setup/source-review gates

No component is to be called Green solely because it compiles. Existing direct rendered gates remain the behavioral proof.

## Git deletion limitation
The connected GitHub tool surface used for this audit can close PRs, edit code, create/update branch refs, and inspect comparisons, but it does not expose branch-ref deletion. Therefore this pass prunes the active merge surface and runtime tree, and provides an explicit deletion matrix for the remaining stale branch refs. Branch deletion must be performed through a GitHub owner/admin surface that supports deleting refs.
