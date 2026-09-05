# Arc Feature Creation Protocol

Status: canonical operating protocol once merged to protected `develop`.

Purpose: make feature work repeatable, testable, traceable, and difficult to falsely call complete. This protocol applies to product features, major interaction changes, architecture changes, persistence changes, and meaningful UI/UX changes.

## Non-negotiable product truth

- Arc is the product. Classroom is a feature family inside Arc. Easel is legacy terminology only.
- The calendar is the center of Arc.
- Arc holds the teacher’s place. Interruptions, schedule disruption, unfinished teaching, recovery, and changed plans are normal states.
- Nothing important silently disappears.
- UX/Architecture owns behavioral contracts. UI owns perceptual contracts.
- Canonical domain actions own state mutation. UI may accelerate those actions but may not invent parallel behavior.
- `develop` is the protected integration branch. Feature branches start from current `develop` and merge back through pull request.
- No Vercel deployment is authorized from this repository workflow.

## Feature lifecycle

Every feature must move through the following states in order unless the Feature Status Ledger documents a justified exception.

`DISCOVERY → CONTRACT → DESIGN → BUILD → AUDIT → REPAIR → BETA → MERGE READY → POST-MERGE VERIFY → COMPLETE`

Additional states: `BLOCKED`, `SUPERSEDED`, `RETIRED`.

### 0. Discovery — define the teacher problem

Before code:

- state the teacher problem in plain language;
- identify who experiences it and under what classroom conditions;
- identify the existing Arc system/domain that should own the behavior;
- confirm this is not duplicate functionality, a renamed existing feature, or a visual solution to a behavioral problem;
- record explicit non-goals;
- record whether the feature changes system truth, merely clarifies system truth, or only changes presentation.

A feature without a concrete teacher problem does not advance.

### 1. Contract — lock behavior before implementation

Architecture/UX defines:

- source of truth and state owner;
- mutation path and command/domain owner;
- persistence and reload expectations;
- cross-view consequences;
- interruption/recovery behavior;
- Undo/reversibility expectations;
- collision and invalid-state behavior;
- drag semantics and the required non-drag equivalent;
- accessibility-critical interaction requirements;
- privacy boundaries;
- failure behavior and what must never happen silently.

If implementation reveals that this contract is wrong, return to CONTRACT. Do not patch around a broken contract.

### 2. Design — lock the perceptual contract

UI defines, without changing behavior:

- placement and spatial relationship to the calendar;
- hierarchy and information priority;
- open/closed/loading/empty/error/disabled/selected/focus states as applicable;
- responsive survival/reflow rules consistent with UX architecture;
- visual feedback for recovery, invalid operations, Undo, and changed state;
- approved brand assets, tokens, typography, spacing, texture/material treatment, and icon use;
- keyboard focus appearance and non-color-only state cues;
- visual regression references.

Fail the design if removing the Arc mark makes it look like generic SaaS, a dashboard kit, or an arbitrary card system.

### 3. Acceptance criteria — write proof before code

Create acceptance scenarios that can falsify success.

At minimum, cover the normal path plus relevant hostile conditions:

- realistic teacher data;
- long class/unit/lesson names;
- 3, 6, and 8 instructional blocks when relevant;
- interruptions and changed plans;
- no-school/weekend/fixed-date cases when relevant;
- save/reload and persistence when state is durable;
- cross-view continuity when data appears in multiple horizons;
- keyboard-only use;
- reduced motion where animation exists;
- small laptop/reflow/zoom pressure;
- invalid input or invalid drop/move;
- privacy boundary checks for Classroom Display or shared surfaces.

For every historical defect in the affected area, add or preserve a regression scenario unless the behavior was intentionally retired and replaced by a documented invariant.

### 4. Branch — open one surgical implementation lane

- branch from current protected `develop`;
- use a descriptive owner/purpose name;
- one primary concern per branch;
- do not create `final`, `final-2`, `temp`, `new`, `misc`, or similar ambiguity branches;
- do not copy stale implementation branches forward merely because they once passed tests;
- mine durable requirements from history, then reimplement against current architecture when necessary.

### 5. Build — implement through canonical owners

During implementation:

- one owner per concern;
- no duplicate stores or parallel state models;
- no duplicate Move/Shift/Unplace/Delete behavior;
- UI components do not become persistence/domain owners;
- no fake controls or claims of capability that do not work end-to-end;
- teacher-facing copy uses teacher language, not developer nouns or AI-style filler;
- do not refactor unrelated code during a surgical feature unless the refactor is necessary for safety and is explicitly documented;
- speculative production code should be removed when disproven rather than preserved “just in case.”

### 6. Self-prune — sterile before audit

Before RGAV begins, remove:

- dead imports and unused props;
- obsolete selectors/CSS;
- commented-out code;
- debug output and build fingerprints;
- temporary compatibility paths that are no longer needed;
- abandoned experiments;
- duplicate tests and duplicate helpers;
- vague helpers without a concrete owner;
- misleading TODOs with no issue/owner/removal condition.

