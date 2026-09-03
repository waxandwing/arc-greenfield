import type { LessonWorkspace, SectionLessonDateOverride, UnitWorkspace } from '../planning'

export function FridgeDoorStrip({
  lessons,
  units,
  overrides,
  onOpenLesson,
}: {
  lessons: LessonWorkspace
  units: UnitWorkspace
  overrides: SectionLessonDateOverride[]
  onOpenLesson: (lessonId: string) => void
}) {
  const placedBySection = new Set(overrides.map((override) => override.lessonId))
  const unplaced = lessons.lessons
    .filter((lesson) => lesson.plannedDate === null && !placedBySection.has(lesson.id))
    .slice()
    .sort((a, b) => a.sequence - b.sequence || a.title.localeCompare(b.title))

  if (unplaced.length === 0) return null

  return (
    <section className="fridge-door-strip" aria-label="Fridge Door">
      <header className="fridge-door-heading">
        <div>
          <p className="section-label">Fridge Door</p>
          <p className="fridge-door-note">Off the calendar, not gone.</p>
        </div>
        <span className="fridge-door-count">{unplaced.length} waiting</span>
      </header>
      <div className="fridge-door-items">
        {unplaced.map((lesson) => {
          const unit = units.units.find((candidate) => candidate.id === lesson.unitId)
          return (
            <button
              key={lesson.id}
              type="button"
              className="fridge-door-lesson"
              onClick={() => onOpenLesson(lesson.id)}
            >
              <strong>{lesson.title}</strong>
              <span>{unit?.title ?? 'Unit unavailable'}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
