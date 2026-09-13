import type { PlanFocus } from '../calendar/navigationContext'
import type { ISODate } from '../calendar/types'
import { formatPlanHeaderDate } from './dateLabels'

export function PlanStateHeader(props: {
  viewLabel: string
  focus: PlanFocus
  date: ISODate | null
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
    <div className="plan-state-header" data-plan-focus={props.focus} data-plan-overlay={props.overlay ?? 'none'} data-plan-date={props.date ?? ''}>
      <p className="plan-state-kicker">{props.overlay === 'workspace' ? 'Workspace' : props.viewLabel}</p>
      <p className="plan-state-primary">{primary}</p>
      {secondary ? <p className="plan-state-secondary">{secondary}</p> : null}
    </div>
  )
}

function primaryLine(props: {
  focus: PlanFocus
  courseTitle?: string | null
  sectionName?: string | null
  unitTitle?: string | null
  lessonTitle?: string | null
  blockLabel?: string | null
  blockType?: 'teaching' | 'planning' | 'non-teaching' | null
}) {
  if (props.focus === 'lesson' && props.lessonTitle) return props.lessonTitle
  if (props.focus === 'class' && props.blockType === 'planning') return props.blockLabel ?? 'Planning time'
  if (props.focus === 'class' && props.blockType === 'non-teaching') return props.blockLabel ?? 'Non-teaching time'
  if (props.focus === 'class' && (props.sectionName || props.courseTitle)) {
    return [props.sectionName, props.courseTitle].filter(Boolean).join(' · ')
  }
  return 'My Teaching Day'
}

function secondaryLine(props: {
  focus: PlanFocus
  courseTitle?: string | null
  sectionName?: string | null
  unitTitle?: string | null
}, dateLabel: string | null) {
  if (props.focus === 'lesson') {
    return [props.sectionName, props.courseTitle, props.unitTitle, dateLabel].filter(Boolean).join(' · ')
  }
  return dateLabel
}
