export const CALENDAR_VIEWS = ['Year Map', 'Semester', 'Quarter', 'Month', 'Week', 'Day'] as const

export type CalendarView = (typeof CALENDAR_VIEWS)[number]

// Quarter and Semester remain valid internal projection/boundary concepts, but they are
// not planner screens in the current Arc interface law.
export const VISIBLE_CALENDAR_VIEWS = ['Day', 'Week', 'Month', 'Year Map'] as const satisfies readonly CalendarView[]

export const DEFAULT_HOME_VIEW: CalendarView = 'Month'

export function calendarViewLabel(view: CalendarView) {
  return view === 'Year Map' ? 'Year' : view
}
