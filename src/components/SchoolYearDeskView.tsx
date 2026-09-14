import { useMemo, useState, type CSSProperties } from 'react'
import type { ISODate, SchoolCalendar } from '../calendar'
import { compareISODate } from '../calendar/dateMath'
import { buildYearDeskSnapshot, isInstructionalSchoolDay, quarterToneForDate } from '../planning/yearDeskProjection'
import { loadYearDeskState, saveYearDeskState, type YearDeskState } from '../planning/yearDeskPersistence'

type Props = {
  calendar: SchoolCalendar
  anchorDate: ISODate
  today?: ISODate
  onSelectDate?: (date: ISODate) => void
}

export function SchoolYearDeskView({ calendar, anchorDate, today = anchorDate, onSelectDate }: Props) {
  const [deskState, setDeskState] = useState<YearDeskState>(() => loadYearDeskState(calendar.id))
  const snapshot = useMemo(() => buildYearDeskSnapshot(calendar, today), [calendar, today])
  const caughtThrough = deskState.caughtUpThrough

  function persist(next: YearDeskState) {
    setDeskState(next)
    saveYearDeskState(next)
  }

  function markCaughtUp() {
    persist({ ...deskState, calendarId: calendar.id, caughtUpThrough: today })
  }

  function clearCaughtUp() {
    persist({ ...deskState, calendarId: calendar.id, caughtUpThrough: null })
  }

  function adjustZoom(delta: number) {
    persist({ ...deskState, calendarId: calendar.id, zoomPercent: deskState.zoomPercent + delta })
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
        </div>
        <div className="school-year-desk-controls">
          <div className="school-year-desk-zoom" aria-label="Year grid zoom">
            <button type="button" className="quiet-button" onClick={() => adjustZoom(-5)} aria-label="Zoom out">−</button>
            <span>{deskState.zoomPercent}%</span>
            <button type="button" className="quiet-button" onClick={() => adjustZoom(5)} aria-label="Zoom in">+</button>
          </div>
          <p className="school-year-desk-remain" role="status">
            <strong>{snapshot.remainingSchoolDays}</strong>
            <span>School days remain</span>
          </p>
          <button type="button" className="school-year-desk-caught" onClick={markCaughtUp}>Caught up</button>
          {caughtThrough ? (
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
      </ul>

      <div className="school-year-desk-grid">
        {snapshot.months.map((month) => (
          <MiniMonthGrid
            key={month.key}
            label={month.label}
            days={month.days}
            quarters={snapshot.quarters}
            anchorDate={anchorDate}
            caughtThrough={caughtThrough}
            today={today}
            onSelectDate={onSelectDate}
          />
        ))}
      </div>
    </section>
  )
}

function MiniMonthGrid({ label, days, quarters, anchorDate, caughtThrough, today, onSelectDate }: {
  label: string
  days: import('../calendar/projections').ProjectedDay[]
  quarters: SchoolCalendar['quarters']
  anchorDate: ISODate
  caughtThrough: ISODate | null
  today: ISODate
  onSelectDate?: (date: ISODate) => void
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
          const caught = caughtThrough ? compareISODate(day.date, caughtThrough) <= 0 && compareISODate(day.date, today) <= 0 && instructional : false
          const selected = day.date === anchorDate
          const noSchool = day.kind === 'no-school' || day.kind === 'holiday' || day.kind === 'break'
          const dayNumber = Number(day.date.slice(-2))
          return (
            <button
              type="button"
              key={day.date}
              className={[
                'school-year-mini-day',
                tone !== 'none' ? `school-year-mini-day--${tone}` : '',
                noSchool ? 'school-year-mini-day--no-school' : '',
                caught ? 'school-year-mini-day--caught' : '',
                selected ? 'school-year-mini-day--selected' : '',
                compareISODate(day.date, today) === 0 ? 'school-year-mini-day--today' : '',
              ].filter(Boolean).join(' ')}
              aria-label={`${label} ${dayNumber}${instructional ? ', instructional' : ''}${caught ? ', caught up' : ''}`}
              aria-current={selected ? 'date' : undefined}
              onClick={() => onSelectDate?.(day.date)}
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
