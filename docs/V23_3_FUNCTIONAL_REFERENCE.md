# Arc v23.3 Functional Reference

Status: reference only. Do not restore v23.3 as the code or deployment baseline.

The current `rebuild/workspace-operations` branch remains Arc's source of truth. v23.3 is useful as evidence that several teacher-facing interactions were already understandable or operational and should not disappear during reconstruction.

## Preserve or deliberately replace

A current Arc release must either preserve each behavior below or record a deliberate Constitution-level replacement.

### Calendar and teaching range
- Calendar remains the center of the product.
- Day, Week, Month, Quarter, and Year are projections of the same planning objects.
- Week defaults to the teacher workweek, with weekend visibility available when wanted.
- Cross-week Units retain one identity and one canonical date range.
- No-school and non-instructional dates remain part of movement rules rather than decorative calendar metadata.

### Unit behavior
- Create a Unit from each teaching row.
- Open Unit Focus without leaving the current planning horizon.
- Nest Lessons inside a Unit and preserve their sequence.
- Move a Unit with its Lesson tree.
- Resize a Unit range without rebuilding it.
- Resizing may not silently place the Unit end before a scheduled child Lesson or destroy protected work.
- Fixed child Lessons must remain protected.

### Lesson behavior
- Lessons can move independently when appropriate.
- Lessons retain Unit identity when moved.
- Fixed-date Lessons are explicit and protected.
- Collision checks happen before a move commits.
- A keyboard or click path exists for every movement that can also be done by drag.

### Interruption and recovery
- Shift previews consequences before commit.
- Closures and instructional-day logic affect Shift.
- Conflicts stay visible rather than being overwritten.
- Undo and redo cover planning operations.
- Current Arc extends this rule: recovery must guarantee no silent loss and preserve the record of what was actually taught.

### Working desk
- Quick add is available from the calendar.
- Day is a real teaching surface, not a duplicate calendar.
- Notes are usable as planning objects.
- Fridge/Ideas provides a real parking place for unscheduled work.
- Must / Should / Could remains a lightweight attention strip, not a separate project-management system.

### Interaction shell
- One rail/panel is active at a time. Opening one tool cannot leave stale panels stacked behind another.
- Escape closes transient UI where expected.
- Calendar space returns when a rail/panel closes.
- Save state tells the truth about where data is durable.

## Current Constitution upgrades

v23.3 behavior is not automatically correct just because it existed. Current Arc should improve it where the Design Constitution is stricter:

- Preview impact before consequential moves.
- Never delete or overwrite work to resolve a collision.
- Preserve fixed dates and name the blocker.
- Keep full-operation undo checkpoints.
- Treat drag as an optional shortcut, never the only path.
- Meet keyboard, focus, reflow, contrast, reduced-motion, and non-color-state requirements.
- Use current Wax & Wing / Arc visual language rather than restoring old patch-layer styling.

## Release audit question

For every meaningful planning interaction, ask:

1. Did current Arc preserve the useful v23.3 behavior?
2. If not, is the replacement intentionally better under the Design Constitution?
3. Can the same result be completed without drag?
4. Can interruption, collision, or a fixed date cause silent loss?
5. Does undo restore the full operation?

A missing behavior without an intentional replacement is a regression, even if the current screen looks cleaner.
