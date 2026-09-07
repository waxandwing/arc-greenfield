import { createCourse, createSection, validateCourse, validateSection, validateSectionCourse, type Course, type Section } from './courses'

export type PlanningWorkspace = {
  calendarId: string
  courses: Course[]
  sections: Section[]
}

export type PlanningWorkspaceInput = {
  calendarId: string
  courses: Course[]
  sections: Section[]
}

export function hydratePlanningWorkspace(input: PlanningWorkspaceInput): PlanningWorkspace {
  const normalized: PlanningWorkspace = {
    calendarId: input.calendarId.trim(),
    courses: input.courses.map((course) => createCourse(course)),
    sections: input.sections.map((section) => createSection(section)),
  }

  const errors = validatePlanningWorkspace(normalized)
  if (errors.length > 0) throw new Error(`Cannot use class setup. ${errors.join(' ')}`)
  return normalized
}

export function validatePlanningWorkspace(workspace: PlanningWorkspace): string[] {
  const errors: string[] = []
  if (!workspace.calendarId.trim()) errors.push('School calendar ID is required.')

  const courseIds = new Set<string>()
  for (const course of workspace.courses) {
    errors.push(...validateCourse(course))
    if (courseIds.has(course.id)) errors.push(`Duplicate Course ID: ${course.id}.`)
    courseIds.add(course.id)
  }

  const sectionIds = new Set<string>()
  for (const section of workspace.sections) {
    errors.push(...validateSection(section))
    if (sectionIds.has(section.id)) errors.push(`Duplicate Section ID: ${section.id}.`)
    sectionIds.add(section.id)

    if (section.calendarId !== workspace.calendarId) {
      errors.push(`${section.name || section.id} belongs to a different school calendar.`)
    }

    const course = workspace.courses.find((candidate) => candidate.id === section.courseId)
    if (!course) {
      errors.push(`${section.name || section.id} references a Course that does not exist.`)
    } else {
      errors.push(...validateSectionCourse(section, course))
    }
  }

  return unique(errors)
}

export function removeCourseFromWorkspace(workspace: PlanningWorkspace, courseId: string): PlanningWorkspace {
  return {
    ...workspace,
    courses: workspace.courses.filter((course) => course.id !== courseId),
    sections: workspace.sections.filter((section) => section.courseId !== courseId),
  }
}

export function sectionsForWorkspaceCourse(workspace: PlanningWorkspace, courseId: string): Section[] {
  return workspace.sections.filter((section) => section.courseId === courseId)
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}
