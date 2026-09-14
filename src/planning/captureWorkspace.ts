import type { ISODate } from '../calendar/types'
import type { LessonWorkspace } from './lessonWorkspace'
import { createLesson } from './lessons'
import type { UnitWorkspace } from './unitWorkspace'

export type CaptureAnchorInput = {
  anchorDate?: ISODate | null
  courseId?: string
  sectionId?: string
  unitId?: string
  lessonId?: string
  sourceView?: string
}

export type PlanningCapture = {
  id: string
  calendarId: string
  text: string
  createdAt: string
  anchorDate?: ISODate
  courseId?: string
  sectionId?: string
  unitId?: string
  lessonId?: string
  sourceView?: string
}

export type CaptureWorkspace = {
  calendarId: string
  captures: PlanningCapture[]
}

export function createPlanningCapture(
  calendarId: string,
  text: string,
  now = new Date(),
  anchor: CaptureAnchorInput = {},
): PlanningCapture {
  const clean = text.trim()
  if (!calendarId.trim()) throw new Error('A Capture needs a school calendar.')
  if (!clean) throw new Error('Write something before saving this Capture.')
  const token = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const capture: PlanningCapture = { id: `capture-${token}`, calendarId, text: clean, createdAt: now.toISOString() }
  if (anchor.anchorDate) capture.anchorDate = anchor.anchorDate
  if (anchor.courseId?.trim()) capture.courseId = anchor.courseId.trim()
  if (anchor.sectionId?.trim()) capture.sectionId = anchor.sectionId.trim()
  if (anchor.unitId?.trim()) capture.unitId = anchor.unitId.trim()
  if (anchor.lessonId?.trim()) capture.lessonId = anchor.lessonId.trim()
  if (anchor.sourceView?.trim()) capture.sourceView = anchor.sourceView.trim()
  return capture
}

export function validateCaptureWorkspace(workspace: CaptureWorkspace): string[] {
  const errors: string[] = []
  if (!workspace.calendarId.trim()) errors.push('Capture workspace calendar ID is required.')
  const ids = new Set<string>()
  for (const capture of workspace.captures) {
    if (!capture.id.trim()) errors.push('Capture ID is required.')
    if (ids.has(capture.id)) errors.push(`Duplicate Capture ID: ${capture.id}.`)
    ids.add(capture.id)
    if (capture.calendarId !== workspace.calendarId) errors.push(`${capture.text || capture.id} belongs to a different calendar.`)
    if (!capture.text.trim()) errors.push('Capture text is required.')
    if (Number.isNaN(Date.parse(capture.createdAt))) errors.push(`${capture.text || capture.id} has an invalid creation time.`)
  }
  return [...new Set(errors)]
}

export function promoteCaptureToLesson(input: {
  capture: PlanningCapture
  captures: CaptureWorkspace
  lessons: LessonWorkspace
  units: UnitWorkspace
  unitId: string
  plannedDate?: ISODate | null
}): { captures: CaptureWorkspace; lessons: LessonWorkspace } {
  const unit = input.units.units.find((candidate) => candidate.id === input.unitId)
  if (!unit) throw new Error('Choose a Unit before placing this Capture.')
  if (input.capture.calendarId !== input.captures.calendarId || input.capture.calendarId !== input.lessons.calendarId) {
    throw new Error('Capture and Lesson workspaces belong to different calendars.')
  }
  if (!input.captures.captures.some((candidate) => candidate.id === input.capture.id)) {
    throw new Error('That Capture is no longer in Workspace.')
  }
  if (input.lessons.lessons.some((lesson) => lesson.id === input.capture.id)) {
    throw new Error('That Capture identity is already used by a Lesson.')
  }
  const siblings = input.lessons.lessons.filter((lesson) => lesson.unitId === unit.id)
  const lesson = createLesson({
    id: input.capture.id,
    calendarId: input.capture.calendarId,
    courseId: unit.courseId,
    unitId: unit.id,
    title: input.capture.text,
    sequence: Math.max(0, ...siblings.map((candidate) => candidate.sequence)) + 1,
    plannedDate: input.plannedDate ?? null,
  })
  return {
    captures: { ...input.captures, captures: input.captures.captures.filter((candidate) => candidate.id !== input.capture.id) },
    lessons: { ...input.lessons, lessons: [...input.lessons.lessons, lesson] },
  }
}
