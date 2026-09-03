import { useState } from 'react'
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

  function updatePlacement(unitId: string, edge: 'start' | 'end', rawDate: string) {
    setUnits((current) => current.map((item) => {
      if (item.id !== unitId) return item
      if (!rawDate) return { ...item, placement: null }
      const date = rawDate as ISODate
      if (edge === 'start') {
        return { ...item, placement: { startDate: date, endDate: item.placement?.endDate ?? date } }
      }
      return { ...item, placement: { startDate: item.placement?.startDate ?? date, endDate: date } }
    }))
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

  if (planning.courses.length === 0) {
    return <div className="unit-setup"><p className="projection-empty-state">Set up at least one class before creating Units.</p></div>
  }

  return (
    <div className="unit-setup">
      <div className="calendar-setup-intro">
        <p className="section-label">Units</p>
        <h2>Map the big pieces first.</h2>
        <p>A Unit belongs to one shared course plan. Dates are optional until you are ready to place it on the calendar.</p>
      </div>

      {errors.length > 0 && <div className="setup-errors" role="alert"><strong>Check the Units.</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}

      <div className="unit-editor-list">
        {units.map((unit) => (
          <section className="unit-editor-row" key={unit.id}>
            <label><span>Unit</span><input value={unit.title} placeholder="Ancient Egypt" onChange={(event) => setUnits((current) => current.map((item) => item.id === unit.id ? { ...item, title: event.target.value } : item))} /></label>
            <label><span>Course</span><select value={unit.courseId} onChange={(event) => setUnits((current) => current.map((item) => item.id === unit.id ? { ...item, courseId: event.target.value } : item))}>{planning.courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
            <label><span>Start</span><input type="date" min={calendar.firstDay} max={calendar.lastDay} value={unit.placement?.startDate ?? ''} onChange={(event) => updatePlacement(unit.id, 'start', event.target.value)} /></label>
            <label><span>End</span><input type="date" min={calendar.firstDay} max={calendar.lastDay} value={unit.placement?.endDate ?? ''} onChange={(event) => updatePlacement(unit.id, 'end', event.target.value)} /></label>
            <button type="button" className="text-button" onClick={() => setUnits((current) => current.filter((item) => item.id !== unit.id))}>Remove</button>
          </section>
        ))}
      </div>

      <button type="button" className="quiet-button" onClick={addUnit}>Add Unit</button>

      <div className="setup-actions">
        <p>Unscheduled Units are allowed. Placed Units must contain at least one confirmed instructional day.</p>
        <div className="setup-action-buttons"><button type="button" className="text-button" onClick={onCancel}>Cancel</button><button type="button" className="primary-button" onClick={submit}>Save Units</button></div>
      </div>
    </div>
  )
}
