import { createCourse, createSection, validateCourse, validateSection, validateSectionCourse, type Course, type Section } from './courses'

export type DayNoteLane = 'notes' | 'after-school'

export type DayNote = {
  id: string
  date: string
  text: string
  lane: DayNoteLane
}

export type PlanningWorkspace = {
  calendarId: string
  courses: Course[]
  sections: Section[]
  dayNotes?: DayNote[]
}

export type PlanningWorkspaceInput = {
  calendarId: string
  courses: Course[]
  sections: Section[]
  dayNotes?: DayNote[]
}

export function hydratePlanningWorkspace(input: PlanningWorkspaceInput): PlanningWorkspace {
  const normalized: PlanningWorkspace = {
    calendarId: input.calendarId.trim(),
    courses: input.courses.map((course) => createCourse(course)),
    sections: input.sections.map((section) => createSection(section)),
    dayNotes: (input.dayNotes ?? []).map((note) => ({
      id: note.id.trim(),
      date: note.date.trim(),
      text: note.text.trim(),
      lane: note.lane,
    })),
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

  const noteIds = new Set<string>()
  for (const note of workspace.dayNotes ?? []) {
    if (!note.id) errors.push('Day note ID is required.')
    if (noteIds.has(note.id)) errors.push(`Duplicate Day note ID: ${note.id}.`)
    noteIds.add(note.id)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(note.date)) errors.push(`Day note ${note.id || '(missing ID)'} needs a YYYY-MM-DD date.`)
    if (!note.text) errors.push(`Day note ${note.id || '(missing ID)'} cannot be blank.`)
    if (note.lane !== 'notes' && note.lane !== 'after-school') errors.push(`Day note ${note.id || '(missing ID)'} has an unsupported lane.`)
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

export function sectionsForWorkspaceCourse(workspace: Pick<PlanningWorkspace, 'calendarId' | 'courses' | 'sections'>, courseId: string): Section[] {
  return workspace.sections.filter((section) => section.courseId === courseId)
}

export function notesForWorkspaceDate(workspace: PlanningWorkspace, date: string): DayNote[] {
  return (workspace.dayNotes ?? []).filter((note) => note.date === date)
}

export function upsertDayNote(workspace: PlanningWorkspace, note: DayNote): PlanningWorkspace {
  const current = workspace.dayNotes ?? []
  const dayNotes = current.some((item) => item.id === note.id)
    ? current.map((item) => item.id === note.id ? { ...note } : item)
    : [...current, { ...note }]
  const next = { ...workspace, dayNotes }
  const errors = validatePlanningWorkspace(next)
  if (errors.length > 0) throw new Error(`Cannot save Day note. ${errors.join(' ')}`)
  return next
}

export function removeDayNote(workspace: PlanningWorkspace, noteId: string): PlanningWorkspace {
  return { ...workspace, dayNotes: (workspace.dayNotes ?? []).filter((note) => note.id !== noteId) }
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}
