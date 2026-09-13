import { hydrateSchoolCalendar } from '../calendar/hydration'
import { createPlanNavigationContext } from '../calendar/navigationContext'
import { createCourse, createSection } from './courses'
import { hydrateLessonWorkspace } from './lessonWorkspace'
import { createLesson } from './lessons'
import { focusLesson, focusTeachingBlock, goPlanHome, resolvePlanContext, retreatPlanFocus } from './planContextResolution'
import { hydrateUnitWorkspace } from './unitWorkspace'
import { hydratePlanningWorkspace } from './workspace'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const calendar = hydrateSchoolCalendar({
  id: 'calendar-2026-27',
  schoolYearLabel: '2026–27',
  firstDay: '2026-09-01',
  lastDay: '2027-05-28',
  instructionalWeekdays: [1, 2, 3, 4, 5],
  patternSource: 'manual',
  patternConfidence: 'confirmed',
  exceptions: [],
  quarters: [],
  semesters: [],
})
const course = createCourse({ id: 'course-2d', title: '2D Art 1' })
const section = createSection({ id: 'section-p6', courseId: course.id, calendarId: calendar.id, name: 'Period 6' })
const planning = hydratePlanningWorkspace({
  calendarId: calendar.id,
  courses: [course],
  sections: [section],
  teachingDay: {
    blocks: [
      { id: 'block-p6', label: 'Period 6', type: 'teaching', order: 1, sectionId: section.id, startTime: null, endTime: null },
      { id: 'block-plan', label: 'Planning', type: 'planning', order: 2, sectionId: null, startTime: null, endTime: null },
    ],
  },
})
const units = hydrateUnitWorkspace({
  calendarId: calendar.id,
  units: [{ id: 'unit-2d-1', calendarId: calendar.id, courseId: course.id, title: 'Journal Covers + Collage', placement: { startDate: '2026-09-14', endDate: '2026-10-09' } }],
}, calendar, planning)
const unit = units.units[0]
const lesson = createLesson({ id: 'lesson-collage', calendarId: calendar.id, courseId: course.id, unitId: unit.id, title: 'Cover composition', sequence: 1, plannedDate: '2026-09-16' })
const lessons = hydrateLessonWorkspace({ calendarId: calendar.id, lessons: [lesson], deliveryStates: [] }, calendar, planning, units)
const authority = { calendar, planning, units, lessons, overrides: [] }

const day = createPlanNavigationContext({ calendarId: calendar.id, view: 'Day', anchorDate: '2026-09-16', focus: 'day' })
const classFocus = resolvePlanContext(focusTeachingBlock(day, { id: 'block-p6', courseId: course.id, sectionId: section.id }), authority)
assert(classFocus.focus === 'class' && classFocus.anchorDate === '2026-09-16' && classFocus.sectionId === section.id && classFocus.courseId === course.id, 'Day → Class must preserve date + Section.')

const lessonFocus = resolvePlanContext(focusLesson(classFocus, { lessonId: lesson.id, unitId: unit.id, courseId: course.id }), authority)
assert(lessonFocus.focus === 'lesson' && lessonFocus.courseId === course.id && lessonFocus.sectionId === section.id && lessonFocus.lessonId === lesson.id, 'Class → Lesson must preserve Course + Section + Lesson.')

const backToClass = resolvePlanContext(retreatPlanFocus(lessonFocus), authority)
assert(backToClass.focus === 'class' && backToClass.sectionId === section.id && backToClass.teachingBlockId === 'block-p6' && !backToClass.lessonId, 'Lesson → Back must restore the same Class context.')

const backToDay = resolvePlanContext(retreatPlanFocus(backToClass), authority)
assert(backToDay.focus === 'day' && backToDay.anchorDate === '2026-09-16' && !backToDay.sectionId && !backToDay.teachingBlockId, 'Class → Back must restore the same Day/date.')

const homeFromLesson = resolvePlanContext(goPlanHome(lessonFocus), authority)
assert(homeFromLesson.focus === 'day' && homeFromLesson.view === 'Day' && homeFromLesson.anchorDate === '2026-09-16' && !homeFromLesson.sectionId && !homeFromLesson.lessonId, 'Lesson → Home must land on Teaching Day for the same date, not Class Focus.')
assert(resolvePlanContext(retreatPlanFocus(lessonFocus), authority).focus === 'class', 'Home must stay distinct from Back: Lesson → Back remains Class Focus.')

const homeFromWeek = resolvePlanContext(goPlanHome(createPlanNavigationContext({ calendarId: calendar.id, view: 'Week', anchorDate: '2026-09-16', focus: 'day', courseId: course.id, sectionId: section.id })), authority)
assert(homeFromWeek.view === 'Day' && homeFromWeek.focus === 'day' && homeFromWeek.anchorDate === '2026-09-16' && !homeFromWeek.sectionId, 'Week/Month/Year Home must keep the anchor date and drop to Teaching Day.')

const staleLesson = resolvePlanContext({ ...lessonFocus, lessonId: 'lesson-missing' }, authority)
assert(staleLesson.focus === 'class' && staleLesson.sectionId === section.id && !staleLesson.lessonId, 'A stale Lesson ID must fail safely to Class.')

const staleSection = resolvePlanContext({ ...classFocus, sectionId: 'section-missing', teachingBlockId: 'block-missing' }, authority)
assert(staleSection.focus === 'day' && staleSection.anchorDate === '2026-09-16', 'Stale Section/block IDs must fail safely to Teaching Day.')

const wrongYear = resolvePlanContext(createPlanNavigationContext({ calendarId: calendar.id, view: 'Day', anchorDate: '2028-01-01', focus: 'lesson', lessonId: lesson.id }), authority)
assert(wrongYear.anchorDate === calendar.firstDay && wrongYear.focus === 'day', 'Dates outside the school year must fail closed to a valid Day.')

assert(!JSON.stringify(lessonFocus).includes('timer') && !JSON.stringify(lessonFocus).includes('cleanup'), 'Plan navigation context must not carry ArcTable live controls.')

console.log('Plan context resolution contract passed')
