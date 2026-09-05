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
  stageTitle: string
  onMovePrevious: () => void
  onMoveNext: () => void
  onToday: () => void
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
    stageTitle,
    onMovePrevious,
    onMoveNext,
    onToday,
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
          <div className="period-controls" role="group" aria-label={`${activeView} date navigation`}>
            <button type="button" className="quiet-button period-button" disabled={!previousTarget} onClick={onMovePrevious} aria-label={`Previous ${activeView}`}>←</button>
            <button type="button" className="quiet-button today-button" disabled={!todayTarget} onClick={onToday}>Today</button>
            <button type="button" className="quiet-button period-button" disabled={!nextTarget} onClick={onMoveNext} aria-label={`Next ${activeView}`}>→</button>
          </div>
          <p className="calendar-context">{calendar.schoolYearLabel}</p>
        </div>
      )}
    </header>
  )
}
