import { CALENDAR_VIEWS, type CalendarView } from '../navigation/calendarViews'

type ViewAvailability = { available: boolean; reason?: string }

export function CalendarViewTabs({
  activeView,
  disabled,
  availabilityFor,
  onSelect,
}: {
  activeView: CalendarView
  disabled: boolean
  availabilityFor: (view: CalendarView) => ViewAvailability
  onSelect: (view: CalendarView) => void
}) {
  return (
    <nav className="calendar-view-tabs" aria-label="Calendar views">
      {CALENDAR_VIEWS.map((view) => {
        const isCurrent = activeView === view
        const availability = availabilityFor(view)
        return (
          <button
            key={view}
            type="button"
            className="calendar-view-tab"
            aria-current={isCurrent ? 'page' : undefined}
            aria-disabled={!disabled && !availability.available ? 'true' : undefined}
            title={!disabled && !availability.available ? availability.reason : undefined}
            disabled={disabled}
            onClick={() => availability.available && onSelect(view)}
          >
            {view}
          </button>
        )
      })}
    </nav>
  )
}
