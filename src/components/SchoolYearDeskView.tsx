import { useMemo, useState, type CSSProperties } from 'react'
import type { ISODate, SchoolCalendar } from '../calendar'
import { compareISODate } from '../calendar/dateMath'
import { currentLocalISODate } from '../calendar/navigation'
import {
  canToggleYearDeskDayCaughtUp,
  clearYearDeskCaughtUp,
  countRemainingSchoolDays,
  hasAnyYearDeskCaughtUp,
  isYearDeskDayCaughtUp,
  markYearDeskCaughtUpThroughToday,
  toggleYearDeskDayCaughtUp,
} from '../planning/yearDeskCaughtUp'
import { buildYearDeskSnapshot, isInstructionalSchoolDay, quarterToneForDate } from '../planning/yearDeskProjection'
import { loadYearDeskState, saveYearDeskState, type YearDeskState } from '../planning/yearDeskPersistence'

type Props = {
  calendar: SchoolCalendar
  anchorDate: ISODate
  today?: ISODate
  onSelectDate?: (date: ISODate) => void
}

export function SchoolYearDeskView({ calendar, anchorDate, today: todayProp, onSelectDate }: Props) {
  const today = todayProp ?? currentLocalISODate()
  const [deskState, setDeskState] = useState<YearDeskState>(() => loadYearDeskState(calendar.id))
  const snapshot = useMemo(() => buildYearDeskSnapshot(calendar, today), [calendar, today])
  const instructionalDates = useMemo(
    () => snapshot.months.flatMap((month) => month.days).filter(isInstructionalSchoolDay).map((day) => day.date),
    [snapshot],
  )
  const remainingSchoolDays = countRemainingSchoolDays(instructionalDates, today, deskState)
  const hasCaughtUp = hasAnyYearDeskCaughtUp(deskState)

  function persist(next: YearDeskState) {
    setDeskState(next)
    saveYearDeskState(next)
  }

  function markCaughtUp() {
    persist(markYearDeskCaughtUpThroughToday({ ...deskState, calendarId: calendar.id }, today))
  }

  function clearCaughtUp() {
    persist(clearYearDeskCaughtUp({ ...deskState, calendarId: calendar.id }))
  }

  function adjustZoom(delta: number) {
    persist({ ...deskState, calendarId: calendar.id, zoomPercent: deskState.zoomPercent + delta })
  }

  function handleDayActivate(date: ISODate, instructional: boolean) {
    if (canToggleYearDeskDayCaughtUp(date, today, instructional)) {
      persist(toggleYearDeskDayCaughtUp({ ...deskState, calendarId: calendar.id }, date, today, instructional))
      return
    }
    onSelectDate?.(date)
  }

  return (
    <section
      className="school-year-desk"
      aria-label={`${calendar.schoolYearLabel} school year desk`}
      data-testid="school-year-desk"
      style={{ '--year-desk-zoom': `${deskState.zoomPercent}%` } as CSSProperties}
    >
      <header className="school-year-desk-toolbar">
        <div>
          <p className="section-label">School year</p>
          <h2 className="school-year-desk-title">{calendar.schoolYearLabel}</h2>
          <p className="school-year-desk-hint">Click each past school day to mark that it happened.</p>
        </div>
        <div className="school-year-desk-controls">
          <div className="school-year-desk-zoom" aria-label="Year grid zoom">
            <button type="button" className="quiet-button" onClick={() => adjustZoom(-5)} aria-label="Zoom out">−</button>
            <span>{deskState.zoomPercent}%</span>
            <button type="button" className="quiet-button" onClick={() => adjustZoom(5)} aria-label="Zoom in">+</button>
          </div>
          <p className="school-year-desk-remain" role="status">
            <strong>{remainingSchoolDays}</strong>
            <span>School days remain</span>
          </p>
          <button type="button" className="school-year-desk-caught" onClick={markCaughtUp}>Caught up</button>
          {hasCaughtUp ? (
            <button type="button" className="quiet-button" onClick={clearCaughtUp}>Undo caught up</button>
          ) : null}
        </div>
      </header>

      <ul className="school-year-desk-legend" aria-label="Quarter legend">
        <li><span className="school-year-desk-legend-swatch school-year-desk-legend-swatch--q1" /> Q1</li>
        <li><span className="school-year-desk-legend-swatch school-year-desk-legend-swatch--q2" /> Q2</li>
        <li><span className="school-year-desk-legend-swatch school-year-desk-legend-swatch--q3" /> Q3</li>
        <li><span className="school-year-desk-legend-swatch school-year-desk-legend-swatch--q4" /> Q4</li>
        <li><span className="school-year-desk-legend-swatch school-year-desk-legend-swatch--no-school" /> No school</li>
        <li><span className="school-year-desk-legend-swatch school-year-desk-legend-swatch--countdown" /> Countdown</li>
        <li><span className="school-year-desk-legend-swatch school-year-desk-legend-swatch--caught" /> Caught up</li>
      </ul>

      <div className="school-year-desk-grid">
        {snapshot.months.map((month) => (
          <MiniMonthGrid
            key={month.key}
            label={month.label}
            days={month.days}
            quarters={snapshot.quarters}
            anchorDate={anchorDate}
            deskState={deskState}
            today={today}
            onActivateDay={handleDayActivate}
          />
        ))}
      </div>
    </section>
  )
}

