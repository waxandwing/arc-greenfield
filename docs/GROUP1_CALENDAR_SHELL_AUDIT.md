# Group 1 — Calendar shell + planner composition audit

Status: **GREEN — Group 1 owned source/architecture scope; visual acceptance pending rendered evidence**

Branch: `group1/calendar-shell-current-visuals`
Base: `224e66a6a93447ea1930c5806c47b70e4c866ac1`

Refresh note: Group 1 was reapplied onto the current protected `develop` head without importing or overwriting planner logic from the older `4f9a00ab…` baseline. Current `develop` changes to interaction/state logic remain authoritative.

## Authority used

1. Arc 2K R&D Guide v0.4 / current product vision.
2. Current approved Arc week-shell / founder MAIN OPEN visual reference.
3. Arc canonical object and furniture rules addendum.
4. Existing functional planner projection code, preserved unless a change was strictly presentational.

## Gate results

| Gate | Result | Evidence in branch |
|---|---|---|
| Calendar remains Arc's primary/dominant interface | GREEN | Open-sketchbook calendar remains the dominant center; no dashboard shell added. |
| Approved shell is retained rather than replaced by a generic app panel | GREEN | `calendarShell.css` restores book edge, warm paper, center fold, restrained surface effects. |
| Exact Arc mark is used in the planner header position | GREEN | `public/assets/arc-planner-mark.svg` is bound through `calendarShellAsset.css`. |
| Cream date header + double blue rule; never a filled blue bar | GREEN | `.calendar-stage-header` uses warm cream paper and a double blue rule. |
| Product range navigation is Day / Week / Month / Quarter / Year | GREEN | `CalendarViewSwitcher.tsx` presents those five primary ranges; Semester remains domain context only. |
| Monday–Friday remains the teacher-default week shape | GREEN / preserved | Group 1 does not alter planner projection/state logic; existing weekend preference remains intact. |
| Week, Month, Quarter, Year have distinct hierarchy | GREEN | Quarter and Year carry explicit long-range presentation hooks. |
| Unlined sketchbook-like planning field | GREEN | Calendar surface remains warm unlined paper; live calendar content remains DOM. |
| Furniture remains separate from calendar | GREEN / preserved | No changes to `AppFrame.tsx`, `B01Furniture.tsx`, furniture CSS, Settings, Fridge, or Task Bar behavior. |
| Physical Unit/Lesson/Note grammar is unchanged | GREEN / preserved | No object component or object-state files changed. |
| Drag/state, persistence, auth remain untouched | GREEN / preserved | Current `develop` logic remains authoritative. |
| Small-laptop / narrow viewport source rules | GREEN at source level | Dedicated responsive shell rules remain present. |
| High-contrast and reduced-motion source rules | GREEN at source level | Forced-colors and reduced-motion rules remain present. |
| No rendered calendar screenshot is used as paper | GREEN | The book is CSS/live DOM; only the Arc mark is an image asset. |

## Exact Group 1-owned delta versus refreshed develop

- `docs/GROUP1_CALENDAR_SHELL_AUDIT.md`
- `public/assets/arc-planner-mark.svg`
- `src/components/CalendarProjectionPrimitives.tsx` — presentation class hook only
- `src/components/CalendarProjectionView.tsx` — presentation class hooks only
- `src/components/CalendarStageHeader.tsx`
- `src/components/CalendarViewSwitcher.tsx`
- `src/styles/calendarShell.css`
- `src/styles/calendarShellAsset.css`

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

Do not mark visual acceptance Green without rendered evidence from this refreshed SHA. Required evidence remains 1440 / 1280 / 390 plus any available 200% zoom and high-contrast/a11y checks. A failed or unavailable renderer is an infrastructure Red, not a visual pass.
