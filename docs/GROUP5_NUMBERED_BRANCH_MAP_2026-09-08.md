# Group 5 numbered branch map — 2026-09-08

Use this file for manual GitHub cleanup. Branches are not numbered by GitHub, so the labels below are the cleanup sequence.

## KEEP

- KEEP-001 `develop` — protected current planner integration authority.
- KEEP-002 `main` — protected production authority.
- KEEP-003 `group1/calendar-shell-current-visuals` — active Group 1, Visual Red, not integration-clear.
- KEEP-004 `group2/furniture-fixed-composition-2026-09-07` — active Group 2; current head requires fresh exact-head QA.
- KEEP-005 `group3/object-visual-grammar` — active Group 3; current head requires fresh exact-head QA.
- KEEP-006 `group4/entry-gate-access` — active recovered gate/access branch.
- KEEP-007 `group5/qa-preview-steward` — QA/governance evidence only.
- KEEP-008 `integration/group1-group2-furniture-corrected` — active integration review authority for cross-owner shell + furniture work; PR #106.

## ARCHIVE / DO NOT DELETE YET

- ARCHIVE-001 `archive/main-pre-green-2026-09-07` — production-history pointer.
- ARCHIVE-002 `archive/pre-frame-reset-2026-09-02` — pre-frame-reset evidence/donor pointer.
- ARCHIVE-003 `archive/audit-cleanup-duplicate-2026-09-03` — retained representative for cleanup SHA `293aadd...`.
- ARCHIVE-004 `codex/merge-safety-backup` — retained representative for duplicate SHA `7da6b5...` until donor review completes.
- ARCHIVE-005 `feature/interface-day-continuity` — retained representative for duplicate SHA `83727b...` until donor review completes.
- ARCHIVE-006 `feature/object-actions-final` — retained representative for duplicate SHA `1bde718...` until donor review completes.
- ARCHIVE-007 `feature/architecture-verification-run` — retained representative for duplicate SHA `f36e6af...` until historical verification cleanup completes.
- ARCHIVE-008 `feature/recovery-shift-operation` — retained representative for duplicate SHA `3660ec...` until donor review completes.

## DELETE — VERIFIED

Delete only the branch name shown. Every item below is either an exact duplicate ref or its full head is already contained in protected `develop`.

- DELETE-001 `codex/ignore-this-backup` — duplicate of retained `codex/merge-safety-backup` at `7da6b5...`.
- DELETE-002 `codex/merge-safety-backup-2` — duplicate at `7da6b5...`.
- DELETE-003 `codex/merge-test` — duplicate at `7da6b5...`.
- DELETE-004 `codex/merge-test-2` — duplicate at `7da6b5...`.
- DELETE-005 `codex/merge-test-3` — duplicate at `7da6b5...`.
- DELETE-006 `audit/day-interface-hostile-two-pass` — duplicate of retained `feature/interface-day-continuity` at `83727b...`.
- DELETE-007 `audit/day-interface-hostile-two-pass-2` — duplicate at `83727b...`.
- DELETE-008 `feature/easel-continuity` — duplicate of retained `feature/object-actions-final` at `1bde718...`.
- DELETE-009 `feature/object-actions` — duplicate at `1bde718...`.
- DELETE-010 `feature/object-actions-final-2` — duplicate at `1bde718...`.
- DELETE-011 `feature/object-actions-final-3` — duplicate at `1bde718...`.
- DELETE-012 `feature/object-actions-final-4` — duplicate at `1bde718...`.
- DELETE-013 `feature/object-actions-impl-check` — duplicate at `1bde718...`.
- DELETE-014 `feature/object-actions-temp` — duplicate at `1bde718...`.
- DELETE-015 `feature/redevelopment-audit-cleanup-2` — duplicate of retained archive pointer at `293aadd...`.
- DELETE-016 `feature/redevelopment-audit-cleanup-final` — duplicate at `293aadd...`.
- DELETE-017 `feature/redevelopment-audit-cleanup-temp` — duplicate at `293aadd...`.
- DELETE-018 `feature/architecture-verification-mirror` — duplicate of retained verification branch at `f36e6af...`.
- DELETE-019 `feature/shift-persistence` — duplicate of retained recovery branch at `3660ec...`.
- DELETE-020 `preview/phase-1` — duplicate of retained `archive/pre-frame-reset-2026-09-02` at `fadb208...`.
- DELETE-021 `deployment/audit-current` — exact duplicate of protected `develop` at `224e66a...`.
- DELETE-022 `noop-temp-check` — exact duplicate of protected `develop` at `224e66a...`.
- DELETE-023 `docs/classroom-naming-contract` — ancestry check: branch head is fully contained in current `develop` (`behind_by=0`).
- DELETE-024 `feature/calendar-hydration` — ancestry check: branch head is fully contained in current `develop` (`behind_by=0`).

## REVIEW BEFORE DELETE — NOT YET SAFE

Do not delete these merely because an older manifest called them safe. Several historical branches have moved since earlier merge/review points.

- `design/b01-canonical-week-asset-match`
- `design/b01-v18-furniture-shell-integration`
- `design/b01-v19-green-final`
- `design/b02-week-planning-object-hierarchy`
- `design/b03-object-selection-context-actions`
- `design/b05-b06-furniture-taskbar-hardening`
- `audit/day-interface-hostile-two-pass-final` — rechecked; currently diverged and carries 24 commits not in `develop`, so do not delete yet.
- `audit/phase2-final-independent-rgav`
- `audit/phase3-ocps-pdf-fetch-architecture`
- `audit/principal-engineering-round2-2026-09-06`
- `docs/feature-creation-protocol` — rechecked; currently diverged and carries 2 commits not in `develop`, so do not delete yet.
- `deploy/beta-vertical-slice`
- `deploy/beta-vertical-slice-repair`
- all `release/*` branches
- remaining `preview/*`, `fix/*`, `feature/*`, `codex/*`, `ops/*`, and `rebuild/*` branches not listed above.

## Active PR truth

- PR #102 — Group 3; head moved, stale QA evidence rejected.
- PR #103 — Group 2; head moved, stale QA evidence rejected.
- PR #104 — Group 1; QA HOLD because it crosses into `B01Furniture.tsx`.
- PR #106 — shell + furniture integration review; correct place for cross-owner reconciliation, still Visual Red pending rendered QA.
- PR #107 — this Group 5 QA/governance manifest only.

Closed as superseded/failed: PR #98, #100, #101.

## Current code-prune findings

Current `develop` still has a single canonical `AppFrame` composition path and the expected workspace/domain hooks. The code audit is focusing on CSS layering, component-local imports, stale assets, deployment seams, and duplicate workflows rather than assuming filenames are dead.

`src/main.tsx` imports global/calendar/setup styles only. Furniture and Task Bar styles are owned by their components rather than the global entrypoint, so an unused-file decision must follow the component import graph before deletion.

Current `develop` no longer contains the retired `CalendarViewRail`; compare evidence shows that legacy rail was removed upstream. This is good: the no-left-rail rule is not being undermined by a live duplicate component on `develop`.

## Rule

Never infer authority from a branch name. Use exact SHA, ancestry, open PR relationship, and rendered/functional evidence. No branch in REVIEW is safe to remove until its unique commits are accounted for.
