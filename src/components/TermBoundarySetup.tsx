import { FormEvent, useMemo, useState } from 'react'
import {
  createTermBoundaryId,
  replaceTermBoundaries,
  sortTermBoundaries,
  validateTermConfiguration,
  type CalendarHydrationInput,
  type ISODate,
  type TermBoundary,
  type TermKind,
} from '../calendar'

type DraftBoundary = {
  id: string
  label: string
  startDate: string
  endDate: string
}

type Props = {
  input: CalendarHydrationInput
  onSave: (input: CalendarHydrationInput) => void
  onCancel: () => void
}

export function TermBoundarySetup({ input, onSave, onCancel }: Props) {
  const [quarters, setQuarters] = useState<DraftBoundary[]>(() => toDrafts(input.quarters ?? []))
  const [semesters, setSemesters] = useState<DraftBoundary[]>(() => toDrafts(input.semesters ?? []))
  const [errors, setErrors] = useState<string[]>([])

  const quarterBoundaries = useMemo(() => toBoundaries(quarters), [quarters])
  const semesterBoundaries = useMemo(() => toBoundaries(semesters), [semesters])

  function addBoundary(kind: TermKind) {
    if (kind === 'quarter') {
      setQuarters((current) => [...current, {
        id: createTermBoundaryId('quarter'),
        label: `Quarter ${current.length + 1}`,
        startDate: '',
        endDate: '',
      }])
      return
    }

    setSemesters((current) => [...current, {
      id: createTermBoundaryId('semester'),
      label: `Semester ${current.length + 1}`,
      startDate: '',
      endDate: '',
    }])
  }

  function updateBoundary(kind: TermKind, id: string, patch: Partial<DraftBoundary>) {
    const setter = kind === 'quarter' ? setQuarters : setSemesters
    setter((current) => current.map((boundary) => boundary.id === id ? { ...boundary, ...patch } : boundary))
  }

  function removeBoundary(kind: TermKind, id: string) {
    const setter = kind === 'quarter' ? setQuarters : setSemesters
    setter((current) => current.filter((boundary) => boundary.id !== id))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const draftErrors = [
      ...validateDrafts('Quarter', quarters),
      ...validateDrafts('Semester', semesters),
    ]

    const nextErrors = draftErrors.length > 0
      ? draftErrors
      : validateTermConfiguration(input, quarterBoundaries, semesterBoundaries)

    if (nextErrors.length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors([])
    onSave(replaceTermBoundaries(
      input,
      sortTermBoundaries(quarterBoundaries),
      sortTermBoundaries(semesterBoundaries),
    ))
  }

  return (
    <section className="term-setup" aria-labelledby="term-setup-title">
      <div className="term-setup-intro">
        <p className="section-label">Term setup</p>
        <h2 id="term-setup-title">Mark the big breaks in the year.</h2>
        <p>Enter the quarter and semester dates your school actually uses. Arc will not guess them.</p>
      </div>

      <form className="term-setup-form" onSubmit={submit} noValidate>
        {errors.length > 0 && (
          <div className="setup-errors" role="alert" aria-label="Term setup issues">
            <strong>Check these before saving:</strong>
            <ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul>
          </div>
        )}

        <TermSection
          kind="semester"
          title="Semesters"
          description="Use your official semester boundaries. Leave this empty if your school does not use semesters."
          boundaries={semesters}
          firstDay={input.firstDay}
          lastDay={input.lastDay}
          onAdd={() => addBoundary('semester')}
          onUpdate={(id, patch) => updateBoundary('semester', id, patch)}
          onRemove={(id) => removeBoundary('semester', id)}
        />

        <TermSection
          kind="quarter"
          title="Quarters"
          description="Quarters may have gaps for breaks, but each quarter must sit entirely inside one semester when semesters are configured."
          boundaries={quarters}
          firstDay={input.firstDay}
          lastDay={input.lastDay}
          onAdd={() => addBoundary('quarter')}
          onUpdate={(id, patch) => updateBoundary('quarter', id, patch)}
          onRemove={(id) => removeBoundary('quarter', id)}
        />

        <div className="setup-actions">
          <p>Changing term dates does not change instructional days, holidays, workdays, or the calendar identity.</p>
          <div className="setup-action-buttons">
            <button type="button" className="quiet-button" onClick={onCancel}>Cancel</button>
            <button type="submit" className="primary-button">Use these terms</button>
          </div>
        </div>
      </form>
    </section>
  )
}

type TermSectionProps = {
  kind: TermKind
  title: string
  description: string
  boundaries: DraftBoundary[]
  firstDay: ISODate
  lastDay: ISODate
  onAdd: () => void
  onUpdate: (id: string, patch: Partial<DraftBoundary>) => void
  onRemove: (id: string) => void
}

function TermSection({ kind, title, description, boundaries, firstDay, lastDay, onAdd, onUpdate, onRemove }: TermSectionProps) {
  return (
    <fieldset className="term-section">
      <legend>{title}</legend>
      <div className="term-section-heading">
        <p>{description}</p>
        <button type="button" className="quiet-button" onClick={onAdd}>Add {kind}</button>
      </div>

      {boundaries.length === 0 ? (
        <p className="empty-exceptions">No {title.toLowerCase()} configured.</p>
      ) : (
        <div className="term-list">
          {boundaries.map((boundary, index) => (
            <div className="term-row" key={boundary.id}>
              <label className="term-label-field">
                <span>{title.slice(0, -1)} {index + 1} label</span>
                <input
                  value={boundary.label}
                  onChange={(event) => onUpdate(boundary.id, { label: event.target.value })}
                  autoComplete="off"
                />
              </label>
              <label>
                <span>Starts</span>
                <input
                  type="date"
                  min={firstDay}
                  max={lastDay}
                  value={boundary.startDate}
                  onChange={(event) => onUpdate(boundary.id, { startDate: event.target.value })}
                />
              </label>
              <label>
                <span>Ends</span>
                <input
                  type="date"
                  min={firstDay}
                  max={lastDay}
                  value={boundary.endDate}
                  onChange={(event) => onUpdate(boundary.id, { endDate: event.target.value })}
                />
              </label>
              <button type="button" className="text-button term-remove" onClick={() => onRemove(boundary.id)}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </fieldset>
  )
}

function toDrafts(boundaries: TermBoundary[]): DraftBoundary[] {
  return boundaries.map((boundary) => ({
    id: boundary.id,
    label: boundary.label,
    startDate: boundary.startDate,
    endDate: boundary.endDate,
  }))
}

function toBoundaries(drafts: DraftBoundary[]): TermBoundary[] {
  return drafts.map((draft) => ({
    id: draft.id,
    label: draft.label.trim(),
    startDate: draft.startDate as ISODate,
    endDate: draft.endDate as ISODate,
  }))
}

function validateDrafts(kind: 'Quarter' | 'Semester', drafts: DraftBoundary[]): string[] {
  const errors: string[] = []
  for (const draft of drafts) {
    const name = draft.label.trim() || kind
    if (!draft.label.trim()) errors.push(`${kind} label is required.`)
    if (!draft.startDate) errors.push(`${name} needs a start date.`)
    if (!draft.endDate) errors.push(`${name} needs an end date.`)
  }
  return errors
}
