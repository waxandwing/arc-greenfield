import { CALENDAR_VIEWS, type CalendarView } from '../navigation/calendarViews'

type ViewAvailability = { available: boolean; reason?: string }

type CalendarViewSwitcherProps = {
  activeView: CalendarView
  disabled: boolean
  availabilityFor: (view: CalendarView) => ViewAvailability
  onSelect: (view: CalendarView) => void
}

/* Canonical product navigation is range-based: Day / Week / Month / Quarter / Year.
   Semester remains in the domain model for term context, but is not a primary product tab. */
const PRESENTATION_ORDER: readonly CalendarView[] = ['Day', 'Week', 'Month', 'Quarter', 'Year Map']

export function CalendarViewSwitcher({ activeView, disabled, availabilityFor, onSelect }: CalendarViewSwitcherProps) {
  return (
    <nav className="calendar-view-switcher" aria-label="Calendar views">
      {PRESENTATION_ORDER.filter((view) => CALENDAR_VIEWS.includes(view)).map((view) => {
        const availability = availabilityFor(view)
        const isCurrent = view === activeView
        const displayLabel = view === 'Year Map' ? 'Year' : view
        const unavailable = disabled || !availability.available

        return (
          <button
            key={view}
            type="button"
            className="view-nav-item"
            aria-current={isCurrent ? 'page' : undefined}
            aria-disabled={unavailable ? 'true' : undefined}
            aria-label={!availability.available && availability.reason ? `${displayLabel}. ${availability.reason}` : displayLabel}
            title={!availability.available ? availability.reason : undefined}
            disabled={disabled}
            onClick={() => {
              if (!availability.available || isCurrent) return
              onSelect(view)
            }}
          >
            {displayLabel}
          </button>
        )
      })}
    </nav>
  )
}
