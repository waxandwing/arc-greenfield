import { useEffect, useRef, useState } from 'react'
import type { CalendarView } from '../navigation/calendarViews'

type ViewAvailability = { available: boolean; reason?: string }

type CalendarViewSwitcherProps = {
  activeView: CalendarView
  disabled: boolean
  availabilityFor: (view: CalendarView) => ViewAvailability
  onSelect: (view: CalendarView) => void
}

const PLANNER_VIEWS: readonly CalendarView[] = ['Day', 'Week', 'Month', 'Year Map']

function viewLabel(view: CalendarView) {
  return view === 'Year Map' ? 'Year' : view
}

export function CalendarViewSwitcher({
  activeView,
  disabled,
  availabilityFor,
  onSelect,
}: CalendarViewSwitcherProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [open])

  useEffect(() => {
    setOpen(false)
  }, [activeView])

  function closeAndRestoreFocus() {
    setOpen(false)
    triggerRef.current?.focus()
  }

  const activeLabel = viewLabel(activeView)

  return (
    <div
      ref={rootRef}
      className="calendar-view-switcher"
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || !open) return
        event.preventDefault()
        closeAndRestoreFocus()
      }}
    >
      <h1 className="view-title" aria-live="polite" aria-label={activeLabel}>
        <button
          ref={triggerRef}
          type="button"
          className="view-title-trigger"
          aria-label={`Change calendar view, current ${activeLabel}`}
          aria-expanded={open}
          aria-controls="calendar-view-choices"
          disabled={disabled}
          onClick={() => setOpen((value) => !value)}
        >
          <span>{activeLabel}</span>
          <span className="view-title-chevron" aria-hidden="true">⌄</span>
        </button>
      </h1>

      {open && (
        <nav id="calendar-view-choices" className="calendar-view-choices" aria-label="Calendar views">
          {PLANNER_VIEWS.map((view) => {
            const availability = availabilityFor(view)
            const unavailable = !availability.available
            const isCurrent = view === activeView
            const label = viewLabel(view)

            return (
              <button
                key={view}
                type="button"
                className="view-choice"
                aria-current={isCurrent ? 'page' : undefined}
                aria-disabled={unavailable ? 'true' : undefined}
                aria-label={unavailable ? `${label}. ${availability.reason}` : label}
                title={unavailable ? availability.reason : undefined}
                onClick={() => {
                  if (unavailable) return
                  if (isCurrent) {
                    closeAndRestoreFocus()
                    return
                  }
                  onSelect(view)
                }}
              >
                {label}
              </button>
            )
          })}
        </nav>
      )}
    </div>
  )
}
