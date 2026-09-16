import { CalendarProjectionView } from './CalendarProjectionView'
import { CalendarSetup } from './CalendarSetup'
import { ClassSetup } from './ClassSetup'
import { LessonSetup } from './LessonSetup'
import { RecoveryReview } from './RecoveryReview'
import { TermBoundarySetup } from './TermBoundarySetup'
import { UnitSetup } from './UnitSetup'
import { TeachingDaySetup } from './TeachingDaySetup'
import { CurriculumImport } from './CurriculumImport'
import { PlanLessonMovePanel } from './PlanLessonMovePanel'
import { PlanPlaceLessonPanel } from './PlanPlaceLessonPanel'
import type { LessonMovePreview } from '../planning'
import type { PlanPlaceLessonIntent, LessonCreateSeed } from '../planning/planPlaceLesson'
import type { CalendarHydrationInput, ISODate, OfficialSourceCandidate, PlanNavigationContext, SchoolCalendar } from '../calendar'
import type { CalendarView } from '../navigation/calendarViews'
import type { WorkspaceMode } from '../app/useWorkspaceMode'
import type {
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
  onSchoolIdentitySelected?: (candidate: OfficialSourceCandidate) => void
  loadedSchoolNcesId?: string | null
  onUseTerms: (input: CalendarHydrationInput) => void
  onUseClasses: (input: PlanningWorkspaceInput, workspace: PlanningWorkspace) => void
  onUseUnits: (input: UnitWorkspaceInput, workspace: UnitWorkspace) => void
  onUseLessons: (input: LessonWorkspaceInput, workspace: LessonWorkspace, shiftState: ShiftPersistenceInput) => void
  onUseCurriculumImport: (proposal: CurriculumImportProposal, courseMatches: Record<string, string>, decisions: Record<string, ReimportDecision>) => CurriculumImportReceipt | string
  onApplyRecoveryShift: (operation: ShiftOperation) => string | null
  onStartClass: (sectionId: string, lessonId: string, liveDate?: import('../calendar').ISODate) => void
  onSelectDate: (date: ISODate, view: CalendarView) => void
  onSelectYearUnit?: (input: { date: ISODate; courseId: string; unitId: string }) => void
  onSelectTeachingBlock?: (block: TeachingDayRailItem) => void
  onSelectLesson?: (lesson: { lessonId: string; unitId: string; courseId: string; sectionId?: string; date?: ISODate }) => void
  onRetreatPlanFocus?: () => void
  onOpenWorkspace?: () => void
  onFollowPlanningAttention?: (item: import('../planning').PlanningPeriodAttentionItem) => void
  onReturnToPlanningPeriod?: () => void
  planningPeriodReturnPending?: boolean
  captureWorkspace?: import('../planning').CaptureWorkspace | null
  dayNotes?: import('./CalendarDayNotes').CalendarDayNoteHandlers
  showDeskNotes?: boolean
  onSetLessonImportant?: (lessonId: string, important: boolean) => boolean
  onSetCaptureImportant?: (captureId: string, important: boolean) => boolean
  onMoveCaptureToDate?: (captureId: string, anchorDate: ISODate | null) => boolean
  onCloseMode: () => void
  /** Leave setup and reopen Settings (Cancel from setup surfaces). */
  onReturnToSettings: () => void
  onOpenMode: (mode: WorkspaceMode) => void
  planMoveIntent?: { lessonId: string; sectionId: string | null; defaultDestination?: ISODate | null } | null
  onBeginPlanLessonMove?: (input: { lessonId: string; sectionId: string | null; defaultDestination?: ISODate | null }) => void
  onCancelPlanLessonMove?: () => void
  onConfirmPlanLessonMove?: (destination: ISODate, preview: LessonMovePreview) => void
  planPlaceIntent?: PlanPlaceLessonIntent | null
  onBeginPlanPlaceLesson?: (intent: PlanPlaceLessonIntent) => void
  onCancelPlanPlaceLesson?: () => void
  onCreateLessonFromSlot?: (acknowledgedOffDay: boolean) => void
  onPlaceUnscheduledFromSlot?: (lessonId: string) => void
  lessonCreateSeed?: LessonCreateSeed | null
  onConsumeLessonCreateSeed?: () => void
  onOpenRecoveryForSection?: (sectionId: string) => void
  recoveryFocusSectionId?: string | null
  onEditLesson?: (lessonId: string) => void
  focusLessonId?: string | null
  onShowUnscheduledInIdeas?: (lessonId: string) => void
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
    onSchoolIdentitySelected,
    loadedSchoolNcesId = null,
    onUseTerms,
    onUseClasses,
    onUseUnits,
    onUseLessons,
    onUseCurriculumImport,
    onApplyRecoveryShift,
    onStartClass,
    onSelectDate,
    onSelectYearUnit,
    onSelectTeachingBlock,
    onSelectLesson,
    onRetreatPlanFocus,
    onOpenWorkspace,
    onFollowPlanningAttention,
    onReturnToPlanningPeriod,
    planningPeriodReturnPending,
    captureWorkspace,
    dayNotes,
    showDeskNotes = true,
    onSetLessonImportant,
    onMoveCaptureToDate: _moveCaptureToDate,
    onSetCaptureImportant: _setCaptureImportant,
    onCloseMode,
    onReturnToSettings,
    onOpenMode,
    planMoveIntent,
    onBeginPlanLessonMove,
    onCancelPlanLessonMove,
    onConfirmPlanLessonMove,
    planPlaceIntent,
    onBeginPlanPlaceLesson,
    onCancelPlanPlaceLesson,
    onCreateLessonFromSlot,
    onPlaceUnscheduledFromSlot,
    lessonCreateSeed = null,
    onConsumeLessonCreateSeed,
    onOpenRecoveryForSection,
    recoveryFocusSectionId,
    onEditLesson,
    focusLessonId = null,
    onShowUnscheduledInIdeas,
  } = props

  const needsCalendarSetup = !calendar || !anchorDate || mode === 'calendar-setup'

  if (needsCalendarSetup) {
    return (
      <CalendarSetup
        initialValue={calendarInput}
        onSave={onUseCalendar}
        onCancel={calendar ? onReturnToSettings : undefined}
        onSchoolIdentitySelected={onSchoolIdentitySelected}
        loadedSchoolNcesId={loadedSchoolNcesId}
      />
    )
  }

  if (mode === 'terms' && calendarInput) {
    return <TermBoundarySetup input={calendarInput} onSave={onUseTerms} onCancel={onReturnToSettings} />
  }

  if (mode === 'classes') {
    return (
      <ClassSetup
        calendarId={calendar.id}
        initialValue={planningInput}
        protectedCourseIds={protectedCourseIds}
        protectedSectionIds={protectedSectionIds}
        onSave={onUseClasses}
        onCancel={onReturnToSettings}
      />
    )
  }

  if (mode === 'teaching-day' && planningInput) {
    return (
      <TeachingDaySetup
        initialValue={planningInput}
        schoolNcesId={loadedSchoolNcesId ?? undefined}
        calendarProvenance={calendarInput?.provenance}
        onSave={onUseClasses}
        onCancel={onReturnToSettings}
      />
    )
  }

  if (mode === 'import') {
    return <CurriculumImport calendarId={calendar.id} existingCourses={planningWorkspace?.courses ?? []} existingUnits={unitWorkspace?.units ?? []} existingLessons={lessonWorkspace?.lessons ?? []} onCommit={onUseCurriculumImport} onCancel={onReturnToSettings} onReturnToDay={onCloseMode} onOpenCalendar={() => onOpenMode('calendar-setup')} onOpenClasses={() => onOpenMode('classes')} onOpenTeachingDay={() => onOpenMode('teaching-day')} />
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
        onCancel={onReturnToSettings}
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
        focusLessonId={focusLessonId}
        createSeed={lessonCreateSeed}
        onConsumeCreateSeed={onConsumeLessonCreateSeed}
        onSave={onUseLessons}
        onCancel={onReturnToSettings}
        onShowUnscheduledInIdeas={onShowUnscheduledInIdeas}
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
        focusSectionId={recoveryFocusSectionId}
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
    <>
      {planMoveIntent && planningWorkspace && unitWorkspace && lessonWorkspace && shiftState && onCancelPlanLessonMove && onConfirmPlanLessonMove ? (
        <PlanLessonMovePanel
          calendar={calendar}
          planning={planningWorkspace}
          units={unitWorkspace}
          lessons={lessonWorkspace}
          shiftState={shiftState}
          lessonId={planMoveIntent.lessonId}
          sectionId={planMoveIntent.sectionId}
          defaultDestination={planMoveIntent.defaultDestination}
          onConfirm={onConfirmPlanLessonMove}
          onCancel={onCancelPlanLessonMove}
        />
      ) : null}
      {planPlaceIntent && planningWorkspace && onCancelPlanPlaceLesson && onCreateLessonFromSlot && onPlaceUnscheduledFromSlot ? (
        <PlanPlaceLessonPanel
          intent={planPlaceIntent}
          planning={planningWorkspace}
          lessons={lessonWorkspace?.lessons ?? []}
          courseTitle={
            planningWorkspace.courses.find((course) => course.id === planPlaceIntent.courseId)?.title
            ?? 'Course'
          }
          onCreateNew={onCreateLessonFromSlot}
          onPlaceUnscheduled={onPlaceUnscheduledFromSlot}
          onCancel={onCancelPlanPlaceLesson}
        />
      ) : null}
      <CalendarProjectionView
        view={activeView}
        showWeekends={showWeekends}
        calendar={calendar}
        anchorDate={anchorDate}
        planningContext={planningContext}
        planContext={planContext}
        onStartClass={onStartClass}
        onSelectDate={onSelectDate}
        onSelectYearUnit={onSelectYearUnit}
        onSelectTeachingBlock={onSelectTeachingBlock}
        onSelectLesson={onSelectLesson}
        onRetreatPlanFocus={onRetreatPlanFocus}
        onOpenWorkspace={onOpenWorkspace}
        onFollowPlanningAttention={onFollowPlanningAttention}
        onReturnToPlanningPeriod={onReturnToPlanningPeriod}
        planningPeriodReturnPending={planningPeriodReturnPending}
        captureWorkspace={captureWorkspace}
        dayNotes={dayNotes}
        showDeskNotes={showDeskNotes}
        onSetLessonImportant={onSetLessonImportant}
        onBeginPlanLessonMove={onBeginPlanLessonMove}
        onAddLessonToSlot={onBeginPlanPlaceLesson}
        onOpenRecoveryForSection={onOpenRecoveryForSection}
        onMoveCaptureToDate={_moveCaptureToDate}
        onEditLesson={onEditLesson}
      />
    </>
  )
}

function emptyUnitProjection(calendarId: string): UnitWorkspace {
  return { calendarId, units: [] }
}

function emptyLessonProjection(calendarId: string): LessonWorkspace {
  return { calendarId, lessons: [], deliveryStates: [] }
}
