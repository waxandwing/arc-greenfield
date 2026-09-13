import { CalendarProjectionView } from './CalendarProjectionView'
import { CalendarSetup } from './CalendarSetup'
import { ClassSetup } from './ClassSetup'
import { LessonSetup } from './LessonSetup'
import { RecoveryReview } from './RecoveryReview'
import { TermBoundarySetup } from './TermBoundarySetup'
import { UnitSetup } from './UnitSetup'
import { TeachingDaySetup } from './TeachingDaySetup'
import { CurriculumImport } from './CurriculumImport'
import type { CalendarHydrationInput, ISODate, PlanNavigationContext, SchoolCalendar } from '../calendar'
import type { CalendarView } from '../navigation/calendarViews'
import type { WorkspaceMode } from '../app/useWorkspaceMode'
import type {
  DayContinuityLesson,
  LessonWorkspace,
  LessonWorkspaceInput,
  PlanningWorkspace,
  PlanningWorkspaceInput,
  ShiftOperation,
  ShiftPersistenceInput,
  TeachingDayRailItem,
  UnitWorkspace,
  UnitWorkspaceInput,
  CurriculumImportProposal,
  CurriculumImportReceipt,
  ReimportDecision,
} from '../planning'

type WorkspaceStageProps = {
  mode: WorkspaceMode
  activeView: CalendarView
  showWeekends: boolean
  calendar: SchoolCalendar | null
  calendarInput: CalendarHydrationInput | null
  anchorDate: ISODate | null
  planContext?: PlanNavigationContext | null
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
  onUseLessons: (input: LessonWorkspaceInput, workspace: LessonWorkspace, shiftState: ShiftPersistenceInput) => void
  onUseCurriculumImport: (proposal: CurriculumImportProposal, courseMatches: Record<string, string>, decisions: Record<string, ReimportDecision>) => CurriculumImportReceipt | string
  onApplyRecoveryShift: (operation: ShiftOperation) => string | null
  onStartClass: (sectionId: string, lessonId: string) => void
  onSelectDate: (date: ISODate, view: CalendarView) => void
  onSelectTeachingBlock?: (block: TeachingDayRailItem) => void
  onSelectLesson?: (lesson: DayContinuityLesson) => void
  onRetreatPlanFocus?: () => void
  onOpenWorkspace?: () => void
  onAddNote: (date: ISODate, text: string) => boolean
  onDeleteNote: (noteId: string) => void
  onCloseMode: () => void
  onOpenMode: (mode: WorkspaceMode) => void
}

export function WorkspaceStage(props: WorkspaceStageProps) {
  const {
    mode,
    activeView,
    showWeekends,
    calendar,
    calendarInput,
    anchorDate,
    planContext,
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
    onUseCurriculumImport,
    onApplyRecoveryShift,
    onStartClass,
    onSelectDate,
    onSelectTeachingBlock,
    onSelectLesson,
    onRetreatPlanFocus,
    onOpenWorkspace,
    onAddNote,
    onDeleteNote,
    onCloseMode,
    onOpenMode,
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

  if (mode === 'teaching-day' && planningInput) {
    return <TeachingDaySetup initialValue={planningInput} onSave={onUseClasses} onCancel={onCloseMode} />
  }

  if (mode === 'import') {
    return <CurriculumImport calendarId={calendar.id} existingCourses={planningWorkspace?.courses ?? []} existingUnits={unitWorkspace?.units ?? []} existingLessons={lessonWorkspace?.lessons ?? []} onCommit={onUseCurriculumImport} onCancel={onCloseMode} onOpenCalendar={() => onOpenMode('calendar-setup')} onOpenClasses={() => onOpenMode('classes')} onOpenTeachingDay={() => onOpenMode('teaching-day')} />
  }

  if (mode === 'units' && planningWorkspace) {
    return (
      <UnitSetup
        calendar={calendar}
        planning={planningWorkspace}
        lessons={lessonWorkspace ?? emptyLessonProjection(calendar.id)}
        overrides={shiftState?.overrides ?? []}
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
        shiftState={shiftState}
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
      showWeekends={showWeekends}
      calendar={calendar}
      anchorDate={anchorDate}
      planningContext={planningContext}
      planContext={planContext}
      onStartClass={onStartClass}
      onSelectDate={onSelectDate}
      onSelectTeachingBlock={onSelectTeachingBlock}
      onSelectLesson={onSelectLesson}
      onRetreatPlanFocus={onRetreatPlanFocus}
      onOpenWorkspace={onOpenWorkspace}
      onAddNote={onAddNote}
      onDeleteNote={onDeleteNote}
    />
  )
}

function emptyUnitProjection(calendarId: string): UnitWorkspace {
  return { calendarId, units: [] }
}

function emptyLessonProjection(calendarId: string): LessonWorkspace {
  return { calendarId, lessons: [], deliveryStates: [] }
}
