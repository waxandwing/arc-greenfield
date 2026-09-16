import {
  eachCalendarDay,
  hydrateSchoolCalendar,
  instructionalDaysBetween,
  isPlannableDayKind,
  sundayFirstWeekdayIndex,
  validateHydrationInput,
  type CalendarHydrationInput,
  type DayKind,
  type ISODate,
  type SchoolCalendar,
} from '../calendar'

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

type Props = {
  input: CalendarHydrationInput
  sourceBackedEdit?: boolean
}

export function CalendarSetupConfirmPreview({ input, sourceBackedEdit = false }: Props) {
  if (!input.firstDay || !input.lastDay) {
    return (
      <div className="calendar-setup-confirm-preview calendar-setup-confirm-preview--empty">
        <div className="calendar-setup-confirm-copy">
          <p className="calendar-setup-confirm-kicker">Confirm</p>
          <h3 className="calendar-setup-confirm-title">This is what your calendar will look like</h3>
          <p className="calendar-setup-confirm-hint">Enter your first and last day to preview instructional days, breaks, and exceptions.</p>
        </div>
      </div>
    )
  }

  const hydrationErrors = validateHydrationInput(input)
  if (hydrationErrors.length > 0) {
    return (
      <div className="calendar-setup-confirm-preview calendar-setup-confirm-preview--empty">
        <div className="calendar-setup-confirm-copy">
          <p className="calendar-setup-confirm-kicker">Confirm</p>
          <h3 className="calendar-setup-confirm-title">This is what your calendar will look like</h3>
          <p className="calendar-setup-confirm-hint">Fix the fields above to see a month preview before you save.</p>
        </div>
      </div>
    )
  }

  const calendar = hydrateSchoolCalendar(input)
  const instructionalCount = instructionalDaysBetween(calendar, input.firstDay, input.lastDay).length
  const monthKeys = monthKeysInSchoolYear(input.firstDay, input.lastDay)

  return (
    <section className="calendar-setup-confirm-preview" aria-label="Calendar confirmation preview">
      <div className="calendar-setup-confirm-copy">
        <p className="calendar-setup-confirm-kicker">Confirm</p>
        <h3 className="calendar-setup-confirm-title">This is what your calendar looks like</h3>
        <p className="calendar-setup-confirm-summary">
          {input.schoolYearLabel.trim() || 'School year'}
          {' · '}
          {instructionalCount} instructional day{instructionalCount === 1 ? '' : 's'}
          {sourceBackedEdit ? ' · edits stay linked to your reviewed source' : ''}
        </p>
        <ul className="calendar-setup-confirm-legend" aria-label="Day color key">
          <li>
            <span className="calendar-setup-confirm-swatch calendar-setup-confirm-swatch--school" aria-hidden="true" />
            School days
          </li>
          <li>
            <span className="calendar-setup-confirm-swatch calendar-setup-confirm-swatch--break" aria-hidden="true" />
            Breaks &amp; no school
          </li>
          <li>
            <span className="calendar-setup-confirm-swatch calendar-setup-confirm-swatch--workday" aria-hidden="true" />
            Teacher workdays
          </li>
        </ul>
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

/** Contiguous YYYY-MM keys from the school year's first day through last day. */
function monthKeysInSchoolYear(firstDay: ISODate, lastDay: ISODate): string[] {
  const keys: string[] = []
  let year = Number(firstDay.slice(0, 4))
  let month = Number(firstDay.slice(5, 7))
  const endYear = Number(lastDay.slice(0, 4))
  const endMonth = Number(lastDay.slice(5, 7))

  while (year < endYear || (year === endYear && month <= endMonth)) {
    keys.push(`${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`)
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }

  return keys
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
      <h4 className="calendar-setup-confirm-month-label">{label}</h4>
      <div className="source-calendar-weekdays calendar-setup-confirm-weekdays" aria-hidden="true">
        {WEEKDAY_LABELS.map((token, index) => (
          <span key={`${token}-${index}`}>{token}</span>
        ))}
      </div>
      <div className="source-calendar-grid calendar-setup-confirm-grid" role="grid" aria-label={`${label} school days`}>
        {cells.map((date, index) => {
          if (!date) {
            return <span key={`blank-${index}`} className="source-calendar-day is-blank" role="presentation" />
          }
          const day = calendar.days[date]
          const dateNumber = Number(date.slice(-2))
          const kindLabel = day.kind.replace(/-/g, ' ')
          const tone = dayToneClass(day.kind)
          const aria = `${date}: ${kindLabel}${day.label ? `, ${day.label}` : ''}`
          return (
            <span
              key={date}
              className={`source-calendar-day calendar-setup-confirm-day is-${day.kind}${tone}`}
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

function dayToneClass(kind: DayKind): string {
  if (isPlannableDayKind(kind)) return ' is-school-day'
  if (kind === 'teacher-workday') return ' is-workday'
  if (kind === 'break' || kind === 'holiday' || kind === 'no-school') return ' is-break-day'
  return ''
}

function monthLabel(isoDate: ISODate): string {
  const date = new Date(`${isoDate}T12:00:00Z`)
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}
