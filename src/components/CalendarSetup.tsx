import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  buildManualCalendarInput,
  countRecurringEarlyReleaseDates,
  createManualCalendarId,
  defaultRecurringEarlyReleaseLabel,
  hydrateSchoolCalendar,
  validateHydrationInput,
  type CalendarDay,
  type CalendarHydrationInput,
  type CalendarSource,
  type Confidence,
  type DayKind,
  type ISODate,
  type RecurringEarlyReleaseRule,
  type SchoolCalendar,
  type Weekday,
} from '../calendar'
import { SchoolIdentitySearch } from './SchoolIdentitySearch'
import { SourceCalendarReview } from './SourceCalendarReview'

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
  { value: 'early-release', label: 'Early release' },
  { value: 'instructional', label: 'Instructional day' },
]

type DraftException = {
  id: string
  date: string
  kind: Exclude<DayKind, 'unknown'>
  label: string
  schoolEndTime: string
  source?: CalendarSource
  confidence?: Confidence
}

type ExceptionPatch = Pick<Partial<DraftException>, 'date' | 'kind' | 'label' | 'schoolEndTime'>

type DraftRecurringEarlyRelease = {
  id: string
  weekdays: Weekday[]
  schoolEndTime: string
  label: string
  source?: CalendarSource
  confidence?: Confidence
}

type RecurringPatch = Pick<Partial<DraftRecurringEarlyRelease>, 'weekdays' | 'schoolEndTime' | 'label'>

type Props = {
  initialValue?: CalendarHydrationInput | null
  onSave: (calendar: SchoolCalendar, input: CalendarHydrationInput) => void
  onCancel?: () => void
  onDraftChange?: (input: CalendarHydrationInput) => void
  onSchoolIdentitySelected?: (candidate: import('../calendar').OfficialSourceCandidate) => void
}

