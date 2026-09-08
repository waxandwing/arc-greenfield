import type { ISODate, SchoolCalendar } from '../calendar'
import type { CalendarView } from '../navigation/calendarViews'
import type { WorkspaceMode } from '../app/useWorkspaceMode'
import { CalendarViewSwitcher } from './CalendarViewSwitcher'
import '../styles/calendarShell.css'
import '../styles/calendarShellAsset.css'
import '../styles/nonPlannerSurface.css'

type ViewAvailability = { available: boolean; reason?: string }

type CalendarStageHeaderProps = {
  activeView: CalendarView
  mode: WorkspaceMode
  calendar: SchoolCalendar | null
  anchorDate: ISODate | null
  previousTarget: ISODate | null
  nextTarget: ISODate | null
  todayTarget: ISODate | null
  hasTerms: boolean
  hasClasses: boolean
  hasUnits: boolean
  hasLessons: boolean
  recoveryCount: number
  undoAvailable: boolean
  stageTitle: string
  viewSelectionDisabled: boolean
  availabilityFor: (view: CalendarView) => ViewAvailability
  onSelectView: (view: CalendarView) => void
  onMovePrevious: () => void
  onMoveNext: () => void
  onToday: () => void
  onOpenCalendarSetup: () => void
  onOpenTerms: () => void
  onOpenClasses: () => void
  onOpenUnits: () => void
  onOpenLessons: () => void
  onOpenRecovery: () => void
  onUndoShift: () => void
}

export function CalendarStageHeader(props: CalendarStageHeaderProps) {
  const {
    activeView,
    mode,
    calendar,
    anchorDate,
    previousTarget,
    nextTarget,
    todayTarget,
    hasTerms,
    hasClasses,
    hasUnits,
    hasLessons,
    recoveryCount,
    undoAvailable,
    stageTitle,
    viewSelectionDisabled,
    availabilityFor,
    onSelectView,
    onMovePrevious,
    onMoveNext,
    onToday,
    onOpenCalendarSetup,
    onOpenTerms,
    onOpenClasses,
    onOpenUnits,
    onOpenLessons,
    onOpenRecovery,
    onUndoShift,
  } = props

  const isCalendarMode = mode === 'calendar'
  const monthLabel = anchorDate ? plannerMonth(anchorDate) : null
  const rangeLabel = anchorDate ? plannerRange(activeView, anchorDate, calendar?.schoolYearLabel) : null
  const nonPlannerTitle = !calendar && isCalendarMode ? 'Calendar setup' : stageTitle

  return (
    <header className="calendar-stage-header">
      <div className={calendar && isCalendarMode ? 'planner-header-primary' : undefined}>
        <p className="section-label">Calendar</p>
        {calendar && isCalendarMode ? (
          <>
            <div className="planner-date-lockup" aria-hidden="true">
              <p className="planner-month">{monthLabel}</p>
              <p className="planner-range">{rangeLabel}</p>
            </div>
            <CalendarViewSwitcher
              activeView={activeView}
              disabled={viewSelectionDisabled}
              availabilityFor={availabilityFor}
              onSelect={onSelectView}
            />
          </>
        ) : (
          <h1 className="view-title" aria-live="polite">{nonPlannerTitle}</h1>
        )}
      </div>

      {calendar && isCalendarMode && anchorDate && (
        <div className="calendar-header-tools">
          <div className="period-controls" role="group" aria-label={`${activeView} date navigation`}>
            <button type="button" className="quiet-button period-button" disabled={!previousTarget} onClick={onMovePrevious} aria-label={`Previous ${activeView}`}>←</button>
            <button type="button" className="quiet-button today-button" disabled={!todayTarget} onClick={onToday}>Today</button>
            <button type="button" className="quiet-button period-button" disabled={!nextTarget} onClick={onMoveNext} aria-label={`Next ${activeView}`}>→</button>
          </div>

          <div className="calendar-context-group">
            <p className="calendar-context">{calendar.schoolYearLabel}</p>
            <div className="calendar-context-actions">
              <button type="button" className="text-button" onClick={onOpenCalendarSetup}>Edit dates</button>
              <button type="button" className="text-button" onClick={onOpenTerms}>{hasTerms ? 'Edit terms' : 'Set terms'}</button>
              <button type="button" className="text-button" onClick={onOpenClasses}>{hasClasses ? 'Edit classes' : 'Set classes'}</button>
              {hasClasses && <button type="button" className="text-button" onClick={onOpenUnits}>{hasUnits ? 'Edit Units' : 'Add Units'}</button>}
              {hasUnits && <button type="button" className="text-button" onClick={onOpenLessons}>{hasLessons ? 'Edit Lessons' : 'Add Lessons'}</button>}
              {recoveryCount > 0 && <button type="button" className="text-button recovery-review-trigger" onClick={onOpenRecovery}>Review recovery ({recoveryCount})</button>}
              {undoAvailable && <button type="button" className="text-button" onClick={onUndoShift}>Undo last Shift</button>}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

function plannerMonth(date: ISODate): string {
  return new Intl.DateTimeFormat(undefined, { month: 'long', timeZone: 'UTC' }).format(toUTCDate(date))
}

function plannerRange(view: CalendarView, date: ISODate, schoolYearLabel?: string): string {
  const anchor = toUTCDate(date)
  const upperMonthDay = (value: Date) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(value).toUpperCase()

  if (view === 'Week') {
    const weekday = anchor.getUTCDay()
    const mondayOffset = weekday === 0 ? -6 : 1 - weekday
    const monday = new Date(anchor)
    monday.setUTCDate(anchor.getUTCDate() + mondayOffset)
    const friday = new Date(monday)
    friday.setUTCDate(monday.getUTCDate() + 4)
    return `WEEK · ${upperMonthDay(monday)} · ${upperMonthDay(friday)}`
  }
  if (view === 'Day') return `DAY · ${upperMonthDay(anchor)}`
  if (view === 'Month') return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(anchor).toUpperCase()
  if (view === 'Quarter') return `QUARTER · ${upperMonthDay(anchor)}`
  if (view === 'Year Map') return `YEAR · ${(schoolYearLabel || String(anchor.getUTCFullYear())).toUpperCase()}`
  return `${view.toUpperCase()} · ${upperMonthDay(anchor)}`
}

function toUTCDate(date: ISODate): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}
