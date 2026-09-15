import { useMemo, useState } from 'react'
import {
  buildCurriculumImportProposal,
  parseCurriculumCsv,
  type CurriculumImportProposal,
  type CurriculumImportReceipt,
  type Course,
  type Unit,
  type Lesson,
  type ReimportDecision,
  canonicalValueHash,
  classifyReimport,
} from '../planning'

type Props = {
  calendarId: string
  existingCourses: Array<{ id: string; title: string }>
  existingUnits: Unit[]
  existingLessons: Lesson[]
  onCommit: (proposal: CurriculumImportProposal, courseMatches: Record<string, string>, decisions: Record<string, ReimportDecision>) => CurriculumImportReceipt | string
  onCancel: () => void
  /** Confirmed import receipt returns to Day without reopening Settings. */
  onReturnToDay?: () => void
  onOpenCalendar: () => void
  onOpenClasses: () => void
  onOpenTeachingDay: () => void
}

const SAMPLE_HEADER = 'Course,Order,Unit,Unit Length,Item Type,Title,Item Length,Content/Resources,Homework/Next Up,Important Notes'

export function CurriculumImport({ calendarId, existingCourses, existingUnits, existingLessons, onCommit, onCancel, onReturnToDay, onOpenCalendar, onOpenClasses, onOpenTeachingDay }: Props) {
  const [sourceIdentity, setSourceIdentity] = useState('')
  const [source, setSource] = useState('')
  const [stage, setStage] = useState<'choose' | 'review' | 'receipt'>('choose')
  const [includedRows, setIncludedRows] = useState<number[]>([])
  const [courseMatches, setCourseMatches] = useState<Record<string, string>>({})
  const [decisions, setDecisions] = useState<Record<string, ReimportDecision>>({})
  const [receipt, setReceipt] = useState<CurriculumImportReceipt | null>(null)
  const [error, setError] = useState<string | null>(null)
  const parsed = useMemo(() => source || sourceIdentity ? parseCurriculumCsv(source, sourceIdentity) : null, [source, sourceIdentity])
  const proposal = useMemo(() => parsed?.canPreview ? buildCurriculumImportProposal({ parsed, calendarId, includeRows: includedRows }) : null, [parsed, calendarId, includedRows])

  function review() {
    if (!parsed?.canPreview) { setError('Resolve the source issues before review.'); return }
    const safeRows = parsed.candidates.filter((candidate) => candidate.issues.length === 0).map((candidate) => candidate.sourceRow)
    setIncludedRows(safeRows)
    setError(null)
    setStage('review')
  }

  function confirm() {
    if (!proposal) return
    const result = onCommit(proposal, courseMatches, decisions)
    if (typeof result === 'string') { setError(result); return }
    setReceipt(result)
    setError(null)
    setStage('receipt')
  }

  if (stage === 'receipt' && receipt) {
    return <section className="import-surface import-receipt" aria-labelledby="import-receipt-title"><p className="section-label">Import verified</p><h2 id="import-receipt-title">The confirmed curriculum is now in Arc.</h2><dl><div><dt>Courses created</dt><dd>{receipt.created.courses}</dd></div><div><dt>Units created</dt><dd>{receipt.created.units}</dd></div><div><dt>Lessons created</dt><dd>{receipt.created.lessons}</dd></div><div><dt>Rows held back</dt><dd>{receipt.skippedRows.length}</dd></div></dl><p>Imported Lessons are unscheduled. Their source identity and row references stay attached for future re-import review.</p><button type="button" className="primary-button" onClick={onReturnToDay ?? onCancel}>Return to Day</button></section>
  }

  return (
    <section className="import-surface" aria-labelledby="import-title">
      <nav className="import-lanes" aria-label="Import sources"><button type="button" onClick={onOpenCalendar}>School calendar</button><button type="button" onClick={onOpenTeachingDay}>Bell schedule</button><button type="button" onClick={onOpenClasses}>Courses &amp; sections</button><button type="button" aria-current="page">Curriculum CSV</button><button type="button" disabled title="Prior-year Arc reuse is not available in this build.">Prior Arc material</button></nav>
      <header className="calendar-setup-intro"><p className="section-label">Curriculum import</p><h2 id="import-title">Bring in the structure. Keep the decisions yours.</h2><p>Arc reads a CSV into a temporary proposal. Nothing becomes Course, Unit, or Lesson truth until you review and confirm.</p></header>
      {error ? <p className="setup-errors" role="alert">{error}</p> : null}
      {stage === 'choose' ? (
        <div className="import-source-stage">
          <label><span>Source name</span><input value={sourceIdentity} onChange={(event) => setSourceIdentity(event.target.value)} placeholder="AP-Art-History-2026.csv" /></label>
          <label className="import-file"><span>Choose a CSV file</span><input type="file" accept=".csv,text/csv" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; setSourceIdentity(file.name); setSource(await file.text()) }} /></label>
          <label><span>CSV content</span><textarea value={source} onChange={(event) => setSource(event.target.value)} placeholder={`${SAMPLE_HEADER}\nAP Art History,1,Ancient worlds,3 weeks,Lesson,Reading images…`} rows={12} /></label>
          {parsed?.canPreview ? <p className="import-parse-summary" role="status"><strong>{parsed.candidates.length} source rows ready for review.</strong> Arc has not written Courses, Units, or Lessons.</p> : null}
          {parsed?.issues.length ? <ImportIssues issues={parsed.issues} /> : null}
          <div className="setup-actions"><p>Parsing and review do not write to canonical planning storage.</p><div className="setup-action-buttons"><button type="button" className="text-button" onClick={onCancel}>Cancel</button><button type="button" className="primary-button" onClick={review} disabled={!parsed?.canPreview}>Review proposal</button></div></div>
        </div>
      ) : proposal && parsed ? (
        <div className="import-review-stage">
          <div className="import-review-columns">
            <section aria-labelledby="source-rows-title"><p className="section-label">Source</p><h3 id="source-rows-title">Rows Arc read</h3><div className="import-row-list">{parsed.candidates.map((candidate) => <label className={candidate.issues.length ? 'has-review' : ''} key={candidate.candidateId}><input type="checkbox" checked={includedRows.includes(candidate.sourceRow)} disabled={candidate.issues.length > 0} onChange={(event) => setIncludedRows((current) => event.target.checked ? [...current, candidate.sourceRow] : current.filter((row) => row !== candidate.sourceRow))} /><span><strong>Row {candidate.sourceRow}</strong>{candidate.fields.Course} · {candidate.fields.Unit} · {candidate.fields.Title}{candidate.issues.map((issue) => <small key={issue.id}>{issue.message}</small>)}</span></label>)}</div></section>
            <section aria-labelledby="arc-proposal-title"><p className="section-label">Arc proposal</p><h3 id="arc-proposal-title">What confirmation will create</h3><div className="import-proposal-tree">{proposal.courses.map((course) => { const matching = existingCourses.filter((existing) => existing.title.toLocaleLowerCase() === course.title.toLocaleLowerCase()); return <div key={course.id}><strong>{course.title}</strong>{matching.length ? <label><span>Potential existing Course</span><select value={courseMatches[course.id] ?? ''} onChange={(event) => setCourseMatches((current) => ({ ...current, [course.id]: event.target.value }))}><option value="">Create separately</option>{matching.map((existing) => <option key={existing.id} value={existing.id}>Match {existing.title}</option>)}</select></label> : null}<ul>{proposal.units.filter((unit) => unit.courseId === course.id).map((unit) => <li key={unit.id}><span>{unit.title}</span><small>{proposal.lessons.filter((lesson) => lesson.unitId === unit.id).length} Lessons · unscheduled</small></li>)}</ul></div> })}</div><ReimportReview proposal={proposal} existing={[...existingUnits, ...existingLessons]} decisions={decisions} onDecision={(fingerprint, decision) => setDecisions((current) => ({ ...current, [fingerprint]: decision }))} /></section>
          </div>
          {proposal.issues.length ? <ImportIssues issues={proposal.issues.filter((issue) => issue.severity !== 'notice')} /> : null}
          <div className="import-preview-summary" aria-live="polite"><span><strong>{proposal.courses.length}</strong> Courses proposed</span><span><strong>{proposal.units.length}</strong> Units proposed</span><span><strong>{proposal.lessons.length}</strong> Lessons proposed</span><span><strong>{proposal.skippedRows.length}</strong> rows held back</span></div>
          <div className="setup-actions"><p>Confirm writes the complete reviewed set together. If any store refuses the write, Arc rolls the entire import back.</p><div className="setup-action-buttons"><button type="button" className="text-button" onClick={() => setStage('choose')}>Back</button><button type="button" className="primary-button" onClick={confirm} disabled={proposal.lessons.length === 0 && proposal.units.length === 0}>Confirm import</button></div></div>
        </div>
      ) : null}
    </section>
  )
}

