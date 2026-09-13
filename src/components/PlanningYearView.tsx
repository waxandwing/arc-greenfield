import type { ISODate, SchoolCalendar } from '../calendar'
import type { PlanningWorkspace, UnitWorkspace } from '../planning'
import { formatShortDate } from './dateLabels'

export function PlanningYearView({ calendar, planning, units, onSelectUnit }: { calendar: SchoolCalendar; planning: PlanningWorkspace; units: UnitWorkspace; onSelectUnit?: (date: ISODate) => void }) {
  return (
    <div className="planning-year" aria-label={`${calendar.schoolYearLabel} Course and Unit progression`}>
      <header className="planning-year-heading">
        <div><p className="section-label">Instructional progression</p><h2>All active Courses</h2></div>
        <p>Units, fixed pressure, and meaningful drift—not miniature calendars.</p>
      </header>
      {planning.courses.map((course, courseIndex) => {
        const courseUnits = units.units.filter((unit) => unit.courseId === course.id && unit.placement)
          .sort((a, b) => (a.placement?.startDate ?? '').localeCompare(b.placement?.startDate ?? ''))
        return (
          <section className={`planning-year-course planning-year-course--${courseIndex % 3}`} key={course.id} aria-label={`${course.title} Unit progression`}>
            <div className="planning-year-course-title"><h3>{course.title}</h3><span>{planning.sections.filter((section) => section.courseId === course.id).length} Sections · shared plan</span></div>
            <div className="planning-year-track">
              <div className="planning-year-underlay" />
              {courseUnits.map((unit, index) => {
                const placement = unit.placement!
                return (
                  <button type="button" className="planning-year-unit" key={unit.id} aria-label={`Open ${unit.title} in Month`} onClick={() => onSelectUnit?.(placement.startDate)}>
                    <span>Unit {index + 1}</span><strong>{unit.title}</strong><small>{formatShortDate(placement.startDate)}–{formatShortDate(placement.endDate)}</small>
                  </button>
                )
              })}
              {courseUnits.length === 0 ? <p className="planning-year-empty">Place Units to see this Course’s horizon.</p> : null}
            </div>
          </section>
        )
      })}
    </div>
  )
}
