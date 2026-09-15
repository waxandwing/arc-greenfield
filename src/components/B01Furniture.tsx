import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { CalendarView } from '../navigation/calendarViews'
import { calendarViewLabel } from '../navigation/calendarViews'
import type { DeskLayoutState, DeskMoveDirection, DeskObjectKind, DeskViewportProfile } from '../navigation/deskLayout'
import {
  deskLayoutUsesDefault,
  gridAreaStyle,
  placementForObject,
  sizeClassForObject,
  zoneCell,
} from '../navigation/deskLayout'
import type { MscSizePreset, PlannerSizePreset, TraySizePreset } from '../navigation/deskLayout'
import '../styles/b01-furniture.css'
import '../styles/b01-fridge-content.css'
import { DeskGreenFoldersDrawer } from './DeskGreenFoldersDrawer'
import { DeskTodosFolder } from './DeskTodosFolder'
import {
  deskCommittedRasterChromeEnabled,
  deskPlannerEdgeTabAssetUrl,
} from '../desk/deskSliceRuntime'
import { DeskPlannerFrameSlices } from './DeskPlannerFrameSlices'

type DrawerName = 'settings' | 'workspace' | 'tasks'

type ViewAvailability = { available: boolean; reason?: string }

type IndexNavProps = {
  activeView: CalendarView
  planningIndexActive: boolean
  viewSelectionDisabled: boolean
  availabilityFor: (view: CalendarView) => ViewAvailability
  onSelectView: (view: CalendarView) => void
  onOpenPlanningPeriod: () => void
}

type Props = {
  settings: ReactNode
  workspace?: ReactNode
  tasks?: ReactNode
  children: ReactNode
  dismissSideDrawers?: boolean
  openRequest?: { name: DrawerName; token: number } | null
  workspaceOpen?: boolean
  onWorkspaceOpenChange?: (open: boolean) => void
  tasksOpen?: boolean
  onTasksOpenChange?: (open: boolean) => void
  indexNav?: IndexNavProps | null
  spreadChrome?: ReactNode
  deskEnabled?: boolean
  yearExpanded?: boolean
  deskTrayDock?: ReactNode
  deskPriorityDock?: ReactNode
  deskNotesDock?: ReactNode
  deskArcTableFixture?: ReactNode
  deskQuickCapture?: ReactNode
  deskWoodWordmark?: ReactNode
  deskEditMode?: boolean
  deskLayout?: DeskLayoutState | null
  deskViewportProfile?: DeskViewportProfile
  deskSelectedObject?: DeskObjectKind | null
  onSelectDeskObject?: (object: DeskObjectKind) => void
  onMoveDeskObject?: (direction: DeskMoveDirection) => void
  deskEditToolbar?: ReactNode
  deskSizes?: { planner: PlannerSizePreset; tray: TraySizePreset; msc: MscSizePreset }
}

const VIEW_TABS: { view: CalendarView; label: string; tabClass: string }[] = [
  { view: 'Day', label: 'DAY', tabClass: 'arc-index-tab--day' },
  { view: 'Week', label: 'WEEK', tabClass: 'arc-index-tab--week' },
  { view: 'Month', label: 'MONTH', tabClass: 'arc-index-tab--month' },
  { view: 'Year Map', label: 'YEAR', tabClass: 'arc-index-tab--year' },
]

