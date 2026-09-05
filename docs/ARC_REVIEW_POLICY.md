# ARC Review Policy — Deterministic Checkpoints

Status: current review authority for Arc engineering work.

## Core rule

Codex code review is optional. It is **not** a release gate, merge gate, or definition of GREEN.

Arc is reviewed primarily through deterministic repository checks plus a focused human/assistant diff audit against founder laws.

## GREEN means all of the following

1. Domain contracts pass.
2. Typecheck passes.
3. Production bundle builds.
4. Rendered RGAV behavior gates pass.
5. Browser accessibility / keyboard / reflow checks pass.
6. Persistence, reload, recovery, Shift, Undo and Section-isolation checks pass where affected.
7. Founder-law audit finds no active violation.
8. The accumulated diff receives one focused semantic review at the checkpoint.
9. No Vercel deployment occurred.

A Codex review may be requested as an additional independent opinion, but its absence does not block GREEN.

## Checkpoint workflow

### While building
- Keep the PR in **Draft**.
- Batch related work into meaningful checkpoints rather than requesting review after every small edit.
- Run targeted deterministic checks while changing a subsystem.
- Fix failures before adding unrelated surface area.
- Do not mark the PR ready simply to obtain a review.

### At a meaningful checkpoint
1. Freeze scope briefly.
2. Run the relevant full CI/RGAV suite.
3. Inspect only actual failures first.
4. Review the accumulated diff against founder laws and canonical docs.
5. Fix regressions in one coherent pass.
6. Re-run the affected gates.
7. Generate the exact tested preview artifact only after the rendered target is clean.

### Before merge
- Full required deterministic suite must be green.
- PR diff must receive a manual semantic/founder-law review.
- PR stays Draft until the implementation is actually review-ready.
- Codex automatic review is not required.

## Codex usage budget

Use Codex review only when a second model-level review is unusually valuable, for example:
- security-sensitive changes;
- concurrency or transaction semantics;
- a large cross-cutting refactor with subtle invariants;
- a final independent review before a major release when quota is available.

Do not spend Codex review allowance on:
- every incremental commit;
- copy/CSS-only adjustments;
- test-selector maintenance;
- known founder-law mechanical refactors;
- repeated reviews of the same draft while it is still moving.

## Review authority order

1. Founder laws and canonical Arc documents.
2. Deterministic contracts and direct rendered behavior.
3. Active implementation truth on `develop` and the current reconciliation branch.
4. Focused semantic diff review.
5. Optional independent Codex review.

No automated reviewer may override an explicit founder law.

## Notification/noise rule

Draft PRs are working rooms. Review notifications should be generated only at deliberate checkpoints, not by routine branch churn. If an external auto-review integration is enabled for every PR, disable repository-level automatic review and invoke it manually only when explicitly desired.
