# Arc canonical planning behavior

This module boundary is reserved for behavior salvaged into the approved B01 furniture shell.

Rules:

- Five instructional days are the default planning week.
- Weekends are opt-in via current preferences, not hard-coded into planning behavior.
- Fridge items are unscheduled planning objects, not a separate visual-only model.
- Scheduling changes ownership/state; it does not preserve an old Fridge card as a calendar decoration.
- Calendar-to-Fridge and Fridge-to-calendar movement must be reversible.
- Shift must preview before apply, preserve fixed-date lessons, respect non-instructional dates, and support undo.
- Same-class/date collisions require explicit resolution.
- No visual-shell code belongs in this module.
