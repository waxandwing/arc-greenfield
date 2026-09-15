import {
  eachCalendarDay,
  hydrateSchoolCalendar,
  instructionalDaysBetween,
  sundayFirstWeekdayIndex,
  validateHydrationInput,
  type CalendarHydrationInput,
  type ISODate,
  type SchoolCalendar,
} from '../calendar'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type Props = {
  input: CalendarHydrationInput
  sourceBackedEdit?: boolean
}

export function CalendarSetupConfirmPreview({ input, sourceBackedEdit = false }: Props) {
  if (!input.firstDay || !input.lastDay) {
    return (
      <div className="calendar-setup-confirm-preview calendar-setup-confirm-preview--empty">
        <p className="calendar-setup-confirm-kicker">Confirm</p>
        <strong>This is what your calendar will look like</strong>
        <p className="calendar-setup-confirm-hint">Enter your first and last day to preview instructional days, breaks, and exceptions.</p>
      </div>
    )
  }

  const hydrationErrors = validateHydrationInput(input)
  if (hydrationErrors.length > 0) {
    return (
      <div className="calendar-setup-confirm-preview calendar-setup-confirm-preview--empty">
        <p className="calendar-setup-confirm-kicker">Confirm</p>
        <strong>This is what your calendar will look like</strong>
        <p className="calendar-setup-confirm-hint">Fix the fields above to see a month preview before you save.</p>
      </div>
    )
  }

  const calendar = hydrateSchoolCalendar(input)
  const instructionalCount = instructionalDaysBetween(calendar, input.firstDay, input.lastDay).length
  const firstMonth = input.firstDay.slice(0, 7)
  const lastMonth = input.lastDay.slice(0, 7)
  const monthKeys = firstMonth === lastMonth ? [firstMonth] : [firstMonth, lastMonth]

  return (
    <section className="calendar-setup-confirm-preview" aria-label="Calendar confirmation preview">
      <div className="calendar-setup-confirm-copy">
        <p className="calendar-setup-confirm-kicker">Confirm</p>
        <strong>This is what your calendar looks like</strong>
        <p className="calendar-setup-confirm-summary">
          {input.schoolYearLabel.trim() || 'School year'}
          {' · '}
          {instructionalCount} instructional day{instructionalCount === 1 ? '' : 's'}
          {sourceBackedEdit ? ' · edits stay linked to your reviewed source' : ''}
        </p>
      </div>
      <div className="calendar-setup-confirm-months">
        {monthKeys.map((monthKey) => (
          <SetupMonthMiniGrid
            key={monthKey}
            monthKey={monthKey}
            rangeStart={input.firstDay}
            rangeEnd={input.lastDay}
            calendar={calendar}
          />
        ))}
      </div>
    </section>
  )
}

function SetupMonthMiniGrid({
  monthKey,
  rangeStart,
  rangeEnd,
  calendar,
}: {
  monthKey: string
  rangeStart: ISODate
  rangeEnd: ISODate
  calendar: SchoolCalendar
}) {
  const dates = eachCalendarDay(rangeStart, rangeEnd).filter((date) => date.startsWith(monthKey))
  if (dates.length === 0) return null

  const leading = sundayFirstWeekdayIndex(dates[0])
  const cells: Array<ISODate | null> = [...Array.from({ length: leading }, () => null), ...dates]
  while (cells.length % 7 !== 0) cells.push(null)

  const label = monthLabel(dates[0])

  return (
    <article className="calendar-setup-confirm-month" aria-label={`${label} preview`}>
      <h4>{label}</h4>
      <div className="source-calendar-weekdays" aria-hidden="true">
        {WEEKDAY_LABELS.map((token) => <span key={token}>{token}</span>)}
      </div>
      <div className="source-calendar-grid calendar-setup-confirm-grid" role="grid" aria-label={`${label} school days`}>
        {cells.map((date, index) => {
          if (!date) {
            return <span key={`blank-${index}`} className="source-calendar-day is-blank" role="presentation" />
          }
          const day = calendar.days[date]
          const dateNumber = Number(date.slice(-2))
          const kindLabel = day.kind.replace(/-/g, ' ')
          const aria = `${date}: ${kindLabel}${day.label ? `, ${day.label}` : ''}`
          return (
            <span
              key={date}
              className={`source-calendar-day is-${day.kind}`}
              role="gridcell"
              aria-label={aria}
              title={aria}
            >
              <span>{dateNumber}</span>
            </span>
          )
        })}
      </div>
    </article>
  )
}

function monthLabel(isoDate: ISODate): string {
  const date = new Date(`${isoDate}T12:00:00Z`)
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}
