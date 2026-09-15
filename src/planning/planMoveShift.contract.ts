import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createPlanNavigationContext } from '../calendar/navigationContext'
import { createCourse, createSection } from './courses'
import { createLessonDeliveryState, updateLessonDeliveryState } from './deliveryState'
import { projectDayContinuity } from './dayContinuityProjection'
import { createLesson } from './lessons'
import { hydrateLessonWorkspace } from './lessonWorkspace'
import { createLessonMovePreview } from './lessonMovePreview'
import {
  contextAfterRecoveryShift,
  contextAfterSharedLessonMove,
  followPlanningAttentionTarget,
  restorePlanningPeriodBlock,
  resolvePlanContext,
  type PlanContextAuthority,
} from './planContextResolution'
import { projectPlanningPeriodAttention } from './planningPeriodAttention'
import { hydrateUnitWorkspace } from './unitWorkspace'
import { hydratePlanningWorkspace } from './workspace'
import type { ISODate } from '../calendar/types'
import type { SectionLessonDateOverride } from './sectionSchedule'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const calendar = hydrateSchoolCalendar({
  id: 'calendar-move-shift',
  schoolYearLabel: '2026–27',
  firstDay: '2026-09-01',
  lastDay: '2027-05-28',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [{ date: '2026-09-19', kind: 'no-school', label: 'No school', confidence: 'confirmed' }],
  quarters: [],
  semesters: [],
})
const course = createCourse({ id: 'course-apah', title: 'AP Art History' })
const p1 = createSection({ id: 'section-p1', courseId: course.id, calendarId: calendar.id, name: 'Period 1' })
const p4 = createSection({ id: 'section-p4', courseId: course.id, calendarId: calendar.id, name: 'Period 4' })
const planning = hydratePlanningWorkspace({ calendarId: calendar.id, courses: [course], sections: [p1, p4] })
const units = hydrateUnitWorkspace({
  calendarId: calendar.id,
  units: [{ id: 'unit-1', calendarId: calendar.id, courseId: course.id, title: 'Power & Place', placement: { startDate: '2026-09-14', endDate: '2026-09-25' } }],
}, calendar, planning)
const unit = units.units[0]
const threshold = createLesson({ id: 'lesson-threshold', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Temple threshold', sequence: 5, plannedDate: '2026-09-14' })
const patron = createLesson({ id: 'lesson-patron', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Patron and audience', sequence: 6, plannedDate: '2026-09-15' })
const fixed = createLesson({ id: 'lesson-fixed', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Fixed assessment', sequence: 7, plannedDate: '2026-09-18', datePolicy: 'fixed' })
const deliveryP1 = updateLessonDeliveryState(createLessonDeliveryState({ lesson: patron, section: p1 }), patron, p1, { status: 'completed', taughtDate: '2026-09-15' })
const deliveryP4 = updateLessonDeliveryState(createLessonDeliveryState({ lesson: threshold, section: p4 }), threshold, p4, { status: 'in-progress', taughtDate: '2026-09-14', resumeNote: 'Stopped after threshold.' })
const lessons = hydrateLessonWorkspace({
  calendarId: calendar.id,
  lessons: [threshold, patron, fixed],
  deliveryStates: [deliveryP1, deliveryP4],
}, calendar, planning, units)
const overrides: SectionLessonDateOverride[] = [{ sectionId: p4.id, lessonId: threshold.id, plannedDate: '2026-09-14' as ISODate }]
const authority: PlanContextAuthority = { calendar, planning, units, lessons, overrides }
const continuity = projectDayContinuity({ date: '2026-09-15', planning, units, lessons, overrides })

// 1 — Section-behind uses delivery/sequence truth, not date-only drift.
const attention = projectPlanningPeriodAttention({ date: '2026-09-15', planning, units, lessons, captures: null, overrides, continuity })
const behind = attention.buckets['needs-attention'].find((item) => item.kind === 'section-behind')
assert(behind?.sectionName === 'Period 4', 'Section-behind must flag delivery lag vs course plan.')
assert(behind?.target.view === 'Week' && behind?.target.focus === 'class', 'Section-behind deep links to Week Class context only.')

// 2 — Move preview is read-only.
const beforeLessons = JSON.stringify(lessons.lessons)
const preview = createLessonMovePreview({ calendar, units, lessons, overrides, planning, lessonId: patron.id, plannedDate: '2026-09-17' })
assert(preview.fromDate === '2026-09-15' && preview.toDate === '2026-09-17' && preview.mutationApplied === false, 'Move preview must expose from/to without applying.')
assert(JSON.stringify(lessons.lessons) === beforeLessons, 'Move preview must not mutate Lesson workspace.')

// 3 — No-school dates block Move with surfaced reason.
const noSchool = createLessonMovePreview({ calendar, units, lessons, overrides, planning, lessonId: patron.id, plannedDate: '2026-09-19' })
assert(noSchool.blockedReason?.includes('instructional') || noSchool.blockedReason?.includes('No school'), 'No-school days must block Move.')

// 4 — Fixed Lessons still preview Move consequences without silent apply.
const fixedPreview = createLessonMovePreview({ calendar, units, lessons, overrides, planning, lessonId: fixed.id, plannedDate: '2026-09-17' })
assert(fixedPreview.datePolicy === 'fixed' && !fixedPreview.blockedReason, 'Fixed Lessons may move when validators allow; policy stays visible.')

// 5 — Section override visibility in Move preview.
const thresholdPreview = createLessonMovePreview({ calendar, units, lessons, overrides, planning, lessonId: threshold.id, plannedDate: '2026-09-16' })
assert(thresholdPreview.sectionOverridesOnLesson.some((row) => row.sectionId === p4.id), 'Move preview must surface existing Section placements on the Lesson.')

// 6 — Day Lesson Focus move follows the Lesson to its new date.
const lessonFocus = createPlanNavigationContext({
  calendarId: calendar.id, view: 'Day', anchorDate: '2026-09-15', focus: 'lesson',
  courseId: course.id, sectionId: p1.id, unitId: unit.id, lessonId: patron.id,
})
const afterLessonMove = resolvePlanContext(
  contextAfterSharedLessonMove(lessonFocus, { lessonId: patron.id, fromDate: '2026-09-15', toDate: '2026-09-17' }),
  authority,
)
assert(afterLessonMove.view === 'Day' && afterLessonMove.focus === 'lesson' && afterLessonMove.anchorDate === '2026-09-17' && afterLessonMove.lessonId === patron.id, 'Lesson Focus move must follow temporal anchor to destination.')

// 7 — Stale Lesson focus drops when the Lesson leaves the anchored Day without explicit follow.
const classOnOldDate = createPlanNavigationContext({
  calendarId: calendar.id, view: 'Day', anchorDate: '2026-09-15', focus: 'class',
  courseId: course.id, sectionId: p1.id, lessonId: patron.id,
})
const dropped = resolvePlanContext(
  contextAfterSharedLessonMove(classOnOldDate, { lessonId: patron.id, fromDate: '2026-09-15', toDate: '2026-09-17' }),
  authority,
)
assert(dropped.focus === 'class' && !dropped.lessonId && dropped.anchorDate === '2026-09-15', 'When Lesson moves away, stale Lesson focus must drop while Class/date stay valid.')

// 8 — Week Class context survives shared Move.
const weekClass = createPlanNavigationContext({
  calendarId: calendar.id, view: 'Week', anchorDate: '2026-09-15', focus: 'class',
  courseId: course.id, sectionId: p4.id, unitId: unit.id, lessonId: threshold.id,
})
const afterWeekMove = resolvePlanContext(
  contextAfterSharedLessonMove(weekClass, { lessonId: patron.id, fromDate: '2026-09-15', toDate: '2026-09-17' }),
  authority,
)
assert(afterWeekMove.view === 'Week' && afterWeekMove.sectionId === p4.id && afterWeekMove.focus === 'class' && !afterWeekMove.lessonId, 'Week Class context must persist after Move without Shift math.')

// 9 — Month keeps Course/Section after Move.
const monthClass = createPlanNavigationContext({
  calendarId: calendar.id, view: 'Month', anchorDate: '2026-09-16', focus: 'class',
  courseId: course.id, sectionId: p1.id, lessonId: patron.id,
})
const afterMonthMove = resolvePlanContext(
  contextAfterSharedLessonMove(monthClass, { lessonId: patron.id, fromDate: '2026-09-15', toDate: '2026-09-17' }),
  authority,
)
assert(afterMonthMove.view === 'Month' && afterMonthMove.sectionId === p1.id && !afterMonthMove.lessonId, 'Month move must keep Course/Section and drop stale Lesson.')

// 10 — Recovery Shift apply keeps Week Class on the same Section.
const afterShift = resolvePlanContext(contextAfterRecoveryShift(weekClass, { sectionId: p4.id }), authority)
assert(afterShift.view === 'Week' && afterShift.sectionId === p4.id && afterShift.focus === 'class', 'Recovery Shift navigation must preserve Week Class context.')

// 11 — P5 attention follow does not perform Shift (navigation only).
const day = createPlanNavigationContext({ calendarId: calendar.id, view: 'Day', anchorDate: '2026-09-15', focus: 'class', teachingBlockId: 'block-p5' })
const stopped = attention.buckets['needs-attention'].find((item) => item.kind === 'stopped-lesson')
assert(stopped, 'Fixture needs stopped-lesson attention item.')
const followStopped = followPlanningAttentionTarget(day, stopped.target, { id: 'section-p4', courseId: course.id, sectionId: p4.id })
assert(followStopped.view === 'Day' && followStopped.focus === 'lesson', 'Attention items navigate; they do not encode Shift operations.')

// 12 — Capture signal remains YELLOW / out of attention buckets.
const ids = [...attention.buckets.now, ...attention.buckets['needs-attention'], ...attention.buckets['next-planned']].map((item) => item.id)
assert(!ids.some((id) => id.startsWith('capture:')), 'Capture→Unit remains out of P5 attention until canonical.')

// 13 — Shift is distinct from Move in preview source (Section override listed, shared date changes separately).
assert(threshold.plannedDate === '2026-09-14' && overrides[0]?.plannedDate === '2026-09-14', 'Shift truth stays in Section overrides; Move preview references them without applying Shift.')

// 14 — Invalid Move outside Unit span is blocked.
const outside = createLessonMovePreview({ calendar, units, lessons, overrides, planning, lessonId: patron.id, plannedDate: '2026-10-01' })
assert(Boolean(outside.blockedReason?.includes('Unit') || outside.blockedReason?.includes('inside')), 'Move must fail closed outside Unit placement.')

// 15 — Planning period return law unchanged: follow then restore block.
const restored = restorePlanningPeriodBlock(followStopped, { id: 'block-p5', courseId: null, sectionId: null })
assert(restored.teachingBlockId === 'block-p5' && restored.anchorDate === '2026-09-15', 'Session-only Planning return block restore stays independent of Move/Shift.')

console.log('Plan move shift contract passed')
