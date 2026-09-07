import type { ISODate, SchoolCalendar } from '../calendar/types'
import type { Section } from './courses'
import { effectiveLessonDeliveryState, type LessonDeliveryState } from './deliveryState'
import { effectiveLessonDate, removeSectionLessonOverride, setSectionLessonOverride, validateSectionLessonOverride, type SectionLessonDateOverride } from './sectionSchedule'
import { sameDayApprovalCovers, validateSameDayLessonApproval, type SameDayLessonApproval } from './sameDayApproval'
import type { Lesson } from './lessons'
import type { Unit } from './units'

export type ShiftChange = {
  lessonId: string
  fromDate: ISODate | null
  toDate: ISODate
}

export type ShiftOperation = {
  id: string
  sectionId: string
  source: 'recovery'
  changes: ShiftChange[]
}

export type ShiftUndoToken = {
  operationId: string
  sectionId: string
  previousSectionOverrides: SectionLessonDateOverride[]
  appliedSectionOverrides: SectionLessonDateOverride[]
}

export type AppliedShift = {
  operation: ShiftOperation
  overrides: SectionLessonDateOverride[]
  undo: ShiftUndoToken
}

export function createShiftOperation(input: {
  id?: string
  sectionId: string
  changes: ShiftChange[]
}): ShiftOperation {
  return {
    id: input.id ?? createShiftId(),
    sectionId: input.sectionId,
    source: 'recovery',
    changes: input.changes.map((change) => ({ ...change })),
  }
}

export function validateShiftOperation(input: {
  operation: ShiftOperation
  section: Section
  lessons: Lesson[]
  deliveryStates: LessonDeliveryState[]
  units: Unit[]
  calendar: SchoolCalendar
  overrides: SectionLessonDateOverride[]
  sameDayApprovals?: SameDayLessonApproval[]
}): string[] {
  const { operation, section, lessons, deliveryStates, units, calendar, overrides } = input
  const sameDayApprovals = input.sameDayApprovals ?? []
  const errors: string[] = []

  if (!operation.id.trim()) errors.push('Shift operation ID is required.')
  if (operation.sectionId !== section.id) errors.push('Shift operation belongs to a different Section.')
  if (operation.changes.length === 0) errors.push('Shift operation must contain at least one explicit change.')

  for (const approval of sameDayApprovals.filter((candidate) => candidate.sectionId === section.id)) {
    errors.push(...validateSameDayLessonApproval({ approval, calendar, section, lessons }).map((error) => `Same-day approval: ${error}`))
  }

  const changedLessonIds = new Set<string>()
  const prospective = new Map<string, ISODate | null>()
  for (const lesson of lessons.filter((lesson) => lesson.courseId === section.courseId && lesson.calendarId === section.calendarId)) {
    prospective.set(lesson.id, effectiveLessonDate(lesson, section.id, overrides))
  }

  for (const change of operation.changes) {
    if (changedLessonIds.has(change.lessonId)) {
      errors.push(`Shift operation contains duplicate changes for Lesson ${change.lessonId}.`)
      continue
    }
    changedLessonIds.add(change.lessonId)

    if (change.fromDate === change.toDate) {
      errors.push(`Shift change for Lesson ${change.lessonId} does not move the Lesson.`)
      continue
    }

    const lesson = lessons.find((candidate) => candidate.id === change.lessonId)
    if (!lesson) {
      errors.push(`Shift change references a Lesson that does not exist: ${change.lessonId}.`)
      continue
    }
    if (lesson.courseId !== section.courseId || lesson.calendarId !== section.calendarId) {
      errors.push(`${lesson.title} does not belong to this Section's Course and calendar.`)
      continue
    }

    const delivery = effectiveLessonDeliveryState(deliveryStates, lesson, section)
    if (delivery.status === 'completed' || delivery.status === 'skipped') {
      errors.push(`${lesson.title} is already ${delivery.status} for ${section.name} and cannot be moved by recovery Shift.`)
      continue
    }

    const currentDate = effectiveLessonDate(lesson, section.id, overrides)
    if (currentDate !== change.fromDate) {
      errors.push(`${lesson.title} changed since this Shift was previewed. Review the consequences again before applying.`)
      continue
    }
    if (lesson.datePolicy === 'fixed' && change.toDate !== lesson.plannedDate) {
      errors.push(`${lesson.title} is fixed and cannot be moved by Shift.`)
      continue
    }

    const unit = units.find((candidate) => candidate.id === lesson.unitId)
    if (!unit) {
      errors.push(`${lesson.title} references a Unit that does not exist.`)
      continue
    }

    errors.push(...validateSectionLessonOverride({
      override: { sectionId: section.id, lessonId: lesson.id, plannedDate: change.toDate },
      section,
      lesson,
      unit,
      calendar,
    }).map((error) => `${lesson.title}: ${error}`))

    prospective.set(lesson.id, change.toDate)
  }

  if (errors.length === 0) {
    const byDate = new Map<ISODate, Lesson[]>()
    for (const lesson of lessons.filter((candidate) => candidate.courseId === section.courseId && candidate.calendarId === section.calendarId)) {
      const delivery = effectiveLessonDeliveryState(deliveryStates, lesson, section)
      if (delivery.status === 'completed' || delivery.status === 'skipped') continue
      const date = prospective.get(lesson.id) ?? null
      if (!date) continue
      const sameDate = byDate.get(date) ?? []
      sameDate.push(lesson)
      byDate.set(date, sameDate)
    }

    const targetDates = new Set(operation.changes.map((change) => change.toDate))
    for (const [date, sameDate] of byDate) {
      if (sameDate.length <= 1 || !targetDates.has(date)) continue
      const approved = sameDayApprovals.some((approval) => sameDayApprovalCovers(approval, section.id, date, sameDate.map((lesson) => lesson.id)))
      if (!approved) {
        errors.push(`Shift would place multiple Lessons on ${date}: ${sameDate.map((lesson) => lesson.title).join(', ')}. Explicit same-day approval is required before applying.`)
      }
    }
  }

  return [...new Set(errors)]
}

