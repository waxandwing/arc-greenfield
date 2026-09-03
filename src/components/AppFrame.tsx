import { useState } from 'react'
import { CalendarProjectionView } from './CalendarProjectionView'
import { CalendarSetup } from './CalendarSetup'
import { CALENDAR_VIEWS, DEFAULT_HOME_VIEW, type CalendarView } from '../navigation/calendarViews'
import {
  currentLocalISODate,
  loadCalendarFromBrowser,
  moveAnchor,
  saveCalendarToBrowser,
  todayAnchor,
  type CalendarHydrationInput,
  type ISODate,
  type PeriodDirection,
  type SchoolCalendar,
} from '../calendar'

export function AppFrame() {
  const [initialLoad] = useState(() => loadCalendarFromBrowser())
  const restored = initialLoad.status === 'restored' ? initialLoad.restored : null

  const [activeView, setActiveView] = useState<CalendarView>(DEFAULT_HOME_VIEW)
  const [calendar, setCalendar] = useState<SchoolCalendar | null>(restored?.calendar ?? null)
  const [calendarInput, setCalendarInput] = useState<CalendarHydrationInput | null>(restored?.input ?? null)
  const [anchorDate, setAnchorDate] = useState<ISODate | null>(restored?.calendar.firstDay ?? null)
  const [editingCalendar, setEditingCalendar] = useState(false)
  const [storageNotice, setStorageNotice] = useState<string | null>(() => {
    if (initialLoad.status === 'invalid') return 'Arc found saved calendar data it could not verify. Nothing was restored; please confirm the calendar again.'
    if (initialLoad.status === 'unavailable') return 'Calendar storage is unavailable in this browser. Changes may last only for this session.'
    return null
  })

  function useCalendar(nextCalendar: SchoolCalendar, input: CalendarHydrationInput) {
    const persisted = saveCalendarToBrowser(input)
    setCalendar(nextCalendar)
    setCalendarInput(input)
    setAnchorDate(nextCalendar.firstDay)
    setActiveView(DEFAULT_HOME_VIEW)
    setEditingCalendar(false)
    setStorageNotice(persisted ? null : 'This calendar is active for this session, but Arc could not save it in this browser.')
  }

  function movePeriod(direction: PeriodDirection) {
    if (!calendar || !anchorDate) return
    const next = moveAnchor(calendar, activeView, anchorDate, direction)
    if (next) setAnchorDate(next)
  }

  function goToday() {
    if (!calendar) return
    const today = todayAnchor(calendar, currentLocalISODate())
    if (today) setAnchorDate(today)
  }

  const showSetup = !calendar || !anchorDate || editingCalendar
  const previousTarget = calendar && anchorDate ? moveAnchor(calendar, activeView, anchorDate, 'previous') : null
  const nextTarget = calendar && anchorDate ? moveAnchor(calendar, activeView, anchorDate, 'next') : null
  const todayTarget = calendar ? todayAnchor(calendar, currentLocalISODate()) : null

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
                disabled={showSetup}
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

            {calendar && !editingCalendar && anchorDate && (
              <div className="calendar-header-tools">
                <div className="period-controls" aria-label={`${activeView} date navigation`}>
                  <button type="button" className="quiet-button period-button" disabled={!previousTarget} onClick={() => movePeriod('previous')} aria-label={`Previous ${activeView}`}>←</button>
                  <button type="button" className="quiet-button today-button" disabled={!todayTarget} onClick={goToday}>Today</button>
                  <button type="button" className="quiet-button period-button" disabled={!nextTarget} onClick={() => movePeriod('next')} aria-label={`Next ${activeView}`}>→</button>
                </div>
                <div className="calendar-context-group">
                  <p className="calendar-context" aria-label="Current school calendar">{calendar.schoolYearLabel}</p>
                  <button type="button" className="text-button" onClick={() => setEditingCalendar(true)}>Edit dates</button>
                </div>
              </div>
            )}
          </header>

          {storageNotice && <p className="storage-notice" role="status">{storageNotice}</p>}

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
