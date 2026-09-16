import { useEffect, useRef, useState } from 'react'
import { B01Furniture } from './B01Furniture'
import { CalendarStageHeader } from './CalendarStageHeader'
import { PlanStateHeader } from './PlanStateHeader'
import { DeskPlannerHeadRow } from './DeskPlannerHeadRow'
import { SettingsFurnitureContent } from './SettingsFurnitureContent'
import { TaskBarPanel } from './TaskBarPanel'
import { WorkspaceStage } from './WorkspaceStage'
import { useArcWorkspace } from '../app/useArcWorkspace'
import { useTaskBar } from '../app/useTaskBar'
import type { WorkspaceMode } from '../app/useWorkspaceMode'
import { useWorkspaceMode } from '../app/useWorkspaceMode'
import {
  isRetiredSetupWorkspaceMode,
  isSetupWorkspaceMode,
  SETUP_FALLBACK_SECTION,
  type OnboardingSectionId,
  type SetupSectionId,
} from '../app/setupSections'
import { useArcTableSession } from '../app/useArcTableSession'
import { DEFAULT_HOME_VIEW, calendarViewLabel, type CalendarView } from '../navigation/calendarViews'
import {
  loadDeskAwareViewPreferences,
  resolveHomeDeskPlannerView,
  saveDeskAwareViewPreferences,
  type DeskAwareViewPreferences,
} from '../navigation/deskPreferences'
import {
  moveDeskObject,
  type DeskMoveDirection,
  type DeskObjectKind,
} from '../navigation/deskLayout'
import {
  loadWorkspaceLayout,
  resetWorkspaceLayoutToArcDefault,
  saveWorkspaceLayout,
  workspaceLayoutUsesDefault,
  type WorkspaceLayoutState,
} from '../navigation/workspaceLayout'
import {
  addMemberToStack,
  createStackFromMembers,
  removeMemberFromStack,
  reorderStackMember,
  stackForMember,
  unstack,
  type StackWorkspace,
} from '../planning/stacks'
import { loadStackWorkspace, saveStackWorkspace } from '../planning/stackPersistence'
import { recordLastUsedView } from '../navigation/viewPreferences'
import type { TaskPriority } from '../planning/taskBar'
import {
  moveLessonFromFridge,
  moveLessonToFridge,
  applyArcTableTeachingOutcome,
  arcTableLaunchOptions,
  collectArcTableDeskLaunchOptions,
  deskActionToTeacherTool,
  projectArcTableSession,
  projectDayContinuity,
  buildTeachingDayRail,
  setArcTableDeskLaunch,
  type ArcTableDeskAction,
  type ArcTableTeachingOutcome,
  undoFridgeRoundTrip,
  type FridgeRoundTripReceipt,
  type ShiftPersistenceInput,
} from '../planning'
import { projectWeek, type ISODate } from '../calendar'
import { formatKellyDeskWeekSecondary, formatMonth, formatPlanHeaderDate, formatPlanHeaderWeekRange } from './dateLabels'
import { ArcTableStudentSurface, ArcTableTeacherMonitor } from './ArcTableSurfaces'
import { WorkspacePanel } from './WorkspacePanel'
import { ArcOnboarding, resolveOnboardingStage } from './ArcOnboarding'
import { CaptureCoachMark } from './CaptureCoachMark'
import { captureAnchorFromPlan } from './GlobalCaptureAffordance'
import { PlannerShellBar } from './PlannerShellBar'
import { ArcTableDeskFixture } from './ArcTableDeskFixture'
import { DeskPriorityPad } from './DeskPriorityPad'
import { DeskEditToolbar } from './DeskEditToolbar'
import { DeskCalendarPopOut } from './DeskCalendarPopOut'
import { DeskQuickCaptureSticky } from './DeskQuickCaptureSticky'
import {
  DESK_POSTIT_ASSIGN_DATE_EVENT,
  DESK_POSTIT_ASSIGN_PRIORITY_EVENT,
  type DeskPostItAssignDateDetail,
  type DeskPostItAssignPriorityDetail,
} from '../desk/deskPostItEvents'
import { publicAssetUrl } from '../publicAssetUrl'
import { ProgressiveSetupPrompt } from './ProgressiveSetupPrompt'
import { assessSetupCapabilities, loadOnboardingDraft, minimumPlanningSetupEstablished, saveOnboardingDraft, type OnboardingDraft } from '../planning'
import { readDeskPreviewSeededSession, shouldForceDeskShell } from '../demo/deskPreviewGate'
import { buildKellyDeskDemoBundle } from '../demo/kellyDeskDemo'
import { GAUNTLET_DEMO_CALENDAR_ID } from '../demo/gauntletDemo'
import { deskPreviewBuildEnabled } from '../buildInfo'
import { requestDeskIdeasOpen } from '../desk/deskIdeasEvents'

