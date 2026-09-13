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

  return (
    <div
      className="plan-state-header"
      data-plan-view={props.view}
      data-plan-focus={props.focus}
      data-plan-overlay={props.overlay ?? 'none'}
      data-plan-date={props.date ?? ''}
      data-plan-course={props.courseId ?? ''}
      data-plan-section={props.sectionId ?? ''}
      data-plan-lesson={props.lessonId ?? ''}
    >
      <p className="plan-state-kicker">{props.overlay === 'workspace' ? 'Workspace' : props.viewLabel}</p>
      <p className="plan-state-primary">{primary}</p>
      {secondary ? <p className="plan-state-secondary">{secondary}</p> : null}
    </div>
  )
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
  if (props.focus === 'lesson' && props.lessonTitle) return props.lessonTitle
  if (props.focus === 'class' && props.blockType === 'planning') return props.blockLabel ?? 'Planning time'
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
  weekRange?: string | null
}, dateLabel: string | null) {
  if (props.view === 'Week') return props.weekRange ?? dateLabel
  if (props.focus === 'lesson') {
    return [props.sectionName, props.courseTitle, props.unitTitle, dateLabel].filter(Boolean).join(' · ')
  }
  return dateLabel
}
