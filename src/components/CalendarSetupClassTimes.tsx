import { useEffect, useState } from 'react'
import { classTimeDraftsForSchool, type ClassTimeDraft } from '../calendar'

type Props = {
  schoolNcesId: string | null
}

export function CalendarSetupClassTimes({ schoolNcesId }: Props) {
  const [sourceLabel, setSourceLabel] = useState('')
  const [fromSchoolData, setFromSchoolData] = useState(false)
  const [rows, setRows] = useState<ClassTimeDraft[]>([])

  useEffect(() => {
    if (!schoolNcesId) {
      setRows([])
      setSourceLabel('')
      setFromSchoolData(false)
      return
    }
    const next = classTimeDraftsForSchool(schoolNcesId)
    setRows(next.drafts)
    setSourceLabel(next.sourceLabel)
    setFromSchoolData(next.fromSchoolData)
  }, [schoolNcesId])

  if (!schoolNcesId || rows.length === 0) return null

  function updateRow(id: string, patch: Partial<ClassTimeDraft>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  function addPeriod() {
    const nextIndex = rows.filter((row) => row.kind === 'teaching').length + 1
    setRows((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        label: `Period ${nextIndex}`,
        startTime: '',
        endTime: '',
        kind: 'teaching',
      },
    ])
  }

  function removeRow(id: string) {
    setRows((current) => current.filter((row) => row.id !== id))
  }

  return (
    <section
      className="calendar-setup-class-times"
      aria-labelledby="calendar-setup-class-times-title"
      data-testid="calendar-setup-class-times"
    >
      <div className="calendar-setup-step-heading">
        <p className="section-label">Class times</p>
        <h3 id="calendar-setup-class-times-title">Set the periods Arc should expect each day.</h3>
        <p>
          {fromSchoolData
            ? 'Loaded from your school’s curated bell schedule. Edit anything that does not match your day — nothing becomes teaching-day truth until you confirm Teaching day later.'
            : 'No curated bell schedule for this school yet, so Arc starts from editable demo periods. Adjust them to match your day.'}
        </p>
        {sourceLabel ? <p className="calendar-setup-class-times-source">Source: {sourceLabel}</p> : null}
      </div>

      <div className="calendar-setup-class-times-list" role="list">
        {rows.map((row, index) => (
          <div className={`calendar-setup-class-time-row calendar-setup-class-time-row--${row.kind}`} key={row.id} role="listitem">
            <label>
              <span className="sr-only">Block {index + 1} label</span>
              <input
                value={row.label}
                onChange={(event) => updateRow(row.id, { label: event.target.value })}
                aria-label={`Class time ${index + 1} label`}
                data-testid={index === 0 ? 'calendar-setup-class-time-label' : undefined}
              />
            </label>
            <label>
              <span className="sr-only">Starts</span>
              <input
                type="time"
                value={row.startTime}
                onChange={(event) => updateRow(row.id, { startTime: event.target.value })}
                aria-label={`${row.label || `Block ${index + 1}`} start time`}
              />
            </label>
            <span className="calendar-setup-class-time-sep" aria-hidden="true">–</span>
            <label>
              <span className="sr-only">Ends</span>
              <input
                type="time"
                value={row.endTime}
                onChange={(event) => updateRow(row.id, { endTime: event.target.value })}
                aria-label={`${row.label || `Block ${index + 1}`} end time`}
              />
            </label>
            <button
              type="button"
              className="text-button"
              aria-label={`Remove ${row.label || `block ${index + 1}`}`}
              onClick={() => removeRow(row.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="calendar-setup-class-times-actions">
        <button type="button" className="quiet-button" onClick={addPeriod}>Add period</button>
        <p>These times stay on Calendar setup as a working draft. Teaching day setup is where they become your day order.</p>
      </div>
    </section>
  )
}
