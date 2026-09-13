import type { ProjectedDay } from '../calendar/projections'
import type { PlanFocus } from '../calendar/navigationContext'
import type { DayContinuityLesson, DayContinuityProjection, DayContinuitySection } from '../planning/dayContinuityProjection'
import type { Lesson, LessonWorkspace, PlanningWorkspace, TeachingDayBlock } from '../planning'
import { buildTeachingDayRail, type TeachingDayRailItem } from '../planning/teachingDayRail'
import { formatShortDate } from './dateLabels'

export function PlanningDayContinuityView({
  day,
  continuity,
  onStartClass,
  lessons,
  planning,
  planFocus = 'day',
  selectedBlockId,
  selectedLessonId,
  onSelectBlock,
  onSelectLesson,
  onRetreat,
  onOpenWorkspace,
}: {
  day: ProjectedDay
  continuity: DayContinuityProjection
  onStartClass?: (sectionId: string, lessonId: string) => void
  lessons: LessonWorkspace
  planning: PlanningWorkspace
  planFocus?: PlanFocus
  selectedBlockId?: string
  selectedLessonId?: string
  onSelectBlock?: (block: TeachingDayRailItem) => void
  onSelectLesson?: (lesson: DayContinuityLesson) => void
  onRetreat?: () => void
  onOpenWorkspace?: () => void
}) {
  const periodRail = buildTeachingDayRail(planning, continuity)
  const selectedRail = periodRail.find((item) => item.id === selectedBlockId) ?? null
  const selectedSection = selectedRail?.course && selectedRail.sectionId
    ? selectedRail.course.sections.find((section) => section.sectionId === selectedRail.sectionId) ?? null
    : null

  if (continuity.courses.length === 0) {
    return <p className="planning-empty-state">Set up Classes to begin placing teaching work on the calendar.</p>
  }

  return (
    <div className="day-continuity" data-plan-focus={planFocus} data-plan-date={day.date} data-plan-section={selectedRail?.sectionId ?? ''} data-plan-block={selectedRail?.id ?? ''} data-plan-lesson={selectedLessonId ?? ''}>
      {day.kind !== 'instructional' ? (
        <p className="day-continuity-day-note">
          <strong>{day.label || humanizeKind(day.kind)}</strong>
          <span>Day view stays available so notes and unfinished teaching context do not disappear.</span>
        </p>
      ) : null}

      {periodRail.length > 0 ? (
        <nav className="day-period-rail" aria-label="Teaching day periods">
          {periodRail.map((item) => item.course && item.sectionId ? (
            <button type="button" className={`day-period-button${item.id === selectedRail?.id && planFocus !== 'day' ? ' is-selected' : ''}`} aria-current={item.id === selectedRail?.id && planFocus !== 'day' ? 'true' : undefined} onClick={() => onSelectBlock?.(item)} key={item.id}>
              <span>{item.label}{blockTimes(item.block)}</span><strong>{item.courseTitle}</strong>
            </button>
          ) : (
            <button type="button" className={`day-period-gap${item.id === selectedRail?.id && planFocus !== 'day' ? ' is-selected' : ''}`} aria-current={item.id === selectedRail?.id && planFocus !== 'day' ? 'true' : undefined} aria-label={`${item.label}, ${item.type === 'planning' ? 'planning time' : 'non-teaching time'}`} onClick={() => onSelectBlock?.(item)} key={item.id}>
              <span>{item.label}{blockTimes(item.block)}</span><strong>{item.type === 'planning' ? 'Planning time' : 'Lunch / other'}</strong>
            </button>
          ))}
        </nav>
      ) : null}

      {planFocus === 'day' || !selectedRail ? (
        <p className="day-continuity-empty">Select a class to look closer. Teaching Day keeps every period in order, including Planning time.</p>
      ) : planFocus === 'lesson' && selectedSection ? (
        <LessonFocus
          lessonId={selectedLessonId}
          section={selectedSection}
          courseTitle={selectedRail.courseTitle ?? ''}
          canonical={lessons.lessons}
          onStartClass={onStartClass}
          onRetreat={onRetreat}
          onOpenWorkspace={onOpenWorkspace}
        />
      ) : selectedSection && selectedRail.course ? (
        <section className="day-continuity-course day-continuity-course--focus" aria-label={`${selectedRail.course.courseTitle} today`}>
          {onRetreat ? <button type="button" className="plan-back-link" onClick={onRetreat}>Back to Teaching Day</button> : null}
          <header className="day-continuity-course-heading">
            <div><p className="day-continuity-kicker">Focused teaching moment · {selectedSection.sectionName}</p><h2>{selectedRail.course.courseTitle}</h2></div>
            {selectedRail.course.activeUnits.length > 0 ? (
              <p className="day-continuity-units">
                <span>Unit</span>
                <strong>{selectedRail.course.activeUnits.map((unit) => unit.title).join(' · ')}</strong>
              </p>
            ) : null}
          </header>
          {onOpenWorkspace ? <p className="day-continuity-lesson-actions"><button type="button" className="text-button" onClick={onOpenWorkspace}>Open Workspace</button></p> : null}

          <div className="day-continuity-sections">
            <article className="day-continuity-section">
              <header className="day-continuity-section-heading">
                <h3>{selectedSection.sectionName}</h3>
              </header>
              <div className="day-continuity-work">
                {selectedSection.carryovers.length > 0 ? (
                  <section className="day-continuity-held" aria-label={`${selectedSection.sectionName} unfinished teaching`}>
                    <p className="day-continuity-kicker">Arc is holding your place</p>
                    {selectedSection.carryovers.map((lesson) => (
                      <ContinuityLesson key={lesson.lessonId} lesson={lesson} sectionId={selectedSection.sectionId} onStartClass={onStartClass} onSelectLesson={onSelectLesson} carryover />
                    ))}
                  </section>
                ) : null}
                <section className="day-continuity-planned" aria-label={`${selectedSection.sectionName} plan for today`}>
                  <p className="day-continuity-kicker">Today’s plan</p>
                  {selectedSection.scheduledLessons.length > 0 ? (
                    selectedSection.scheduledLessons.map((lesson) => (
                      <ContinuityLesson key={lesson.lessonId} lesson={lesson} sectionId={selectedSection.sectionId} onStartClass={onStartClass} onSelectLesson={onSelectLesson} />
                    ))
                  ) : (
                    <p className="day-continuity-empty">No Lesson placed for this class.</p>
                  )}
                </section>
              </div>
            </article>
          </div>
        </section>
      ) : selectedRail.type === 'planning' ? (
        <PlanningPeriodLens label={selectedRail.label} date={day.date} continuity={continuity} lessons={lessons} onRetreat={onRetreat} onOpenWorkspace={onOpenWorkspace} />
      ) : (
        <NonTeachingLens label={selectedRail.label} onRetreat={onRetreat} />
      )}
    </div>
  )
}

