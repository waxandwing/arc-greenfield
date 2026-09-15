# Arc Branch Prune Manifest — 2026-09-15

## Decision

`main` is the **single current implementation authority** for Arc.

This audit began with **152 remote branches**. During connector-capability testing, three disposable temporary refs were also created (`ops/repo-prune-2026-09-15`, `noop-check`, `noop-check-2`), bringing the immediate deletion set to the audited branch population plus those temporary refs. Those three refs contain no intended work and must be deleted with the rest.

The goal of this prune is not to erase history. It is to stop historical implementation lanes from competing with current product truth.

## KEEP AS A BRANCH

- `main`

No permanent `develop`, release, preview, design, audit, Cursor, Codex, or feature lane remains authoritative after this prune.

## ARCHIVE TIP AS A TAG, THEN DELETE THE BRANCH

These branches were previously identified as possible behavior donors or milestone snapshots. Their tips should be preserved under `archive/2026-09-15/...` tags before branch deletion:

- `develop`
- `architecture/fridge-scheduling-drag-contracts`
- `archive/audit-cleanup-duplicate-2026-09-03`
- `archive/main-pre-green-2026-09-07`
- `archive/pre-frame-reset-2026-09-02`
- `codex/b00-5-core-prune`
- `codex/day-notes-magnets`
- `codex/day-notes-persistence-slice`
- `codex/founder-laws-active-reconciliation`
- `codex/reconcile-founder-laws`
- `codex/recovery-desk-constitution`
- `easel/develop`
- `feature/day-teaching-continuity`
- `feature/drag-reactive-preview`
- `feature/fridge-door-domain`
- `feature/fridge-door-nondrag-interface`
- `feature/fridge-door-spatial-persistence`
- `feature/fridge-door-stacks-interface`
- `feature/fridge-drag-contract-implementation`
- `feature/month-continuity-interface`
- `feature/object-local-actions-fridge`
- `feature/persistent-priority-depth`
- `feature/quarter-planning-projection`
- `feature/same-day-approval-persistence`
- `feature/same-day-lesson-approval`
- `feature/unified-undo-drag`
- `feature/week-continuity-interface`
- `feature/week-day-hostile-audit`
- `feature/week-day-month-consistency-audit`
- `feature/week-day-planning-projection`
- `rebuild/workspace-operations`
- `release/beta-vertical-slice-20260907`
- `release/production-green-final-20260907`

The archive tags are recovery handles only. They are not implementation authorities and should not be checked out for normal development.

## DELETE AFTER ARCHIVING DONORS

All other remote branches audited on 2026-09-15 are redundant, completed, superseded, temporary, evidence-only, or fully absorbed into `main`.

### Current desk / ArcTable agent lanes verified as absorbed

The following were specifically compared against current `main`; they contain no unique commits that need to remain as active branches:

- `codex/arc-multiprep-arctable-integration`
- `cursor/arc-pass-3-tabs-drawer-43c2`
- `cursor/arctable-desk-functional-b663`
- `cursor/arctable-preview-dismiss-7e26`
- `cursor/demo-reseed-desk-preview-321f`
- `cursor/desk-preview-force-gate-f873`
- `cursor/desk-setup-settings-4234`
- `cursor/desk-surface-authority-ffca`
- `cursor/edit-workspace-stacks-7d95`
- `cursor/fix-arctable-pages-base-f558`
- `cursor/icarus-promotion-pass-0350`
- `cursor/restore-figma-desk-layout-0977`
- `cursor/vertical-slices-desk-audit-b637`

`cursor/desk-material-arctable-ab4e` and `cursor/month-view-rework-ef55` contain isolated earlier/evidence commits but are semantically superseded by the current desk, Month, and ArcTable implementations on `main`; they do not remain implementation authorities.

`cursor/arc-production-integration` is retired as a coordination lane. The desk work is on `main`; keeping a synchronized parallel branch only recreates ambiguity.

### Families to remove

After donor tags are created, remove the remaining branches in these historical families:

- `architecture/*`
- `archive/*`
- `audit/*`
- `checkpoint/*`
- `codex/*`
- `cursor/*`
- `deploy/*`
- `design/*`
- `docs/*`
- `easel/*`
- `feature/*`
- `fix/*`
- `group*/*`
- `integration/*`
- `ops/*`
- `preview/*` and `preview-*`
- `qa/*`
- `rebuild/*`
- `reconcile/*`
- `release/*`
- `develop`

The three cleanup-session temporary refs are included:

- `ops/repo-prune-2026-09-15`
- `noop-check`
- `noop-check-2`

## CODE PRUNE COMPLETED ON MAIN

The branch cleanup exposed a stale internal product seam: ArcTable still delegated core teaching-session and teaching-outcome behavior to files named for the retired Easel product.

That duplication has been removed:

- canonical session logic now lives directly in `src/planning/arcTableSession.ts`
- canonical teaching-outcome logic now lives directly in `src/planning/arcTableTeachingOutcome.ts`
- contracts were renamed to ArcTable
- the obsolete `easelSessionProjection*`, `easelTeachingOutcome*`, and `easelCoreLoop*` files were removed
- current `main` tree contains no Easel source/contract path
- the public ArcTable API stayed stable

The contract suite passed after the migration, including:

- Arc → ArcTable session projection
- ArcTable teaching outcomes
- hostile ArcTable core-loop continuity
- ArcTable live-state, tools, section configuration, desk access, and desk actions

A separate pre-existing typecheck failure was also identified and repaired by removing unnecessary Node-only dependencies from the entry contract and Vite build-stamp fallback.

## GOVERNANCE AFTER PRUNE

1. `main` is current truth.
2. Create a short-lived branch only when isolation is useful.
3. Merge or intentionally abandon it quickly.
4. Delete the branch after its work lands.
5. Preserve historically important donor tips as deliberate archive tags, not permanent parallel branches.
6. Do not create a new standing `develop`, `preview`, `release`, or agent-coordination branch without an explicit product/engineering reason.
7. A historical branch never outranks current Drive product/brand authority or current verified `main`.

## EXECUTION

Use `scripts/prune-remote-branches-2026-09-15.sh` from a current local clone. The script:

- verifies it is pointed at `waxandwing/arc-greenfield`
- fetches/prunes refs
- verifies the audited `main` baseline is present
- creates/pushes archive tags for donor tips that still exist
- deletes every remote branch except `main`
- fetches/prunes again and prints the final branch list

The ChatGPT GitHub connector used for this audit can edit files and refs but does not expose a branch-delete operation, so physical remote branch deletion is intentionally delegated to that one-shot Git script rather than simulated by force-moving refs.
