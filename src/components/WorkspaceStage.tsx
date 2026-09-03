import { CalendarProjectionView } from './CalendarProjectionView'
import { CalendarSetup } from './CalendarSetup'
import { ClassSetup } from './ClassSetup'
import { LessonSetup } from './LessonSetup'
import { RecoveryReview } from './RecoveryReview'
import { TermBoundarySetup } from './TermBoundarySetup'
import { UnitSetup } from './UnitSetup'
import type { CalendarHydrationInput, ISODate, SchoolCalendar } from '../calendar'
import type { CalendarView } from '../navigation/calendarViews'
import type { WorkspaceMode } from '../app/useWorkspaceMode'
import type {
  LessonWorkspace,
  LessonWorkspaceInput,
  PlanningWorkspace,
  PlanningWorkspaceInput,
  ShiftOperation,
  ShiftPersistenceInput,
  UnitWorkspace,
  UnitWorkspaceInput,
} from '../planning'

type WorkspaceStageProps = {
  mode: WorkspaceMode
  activeView: CalendarView
  calendar: SchoolCalendar | null
  calendarInput: CalendarHydrationInput | null
  anchorDate: ISODate | null
  planningWorkspace: PlanningWorkspace | null
  planningInput: PlanningWorkspaceInput | null
  unitWorkspace: UnitWorkspace | null
  unitInput: UnitWorkspaceInput | null
  lessonWorkspace: LessonWorkspace | null
  lessonInput: LessonWorkspaceInput | null
  shiftState: ShiftPersistenceInput | null
  protectedCourseIds: Set<string>
  protectedUnitIds: Set<string>
  protectedSectionIds: Set<string>
  onUseCalendar: (calendar: SchoolCalendar, input: CalendarHydrationInput) => void
  onUseTerms: (input: CalendarHydrationInput) => void
  onUseClasses: (input: PlanningWorkspaceInput, workspace: PlanningWorkspace) => void
  onUseUnits: (input: UnitWorkspaceInput, workspace: UnitWorkspace) => void
  onUseLessons: (input: LessonWorkspaceInput, workspace: LessonWorkspace) => void
  onApplyRecoveryShift: (operation: ShiftOperation) => string | null
  onCloseMode: () => void
}

export function WorkspaceStage(props: WorkspaceStageProps) {
  const {
    mode,
    activeView,
    calendar,
    calendarInput,
    anchorDate,
    planningWorkspace,
    planningInput,
    unitWorkspace,
    unitInput,
    lessonWorkspace,
    lessonInput,
    shiftState,
    protectedCourseIds,
    protectedUnitIds,
    protectedSectionIds,
    onUseCalendar,
    onUseTerms,
    onUseClasses,
    onUseUnits,
    onUseLessons,
    onApplyRecoveryShift,
    onCloseMode,
  } = props

  const needsCalendarSetup = !calendar || !anchorDate || mode === 'calendar-setup'

  if (needsCalendarSetup) {
    return (
      <CalendarSetup
        initialValue={calendarInput}
        onSave={onUseCalendar}
        onCancel={calendar ? onCloseMode : undefined}
      />
    )
  }

  if (mode === 'terms' && calendarInput) {
    return <TermBoundarySetup input={calendarInput} onSave={onUseTerms} onCancel={onCloseMode} />
  }

  if (mode === 'classes') {
    return (
      <ClassSetup
        calendarId={calendar.id}
        initialValue={planningInput}
        protectedCourseIds={protectedCourseIds}
        protectedSectionIds={protectedSectionIds}
        onSave={onUseClasses}
        onCancel={onCloseMode}
      />
    )
  }

  if (mode === 'units' && planningWorkspace) {
    return (
      <UnitSetup
        calendar={calendar}
        planning={planningWorkspace}
        initialValue={unitInput}
        protectedUnitIds={protectedUnitIds}
        onSave={onUseUnits}
        onCancel={onCloseMode}
      />
    )
  }

  if (mode === 'lessons' && planningWorkspace && unitWorkspace) {
    return (
      <LessonSetup
        calendar={calendar}
        planning={planningWorkspace}
        units={unitWorkspace}
        initialValue={lessonInput}
        onSave={onUseLessons}
        onCancel={onCloseMode}
      />
    )
  }

  if (mode === 'recovery' && planningWorkspace && unitWorkspace && lessonWorkspace) {
    return (
      <RecoveryReview
        calendar={calendar}
        planning={planningWorkspace}
        units={unitWorkspace}
        lessons={lessonWorkspace}
        overrides={shiftState?.overrides ?? []}
        onApply={onApplyRecoveryShift}
        onClose={onCloseMode}
      />
    )
  }

  const planningContext = planningWorkspace
    ? {
        planning: planningWorkspace,
        units: unitWorkspace ?? emptyUnitProjection(calendar.id),
        lessons: lessonWorkspace ?? emptyLessonProjection(calendar.id),
        shiftState: lessonWorkspace ? shiftState : null,
      }
    : null

  return (
    <CalendarProjectionView
      view={activeView}
      calendar={calendar}
      anchorDate={anchorDate}
      planningContext={planningContext}
    />
  )
}

function emptyUnitProjection(calendarId: string): UnitWorkspace {
  return { calendarId, units: [] }
}

function emptyLessonProjection(calendarId: string): LessonWorkspace {
  return { calendarId, lessons: [], deliveryStates: [] }
}
