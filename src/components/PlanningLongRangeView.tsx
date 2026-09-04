import type { KeyboardEvent } from 'react'
import type { ProjectedDay } from '../calendar/projections'
import type { PlanningRangeProjection } from '../planning/planningProjection'
import { CalendarDayCell } from './CalendarProjectionPrimitives'

export function PlanningLongRangeView({
  days,
  planning,
  onOpenUnit,
  onOpenLesson,
}: {
  days: ProjectedDay[]
  planning: PlanningRangeProjection
  onOpenUnit?: (unitId: string) => void
  onOpenLesson?: (unitId: string, lessonId: string) => void
}) {
  const unitByLesson = new Map<string, string>()
  const lessonsByDate = new Map<string, Array<{
    lessonId: string
    unitId: string
    courseId: string
    courseTitle: string
    title: string
    sections: string[]
    shiftedSections: string[]
  }>>()

  for (const courseGroup of planning.courses) {
    for (const sectionRow of courseGroup.sections) {
      for (const day of sectionRow.days) {
        for (const lesson of day.lessons) {
          unitByLesson.set(lesson.lessonId, lesson.unitId)
          const bucket = lessonsByDate.get(day.date) ?? []
          let signal = bucket.find((candidate) => candidate.lessonId === lesson.lessonId && candidate.courseId === lesson.courseId)
          if (!signal) {
            signal = {
              lessonId: lesson.lessonId,
              unitId: lesson.unitId,
              courseId: lesson.courseId,
              courseTitle: courseGroup.course.title,
              title: lesson.title,
              sections: [],
              shiftedSections: [],
            }
            bucket.push(signal)
            lessonsByDate.set(day.date, bucket)
          }
          if (!signal.sections.includes(sectionRow.section.name)) signal.sections.push(sectionRow.section.name)
          if (lesson.isSectionOverride && !signal.shiftedSections.includes(sectionRow.section.name)) signal.shiftedSections.push(sectionRow.section.name)
        }
      }
    }
  }

  const units = planning.courses.flatMap((courseGroup) => courseGroup.unitSpans.map((span) => ({ ...span, courseTitle: courseGroup.course.title })))

  return (
    <div className="planning-long-range">
      {units.length ? (
        <div className="planning-long-range-units" aria-label="Units in range">
          {units.map((unit) => {
            const open = () => onOpenUnit?.(unit.unitId)
            return (
              <div
                key={`${unit.courseId}:${unit.unitId}`}
                className={`planning-long-range-unit${onOpenUnit ? ' planning-object-openable' : ''}`}
                role={onOpenUnit ? 'button' : undefined}
                tabIndex={onOpenUnit ? 0 : undefined}
                onClick={open}
                onKeyDown={(event) => activateOnKeyboard(event, open)}
                data-unit-id={unit.unitId}
              >
                <span>{unit.courseTitle}</span>
                <strong>{unit.title}</strong>
                <span>{unit.startDate}–{unit.endDate}</span>
              </div>
            )
          })}
        </div>
      ) : null}

      <div className="projection-range planning-long-range-days">
        {days.map((day) => {
          const signals = lessonsByDate.get(day.date) ?? []
          return (
            <div className="planning-long-range-day" key={day.date} data-date={day.date}>
              <CalendarDayCell day={day} compact />
              {signals.length ? (
                <div className="planning-long-range-lessons" aria-label={`Lessons on ${day.date}`}>
                  {signals.map((signal) => {
                    const unitId = unitByLesson.get(signal.lessonId) ?? signal.unitId
                    const canOpen = Boolean(onOpenLesson && unitId)
                    const open = () => {
                      if (unitId) onOpenLesson?.(unitId, signal.lessonId)
                    }
                    return (
                      <div
                        key={`${signal.courseId}:${signal.lessonId}`}
                        className={`planning-long-range-lesson${canOpen ? ' planning-object-openable' : ''}`}
                        role={canOpen ? 'button' : undefined}
                        tabIndex={canOpen ? 0 : undefined}
                        onClick={open}
                        onKeyDown={(event) => activateOnKeyboard(event, open)}
                        data-lesson-id={signal.lessonId}
                      >
                        <strong>{signal.title}</strong>
                        <span>{signal.courseTitle} · {signal.sections.join(' · ')}</span>
                        {signal.shiftedSections.length ? <span>Shifted: {signal.shiftedSections.join(', ')}</span> : null}
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function activateOnKeyboard(event: KeyboardEvent<HTMLElement>, action: () => void) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  action()
}
