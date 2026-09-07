import { createLesson, lessonsForUnit, validateLessonAgainstUnit } from './lessons'
import type { LessonWorkspace } from './lessonWorkspace'
import { createPlanningNote, type PlanningNote, type PlanningNotePlacement } from './notes'
import { createUnit, placeUnit } from './units'
import type { UnitWorkspace } from './unitWorkspace'
import type { PlanningWorkspace } from './workspace'
import type { ISODate, SchoolCalendar } from '../calendar/types'

function newId(prefix: string): string {
  const token = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-${token}`
}

function assertCalendarOwner(label: string, workspaceCalendarId: string, calendarId: string) {
  if (workspaceCalendarId !== calendarId) {
    throw new Error(`${label} belongs to a different school calendar.`)
  }
}

export function createUnitOnWeek(input: {
  calendar: SchoolCalendar
  workspace: UnitWorkspace
  courseId: string
  title: string
  startDate: ISODate
  endDate: ISODate
}): UnitWorkspace {
  assertCalendarOwner('Unit workspace', input.workspace.calendarId, input.calendar.id)
  const unit = placeUnit(createUnit({
    id: newId('unit'),
    calendarId: input.calendar.id,
    courseId: input.courseId,
    title: input.title,
  }), input.calendar, { startDate: input.startDate, endDate: input.endDate })
  return { ...input.workspace, units: [...input.workspace.units, unit] }
}

export function createLessonOnWeek(input: {
  calendar: SchoolCalendar
  units: UnitWorkspace
  workspace: LessonWorkspace
  unitId: string
  title: string
  plannedDate: ISODate
}): LessonWorkspace {
  assertCalendarOwner('Unit workspace', input.units.calendarId, input.calendar.id)
  assertCalendarOwner('Lesson workspace', input.workspace.calendarId, input.calendar.id)
  const unit = input.units.units.find((candidate) => candidate.id === input.unitId)
  if (!unit) throw new Error(`Cannot create Lesson. Unit does not exist: ${input.unitId}.`)
  assertCalendarOwner('Unit', unit.calendarId, input.calendar.id)
  const siblings = lessonsForUnit(input.workspace.lessons, unit.id)
  const lesson = createLesson({
    id: newId('lesson'),
    calendarId: input.calendar.id,
    courseId: unit.courseId,
    unitId: unit.id,
    title: input.title,
    sequence: Math.max(0, ...siblings.map((candidate) => candidate.sequence)) + 1,
    plannedDate: input.plannedDate,
    datePolicy: 'flexible',
  })
  const errors = validateLessonAgainstUnit(lesson, unit, input.calendar)
  if (errors.length > 0) throw new Error(`Cannot create Lesson. ${errors.join(' ')}`)
  return { ...input.workspace, lessons: [...input.workspace.lessons, lesson] }
}

export function createPlanningNoteOnWeek(input: {
  workspace: PlanningWorkspace
  calendarId: string
  date: ISODate
  text: string
  placement?: PlanningNotePlacement
  important?: boolean
}): PlanningWorkspace {
  assertCalendarOwner('Planning workspace', input.workspace.calendarId, input.calendarId)
  const note = createPlanningNote({
    id: newId('note'),
    calendarId: input.calendarId,
    date: input.date,
    text: input.text,
    placement: input.placement,
    important: input.important,
  })
  return { ...input.workspace, notes: [...(input.workspace.notes ?? []), note] }
}

export function copyUnitForLater(workspace: UnitWorkspace, unitId: string): UnitWorkspace {
  const source = workspace.units.find((unit) => unit.id === unitId)
  if (!source) throw new Error(`Unit does not exist: ${unitId}.`)
  assertCalendarOwner('Unit', source.calendarId, workspace.calendarId)
  const copy = createUnit({
    id: newId('unit'),
    calendarId: source.calendarId,
    courseId: source.courseId,
    title: `${source.title} copy`,
  })
  return { ...workspace, units: [...workspace.units, copy] }
}

export function copyLessonForLater(workspace: LessonWorkspace, lessonId: string): LessonWorkspace {
  const source = workspace.lessons.find((lesson) => lesson.id === lessonId)
  if (!source) throw new Error(`Lesson does not exist: ${lessonId}.`)
  assertCalendarOwner('Lesson', source.calendarId, workspace.calendarId)
  const siblings = lessonsForUnit(workspace.lessons, source.unitId)
  const copy = createLesson({
    id: newId('lesson'),
    calendarId: source.calendarId,
    courseId: source.courseId,
    unitId: source.unitId,
    title: `${source.title} copy`,
    sequence: Math.max(0, ...siblings.map((lesson) => lesson.sequence)) + 1,
    plannedDate: null,
    datePolicy: 'flexible',
  })
  return { ...workspace, lessons: [...workspace.lessons, copy] }
}

export function copyPlanningNote(workspace: PlanningWorkspace, noteId: string): PlanningWorkspace {
  const source = requireNote(workspace, noteId)
  const copy = createPlanningNote({ ...source, id: newId('note') })
  return { ...workspace, notes: [...(workspace.notes ?? []), copy] }
}

export function movePlanningNote(
  workspace: PlanningWorkspace,
  noteId: string,
  date: ISODate,
  placement?: PlanningNotePlacement,
): PlanningWorkspace {
  const source = requireNote(workspace, noteId)
  const next = createPlanningNote({ ...source, date, placement: placement ?? source.placement })
  return { ...workspace, notes: (workspace.notes ?? []).map((note) => note.id === noteId ? next : note) }
}

export function deletePlanningNote(workspace: PlanningWorkspace, noteId: string): PlanningWorkspace {
  requireNote(workspace, noteId)
  return { ...workspace, notes: (workspace.notes ?? []).filter((note) => note.id !== noteId) }
}

function requireNote(workspace: PlanningWorkspace, noteId: string): PlanningNote {
  const note = (workspace.notes ?? []).find((candidate) => candidate.id === noteId)
  if (!note) throw new Error(`Note does not exist: ${noteId}.`)
  assertCalendarOwner('Note', note.calendarId, workspace.calendarId)
  return note
}
