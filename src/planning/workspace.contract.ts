import { createCourse, createSection } from './courses'
import { hydratePlanningWorkspace, removeCourseFromWorkspace, validatePlanningWorkspace } from './workspace'
import { deserializePlanningWorkspace, serializePlanningWorkspace } from './workspacePersistence'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const course = createCourse({ id: 'course-apah', title: 'AP Art History' })
const period2 = createSection({ id: 'section-p2', courseId: course.id, calendarId: 'calendar-2026-27', name: 'Period 2' })
const period5 = createSection({ id: 'section-p5', courseId: course.id, calendarId: 'calendar-2026-27', name: 'Period 5' })

const workspace = hydratePlanningWorkspace({
  calendarId: 'calendar-2026-27',
  courses: [course],
  sections: [period2, period5],
})
assert(workspace.courses.length === 1, 'Workspace must preserve one shared Course.')
assert(workspace.sections.length === 2, 'Workspace must preserve multiple Sections for one Course.')
assert(validatePlanningWorkspace(workspace).length === 0, 'Valid workspace must pass validation.')

const raw = serializePlanningWorkspace(workspace)
const restored = deserializePlanningWorkspace(raw)
assert(restored?.courses[0]?.id === 'course-apah', 'Course identity must survive persistence round trip.')
assert(restored?.sections[1]?.id === 'section-p5', 'Section identity must survive persistence round trip.')

const missingCourse = {
  ...workspace,
  courses: [],
}
assert(validatePlanningWorkspace(missingCourse).some((error) => error.includes('does not exist')), 'Orphan Sections must be rejected.')

const wrongCalendar = {
  ...workspace,
  sections: [{ ...period2, calendarId: 'calendar-other' }],
}
assert(validatePlanningWorkspace(wrongCalendar).some((error) => error.includes('different school calendar')), 'Sections cannot silently attach to another school calendar.')

const duplicateSection = {
  ...workspace,
  sections: [period2, { ...period2 }],
}
assert(validatePlanningWorkspace(duplicateSection).some((error) => error.includes('Duplicate Section ID')), 'Duplicate Section identities must be rejected.')

const removed = removeCourseFromWorkspace(workspace, course.id)
assert(removed.courses.length === 0, 'Removing a Course must remove the Course.')
assert(removed.sections.length === 0, 'Removing a Course must also remove its dependent Sections rather than leaving orphans.')

assert(deserializePlanningWorkspace('{bad json') === null, 'Malformed workspace persistence must be rejected.')
assert(deserializePlanningWorkspace(JSON.stringify({ schemaVersion: 2, input: workspace })) === null, 'Unknown workspace schema versions must be rejected.')

console.log('planning workspace contract passed')
