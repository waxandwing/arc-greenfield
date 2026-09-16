import type { ISODate } from '../calendar/types'
import type { ProjectedDay } from '../calendar/projections'
import { isPlannableDayKind } from '../calendar/schoolCalendar'
import type { PlanFocus } from '../calendar/navigationContext'
import type { DayContinuityLesson, DayContinuityProjection, DayContinuitySection } from '../planning/dayContinuityProjection'
import type { CaptureWorkspace } from '../planning/captureWorkspace'
import type { Lesson, LessonWorkspace, PlanningPeriodAttentionItem, PlanningWorkspace, TeachingDayBlock, UnitWorkspace } from '../planning'
import type { SectionLessonDateOverride } from '../planning/sectionSchedule'
import { projectPlanningPeriodAttention } from '../planning/planningPeriodAttention'
import { buildTeachingDayRail, type TeachingDayRailItem } from '../planning/teachingDayRail'
import { formatShortDate } from './dateLabels'
import { ArcImportantObject } from './ArcImportantObject'
import { ArcObjectMenu, type ArcObjectMenuItem } from './ArcObjectMenu'

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
  onFollowAttention,
  onReturnToPlanningPeriod,
  planningReturnPending = false,
  units,
  captures,
  overrides = [],
  onBeginPlanLessonMove,
  onSetLessonImportant,
  onOpenRecoveryForSection,
  onEditLesson,
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
  onSelectLesson?: (lesson: { lessonId: string; unitId: string; courseId: string; sectionId?: string; date?: ISODate }) => void
  onRetreat?: () => void
  onFollowAttention?: (item: PlanningPeriodAttentionItem) => void
  onReturnToPlanningPeriod?: () => void
  planningReturnPending?: boolean
  units: UnitWorkspace
  captures: CaptureWorkspace | null
  overrides?: SectionLessonDateOverride[]
  onBeginPlanLessonMove?: (input: { lessonId: string; sectionId: string | null; defaultDestination?: ISODate | null }) => void
  onSetLessonImportant?: (lessonId: string, important: boolean) => boolean
  onOpenRecoveryForSection?: (sectionId: string) => void
  onEditLesson?: (lessonId: string) => void
  onOpenWorkspace?: () => void
}) {
  const periodRail = buildTeachingDayRail(planning, continuity)
  const selectedRail = periodRail.find((item) => item.id === selectedBlockId) ?? null
  const surfaceRail = planFocus === 'day' ? periodRail[0] ?? null : selectedRail
  const surfaceSection = surfaceRail?.course && surfaceRail.sectionId
    ? surfaceRail.course.sections.find((section) => section.sectionId === surfaceRail.sectionId) ?? null
    : null
  const classFocused = planFocus === 'class' || planFocus === 'lesson'
  const planningPeriodFocused = classFocused && surfaceRail?.type === 'planning'

  if (continuity.courses.length === 0) {
    return <p className="planning-empty-state">Set up Classes to begin placing teaching work on the calendar.</p>
  }

  return (
    <div className="day-continuity" data-plan-focus={planFocus} data-plan-date={day.date} data-plan-section={selectedRail?.sectionId ?? ''} data-plan-block={selectedRail?.id ?? ''} data-plan-lesson={selectedLessonId ?? ''}>
      {day.kind === 'early-release' ? (
        <p className="day-continuity-day-note day-continuity-day-note--early-release" role="status">
          <strong>{day.label?.trim() || 'Early release'}</strong>
          <span>
            {day.schoolEndTime
              ? `School ends at ${formatClockTime(day.schoolEndTime)}. Periods after that time may not meet.`
              : 'Add a school end time in calendar exceptions if your bell schedule shortens today.'}
          </span>
        </p>
      ) : !isPlannableDayKind(day.kind) ? (
        <p className="day-continuity-day-note">
          <strong>{day.label || humanizeKind(day.kind)}</strong>
          <span>Day view stays available so notes and unfinished teaching context do not disappear.</span>
        </p>
      ) : null}

      {periodRail.length > 0 ? (
        <nav className="day-period-rail" aria-label="Teaching day periods">
          {periodRail.map((item) => {
            const afterRelease = periodAfterSchoolEnd(item.block, day.schoolEndTime)
            const periodClass = item.course && item.sectionId
              ? `day-period-button${item.id === selectedRail?.id && classFocused ? ' is-selected' : ''}${afterRelease ? ' is-after-release' : ''}`
              : `day-period-gap${item.id === selectedRail?.id && classFocused ? ' is-selected' : ''}${afterRelease ? ' is-after-release' : ''}`
            return item.course && item.sectionId ? (
            <button type="button" className={periodClass} aria-current={item.id === selectedRail?.id && classFocused ? 'true' : undefined} onClick={() => onSelectBlock?.(item)} key={item.id}>
              <span>{item.label}{blockTimes(item.block)}{afterRelease ? ' · after release' : ''}</span><strong>{item.courseTitle}</strong>
            </button>
          ) : (
            <button type="button" className={periodClass} aria-current={item.id === selectedRail?.id && classFocused ? 'true' : undefined} aria-label={`${item.label}, ${item.type === 'planning' ? 'planning time' : 'non-teaching time'}${afterRelease ? ', after early release' : ''}`} onClick={() => onSelectBlock?.(item)} key={item.id}>
              <span>{item.label}{blockTimes(item.block)}{afterRelease ? ' · after release' : ''}</span><strong>{item.type === 'planning' ? 'Planning time' : 'Lunch / other'}</strong>
            </button>
          )})}
        </nav>
      ) : null}

      {planFocus === 'lesson' && surfaceSection ? (
        <LessonFocus
          lessonId={selectedLessonId}
          section={surfaceSection}
          courseTitle={surfaceRail?.courseTitle ?? ''}
          canonical={lessons.lessons}
          onStartClass={onStartClass}
          onRetreat={onRetreat}
          onReturnToPlanningPeriod={planningReturnPending ? onReturnToPlanningPeriod : undefined}
          onBeginPlanLessonMove={onBeginPlanLessonMove}
          onSetLessonImportant={onSetLessonImportant}
          onOpenRecoveryForSection={onOpenRecoveryForSection}
          onEditLesson={onEditLesson}
        />
      ) : surfaceSection && surfaceRail?.course ? (
        <section className="day-continuity-course day-continuity-course--focus" data-course-id={surfaceRail.course.courseId} aria-label={`${surfaceRail.course.courseTitle} today`}>
          {planningReturnPending && onReturnToPlanningPeriod ? <button type="button" className="plan-back-link" onClick={onReturnToPlanningPeriod}>Back to Planning period</button> : null}
          <header className="day-continuity-course-heading">
            {surfaceRail.course.activeUnits.length > 0 ? (
              <p className="day-continuity-units">
                <span>Unit</span>
                <strong>{surfaceRail.course.activeUnits.map((unit) => unit.title).join(' · ')}</strong>
              </p>
            ) : (
              <p className="day-continuity-units day-continuity-units--empty">
                <span>No active unit</span>
              </p>
            )}
          </header>

          <div className="day-continuity-work day-continuity-work--focus">
            {surfaceSection.carryovers.length > 0 ? (
              <section className="day-continuity-held" aria-label={`${surfaceSection.sectionName} unfinished teaching`}>
                <p className="day-continuity-kicker">Still teaching</p>
                {surfaceSection.carryovers.map((lesson) => (
                  <ContinuityLesson key={lesson.lessonId} lesson={lesson} sectionId={surfaceSection.sectionId} important={lessons.lessons.find((item) => item.id === lesson.lessonId)?.important === true} onStartClass={onStartClass} onSelectLesson={classFocused ? onSelectLesson : undefined} onBeginPlanLessonMove={onBeginPlanLessonMove} onSetLessonImportant={onSetLessonImportant} onOpenRecoveryForSection={onOpenRecoveryForSection} onEditLesson={onEditLesson} carryover />
                ))}
              </section>
            ) : null}
            <section className="day-continuity-planned" aria-label={`${surfaceSection.sectionName} plan for today`}>
              <p className="day-continuity-kicker">Today’s plan</p>
              {surfaceSection.scheduledLessons.length > 0 ? (
                surfaceSection.scheduledLessons.map((lesson) => (
                  <ContinuityLesson key={lesson.lessonId} lesson={lesson} sectionId={surfaceSection.sectionId} important={lessons.lessons.find((item) => item.id === lesson.lessonId)?.important === true} onStartClass={onStartClass} onSelectLesson={classFocused ? onSelectLesson : undefined} onBeginPlanLessonMove={onBeginPlanLessonMove} onSetLessonImportant={onSetLessonImportant} onOpenRecoveryForSection={onOpenRecoveryForSection} onEditLesson={onEditLesson} />
                ))
              ) : (
                <div className="day-continuity-empty-block">
                  <p className="day-continuity-empty">No lesson placed for this class today.</p>
                  {onOpenWorkspace ? (
                    <button type="button" className="text-button day-continuity-add" onClick={onOpenWorkspace}>Place a lesson</button>
                  ) : null}
                </div>
              )}
            </section>
          </div>
        </section>
      ) : surfaceRail?.type === 'planning' ? (
        <PlanningPeriodLens
          label={surfaceRail.label}
          date={day.date}
          continuity={continuity}
          planning={planning}
          units={units}
          lessons={lessons}
          captures={captures}
          overrides={overrides}
          classFocused={planningPeriodFocused}
          onRetreat={planningPeriodFocused ? onRetreat : undefined}
          onFollowAttention={planningPeriodFocused ? onFollowAttention : undefined}
          onOpenWorkspace={onOpenWorkspace}
        />
      ) : surfaceRail ? (
        <NonTeachingLens label={surfaceRail.label} onRetreat={classFocused ? onRetreat : undefined} />
      ) : (
        <p className="day-continuity-empty">Select a class to look closer. Teaching Day keeps every period in order, including Planning time.</p>
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
  onReturnToPlanningPeriod,
  onBeginPlanLessonMove,
  onSetLessonImportant,
  onOpenRecoveryForSection,
  onEditLesson,
}: {
  lessonId?: string
  section: DayContinuitySection
  courseTitle: string
  canonical: Lesson[]
  onStartClass?: (sectionId: string, lessonId: string) => void
  onRetreat?: () => void
  onReturnToPlanningPeriod?: () => void
  onBeginPlanLessonMove?: (input: { lessonId: string; sectionId: string | null; defaultDestination?: ISODate | null }) => void
  onSetLessonImportant?: (lessonId: string, important: boolean) => boolean
  onOpenRecoveryForSection?: (sectionId: string) => void
  onEditLesson?: (lessonId: string) => void
}) {
  const projected = [...section.carryovers, ...section.scheduledLessons].find((item) => item.lessonId === lessonId) ?? null
  const source = canonical.find((item) => item.id === lessonId) ?? null
  if (!projected || !source) {
    return <p className="day-continuity-empty">That Lesson is no longer in this class. Arc returned you to the nearest valid teaching place.</p>
  }

  return (
    <section className="lesson-focus" aria-label={`${source.title} lesson focus`} data-lesson-focus={source.id} data-important={source.important === true ? 'true' : 'false'} data-delivery-status={projected.deliveryStatus}>
      {onReturnToPlanningPeriod ? <button type="button" className="plan-back-link" onClick={onReturnToPlanningPeriod}>Back to Planning period</button> : null}
      {onRetreat && !onReturnToPlanningPeriod ? <button type="button" className="plan-back-link" onClick={onRetreat}>Back to class</button> : null}
      <header className="lesson-focus-heading">
        {source.important === true ? <p className="lesson-focus-important-label" role="status">IMPORTANT</p> : null}
        <h2>{source.title}</h2>
        <p className="day-continuity-lesson-meta lesson-focus-context">
          <span>{section.sectionName} · {courseTitle}</span>
          <span>{projected.unitTitle}</span>
          <span className="lesson-focus-status" data-status={projected.deliveryStatus}>{humanizeStatus(projected.deliveryStatus)}</span>
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
      {source.directions.length === 0 && source.materials.length === 0 && source.phases.length === 0 ? (
        <p className="day-continuity-empty lesson-focus-empty-body">
          {projected.deliveryStatus === 'skipped'
            ? 'This lesson was skipped. Move it if you still want it on another day, or leave the record as-is.'
            : 'No directions, materials, or phases yet.'}
        </p>
      ) : null}
      <div className="day-continuity-lesson-actions plan-lesson-action-row">
        {onEditLesson ? (
          <button type="button" className="primary-button lesson-focus-edit" onClick={() => onEditLesson(source.id)}>Edit lesson</button>
        ) : null}
        {onStartClass && (projected.deliveryStatus === 'not-started' || projected.deliveryStatus === 'in-progress') ? (
          <button type="button" className="day-start-class" onClick={() => onStartClass(section.sectionId, source.id)}>{projected.deliveryStatus === 'in-progress' ? 'Resume in ArcTable' : 'Start class'}</button>
        ) : null}
        {onSetLessonImportant ? (
          <button type="button" className="text-button" onClick={() => onSetLessonImportant(source.id, !(source.important === true))}>{source.important ? 'Remove Important' : 'Mark Important'}</button>
        ) : null}
        {onBeginPlanLessonMove && projected.datePolicy !== 'fixed' ? (
          <button type="button" className="text-button" data-testid="lesson-focus-move" onClick={() => onBeginPlanLessonMove({ lessonId: source.id, sectionId: section.sectionId, defaultDestination: projected.effectiveDate })}>Move</button>
        ) : null}
        {onBeginPlanLessonMove && projected.datePolicy === 'fixed' ? (
          <button type="button" className="text-button" data-testid="lesson-focus-move" onClick={() => onBeginPlanLessonMove({ lessonId: source.id, sectionId: section.sectionId, defaultDestination: projected.effectiveDate })}>Move fixed Lesson</button>
        ) : null}
        {onOpenRecoveryForSection && projected.deliveryStatus === 'in-progress' ? (
          <button type="button" className="text-button recovery-review-trigger" onClick={() => onOpenRecoveryForSection(section.sectionId)}>Review Shift</button>
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

function PlanningPeriodLens({
  label,
  date,
  continuity,
  planning,
  units,
  lessons,
  captures,
  overrides,
  classFocused: _classFocused,
  onRetreat: _onRetreat,
  onFollowAttention,
  onOpenWorkspace,
}: {
  label: string
  date: ISODate
  continuity: DayContinuityProjection
  planning: PlanningWorkspace
  units: UnitWorkspace
  lessons: LessonWorkspace
  captures: CaptureWorkspace | null
  overrides: SectionLessonDateOverride[]
  classFocused: boolean
  onRetreat?: () => void
  onFollowAttention?: (item: PlanningPeriodAttentionItem) => void
  onOpenWorkspace?: () => void
}) {
  const attention = projectPlanningPeriodAttention({ date, planning, units, lessons, captures, overrides, continuity })
  const bucketMeta: Record<keyof typeof attention.buckets, { label: string; addLabel: string; emptyHint: string }> = {
    now: {
      label: 'Now',
      addLabel: 'Open Workspace',
      emptyHint: 'Nothing on deck for the rest of today.',
    },
    'needs-attention': {
      label: 'Needs attention',
      addLabel: 'Add from Workspace',
      emptyHint: 'Stopped lessons and behind sections show up here.',
    },
    'next-planned': {
      label: 'Next planned',
      addLabel: 'Place a lesson',
      emptyHint: 'Place the next dated lesson per class.',
    },
  }

  return (
    <section className="planning-period-lens" aria-label={`${label} planning time`} data-planning-period-date={date}>
      <div className="planning-period-buckets">
        {(Object.keys(attention.buckets) as Array<keyof typeof attention.buckets>).map((bucket) => {
          const meta = bucketMeta[bucket]
          const items = attention.buckets[bucket]
          const showAdd = Boolean(onOpenWorkspace) && bucket !== 'now'
          return (
            <section key={bucket} className="planning-period-bucket" aria-label={meta.label} data-bucket={bucket}>
              <header className="planning-period-bucket-heading">
                <h3>{meta.label}</h3>
                {showAdd ? (
                  <button type="button" className="text-button planning-period-bucket-add" onClick={onOpenWorkspace}>
                    {meta.addLabel}
                  </button>
                ) : null}
              </header>
              {items.length === 0 ? (
                <div className="planning-period-empty-block">
                  <p className="planning-period-empty">{meta.emptyHint}</p>
                  {showAdd ? (
                    <button type="button" className="text-button planning-period-bucket-add planning-period-bucket-add--empty" onClick={onOpenWorkspace}>
                      {meta.addLabel}
                    </button>
                  ) : null}
                </div>
              ) : (
                <ul className="planning-period-items">
                  {items.map((item) => (
                    <li key={item.id}>
                      {onFollowAttention ? (
                        <button type="button" className="planning-period-item" data-attention-kind={item.kind} onClick={() => onFollowAttention(item)}>
                          <strong>{[item.courseTitle, item.sectionName, item.lessonTitle].filter(Boolean).join(' · ')}</strong>
                          <span>{item.reason}</span>
                        </button>
                      ) : (
                        <div className="planning-period-item" data-attention-kind={item.kind}>
                          <strong>{[item.courseTitle, item.sectionName, item.lessonTitle].filter(Boolean).join(' · ')}</strong>
                          <span>{item.reason}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>
    </section>
  )
}

function NonTeachingLens({ label }: { label: string; onRetreat?: () => void }) {
  return (
    <section className="planning-period-lens planning-period-lens--quiet" aria-label={`${label}, non-teaching time`}>
      <p className="day-continuity-empty">Non-teaching time — class plans stay quiet.</p>
    </section>
  )
}

function blockTimes(block: TeachingDayBlock | null): string {
  return block?.startTime && block.endTime ? ` · ${block.startTime}–${block.endTime}` : ''
}

function periodAfterSchoolEnd(block: TeachingDayBlock | null, schoolEndTime: string | undefined): boolean {
  if (!schoolEndTime || !block?.startTime) return false
  return block.startTime >= schoolEndTime
}

function formatClockTime(value: string): string {
  const [hours, minutes] = value.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`
}

function ContinuityLesson({ lesson, sectionId, important = false, onStartClass, onSelectLesson, onBeginPlanLessonMove, onSetLessonImportant, onOpenRecoveryForSection, onEditLesson, carryover = false }: { lesson: DayContinuityLesson; sectionId: string; important?: boolean; onStartClass?: (sectionId: string, lessonId: string) => void; onSelectLesson?: (lesson: { lessonId: string; unitId: string; courseId: string; sectionId?: string; date?: ISODate }) => void; onBeginPlanLessonMove?: (input: { lessonId: string; sectionId: string | null; defaultDestination?: ISODate | null }) => void; onSetLessonImportant?: (lessonId: string, important: boolean) => boolean; onOpenRecoveryForSection?: (sectionId: string) => void; onEditLesson?: (lessonId: string) => void; carryover?: boolean }) {
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

  const menuItems: ArcObjectMenuItem[] = []
  if (onEditLesson) {
    menuItems.push({
      id: 'edit',
      label: 'Edit lesson',
      onSelect: () => { onEditLesson(lesson.lessonId) },
    })
  }
  if (onSetLessonImportant) {
    menuItems.push({
      id: 'important',
      label: important ? 'Remove Important' : 'Mark Important',
      onSelect: () => { onSetLessonImportant(lesson.lessonId, !important) },
    })
  }
  if (onBeginPlanLessonMove) {
    menuItems.push({
      id: 'move',
      label: 'Move to date…',
      onSelect: () => onBeginPlanLessonMove({ lessonId: lesson.lessonId, sectionId, defaultDestination: lesson.effectiveDate }),
    })
  }

  return (
    <ArcImportantObject important={important} className={`day-continuity-lesson${carryover ? ' day-continuity-lesson--held' : ''}`}>
    <article aria-label={accessible} data-lesson-id={lesson.lessonId}>
      <ArcObjectMenu label={lesson.title} items={menuItems}>
      <div className="day-continuity-lesson-heading">
        {onSelectLesson ? (
          <button
            type="button"
            className="day-continuity-lesson-title-open"
            aria-label={`Open ${lesson.title} lesson plan`}
            onClick={() => onSelectLesson({ ...lesson, sectionId })}
          >
            <strong>{lesson.title}</strong>
          </button>
        ) : (
          <strong>{lesson.title}</strong>
        )}
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
      </ArcObjectMenu>
      <div className="day-continuity-lesson-actions plan-lesson-action-row">
        {onStartClass && (lesson.deliveryStatus === 'not-started' || lesson.deliveryStatus === 'in-progress') ? (
          <button type="button" className="day-start-class" onClick={() => onStartClass(sectionId, lesson.lessonId)}>{lesson.deliveryStatus === 'in-progress' ? 'Resume in ArcTable' : 'Start class'}</button>
        ) : null}
        {onSelectLesson ? <button type="button" className="text-button" onClick={() => onSelectLesson({ ...lesson, sectionId })}>Open lesson</button> : null}
        {onEditLesson ? <button type="button" className="text-button" onClick={() => onEditLesson(lesson.lessonId)}>Edit</button> : null}
        {onBeginPlanLessonMove ? (
          <button type="button" className="text-button" onClick={() => onBeginPlanLessonMove({ lessonId: lesson.lessonId, sectionId, defaultDestination: lesson.effectiveDate })}>Move</button>
        ) : null}
        {onOpenRecoveryForSection && lesson.deliveryStatus === 'in-progress' ? (
          <button type="button" className="text-button recovery-review-trigger" onClick={() => onOpenRecoveryForSection(sectionId)}>Review Shift</button>
        ) : null}
      </div>
    </article>
    </ArcImportantObject>
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
  if (kind === 'early-release') return 'Early release'
  if (kind === 'break') return 'Break'
  if (kind === 'unknown') return 'Unconfirmed'
  return 'School day'
}
