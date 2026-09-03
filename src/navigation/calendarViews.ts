export const CALENDAR_VIEWS = ['Year Map', 'Semester', 'Quarter', 'Month', 'Week', 'Day'] as const

export type CalendarView = (typeof CALENDAR_VIEWS)[number]

export const DEFAULT_HOME_VIEW: CalendarView = 'Month'
