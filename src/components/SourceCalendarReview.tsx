import { eachCalendarDay, hydrateSchoolCalendar, type CalendarHydrationInput, type ISODate } from '../calendar'

type Props = {
  input: CalendarHydrationInput
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function SourceCalendarReview({ input }: Props) {
  const calendar = hydrateSchoolCalendar(input)
  const dates = eachCalendarDay(input.firstDay, input.lastDay).slice(0, 35)
  const leading = dates.length > 0 ? mondayColumn(dates[0]) : 0
  const previewCells: Array<ISODate | null> = [
    ...Array.from({ length: leading }, () => null),
    ...dates,
  ]

  while (previewCells.length % 7 !== 0) previewCells.push(null)

  const sourceLabel = input.patternSource === 'district-source' ? 'District source' : 'Imported source'
  const evidence = input.provenance ?? []
  const uncertainCount = Object.values(calendar.days).filter((day) => day.confidence && day.confidence !== 'confirmed').length

  return (
    <section className="source-calendar-review" aria-labelledby="source-calendar-review-title">
      <div className="source-calendar-review-copy">
        <p className="section-label">Source-backed calendar</p>
        <h3 id="source-calendar-review-title">Check the school-year truth before you change it.</h3>
        <p>
          Arc is holding onto where this calendar came from. Editing dates here will not erase that source record.
        </p>
      </div>

      <dl className="source-calendar-facts">
        <div><dt>Source</dt><dd>{sourceLabel}</dd></div>
        <div><dt>Confidence</dt><dd>{capitalize(input.patternConfidence)}</dd></div>
        <div><dt>School year</dt><dd>{input.schoolYearLabel}</dd></div>
        <div><dt>Dates</dt><dd>{input.firstDay} → {input.lastDay}</dd></div>
      </dl>

      {evidence.length > 0 && (
        <section className="source-calendar-evidence" aria-label="Calendar source evidence">
          <p className="source-calendar-kicker">Evidence</p>
          <ul>
            {evidence.map((item) => (
              <li key={item.id}>
                <strong>{item.label}</strong>
                {item.locator && <span>{item.locator}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="source-calendar-miniature" aria-label="Miniature school calendar preview">
        <div className="source-calendar-miniature-heading">
          <div>
            <p className="source-calendar-kicker">Mini calendar</p>
            <strong>First five weeks</strong>
          </div>
          <p>{uncertainCount > 0 ? `${uncertainCount} date${uncertainCount === 1 ? '' : 's'} still carry mixed or inferred confidence.` : 'All previewed calendar truth is confirmed.'}</p>
        </div>
        <div className="source-calendar-weekdays" aria-hidden="true">
          {WEEKDAY_LABELS.map((label) => <span key={label}>{label}</span>)}
        </div>
        <div className="source-calendar-grid" role="grid" aria-label="First five school-calendar weeks">
          {previewCells.map((date, index) => {
            if (!date) return <span key={`blank-${index}`} className="source-calendar-day is-blank" role="presentation" />
            const day = calendar.days[date]
            const dateNumber = Number(date.slice(-2))
            const label = `${date}: ${day.kind}${day.label ? `, ${day.label}` : ''}${day.confidence ? `, ${day.confidence}` : ''}`
            return (
              <span
                key={date}
                className={`source-calendar-day is-${day.kind}${day.confidence && day.confidence !== 'confirmed' ? ' is-uncertain' : ''}`}
                role="gridcell"
                aria-label={label}
                title={label}
              >
                <span>{dateNumber}</span>
              </span>
            )
          })}
        </div>
      </section>
    </section>
  )
}

function mondayColumn(date: ISODate) {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay()
  return day === 0 ? 6 : day - 1
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