function LessonFocus({
  lessonId,
  section,
  courseTitle,
  canonical,
  onStartClass,
  onRetreat,
  onOpenWorkspace,
}: {
  lessonId?: string
  section: DayContinuitySection
  courseTitle: string
  canonical: Lesson[]
  onStartClass?: (sectionId: string, lessonId: string) => void
  onRetreat?: () => void
  onOpenWorkspace?: () => void
}) {
  const projected = [...section.carryovers, ...section.scheduledLessons].find((item) => item.lessonId === lessonId) ?? null
  const source = canonical.find((item) => item.id === lessonId) ?? null
  if (!projected || !source) {
    return <p className="day-continuity-empty">That Lesson is no longer in this class. Arc returned you to the nearest valid teaching place.</p>
  }

  return (
    <section className="lesson-focus" aria-label={`${source.title} lesson focus`} data-lesson-focus={source.id}>
      {onRetreat ? <button type="button" className="plan-back-link" onClick={onRetreat}>Back to class</button> : null}
      <header className="lesson-focus-heading">
        <p className="day-continuity-kicker">{section.sectionName} · {courseTitle}</p>
        <h2>{source.title}</h2>
        <p className="day-continuity-lesson-meta">
          <span>{projected.unitTitle}</span>
          <span>{humanizeStatus(projected.deliveryStatus)}</span>
          {projected.datePolicy === 'fixed' ? <span className="day-continuity-fixed">Fixed</span> : null}
          {projected.isSectionOverride ? <span>Shifted for this class</span> : null}
        </p>
      </header>
      {projected.deliveryStatus === 'in-progress' && projected.resumeNote ? (
        <p className="day-continuity-resume"><strong>Continue:</strong> {projected.resumeNote}</p>
      ) : null}
      {source.directions.length > 0 ? <LessonField label="Directions" items={source.directions} /> : null}
      {source.materials.length > 0 ? <LessonField label="Materials" items={source.materials} /> : null}
      {source.phases.length > 0 ? <LessonField label="Teaching phases" items={source.phases} /> : null}
      <div className="day-continuity-lesson-actions">
        {onOpenWorkspace ? <button type="button" className="text-button" onClick={onOpenWorkspace}>Open Workspace</button> : null}
        {onStartClass && (projected.deliveryStatus === 'not-started' || projected.deliveryStatus === 'in-progress') ? (
          <button type="button" className="day-start-class" onClick={() => onStartClass(section.sectionId, source.id)}>{projected.deliveryStatus === 'in-progress' ? 'Resume in ArcTable' : 'Start class'}</button>
        ) : null}
      </div>
    </section>
  )
}

