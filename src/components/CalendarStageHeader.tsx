import type { ISODate, SchoolCalendar } from '../calendar'
import type { CalendarView } from '../navigation/calendarViews'
import type { WorkspaceMode } from '../app/useWorkspaceMode'

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

  return (
    <header className="calendar-stage-header">
      <div>
        <p className="section-label">Calendar</p>
        <h1 className="view-title" aria-live="polite">{stageTitle}</h1>
      </div>

      {calendar && isCalendarMode && anchorDate && (
        <div className="calendar-header-tools">
          <div className="period-controls" aria-label={`${activeView} date navigation`}>
            <button type="button" className="quiet-button period-button" disabled={!previousTarget} onClick={onMovePrevious} aria-label={`Previous ${activeView}`}>←</button>
            <button type="button" className="quiet-button today-button" disabled={!todayTarget} onClick={onToday}>Today</button>
            <button type="button" className="quiet-button period-button" disabled={!nextTarget} onClick={onMoveNext} aria-label={`Next ${activeView}`}>→</button>
          </div>

          <div className="calendar-context-group">
            <p className="calendar-context" aria-label="Current school calendar">{calendar.schoolYearLabel}</p>
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