function ImportIssues({ issues }: { issues: Array<{ id: string; message: string; severity: string }> }) {
  return <div className="import-issues" aria-label="Import issues"><strong>Arc noticed</strong><ul>{issues.map((issue) => <li key={issue.id} data-severity={issue.severity}>{issue.message}</li>)}</ul></div>
}

function ReimportReview({ proposal, existing, decisions, onDecision }: { proposal: CurriculumImportProposal; existing: Array<Course | Unit | Lesson>; decisions: Record<string, ReimportDecision>; onDecision: (fingerprint: string, decision: ReimportDecision) => void }) {
  const items = [...proposal.units, ...proposal.lessons].flatMap((record) => {
    const fingerprint = record.importProvenance?.fingerprint
    const match = fingerprint ? existing.find((candidate) => candidate.importProvenance?.fingerprint === fingerprint) : undefined
    if (!match || !fingerprint) return []
    return [{ record, fingerprint, state: classifyReimport(record, match, canonicalValueHash(match)) }]
  })
  if (!items.length) return null
  return <div className="reimport-review"><p className="section-label">Previously imported</p>{items.map(({ record, fingerprint, state }) => <div key={fingerprint}><span><strong>{record.title}</strong><small>{state.replace('-', ' ')}</small></span>{state === 'unchanged' ? <em>No write needed</em> : <label><span className="sr-only">Resolution for {record.title}</span><select value={decisions[fingerprint] ?? ''} onChange={(event) => onDecision(fingerprint, event.target.value as ReimportDecision)}><option value="">Choose resolution</option><option value="keep-local">Keep local version</option><option value="use-source">Use source version</option><option value="create-copy">Create a separate copy</option></select></label>}</div>)}</div>
}