function LessonField({ label, items }: { label: string; items: string[] }) {
  return (
    <section className="lesson-focus-field">
      <h3>{label}</h3>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </section>
  )
}

function PlanningPeriodLens({ label, date, continuity, lessons, onRetreat, onOpenWorkspace }: { label: string; date: string; continuity: DayContinuityProjection; lessons: LessonWorkspace; onRetreat?: () => void; onOpenWorkspace?: () => void }) {
  return (
    <section className="planning-period-lens" aria-label={`${label} planning time`}>
      {onRetreat ? <button type="button" className="plan-back-link" onClick={onRetreat}>Back to Teaching Day</button> : null}
      <header><div><p className="day-continuity-kicker">{label} · Planning time</p><h2>Pull the week into focus.</h2></div><p>Unfinished teaching, what comes next, and loose Lesson work across every prep.</p></header>
      {onOpenWorkspace ? <p className="day-continuity-lesson-actions"><button type="button" className="text-button" onClick={onOpenWorkspace}>Open Workspace</button></p> : null}
      <div className="planning-period-courses">
        {continuity.courses.map((course) => {
          const courseLessons = lessons.lessons.filter((lesson) => lesson.courseId === course.courseId)
          const next = courseLessons.filter((lesson) => lesson.plannedDate && lesson.plannedDate >= date).sort((a, b) => (a.plannedDate ?? '').localeCompare(b.plannedDate ?? '') || a.sequence - b.sequence)[0]
          const unfinished = course.sections.flatMap((section) => section.carryovers.map((lesson) => ({ section: section.sectionName, lesson })))
          const loose = courseLessons.filter((lesson) => lesson.plannedDate === null)
          return <article key={course.courseId}><h3>{course.courseTitle}</h3><p className="planning-period-sections">{course.sections.map((section) => section.sectionName).join(' · ')}</p>{unfinished.length ? <p><strong>Pick up:</strong> {unfinished.map((item) => `${item.section} — ${item.lesson.title}`).join('; ')}</p> : <p><strong>Pacing:</strong> Sections are aligned with no unfinished teaching held.</p>}<p><strong>Next:</strong> {next ? `${next.title} · ${formatShortDate(next.plannedDate!)}` : 'No dated Lesson ahead.'}</p>{loose.length ? <p><strong>Workspace:</strong> {loose.map((lesson) => lesson.title).join(', ')}</p> : null}</article>
        })}
      </div>
    </section>
  )
}

