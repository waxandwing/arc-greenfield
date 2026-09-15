import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { CalendarView } from '../navigation/calendarViews'
import { calendarViewLabel } from '../navigation/calendarViews'

type ViewAvailability = { available: boolean; reason?: string }

type IndexNav = {
  activeView: CalendarView
  viewSelectionDisabled: boolean
  availabilityFor: (view: CalendarView) => ViewAvailability
  onSelectView: (view: CalendarView) => void
}

type Props = {
  open: boolean
  onClose: () => void
  indexNav: IndexNav
  children: ReactNode
  returnFocusRef?: React.RefObject<HTMLElement | null>
}

const VIEW_TABS: { view: CalendarView; label: string; tabClass: string }[] = [
  { view: 'Day', label: 'DAY', tabClass: 'arc-index-tab--day' },
  { view: 'Week', label: 'WEEK', tabClass: 'arc-index-tab--week' },
  { view: 'Month', label: 'MONTH', tabClass: 'arc-index-tab--month' },
  { view: 'Year Map', label: 'YEAR', tabClass: 'arc-index-tab--year' },
]

export function DeskCalendarPopOut({ open, onClose, indexNav, children, returnFocusRef }: Props) {
  const titleId = useId()
  const layerRef = useRef<HTMLDivElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)

  const close = useCallback(() => {
    onClose()
    const restore = returnFocusRef?.current
    if (restore && typeof restore.focus === 'function') {
      requestAnimationFrame(() => restore.focus())
    }
  }, [onClose, returnFocusRef])

  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() => {
      closeRef.current?.focus()
    })
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }
      if (event.key !== 'Tab' || !layerRef.current) return
      const focusables = layerRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, close])

  if (!open) return null

  return createPortal(
    <div
      ref={layerRef}
      className="desk-calendar-popout-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-testid="desk-calendar-popout"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close()
      }}
    >
      <div className="desk-calendar-popout-stage" onMouseDown={(event) => event.stopPropagation()}>
        <div className="desk-calendar-popout-planner">
          <header className="desk-calendar-popout-header">
            <div>
              <p className="b01-furniture-kicker">Planner</p>
              <h2 id={titleId}>Calendar focus</h2>
              <p className="desk-calendar-popout-subtitle">{calendarViewLabel(indexNav.activeView)} view</p>
            </div>
            <button
              ref={closeRef}
              type="button"
              className="quiet-button desk-calendar-popout-dismiss"
              data-testid="desk-calendar-popout-dismiss"
              onClick={close}
            >
              Back to desk
            </button>
          </header>
          <nav className="desk-calendar-popout-tabs arc-index-tabs" aria-label="Calendar views">
            {VIEW_TABS.map(({ view, label, tabClass }) => {
              const availability = indexNav.availabilityFor(view)
              const active = indexNav.activeView === view
              return (
                <button
                  key={view}
                  type="button"
                  className={`arc-index-tab desk-calendar-popout-tab ${tabClass}`}
                  aria-current={active ? 'page' : undefined}
                  disabled={indexNav.viewSelectionDisabled || !availability.available}
                  title={availability.reason}
                  data-testid={`desk-calendar-popout-tab-${label.toLowerCase()}`}
                  onClick={() => indexNav.onSelectView(view)}
                >
                  {label}
                </button>
              )
            })}
          </nav>
          <div className="desk-calendar-popout-body" data-testid="desk-calendar-popout-body">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