export function B01Furniture({
  settings,
  workspace,
  tasks,
  children,
  dismissSideDrawers = false,
  openRequest = null,
  workspaceOpen,
  onWorkspaceOpenChange,
  tasksOpen,
  onTasksOpenChange,
  indexNav = null,
  spreadChrome = null,
  deskEnabled = false,
  yearExpanded = false,
  deskTrayDock = null,
  deskPriorityDock = null,
  deskNotesDock = null,
  deskArcTableFixture = null,
  deskQuickCapture = null,
  deskWoodWordmark = null,
  deskEditMode = false,
  deskLayout = null,
  deskViewportProfile = 'desktop',
  deskSelectedObject = null,
  onSelectDeskObject,
  onMoveDeskObject,
  deskEditToolbar = null,
  deskSizes = { planner: 'standard', tray: 'standard', msc: 'standard' },
}: Props) {
  const [open, setOpen] = useState<Record<DrawerName, boolean>>({ settings: false, workspace: false, tasks: false })
  const settingsButton = useRef<HTMLButtonElement>(null)
  const workspaceButton = useRef<HTMLButtonElement>(null)
  const workspaceIsOpen = workspaceOpen ?? open.workspace
  const tasksIsOpen = tasksOpen ?? open.tasks

  function toggle(name: DrawerName) {
    if (name === 'workspace') {
      setOpen({ settings: false, workspace: workspaceOpen === undefined ? !open.workspace : false, tasks: false })
      onWorkspaceOpenChange?.(!workspaceIsOpen)
      onTasksOpenChange?.(false)
      return
    }
    if (name === 'settings') {
      const nextOpen = !open.settings
      setOpen({ settings: nextOpen, workspace: false, tasks: false })
      onWorkspaceOpenChange?.(false)
      onTasksOpenChange?.(false)
      return
    }
    const nextOpen = !tasksIsOpen
    setOpen({ settings: false, workspace: false, tasks: nextOpen })
    onWorkspaceOpenChange?.(false)
    onTasksOpenChange?.(nextOpen)
  }

  function close(name: DrawerName) {
    if (name === 'workspace') {
      setOpen((current) => ({ ...current, workspace: false }))
      onWorkspaceOpenChange?.(false)
    } else if (name === 'tasks') {
      setOpen((current) => ({ ...current, tasks: false }))
      onTasksOpenChange?.(false)
    } else {
      setOpen((current) => ({ ...current, [name]: false }))
    }
    const owner = name === 'settings' || name === 'tasks' ? settingsButton : workspaceButton
    requestAnimationFrame(() => owner.current?.focus())
  }

  function selectViewTab(view: CalendarView) {
    if (!indexNav || indexNav.viewSelectionDisabled) return
    const availability = indexNav.availabilityFor(view)
    if (!availability.available) return
    setOpen({ settings: false, workspace: false, tasks: false })
    onWorkspaceOpenChange?.(false)
    onTasksOpenChange?.(false)
    indexNav.onSelectView(view)
  }

  function openPlanningTab() {
    if (!indexNav || indexNav.viewSelectionDisabled) return
    setOpen({ settings: false, workspace: false, tasks: false })
    onWorkspaceOpenChange?.(false)
    onTasksOpenChange?.(false)
    indexNav.onOpenPlanningPeriod()
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      const active: DrawerName | null = tasksIsOpen ? 'tasks' : workspaceIsOpen ? 'workspace' : open.settings ? 'settings' : null
      if (!active) return
      event.preventDefault()
      if (active === 'workspace') {
        setOpen((current) => ({ ...current, workspace: false }))
        onWorkspaceOpenChange?.(false)
      } else if (active === 'tasks') {
        setOpen((current) => ({ ...current, tasks: false }))
        onTasksOpenChange?.(false)
      } else {
        setOpen((current) => ({ ...current, [active]: false }))
      }
      const owner = active === 'workspace' ? workspaceButton : settingsButton
      requestAnimationFrame(() => owner.current?.focus())
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, workspaceIsOpen, tasksIsOpen, onWorkspaceOpenChange, onTasksOpenChange])

  useEffect(() => {
    if (tasksOpen === undefined) return
    setOpen((current) => ({
      ...current,
      tasks: tasksOpen,
      settings: tasksOpen ? false : current.settings,
      workspace: tasksOpen ? false : current.workspace,
    }))
  }, [tasksOpen])

  useEffect(() => {
    if (!dismissSideDrawers) return
    setOpen((current) => current.settings || current.workspace ? { ...current, settings: false, workspace: false } : current)
    if (workspaceIsOpen) onWorkspaceOpenChange?.(false)
  }, [dismissSideDrawers])

  useEffect(() => {
    if (!deskEditMode) return
    setOpen((current) => ({ ...current, settings: false, workspace: false, tasks: false }))
    onWorkspaceOpenChange?.(false)
    onTasksOpenChange?.(false)
  }, [deskEditMode, onTasksOpenChange, onWorkspaceOpenChange])

  useEffect(() => {
    if (!deskEditMode || !onMoveDeskObject) return
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) return
      const map: Record<string, DeskMoveDirection> = {
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'up',
        ArrowDown: 'down',
      }
      const direction = map[event.key]
      if (!direction || !onMoveDeskObject) return
      event.preventDefault()
      onMoveDeskObject(direction)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [deskEditMode, onMoveDeskObject])

  function deskObjectStyle(object: DeskObjectKind): CSSProperties | undefined {
    if (!deskLayout || !deskEnabled) return undefined
    const zone = placementForObject(deskLayout, object).zone
    return gridAreaStyle(zoneCell(zone, deskViewportProfile))
  }

  function deskObjectClass(object: DeskObjectKind, base: string): string {
    const sizeClass = sizeClassForObject(object, deskSizes)
    const selected = deskEditMode && deskSelectedObject === object
    return [
      base,
      sizeClass,
      deskEditMode ? 'arc-desk-edit-object' : '',
      selected ? 'arc-desk-edit-object--selected' : '',
    ].filter(Boolean).join(' ')
  }

  function wrapDeskObject(object: DeskObjectKind, label: string, node: ReactNode | null) {
    if (!node) return null
    return (
      <div
        className={deskObjectClass(object, `arc-desk-object-slot${deskEditMode ? '' : ' arc-desk-object-slot--locked'}`)}
        style={deskObjectStyle(object)}
        data-desk-object={object}
        tabIndex={deskEditMode ? 0 : undefined}
        role={deskEditMode ? 'button' : undefined}
        aria-label={deskEditMode ? `${label} desk object` : undefined}
        aria-pressed={deskEditMode && deskSelectedObject === object ? true : undefined}
        onFocus={() => deskEditMode && onSelectDeskObject?.(object)}
        onClick={() => deskEditMode && onSelectDeskObject?.(object)}
      >
        {node}
      </div>
    )
  }

  useEffect(() => {
    if (!openRequest) return
    setOpen({
      settings: openRequest.name === 'settings',
      workspace: openRequest.name === 'workspace' && workspaceOpen === undefined,
      tasks: openRequest.name === 'tasks',
    })
    onWorkspaceOpenChange?.(openRequest.name === 'workspace')
  }, [openRequest?.token])

  const sidePanel = open.settings ? 'settings' : workspaceIsOpen ? 'workspace' : tasksIsOpen ? 'tasks' : 'none'
  const workspaceTabLabel = deskEnabled ? 'TRAY' : 'WORKSPACE'
  const workspacePanelLabel = deskEnabled ? 'Tray' : 'Workspace'
  const layoutGridActive =
    deskEnabled && Boolean(deskLayout) && (deskEditMode || !deskLayoutUsesDefault(deskLayout!))
  /** Physical folders drawer on wood; full TRAY drawer reuses the same panel — never both. */
  const showDeskTrayDock = Boolean(deskTrayDock) && !workspaceIsOpen

  function renderDeskTrayDock() {
    if (!showDeskTrayDock) return null
    return <DeskGreenFoldersDrawer defaultExtended={false}>{deskTrayDock}</DeskGreenFoldersDrawer>
  }

  function renderPlannerViewTabs(className: string) {
    if (!indexNav) return null
    const rasterChrome = deskEnabled && deskCommittedRasterChromeEnabled()
    return (
      <nav
        className={className}
        aria-label="Planner index"
        data-testid="arc-planner-physical-tabs"
        data-desk-slices={rasterChrome ? 'true' : 'false'}
      >
        {VIEW_TABS.map(({ view, label, tabClass }) => {
          const availability = indexNav.availabilityFor(view)
          const unavailable = !availability.available
          const isCurrent = !indexNav.planningIndexActive && view === indexNav.activeView && !workspaceIsOpen && !open.settings && !tasksIsOpen
          const tabArt = rasterChrome ? deskPlannerEdgeTabAssetUrl(label, isCurrent) : null
          return (
            <button
              key={view}
              type="button"
              className={`arc-index-tab ${tabClass}${rasterChrome ? ' arc-index-tab--desk-slice' : ''}${isCurrent && rasterChrome ? ' arc-index-tab--desk-slice-active' : ''}`}
              aria-current={isCurrent ? 'page' : undefined}
              aria-disabled={unavailable || indexNav.viewSelectionDisabled ? 'true' : undefined}
              title={unavailable ? availability.reason : calendarViewLabel(view)}
              disabled={indexNav.viewSelectionDisabled || unavailable}
              data-desk-slice-tab={label.toLowerCase()}
              style={tabArt ? { backgroundImage: `url(${tabArt})` } : undefined}
              onClick={() => selectViewTab(view)}
            >
              {label}
            </button>
          )
        })}
      </nav>
    )
  }

  function renderDeskUtilityTabs() {
    if (!indexNav || !deskEnabled) return null
    return (
      <nav className="arc-desk-utility-tabs" aria-label="Desk utilities" data-testid="arc-desk-utility-tabs">
        <button
          type="button"
          className="arc-index-tab arc-index-tab--planning"
          aria-current={indexNav.planningIndexActive && !workspaceIsOpen && !open.settings && !tasksIsOpen ? 'page' : undefined}
          disabled={indexNav.viewSelectionDisabled}
          onClick={openPlanningTab}
        >
          PLANNING
        </button>
        <button
          ref={workspaceButton}
          type="button"
          className="arc-index-tab arc-index-tab--workspace"
          aria-expanded={workspaceIsOpen}
          aria-controls="b01-fridge-surface"
          aria-current={workspaceIsOpen ? 'page' : undefined}
          onClick={() => toggle('workspace')}
        >
          {workspaceTabLabel}
        </button>
        <button
          ref={settingsButton}
          type="button"
          className="arc-index-tab arc-index-tab--settings"
          aria-expanded={open.settings}
          aria-controls="b01-settings-surface"
          aria-current={open.settings ? 'page' : undefined}
          onClick={() => toggle('settings')}
        >
          SETTINGS
        </button>
      </nav>
    )
  }

  function renderIndexTabs(className: string) {
    if (!indexNav) return null
    return (
      <nav className={className} aria-label="Planner index" data-testid={className.includes('arc-planner-physical-tabs') ? 'arc-planner-physical-tabs' : undefined}>
        {VIEW_TABS.map(({ view, label, tabClass }) => {
          const availability = indexNav.availabilityFor(view)
          const unavailable = !availability.available
          const isCurrent = !indexNav.planningIndexActive && view === indexNav.activeView && !workspaceIsOpen && !open.settings && !tasksIsOpen
          return (
            <button
              key={view}
              type="button"
              className={`arc-index-tab ${tabClass}`}
              aria-current={isCurrent ? 'page' : undefined}
              aria-disabled={unavailable || indexNav.viewSelectionDisabled ? 'true' : undefined}
              title={unavailable ? availability.reason : calendarViewLabel(view)}
              disabled={indexNav.viewSelectionDisabled || unavailable}
              onClick={() => selectViewTab(view)}
            >
              {label}
            </button>
          )
        })}
        <button
          type="button"
          className="arc-index-tab arc-index-tab--planning"
          aria-current={indexNav.planningIndexActive && !workspaceIsOpen && !open.settings && !tasksIsOpen ? 'page' : undefined}
          disabled={indexNav.viewSelectionDisabled}
          onClick={openPlanningTab}
        >
          PLANNING
        </button>
        <button
          ref={workspaceButton}
          type="button"
          className="arc-index-tab arc-index-tab--workspace"
          aria-expanded={workspaceIsOpen}
          aria-controls="b01-fridge-surface"
          aria-current={workspaceIsOpen ? 'page' : undefined}
          onClick={() => toggle('workspace')}
        >
          {workspaceTabLabel}
        </button>
        <button
          ref={settingsButton}
          type="button"
          className="arc-index-tab arc-index-tab--settings"
          aria-expanded={open.settings}
          aria-controls="b01-settings-surface"
          aria-current={open.settings ? 'page' : undefined}
          onClick={() => toggle('settings')}
        >
          SETTINGS
        </button>
      </nav>
    )
  }

  return (
    <div
      className={`b01-furniture-composition${deskEnabled ? ' b01-furniture-composition--desk' : ''}${yearExpanded ? ' b01-furniture-composition--year-expanded' : ''}`}
      data-workspace-open={workspaceIsOpen ? 'true' : 'false'}
      data-desk-edit={deskEditMode ? 'true' : 'false'}
    >
      {deskEnabled ? (
        <div className="arc-desk-viewport">
          <div className="arc-desk-tabletop">
            <div className="arc-desk-surface" data-layout-grid={layoutGridActive ? 'true' : 'false'}>
              {wrapDeskObject('tray', 'Tray', renderDeskTrayDock())}
              {wrapDeskObject('priorities', 'Priorities', deskPriorityDock)}
              {wrapDeskObject('notes', 'Notes', deskNotesDock)}
              {wrapDeskObject('arctable', 'ArcTable', deskArcTableFixture)}
              {wrapDeskObject('capture', 'Quick capture', deskQuickCapture)}
              {deskWoodWordmark}
              <div className={deskObjectClass('planner', 'arc-planner-object')} onClick={() => deskEditMode && onSelectDeskObject?.('planner')}>
                {rasterChromeEnabled(renderPlannerViewTabs) ? <DeskPlannerFrameSlices /> : null}
                {spreadChrome}
                {renderPlannerViewTabs('arc-planner-physical-tabs arc-planner-physical-tabs--desk-edge')}
                {children}
              </div>
              {renderDeskUtilityTabs()}
              {deskEditToolbar}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="b01-side-rail">{renderIndexTabs('arc-index-tabs')}</div>
          <div className="b01-calendar-owner">{children}</div>
        </>
      )}
      <aside
        id="b01-settings-surface"
        className={`b01-settings-surface${sidePanel === 'settings' ? ' b01-settings-surface--open' : ''}`}
        aria-hidden={sidePanel !== 'settings'}
      >
        {settings}
        <button type="button" className="b01-close-control" onClick={() => close('settings')}>Close</button>
      </aside>
      <aside
        id="b01-fridge-surface"
        className={`b01-fridge-surface${sidePanel === 'workspace' ? ' b01-fridge-surface--open' : ''}`}
        aria-hidden={sidePanel !== 'workspace'}
      >
        <div className="b01-fridge-surface__header">
          <strong>{workspacePanelLabel}</strong>
          <button type="button" className="b01-close-control" onClick={() => close('workspace')}>Close</button>
        </div>
        {workspace}
      </aside>
      <aside
        id="b01-tasks-surface"
        className={`b01-tasks-surface${sidePanel === 'tasks' ? ' b01-tasks-surface--open' : ''}`}
        aria-hidden={sidePanel !== 'tasks'}
      >
        {tasks}
        <button type="button" className="b01-close-control" onClick={() => close('tasks')}>Close</button>
      </aside>
    </div>
  )
}

function rasterChromeEnabled(_renderTabs: (className: string) => ReactNode): boolean {
  return deskCommittedRasterChromeEnabled()
}