function NonTeachingLens({ label, onRetreat }: { label: string; onRetreat?: () => void }) {
  return (
    <section className="planning-period-lens" aria-label={`${label}, non-teaching time`}>
      {onRetreat ? <button type="button" className="plan-back-link" onClick={onRetreat}>Back to Teaching Day</button> : null}
      <header><div><p className="day-continuity-kicker">{label}</p><h2>This part of the day is yours.</h2></div><p>Arc keeps class plans quiet during lunch and other non-teaching blocks.</p></header>
    </section>
  )
}

function blockTimes(block: TeachingDayBlock | null): string {
  return block?.startTime && block.endTime ? ` · ${block.startTime}–${block.endTime}` : ''
}

function ContinuityLesson({ lesson, sectionId, onStartClass, onSelectLesson, carryover = false }: { lesson: DayContinuityLesson; sectionId: string; onStartClass?: (sectionId: string, lessonId: string) => void; onSelectLesson?: (lesson: DayContinuityLesson) => void; carryover?: boolean }) {
  const status = humanizeStatus(lesson.deliveryStatus)
  const actualDateDiffers = Boolean(lesson.taughtDate && lesson.taughtDate !== lesson.effectiveDate)
  const accessible = [
    lesson.title,
    lesson.unitTitle,
    carryover ? 'unfinished teaching Arc is holding' : 'plan for today',
    lesson.datePolicy === 'fixed' ? 'fixed date' : null,
    lesson.isSectionOverride ? 'shifted for this class' : null,
    status,
    lesson.taughtDate ? `taught ${formatShortDate(lesson.taughtDate)}` : null,
    lesson.resumeNote ? `resume note: ${lesson.resumeNote}` : null,
  ].filter(Boolean).join('. ')

  return (
    <article className={`day-continuity-lesson${carryover ? ' day-continuity-lesson--held' : ''}`} aria-label={accessible} data-lesson-id={lesson.lessonId}>
      <div className="day-continuity-lesson-heading">
        <strong>{lesson.title}</strong>
        {lesson.datePolicy === 'fixed' ? <span className="day-continuity-fixed">Fixed</span> : null}
      </div>
      <p className="day-continuity-lesson-meta">
        <span>{lesson.unitTitle}</span>
        <span>{status}</span>
        {lesson.isSectionOverride ? <span>Shifted for this class</span> : null}
        {carryover && lesson.effectiveDate === null ? <span>No planned date</span> : null}
      </p>
      {carryover && lesson.taughtDate ? (
        <p className="day-continuity-last-taught">Last taught {formatShortDate(lesson.taughtDate)}</p>
      ) : !carryover && actualDateDiffers && lesson.taughtDate ? (
        <p className="day-continuity-last-taught">Taught {formatShortDate(lesson.taughtDate)}</p>
      ) : null}
      {lesson.deliveryStatus === 'in-progress' && lesson.resumeNote ? (
        <p className="day-continuity-resume"><strong>Continue:</strong> {lesson.resumeNote}</p>
      ) : null}
      <div className="day-continuity-lesson-actions">
        {onSelectLesson ? <button type="button" className="text-button" onClick={() => onSelectLesson(lesson)}>Open lesson</button> : null}
        {onStartClass && (lesson.deliveryStatus === 'not-started' || lesson.deliveryStatus === 'in-progress') ? (
          <button type="button" className="day-start-class" onClick={() => onStartClass(sectionId, lesson.lessonId)}>{lesson.deliveryStatus === 'in-progress' ? 'Resume in ArcTable' : 'Start class'}</button>
        ) : null}
      </div>
    </article>
  )
}

function humanizeStatus(status: DayContinuityLesson['deliveryStatus']): string {
  if (status === 'in-progress') return 'In progress'
  if (status === 'completed') return 'Completed'
  if (status === 'skipped') return 'Skipped'
  return 'Not started'
}

function humanizeKind(kind: ProjectedDay['kind']): string {
  if (kind === 'holiday') return 'Holiday'
  if (kind === 'no-school') return 'No school'
  if (kind === 'teacher-workday') return 'Teacher workday'
  if (kind === 'break') return 'Break'
  if (kind === 'unknown') return 'Unconfirmed'
  return 'School day'
}