export function applyShiftOperation(input: {
  operation: ShiftOperation
  section: Section
  lessons: Lesson[]
  deliveryStates: LessonDeliveryState[]
  units: Unit[]
  calendar: SchoolCalendar
  overrides: SectionLessonDateOverride[]
  sameDayApprovals?: SameDayLessonApproval[]
}): AppliedShift {
  const errors = validateShiftOperation(input)
  if (errors.length > 0) throw new Error(`Cannot apply Shift. ${errors.join(' ')}`)

  let next = input.overrides.map((override) => ({ ...override }))
  const previousSectionOverrides = input.overrides
    .filter((override) => override.sectionId === input.section.id)
    .map((override) => ({ ...override }))

  for (const change of input.operation.changes) {
    const lesson = input.lessons.find((candidate) => candidate.id === change.lessonId)!
    if (change.toDate === lesson.plannedDate) {
      next = removeSectionLessonOverride(next, input.section.id, lesson.id)
    } else {
      next = setSectionLessonOverride(next, {
        sectionId: input.section.id,
        lessonId: lesson.id,
        plannedDate: change.toDate,
      })
    }
  }

  const appliedSectionOverrides = next
    .filter((override) => override.sectionId === input.section.id)
    .map((override) => ({ ...override }))

  return {
    operation: { ...input.operation, changes: input.operation.changes.map((change) => ({ ...change })) },
    overrides: next.map((override) => ({ ...override })),
    undo: {
      operationId: input.operation.id,
      sectionId: input.section.id,
      previousSectionOverrides,
      appliedSectionOverrides,
    },
  }
}

export function undoShiftOperation(currentOverrides: SectionLessonDateOverride[], token: ShiftUndoToken): SectionLessonDateOverride[] {
  const currentSectionOverrides = currentOverrides.filter((override) => override.sectionId === token.sectionId)
  if (!sameOverrides(currentSectionOverrides, token.appliedSectionOverrides)) {
    throw new Error('Cannot undo Shift because this Section schedule changed after that operation. Review the current schedule instead of overwriting newer work.')
  }

  return [
    ...currentOverrides.filter((override) => override.sectionId !== token.sectionId).map((override) => ({ ...override })),
    ...token.previousSectionOverrides.map((override) => ({ ...override })),
  ]
}

function sameOverrides(left: SectionLessonDateOverride[], right: SectionLessonDateOverride[]): boolean {
  return JSON.stringify(normalizeOverrides(left)) === JSON.stringify(normalizeOverrides(right))
}

function normalizeOverrides(overrides: SectionLessonDateOverride[]): SectionLessonDateOverride[] {
  return overrides
    .map((override) => ({ ...override }))
    .sort((a, b) => a.sectionId.localeCompare(b.sectionId) || a.lessonId.localeCompare(b.lessonId) || a.plannedDate.localeCompare(b.plannedDate))
}

function createShiftId(): string {
  const token = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `shift-${token}`
}
