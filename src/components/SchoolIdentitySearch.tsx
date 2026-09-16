import { FormEvent, useMemo, useState } from 'react'
import {
  findLocalSchoolById,
  isNcesReachabilityFailure,
  searchLocalSchoolDirectory,
  searchNcesPublicSchools,
  type CalendarHydrationInput,
  type OfficialSourceCandidate,
  type OfficialSourceSearchResult,
  type SchoolCalendar,
} from '../calendar'
import { OfficialCalendarSourceInput } from './OfficialCalendarSourceInput'

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | (OfficialSourceSearchResult & { usedLocalFallback?: boolean })

type Props = {
  onUseCalendar: (calendar: SchoolCalendar, input: CalendarHydrationInput) => void
  onSchoolIdentitySelected?: (candidate: OfficialSourceCandidate) => void
  /** Already-loaded NCES token (`nces:…`) from onboarding or a prior selection. */
  loadedSchoolNcesId?: string | null
}

export function SchoolIdentitySearch({ onUseCalendar, onSchoolIdentitySelected, loadedSchoolNcesId = null }: Props) {
  const previouslyLoaded = useMemo(() => findLocalSchoolById(loadedSchoolNcesId), [loadedSchoolNcesId])
  const [schoolName, setSchoolName] = useState(previouslyLoaded?.schoolName ?? '')
  const [districtName, setDistrictName] = useState(previouslyLoaded?.districtName ?? '')
  const [city, setCity] = useState(cityFromLocality(previouslyLoaded?.locality))
  const [state, setState] = useState(stateFromLocality(previouslyLoaded?.locality))
  const [result, setResult] = useState<SearchState>({ status: 'idle' })
  const [selected, setSelected] = useState<OfficialSourceCandidate | null>(previouslyLoaded)
  const [showSearchAgain, setShowSearchAgain] = useState(!previouslyLoaded)

  function clearSelection() {
    setSelected(null)
    if (result.status !== 'idle') setResult({ status: 'idle' })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSelected(null)
    setResult({ status: 'loading' })
    const live = await searchNcesPublicSchools({ schoolName, districtName, city, state })
    if (live.status === 'candidates' || live.status === 'none') {
      setResult(live)
      return
    }
    if (isNcesReachabilityFailure(live)) {
      const local = searchLocalSchoolDirectory({ schoolName, districtName, city, state })
      setResult({ ...local, usedLocalFallback: true })
      return
    }
    setResult(live)
  }

  function chooseSchool(candidate: OfficialSourceCandidate) {
    setSelected(candidate)
    setShowSearchAgain(false)
    onSchoolIdentitySelected?.(candidate)
  }

  return (
    <section className="school-identity-search" aria-labelledby="school-identity-search-title" data-testid="school-load">
      <div className="school-identity-search-heading">
        <p className="section-label">Load school</p>
        <h3 id="school-identity-search-title">Find and load your school’s official identity.</h3>
        <p>Arc looks up the U.S. Department of Education’s NCES directory first. On hosts without the live proxy, Arc falls back to a local school list so you can still finish setup.</p>
      </div>

      {selected && !showSearchAgain ? (
        <div className="school-identity-selection school-identity-selection--loaded" role="status" aria-label="Loaded school identity">
          <p className="section-label">School loaded</p>
          <strong>{selected.schoolName}</strong>
          <p>{selected.districtName ?? 'District not listed'}{selected.locality ? ` · ${selected.locality}` : ''}</p>
          <p className="school-identity-source">Source: {selected.sourceLabel}</p>
          <p>Identity is loaded. Confirm dates, class times, and the year preview below — this step does not invent your school year on its own.</p>
          <button type="button" className="quiet-button" onClick={() => setShowSearchAgain(true)}>
            Change school
          </button>
        </div>
      ) : (
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
              {result.status === 'loading' ? 'Loading school…' : 'Load school'}
            </button>
            <p>Official directory identity only. Dates still require a separate school or district calendar source — or manual entry below.</p>
          </div>
          {selected && (
            <button type="button" className="text-button" onClick={() => setShowSearchAgain(false)}>
              Keep {selected.schoolName}
            </button>
          )}
        </form>
      )}

      {result.status === 'invalid' && (
        <div className="school-identity-message school-identity-message--error" role="alert">
          <strong>Arc could not use that search.</strong>
          <p>{result.message}</p>
        </div>
      )}

      {result.status === 'none' && (
        <div className="school-identity-message" role="status">
          <strong>{result.usedLocalFallback ? 'No local directory match yet.' : 'No official NCES match yet.'}</strong>
          <p>{result.message ?? 'Try the full school name or add a city, state, or district.'}</p>
        </div>
      )}

      {result.status === 'candidates' && (
        <div className="school-identity-results" aria-live="polite">
          <div className="school-identity-results-heading">
            <strong>{result.candidates.length === 1 ? 'One school record found.' : `${result.candidates.length} school records found.`}</strong>
            <span>
              {result.usedLocalFallback
                ? 'Live NCES was unavailable — choose from Arc’s local directory. Arc will not guess.'
                : 'Choose the school yourself. Arc will not guess.'}
            </span>
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
                    onClick={() => chooseSchool(candidate)}
                  >
                    {isSelected ? 'Loaded' : 'Load this school'}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {selected && showSearchAgain && (
        <div className="school-identity-selection" role="status" aria-label="Selected official school identity">
          <p className="section-label">School identity selected</p>
          <strong>{selected.schoolName}</strong>
          <p>{selected.districtName ?? 'District not listed'}{selected.locality ? ` · ${selected.locality}` : ''}</p>
          <p>Nothing has been added to your calendar. Next, Arc needs the school or district’s official calendar before it can propose dates for review.</p>
        </div>
      )}

      {selected && (
        <details className="school-identity-optional-source">
          <summary>Optional: hold an official calendar link</summary>
          <OfficialCalendarSourceInput key={selected.id} school={selected} onUseCalendar={onUseCalendar} />
        </details>
      )}
    </section>
  )
}

function cityFromLocality(locality?: string): string {
  if (!locality) return ''
  return locality.split(',')[0]?.trim() ?? ''
}

function stateFromLocality(locality?: string): string {
  if (!locality) return ''
  const parts = locality.split(',').map((part) => part.trim())
  const stateZip = parts[1] ?? ''
  return stateZip.split(/\s+/)[0] ?? ''
}
