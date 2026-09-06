import { useMemo, useState } from 'react'
import type { CalendarView } from '../navigation/calendarViews'

type Props = {
  view: CalendarView
  showWeekends: boolean
  onOpenSetup: () => void
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function PreCalendarExplorer({ view, showWeekends, onOpenSetup }: Props) {
  const [anchor, setAnchor] = useState(() => startOfLocalDay(new Date()))
  const visibleView = view === 'Day' || view === 'Week' || view === 'Month' ? view : 'Month'
  const title = periodTitle(visibleView, anchor)

  const dates = useMemo(() => {
    if (visibleView === 'Day') return [anchor]
    if (visibleView === 'Week') {
      const monday = startOfMondayWeek(anchor)
      return Array.from({ length: showWeekends ? 7 : 5 }, (_, index) => addDays(monday, index))
    }
    return monthGrid(anchor)
  }, [anchor, showWeekends, visibleView])

  function move(direction: -1 | 1) {
    setAnchor((current) => {
      if (visibleView === 'Day') return addDays(current, direction)
      if (visibleView === 'Week') return addDays(current, direction * 7)
      return addMonths(current, direction)
    })
  }

  return (
    <section className="pre-calendar" aria-labelledby="pre-calendar-title">
      <div className="pre-calendar-intro">
        <div>
          <p className="section-label">You’re in Arc</p>
          <h2 id="pre-calendar-title">Look around before you finish setup.</h2>
          <p>These are ordinary calendar dates only. Arc does not know which days belong to your school yet, so nothing here is treated as instructional, closed, early release, or movable school truth.</p>
        </div>
        <button type="button" className="primary-button" onClick={onOpenSetup}>Add my school dates</button>
      </div>

      <div className="pre-calendar-period" role="group" aria-label={`${visibleView} exploration navigation`}>
        <button type="button" className="quiet-button period-button" onClick={() => move(-1)} aria-label={`Previous ${visibleView}`}>←</button>
        <div>
          <p className="section-label">Exploring</p>
          <h3>{title}</h3>
        </div>
        <button type="button" className="quiet-button period-button" onClick={() => move(1)} aria-label={`Next ${visibleView}`}>→</button>
      </div>

      {visibleView === 'Day' && (
        <article className="pre-calendar-day" aria-label={formatLongDate(anchor)}>
          <p className="pre-calendar-weekday">{formatWeekday(anchor)}</p>
          <p className="pre-calendar-day-number">{anchor.getDate()}</p>
          <p className="pre-calendar-neutral-note">School-day status not added yet.</p>
        </article>
      )}

      {visibleView === 'Week' && (
        <div className={`pre-calendar-week${showWeekends ? ' pre-calendar-week--seven' : ''}`} role="grid" aria-label={`${title} neutral calendar week`}>
          {dates.map((date) => (
            <div className="pre-calendar-cell" role="gridcell" key={dateKey(date)}>
              <p className="pre-calendar-weekday">{formatWeekday(date)}</p>
              <p className="pre-calendar-cell-date">{date.getDate()}</p>
            </div>
          ))}
        </div>
      )}

      {visibleView === 'Month' && (
        <div className="pre-calendar-month" role="grid" aria-label={`${title} neutral calendar month`}>
          {WEEKDAY_LABELS.map((label) => <div className="pre-calendar-weekday-heading" role="columnheader" key={label}>{label}</div>)}
          {dates.map((date) => {
            const outsideMonth = date.getMonth() !== anchor.getMonth()
            return (
              <div className={`pre-calendar-cell${outsideMonth ? ' pre-calendar-cell--outside' : ''}`} role="gridcell" key={dateKey(date)}>
                <span className="sr-only">{formatLongDate(date)}</span>
                <span aria-hidden="true">{date.getDate()}</span>
              </div>
            )
          })}
        </div>
      )}

      <div className="pre-calendar-boundary" role="status">
        <strong>Setup is still open.</strong> You can explore Day, Week, and Month now. Planning actions that need confirmed school dates stay unavailable until you review and use a school calendar.
      </div>
    </section>
  )
}

function monthGrid(anchor: Date): Date[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const start = startOfMondayWeek(first)
  return Array.from({ length: 42 }, (_, index) => addDays(start, index))
}

function periodTitle(view: 'Day' | 'Week' | 'Month', anchor: Date): string {
  if (view === 'Day') return formatLongDate(anchor)
  if (view === 'Week') {
    const start = startOfMondayWeek(anchor)
    const end = addDays(start, 6)
    return `${formatShortDate(start)} – ${formatShortDate(end)}`
  }
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(anchor)
}

function startOfMondayWeek(value: Date): Date {
  const date = startOfLocalDay(value)
  const offset = (date.getDay() + 6) % 7
  return addDays(date, -offset)
}

function startOfLocalDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

function addDays(value: Date, amount: number): Date {
  const next = new Date(value)
  next.setDate(next.getDate() + amount)
  return startOfLocalDay(next)
}

function addMonths(value: Date, amount: number): Date {
  const next = new Date(value.getFullYear(), value.getMonth() + amount, 1)
  return startOfLocalDay(next)
}

function dateKey(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

function formatWeekday(value: Date): string {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(value)
}

function formatLongDate(value: Date): string {
  return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(value)
}

function formatShortDate(value: Date): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(value)
}
