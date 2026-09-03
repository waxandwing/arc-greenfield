export type CalendarObjectKind = 'unit' | 'lesson'

export type CalendarObjectSelection = {
  kind: CalendarObjectKind
  id: string
} | null

export function isCalendarObjectSelected(
  selection: CalendarObjectSelection,
  kind: CalendarObjectKind,
  id: string,
): boolean {
  return selection?.kind === kind && selection.id === id
}

export function toggleCalendarObjectSelection(
  selection: CalendarObjectSelection,
  next: Exclude<CalendarObjectSelection, null>,
): CalendarObjectSelection {
  return isCalendarObjectSelected(selection, next.kind, next.id) ? null : next
}