export function CalendarSetup({ initialValue = null, onSave, onCancel, onDraftChange, onSchoolIdentitySelected }: Props) {
  const [calendarId] = useState(() => initialValue?.id ?? createManualCalendarId())
  const [schoolYearLabel, setSchoolYearLabel] = useState(initialValue?.schoolYearLabel ?? '')
  const [firstDay, setFirstDay] = useState(initialValue?.firstDay ?? '')
  const [lastDay, setLastDay] = useState(initialValue?.lastDay ?? '')
  const [weekdays, setWeekdays] = useState<Weekday[]>(initialValue?.instructionalWeekdays ?? [1, 2, 3, 4, 5])
  const [exceptions, setExceptions] = useState<DraftException[]>(() => (initialValue?.exceptions ?? []).map((day, index) => ({
    id: `${day.date}-${index}`,
    date: day.date,
    kind: day.kind === 'unknown' ? 'no-school' : day.kind,
    label: day.label ?? '',
    schoolEndTime: day.schoolEndTime ?? '',
    source: day.source,
    confidence: day.confidence,
  })))
  const [recurringEarlyRelease, setRecurringEarlyRelease] = useState<DraftRecurringEarlyRelease[]>(() =>
    (initialValue?.recurringEarlyRelease ?? []).map((rule) => ({
      id: rule.id,
      weekdays: [...rule.weekdays],
      schoolEndTime: rule.schoolEndTime,
      label: rule.label ?? '',
      source: rule.source,
      confidence: rule.confidence,
    })),
  )
  const [errors, setErrors] = useState<string[]>([])
  const errorSummaryRef = useRef<HTMLDivElement | null>(null)
  const lastDraftRef = useRef('')
  const isSourceBackedEdit = Boolean(initialValue && initialValue.patternSource !== 'manual')

  const recurringRulesForInput = useMemo<RecurringEarlyReleaseRule[]>(() =>
    recurringEarlyRelease
      .filter((rule) => rule.weekdays.length > 0 && rule.schoolEndTime.trim())
      .map((rule) => ({
        id: rule.id,
        weekdays: [...rule.weekdays],
        schoolEndTime: rule.schoolEndTime.trim(),
        label: rule.label.trim() || defaultRecurringEarlyReleaseLabel(rule.weekdays),
        source: rule.source ?? 'manual',
        confidence: rule.confidence ?? 'confirmed',
      })),
  [recurringEarlyRelease])

  const input = useMemo<CalendarHydrationInput>(() => buildManualCalendarInput({
    calendarId,
    schoolYearLabel,
    firstDay,
    lastDay,
    instructionalWeekdays: weekdays,
    exceptions: exceptions
      .filter((item) => item.date)
      .map<CalendarDay>((item) => ({
        date: item.date as ISODate,
        kind: item.kind,
        label: item.label.trim() || undefined,
        schoolEndTime: item.kind === 'early-release' && item.schoolEndTime.trim() ? item.schoolEndTime.trim() : undefined,
        source: item.source ?? 'manual',
        confidence: item.confidence ?? 'confirmed',
      })),
    recurringEarlyRelease: recurringRulesForInput,
    quarters: initialValue?.quarters,
    semesters: initialValue?.semesters,
    existingTruth: initialValue ? {
      patternSource: initialValue.patternSource,
      patternConfidence: initialValue.patternConfidence,
      provenance: initialValue.provenance,
    } : undefined,
  }), [calendarId, schoolYearLabel, firstDay, lastDay, weekdays, exceptions, recurringRulesForInput, initialValue])

  const validationVisible = errors.length > 0
  const schoolYearInvalid = validationVisible && !schoolYearLabel.trim()
  const firstDayInvalid = validationVisible && !firstDay
  const lastDayInvalid = validationVisible && !lastDay

  useEffect(() => {
    if (errors.length > 0) errorSummaryRef.current?.focus()
  }, [errors])

  useEffect(() => { const serialized = JSON.stringify(input); if (serialized !== lastDraftRef.current) { lastDraftRef.current = serialized; onDraftChange?.(input) } }, [input, onDraftChange])

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
      schoolEndTime: '',
      source: 'manual',
      confidence: 'confirmed',
    }])
  }

  function updateException(id: string, patch: ExceptionPatch) {
    setExceptions((current) => current.map((item) => item.id === id ? {
      ...item,
      ...patch,
      schoolEndTime: patch.kind && patch.kind !== 'early-release' ? '' : patch.schoolEndTime ?? item.schoolEndTime,
      source: 'manual',
      confidence: 'confirmed',
    } : item))
  }

  function removeException(id: string) {
    setExceptions((current) => current.filter((item) => item.id !== id))
  }

  function addRecurringEarlyRelease() {
    setRecurringEarlyRelease((current) => [...current, {
      id: crypto.randomUUID(),
      weekdays: [],
      schoolEndTime: '',
      label: '',
      source: 'manual',
      confidence: 'confirmed',
    }])
  }

  function updateRecurringEarlyRelease(id: string, patch: RecurringPatch) {
    setRecurringEarlyRelease((current) => current.map((item) => item.id === id ? {
      ...item,
      ...patch,
      source: 'manual',
      confidence: 'confirmed',
    } : item))
  }

  function toggleRecurringWeekday(id: string, day: Weekday) {
    setRecurringEarlyRelease((current) => current.map((item) => {
      if (item.id !== id) return item
      const weekdays = item.weekdays.includes(day)
        ? item.weekdays.filter((value) => value !== day)
        : [...item.weekdays, day]
      return { ...item, weekdays }
    }))
  }

  function removeRecurringEarlyRelease(id: string) {
    setRecurringEarlyRelease((current) => current.filter((item) => item.id !== id))
  }

  const recurringPreviewCount = useMemo(() => {
    if (!firstDay || !lastDay || recurringRulesForInput.length === 0) return null
    try {
      return countRecurringEarlyReleaseDates({
        firstDay: firstDay as ISODate,
        lastDay: lastDay as ISODate,
        instructionalWeekdays: weekdays,
        rules: recurringRulesForInput,
      })
    } catch {
      return null
    }
  }, [firstDay, lastDay, weekdays, recurringRulesForInput])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = [
      ...(schoolYearLabel.trim() ? [] : ['Give this school year a label.']),
      ...recurringEarlyRelease.flatMap((rule, index) => {
        const position = index + 1
        if (rule.weekdays.length > 0 && !rule.schoolEndTime.trim()) {
          return [`Recurring early release pattern ${position} needs a school end time.`]
        }
        if (rule.schoolEndTime.trim() && rule.weekdays.length === 0) {
          return [`Recurring early release pattern ${position} needs at least one weekday.`]
        }
        return []
      }),
      ...validateHydrationInput(input),
    ]

    if (nextErrors.length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors([])
    onSave(hydrateSchoolCalendar(input), input)
  }

  return (
    <section className="calendar-setup" aria-labelledby="calendar-setup-title">
      <div className="calendar-setup-intro">
        <p className="section-label">Calendar setup</p>
        <h2 id="calendar-setup-title">Tell Arc which days are actually yours.</h2>
        <p>Start with your school. Arc will look for an official identity before you enter dates yourself.</p>
      </div>

      {!initialValue && <SchoolIdentitySearch onUseCalendar={onSave} onSchoolIdentitySelected={onSchoolIdentitySelected} />}
      {isSourceBackedEdit && initialValue && <SourceCalendarReview input={initialValue} />}

      <form className="calendar-setup-form" onSubmit={submit} noValidate>
        {!initialValue && (
          <div className="manual-calendar-divider">
            <p className="section-label">Manual calendar</p>
            <h3>Enter dates yourself if Arc does not have them yet.</h3>
            <p>Manual entry remains available, but an official school identity does not become calendar truth until Arc has a calendar source for you to review.</p>
          </div>
        )}

        {errors.length > 0 && (
          <div
            ref={errorSummaryRef}
            id="calendar-setup-errors"
            className="setup-errors"
            role="alert"
            aria-label="Calendar setup issues"
            tabIndex={-1}
          >
            <strong>Check these before saving:</strong>
            <ul>{errors.map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}</ul>
          </div>
        )}

        <div className="setup-field-grid">
          <label htmlFor="school-year-label">
            <span>School year</span>
            <input
              id="school-year-label"
              value={schoolYearLabel}
              onChange={(event) => setSchoolYearLabel(event.target.value)}
              placeholder="2026–27"
              autoComplete="off"
              aria-invalid={schoolYearInvalid || undefined}
              aria-describedby={schoolYearInvalid ? 'calendar-setup-errors' : undefined}
            />
          </label>
          <label htmlFor="first-school-day">
            <span>First day</span>
            <input
              id="first-school-day"
              type="date"
              value={firstDay}
              onChange={(event) => setFirstDay(event.target.value)}
              aria-invalid={firstDayInvalid || undefined}
              aria-describedby={firstDayInvalid ? 'calendar-setup-errors' : undefined}
            />
          </label>
          <label htmlFor="last-school-day">
            <span>Last day</span>
            <input
              id="last-school-day"
              type="date"
              value={lastDay}
              onChange={(event) => setLastDay(event.target.value)}
              aria-invalid={lastDayInvalid || undefined}
              aria-describedby={lastDayInvalid ? 'calendar-setup-errors' : undefined}
            />
          </label>
        </div>

        <fieldset className="weekday-fieldset">
          <legend>Normal instructional week</legend>
          <div className="weekday-options">
            {WEEKDAYS.map((day) => (
              <label key={day.value} className="weekday-option">
                <input type="checkbox" checked={weekdays.includes(day.value)} onChange={() => toggleWeekday(day.value)} />
                <span>{day.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="recurring-early-release-section">
          <div className="exceptions-heading">
            <div>
              <h3>Recurring early release</h3>
              <p>
                Most districts use the same early-dismissal day each week (for example every Wednesday).
                Arc applies this across your first and last day on normal instructional weekdays.
                Use Exceptions below for one-off changes such as holidays.
              </p>
              {recurringPreviewCount !== null && recurringPreviewCount > 0 ? (
                <p className="recurring-early-release-preview" role="status">
                  This pattern marks <strong>{recurringPreviewCount}</strong> school days as early release in your year.
                </p>
              ) : null}
            </div>
            <button type="button" className="quiet-button" onClick={addRecurringEarlyRelease}>Add weekly pattern</button>
          </div>

          {recurringEarlyRelease.length === 0 ? (
            <p className="empty-exceptions">No weekly early release pattern yet.</p>
          ) : (
            <div className="recurring-early-release-list">
              {recurringEarlyRelease.map((rule, index) => {
                const position = index + 1
                return (
                  <div className="recurring-early-release-row" key={rule.id}>
                    <fieldset className="recurring-weekday-fieldset">
                      <legend>Pattern {position} · weekdays</legend>
                      <div className="weekday-options">
                        {WEEKDAYS.map((day) => (
                          <label key={day.value} className="weekday-option">
                            <input
                              type="checkbox"
                              checked={rule.weekdays.includes(day.value)}
                              onChange={() => toggleRecurringWeekday(rule.id, day.value)}
                            />
                            <span>{day.label}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <label className="recurring-time-field">
                      <span>School ends</span>
                      <input
                        type="time"
                        value={rule.schoolEndTime}
                        onChange={(event) => updateRecurringEarlyRelease(rule.id, { schoolEndTime: event.target.value })}
                        aria-label={`School end time for recurring early release pattern ${position}`}
                      />
                    </label>
                    <label className="recurring-label-field">
                      <span>Optional note</span>
                      <input
                        value={rule.label}
                        onChange={(event) => updateRecurringEarlyRelease(rule.id, { label: event.target.value })}
                        placeholder={rule.weekdays.length ? defaultRecurringEarlyReleaseLabel(rule.weekdays) : 'Optional note'}
                      />
                    </label>
                    <button
                      type="button"
                      className="text-button"
                      aria-label={`Remove recurring early release pattern ${position}`}
                      onClick={() => removeRecurringEarlyRelease(rule.id)}
                    >
                      Remove
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="exceptions-section">
          <div className="exceptions-heading">
            <div>
              <h3>Exceptions</h3>
              <p>One-off workdays, breaks, holidays, or a single early release that does not repeat weekly.</p>
            </div>
            <button type="button" className="quiet-button" onClick={addException}>Add date</button>
          </div>

          {exceptions.length === 0 ? (
            <p className="empty-exceptions">No exceptions added yet.</p>
          ) : (
            <div className="exception-list">
              {exceptions.map((item, index) => {
                const position = index + 1
                const context = item.date ? ` for ${item.date}` : ''
                return (
                  <div className={`exception-row${item.kind === 'early-release' ? ' exception-row--early-release' : ''}`} key={item.id}>
                    <label>
                      <span className="sr-only">Exception {position} date</span>
                      <input type="date" value={item.date} onChange={(event) => updateException(item.id, { date: event.target.value })} />
                    </label>
                    <label>
                      <span className="sr-only">Exception {position} type</span>
                      <select value={item.kind} onChange={(event) => updateException(item.id, { kind: event.target.value as DraftException['kind'] })}>
                        {DAY_KINDS.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}
                      </select>
                    </label>
                    <label className="exception-label-field">
                      <span className="sr-only">Exception {position} optional label</span>
                      <input value={item.label} onChange={(event) => updateException(item.id, { label: event.target.value })} placeholder={item.kind === 'early-release' ? 'Optional note' : 'Optional label'} />
                    </label>
                    {item.kind === 'early-release' ? (
                      <label className="exception-time-field">
                        <span className="sr-only">Exception {position} school end time</span>
                        <input type="time" value={item.schoolEndTime} onChange={(event) => updateException(item.id, { schoolEndTime: event.target.value })} aria-label={`School end time for early release${context}`} />
                      </label>
                    ) : null}
                    <button
                      type="button"
                      className="text-button"
                      aria-label={`Remove exception ${position}${context}`}
                      onClick={() => removeException(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="setup-actions">
          <p>{isSourceBackedEdit
            ? 'This edit keeps the reviewed source and confidence history. Dates you change here are recorded as your confirmed manual corrections.'
            : 'Manual setup is treated as confirmed only because you are explicitly declaring the pattern and exceptions here.'}</p>
          <div className="setup-action-buttons">
            {onCancel && <button type="button" className="quiet-button" onClick={onCancel}>Cancel</button>}
            <button type="submit" className="primary-button">Use this calendar</button>
          </div>
        </div>
      </form>
    </section>
  )
}
