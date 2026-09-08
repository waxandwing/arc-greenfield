# Group 1 — Calendar shell + planner composition audit

Status: **GREEN — Group 1 owned source/architecture scope; visual acceptance pending rendered evidence**

Branch: `group1/calendar-shell-current-visuals`
Base: `224e66a6a93447ea1930c5806c47b70e4c866ac1`

Refresh note: Group 1 was reapplied onto the current protected `develop` head without importing or overwriting planner logic from the older `4f9a00ab…` baseline. Current `develop` interaction, state, navigation, persistence, and object semantics remain authoritative.

## Authority used

1. Arc 2K R&D Guide v0.4 / current product vision.
2. Current approved Arc week-shell / founder MAIN OPEN visual reference.
3. Arc canonical object and furniture rules addendum.
4. Current `develop` planner behavior and accessibility contracts.

## Gate results

| Gate | Result | Evidence in branch |
|---|---|---|
| Calendar remains Arc's primary/dominant interface | GREEN | Open-sketchbook calendar remains the dominant center; no dashboard shell added. |
| Approved shell retained instead of generic app panel | GREEN | `calendarShell.css` restores book edge, warm paper, center fold, restrained surface effects. |
| Exact Arc mark in planner header position | GREEN | `public/assets/arc-planner-mark.svg` is bound through `calendarShellAsset.css`. |
| Cream date header + double blue rule | GREEN | Header uses warm cream paper and a double blue rule; no filled blue bar. |
| Current planner range behavior preserved | GREEN | The existing single current-view trigger and six-horizon disclosure remain intact. Day/Week/Month/Quarter/Year keep primary visual emphasis while Semester remains available as current planner context. |
| Monday–Friday teacher-default week behavior preserved | GREEN | Group 1 does not alter projection/state logic; existing weekend preference remains intact. |
| Week, Month, Quarter, Year visual hierarchy differentiated | GREEN | Quarter and Year carry explicit long-range presentation hooks. |
| Unlined sketchbook-like planning field | GREEN | Calendar surface remains warm unlined paper; live calendar content remains DOM. |
| Furniture remains separate from calendar | GREEN / preserved | No changes to `AppFrame.tsx`, `B01Furniture.tsx`, furniture CSS, Settings, Fridge, or Task Bar behavior. |
| Object grammar and relationships unchanged | GREEN / preserved | No Unit/Lesson/Note state or Class → Unit → Lesson relationship logic changed. |
| Drag/state, persistence, auth untouched | GREEN / preserved | Current `develop` logic remains authoritative. |
| Small-laptop / narrow viewport source rules | GREEN at source level | Responsive shell rules preserve current navigation behavior. |
| High-contrast and reduced-motion source rules | GREEN at source level | Forced-colors and reduced-motion rules remain present. |
| No rendered calendar screenshot used as paper | GREEN | The book is CSS/live DOM; only the Arc mark is an image asset. |

## Exact Group 1-owned delta versus refreshed develop

- `docs/GROUP1_CALENDAR_SHELL_AUDIT.md`
- `public/assets/arc-planner-mark.svg`
- `src/components/CalendarProjectionPrimitives.tsx` — presentation class hook only
- `src/components/CalendarProjectionView.tsx` — presentation class hooks only
- `src/components/CalendarStageHeader.tsx` — visual date lockup + stylesheet binding while preserving current control behavior
- `src/styles/calendarShell.css`
- `src/styles/calendarShellAsset.css`

`src/components/CalendarViewSwitcher.tsx` is intentionally kept identical to current `develop` so Group 1 does not overwrite current planner navigation logic.

Explicitly untouched during refresh:

- `src/components/AppFrame.tsx`
- `src/components/B01Furniture.tsx`
- furniture CSS
- `src/app/useArcWorkspace.ts`
- `src/app/useWeekPlanningActions.ts`
- drag/state logic
- auth
- persistence
- Class → Unit → Lesson relationship logic

## Render evidence rule

Do not mark visual acceptance Green without rendered evidence from the refreshed SHA. Required evidence is 1440 / 1280 / 390 plus available 200% zoom and high-contrast/a11y checks. A failed renderer is a Red, not a pass.
