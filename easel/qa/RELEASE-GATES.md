# Easel Release Gates v1.0

Easel is scored across eight independent gates, 10 points each. Production promotion requires 76/80 or better and zero zero-tolerance failures.

## Scored gates
1. Functional integrity
2. Classroom usability
3. Accessibility
4. Responsive integrity
5. State and data integrity
6. Visual and brand quality
7. Performance and code health
8. Deployment integrity

## Zero-tolerance failures
- Data loss or silent overwrite
- Active class and projected lesson context can disagree without an explicit warning/action
- Student-private information appears in Present
- Critical controls are clipped, unreachable, or off-screen at 200% zoom
- A critical classroom action requires drag with no keyboard/click alternative
- Missing assets or broken media caused by deployment path differences
- A production deployment cannot be traced to an exact source commit
- Browser refresh or interruption loses the active classroom state unexpectedly

## Required viewport matrix
- 1366x768 classroom laptop
- 1280x720 projector
- 1440x900 laptop
- 1920x1080 smartboard
- CSS viewport representative of 200% zoom on a 1366px-wide laptop

## Required zoom matrix
100%, 125%, 150%, 175%, 200%

## Required input matrix
Mouse, trackpad, keyboard only, touch, screen reader smoke test.

## Required interruption tests
- projector disconnect/reconnect
- accidental refresh
- switch class mid-lesson
- start pass during cleanup
- enter wrong class
- stage on/off while media is active
- offline then reconnect
