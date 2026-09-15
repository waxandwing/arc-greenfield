# ARC Interaction Laws Report

Branch: `cursor/arc-production-integration`  
Scope: Day Notes, Important marking, drag/move identity, Month priority, accessibility menus.

## Summary

Calendar-scoped **Day Notes** remain canonical `PlanningNote` rows (`placement: 'calendar'`) — not curriculum objects. They render at the **top of Month date cells** and **above the Day teaching sequence**, with per-date `+ Note` composers that inherit the cell date (no date picker in the default flow; advanced move uses **Move to date…**).

**Important** is stored on the canonical object (`PlanningNote.important`, `Lesson.important`, `PlanningCapture.important`, optional `Unit.important`). UI uses a restrained terracotta ring (`arc-important-object--marked`) with **Mark Important / Remove Important** on context menu and **More** menu — not Control-click-only.

Drag on Day Notes moves the same note id (Important and text travel together). Lesson Important survives `moveLesson`; Capture Important survives `moveCaptureAnchorDate`.

## Persistence

| Object | Field / module |
|--------|----------------|
| Day Note | `planning/notes.ts` + `planning/calendarNotes.ts` |
| Lesson | `Lesson.important` + `setLessonImportant` |
| Capture | `PlanningCapture.important` + capture persistence |
| Unit | `Unit.important` (optional, for future surfaces) |

## Contracts & tests

- `src/planning/interactionLaws.contract.ts` — Day Note CRUD/move/Important; Lesson move preserves Important; Capture anchor move preserves Important.
- `tests/interaction-laws-evidence.mjs` — screenshots under `docs/overnight/evidence/interaction-laws/`.

## UI touchpoints

- `CalendarDayNotes.tsx`, `PlanningMonthView.tsx`, `CalendarProjectionView.tsx` (Day strip)
- `ArcImportantObject.tsx`, `ArcObjectMenu.tsx`, `interaction-laws.css`
- Lesson/Capture menus in `PlanningDayContinuityView.tsx`, `PlanningWeekDayView.tsx`, `WorkspacePanel.tsx`

## Out of scope (per task)

Planning Now/Needs Attention, Move/Shift/Recovery law, Month/Year structure beyond Day Notes display, ArcTable, merge/deploy/Vercel — unchanged.
