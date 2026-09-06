# Arc Branch Deletion Manifest — 2026-09-06

Classification baseline: protected `develop @ d49ed01e82736e8152204aad3c11bb24aa788ed7`. This manifest revision changes documentation only; it does not alter runtime product code.

Delete only branches in **SAFE DELETE NOW**. Do not delete anything in **KEEP** or **REVIEW / DONOR**. If a SAFE branch has gained commits after this manifest, stop and re-audit it before deletion.

## KEEP — active or protected
- `develop`
- `main`
- `design/b01-canonical-week-asset-match`
- `ops/coo-green-gate-program`

## REVIEW / DONOR — do not delete yet
- `architecture/fridge-scheduling-drag-contracts`
- `archive/audit-cleanup-duplicate-2026-09-03`
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

## SAFE DELETE NOW
### Audit / temporary branches
- `audit/day-interface-hostile-two-pass`
- `audit/day-interface-hostile-two-pass-2`
- `audit/day-interface-hostile-two-pass-final`
- `audit/phase2-final-independent-rgav`
- `audit/phase3-ocps-pdf-fetch-architecture`
- `audit/principal-engineering-round2-2026-09-06`
- `checkpoint/hardening-start-2b3d8804`
- `ops/git-prune-component-audit-2026-09-06`
- `preview/phase-1`
- `preview-repair-2026-09-03`

### Backup / merge-test / staging branches
- `codex/ignore-this-backup`
- `codex/merge-safety-backup`
- `codex/merge-safety-backup-2`
- `codex/merge-staging`
- `codex/merge-test`
- `codex/merge-test-2`
- `codex/merge-test-3`

### Completed design / docs branches
- `design/phase1-shell-art-direction`
- `design/phase2-behavior-ui-brand-gate`
- `design/phase2-planning-ui-gate`
- `docs/classroom-naming-contract`
- `docs/feature-creation-protocol`

### Completed architecture / application hardening
- `feature/appframe-decomposition`
- `feature/application-command-boundary`
- `feature/apply-shift-ui`
- `feature/apply-undo-hostile-audit`
- `feature/architecture-second-green`
- `feature/architecture-verification-mirror`
- `feature/architecture-verification-run`
- `feature/architecture-verification-run-2`
- `feature/foundation-realignment-audit`
- `feature/frame-foundation`
- `feature/frame-foundation-v2`
- `feature/infrastructure-accessibility-hardening`
- `feature/mine-ui-a11y`
- `feature/pre-planning-audit-hardening`
- `feature/surgical-css-hygiene-audit`
- `fix/arc-phase0-structural-resolution`
- `fix/phase1-shell-semantics`

### Completed calendar / setup
- `feature/calendar-hydration`
- `feature/calendar-period-navigation`
- `feature/calendar-persistence`
- `feature/calendar-setup-ui`
- `feature/calendar-truth`
- `feature/course-section-setup`
- `feature/cross-view-readability-interface`
- `feature/term-boundary-setup`
- `fix/calendar-monday-alignment`
- `fix/persisted-home-view`

### Completed Unit / Lesson / delivery
- `feature/lesson-delivery-state`
- `feature/month-planning-projection`
- `feature/object-action-setup-wiring`
- `feature/object-action-ui-integration`
- `feature/object-actions`
- `feature/object-actions-final`
- `feature/object-actions-final-2`
- `feature/object-actions-final-3`
- `feature/object-actions-final-4`
- `feature/object-actions-impl`
- `feature/object-actions-impl-check`
- `feature/object-actions-temp`
- `feature/retire-legacy-object-actions`
- `feature/unit-domain`
- `feature/unit-setup`
- `feature/interface-day-continuity`
- `feature/interface-day-continuity-ci-anchor`
- `feature/easel-continuity`

### Completed Phase 2 verification
- `feature/phase2-calendar-edge-planning-truth`
- `feature/phase2-multiday-calendar-boundaries`
- `feature/phase2-nondrag-keyboard-parity`
- `feature/phase2-object-actions-section-divergence`
- `feature/phase2-planning-truth-gate`
- `feature/phase2-recovery-undo-continuity`

### Completed Phase 3 implementation
- `feature/phase3-calendar-date-acquisition-boundary`
- `feature/phase3-calendar-proposal-review-foundation`
- `feature/phase3-nces-school-identity-provider`
- `feature/phase3-official-calendar-date-acquisition`
- `feature/phase3-official-calendar-url-acquisition`
- `feature/phase3-official-source-acquisition`
- `feature/phase3-progressive-nonblocking-entry`
- `feature/phase3-read-dates-proposal-review`
- `feature/phase3-server-calendar-extractor-boundary`
- `feature/phase3-source-review-ui`
- `feature/phase3-teacher-school-identity-search`
- `feature/phase3-teacher-school-search-ui`

### Completed recovery / shift
- `feature/recovery-preview`
- `feature/recovery-shift-operation`
- `feature/shift-audit-hardening`
- `feature/shift-persistence`
- `feature/shift-persistence-v2`
- `feature/shift-ruthless-housekeeping`

### Duplicate redevelopment cleanup
- `feature/redevelopment-audit-cleanup`
- `feature/redevelopment-audit-cleanup-2`
- `feature/redevelopment-audit-cleanup-final`
- `feature/redevelopment-audit-cleanup-temp`

## Important
GitHub retains merged/closed PR and commit history after branch deletion. This manifest is deliberately conservative: anything that might still contain unique Fridge, drag, priority, Day/Week continuity, Same-Day, or future object behavior is retained in REVIEW / DONOR rather than marked safe.
