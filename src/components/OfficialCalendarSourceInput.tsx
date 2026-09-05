import { FormEvent, useState } from 'react'
import {
  buildTeacherConfirmedCalendarSourceCandidate,
  type OfficialCalendarSourceCandidate,
  type OfficialCalendarSourceKind,
  type OfficialSourceCandidate,
} from '../calendar'

type Props = {
  school: OfficialSourceCandidate
}

const SOURCE_KINDS: Array<{ value: OfficialCalendarSourceKind; label: string }> = [
  { value: 'district-calendar-page', label: 'District calendar web page' },
  { value: 'district-calendar-document', label: 'District calendar PDF or document' },
  { value: 'school-calendar-page', label: 'School calendar web page' },
  { value: 'school-calendar-document', label: 'School calendar PDF or document' },
]

export function OfficialCalendarSourceInput({ school }: Props) {
  const [locator, setLocator] = useState('')
  const [label, setLabel] = useState('')
  const [publisher, setPublisher] = useState(school.districtName ?? school.schoolName)
  const [kind, setKind] = useState<OfficialCalendarSourceKind>('district-calendar-page')
  const [confirmedOfficial, setConfirmedOfficial] = useState(false)
  const [heldSource, setHeldSource] = useState<OfficialCalendarSourceCandidate | null>(null)
  const [error, setError] = useState('')

  function invalidateHeldSource() {
    setHeldSource(null)
    setError('')
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const source = buildTeacherConfirmedCalendarSourceCandidate(school, {
        label,
        publisher,
        locator,
        kind,
        confirmedOfficial,
      })
      setHeldSource(source)
      setError('')
    } catch (nextError) {
      setHeldSource(null)
      setError(nextError instanceof Error ? nextError.message : 'Arc could not use that calendar source.')
    }
  }

  return (
    <section className="official-calendar-source" aria-labelledby="official-calendar-source-title">
      <div className="official-calendar-source-heading">
        <p className="section-label">Official calendar source</p>
        <h4 id="official-calendar-source-title">Have the district or school calendar link?</h4>
        <p>Paste the official calendar page or document. Arc can hold the source now, but it will not invent, read, or save any dates from the link in this step.</p>
      </div>

      <form className="official-calendar-source-form" onSubmit={submit} noValidate>
        <div className="official-calendar-source-fields">
          <label htmlFor="official-calendar-source-url">
            <span>Official calendar link</span>
            <input
              id="official-calendar-source-url"
              type="url"
              inputMode="url"
              value={locator}
              onChange={(event) => { setLocator(event.target.value); invalidateHeldSource() }}
              placeholder="https://district.org/calendar"
              autoComplete="url"
            />
          </label>
          <label htmlFor="official-calendar-source-publisher">
            <span>Published by</span>
            <input
              id="official-calendar-source-publisher"
              value={publisher}
              onChange={(event) => { setPublisher(event.target.value); invalidateHeldSource() }}
              autoComplete="organization"
            />
          </label>
          <label htmlFor="official-calendar-source-label">
            <span>Source label</span>
            <input
              id="official-calendar-source-label"
              value={label}
              onChange={(event) => { setLabel(event.target.value); invalidateHeldSource() }}
              placeholder="2026–27 school calendar"
              autoComplete="off"
            />
          </label>
          <label htmlFor="official-calendar-source-kind">
            <span>Source type</span>
            <select
              id="official-calendar-source-kind"
              value={kind}
              onChange={(event) => { setKind(event.target.value as OfficialCalendarSourceKind); invalidateHeldSource() }}
            >
              {SOURCE_KINDS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>

        <label className="official-calendar-source-confirm">
          <input
            type="checkbox"
            checked={confirmedOfficial}
            onChange={(event) => { setConfirmedOfficial(event.target.checked); invalidateHeldSource() }}
          />
          <span>I confirm this link is published by the selected school or its district.</span>
        </label>

        <div className="official-calendar-source-actions">
          <button type="submit" className="primary-button">Hold this source</button>
          <p>This stores nothing yet. Date extraction and calendar review are separate gates.</p>
        </div>
      </form>

      {error && (
        <div className="official-calendar-source-error" role="alert">
          <strong>Arc did not hold that source.</strong>
          <p>{error}</p>
        </div>
      )}

      {heldSource && (
        <div className="official-calendar-source-held" role="status" aria-label="Teacher-confirmed official calendar source">
          <p className="section-label">Source held for review</p>
          <strong>{heldSource.label}</strong>
          <p>{heldSource.publisher}</p>
          <a href={heldSource.locator} target="_blank" rel="noreferrer">Open the source in a new tab</a>
          <p>Arc still has no school-calendar dates from this source. Nothing has been written to your calendar.</p>
        </div>
      )}
    </section>
  )
}
