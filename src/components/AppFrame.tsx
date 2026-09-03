import { useState } from 'react'
import { CalendarProjectionView } from './CalendarProjectionView'
import { sampleCalendar } from '../calendar/sampleCalendar'
import type { ISODate } from '../calendar/types'
import { CALENDAR_VIEWS, DEFAULT_HOME_VIEW, type CalendarView } from '../navigation/calendarViews'

const RENDER_ANCHOR_DATE: ISODate = '2026-08-12'

export function AppFrame() {
  const [activeView, setActiveView] = useState<CalendarView>(DEFAULT_HOME_VIEW)

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
          </header>

          <section className="calendar-canvas" aria-label={`${activeView} calendar workspace`}>
            <CalendarProjectionView
              view={activeView}
              calendar={sampleCalendar}
              anchorDate={RENDER_ANCHOR_DATE}
            />
          </section>
        </main>

        <div className="arc-overlay-layer" aria-hidden="true" />
      </div>
    </div>
  )
}
