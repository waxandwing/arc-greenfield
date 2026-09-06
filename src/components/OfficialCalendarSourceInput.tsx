import { FormEvent, useRef, useState } from 'react'
import {
  acquireOfficialCalendarPayload,
  buildProposalFromOfficialPayload,
  buildTeacherConfirmedCalendarSourceCandidate,
  commitCalendarProposal,
  configuredOfficialCalendarExtractionAdapter,
  hydrateSchoolCalendar,
  reviewCalendarProposal,
  type CalendarHydrationInput,
  type CalendarProposal,
  type OfficialCalendarSourceCandidate,
  type OfficialCalendarSourceKind,
  type OfficialSourceCandidate,
  type SchoolCalendar,
} from '../calendar'
import { SourceCalendarReview } from './SourceCalendarReview'

type Props = {
  school: OfficialSourceCandidate
  onUseCalendar: (calendar: SchoolCalendar, input: CalendarHydrationInput) => void
}

const SOURCE_KINDS: Array<{ value: OfficialCalendarSourceKind; label: string }> = [
  { value: 'district-calendar-page', label: 'District calendar web page' },
  { value: 'district-calendar-document', label: 'District calendar PDF or document' },
  { value: 'school-calendar-page', label: 'School calendar web page' },
  { value: 'school-calendar-document', label: 'School calendar PDF or document' },
]

export function OfficialCalendarSourceInput({ school, onUseCalendar }: Props) {
  const [locator, setLocator] = useState('')
  const [label, setLabel] = useState('')
  const [publisher, setPublisher] = useState(school.districtName ?? school.schoolName)
  const [kind, setKind] = useState<OfficialCalendarSourceKind>('district-calendar-page')
  const [confirmedOfficial, setConfirmedOfficial] = useState(false)
  const [heldSource, setHeldSource] = useState<OfficialCalendarSourceCandidate | null>(null)
  const [proposal, setProposal] = useState<CalendarProposal | null>(null)
  const [reading, setReading] = useState(false)
  const [error, setError] = useState('')
  const readRequestVersion = useRef(0)

  function invalidateHeldSource() {
    readRequestVersion.current += 1
    setHeldSource(null)
    setProposal(null)
    setReading(false)
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
      readRequestVersion.current += 1
      setHeldSource(source)
      setProposal(null)
      setReading(false)
      setError('')
    } catch (nextError) {
      setHeldSource(null)
      setProposal(null)
      setError(nextError instanceof Error ? nextError.message : 'Arc could not use that calendar source.')
    }
  }

  async function readDates() {
    if (!heldSource) return
    const configured = configuredOfficialCalendarExtractionAdapter()
    if (!configured.adapter) {
      setError(configured.message)
      return
    }

    const requestVersion = ++readRequestVersion.current
    setReading(true)
    setProposal(null)
    setError('')

    const result = await acquireOfficialCalendarPayload(school, heldSource, configured.adapter)
    if (readRequestVersion.current !== requestVersion) return

    setReading(false)
    if (result.status !== 'payload') {
      setError(result.message)
      return
    }

    try {
      setProposal(buildProposalFromOfficialPayload(school, heldSource, result.payload))
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Arc could not prepare these dates for review.')
    }
  }

  function confirmProposalReview() {
    setProposal((current) => current ? reviewCalendarProposal(current, new Date().toISOString()) : current)
  }

  function useReviewedCalendar() {
    if (!proposal) return
    try {
      const input = commitCalendarProposal(proposal)
      setError('')
      onUseCalendar(hydrateSchoolCalendar(input), input)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Arc could not use this calendar.')
    }
  }

  return (
    <section className="official-calendar-source" aria-labelledby="official-calendar-source-title">
      <div className="official-calendar-source-heading">
        <p className="section-label">Official calendar source</p>
        <h4 id="official-calendar-source-title">Have the district or school calendar link?</h4>
        <p>Paste the official calendar page or document. Arc will hold the source first, then read only supported official calendars into a proposal you review before anything is saved.</p>
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
          <p>Holding a source still stores nothing. Date reading and calendar review remain separate gates.</p>
        </div>
      </form>

      {error && (
        <div className="official-calendar-source-error" role="alert">
          <strong>Arc stopped before saving anything.</strong>
          <p>{error}</p>
        </div>
      )}

      {heldSource && (
        <div className="official-calendar-source-held" role="status" aria-label="Teacher-confirmed official calendar source">
          <p className="section-label">Source held for review</p>
          <strong>{heldSource.label}</strong>
          <p>{heldSource.publisher}</p>
          <a href={heldSource.locator} target="_blank" rel="noreferrer">Open the source in a new tab</a>
          <div className="official-calendar-source-read">
            <button type="button" className="primary-button" onClick={readDates} disabled={reading}>
              {reading ? 'Reading dates…' : 'Read dates'}
            </button>
            <p>Arc will prepare a proposal only. Your calendar stays untouched until you review and use it.</p>
          </div>
        </div>
      )}

      {proposal && (
        <section className="official-calendar-proposal" aria-labelledby="official-calendar-proposal-title">
          <div className="official-calendar-proposal-heading">
            <p className="section-label">Calendar proposal</p>
            <h4 id="official-calendar-proposal-title">Read the dates before Arc uses them.</h4>
            <p>These dates came from the held official source. They are still only a proposal.</p>
          </div>

          <SourceCalendarReview input={proposal.input} />

          {proposal.warnings.length > 0 && (
            <div className="official-calendar-proposal-warnings" aria-label="Calendar proposal warnings">
              <strong>Needs your attention</strong>
              <ul>{proposal.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
            </div>
          )}

          <div className="official-calendar-proposal-actions">
            <div>
              <strong>{proposal.reviewedAt ? 'Review confirmed.' : 'Nothing is saved yet.'}</strong>
              <p>{proposal.reviewedAt
                ? 'Using this calendar is the separate commit step.'
                : 'Confirm that you reviewed the source-backed dates before Arc can use them.'}</p>
            </div>
            <div className="setup-action-buttons">
              {!proposal.reviewedAt && (
                <button type="button" className="quiet-button" onClick={confirmProposalReview}>I reviewed these dates</button>
              )}
              <button type="button" className="primary-button" onClick={useReviewedCalendar} disabled={!proposal.reviewedAt}>
                Use this calendar
              </button>
            </div>
          </div>
        </section>
      )}
    </section>
  )
}
