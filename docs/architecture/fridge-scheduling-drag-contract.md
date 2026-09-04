# Arc Fridge Scheduling and Drag Contract

Status: Architecture decision record for implementation and audit.

Base checkpoint: `feature/fridge-door-stacks-interface` at `2a803a022d78c4d9ea09a3024d0c0f284e1d6293`.

Nothing in this document authorizes merge or deployment.

## Governing product truths

- The calendar is Arc's single source of planning truth.
- Fridge placement and calendar placement are independent dimensions of one canonical object identity.
- Fridge stores references to canonical Units and Lessons; it does not duplicate curriculum objects.
- Drag is only an accelerator. Every drag outcome must call the same operation as an equivalent explicit control.
- Canonical curriculum action vocabulary remains `Move / Edit / Unplace / Delete`.
- Fridge spatial organization is not curriculum placement.

## Decision 1 — scheduling a Lesson already represented on Fridge

Scheduling a Lesson does **not** remove, move, restack, reprioritize, or otherwise mutate its existing Fridge representation.

A Lesson that is on Fridge before a successful calendar `Move` remains represented on the same Fridge surface, at the same coordinates, with the same priority and stack membership/order after the move.

Scheduling a Lesson that is not currently represented on Fridge does not add a Fridge reference merely because it was scheduled.

The recovery invariant remains separate: when a Lesson becomes fully unplaced from all calendar placements, Arc must ensure it becomes findable on Fridge. If Door has capacity it may be projected to Door; otherwise it must be recoverable in Drawer.

### Consequences

- Non-drag calendar Move and drag-to-calendar Move have the same Fridge consequence: none, except normal reconciliation needed to preserve domain validity.
- `Unplace` may create Fridge presence when needed for recoverability; it must not create a duplicate reference if one already exists.
- Existing Fridge priority and stack state survive scheduling, rescheduling, and reload.
- UI must not imply that scheduling means "taking something off the Fridge."

## Decision 2 — Fridge spatial drag ownership

Within Fridge, drag is owned by the Fridge organization domain.

### Door item → Door coordinate

Accelerates existing Fridge `Reposition` behavior.

It must not call canonical curriculum `Move`.

### Door stack → Door coordinate

Accelerates existing stack reposition behavior for the whole stack.

It must preserve stack ID, member order, member priorities, and canonical Unit/Lesson content.

### Door item → Drawer

Accelerates existing `Put Away` behavior.

This is a Fridge surface change, not curriculum `Unplace` or `Move`.

### Drawer item → Door

Accelerates existing `Bring Back` behavior. A drop onto an explicit valid free Door coordinate may use that coordinate; if the implementation only exposes a general Door target, it must use the same placement rule as the explicit Bring Back control.

A full Door must fail visibly and leave the item recoverable in Drawer.

### Fridge Lesson → calendar date

Must route through canonical Lesson `Move` with the target planned date.

On success, the Lesson's existing Fridge representation remains unchanged.

On failure, both calendar state and Fridge state remain unchanged.

### Fridge Unit → calendar span/date target

Must route through canonical Unit `Move` and its existing placement validation. The drag layer must not bypass dependent-Lesson or Section-specific placement constraints.

On success, the Unit's existing Fridge representation remains unchanged.

On failure, both calendar state and Fridge state remain unchanged.

### Fridge Magnet → calendar

Invalid in the current domain. A Magnet is not a schedulable curriculum object. Reject the drop without mutation and expose a clear non-destructive failure state.

### Fridge stack → calendar

Invalid in the first drag implementation. A stack is organizational only, may contain heterogeneous Lesson/Magnet members, and has no canonical curriculum identity. Reject the cross-surface stack drop without mutation.

If future product work introduces an explicit multi-object scheduling command, that must be designed as a separate canonical operation rather than inferred from stack drag.

## Atomicity and rollback

Every drag transaction is atomic at the product-contract level.

- Validate target and canonical operation before committing visible state.
- A rejected drop returns the object to its prior stable representation.
- No failed drag may alter dates, Fridge coordinates, priority, stack membership, stack order, Drawer/Door surface, or persistence records.
- Persist only after a successful canonical operation and successful Fridge-domain change, as applicable.
- Reload after a successful operation must reproduce the same canonical and Fridge states without reseeding test storage.

## Accessibility contract

Drag must never be the only route.

Every valid drag outcome requires an equivalent keyboard-operable explicit action:

- calendar Move
- Fridge Reposition
- Put Away
- Bring Back
- stack reposition where stacks are supported

Keyboard and assistive-technology users must receive the same validation failures and recovery guarantees as pointer/touch users.

## Cross-view contract

A successful Lesson or Unit calendar Move must project from the same canonical object identity into every relevant calendar view. Day, Week, Month, Quarter, and Year may render different levels of detail, but must not disagree about placement, existence, parent relationship, or object identity.

Fridge representation is not a second calendar truth and must not override calendar projection.

## Permanent regression assertions added for drag work

- Scheduling an existing Fridge Lesson does not remove its Fridge reference.
- Scheduling preserves Fridge surface, coordinates, priority, stack ID, and stack order.
- Reposition drag never mutates canonical Lesson/Unit dates.
- Failed cross-surface drag is atomic.
- Stack-to-calendar and Magnet-to-calendar are rejected without mutation.
- Drag implementation does not create duplicate Fridge references.
- Full-Door Drawer→Door failure leaves the item in Drawer.
- Keyboard routes invoke the same operations and validation as drag.
- Save/reload reproduces the operation result from persisted state rather than reseeding localStorage.

## Implementation gate

Do not begin drag implementation until these contracts are represented in executable tests and the fresh cross-view truth audit has been run against Day, Week, Month, Quarter, and Year.
