import { createCourse, createSection, sectionsForCourse } from './courses'
import { createUnit, sectionsUsingUnit, validateUnitCourse } from './units'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const course = createCourse({ id: 'course-apah', title: ' AP Art History ' })
assert(course.id === 'course-apah', 'Course identity must remain stable.')
assert(course.title === 'AP Art History', 'Course title must be normalized.')

const period2 = createSection({ id: 'section-p2', courseId: course.id, calendarId: 'calendar-2026-27', name: 'Period 2' })
const period5 = createSection({ id: 'section-p5', courseId: course.id, calendarId: 'calendar-2026-27', name: 'Period 5' })
const otherCourse = createCourse({ id: 'course-2d', title: '2D Art 1' })
const period3 = createSection({ id: 'section-p3', courseId: otherCourse.id, calendarId: 'calendar-2026-27', name: 'Period 3' })

assert(sectionsForCourse([period2, period5, period3], course.id).length === 2, 'A Course must be able to serve multiple teaching Sections without duplicating curriculum identity.')

const unit = createUnit({ id: 'unit-mesopotamia', calendarId: 'calendar-2026-27', courseId: course.id, title: 'Mesopotamia' })
assert(validateUnitCourse(unit, course).length === 0, 'A Unit must belong to its shared Course.')
assert(validateUnitCourse(unit, otherCourse).some((error) => error.includes('different course')), 'A Unit cannot silently move between Course identities.')

const unitSections = sectionsUsingUnit(unit, [period2, period5, period3])
assert(unitSections.map((section) => section.id).join(',') === 'section-p2,section-p5', 'Sections sharing a Course and calendar must share the Unit plan.')
assert(unitSections.every((section) => section.courseId === unit.courseId), 'Section membership must derive from Course ownership, not be stored on the Unit.')

console.log('course and section domain contract passed')
