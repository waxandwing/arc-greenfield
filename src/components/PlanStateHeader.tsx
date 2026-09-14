import type { PlanFocus } from '../calendar/navigationContext'
import type { ISODate } from '../calendar/types'
import type { CalendarView } from '../navigation/calendarViews'
import { formatPlanHeaderDate } from './dateLabels'

export function PlanStateHeader(props: {
  view: CalendarView
  viewLabel: string
  focus: PlanFocus
  date: ISODate | null
  weekRange?: string | null
  monthLabel?: string | null
  yearLabel?: string | null
  courseId?: string | null
  sectionId?: string | null
  lessonId?: string | null
  courseTitle?: string | null
  sectionName?: string | null
  unitTitle?: string | null
  lessonTitle?: string | null
  blockLabel?: string | null
  blockType?: 'teaching' | 'planning' | 'non-teaching' | null
  overlay?: 'workspace' | null
}) {
  const dateLabel = props.date ? formatPlanHeaderDate(props.date) : null
  const primary = primaryLine(props)
  const secondary = secondaryLine(props, dateLabel)
  const contextLine = contextLineFor(props)
  const showKicker = props.overlay === 'workspace' || props.focus === 'class' || props.focus === 'lesson'

  return (
    <header
      className="plan-state-header"
      data-plan-view={props.view}
      data-plan-focus={props.focus}
      data-plan-overlay={props.overlay ?? 'none'}
      data-plan-date={props.date ?? ''}
      data-plan-course={props.courseId ?? ''}
      data-plan-section={props.sectionId ?? ''}
      data-plan-lesson={props.lessonId ?? ''}
      aria-label={`${primary}${secondary ? `, ${secondary}` : ''}${contextLine ? `, ${contextLine}` : ''}`}
    >
      {showKicker ? <p className="plan-state-kicker">{props.overlay === 'workspace' ? 'Workspace' : kickerLine(props)}</p> : null}
      <h1 className="plan-state-primary">{primary}</h1>
      {secondary ? <p className="plan-state-secondary">{secondary}</p> : null}
      {contextLine ? <p className="plan-state-context">{contextLine}</p> : null}
    </header>
  )
}

function kickerLine(props: {
  focus: PlanFocus
  sectionName?: string | null
  courseTitle?: string | null
  blockLabel?: string | null
  blockType?: 'teaching' | 'planning' | 'non-teaching' | null
}) {
  if (props.focus === 'lesson') return 'Lesson focus'
  if (props.focus === 'class' && props.blockType === 'planning') return 'Planning period'
  if (props.focus === 'class' && props.blockType === 'non-teaching') return props.blockLabel ?? 'Non-teaching time'
  if (props.focus === 'class') return [props.sectionName, props.courseTitle].filter(Boolean).join(' · ') || 'Class focus'
  return 'Teaching focus'
}

function primaryLine(props: {
  view: CalendarView
  focus: PlanFocus
  courseTitle?: string | null
  sectionName?: string | null
  unitTitle?: string | null
  lessonTitle?: string | null
  blockLabel?: string | null
  blockType?: 'teaching' | 'planning' | 'non-teaching' | null
}) {
  if (props.view === 'Week') {
    return props.courseTitle ? `${props.courseTitle} · This Week` : 'This Week'
  }
  if (props.view === 'Month') {
    return props.courseTitle ? `${props.courseTitle} · This Month` : 'This Month'
  }
  if (props.view === 'Year Map') {
    return props.courseTitle ? `${props.courseTitle} · School Year` : 'School Year · All Courses'
  }
  if (props.focus === 'lesson' && props.lessonTitle) return props.lessonTitle
  if (props.focus === 'class' && props.blockType === 'planning') return 'Planning period'
  if (props.focus === 'class' && props.blockType === 'non-teaching') return props.blockLabel ?? 'Non-teaching time'
  if (props.focus === 'class' && (props.sectionName || props.courseTitle)) {
    return [props.sectionName, props.courseTitle].filter(Boolean).join(' · ')
  }
  return 'My Teaching Day'
}

function secondaryLine(props: {
  view: CalendarView
  focus: PlanFocus
  courseTitle?: string | null
  sectionName?: string | null
  unitTitle?: string | null
  blockLabel?: string | null
  blockType?: 'teaching' | 'planning' | 'non-teaching' | null
  weekRange?: string | null
  monthLabel?: string | null
  yearLabel?: string | null
}, dateLabel: string | null) {
  if (props.view === 'Week') return props.weekRange ?? dateLabel
  if (props.view === 'Month') return props.monthLabel ?? dateLabel
  if (props.view === 'Year Map') return props.yearLabel ?? dateLabel
  if (props.focus === 'lesson') {
    return [props.sectionName, props.courseTitle, props.unitTitle, dateLabel].filter(Boolean).join(' · ')
  }
  if (props.focus === 'class' && props.blockType === 'planning') {
    return [props.blockLabel, dateLabel].filter(Boolean).join(' · ')
  }
  return dateLabel
}

function contextLineFor(props: {
  focus: PlanFocus
  blockType?: 'teaching' | 'planning' | 'non-teaching' | null
}) {
  if (props.focus === 'class' && props.blockType === 'planning') return 'Across my preps'
  return null
}
