import { useEffect, useState } from 'react'
import type { PlanningWeekObjectActions } from '../components/PlanningWeekDayView'
import type { ISODate } from '../calendar'
import {
  copyLessonForLater,
  copyPlanningNote,
  copyUnitForLater,
  createLessonOnWeek,
  createPlanningNoteOnWeek,
  createShiftOperation,
  createUnitOnWeek,
  deleteLesson,
  deletePlanningNote,
  deleteUnit,
  moveLesson,
  moveLessonFromFridge,
  moveLessonToFridge,
  movePlanningNote,
  moveUnit,
  undoFridgeRoundTrip,
  unplaceLessonFromCalendar,
  unplaceUnitFromCalendar,
  validateShiftOperation,
  type FridgeRoundTripReceipt,
  type PlanningNotePlacement,
  type ShiftPersistenceInput,
} from '../planning'
import type { useArcWorkspace } from './useArcWorkspace'

type ArcWorkspace = ReturnType<typeof useArcWorkspace>

type WorkspaceModeName = 'calendar' | 'calendar-setup' | 'terms' | 'classes' | 'units' | 'lessons' | 'recovery'

export function useWeekPlanningActions(
  workspace: ArcWorkspace,
  openMode: (mode: WorkspaceModeName) => void,
) {
  const [contextNotice, setContextNotice] = useState<string | null>(null)
  const [fridgeDate, setFridgeDate] = useState('')
  const [fridgeUndo, setFridgeUndo] = useState<FridgeRoundTripReceipt | null>(null)

  useEffect(() => {
    if (!fridgeDate && workspace.anchorDate) setFridgeDate(workspace.anchorDate)
  }, [fridgeDate, workspace.anchorDate])

  function reportContextError(error: unknown) {
    setContextNotice(error instanceof Error ? error.message : String(error))
  }

  function reportMutationResult(accepted: boolean, successMessage: string) {
    setContextNotice(accepted ? successMessage : null)
  }

  function shiftWithOverrides(overrides: ShiftPersistenceInput['overrides']): ShiftPersistenceInput | null {
    if (!workspace.calendar) return null
    return { calendarId: workspace.calendar.id, overrides, undo: workspace.shiftState?.undo ?? null }
  }

  function moveUnitOnWeek(unitId: string, startDate: ISODate, endDate: ISODate) {
    if (!workspace.calendar || !workspace.unitWorkspace || !workspace.lessonWorkspace) return
    try {
      const next = moveUnit({ calendar: workspace.calendar, units: workspace.unitWorkspace, lessons: workspace.lessonWorkspace, overrides: workspace.shiftState?.overrides ?? [], unitId, placement: { startDate, endDate } })
      reportMutationResult(workspace.useUnits(next, next), 'Unit range updated. Identity, Lessons, and teaching history were preserved.')
    } catch (error) { reportContextError(error) }
  }

  function copyUnit(unitId: string) {
    if (!workspace.unitWorkspace) return
    try {
      const next = copyUnitForLater(workspace.unitWorkspace, unitId)
      reportMutationResult(workspace.useUnits(next, next), 'Unit copied for later with a new identity. Lessons and placement were not duplicated.')
    } catch (error) { reportContextError(error) }
  }

  function unplaceUnit(unitId: string) {
    if (!workspace.calendar || !workspace.unitWorkspace || !workspace.lessonWorkspace) return
    try {
      const next = unplaceUnitFromCalendar({ calendar: workspace.calendar, units: workspace.unitWorkspace, lessons: workspace.lessonWorkspace, overrides: workspace.shiftState?.overrides ?? [], unitId })
      reportMutationResult(workspace.useUnits(next, next), 'Unit unplaced. Its identity and history were preserved.')
    } catch (error) { reportContextError(error) }
  }

  function destroyUnit(unitId: string) {
    if (!workspace.calendar || !workspace.unitWorkspace || !workspace.lessonWorkspace) return
    try {
      const next = deleteUnit({ calendar: workspace.calendar, units: workspace.unitWorkspace, lessons: workspace.lessonWorkspace, overrides: workspace.shiftState?.overrides ?? [], unitId })
      reportMutationResult(workspace.useUnits(next, next), 'Unit deleted after dependency checks passed.')
    } catch (error) { reportContextError(error) }
  }

  function moveLessonOnWeek(lessonId: string, plannedDate: ISODate) {
    if (!workspace.calendar || !workspace.unitWorkspace || !workspace.lessonWorkspace) return
    try {
      const next = moveLesson({ calendar: workspace.calendar, units: workspace.unitWorkspace, lessons: workspace.lessonWorkspace, overrides: workspace.shiftState?.overrides ?? [], lessonId, plannedDate })
      const shift = shiftWithOverrides(workspace.shiftState?.overrides ?? [])
      if (!shift) return
      reportMutationResult(workspace.useLessons(next, next, shift), 'Lesson moved in the shared Course plan. Identity and teaching history were preserved.')
    } catch (error) { reportContextError(error) }
  }

  function previewLessonShift(sectionId: string, lessonId: string, fromDate: ISODate, toDate: ISODate) {
    if (!workspace.calendar || !workspace.planningWorkspace || !workspace.unitWorkspace || !workspace.lessonWorkspace) {
      return { allowed: false, message: 'Arc cannot preview this Shift because the planning context is incomplete.' }
    }
    const section = workspace.planningWorkspace.sections.find((candidate) => candidate.id === sectionId)
    if (!section) return { allowed: false, message: 'Arc cannot preview this Shift because the Section no longer exists.' }
    try {
      const operation = createShiftOperation({ sectionId, changes: [{ lessonId, fromDate, toDate }] })
      const errors = validateShiftOperation({ operation, section, lessons: workspace.lessonWorkspace.lessons, deliveryStates: workspace.lessonWorkspace.deliveryStates, units: workspace.unitWorkspace.units, calendar: workspace.calendar, overrides: workspace.shiftState?.overrides ?? [] })
      if (errors.length > 0) return { allowed: false, message: errors.join(' ') }
      return { allowed: true, message: `Preview: move only ${section.name} from ${fromDate} to ${toDate}. The shared Course plan stays unchanged. Applying creates a reload-safe Undo.` }
    } catch (error) {
      return { allowed: false, message: error instanceof Error ? error.message : String(error) }
    }
  }

  function applyLessonShift(sectionId: string, lessonId: string, fromDate: ISODate, toDate: ISODate) {
    try {
      const operation = createShiftOperation({ sectionId, changes: [{ lessonId, fromDate, toDate }] })
      const error = workspace.applyRecoveryShift(operation)
      if (error) setContextNotice(error)
      else setContextNotice('Section Shift applied. Shared Course plan unchanged; Undo is available.')
    } catch (error) { reportContextError(error) }
  }

  function copyLesson(lessonId: string) {
    if (!workspace.lessonWorkspace) return
    try {
      const next = copyLessonForLater(workspace.lessonWorkspace, lessonId)
      const shift = shiftWithOverrides(workspace.shiftState?.overrides ?? [])
      if (!shift) return
      reportMutationResult(workspace.useLessons(next, next, shift), 'Lesson copied for later with a new identity. Dates and teaching history were not duplicated.')
    } catch (error) { reportContextError(error) }
  }

  function unplaceLesson(lessonId: string) {
    if (!workspace.calendar || !workspace.unitWorkspace || !workspace.lessonWorkspace) return
    try {
      const result = unplaceLessonFromCalendar({ calendar: workspace.calendar, units: workspace.unitWorkspace, lessons: workspace.lessonWorkspace, overrides: workspace.shiftState?.overrides ?? [], lessonId })
      const shift: ShiftPersistenceInput = { calendarId: workspace.calendar.id, overrides: result.overrides, undo: null }
      const message = result.removedOverrides.length > 0 ? 'Lesson unplaced. Section-specific dates were cleared; teaching history was preserved.' : 'Lesson unplaced. Identity and teaching history were preserved.'
      reportMutationResult(workspace.useLessons(result.lessons, result.lessons, shift), message)
    } catch (error) { reportContextError(error) }
  }

  function destroyLesson(lessonId: string) {
    if (!workspace.calendar || !workspace.unitWorkspace || !workspace.lessonWorkspace) return
    try {
      const next = deleteLesson({ calendar: workspace.calendar, units: workspace.unitWorkspace, lessons: workspace.lessonWorkspace, overrides: workspace.shiftState?.overrides ?? [], lessonId })
      const shift = shiftWithOverrides(workspace.shiftState?.overrides ?? [])
      if (!shift) return
      reportMutationResult(workspace.useLessons(next, next, shift), 'Lesson deleted after history and Section-schedule guards passed.')
    } catch (error) { reportContextError(error) }
  }

  function moveNoteOnWeek(noteId: string, date: ISODate, placement: PlanningNotePlacement) {
    if (!workspace.planningWorkspace) return
    try {
      const next = movePlanningNote(workspace.planningWorkspace, noteId, date, placement)
      reportMutationResult(workspace.useClasses(next, next), 'Note moved. Identity, source, and Important state were preserved.')
    } catch (error) { reportContextError(error) }
  }

  function copyNote(noteId: string) {
    if (!workspace.planningWorkspace) return
    try {
      const next = copyPlanningNote(workspace.planningWorkspace, noteId)
      reportMutationResult(workspace.useClasses(next, next), 'Note copied with a new identity. Source and Important state were preserved.')
    } catch (error) { reportContextError(error) }
  }

  function destroyNote(noteId: string) {
    if (!workspace.planningWorkspace) return
    try {
      const next = deletePlanningNote(workspace.planningWorkspace, noteId)
      reportMutationResult(workspace.useClasses(next, next), 'Note deleted.')
    } catch (error) { reportContextError(error) }
  }

  function createUnitFromWeek(courseId: string, title: string, startDate: ISODate, endDate: ISODate): boolean {
    if (!workspace.calendar || !workspace.unitWorkspace) return false
    try {
      const next = createUnitOnWeek({ calendar: workspace.calendar, workspace: workspace.unitWorkspace, courseId, title, startDate, endDate })
      const accepted = workspace.useUnits(next, next)
      reportMutationResult(accepted, 'Unit added from the Week calendar.')
      return accepted
    } catch (error) {
      reportContextError(error)
      return false
    }
  }

  function createLessonFromWeek(unitId: string, title: string, plannedDate: ISODate): boolean {
    if (!workspace.calendar || !workspace.unitWorkspace || !workspace.lessonWorkspace) return false
    try {
      const next = createLessonOnWeek({ calendar: workspace.calendar, units: workspace.unitWorkspace, workspace: workspace.lessonWorkspace, unitId, title, plannedDate })
      const shift = shiftWithOverrides(workspace.shiftState?.overrides ?? [])
      if (!shift) return false
      const accepted = workspace.useLessons(next, next, shift)
      reportMutationResult(accepted, 'Lesson added from the Week calendar.')
      return accepted
    } catch (error) {
      reportContextError(error)
      return false
    }
  }

  function createNoteFromWeek(date: ISODate, text: string, placement: PlanningNotePlacement, important: boolean): boolean {
    if (!workspace.calendar || !workspace.planningWorkspace) return false
    try {
      const next = createPlanningNoteOnWeek({ workspace: workspace.planningWorkspace, calendarId: workspace.calendar.id, date, text, placement, important })
      const message = placement === 'after-school' ? 'After School note added from the Week calendar.' : 'Note added from the Week calendar.'
      const accepted = workspace.useClasses(next, next)
      reportMutationResult(accepted, message)
      return accepted
    } catch (error) {
      reportContextError(error)
      return false
    }
  }

  function sendLessonBackToFridge(lessonId: string) {
    if (!workspace.calendar || !workspace.unitWorkspace || !workspace.lessonWorkspace) return
    try {
      const result = moveLessonToFridge({ calendar: workspace.calendar, units: workspace.unitWorkspace, lessons: workspace.lessonWorkspace, overrides: workspace.shiftState?.overrides ?? [], lessonId })
      const nextShift = shiftWithOverrides(result.overrides)
      if (!nextShift) return
      const accepted = workspace.useLessons(result.lessons, result.lessons, nextShift)
      if (accepted) setFridgeUndo(result.undo)
      else setContextNotice(null)
    } catch (error) { reportContextError(error) }
  }

  function scheduleLessonFromFridge(lessonId: string) {
    if (!workspace.calendar || !workspace.unitWorkspace || !workspace.lessonWorkspace || !fridgeDate) return
    try {
      const result = moveLessonFromFridge({ calendar: workspace.calendar, units: workspace.unitWorkspace, lessons: workspace.lessonWorkspace, overrides: workspace.shiftState?.overrides ?? [], lessonId, plannedDate: fridgeDate as ISODate })
      const nextShift = shiftWithOverrides(result.overrides)
      if (!nextShift) return
      const accepted = workspace.useLessons(result.lessons, result.lessons, nextShift)
      if (accepted) setFridgeUndo(result.undo)
      else setContextNotice(null)
    } catch (error) { reportContextError(error) }
  }

  function undoLastFridgeMove() {
    if (!fridgeUndo) return
    const restored = undoFridgeRoundTrip(fridgeUndo)
    const nextShift = shiftWithOverrides(restored.overrides)
    if (!nextShift) return
    const accepted = workspace.useLessons(restored.lessons, restored.lessons, nextShift)
    if (accepted) setFridgeUndo(null)
    else setContextNotice(null)
  }

  const weekObjectActions: PlanningWeekObjectActions = {
    courses: workspace.planningWorkspace?.courses.map((course) => ({ id: course.id, title: course.title })) ?? [],
    units: workspace.unitWorkspace?.units.flatMap((unit) => unit.placement ? [{ id: unit.id, title: unit.title, courseId: unit.courseId, startDate: unit.placement.startDate, endDate: unit.placement.endDate }] : []) ?? [],
    moveUnit: moveUnitOnWeek,
    fullEditUnit: () => openMode('units'),
    copyUnit,
    unplaceUnit,
    deleteUnit: destroyUnit,
    moveLesson: moveLessonOnWeek,
    previewShift: previewLessonShift,
    applyShift: applyLessonShift,
    fullEditLesson: () => openMode('lessons'),
    copyLesson,
    unplaceLesson,
    deleteLesson: destroyLesson,
    moveNote: moveNoteOnWeek,
    copyNote,
    deleteNote: destroyNote,
    createUnit: createUnitFromWeek,
    createLesson: createLessonFromWeek,
    createNote: createNoteFromWeek,
  }

  return {
    contextNotice,
    fridgeDate,
    fridgeUndo,
    setFridgeDate,
    sendLessonBackToFridge,
    scheduleLessonFromFridge,
    undoLastFridgeMove,
    weekObjectActions,
  }
}