export function AppFrame() {
  const workspaceMode = useWorkspaceMode()
  const workspace = useArcWorkspace(workspaceMode.close)
  const taskBar = useTaskBar(workspace)
  const arcTable = useArcTableSession()
  const [viewPreferences, setViewPreferences] = useState<DeskAwareViewPreferences>(loadDeskAwareViewPreferences)
  const [fridgeUndo, setFridgeUndo] = useState<FridgeRoundTripReceipt | null>(null)
  const [onboardingDraft, setOnboardingDraft] = useState(loadOnboardingDraft)
  const [showCaptureCoachMark, setShowCaptureCoachMark] = useState(() => !onboardingDraft.firstCapturePromptDismissed)
  const [settingsOpenToken, setSettingsOpenToken] = useState(0)
  const [workspaceOverlayOpen, setWorkspaceOverlayOpen] = useState(false)
  const deskYearLandingNormalized = useRef(false)
  const deskMonthHomeNormalized = useRef(false)
  const deskMonthPrefsMigrated = useRef(false)
  /** Settings / fridge / edit Lesson may open Units or Lessons; bare setup landings redirect away. */
  const allowUnitLessonLibraryRef = useRef(false)
  const [tasksOverlayOpen, setTasksOverlayOpen] = useState(false)
  const [recoveryFocusSectionId, setRecoveryFocusSectionId] = useState<string | null>(null)
  const [lessonSetupFocusId, setLessonSetupFocusId] = useState<string | null>(null)
  const [revealUnscheduledLessonId, setRevealUnscheduledLessonId] = useState<string | null>(null)
  const [workspaceLayout, setWorkspaceLayout] = useState<WorkspaceLayoutState>(loadWorkspaceLayout)
  const [stackWorkspace, setStackWorkspace] = useState<StackWorkspace | null>(null)
  const [deskEditSession, setDeskEditSession] = useState<{
    returnView: CalendarView
    returnAnchor: ISODate | null
    draftLayout: WorkspaceLayoutState
    draftDesk: DeskAwareViewPreferences['desk']
  } | null>(null)
  const [deskSelectedObject, setDeskSelectedObject] = useState<DeskObjectKind>('tray')
  const [deskResetArmed, setDeskResetArmed] = useState(false)
  const [deskPlannerSearch, setDeskPlannerSearch] = useState('')
  const [deskCalendarPopOutOpen, setDeskCalendarPopOutOpen] = useState(false)
  const deskCalendarEnlargeRef = useRef<HTMLButtonElement>(null)

  const deskEditActive = deskEditSession !== null
  const activeDeskLayout = deskEditSession?.draftLayout ?? workspaceLayout
  const activeDeskPreferences = deskEditSession ? { ...viewPreferences, desk: deskEditSession.draftDesk } : viewPreferences

  useEffect(() => {
    if (!workspace.calendar) {
      setStackWorkspace(null)
      return
    }
    setStackWorkspace(loadStackWorkspace(workspace.calendar.id))
  }, [workspace.calendar?.id])

  const deskPreviewBuild = deskPreviewBuildEnabled()

  useEffect(() => {
    const forceDesk = shouldForceDeskShell({
      deskPreview: deskPreviewBuild,
      calendarId: workspace.calendar?.id,
      sessionSeeded: readDeskPreviewSeededSession(deskPreviewBuild),
    })
    if (!forceDesk || !workspace.calendar) return
    setOnboardingDraft((current) => {
      if (current.dismissed && current.stage === 'landed') return current
      const next: OnboardingDraft = {
        ...current,
        stage: 'landed',
        dismissed: true,
        firstCapturePromptDismissed: true,
      }
      saveOnboardingDraft(next)
      return next
    })
  }, [workspace.calendar?.id, deskPreviewBuild])

  function persistStackWorkspace(next: StackWorkspace) {
    setStackWorkspace(next)
    saveStackWorkspace(next)
  }

  function combineCaptures(targetCaptureId: string, incomingCaptureId: string) {
    if (!workspace.calendar || !stackWorkspace || targetCaptureId === incomingCaptureId) return
    const existing = stackForMember(stackWorkspace, targetCaptureId)
    const next = existing
      ? addMemberToStack(stackWorkspace, existing.stackId, incomingCaptureId)
      : createStackFromMembers(stackWorkspace, 'capture', [targetCaptureId, incomingCaptureId], `stack-${Date.now()}`)
    persistStackWorkspace(next)
  }

  function removeCaptureFromStack(stackId: string, captureId: string) {
    if (!stackWorkspace) return
    persistStackWorkspace(removeMemberFromStack(stackWorkspace, stackId, captureId))
  }

  function unstackCaptures(stackId: string) {
    if (!stackWorkspace) return
    persistStackWorkspace(unstack(stackWorkspace, stackId))
  }

  function reorderStackCapture(stackId: string, captureId: string, toIndex: number) {
    if (!stackWorkspace) return
    persistStackWorkspace(reorderStackMember(stackWorkspace, stackId, captureId, toIndex))
  }

  function enterEditWorkspaceMode() {
    if (!workspace.calendar || workspaceMode.mode !== 'calendar' || !workspace.anchorDate) return
    setWorkspaceOverlayOpen(false)
    setTasksOverlayOpen(false)
    setDeskEditSession({
      returnView: workspace.activeView,
      returnAnchor: workspace.anchorDate,
      draftLayout: workspaceLayout,
      draftDesk: viewPreferences.desk,
    })
    setDeskSelectedObject('tray')
    setDeskResetArmed(false)
  }

  function patchEditWorkspaceSizes(patch: Partial<DeskAwareViewPreferences['desk']>) {
    if (!deskEditSession) return
    setDeskEditSession({ ...deskEditSession, draftDesk: { ...deskEditSession.draftDesk, ...patch } })
  }

  function completeDeskEdit(save: boolean) {
    if (!deskEditSession) return
    const session = deskEditSession
    try {
      if (save) {
        setWorkspaceLayout(session.draftLayout)
        saveWorkspaceLayout(session.draftLayout)
        updateViewPreferences({ ...viewPreferences, desk: session.draftDesk })
      }
      if (session.returnAnchor) {
        workspace.setActiveView(session.returnView, session.returnAnchor)
      } else {
        workspace.setActiveView(session.returnView)
      }
    } finally {
      setDeskEditSession(null)
      setDeskResetArmed(false)
    }
  }

  function moveSelectedDeskObject(direction: DeskMoveDirection) {
    if (!deskEditSession || deskSelectedObject === 'planner') return
    setDeskEditSession({
      ...deskEditSession,
      draftLayout: moveDeskObject(deskEditSession.draftLayout, deskSelectedObject, direction),
    })
  }

  function resetDeskLayoutDraft() {
    if (!deskEditSession) return
    if (!deskResetArmed && !workspaceLayoutUsesDefault(deskEditSession.draftLayout)) {
      setDeskResetArmed(true)
      return
    }
    setDeskEditSession({ ...deskEditSession, draftLayout: resetWorkspaceLayoutToArcDefault() })
    setDeskResetArmed(false)
  }

  function openRecovery(sectionId?: string) {
    setRecoveryFocusSectionId(sectionId ?? null)
    workspaceMode.open('recovery')
  }

  function closeRecoveryMode() {
    setRecoveryFocusSectionId(null)
    workspaceMode.close()
  }

  function openUnitLessonLibrary(mode: 'units' | 'lessons') {
    allowUnitLessonLibraryRef.current = true
    workspaceMode.open(mode)
  }

  function returnToSettings() {
    setLessonSetupFocusId(null)
    workspaceMode.close()
    setSettingsOpenToken((token) => token + 1)
  }

  function openLessonForEdit(lessonId: string) {
    setLessonSetupFocusId(lessonId)
    openUnitLessonLibrary('lessons')
  }

  function showUnscheduledInIdeas(lessonId: string) {
    setRevealUnscheduledLessonId(lessonId)
    workspaceMode.close()
    setLessonSetupFocusId(null)
    openWorkspaceOverlay(true)
    requestDeskIdeasOpen()
    workspace.setStorageNotice('Lesson is in Unscheduled lessons in IDEAS. Teaching history was preserved.')
  }

  function openSetupSection(id: SetupSectionId) {
    workspaceMode.open(id)
  }

  function openOnboardingSection(id: OnboardingSectionId) {
    updateOnboarding({ ...onboardingDraft, stage: id })
  }

  useEffect(() => {
    if (isRetiredSetupWorkspaceMode(workspaceMode.mode)) {
      if (!allowUnitLessonLibraryRef.current) {
        workspaceMode.open(SETUP_FALLBACK_SECTION)
      }
      return
    }
    allowUnitLessonLibraryRef.current = false
  }, [workspaceMode.mode])

  const workspaceBusy = workspaceMode.mode !== 'calendar' || !workspace.calendar || !workspace.anchorDate
  const unscheduledUnits = workspace.unitWorkspace?.units.filter((unit) => unit.placement === null) ?? []
  const setupCapabilities = assessSetupCapabilities({ calendar: workspace.calendar, planning: workspace.planningWorkspace, lessons: workspace.lessonWorkspace })
  const forceDeskShell = shouldForceDeskShell({
    deskPreview: deskPreviewBuild,
    calendarId: workspace.calendar?.id,
    sessionSeeded: readDeskPreviewSeededSession(deskPreviewBuild),
  })
  const returningTeacher = Boolean(workspace.calendar && workspace.planningWorkspace?.courses.length && workspace.planningWorkspace.sections.length && onboardingDraft.stage === 'welcome')
  const onboardingFlowActive = onboardingDraft.stage !== 'landed'
  const showOnboarding = !returningTeacher && !onboardingDraft.dismissed && (
    onboardingFlowActive || !minimumPlanningSetupEstablished(setupCapabilities)
  )
  const onboardingActive = showOnboarding && workspaceMode.mode === 'calendar' && !forceDeskShell
  const headerMode: WorkspaceMode = onboardingActive ? 'onboarding' : workspaceMode.mode
  const headerStageTitle = onboardingActive
    ? onboardingStageTitle(onboardingDraft, setupCapabilities)
    : stageTitleFor(workspaceMode.mode, workspace.activeView)
  const setupNavActive = isSetupWorkspaceMode(workspaceMode.mode) ? workspaceMode.mode : null
  const onboardingNavActive = onboardingActive
    ? (resolveOnboardingStage(onboardingDraft, setupCapabilities) as OnboardingSectionId | 'landed')
    : null
  const setupDisabledIds = (() => {
    const disabled = new Set<SetupSectionId>()
    if (!workspace.hasClasses) {
      disabled.add('teaching-day')
      disabled.add('import')
    }
    return disabled
  })()
  const onboardingDisabledIds = (() => {
    const disabled = new Set<OnboardingSectionId>()
    if (!setupCapabilities.calendarEstablished) {
      disabled.add('classes')
      disabled.add('day')
    } else if (!setupCapabilities.coursesEstablished || !setupCapabilities.sectionsEstablished) {
      disabled.add('day')
    }
    return disabled
  })()
  const showPlanFurniture = Boolean(workspace.calendar && workspaceMode.mode === 'calendar' && !onboardingActive)
  const globalCaptureEnabled = Boolean(workspace.calendar && !onboardingActive)

  useEffect(() => {
    if (!forceDeskShell || deskMonthPrefsMigrated.current) return
    if (viewPreferences.desk.homeDeskPlannerView !== 'Month') return
    deskMonthPrefsMigrated.current = true
    updateViewPreferences({
      ...viewPreferences,
      desk: { ...viewPreferences.desk, homeDeskPlannerView: 'Week' },
    })
  }, [forceDeskShell, viewPreferences.desk.homeDeskPlannerView])

  const kellyDemoWeekAnchor =
    workspace.calendar?.id === GAUNTLET_DEMO_CALENDAR_ID
      ? buildKellyDeskDemoBundle().planContext.anchorDate
      : null
  const captureAnchor = captureAnchorFromPlan({
    anchorDate: workspace.anchorDate,
    activeView: workspace.activeView,
    planContext: workspace.planContext,
    workspaceMode: workspaceMode.mode,
  })
  function saveGlobalCapture(text: string, extra: Parameters<typeof workspace.addCapture>[1] = {}) {
    return workspace.addCapture(text, { ...captureAnchor, ...extra })
  }

  useEffect(() => {
    function onAssignDate(event: Event) {
      const detail = (event as CustomEvent<DeskPostItAssignDateDetail>).detail
      if (!detail?.date) return
      const noteTexts = detail.bundle?.noteTexts?.length
        ? detail.bundle.noteTexts
        : detail.text?.trim()
          ? [detail.text.trim()]
          : []
      if (noteTexts.length === 0) return
      for (const note of noteTexts) {
        workspace.addCalendarNote(detail.date, note)
      }
      if (detail.bundle?.notice) {
        workspace.setStorageNotice(detail.bundle.notice)
      } else if (detail.bundle?.isBundledUnit) {
        workspace.setStorageNotice(`Unit + lesson attached to ${detail.date}.`)
      }
    }
    function onAssignPriority(event: Event) {
      const detail = (event as CustomEvent<DeskPostItAssignPriorityDetail>).detail
      if (!detail?.priority || !detail.text?.trim()) return
      taskBar.add(detail.priority, detail.text.trim())
    }
    window.addEventListener(DESK_POSTIT_ASSIGN_DATE_EVENT, onAssignDate)
    window.addEventListener(DESK_POSTIT_ASSIGN_PRIORITY_EVENT, onAssignPriority)
    return () => {
      window.removeEventListener(DESK_POSTIT_ASSIGN_DATE_EVENT, onAssignDate)
      window.removeEventListener(DESK_POSTIT_ASSIGN_PRIORITY_EVENT, onAssignPriority)
    }
  }, [taskBar, workspace])

  function dismissCaptureCoachMark() {
    setShowCaptureCoachMark(false)
    updateOnboarding({ ...onboardingDraft, firstCapturePromptDismissed: true })
  }
  const planningIndexActive = Boolean(
    showPlanFurniture
    && workspace.activeView === 'Day'
    && workspace.planContext?.focus === 'class'
    && workspace.planContext.teachingBlockId
    && workspace.planningWorkspace
    && workspace.unitWorkspace
    && workspace.lessonWorkspace
    && workspace.anchorDate
    && (() => {
      try {
        const continuity = projectDayContinuity({
          date: workspace.anchorDate!,
          planning: workspace.planningWorkspace!,
          units: workspace.unitWorkspace!,
          lessons: workspace.lessonWorkspace!,
          overrides: workspace.shiftState?.overrides ?? [],
        })
        const rail = buildTeachingDayRail(workspace.planningWorkspace!, continuity)
        const block = rail.find((item) => item.id === workspace.planContext!.teachingBlockId)
        return block?.type === 'planning'
      } catch {
        return false
      }
    })(),
  )

  function openPlanningPeriodFromIndex() {
    if (!workspace.calendar || !workspace.anchorDate || !workspace.planningWorkspace || !workspace.unitWorkspace || !workspace.lessonWorkspace) return
    workspace.setActiveView('Day')
    const continuity = projectDayContinuity({
      date: workspace.anchorDate,
      planning: workspace.planningWorkspace,
      units: workspace.unitWorkspace,
      lessons: workspace.lessonWorkspace,
      overrides: workspace.shiftState?.overrides ?? [],
    })
    const planningBlock = buildTeachingDayRail(workspace.planningWorkspace, continuity).find((item) => item.type === 'planning')
    if (planningBlock) workspace.selectTeachingBlock(planningBlock)
  }

  function updateOnboarding(next: OnboardingDraft) {
    setOnboardingDraft(next)
    saveOnboardingDraft(next)
  }

  useEffect(() => {
    if (!workspace.calendar || !workspace.anchorDate) return
    const preferred = resolveAvailableHomeDeskView(viewPreferences, workspace.viewAvailability)
    const monthDriftOnDesk =
      showPlanFurniture && preferred === 'Week' && workspace.activeView === 'Month'
    if (workspace.viewWasPersisted && !monthDriftOnDesk) return
    workspace.setActiveView(preferred)
    // Home preference is intentionally applied only when the restored workspace becomes available
    // and the teacher did not already persist an explicit Plan view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(workspace.calendar && workspace.anchorDate)])

  function updateViewPreferences(next: DeskAwareViewPreferences) {
    setViewPreferences(next)
    saveDeskAwareViewPreferences(next)
  }

  function promoteCaptureToPriorityLane(captureId: string, priority: TaskPriority): boolean {
    const capture = workspace.captureWorkspace?.captures.find((item) => item.id === captureId)
    if (!capture) return false
    taskBar.add(priority, capture.text)
    return workspace.removeCapture(captureId)
  }

  function selectView(view: CalendarView) {
    // Explicit tab/pop-out selection owns the view. One-shot desk landing
    // normalizers must not remap the first YEAR/MONTH click back to Week.
    deskYearLandingNormalized.current = true
    deskMonthHomeNormalized.current = true
    workspace.setActiveView(view)
    updateViewPreferences({ ...recordLastUsedView(viewPreferences, view), desk: viewPreferences.desk })
  }

  function deepenTo(date: ISODate, view: CalendarView) {
    deskYearLandingNormalized.current = true
    deskMonthHomeNormalized.current = true
    workspace.setActiveView(view, date)
    updateViewPreferences({ ...recordLastUsedView(viewPreferences, view), desk: viewPreferences.desk })
  }

  function returnHome() {
    if (onboardingActive) {
      updateOnboarding({ ...onboardingDraft, dismissed: true })
      if (minimumPlanningSetupEstablished(setupCapabilities)) {
        setWorkspaceOverlayOpen(false)
        workspaceMode.close()
        if (workspace.calendar && workspace.anchorDate) {
          workspace.setActiveView(resolveAvailableHomeDeskView(viewPreferences, workspace.viewAvailability))
        }
      }
      return
    }
    if (!workspace.calendar || !workspace.anchorDate) return
    setWorkspaceOverlayOpen(false)
    workspaceMode.close()
    // Wordmark / mark → main desk table (home desk planner view; default Teaching week).
    workspace.setActiveView(resolveAvailableHomeDeskView(viewPreferences, workspace.viewAvailability))
  }

  function openImportFromOnboarding() {
    workspaceMode.open('import')
  }

  function shiftWithOverrides(overrides: ShiftPersistenceInput['overrides']): ShiftPersistenceInput | null {
    if (!workspace.calendar) return null
    return {
      calendarId: workspace.calendar.id,
      overrides,
      undo: workspace.shiftState?.undo ?? null,
    }
  }

  function sendLessonBackToFridge(lessonId: string) {
    if (!workspace.calendar || !workspace.unitWorkspace || !workspace.lessonWorkspace) return
    const result = moveLessonToFridge({
      calendar: workspace.calendar,
      units: workspace.unitWorkspace,
      lessons: workspace.lessonWorkspace,
      overrides: workspace.shiftState?.overrides ?? [],
      lessonId,
    })
    const nextShift = shiftWithOverrides(result.overrides)
    if (!nextShift) return
    workspace.useLessons(result.lessons, result.lessons, nextShift)
    setFridgeUndo(result.undo)
    setRevealUnscheduledLessonId(lessonId)
    openWorkspaceOverlay(true)
    requestDeskIdeasOpen()
    workspace.setStorageNotice('Lesson moved to Unscheduled lessons in IDEAS. Teaching history was preserved.')
  }

  function scheduleLessonFromFridge(lessonId: string, plannedDate: ISODate) {
    if (!workspace.calendar || !workspace.unitWorkspace || !workspace.lessonWorkspace) return
    const result = moveLessonFromFridge({
      calendar: workspace.calendar,
      units: workspace.unitWorkspace,
      lessons: workspace.lessonWorkspace,
      overrides: workspace.shiftState?.overrides ?? [],
      lessonId,
      plannedDate,
    })
    const nextShift = shiftWithOverrides(result.overrides)
    if (!nextShift) return
    workspace.useLessons(result.lessons, result.lessons, nextShift)
    setFridgeUndo(result.undo)
  }

  function undoLastFridgeMove() {
    if (!fridgeUndo) return
    const restored = undoFridgeRoundTrip(fridgeUndo)
    const nextShift = shiftWithOverrides(restored.overrides)
    if (!nextShift) return
    workspace.useLessons(restored.lessons, restored.lessons, nextShift)
    setFridgeUndo(null)
  }

  function startClass(sectionId: string, lessonId: string, liveDate?: ISODate) {
    if (!workspace.calendar || !workspace.planningWorkspace || !workspace.unitWorkspace || !workspace.lessonWorkspace) return
    const sessionDate = liveDate ?? workspace.anchorDate
    if (!sessionDate) return
    try {
      const day = projectDayContinuity({
        date: sessionDate,
        planning: workspace.planningWorkspace,
        units: workspace.unitWorkspace,
        lessons: workspace.lessonWorkspace,
        overrides: workspace.shiftState?.overrides ?? [],
      })
      arcTable.start(projectArcTableSession({ day, sectionId, lessonId, calendar: workspace.calendar, liveDate: sessionDate }))
    } catch (error) {
      workspace.setStorageNotice(error instanceof Error ? error.message : String(error))
    }
  }

  function projectTeachingDay() {
    if (!workspace.calendar || !workspace.anchorDate || !workspace.planningWorkspace || !workspace.unitWorkspace || !workspace.lessonWorkspace) return null
    return projectDayContinuity({
      date: workspace.anchorDate,
      planning: workspace.planningWorkspace,
      units: workspace.unitWorkspace,
      lessons: workspace.lessonWorkspace,
      overrides: workspace.shiftState?.overrides ?? [],
    })
  }

  function deskArcTableLaunchOptions() {
    const day = projectTeachingDay()
    if (!day || !workspace.calendar || !workspace.anchorDate) return []
    const preferredSectionId = workspace.planContext?.sectionId ?? null
    let options = preferredSectionId
      ? (() => {
          try {
            return arcTableLaunchOptions({
              day,
              sectionId: preferredSectionId,
              calendar: workspace.calendar!,
              liveDate: workspace.anchorDate!,
            })
          } catch {
            return []
          }
        })()
      : []
    if (options.length === 0) {
      options = collectArcTableDeskLaunchOptions({
        day,
        calendar: workspace.calendar,
        liveDate: workspace.anchorDate,
      })
    }
    return options
  }

  function deskArcTableContextLine(): string | null {
    if (arcTable.live) return `Live · ${arcTable.live.session.sectionName}`
    const options = deskArcTableLaunchOptions()
    const pick = options.find((option) => option.deliveryStatus === 'in-progress') ?? options[0]
    if (!pick) return null
    const section = workspace.planningWorkspace?.sections.find((sectionRow) => sectionRow.id === pick.sectionId)
    const course = section
      ? workspace.planningWorkspace?.courses.find((courseRow) => courseRow.id === section.courseId)
      : null
    const courseTitle = course?.title ?? pick.title
    return `${section?.name ?? pick.sectionId} · ${courseTitle}`
  }

  function launchArcTableFromDesk(action: ArcTableDeskAction) {
    const teacherTool = deskActionToTeacherTool(action)
    if (action === 'open' && arcTable.live) {
      arcTable.showTeacher()
      return
    }
    if (arcTable.live) {
      if (teacherTool) setArcTableDeskLaunch(teacherTool)
      arcTable.showTeacher()
      return
    }
    const options = deskArcTableLaunchOptions()
    if (options.length === 0) {
      workspace.setStorageNotice('No live or resumable class is available on this teaching day.')
      if (workspace.activeView !== 'Day') workspace.setActiveView('Day')
      return
    }
    const pick = options.find((option) => option.deliveryStatus === 'in-progress') ?? options[0]
    if (teacherTool) setArcTableDeskLaunch(teacherTool)
    startClass(pick.sectionId, pick.lessonId)
  }

  function exploreArcTableFromDeskPreview() {
    if (workspace.activeView !== 'Day') workspace.setActiveView('Day')
  }

  function endClass(outcome: ArcTableTeachingOutcome): string | null {
    if (!arcTable.live || !workspace.calendar || !workspace.planningWorkspace || !workspace.unitWorkspace || !workspace.lessonWorkspace || !workspace.shiftState) {
      return 'ArcTable cannot end this class because its Arc planning context is unavailable.'
    }
    try {
      const result = applyArcTableTeachingOutcome({
        session: arcTable.live.session,
        liveDate: arcTable.live.session.date,
        calendar: workspace.calendar,
        planning: workspace.planningWorkspace,
        units: workspace.unitWorkspace,
        lessons: workspace.lessonWorkspace,
        overrides: workspace.shiftState.overrides,
        outcome,
      })
      const deliveryStates = workspace.lessonWorkspace.deliveryStates.filter((state) => state.lessonId !== result.lessonId || state.sectionId !== result.sectionId)
      const lessons = { ...workspace.lessonWorkspace, deliveryStates: [...deliveryStates, result] }
      workspace.useLessons(lessons, lessons, workspace.shiftState)
      arcTable.finish()
      return null
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    }
  }

  const trayPanelProps = {
    captures: workspace.captureWorkspace,
    lessons: workspace.lessonWorkspace?.lessons ?? [],
    units: workspace.unitWorkspace,
    unscheduledUnitTitles: unscheduledUnits.map((unit) => ({ id: unit.id, title: unit.title })),
    defaultDate: workspace.anchorDate,
    undoAvailable: Boolean(fridgeUndo),
    stackWorkspace,
    revealUnscheduledLessonId,
    onAddCapture: workspace.addCapture,
    onDeleteCapture: workspace.removeCapture,
    onSetCaptureImportant: workspace.setCaptureImportant,
    onMoveCaptureToDate: workspace.moveCaptureToDate,
    onPromoteCapture: workspace.promoteCapture,
    onScheduleLesson: scheduleLessonFromFridge,
    onUnplaceLesson: sendLessonBackToFridge,
    onUndo: undoLastFridgeMove,
    onOpenUnits: () => openUnitLessonLibrary('units'),
    onOpenImport: () => workspaceMode.open('import'),
    onCombineCaptures: combineCaptures,
    onRemoveCaptureFromStack: removeCaptureFromStack,
    onUnstack: unstackCaptures,
    onReorderStackMember: reorderStackCapture,
  }

  const fridgeContent = showPlanFurniture ? (
    <WorkspacePanel {...trayPanelProps} />
  ) : <p className="b01-furniture-empty">IDEAS is available in Plan View.</p>

  const deskTrayCompact = showPlanFurniture && activeDeskPreferences.desk.showTray ? (
    <WorkspacePanel {...trayPanelProps} planningDragDisabled={deskEditActive} />
  ) : null

  const deskPriorityPad = showPlanFurniture && activeDeskPreferences.desk.showPriorityPad && taskBar.workspace ? (
    <DeskPriorityPad
      workspace={taskBar.workspace}
      planningDragDisabled={deskEditActive}
      folderChrome={showPlanFurniture && workspaceMode.mode === 'calendar'}
      onAdd={taskBar.add}
      onRename={taskBar.rename}
      onMove={taskBar.move}
      onSetCompleted={taskBar.setCompleted}
      onPromoteCaptureText={promoteCaptureToPriorityLane}
    />
  ) : null

  const deskEnabled = showPlanFurniture && workspaceMode.mode === 'calendar'
  const yearExpanded = deskEnabled && workspace.activeView === 'Year Map'

  const deskCalendarIndexNav = deskEnabled
    ? {
        activeView: workspace.activeView,
        viewSelectionDisabled: workspaceBusy || onboardingActive,
        availabilityFor: workspace.viewAvailability,
        onSelectView: selectView,
      }
    : null

  useEffect(() => {
    if (!deskEnabled || workspaceOverlayOpen || deskEditActive) {
      setDeskCalendarPopOutOpen(false)
    }
  }, [deskEnabled, workspaceOverlayOpen, deskEditActive])

  function openWorkspaceOverlay(open: boolean) {
    if (open && deskEnabled && workspace.activeView === 'Year Map') {
      workspace.setActiveView(resolveAvailableHomeDeskView(viewPreferences, workspace.viewAvailability))
    }
    setWorkspaceOverlayOpen(open)
  }

  // Demo/seed can land the desk on Year Map; nudge once to home Week.
  // Mark the one-shot done when desk is ready on any other view so a later
  // intentional YEAR tab click is not remapped (Kelly: first click → Week).
  useEffect(() => {
    if (deskYearLandingNormalized.current) return
    if (!deskEnabled || !workspace.calendar || !workspace.anchorDate) return
    if (workspace.activeView !== 'Year Map') {
      deskYearLandingNormalized.current = true
      return
    }
    const demoDeskLanding = forceDeskShell && readDeskPreviewSeededSession(deskPreviewBuild)
    if (!demoDeskLanding && workspace.viewWasPersisted) {
      deskYearLandingNormalized.current = true
      return
    }
    deskYearLandingNormalized.current = true
    workspace.setActiveView(resolveAvailableHomeDeskView(viewPreferences, workspace.viewAvailability))
  }, [
    deskEnabled,
    deskPreviewBuild,
    forceDeskShell,
    viewPreferences,
    workspace.activeView,
    workspace.anchorDate,
    workspace.calendar,
    workspace.viewWasPersisted,
  ])

  // forceDeskShell demo home is Teaching week; remap an accidental Month land once.
  // Complete the one-shot when not on Month so intentional MONTH tab clicks stick.
  useEffect(() => {
    if (deskMonthHomeNormalized.current) return
    if (!deskEnabled || !workspace.calendar || !workspace.anchorDate) return
    if (!forceDeskShell || workspace.activeView !== 'Month') {
      deskMonthHomeNormalized.current = true
      return
    }
    deskMonthHomeNormalized.current = true
    workspace.setActiveView('Week', kellyDemoWeekAnchor ?? workspace.anchorDate ?? undefined)
  }, [
    deskEnabled,
    forceDeskShell,
    kellyDemoWeekAnchor,
    workspace.activeView,
    workspace.anchorDate,
    workspace.calendar,
  ])

  if (arcTable.live && arcTable.surface === 'teacher') {
    return (
      <ArcTableTeacherMonitor
        live={arcTable.live}
        onOpenPlan={arcTable.showPlan}
        onShowTeacher={arcTable.showTeacher}
        onShowStudent={arcTable.showStudent}
        onUpdate={arcTable.update}
        onEnd={endClass}
      />
    )
  }

  if (arcTable.live && arcTable.surface === 'student') {
    return (
      <ArcTableStudentSurface
        live={arcTable.live}
        onOpenPlan={arcTable.showPlan}
        onShowTeacher={arcTable.showTeacher}
        onShowStudent={arcTable.showStudent}
        onSyncLive={arcTable.syncLive}
        onUpdate={arcTable.update}
        onEnd={endClass}
      />
    )
  }

  const settingsContent = showPlanFurniture ? (
    <SettingsFurnitureContent
      preferences={viewPreferences}
      hasTerms={workspace.hasTerms}
      hasClasses={workspace.hasClasses}
      hasUnits={workspace.hasUnits}
      hasLessons={workspace.hasLessons}
      onChangePreferences={updateViewPreferences}
      onOpenCalendarSetup={() => workspaceMode.open('calendar-setup')}
      onOpenTerms={() => workspaceMode.open('terms')}
      onOpenClasses={() => workspaceMode.open('classes')}
      onOpenTeachingDay={() => workspaceMode.open('teaching-day')}
      onOpenImport={() => workspaceMode.open('import')}
      onOpenUnits={() => openUnitLessonLibrary('units')}
      onOpenLessons={() => {
        setLessonSetupFocusId(null)
        openUnitLessonLibrary('lessons')
      }}
      onOpenTaskBar={() => setTasksOverlayOpen(true)}
      onEditWorkspace={enterEditWorkspaceMode}
    />
  ) : <p className="b01-furniture-empty">Settings are available from the planner.</p>

  const taskContent = taskBar.workspace ? (
    <TaskBarPanel
      workspace={taskBar.workspace}
      onAdd={taskBar.add}
      onRename={taskBar.rename}
      onMove={taskBar.move}
      onSetImportant={taskBar.setImportant}
      onSetCompleted={taskBar.setCompleted}
      onDelete={taskBar.delete}
    />
  ) : <p className="b01-furniture-empty">Tasks become available after the school calendar is set.</p>

  const calendarWorkspaceStage = (
    <WorkspaceStage
      mode={workspaceMode.mode}
      activeView={workspace.activeView}
      showWeekends={viewPreferences.showWeekends}
      calendar={workspace.calendar}
      calendarInput={workspace.calendarInput}
      anchorDate={workspace.anchorDate}
      planContext={workspace.planContext}
      planningWorkspace={workspace.planningWorkspace}
      planningInput={workspace.planningInput}
      unitWorkspace={workspace.unitWorkspace}
      unitInput={workspace.unitInput}
      lessonWorkspace={workspace.lessonWorkspace}
      lessonInput={workspace.lessonInput}
      shiftState={workspace.shiftState}
      protectedCourseIds={workspace.protectedCourseIds}
      protectedUnitIds={workspace.protectedUnitIds}
      protectedSectionIds={workspace.protectedSectionIds}
      onUseCalendar={workspace.useCalendar}
      onSchoolIdentitySelected={(candidate) => updateOnboarding({ ...onboardingDraft, schoolNcesId: candidate.id })}
      loadedSchoolNcesId={onboardingDraft.schoolNcesId ?? null}
      onUseTerms={workspace.useTerms}
      onUseClasses={workspace.useClasses}
      onUseUnits={workspace.useUnits}
      onUseLessons={workspace.useLessons}
      onUseCurriculumImport={workspace.useCurriculumImport}
      onApplyRecoveryShift={workspace.applyRecoveryShift}
      onStartClass={startClass}
      onSelectDate={deepenTo}
      onSelectYearUnit={workspace.selectYearUnit}
      onSelectTeachingBlock={workspace.selectTeachingBlock}
      onSelectLesson={workspace.selectLesson}
      onRetreatPlanFocus={workspace.retreatFocus}
      onOpenWorkspace={() => openWorkspaceOverlay(true)}
      onFollowPlanningAttention={workspace.followPlanningAttention}
      onReturnToPlanningPeriod={workspace.returnToPlanningPeriod}
      planningPeriodReturnPending={Boolean(workspace.planningPeriodReturnBlockId)}
      captureWorkspace={workspace.captureWorkspace}
      dayNotes={{
        onAdd: workspace.addCalendarNote,
        onUpdateText: workspace.updateCalendarNote,
        onMove: workspace.moveCalendarNote,
        onRemove: workspace.deleteCalendarNote,
        onSetImportant: workspace.setCalendarNoteImportant,
      }}
      showDeskNotes={activeDeskPreferences.desk.showDeskNotes}
      onSetLessonImportant={workspace.setLessonImportant}
      onSetCaptureImportant={workspace.setCaptureImportant}
      onMoveCaptureToDate={workspace.moveCaptureToDate}
      onCloseMode={workspaceMode.mode === 'recovery' ? closeRecoveryMode : workspaceMode.close}
      onReturnToSettings={returnToSettings}
      onOpenMode={workspaceMode.open}
      planMoveIntent={workspace.planMoveIntent}
      onBeginPlanLessonMove={workspace.beginPlanLessonMove}
      onCancelPlanLessonMove={workspace.cancelPlanLessonMove}
      onConfirmPlanLessonMove={workspace.confirmPlanLessonMove}
      onOpenRecoveryForSection={(sectionId) => openRecovery(sectionId)}
      recoveryFocusSectionId={recoveryFocusSectionId}
      onEditLesson={openLessonForEdit}
      focusLessonId={lessonSetupFocusId}
      onShowUnscheduledInIdeas={showUnscheduledInIdeas}
    />
  )

  return (
    <div className={`arc-shell${deskEnabled ? ' arc-shell--desk' : ''}`}>
      <a className="skip-link" href="#calendar-stage">Skip to calendar</a>

      <div className="arc-layout">
        <main id="calendar-stage" className="arc-calendar-stage" tabIndex={-1}>
          <B01Furniture
            deskEnabled={deskEnabled}
            yearExpanded={yearExpanded}
            deskTrayDock={deskTrayCompact}
            deskPriorityDock={deskPriorityPad}
            deskNotesDock={null}
            deskWoodWordmark={
              <button type="button" className="arc-wordmark arc-desk-wood-wordmark" aria-label="Main desk home" onClick={returnHome}>
                <img src={publicAssetUrl('assets/arc/arc-mark-stacked.png')} alt="Arc" data-testid="arc-desk-wood-wordmark" />
              </button>
            }
            deskQuickCapture={
              deskEnabled && globalCaptureEnabled ? (
                <DeskQuickCaptureSticky
                  disabled={workspaceBusy}
                  defaultUnitId={workspace.planContext?.unitId ?? null}
                  onSave={saveGlobalCapture}
                  coachMark={
                    minimumPlanningSetupEstablished(setupCapabilities) && showCaptureCoachMark && !onboardingDraft.firstCapturePromptDismissed ? (
                      <CaptureCoachMark onDismiss={dismissCaptureCoachMark} />
                    ) : null
                  }
                />
              ) : null
            }
            deskArcTableFixture={
              deskEnabled && activeDeskPreferences.desk.showArcTable ? (
                <ArcTableDeskFixture
                  markSize={100}
                  liveActive={Boolean(arcTable.live)}
                  contextLine={deskArcTableContextLine()}
                  interactionsDisabled={deskEditActive}
                  onDeskAction={launchArcTableFromDesk}
                  onExplorePreview={exploreArcTableFromDeskPreview}
                  onAddArcTable={() => workspace.setStorageNotice('ArcTable add-on flows from your Arc account settings.')}
                />
              ) : null
            }
            deskEditMode={deskEditActive}
            deskLayout={activeDeskLayout}
            deskViewportProfile="desktop"
            deskSelectedObject={deskSelectedObject}
            onSelectDeskObject={setDeskSelectedObject}
            onMoveDeskObject={moveSelectedDeskObject}
            deskSizes={{
              planner: activeDeskPreferences.desk.plannerSize,
              tray: activeDeskPreferences.desk.traySize,
              msc: activeDeskPreferences.desk.mscSize,
            }}
            deskEditToolbar={deskEditActive ? (
              <DeskEditToolbar
                selectedObject={deskSelectedObject}
                sizes={{
                  planner: activeDeskPreferences.desk.plannerSize,
                  tray: activeDeskPreferences.desk.traySize,
                  msc: activeDeskPreferences.desk.mscSize,
                }}
                onSizeChange={(patch) => patchEditWorkspaceSizes({
                  ...(patch.planner ? { plannerSize: patch.planner } : {}),
                  ...(patch.tray ? { traySize: patch.tray } : {}),
                  ...(patch.msc ? { mscSize: patch.msc } : {}),
                })}
                onMove={moveSelectedDeskObject}
                canMove={deskSelectedObject !== 'planner'}
                onDone={() => completeDeskEdit(true)}
                onReset={resetDeskLayoutDraft}
                resetNeedsConfirm={deskResetArmed}
              />
            ) : null}
            spreadChrome={
              deskEnabled ? (
                <>
                  {arcTable.live && arcTable.surface === 'plan' ? (
                    <div className="planner-shell-bar planner-shell-bar--desk-live" data-testid="planner-shell-bar">
                      <div className="planner-shell-bar-controls">
                        <button type="button" className="arc-live-return" onClick={arcTable.showTeacher}>
                          <strong>{arcTable.live.session.sectionName}</strong>
                          <span>Return to ArcTable</span>
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {workspace.storageNotice ? (
                    <div className="storage-notice storage-notice--with-action" role="status">
                      <p>{workspace.storageNotice}</p>
                      {revealUnscheduledLessonId ? (
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => showUnscheduledInIdeas(revealUnscheduledLessonId)}
                        >
                          Show unplaced
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <PlannerShellBar
                    homeLabel={onboardingActive ? 'Exit setup to Arc' : 'Main desk home'}
                    onHome={returnHome}
                    trailing={arcTable.live && arcTable.surface === 'plan' ? (
                      <button type="button" className="arc-live-return" onClick={arcTable.showTeacher}>
                        <strong>{arcTable.live.session.sectionName}</strong>
                        <span>Return to ArcTable</span>
                      </button>
                    ) : null}
                    capture={null}
                  />
                  <CalendarStageHeader
                    activeView={workspace.activeView}
                    mode={headerMode}
                    calendar={workspace.calendar}
                    anchorDate={workspace.anchorDate}
                    previousTarget={workspace.previousTarget}
                    nextTarget={workspace.nextTarget}
                    todayTarget={workspace.todayTarget}
                    recoveryCount={workspace.recoveryCount}
                    undoAvailable={Boolean(workspace.shiftState?.undo)}
                    stageTitle={headerStageTitle}
                    editorialTitleManaged={workspaceMode.mode === 'calendar' && Boolean(workspace.calendar && workspace.anchorDate) && !onboardingActive}
                    viewSelectionDisabled={workspaceBusy || onboardingActive}
                    availabilityFor={workspace.viewAvailability}
                    onSelectView={selectView}
                    onMovePrevious={() => workspace.movePeriod('previous')}
                    onMoveNext={() => workspace.movePeriod('next')}
                    onToday={workspace.goToday}
                    onOpenRecovery={() => openRecovery()}
                    onUndoShift={workspace.undoLastShift}
                    setupNav={setupNavActive ? {
                      activeId: setupNavActive,
                      disabledIds: setupDisabledIds,
                      onSelect: openSetupSection,
                    } : null}
                    onboardingNav={onboardingNavActive && onboardingNavActive !== 'landed' ? {
                      activeId: onboardingNavActive,
                      disabledIds: onboardingDisabledIds,
                      onSelect: openOnboardingSection,
                    } : null}
                  />
                  {workspace.storageNotice ? (
                    <div className="storage-notice storage-notice--with-action" role="status">
                      <p>{workspace.storageNotice}</p>
                      {revealUnscheduledLessonId ? (
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => showUnscheduledInIdeas(revealUnscheduledLessonId)}
                        >
                          Show unplaced
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </>
              )
            }
            settings={settingsContent}
            workspace={fridgeContent}
            tasks={taskContent}
            dismissSideDrawers={onboardingActive || workspaceMode.mode !== 'calendar'}
            openRequest={settingsOpenToken ? { name: 'settings', token: settingsOpenToken } : null}
            workspaceOpen={workspaceOverlayOpen}
            onWorkspaceOpenChange={openWorkspaceOverlay}
            tasksOpen={tasksOverlayOpen}
            onTasksOpenChange={setTasksOverlayOpen}
            indexNav={showPlanFurniture ? {
              activeView: workspace.activeView,
              planningIndexActive,
              viewSelectionDisabled: workspaceBusy || onboardingActive,
              availabilityFor: workspace.viewAvailability,
              onSelectView: selectView,
              onOpenPlanningPeriod: openPlanningPeriodFromIndex,
            } : null}
          >
            <section className={`calendar-canvas${onboardingActive ? ' calendar-canvas--onboarding' : ''}`} aria-label={onboardingActive ? `${headerStageTitle} setup` : `${headerStageTitle} workspace`}>
              {onboardingActive ? (
                <ArcOnboarding
                  draft={onboardingDraft}
                  capabilities={setupCapabilities}
                  calendar={workspace.calendar}
                  calendarInput={workspace.calendarInput}
                  planningInput={workspace.planningInput}
                  onChangeDraft={updateOnboarding}
                  onUseCalendar={workspace.useCalendar}
                  onUseClasses={workspace.useClasses}
                  onLandInDay={() => workspace.setActiveView(resolveAvailableHomeDeskView(viewPreferences, workspace.viewAvailability))}
                  onOpenImport={openImportFromOnboarding}
                  onCancelSetup={returnToSettings}
                />
              ) : (
                <>
              {!onboardingActive && workspaceMode.mode === 'calendar' && workspace.activeView === 'Day' && !minimumPlanningSetupEstablished(setupCapabilities) && !deskEnabled ? (
                <ProgressiveSetupPrompt capabilities={setupCapabilities} onOpenTeachingDay={() => workspaceMode.open('teaching-day')} />
              ) : null}
              {workspaceMode.mode === 'calendar' && workspace.calendar && workspace.anchorDate ? (
                deskEnabled ? (
                  <DeskPlannerHeadRow
                    deskEnabled
                    view={workspace.activeView}
                    viewLabel={workspace.activeView === 'Day' ? 'Teaching Day' : calendarViewLabel(workspace.activeView)}
                    focus={workspace.planContext?.focus ?? 'day'}
                    date={workspace.anchorDate}
                    weekRange={deskWeekRangeLabel(workspace, viewPreferences.showWeekends)}
                    monthLabel={monthLabel(workspace)}
                    yearLabel={yearLabel(workspace)}
                    courseId={workspace.planContext?.courseId}
                    sectionId={workspace.planContext?.sectionId}
                    lessonId={workspace.planContext?.lessonId}
                    courseTitle={headerCourseTitle(workspace)}
                    sectionName={headerSectionName(workspace)}
                    unitTitle={headerUnitTitle(workspace)}
                    lessonTitle={headerLessonTitle(workspace)}
                    blockLabel={headerBlock(workspace)?.label}
                    blockType={headerBlock(workspace)?.type ?? null}
                    overlay={workspaceOverlayOpen ? 'workspace' : null}
                    todayDisabled={!workspace.todayTarget}
                    onToday={workspace.goToday}
                    searchQuery={deskPlannerSearch}
                    onSearchQueryChange={setDeskPlannerSearch}
                    onEnlargeCalendar={() => setDeskCalendarPopOutOpen(true)}
                    calendarEnlarged={deskCalendarPopOutOpen}
                    enlargeTriggerRef={deskCalendarEnlargeRef}
                  />
                ) : (
                  <PlanStateHeader
                    view={workspace.activeView}
                    viewLabel={workspace.activeView === 'Day' ? 'Teaching Day' : calendarViewLabel(workspace.activeView)}
                    focus={workspace.planContext?.focus ?? 'day'}
                    date={workspace.anchorDate}
                    weekRange={weekRangeLabel(workspace, viewPreferences.showWeekends)}
                    monthLabel={monthLabel(workspace)}
                    yearLabel={yearLabel(workspace)}
                    courseId={workspace.planContext?.courseId}
                    sectionId={workspace.planContext?.sectionId}
                    lessonId={workspace.planContext?.lessonId}
                    courseTitle={headerCourseTitle(workspace)}
                    sectionName={headerSectionName(workspace)}
                    unitTitle={headerUnitTitle(workspace)}
                    lessonTitle={headerLessonTitle(workspace)}
                    blockLabel={headerBlock(workspace)?.label}
                    blockType={headerBlock(workspace)?.type ?? null}
                    overlay={workspaceOverlayOpen ? 'workspace' : null}
                  />
                )
              ) : null}
              {deskEnabled && deskCalendarPopOutOpen ? (
                <p className="desk-calendar-popout-placeholder" data-testid="desk-calendar-popout-placeholder">
                  Calendar is enlarged.
                </p>
              ) : (
                calendarWorkspaceStage
              )}
                </>
              )}
            </section>
          </B01Furniture>
        </main>
      </div>
      {deskEnabled && deskCalendarPopOutOpen && deskCalendarIndexNav ? (
        <DeskCalendarPopOut
          open
          onClose={() => setDeskCalendarPopOutOpen(false)}
          indexNav={deskCalendarIndexNav}
          returnFocusRef={deskCalendarEnlargeRef}
        >
          {calendarWorkspaceStage}
        </DeskCalendarPopOut>
      ) : null}
    </div>
  )
}

function resolveAvailableHomeDeskView(
  preferences: DeskAwareViewPreferences,
  availabilityFor: (view: CalendarView) => { available: boolean },
): CalendarView {
  const preferred = resolveHomeDeskPlannerView(preferences)
  if (availabilityFor(preferred).available) return preferred
  if (availabilityFor('Week').available) return 'Week'
  return DEFAULT_HOME_VIEW
}

function stageTitleFor(mode: ReturnType<typeof useWorkspaceMode>['mode'], activeView: string) {
  if (mode === 'onboarding') return 'Welcome'
  if (mode === 'recovery') return 'Recovery review'
  if (mode === 'terms') return 'Terms'
  if (mode === 'classes') return 'Courses & sections'
  if (mode === 'teaching-day') return 'Teaching day'
  if (mode === 'import') return 'Import curriculum'
  if (mode === 'units') return 'Units'
  if (mode === 'lessons') return 'Lessons'
  if (mode === 'calendar-setup') return 'Calendar'
  return activeView
}

function headerCourseTitle(workspace: ReturnType<typeof useArcWorkspace>) {
  const id = workspace.planContext?.courseId
  return id ? workspace.planningWorkspace?.courses.find((course) => course.id === id)?.title ?? null : null
}

function headerSectionName(workspace: ReturnType<typeof useArcWorkspace>) {
  const id = workspace.planContext?.sectionId
  return id ? workspace.planningWorkspace?.sections.find((section) => section.id === id)?.name ?? null : null
}

function headerUnitTitle(workspace: ReturnType<typeof useArcWorkspace>) {
  const id = workspace.planContext?.unitId
  return id ? workspace.unitWorkspace?.units.find((unit) => unit.id === id)?.title ?? null : null
}

function headerLessonTitle(workspace: ReturnType<typeof useArcWorkspace>) {
  const id = workspace.planContext?.lessonId
  return id ? workspace.lessonWorkspace?.lessons.find((lesson) => lesson.id === id)?.title ?? null : null
}

function headerBlock(workspace: ReturnType<typeof useArcWorkspace>) {
  const id = workspace.planContext?.teachingBlockId
  if (!id) return null
  const explicit = workspace.planningWorkspace?.teachingDay?.blocks.find((block) => block.id === id)
  if (explicit) return explicit
  if (!workspace.planningWorkspace || !workspace.unitWorkspace || !workspace.lessonWorkspace || !workspace.anchorDate) return null
  const continuity = projectDayContinuity({
    date: workspace.anchorDate,
    planning: workspace.planningWorkspace,
    units: workspace.unitWorkspace,
    lessons: workspace.lessonWorkspace,
    overrides: workspace.shiftState?.overrides ?? [],
  })
  const rail = buildTeachingDayRail(workspace.planningWorkspace, continuity)
  const item = rail.find((block) => block.id === id)
  if (!item) return null
  return { id: item.id, label: item.label, type: item.type, order: 0, sectionId: item.sectionId, startTime: item.block?.startTime ?? null, endTime: item.block?.endTime ?? null }
}

function weekRangeLabel(workspace: ReturnType<typeof useArcWorkspace>, showWeekends: boolean) {
  if (workspace.activeView !== 'Week' || !workspace.calendar || !workspace.anchorDate) return null
  const projection = projectWeek(workspace.calendar, workspace.anchorDate)
  const days = showWeekends ? projection.days : projection.days.filter((day) => !day.isWeekend)
  const start = days[0]?.date ?? projection.startDate
  const end = days[days.length - 1]?.date ?? projection.endDate
  return formatPlanHeaderWeekRange(start, end)
}

function deskWeekRangeLabel(workspace: ReturnType<typeof useArcWorkspace>, showWeekends: boolean) {
  if (workspace.activeView !== 'Week' || !workspace.calendar || !workspace.anchorDate) return null
  const projection = projectWeek(workspace.calendar, workspace.anchorDate)
  const days = showWeekends ? projection.days : projection.days.filter((day) => !day.isWeekend)
  const start = days[0]?.date ?? projection.startDate
  const end = days[days.length - 1]?.date ?? projection.endDate
  const weekIndex = instructionalWeekIndex(workspace.calendar.firstDay, start)
  return formatKellyDeskWeekSecondary(start, end, weekIndex)
}

function instructionalWeekIndex(firstDay: ISODate, weekStart: ISODate): number {
  const origin = Date.parse(`${firstDay}T00:00:00Z`)
  const start = Date.parse(`${weekStart}T00:00:00Z`)
  if (!Number.isFinite(origin) || !Number.isFinite(start) || start < origin) return 1
  const days = Math.floor((start - origin) / 86_400_000)
  return Math.floor(days / 7) + 1
}

function monthLabel(workspace: ReturnType<typeof useArcWorkspace>) {
  if (workspace.activeView !== 'Month' || !workspace.anchorDate) return null
  return formatMonth(workspace.anchorDate)
}

function yearLabel(workspace: ReturnType<typeof useArcWorkspace>) {
  if (workspace.activeView !== 'Year Map' || !workspace.calendar || !workspace.anchorDate) return null
  return `${workspace.calendar.schoolYearLabel} · ${formatPlanHeaderDate(workspace.anchorDate)}`
}

function onboardingStageTitle(draft: OnboardingDraft, capabilities: ReturnType<typeof assessSetupCapabilities>): string {
  const stage = resolveOnboardingStage(draft, capabilities)
  if (stage === 'welcome') return 'Welcome'
  if (stage === 'calendar') return 'School year'
  if (stage === 'classes') return 'Courses & sections'
  if (stage === 'day') return 'Build my day'
  return 'Setup'
}
