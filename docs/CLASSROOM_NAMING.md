# Arc Live Classroom naming contract

## Canonical product name

The product is **Arc**.

The former product name **Easel** is retired. It is not a current product, mode, navigation label, deployment target, branch family, or design authority.

## Canonical feature language

Use **Live Classroom** for the current user-facing Arc teaching surface that turns the teacher's current Arc planning truth into an exact-context classroom display.

Use **Classroom** only as a descriptive feature-family shorthand in architecture or prose when no user-facing label is being specified.

Recommended user-facing labels:

- **Live Classroom** — the teaching-surface label inside Arc.
- **Live Classroom Display** — the student-facing projected/display surface when a distinction is needed.
- **Live Classroom Setup** — teacher-only configuration for that display, if a separate setup surface is needed.
- **Live Classroom session** — an active date + Section + Lesson context during teaching.

Do not present Live Classroom as a second standalone product. It is a contextual feature surface inside Arc.

## Launch boundary

The canonical handoff is **Calendar → Day → exact Section → eligible Lesson → Live Classroom**.

Live Classroom is not global navigation. A dormant architecture seam may preserve this future handoff before the feature is active, but it must not create an empty tab, placeholder furniture, or fake teaching behavior.

## Historical references

Use **Easel (legacy)** only when identifying historical code, branches, screenshots, QA records, contract names, or migration evidence created before the feature was absorbed into Arc. Historical references should be rewritten or annotated when they are promoted into current documentation so that no one mistakes Easel for an active product.

## Behavioral boundary

Live Classroom reuses Arc's canonical Course, Section, Unit, Lesson, calendar, delivery-state, and recovery truth. It must not become a second planning system.

Teacher-private state and projected-safe state remain explicitly separated. Switching class or period must never silently attach the wrong lesson or expose another class's private context.

## Migration rule

Any branch, file, issue, PR, contract, or documentation carrying `easel` in its name is presumed legacy until proven otherwise. Durable requirements may be mined into current Arc architecture; obsolete implementation and user-facing naming are not carried forward. Legacy internal filenames may remain temporarily when renaming them would broaden an unrelated batch; that debt must be resolved in the dedicated Live Classroom migration batch rather than treated as current product terminology.
