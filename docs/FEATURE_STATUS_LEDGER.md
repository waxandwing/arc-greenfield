# Arc Feature Status Ledger

This is the live summary of feature reality. It is not a roadmap, marketing list, or branch inventory.

A row may say `COMPLETE` only when the definition in `docs/FEATURE_CREATION_PROTOCOL.md` is satisfied on protected `develop`.

## Status vocabulary

`DISCOVERY → CONTRACT → DESIGN → BUILD → AUDIT → REPAIR → BETA → MERGE READY → POST-MERGE VERIFY → COMPLETE`

Additional states: `BLOCKED`, `SUPERSEDED`, `RETIRED`.

## Active and recently completed work

| Feature / system | Teacher problem | State | Behavioral owner | UI/perceptual owner | Issue | Branch / PR | `develop` truth | Audit / evidence | Blocker / next action |
|---|---|---|---|---|---|---|---|---|---|
| Arc Classroom naming | One product must have one clear vocabulary; retired Easel terminology must not create competing product architecture. | COMPLETE | Product architecture / naming contract | UI copy follows contract | historical naming cleanup | merged PR #39 | Arc is the product; Classroom is the feature family; Classroom Display is student/projected; Classroom Setup is teacher-only setup when needed; Easel is legacy-only. | Two clean verification passes before merge; post-merge naming contract present. | Prune legacy Easel branches after historical mining/tag decisions. |
| Feature Creation Protocol + Status Ledger | Arc needs a repeatable way to build, audit, merge, verify, and maintain features without false completion states. | BUILD | Repository/process governance | N/A | process infrastructure | `docs/feature-creation-protocol` / PR pending | Not on `develop` yet. | Must pass current repository checks twice on exact head before merge. | Open PR, verify, merge, then post-merge check. |
| Unit Focus / lightweight Lesson editor + retirement of legacy persisted-object setup actions | Teachers need one ordinary interaction owner for Move/Edit/Unplace/Delete without parallel setup-era mutation paths. | REPAIR | `src/planning/objectActions.ts` plus current workspace application layer | Unit Focus / lightweight Lesson editor | #15 | stale historical attempt: `feature/retire-legacy-object-actions`; no current implementation branch yet | Shared object-action domain exists, but current `develop` still routes ordinary Unit/Lesson access through setup surfaces; approved UI migration is missing. | Historical issue was falsely closed; reopened after repository audit. | Mine interaction contract only, reimplement surgically from current `develop`, then two-pass RGAV and post-merge verification. |
| Application command boundary for Shift + Undo | Shift/Undo transaction policy should not live inside React or split across UI/persistence owners. | MERGE READY / REVERIFY | application commands + Shift domain | Existing UI consumes commands | #30 context / PR #32 | Not yet merged into latest `develop`. | PR #32 documented two exact-head clean passes before later `develop` moved. | Reconcile with latest `develop`, rerun required checks on current ancestry, then merge if still clean. |
| Fridge scheduling consequence + drag ownership + long-range planning truth | Moving/staging work must preserve one scheduling truth across Fridge and long-range views without silent loss. | AUDIT | Fridge domain + canonical planning/calendar projections | Fridge/calendar interaction surfaces | #16 and architecture work / PR #34 | Current `develop` contains earlier Fridge domain/persistence and Undo foundations; PR #34 remains unmerged verification work. | PR #34 was opened specifically for direct architecture/browser verification; not classified Green yet in this ledger. | Audit current diff against latest `develop`; keep only current canonical work; require two clean exact-head passes. |
| Canonical shell / spatial furniture | Teachers need the calendar to remain visually and functionally central while Tools, Fridge, and Must/Should/Could furniture open without covering it. | CONTRACT / DESIGN | shell architecture, furniture/reflow contract | Arc UI authority | #20 | no single canonical implementation branch designated in this ledger yet | Current shell is transitional and does not yet represent the final approved notebook/calendar furniture system. | Requirements exist; implementation must not start from stale visual branches. | Establish one current integration lane after repository cleanup and Unit/Lesson action ownership repair. |
| Fridge spatial workspace | Teachers need a holding/sorting/staging surface that supports spatial thinking without duplicating curriculum objects or requiring precision drag. | CONTRACT / BUILD foundations | Fridge domain/persistence + canonical object actions | Fridge stored/spatial modes | #16 | multiple historical Fridge feature branches; active architecture work in #34 | Domain/persistence, Door/Drawer, stacks, non-drag actions, drag preview, and reversible Lesson move foundations have previously reached Green and are on current ancestry where verified; final spatial UI is not complete. | Historical Green milestones exist; final UI must be tested on current integrated ancestry. | Consolidate into one current Fridge UI lane after branch pruning; preserve explicit grouping and non-drag paths. |
| Must-do / Should-do / Could-do furniture | Teachers need priority work visible and usable as three independent bottom surfaces without obscuring the calendar. | CONTRACT | task/priority domain and furniture collision rules | three bottom tabs/panels | current shell/priority requirements | no designated current implementation branch | Final three-tab furniture is not complete on `develop`. | Not yet at two-pass implementation stage. | Confirm persistent priority ownership and shell collision contract, then build in canonical shell lane. |
| Classroom Display | Teachers need one student/sub-facing daily display for multiple classes without maintaining separate screens or exposing private teacher state. | DISCOVERY / CONTRACT | Arc Classroom feature family; projected-safe state boundary | Classroom Display | classroom requirements; Easel legacy PR mined into #37 | no current implementation branch | Easel is retired; only mined Classroom requirements remain canonical. | Historical Easel code is not implementation authority. | Define current Classroom Display contract from Arc data/state, including privacy, schedule auto-emphasis, interruption recovery, projector/touch/zoom tests. |
| Historical branch mining / repository pruning | Arc needs a sterile branch model where stale experiments cannot masquerade as active implementation. | AUDIT | repository governance | N/A | #37 | branch-by-branch audit | `develop` protected; stale PRs have been closed/mined; many remote branches remain physically present. | Safe-delete and investigate classifications recorded progressively in #37. | Finish branch classification; user deletes branches not removable through connector; tag only genuinely useful historical checkpoints. |

