import { useState } from 'react'
import { CalendarProjectionView } from './CalendarProjectionView'
import { CalendarSetup } from './CalendarSetup'
import { CALENDAR_VIEWS, DEFAULT_HOME_VIEW, type CalendarView } from '../navigation/calendarViews'
import type { CalendarHydrationInput, ISODate, SchoolCalendar } from '../calendar'

export function AppFrame() {
  const [activeView, setActiveView] = useState<CalendarView>(DEFAULT_HOME_VIEW)
  const [calendar, setCalendar] = useState<SchoolCalendar | null>(null)
  const [calendarInput, setCalendarInput] = useState<CalendarHydrationInput | null>(null)
  const [anchorDate, setAnchorDate] = useState<ISODate | null>(null)
  const [editingCalendar, setEditingCalendar] = useState(false)

  function useCalendar(nextCalendar: SchoolCalendar, input: CalendarHydrationInput) {
    setCalendar(nextCalendar)
    setCalendarInput(input)
    setAnchorDate(nextCalendar.firstDay)
    setActiveView(DEFAULT_HOME_VIEW)
    setEditingCalendar(false)
  }

  const showSetup = !calendar || !anchorDate || editingCalendar

  return (
    <div className="arc-shell">
      <a className="skip-link" href="#calendar-stage">Skip to calendar</a>

      <header className="arc-header" aria-label="Arc application header">
        <button
          className="arc-wordmark"
          type="button"
          aria-label={`Return to ${DEFAULT_HOME_VIEW} view`}
          onClick={() => setActiveView(DEFAULT_HOME_VIEW)}
        >
          arc
        </button>
        <div className="arc-header-space" aria-hidden="true" />
      </header>

      <div className="arc-layout">
        <nav className="arc-view-rail" aria-label="Calendar views">
          {CALENDAR_VIEWS.map((view) => {
            const isCurrent = activeView === view
            return (
              <button
                key={view}
                type="button"
                className="view-nav-item"
                aria-current={isCurrent ? 'page' : undefined}
                onClick={() => setActiveView(view)}
              >
                {view}
              </button>
            )
          })}
        </nav>

        <main id="calendar-stage" className="arc-calendar-stage" tabIndex={-1}>
          <header className="calendar-stage-header">
            <div>
              <p className="section-label">Calendar</p>
              <h1 className="view-title" aria-live="polite">{activeView}</h1>
            </div>
            {calendar && !editingCalendar && (
              <div className="calendar-context-group">
                <p className="calendar-context" aria-label="Current school calendar">{calendar.schoolYearLabel}</p>
                <button type="button" className="text-button" onClick={() => setEditingCalendar(true)}>Edit dates</button>
              </div>
            )}
          </header>

          <section className="calendar-canvas" aria-label={`${activeView} calendar workspace`}>
            {showSetup ? (
              <CalendarSetup
                initialValue={calendarInput}
                onSave={useCalendar}
                onCancel={calendar ? () => setEditingCalendar(false) : undefined}
              />
            ) : (
              <CalendarProjectionView view={activeView} calendar={calendar} anchorDate={anchorDate} />
            )}
          </section>
        </main>

        <div className="arc-overlay-layer" aria-hidden="true" />
      </div>
    </div>
  )
}
