# B01 Functional Salvage Audit

This file records evidence for the selective donor merge into the current B01 shell.

## Current status

- Target: `design/b01-v18-furniture-shell-integration`
- Salvage policy: behavior only; current shell owns composition.
- Release state: YELLOW until functional and rendered visual verification are both complete.

## Confirmed donor behaviors

- Fridge -> calendar scheduling with explicit selected item state.
- Calendar -> Fridge return.
- Undo for round-trip scheduling.
- Unit duration preservation across child-lesson changes.
- Resize regression fixes for eligible planning objects.
- Historical local persistence and multi-view continuity patterns.

## Explicitly rejected donor behavior

- Seven-day default rendering.
- Permanent left rail.
- Old Fridge sideboard and multi-stage Fridge UX.
- Donor CSS/layout geometry.
- Direct visual placement of Fridge cards onto the approved calendar surface.

## Verification checklist

- [ ] One canonical planning-state model selected.
- [ ] Fridge unscheduled state represented in canonical model.
- [ ] Fridge -> calendar ported.
- [ ] Calendar -> Fridge ported.
- [ ] Round-trip Undo ported.
- [ ] Shift preview/apply/undo compatible with canonical dates.
- [ ] Fixed lessons preserved by Shift.
- [ ] No-school/non-instructional dates skipped where required.
- [ ] Collision guard prevents silent same-class/date overwrite.
- [ ] Unit -> Lesson nesting survives movement and refresh.
- [ ] Notes/Task Bar movement follows current object restrictions.
- [ ] Furniture open/close ownership remains current B01 behavior.
- [ ] No permanent rail introduced.
- [ ] Five-day default preserved.
- [ ] Weekend preference remains optional.
- [ ] Duplicate persistence code removed.
- [ ] Dead donor helpers removed.
- [ ] Desktop render visually audited.
- [ ] B01 unresolved issues = 0.

Do not mark this file GREEN merely because code compiles. Green requires the complete verification checklist and no unresolved B01 flags.
