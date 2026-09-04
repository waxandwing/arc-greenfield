import { useMemo, useState } from 'react'
import type { ISODate, SchoolCalendar } from '../calendar'
import {
  createUnit,
  createUnitId,
  hydrateUnitWorkspace,
  placeUnit,
  type PlanningWorkspace,
  type Unit,
  type UnitWorkspace,
  type UnitWorkspaceInput,
} from '../planning'

type Props = {
  calendar: SchoolCalendar
  planning: PlanningWorkspace
  initialValue: UnitWorkspaceInput | null
  onSave: (input: UnitWorkspaceInput, workspace: UnitWorkspace) => void
  onCancel: () => void
}

export function UnitSetup({ calendar, planning, initialValue, onSave, onCancel }: Props) {
  const persistedUnitIds = useMemo(() => new Set(initialValue?.units.map((unit) => unit.id) ?? []), [initialValue])
  const [units, setUnits] = useState<Unit[]>(() => initialValue?.units.map((unit) => ({ ...unit, placement: unit.placement ? { ...unit.placement } : null })) ?? [])
  const [errors, setErrors] = useState<string[]>([])

  function addUnit() {
    const firstCourse = planning.courses[0]
    if (!firstCourse) return
    setUnits((current) => [...current, {
      id: createUnitId(),
      calendarId: calendar.id,
      courseId: firstCourse.id,
      title: '',
      placement: null,
    }])
  }

  function discardDraft(unitId: string) {
    if (persistedUnitIds.has(unitId)) return
    setUnits((current) => current.filter((item) => item.id !== unitId))
  }

  function updatePlacement(unitId: string, edge: 'start' | 'end', rawDate: string) {
    if (persistedUnitIds.has(unitId)) return
    setUnits((current) => current.map((item) => {
      if (item.id !== unitId) return item
      if (!rawDate) return { ...item, placement: null }
      const date = rawDate as ISODate
      if (edge === 'start') return { ...item, placement: { startDate: date, endDate: item.placement?.endDate ?? date } }
      return { ...item, placement: { startDate: item.placement?.startDate ?? date, endDate: date } }
    }))
  }

  function updateDraft(unitId: string, patch: Partial<Pick<Unit, 'title' | 'courseId'>>) {
    if (persistedUnitIds.has(unitId)) return
    setUnits((current) => current.map((item) => item.id === unitId ? { ...item, ...patch } : item))
  }

  function submit() {
    try {
      const normalized = units.map((draft) => {
        const base = createUnit({ id: draft.id, calendarId: calendar.id, courseId: draft.courseId, title: draft.title })
        return draft.placement ? placeUnit(base, calendar, draft.placement) : base
      })
      const input: UnitWorkspaceInput = { calendarId: calendar.id, units: normalized }
      const workspace = hydrateUnitWorkspace(input, calendar, planning)
      setErrors([])
      onSave(input, workspace)
    } catch (error) {
      const message = error instanceof Error ? error.message.replace(/^Cannot use Units\.\s*/, '') : String(error)
      setErrors(message.split(/(?<=\.)\s+/).filter(Boolean))
    }
  }

  if (planning.courses.length === 0) return <div className="unit-setup"><p className="projection-empty-state">Set up at least one class before creating Units.</p></div>

  return (
    <div className="unit-setup">
      <div className="calendar-setup-intro"><p className="section-label">Unit setup</p><h2>Build the big pieces.</h2><p>Add Units here in batches. Existing Units stay read-only in setup; open Unit Focus from the calendar to Move, Edit, Unplace, or Delete them.</p></div>
      {errors.length > 0 && <div className="setup-errors" role="alert"><strong>Check the Units.</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
      <div className="unit-editor-list">
        {units.map((unit) => {
          const persisted = persistedUnitIds.has(unit.id)
          return <section className="unit-editor-row" key={unit.id}>
            <label><span>Unit</span><input disabled={persisted} value={unit.title} placeholder="Ancient Egypt" onChange={(event) => updateDraft(unit.id, { title: event.target.value })} /></label>
            <label><span>Course</span><select disabled={persisted} value={unit.courseId} onChange={(event) => updateDraft(unit.id, { courseId: event.target.value })}>{planning.courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
            <label><span>Start</span><input type="date" disabled={persisted} min={calendar.firstDay} max={calendar.lastDay} value={unit.placement?.startDate ?? ''} onChange={(event) => updatePlacement(unit.id, 'start', event.target.value)} /></label>
            <label><span>End</span><input type="date" disabled={persisted} min={calendar.firstDay} max={calendar.lastDay} value={unit.placement?.endDate ?? ''} onChange={(event) => updatePlacement(unit.id, 'end', event.target.value)} /></label>
            {persisted
              ? <p className="unit-protected-note">Existing Unit. Use Unit Focus for Move, Edit, Unplace, or Delete.</p>
              : <button type="button" className="text-button" onClick={() => discardDraft(unit.id)}>Discard draft</button>}
          </section>
        })}
      </div>
      <button type="button" className="quiet-button" onClick={addUnit}>Add Unit</button>
      <div className="setup-actions"><p>Draft Units may be unscheduled. Once saved, calendar placement changes belong to Unit Focus.</p><div className="setup-action-buttons"><button type="button" className="text-button" onClick={onCancel}>Cancel</button><button type="button" className="primary-button" onClick={submit}>Save Unit setup</button></div></div>
    </div>
  )
}
