import { FormEvent, useMemo, useState } from 'react'
import {
  hydrateSchoolCalendar,
  validateHydrationInput,
  type CalendarDay,
  type DayKind,
  type ISODate,
  type SchoolCalendar,
  type Weekday,
} from '../calendar'

const WEEKDAYS: Array<{ value: Weekday; label: string }> = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
]

const DAY_KINDS: Array<{ value: Exclude<DayKind, 'unknown'>; label: string }> = [
  { value: 'no-school', label: 'No school' },
  { value: 'teacher-workday', label: 'Teacher workday' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'break', label: 'Break' },
  { value: 'instructional', label: 'Instructional day' },
]

type DraftException = {
  id: string
  date: string
  kind: Exclude<DayKind, 'unknown'>
  label: string
}

type Props = {
  onSave: (calendar: SchoolCalendar) => void
}

export function CalendarSetup({ onSave }: Props) {
  const [schoolYearLabel, setSchoolYearLabel] = useState('')
  const [firstDay, setFirstDay] = useState('')
  const [lastDay, setLastDay] = useState('')
  const [weekdays, setWeekdays] = useState<Weekday[]>([1, 2, 3, 4, 5])
  const [exceptions, setExceptions] = useState<DraftException[]>([])
  const [errors, setErrors] = useState<string[]>([])

  const input = useMemo(() => ({
    id: schoolYearLabel.trim() ? `manual-${schoolYearLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : 'manual-school-year',
    schoolYearLabel: schoolYearLabel.trim(),
    firstDay: firstDay as ISODate,
    lastDay: lastDay as ISODate,
    instructionalWeekdays: weekdays,
    patternSource: 'manual' as const,
    patternConfidence: 'confirmed' as const,
    exceptions: exceptions
      .filter((item) => item.date)
      .map<CalendarDay>((item) => ({
        date: item.date as ISODate,
        kind: item.kind,
        label: item.label.trim() || undefined,
        source: 'manual',
        confidence: 'confirmed',
      })),
  }), [schoolYearLabel, firstDay, lastDay, weekdays, exceptions])

  function toggleWeekday(day: Weekday) {
    setWeekdays((current) => current.includes(day)
      ? current.filter((value) => value !== day)
      : [...current, day])
  }

  function addException() {
    setExceptions((current) => [...current, {
      id: crypto.randomUUID(),
      date: '',
      kind: 'no-school',
      label: '',
    }])
  }

  function updateException(id: string, patch: Partial<DraftException>) {
    setExceptions((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item))
  }

  function removeException(id: string) {
    setExceptions((current) => current.filter((item) => item.id !== id))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = [
      ...(schoolYearLabel.trim() ? [] : ['Give this school year a label.']),
      ...validateHydrationInput(input),
    ]

    if (nextErrors.length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors([])
    onSave(hydrateSchoolCalendar(input))
  }

  return (
    <section className="calendar-setup" aria-labelledby="calendar-setup-title">
      <div className="calendar-setup-intro">
        <p className="section-label">Calendar setup</p>
        <h2 id="calendar-setup-title">Tell Arc which days are actually yours.</h2>
        <p>Start with the normal week. Add the dates that break the pattern. Arc will not move plans until this calendar is confirmed.</p>
      </div>

      <form className="calendar-setup-form" onSubmit={submit} noValidate>
        {errors.length > 0 && (
          <div className="setup-errors" role="alert" aria-label="Calendar setup issues">
            <strong>Check these before saving:</strong>
            <ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul>
          </div>
        )}

        <div className="setup-field-grid">
          <label>
            <span>School year</span>
            <input
              value={schoolYearLabel}
              onChange={(event) => setSchoolYearLabel(event.target.value)}
              placeholder="2026–27"
              autoComplete="off"
            />
          </label>
          <label>
            <span>First day</span>
            <input type="date" value={firstDay} onChange={(event) => setFirstDay(event.target.value)} />
          </label>
          <label>
            <span>Last day</span>
            <input type="date" value={lastDay} onChange={(event) => setLastDay(event.target.value)} />
          </label>
        </div>

        <fieldset className="weekday-fieldset">
          <legend>Normal instructional week</legend>
          <div className="weekday-options">
            {WEEKDAYS.map((day) => (
              <label key={day.value} className="weekday-option">
                <input
                  type="checkbox"
                  checked={weekdays.includes(day.value)}
                  onChange={() => toggleWeekday(day.value)}
                />
                <span>{day.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="exceptions-section">
          <div className="exceptions-heading">
            <div>
              <h3>Exceptions</h3>
              <p>Workdays, breaks, holidays, unusual Saturdays, or anything else that changes the normal week.</p>
            </div>
            <button type="button" className="quiet-button" onClick={addException}>Add date</button>
          </div>

          {exceptions.length === 0 ? (
            <p className="empty-exceptions">No exceptions added yet.</p>
          ) : (
            <div className="exception-list">
              {exceptions.map((item) => (
                <div className="exception-row" key={item.id}>
                  <label>
                    <span className="sr-only">Exception date</span>
                    <input type="date" value={item.date} onChange={(event) => updateException(item.id, { date: event.target.value })} />
                  </label>
                  <label>
                    <span className="sr-only">Exception type</span>
                    <select value={item.kind} onChange={(event) => updateException(item.id, { kind: event.target.value as DraftException['kind'] })}>
                      {DAY_KINDS.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}
                    </select>
                  </label>
                  <label className="exception-label-field">
                    <span className="sr-only">Optional label</span>
                    <input value={item.label} onChange={(event) => updateException(item.id, { label: event.target.value })} placeholder="Optional label" />
                  </label>
                  <button type="button" className="text-button" onClick={() => removeException(item.id)}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="setup-actions">
          <p>Manual setup is treated as confirmed only because you are explicitly declaring the pattern and exceptions here.</p>
          <button type="submit" className="primary-button">Use this calendar</button>
        </div>
      </form>
    </section>
  )
}
