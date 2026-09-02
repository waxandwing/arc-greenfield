# Easel Architecture Direction

The recovered single-file prototype is preservation evidence, not the long-term architecture.

Current hardening separates document, behavior, base styles, Plan styling, Present styling, and accessibility overrides. Further cleanup should move state domains into modules without changing the classroom behavior contract.

## State ownership rules
- A class owns its roster and pass state.
- A lesson owns phase/direction/media state.
- The active classroom session explicitly links one class and one lesson.
- Switching class must never silently imply that an unrelated lesson belongs to that class.
- Present contains projected-safe state only; Plan may contain private teacher state.

## Mode contract
### Plan
Private, denser, teacher-facing, setup/history/configuration.
### Present
Projected, larger, calmer, minimum chrome, no private roster/history content.

## Predictive behavior contract
Predictive behavior may suggest or preselect but must not silently mutate teacher intent. Examples: suggest cleanup near the learned end-of-class time, restore the last stage after interruption, preselect the expected class, and surface the most-used media for the current phase.
