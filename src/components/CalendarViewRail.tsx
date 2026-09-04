import { useLayoutEffect, useRef } from 'react'
import { CALENDAR_VIEWS, type CalendarView } from '../navigation/calendarViews'

type ViewAvailability = { available: boolean; reason?: string }

type CalendarViewRailProps = {
  activeView: CalendarView
  disabled: boolean
  availabilityFor: (view: CalendarView) => ViewAvailability
  onSelect: (view: CalendarView) => void
}

export function CalendarViewRail({ activeView, disabled, availabilityFor, onSelect }: CalendarViewRailProps) {
  const railRef = useRef<HTMLElement | null>(null)
  const activeViewRef = useRef<HTMLButtonElement | null>(null)

  useLayoutEffect(() => {
    const rail = railRef.current
    const active = activeViewRef.current
    if (!rail || !active || rail.scrollWidth <= rail.clientWidth) return

    const activeStart = active.offsetLeft
    const activeEnd = activeStart + active.offsetWidth
    const visibleStart = rail.scrollLeft
    const visibleEnd = visibleStart + rail.clientWidth

    if (activeStart < visibleStart) rail.scrollLeft = activeStart
    else if (activeEnd > visibleEnd) rail.scrollLeft = activeEnd - rail.clientWidth
  }, [activeView])

  return (
    <nav ref={railRef} className="arc-view-rail" aria-label="Calendar views">
      {CALENDAR_VIEWS.map((view) => {
        const isCurrent = activeView === view
        const availability = availabilityFor(view)
        const unavailable = !availability.available

        return (
          <button
            key={view}
            ref={isCurrent ? activeViewRef : undefined}
            type="button"
            className="view-nav-item"
            aria-current={isCurrent ? 'page' : undefined}
            aria-disabled={!disabled && unavailable ? 'true' : undefined}
            aria-label={!disabled && unavailable ? `${view}. ${availability.reason}` : view}
            title={!disabled && unavailable ? availability.reason : undefined}
            disabled={disabled}
            onClick={() => {
              if (!unavailable) onSelect(view)
            }}
          >
            {view}
          </button>
        )
      })}
    </nav>
  )
}