## Known false-completion correction

### Issue #15

Issue #15 was previously marked completed because a historical branch passed its own audits. Repository inspection later proved the approved Unit Focus/lightweight Lesson editor was not present on protected `develop` while setup-era surfaces still owned ordinary Unit/Lesson access.

Action taken:

- issue reopened;
- current `develop` treated as truth;
- stale implementation branch explicitly prohibited from wholesale merge;
- missing UI migration returned to active work;
- Feature Creation Protocol now requires post-merge verification before `COMPLETE`.

This event is the canonical example of why branch-local Green is not equivalent to feature completion.

## Maintenance rules

1. Update this ledger in the same PR that materially changes a tracked feature's state whenever practical.
2. Never mark `COMPLETE` before post-merge verification on protected `develop`.
3. If a feature regresses or its canonical implementation disappears, move it back to the appropriate active state and reopen the owning issue.
4. Do not create duplicate rows for the same behavioral capability. Update the existing row and record superseded implementations in notes/issues.
5. Historical branches are not feature status. They are evidence or salvage sources only.
6. Composite persona reviews are simulations unless real external participants are explicitly recruited and documented as such.
7. Structural bugs discovered during feature work are logged immediately rather than hidden inside feature completion notes.
8. No Vercel deployment is part of the completion path.

## Completion checklist shorthand

A reviewer may use this shorthand before changing a row to `COMPLETE`:

- [ ] approved behavior exists on protected `develop`
- [ ] one clear domain/application/persistence owner
- [ ] UI follows the approved perceptual contract
- [ ] acceptance scenarios pass
- [ ] two clean exact-head RGAV passes after final feature change
- [ ] post-merge verification succeeds
- [ ] accessibility and relevant brand/visual gates pass
- [ ] known limitations documented and nonblocking
- [ ] docs/ledger current
- [ ] stale branches/PRs/code residue pruned or explicitly queued