export type CourseId = string
export type SectionId = string

export type Course = {
  id: CourseId
  title: string
}

export type Section = {
  id: SectionId
  courseId: CourseId
  calendarId: string
  name: string
}

export function createCourseId(): CourseId {
  return createPlanningId('course')
}

export function createSectionId(): SectionId {
  return createPlanningId('section')
}

export function createCourse(input: { id?: CourseId; title: string }): Course {
  const course: Course = {
    id: input.id ?? createCourseId(),
    title: input.title.trim(),
  }
  const errors = validateCourse(course)
  if (errors.length > 0) throw new Error(`Cannot create course. ${errors.join(' ')}`)
  return course
}

export function createSection(input: {
  id?: SectionId
  courseId: CourseId
  calendarId: string
  name: string
}): Section {
  const section: Section = {
    id: input.id ?? createSectionId(),
    courseId: input.courseId,
    calendarId: input.calendarId,
    name: input.name.trim(),
  }
  const errors = validateSection(section)
  if (errors.length > 0) throw new Error(`Cannot create section. ${errors.join(' ')}`)
  return section
}

export function validateCourse(course: Course): string[] {
  const errors: string[] = []
  if (!course.id.trim()) errors.push('Course ID is required.')
  if (!course.title.trim()) errors.push('Course title is required.')
  return errors
}

export function validateSection(section: Section): string[] {
  const errors: string[] = []
  if (!section.id.trim()) errors.push('Section ID is required.')
  if (!section.courseId.trim()) errors.push('Section course ID is required.')
  if (!section.calendarId.trim()) errors.push('Section calendar ID is required.')
  if (!section.name.trim()) errors.push('Section name is required.')
  return errors
}

export function validateSectionCourse(section: Section, course: Course): string[] {
  return section.courseId === course.id ? [] : ['Section belongs to a different course.']
}

export function sectionsForCourse(sections: Section[], courseId: CourseId): Section[] {
  return sections.filter((section) => section.courseId === courseId)
}

function createPlanningId(prefix: 'course' | 'section'): string {
  const token = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-${token}`
}
