export type ISODate = `${number}-${number}-${number}`

export type CalendarSource = 'manual' | 'import' | 'district-source'

export type Confidence = 'confirmed' | 'mixed' | 'inferred'

export type DayKind = 'instructional' | 'no-school' | 'teacher-workday' | 'holiday' | 'break'

export type CalendarDay = {
  date: ISODate
  kind: DayKind
  label?: string
  source?: CalendarSource
  confidence?: Confidence
}

export type TermBoundary = {
  id: string
  label: string
  startDate: ISODate
  endDate: ISODate
}

export type SchoolCalendar = {
  id: string
  schoolYearLabel: string
  firstDay: ISODate
  lastDay: ISODate
  days: Record<ISODate, CalendarDay>
  quarters: TermBoundary[]
  semesters: TermBoundary[]
}
