# B01 Functional Salvage Map

Status: selective merge only. Current B01 shell owns composition and visuals. Historical donors may contribute behavior but may not reintroduce legacy shell assumptions.

## Source of truth

- Target branch: `design/b01-v18-furniture-shell-integration`
- Target commit observed: `56568a541346928bd8c190be871f73a8e2815fb1` — `B01: add furniture-owned shell composition`
- Current rules: five-day default week, no permanent left rail, furniture emerges from exterior edges, calendar geometry remains fixed when furniture opens, Fridge/Settings/Task Bar own their internal content.

## Donor classification

### USE

- `76c9a25acc783b75b7e4af13362a4afb450d04ad` — Complete Arc Fridge round trip scheduling
  - Extract: Fridge -> calendar scheduling state, calendar -> Fridge return, reversible Undo semantics, explicit selected Fridge item state.
  - Do not copy: historical controls, seven-day defaults, donor layout, visual shell.

- `294cebb6a2660c556d1e3e2d48fb801ccb64e4d9` — Add reversible calendar Fridge movement
  - Extract: round-trip object ownership and reversible movement semantics.

- `90b3393c1770b285744988b465723c80592ad4ed` — Snap Fridge drops to Arc calendar cells
  - Extract carefully: date/class drop resolution only.
  - Adapt: current B01 calendar is five-day by default and must preserve canonical date logic.

- `90441ddb967cbcb3cea0ae52b8c094eb10df4586` — Fix reported beta bugs and preserve unit duration
  - Extract: unit school-day-span preservation and regression lessons around Fridge drop behavior.

- `eccf57d426cd9de164ce519f5677e5419a313fab` — Fix resize regression across Arc
  - Extract: regression coverage for unit/lesson/note resizing where still permitted by current object rules.

### MINE

- `1eccd7b9965b1ccddfd13136ffe9794198a3fabf` — Build Arc Core planning workspace
  - Mine: plan model, units/lessons, local save patterns, overview-view continuity, priority state.
  - Reject: old page frame, old responsive shell.

- `d96cfcb314ac94d275e43e1cb146a03006fc0c85` — Add direct planning interactions and responsive calendar layers
  - Mine: direct selection, move/resize mechanics, teacher notes, multi-day movement.
  - Reject: any responsive/calendar layer that moves or shrinks the approved B01 central geometry.

- `3d9ab19dfe5c07fa454a565dd54fb9c25c750a0c` — Unify Fridge capture and continuous calendar views
  - Mine: common state model between unscheduled capture and calendar.
  - Review for legacy continuous-view assumptions before porting.

- `3fa003dca16077bbec55aa9fdf4efd3d9faa183a` — Add inferred Fridge classes and nested Month lessons
  - Mine: nested lesson representation and class inference only if still needed.

### PASS

- Legacy seven-day header assumptions.
- Saturday/Sunday rendered by default.
- Permanent left rail / rail host.
- Old Fridge workflow shells, old sideboards, multi-stage shopping-list UX, and historical Fridge visual layout.
- Any code that places magnets/sticky notes visually on the calendar field rather than translating them into calendar-owned objects.
- Any donor CSS that changes approved B01 furniture proportions or central calendar geometry.
- Any duplicate persistence layer that competes with the selected canonical store.

## Merge contract

1. The current B01 shell is immutable with respect to composition unless a separate founder-approved visual change is made.
2. Donor behavior must be adapted to five instructional days by default; weekends exist only behind the current weekend preference.
3. The canonical planning object model must represent Units, Lessons, Notes, unscheduled/Fridge state, dates, class/course ownership, fixed-date status, and reversible movement.
4. Moving a lesson/object from Fridge to calendar must change ownership/state rather than visually dragging an old Fridge card onto the calendar.
5. Calendar -> Fridge and Fridge -> calendar must both be reversible.
6. Shift must preview before applying, preserve fixed lessons, respect non-instructional days, and support Undo.
7. Same-class/same-date collisions require explicit resolution; never silently overwrite.
8. Persistence must survive refresh and week navigation without re-anchoring absolute dates.
9. Furniture owns its own open-state content and closing a furniture surface retracts that content with it.
10. No historical UI may return merely because its behavior was useful.

## Required audit gates before Green

- Five-day default verified; weekend toggle separately verified.
- Unit -> Lesson nesting preserved through move, Shift, refresh, and cross-week navigation.
- Fridge -> calendar -> Fridge round trip verified with Undo at each step.
- Shift preview/apply/undo verified with fixed lesson and no-school date present.
- Collision handling verified.
- Notes and allowed Task Bar movement verified against current object rules.
- Settings, Fridge, and Task Bar open/close ownership verified without calendar shrink/reflow.
- No left rail, seven-day default, old Fridge sideboard, or duplicate persistence code present.
- Every surviving function has one clear responsibility; dead/duplicate donor helpers removed.
- B01 remains Yellow until rendered desktop visual audit and interaction audit pass. Green requires zero unresolved B01 flags.
