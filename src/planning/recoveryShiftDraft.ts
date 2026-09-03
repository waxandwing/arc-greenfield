import type { ISODate } from '../calendar'
import type { RecoveryPreview } from './recoveryPreview'
import { createShiftOperation, type ShiftOperation } from './shiftOperation'

export type RecoveryShiftDraft = {
  sectionId: string
  interruptedLessonId: string
  resumeDate: ISODate
  changes: Array<{
    lessonId: string
    fromDate: ISODate | null
    toDate: ISODate | null
  }>
}

export function createRecoveryShiftDraft(preview: RecoveryPreview): RecoveryShiftDraft | null {
  if (preview.blockedReason || !preview.resumeDate) return null
  if (preview.interruptedEffectiveDate === preview.resumeDate && preview.affectedFlexibleLessons.length === 0) return null

  return {
    sectionId: preview.sectionId,
    interruptedLessonId: preview.interruptedLessonId,
    resumeDate: preview.resumeDate,
    changes: [
      ...(preview.interruptedEffectiveDate === preview.resumeDate ? [] : [{
        lessonId: preview.interruptedLessonId,
        fromDate: preview.interruptedEffectiveDate,
        toDate: preview.resumeDate,
      }]),
      ...preview.affectedFlexibleLessons.map((lesson) => ({
        lessonId: lesson.lessonId,
        fromDate: lesson.effectiveDate,
        toDate: null,
      })),
    ],
  }
}

export function finalizeRecoveryShiftDraft(
  draft: RecoveryShiftDraft,
  chosenDates: Record<string, ISODate>,
): ShiftOperation {
  const changes = draft.changes.map((change) => {
    const interrupted = change.lessonId === draft.interruptedLessonId
    const toDate = interrupted ? draft.resumeDate : chosenDates[change.lessonId]

    if (!toDate) throw new Error(`Recovery Shift still needs a destination date for Lesson ${change.lessonId}.`)
    if (!interrupted && toDate <= draft.resumeDate) {
      throw new Error(`Recovery Shift destination for Lesson ${change.lessonId} must be after the class resume date.`)
    }

    return { lessonId: change.lessonId, fromDate: change.fromDate, toDate }
  })

  return createShiftOperation({ sectionId: draft.sectionId, changes })
}
