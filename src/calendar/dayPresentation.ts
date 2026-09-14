import type { CalendarDay } from './types'

export function humanizeCalendarDayKind(kind: CalendarDay['kind']): string {
  switch (kind) {
    case 'no-school':
      return 'No school'
    case 'teacher-workday':
      return 'Teacher workday'
    case 'holiday':
      return 'Holiday'
    case 'break':
      return 'Break'
    case 'instructional':
      return 'Instructional day'
    case 'unknown':
      return 'Unknown'
  }
}

/** Visible cell label: quiet for inferred/unknown days unless an explicit label exists. */
export function visibleCalendarDayLabel(day: Pick<CalendarDay, 'kind' | 'label'>): string | null {
  if (day.label?.trim()) return day.label.trim()
  if (day.kind === 'instructional' || day.kind === 'unknown') return null
  return humanizeCalendarDayKind(day.kind)
}

/** Screen-reader suffix after the date; avoids repeating placeholder noise in Month grids. */
export function calendarDayAriaSuffix(day: Pick<CalendarDay, 'kind' | 'label'>): string {
  const visible = visibleCalendarDayLabel(day)
  if (visible) return `. ${visible}`
  if (day.kind === 'instructional') return '. Instructional day'
  return ''
}