function MiniMonthGrid({ label, days, quarters, anchorDate, deskState, today, onActivateDay }: {
  label: string
  days: import('../calendar/projections').ProjectedDay[]
  quarters: SchoolCalendar['quarters']
  anchorDate: ISODate
  deskState: YearDeskState
  today: ISODate
  onActivateDay: (date: ISODate, instructional: boolean) => void
}) {
  const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const firstWeekday = new Date(`${days[0]?.date ?? anchorDate}T12:00:00Z`).getUTCDay()
  const leading = Array.from({ length: firstWeekday }, (_, index) => index)

  return (
    <article className="school-year-mini-month" aria-label={label}>
      <h3>{label}</h3>
      <div className="school-year-mini-month-weekdays" aria-hidden="true">
        {weekdayLabels.map((token, index) => <span key={`${token}-${index}`}>{token}</span>)}
      </div>
      <div className="school-year-mini-month-cells">
        {leading.map((slot) => <span key={`pad-${slot}`} className="school-year-mini-day school-year-mini-day--pad" />)}
        {days.map((day) => {
          const tone = quarterToneForDate(day.date, quarters)
          const instructional = isInstructionalSchoolDay(day)
          const pastOrToday = compareISODate(day.date, today) <= 0
          const future = compareISODate(day.date, today) > 0
          const toggleable = canToggleYearDeskDayCaughtUp(day.date, today, instructional)
          const caught = isYearDeskDayCaughtUp(day.date, today, instructional, deskState)
          const pastOpen = toggleable && !caught
          const selected = day.date === anchorDate
          const noSchool = day.kind === 'no-school' || day.kind === 'holiday' || day.kind === 'break'
          const dayNumber = Number(day.date.slice(-2))
          const ariaExtra = [
            instructional ? 'instructional' : null,
            pastOpen ? 'not caught up, click to mark caught up' : null,
            caught ? 'caught up, click to undo' : null,
            instructional && future ? 'future, cannot mark caught up yet' : null,
          ].filter(Boolean).join(', ')
          return (
            <button
              type="button"
              key={day.date}
              className={[
                'school-year-mini-day',
                tone !== 'none' ? `school-year-mini-day--${tone}` : '',
                noSchool ? 'school-year-mini-day--no-school' : '',
                pastOrToday && instructional ? 'school-year-mini-day--happened' : '',
                pastOpen ? 'school-year-mini-day--past-open' : '',
                caught ? 'school-year-mini-day--caught' : '',
                instructional && future ? 'school-year-mini-day--future' : '',
                selected ? 'school-year-mini-day--selected' : '',
                compareISODate(day.date, today) === 0 ? 'school-year-mini-day--today' : '',
              ].filter(Boolean).join(' ')}
              aria-label={`${label} ${dayNumber}${ariaExtra ? `, ${ariaExtra}` : ''}`}
              aria-pressed={toggleable ? caught : undefined}
              aria-current={selected ? 'date' : undefined}
              title={
                instructional && future
                  ? 'Future days can’t be marked caught up yet'
                  : pastOpen
                    ? 'Mark this day caught up'
                    : caught
                      ? 'Undo caught up for this day'
                      : undefined
              }
              onClick={() => onActivateDay(day.date, instructional)}
            >
              <span className="school-year-mini-day-num">{dayNumber}</span>
              {caught ? <span className="school-year-mini-day-x" aria-hidden="true">×</span> : null}
            </button>
          )
        })}
      </div>
    </article>
  )
}
