import type { ISODate, SchoolCalendar } from '../calendar/types'
import type { Section } from './courses'
import { effectiveLessonDeliveryState, type LessonDeliveryState } from './deliveryState'
import { effectiveLessonDate, removeSectionLessonOverride, setSectionLessonOverride, validateSectionLessonOverride, type SectionLessonDateOverride } from './sectionSchedule'
import { sameDayApprovalCovers, sameDayApprovalKey, validateSameDayLessonApproval, type SameDayLessonApproval } from './sameDayApproval'
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
  sameDayApprovalsToAdd: SameDayLessonApproval[]
  sameDayApprovalKeysToRemove: string[]
}

export type ShiftUndoToken = {
  operationId: string
  sectionId: string
  previousSectionOverrides: SectionLessonDateOverride[]
  appliedSectionOverrides: SectionLessonDateOverride[]
  previousSectionApprovals: SameDayLessonApproval[]
  appliedSectionApprovals: SameDayLessonApproval[]
}

export type AppliedShift = {
  operation: ShiftOperation
  overrides: SectionLessonDateOverride[]
  sameDayApprovals: SameDayLessonApproval[]
  undo: ShiftUndoToken
}

export type UndoneShift = {
  overrides: SectionLessonDateOverride[]
  sameDayApprovals: SameDayLessonApproval[]
}

