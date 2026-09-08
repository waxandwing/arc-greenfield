# Group 5 GitHub prune audit — 2026-09-08

## Current authorities

- `main` — protected production branch.
- `develop` — protected planner integration authority at the time of audit.
- `group1/calendar-shell-current-visuals` — active, Visual Red, not integration-clear.
- `group2/furniture-fixed-composition-2026-09-07` — active, requires exact-head re-verification after head movement.
- `group3/object-visual-grammar` — active, requires exact-head re-verification after head movement.
- `group4/entry-gate-access` — active recovered gate/access branch.
- `group5/qa-preview-steward` — QA evidence only.
- `integration/group1-group2-furniture-corrected` — retain until its provenance and purpose are reconciled with active Group 1/2 work.

## Immediate PR cleanup completed

Closed without merge because they were obsolete/superseded and could be mistaken for current authority:

- PR #98 — B07 post-merge audit follow-up.
- PR #100 — superseded visual-authority shell/furniture candidate.
- PR #101 — failed/superseded deployment beta vertical slice.

Kept open:

- PR #102 — Group 3.
- PR #103 — Group 2.
- PR #104 — Group 1; currently not integration-clear.

## Ownership collision found

PR #104 currently changes `src/components/B01Furniture.tsx` and imports `src/styles/bug023-taskbar-clearance.css`. That crosses the previously enforced Group 1 / Group 2 boundary. Group 5 left a review comment requiring the furniture-owned implementation to move back to Group 2 or an integration-only branch. Visual acceptance remains Red.

## Exact duplicate branch refs — high-confidence prune candidates

These branch names point to identical SHAs. Retain at most one meaningful/archive pointer per SHA and delete the redundant names after confirming no open PR depends on them.

### SHA `7da6b5f495e87dd1f6b9558dd43a10b93edd853c`
Retain temporarily: `codex/merge-safety-backup`
Prune candidates:
- `codex/ignore-this-backup`
- `codex/merge-safety-backup-2`
- `codex/merge-test`
- `codex/merge-test-2`
- `codex/merge-test-3`

### SHA `83727b69f75a7394dd681f18e19dfd27dab2ae62`
Retain temporarily: `feature/interface-day-continuity`
Prune candidates:
- `audit/day-interface-hostile-two-pass`
- `audit/day-interface-hostile-two-pass-2`

### SHA `1bde71858850aef23df0ed46782efd7940d36b74`
Retain temporarily: `feature/object-actions-final`
Prune candidates:
- `feature/easel-continuity`
- `feature/object-actions`
- `feature/object-actions-final-2`
- `feature/object-actions-final-3`
- `feature/object-actions-final-4`
- `feature/object-actions-impl-check`
- `feature/object-actions-temp`

### SHA `293aaddddcc5a1931f150f209e54b6839c1f9ee6`
Retain: `archive/audit-cleanup-duplicate-2026-09-03`
Prune candidates:
- `feature/redevelopment-audit-cleanup-2`
- `feature/redevelopment-audit-cleanup-final`
- `feature/redevelopment-audit-cleanup-temp`

### SHA `f36e6af0ae763ddf9b0ca316d0803d981ce9d811`
Retain temporarily: `feature/architecture-verification-run`
Prune candidate:
- `feature/architecture-verification-mirror`

### SHA `3660ec41620502bcfe962076e821a7a48cdd95ba`
Retain temporarily: `feature/recovery-shift-operation`
Prune candidate:
- `feature/shift-persistence`

### SHA `fadb208f8284f1bbc7788444e07988a3a280f7ee`
Retain: `archive/pre-frame-reset-2026-09-02`
Prune candidate:
- `preview/phase-1`

### SHA `224e66a6a93447ea1930c5806c47b70e4c866ac1`
Retain: protected `develop`
Prune candidates:
- `deployment/audit-current`
- `noop-temp-check`

## Historical branches requiring containment/unique-commit review before deletion

Do not delete solely from the branch name. Several merged feature branches were moved after their merge and may carry unique post-merge commits. Examples include `design/b02-week-planning-object-hierarchy`.

Review before prune:
- old `design/b01-*`, `design/b02-*`, `design/b03-*`, `design/b05-b06-*`
- `feature/*` progression branches
- `fix/*` follow-up branches
- `audit/*` final passes
- `release/*` and `deploy/*`
- `preview/*`
- `codex/*` reconciliation branches

## Production/history pointers to preserve until final release cleanup

- `archive/main-pre-green-2026-09-07`
- `archive/pre-frame-reset-2026-09-02`
- current protected `main`
- current protected `develop`
- current Group 1–5 branches

## Code-prune audit status

A first default-branch search found no direct textual matches for retired terms such as old left rail / seven-day / split-pane Fridge. This is not sufficient to declare runtime code clean. The next code pass must inspect imports, CSS layering, unreachable components, stale assets, old deployment seams, and duplicate workflows on current `develop` separately from branch pruning.

## Rule going forward

No branch may be treated as authority by name alone. Authority requires exact SHA + branch relationship + evidence. Merged branches should not continue receiving unrelated commits. QA or integration fixes that cross ownership boundaries belong on an integration branch, not inside another group's product branch.
