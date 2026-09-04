# Arc Classroom naming contract

## Canonical product name

The product is **Arc**.

The former product name **Easel** is retired. It is not a current product, mode, navigation label, deployment target, branch family, or design authority.

## Canonical feature language

Use **Classroom** for the Arc feature family that turns the teacher's current Arc planning truth into a student/sub-facing classroom display.

Recommended user-facing labels:

- **Classroom** — the feature/navigation label inside Arc.
- **Classroom Display** — the student-facing projected/display surface.
- **Classroom Setup** — teacher-only configuration for that display, if a separate setup surface is needed.
- **Classroom session** — an active class + lesson/display context during teaching.

Do not present **Arc Classroom** as a second standalone product. It is a feature surface inside Arc.

## Historical references

Use **Easel (legacy)** only when identifying historical code, branches, screenshots, QA records, or migration evidence created before the feature was absorbed into Arc. Historical references should be rewritten or annotated when they are promoted into current documentation so that no one mistakes Easel for an active product.

## Behavioral boundary

Classroom reuses Arc's canonical Course, Section, Unit, Lesson, calendar, delivery-state, and recovery truth. It must not become a second planning system.

Teacher-private state and projected-safe state remain explicitly separated. Switching class or period must never silently attach the wrong lesson or expose another class's private context.

## Migration rule

Any branch, file, issue, PR, or documentation carrying `easel` in its name is presumed legacy until proven otherwise. Durable requirements may be mined into current Arc architecture; obsolete implementation and naming are not carried forward.