export function createShiftOperation(input: {
  id?: string
  sectionId: string
  changes: ShiftChange[]
  sameDayApprovalsToAdd?: SameDayLessonApproval[]
  sameDayApprovalKeysToRemove?: string[]
}): ShiftOperation {
  return {
    id: input.id ?? createShiftId(),
    sectionId: input.sectionId,
    source: 'recovery',
    changes: input.changes.map((change) => ({ ...change })),
    sameDayApprovalsToAdd: (input.sameDayApprovalsToAdd ?? []).map(copyApproval),
    sameDayApprovalKeysToRemove: [...(input.sameDayApprovalKeysToRemove ?? [])],
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
  const currentApprovals = (input.sameDayApprovals ?? []).map(copyApproval)
  const errors: string[] = []

  if (!operation.id.trim()) errors.push('Shift operation ID is required.')
  if (operation.sectionId !== section.id) errors.push('Shift operation belongs to a different Section.')
  if (operation.changes.length === 0 && operation.sameDayApprovalsToAdd.length === 0 && operation.sameDayApprovalKeysToRemove.length === 0) {
    errors.push('Shift operation must contain at least one explicit change.')
  }

  const removalKeys = new Set<string>()
  for (const key of operation.sameDayApprovalKeysToRemove) {
    if (!key.trim()) {
      errors.push('Same-day approval removal key is required.')
      continue
    }
    if (removalKeys.has(key)) errors.push(`Shift repeats same-day approval removal ${key}.`)
    removalKeys.add(key)
    if (!currentApprovals.some((approval) => sameDayApprovalKey(approval) === key)) {
      errors.push(`Shift cannot remove same-day approval that is not current: ${key}.`)
    }
  }

  let prospectiveApprovals = currentApprovals.filter((approval) => !removalKeys.has(sameDayApprovalKey(approval)))
  const addedKeys = new Set<string>()
  for (const approval of operation.sameDayApprovalsToAdd) {
    const approvalErrors = validateSameDayLessonApproval({ approval, calendar, section, lessons })
    errors.push(...approvalErrors.map((error) => `Same-day approval: ${error}`))
    const key = sameDayApprovalKey(approval)
    if (addedKeys.has(key)) errors.push(`Shift repeats same-day approval addition ${key}.`)
    addedKeys.add(key)
    if (prospectiveApprovals.some((candidate) => sameDayApprovalKey(candidate) === key)) {
      errors.push(`Same-day approval is already active: ${key}.`)
    } else {
      prospectiveApprovals.push(copyApproval(approval))
    }
  }

  const changedLessonIds = new Set<string>()
  const prospectiveDates = new Map<string, ISODate | null>()
  for (const lesson of lessons.filter((candidate) => candidate.courseId === section.courseId && candidate.calendarId === section.calendarId)) {
    prospectiveDates.set(lesson.id, effectiveLessonDate(lesson, section.id, overrides))
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

    prospectiveDates.set(lesson.id, change.toDate)
  }

  if (errors.length === 0) {
    const byDate = new Map<ISODate, Lesson[]>()
    for (const lesson of lessons.filter((candidate) => candidate.courseId === section.courseId && candidate.calendarId === section.calendarId)) {
      const delivery = effectiveLessonDeliveryState(deliveryStates, lesson, section)
      if (delivery.status === 'completed' || delivery.status === 'skipped') continue
      const date = prospectiveDates.get(lesson.id) ?? null
      if (!date) continue
      const sameDate = byDate.get(date) ?? []
      sameDate.push(lesson)
      byDate.set(date, sameDate)
    }

    const usedApprovalKeys = new Set<string>()
    for (const [date, sameDate] of byDate) {
      if (sameDate.length <= 1) continue
      const approval = prospectiveApprovals.find((candidate) => sameDayApprovalCovers(candidate, section.id, date, sameDate.map((lesson) => lesson.id)))
      if (!approval) {
        errors.push(`Shift would place multiple Lessons on ${date}: ${sameDate.map((lesson) => lesson.title).join(', ')}. Explicit same-day approval is required in this Shift.`)
      } else {
        usedApprovalKeys.add(sameDayApprovalKey(approval))
      }
    }

    for (const approval of prospectiveApprovals.filter((candidate) => candidate.sectionId === section.id)) {
      if (!usedApprovalKeys.has(sameDayApprovalKey(approval))) {
        errors.push(`Same-day approval for ${approval.date} would be dormant after this Shift. Approval must match the resulting live collision exactly.`)
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
  const currentApprovals = (input.sameDayApprovals ?? []).map(copyApproval)
  const errors = validateShiftOperation({ ...input, sameDayApprovals: currentApprovals })
  if (errors.length > 0) throw new Error(`Cannot apply Shift. ${errors.join(' ')}`)

  let nextOverrides = input.overrides.map((override) => ({ ...override }))
  const previousSectionOverrides = input.overrides
    .filter((override) => override.sectionId === input.section.id)
    .map((override) => ({ ...override }))
  const previousSectionApprovals = currentApprovals
    .filter((approval) => approval.sectionId === input.section.id)
    .map(copyApproval)

  for (const change of input.operation.changes) {
    const lesson = input.lessons.find((candidate) => candidate.id === change.lessonId)!
    if (change.toDate === lesson.plannedDate) {
      nextOverrides = removeSectionLessonOverride(nextOverrides, input.section.id, lesson.id)
    } else {
      nextOverrides = setSectionLessonOverride(nextOverrides, {
        sectionId: input.section.id,
        lessonId: lesson.id,
        plannedDate: change.toDate,
      })
    }
  }

  const removalKeys = new Set(input.operation.sameDayApprovalKeysToRemove)
  let nextApprovals = currentApprovals.filter((approval) => !removalKeys.has(sameDayApprovalKey(approval)))
  nextApprovals = [...nextApprovals, ...input.operation.sameDayApprovalsToAdd.map(copyApproval)]

  const appliedSectionOverrides = nextOverrides
    .filter((override) => override.sectionId === input.section.id)
    .map((override) => ({ ...override }))
  const appliedSectionApprovals = nextApprovals
    .filter((approval) => approval.sectionId === input.section.id)
    .map(copyApproval)

  return {
    operation: copyOperation(input.operation),
    overrides: nextOverrides.map((override) => ({ ...override })),
    sameDayApprovals: nextApprovals.map(copyApproval),
    undo: {
      operationId: input.operation.id,
      sectionId: input.section.id,
      previousSectionOverrides,
      appliedSectionOverrides,
      previousSectionApprovals,
      appliedSectionApprovals,
    },
  }
}

export function undoShiftOperation(
  currentOverrides: SectionLessonDateOverride[],
  currentApprovals: SameDayLessonApproval[],
  token: ShiftUndoToken,
): UndoneShift {
  const currentSectionOverrides = currentOverrides.filter((override) => override.sectionId === token.sectionId)
  if (!sameOverrides(currentSectionOverrides, token.appliedSectionOverrides)) {
    throw new Error('Cannot undo Shift because this Section schedule changed after that operation. Review the current schedule instead of overwriting newer work.')
  }
  const currentSectionApprovals = currentApprovals.filter((approval) => approval.sectionId === token.sectionId)
  if (!sameApprovals(currentSectionApprovals, token.appliedSectionApprovals)) {
    throw new Error('Cannot undo Shift because this Section same-day approval state changed after that operation. Review the current schedule instead of overwriting newer work.')
  }

  return {
    overrides: [
      ...currentOverrides.filter((override) => override.sectionId !== token.sectionId).map((override) => ({ ...override })),
      ...token.previousSectionOverrides.map((override) => ({ ...override })),
    ],
    sameDayApprovals: [
      ...currentApprovals.filter((approval) => approval.sectionId !== token.sectionId).map(copyApproval),
      ...token.previousSectionApprovals.map(copyApproval),
    ],
  }
}

function sameOverrides(left: SectionLessonDateOverride[], right: SectionLessonDateOverride[]): boolean {
  return JSON.stringify(normalizeOverrides(left)) === JSON.stringify(normalizeOverrides(right))
}

function sameApprovals(left: SameDayLessonApproval[], right: SameDayLessonApproval[]): boolean {
  return JSON.stringify(normalizeApprovals(left)) === JSON.stringify(normalizeApprovals(right))
}

function normalizeOverrides(overrides: SectionLessonDateOverride[]): SectionLessonDateOverride[] {
  return overrides
    .map((override) => ({ ...override }))
    .sort((a, b) => a.sectionId.localeCompare(b.sectionId) || a.lessonId.localeCompare(b.lessonId) || a.plannedDate.localeCompare(b.plannedDate))
}

function normalizeApprovals(approvals: SameDayLessonApproval[]): SameDayLessonApproval[] {
  return approvals
    .map(copyApproval)
    .sort((a, b) => sameDayApprovalKey(a).localeCompare(sameDayApprovalKey(b)))
}

function copyApproval(approval: SameDayLessonApproval): SameDayLessonApproval {
  return { sectionId: approval.sectionId, date: approval.date, lessonIds: [...approval.lessonIds] }
}

function copyOperation(operation: ShiftOperation): ShiftOperation {
  return {
    ...operation,
    changes: operation.changes.map((change) => ({ ...change })),
    sameDayApprovalsToAdd: operation.sameDayApprovalsToAdd.map(copyApproval),
    sameDayApprovalKeysToRemove: [...operation.sameDayApprovalKeysToRemove],
  }
}

function createShiftId(): string {
  const token = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `shift-${token}`
}