The audit should evaluate intended code, not implementation residue.

### 7. RGAV Audit Pass 1 — attempt to disprove readiness

Run the required current gates plus feature-specific hostile checks.

Baseline gates:

- domain/contracts;
- TypeScript/typecheck;
- production build;
- browser/accessibility smoke gate;
- feature-specific regression tests;
- direct interaction evidence where behavior cannot be established by source inspection alone;
- visual review where UI changed;
- persistence/reload/cross-view checks where relevant.

Use the current Wax & Wing RGAV standard: artifacts are guilty until proven reliable. GREEN cannot be averaged into existence.

Every material failure records:

- reproduction;
- severity;
- expected behavior;
- observed behavior;
- likely owning layer;
- smallest defensible fix.

### 8. Repair — fix the cause, not the symptom

After a failure:

- repair the owning layer;
- preserve known-good behavior;
- add or strengthen a regression test;
- retest the original failure;
- retest nearby and historical failure modes;
- reset the clean-audit count.

Any code change after a clean pass resets the two-clean-pass requirement.

### 9. RGAV Audit Pass 2 — exact-head independent clean verification

A milestone requires at least two clean runs on the same exact feature head.

- no code changes between the two counted passes;
- all required gates pass;
- no material console/runtime errors;
- no known critical/data-loss defect;
- no unresolved accessibility blocker;
- no unexplained visual or behavioral drift.

Finicky, timing-sensitive, previously flaky, or high-risk behavior gets additional passes.

### 10. Beta / teacher-pressure validation

Before merge for meaningful user-facing features, test the job-to-be-done rather than merely exercising controls.

Use realistic classroom scenarios and the relevant independent critique lenses:

- hostile first-time teacher;
- veteran teacher under time pressure;
- accessibility/keyboard user;
- data-loss prosecutor;
- cross-view consistency review;
- design/brand forensics;
- AI-scent/human-language review;
- chaos classroom/interruption simulation;
- minimal-cause debugging review when defects occurred.

These are structured composite critique lenses unless real external testers are explicitly recruited. Do not represent simulations as human research.

### 11. Merge Ready — verify the integration contract

A feature becomes `MERGE READY` only when:

- acceptance criteria are satisfied;
- two exact-head clean passes are documented;
- branch is current enough to merge safely into protected `develop`;
- required repository checks pass;
- open limitations are nonblocking and documented;
- documentation is updated with the implementation, not scheduled as future cleanup;
- no Vercel deployment is involved.

### 12. Protected merge

- merge by pull request into `develop`;
- never bypass branch protection;
- do not merge directly to `main`;
- do not treat a historical passing branch as equivalent to integration.

### 13. Post-merge verification — completion is proven on `develop`

This is mandatory.

After merge:

- confirm the feature exists on the new `develop` head;
- confirm the expected source owner exists on `develop`;
- run/confirm required checks on integrated ancestry;
- interact with the integrated behavior where practical;
- verify no adjacent feature was lost during merge;
- update the Feature Status Ledger with merge PR and SHA.

A feature branch passing tests does **not** make the feature complete.

### 14. COMPLETE — legal definition

A feature may be marked `COMPLETE` only when all are true:

1. approved behavior exists on protected `develop`;
2. canonical state/domain/persistence ownership is clear;
3. acceptance scenarios pass;
4. at least two clean exact-head RGAV passes were completed after the final feature change;
5. post-merge verification succeeds on integrated ancestry;
6. accessibility requirements for the feature are satisfied;
7. relevant visual/brand guardrails are satisfied;
8. known limitations are documented and nonblocking;
9. canonical documentation and the Feature Status Ledger are current;
10. temporary implementation residue and superseded branches/PRs are pruned or explicitly queued for pruning.

If any item becomes false later, reopen the feature or its owning defect issue. Do not preserve a false COMPLETE state.

### 15. Prune and maintain

After completion:

- delete merged short-lived feature branches;
- close superseded PRs/issues with a pointer to the canonical replacement;
- tag/document historical checkpoints only when they provide real recovery/reference value;
- retire stale terminology and dead architecture;
- make new regressions reference the feature record and preserve the regression thereafter.

## Required feature record

Every tracked feature must include:

- Feature name
- Teacher problem
- Current state
- Behavioral owner
- UI/perceptual owner
- Primary issue
- Active branch
- Active PR
- Acceptance criteria location
- Current audit pass / last exact Green head
- Blockers
- `develop` integration status
- Post-merge verification status
- Known limitations
- Superseded/retired references
- Next action

The canonical live summary is `docs/FEATURE_STATUS_LEDGER.md`.

## Process failure rule

A process defect is itself a structural bug when the repository says a feature is complete but protected `develop` does not contain the approved behavior, required evidence is missing, or multiple active branches claim authority over the same feature. Record and repair the process defect before continuing normal feature expansion.