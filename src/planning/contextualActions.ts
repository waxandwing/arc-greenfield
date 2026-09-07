import { createLesson, lessonsForUnit } from './lessons'
import type { LessonWorkspace } from './lessonWorkspace'
import { createPlanningNote, type PlanningNote, type PlanningNotePlacement } from './notes'
import { createUnit } from './units'
import type { UnitWorkspace } from './unitWorkspace'
import type { PlanningWorkspace } from './workspace'
import type { ISODate } from '../calendar/types'

function newId(prefix: string): string {
  const token = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-${token}`
}

export function copyUnitForLater(workspace: UnitWorkspace, unitId: string): UnitWorkspace {
  const source = workspace.units.find((unit) => unit.id === unitId)
  if (!source) throw new Error(`Unit does not exist: ${unitId}.`)
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
  return note
}
