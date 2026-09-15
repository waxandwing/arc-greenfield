import type { ISODate, SchoolCalendar } from '../calendar'
import type { CalendarView } from '../navigation/calendarViews'
import type { WorkspaceMode } from '../app/useWorkspaceMode'
import { calendarViewLabel } from '../navigation/calendarViews'

type ViewAvailability = { available: boolean; reason?: string }

type CalendarStageHeaderProps = {
  activeView: CalendarView
  mode: WorkspaceMode
  calendar: SchoolCalendar | null
  anchorDate: ISODate | null
  previousTarget: ISODate | null
  nextTarget: ISODate | null
  todayTarget: ISODate | null
  recoveryCount: number
  undoAvailable: boolean
  stageTitle: string
  /** Plan state header owns the visible h1; spread shows period tools only. */
  editorialTitleManaged?: boolean
  viewSelectionDisabled: boolean
  availabilityFor: (view: CalendarView) => ViewAvailability
  onSelectView: (view: CalendarView) => void
  onMovePrevious: () => void
  onMoveNext: () => void
  onToday: () => void
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
    recoveryCount,
    undoAvailable,
    stageTitle,
    editorialTitleManaged = false,
    onMovePrevious,
    onMoveNext,
    onToday,
    onOpenRecovery,
    onUndoShift,
  } = props

  const isCalendarMode = mode === 'calendar'

  const showSpreadTitle = !editorialTitleManaged

  return (
    <header className={`calendar-stage-header${editorialTitleManaged ? ' calendar-stage-header--tools-only' : ''}`}>
      <div>
        {showSpreadTitle ? (
          <>
            <p className="section-label">Calendar</p>
            {calendar && isCalendarMode ? (
              <h1 className="view-title" aria-live="polite">{calendarViewLabel(activeView)}</h1>
            ) : (
              <h1 className="view-title" aria-live="polite">{stageTitle}</h1>
            )}
          </>
        ) : (
          <span className="section-label">{calendar && isCalendarMode ? `${calendarViewLabel(activeView)} navigation` : stageTitle}</span>
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
              {recoveryCount > 0 && (
                <button type="button" className="text-button recovery-review-trigger recovery-review-trigger--header recovery-review-trigger--quiet" onClick={onOpenRecovery}>
                  Recovery · {recoveryCount}
                </button>
              )}
              {undoAvailable && <button type="button" className="text-button" onClick={onUndoShift}>Undo last Shift</button>}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
