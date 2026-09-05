import { FormEvent, useState } from 'react'
import {
  searchNcesPublicSchools,
  type OfficialSourceCandidate,
  type OfficialSourceSearchResult,
} from '../calendar'
import { OfficialCalendarSourceInput } from './OfficialCalendarSourceInput'

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | OfficialSourceSearchResult

export function SchoolIdentitySearch() {
  const [schoolName, setSchoolName] = useState('')
  const [districtName, setDistrictName] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [result, setResult] = useState<SearchState>({ status: 'idle' })
  const [selected, setSelected] = useState<OfficialSourceCandidate | null>(null)

  function clearSelection() {
    setSelected(null)
    if (result.status !== 'idle') setResult({ status: 'idle' })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSelected(null)
    setResult({ status: 'loading' })
    const next = await searchNcesPublicSchools({ schoolName, districtName, city, state })
    setResult(next)
  }

  return (
    <section className="school-identity-search" aria-labelledby="school-identity-search-title">
      <div className="school-identity-search-heading">
        <p className="section-label">Start with your school</p>
        <h3 id="school-identity-search-title">Let Arc look for the official school record first.</h3>
        <p>Arc uses the U.S. Department of Education’s NCES directory to identify the school. This step does not add school-calendar dates.</p>
      </div>

      <form className="school-identity-search-form" onSubmit={submit} noValidate>
        <div className="school-identity-fields">
          <label htmlFor="school-identity-name">
            <span>School name</span>
            <input
              id="school-identity-name"
              value={schoolName}
              onChange={(event) => { setSchoolName(event.target.value); clearSelection() }}
              placeholder="Oak Ridge High"
              autoComplete="organization"
            />
          </label>
          <label htmlFor="school-identity-city">
            <span>City</span>
            <input
              id="school-identity-city"
              value={city}
              onChange={(event) => { setCity(event.target.value); clearSelection() }}
              placeholder="Orlando"
              autoComplete="address-level2"
            />
          </label>
          <label htmlFor="school-identity-state">
            <span>State</span>
            <input
              id="school-identity-state"
              value={state}
              onChange={(event) => { setState(event.target.value); clearSelection() }}
              placeholder="FL"
              maxLength={2}
              autoComplete="address-level1"
            />
          </label>
          <label htmlFor="school-identity-district">
            <span>District or agency <small>optional</small></span>
            <input
              id="school-identity-district"
              value={districtName}
              onChange={(event) => { setDistrictName(event.target.value); clearSelection() }}
              placeholder="Optional"
              autoComplete="off"
            />
          </label>
        </div>
        <div className="school-identity-search-action">
          <button type="submit" className="primary-button" disabled={result.status === 'loading'}>
            {result.status === 'loading' ? 'Searching NCES…' : 'Find my school'}
          </button>
          <p>Official directory identity only. Dates still require a separate school or district calendar source.</p>
        </div>
      </form>

      {result.status === 'invalid' && (
        <div className="school-identity-message school-identity-message--error" role="alert">
          <strong>Arc could not use that search.</strong>
          <p>{result.message}</p>
        </div>
      )}

      {result.status === 'none' && (
        <div className="school-identity-message" role="status">
          <strong>No official NCES match yet.</strong>
          <p>{result.message ?? 'Try the full school name or add a city, state, or district.'}</p>
        </div>
      )}

      {result.status === 'candidates' && (
        <div className="school-identity-results" aria-live="polite">
          <div className="school-identity-results-heading">
            <strong>{result.candidates.length === 1 ? 'One official record found.' : `${result.candidates.length} official records found.`}</strong>
            <span>Choose the school yourself. Arc will not guess.</span>
          </div>
          <ul className="school-identity-candidate-list">
            {result.candidates.map((candidate) => {
              const isSelected = selected?.id === candidate.id
              return (
                <li key={candidate.id} className={isSelected ? 'school-identity-candidate school-identity-candidate--selected' : 'school-identity-candidate'}>
                  <div>
                    <strong>{candidate.schoolName}</strong>
                    <span>{candidate.districtName ?? 'District not listed'}{candidate.locality ? ` · ${candidate.locality}` : ''}</span>
                    <span className="school-identity-source">Source: {candidate.sourceLabel}</span>
                  </div>
                  <button
                    type="button"
                    className={isSelected ? 'quiet-button' : 'primary-button'}
                    aria-pressed={isSelected}
                    onClick={() => setSelected(candidate)}
                  >
                    {isSelected ? 'Selected' : 'This is my school'}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {selected && (
        <>
          <div className="school-identity-selection" role="status" aria-label="Selected official school identity">
            <p className="section-label">School identity selected</p>
            <strong>{selected.schoolName}</strong>
            <p>{selected.districtName ?? 'District not listed'}{selected.locality ? ` · ${selected.locality}` : ''}</p>
            <p>Nothing has been added to your calendar. Next, Arc needs the school or district’s official calendar before it can propose dates for review.</p>
          </div>
          <OfficialCalendarSourceInput key={selected.id} school={selected} />
        </>
      )}
    </section>
  )
}
