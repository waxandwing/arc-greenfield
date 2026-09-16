import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
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
import '../styles/b01-settings-content.css'
import { DeskAccentPostIts } from './DeskAccentPostIts'
import { DeskGreenFoldersDrawer } from './DeskGreenFoldersDrawer'
import { DeskHelpButton } from './DeskHelpButton'
import { DeskTodosFolder } from './DeskTodosFolder'
import {
  deskCommittedRasterChromeEnabled,
  deskPlannerEdgeTabAssetUrl,
} from '../desk/deskSliceRuntime'
import { deskCanonicalPngUrl } from '../desk/deskCanonicalPng'
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
  /** Enlarged / pop-out calendar — suppress wood wordmark slide-in. */
  calendarEnlarged?: boolean
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

/** Kelly Teaching-week edge tabs: upright icon + label (not rotated side-rail text). */
const EDGE_TAB_ICONS: Record<string, ReactNode> = {
  DAY: (
    <svg className="arc-index-tab-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 3.5v3M16 3.5v3M4 9.5h16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <text x="12" y="17.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="currentColor">
        1
      </text>
    </svg>
  ),
  WEEK: (
    <svg className="arc-index-tab-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M5 6.5c0-.8.7-1.5 1.5-1.5H11v14H6.5A1.5 1.5 0 0 1 5 17.5v-11Zm14 0v11a1.5 1.5 0 0 1-1.5 1.5H13V5h4.5c.8 0 1.5.7 1.5 1.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  ),
  MONTH: (
    <svg className="arc-index-tab-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 3.5v3M16 3.5v3M4 9.5h16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M8 13h2M12 13h2M16 13h0M8 16.5h2M12 16.5h2M16 16.5h0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  ),
  YEAR: (
    <svg className="arc-index-tab-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6 17V11M12 17V8M18 17V5" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" />
    </svg>
  ),
  // Interim edge-tab glyph only — Kelly `settings-tab.svg` (USE) remains BLOCKED until binary lands.
  SETTINGS: (
    <svg className="arc-index-tab-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6.1 6.1l1.6 1.6M16.3 16.3l1.6 1.6M6.1 17.9l1.6-1.6M16.3 7.7l1.6-1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  ),
}

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
  calendarEnlarged = false,
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
  const settingsSurface = useRef<HTMLDivElement>(null)
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

  // Click desk / outside the settings sheet to dismiss (same as Close). Keep the SETTINGS
  // edge/index tab out of the hit test so its toggle click is not swallowed by a close+reopen.
  useEffect(() => {
    if (!open.settings) return
    function closeOnOutsidePointer(event: PointerEvent) {
      const target = event.target as Node | null
      if (!target) return
      if (settingsSurface.current?.contains(target)) return
      if (settingsButton.current?.contains(target)) return
      setOpen((current) => ({ ...current, settings: false }))
      requestAnimationFrame(() => settingsButton.current?.focus())
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [open.settings])

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
    const movable = deskEditMode && object !== 'planner' && Boolean(onMoveDeskObject)
    return (
      <div
        className={deskObjectClass(object, `arc-desk-object-slot${deskEditMode ? '' : ' arc-desk-object-slot--locked'}`)}
        style={deskObjectStyle(object)}
        data-desk-object={object}
        tabIndex={deskEditMode ? 0 : undefined}
        role={deskEditMode ? 'button' : undefined}
        aria-label={deskEditMode ? `${label} desk object${movable ? '. Drag or use arrow keys to move.' : ''}` : undefined}
        aria-pressed={deskEditMode && deskSelectedObject === object ? true : undefined}
        onFocus={() => deskEditMode && onSelectDeskObject?.(object)}
        onClick={() => deskEditMode && onSelectDeskObject?.(object)}
        onPointerDown={(event: ReactPointerEvent<HTMLDivElement>) => {
          if (!movable) return
          if (event.button !== 0) return
          const target = event.target as HTMLElement | null
          if (target?.closest('button, a, input, textarea, select, [contenteditable="true"]')) return
          onSelectDeskObject?.(object)
          const startX = event.clientX
          const startY = event.clientY
          const pointerId = event.pointerId
          const el = event.currentTarget
          el.setPointerCapture(pointerId)
          el.classList.add('arc-desk-edit-object--dragging')
          let moved = false
          function onMove(moveEvent: PointerEvent) {
            const dx = moveEvent.clientX - startX
            const dy = moveEvent.clientY - startY
            if (!moved && Math.hypot(dx, dy) < 28) return
            moved = true
            const dominant = Math.abs(dx) >= Math.abs(dy)
            if (dominant) onMoveDeskObject?.(dx > 0 ? 'right' : 'left')
            else onMoveDeskObject?.(dy > 0 ? 'down' : 'up')
            cleanup()
          }
          function onUp() {
            cleanup()
          }
          function cleanup() {
            el.classList.remove('arc-desk-edit-object--dragging')
            try {
              el.releasePointerCapture(pointerId)
            } catch {
              /* already released */
            }
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
            window.removeEventListener('pointercancel', onUp)
          }
          window.addEventListener('pointermove', onMove)
          window.addEventListener('pointerup', onUp)
          window.addEventListener('pointercancel', onUp)
        }}
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
  /** IDEAS green drawer stays on every desk calendar view; TRAY utility panel reuses content when open — never both. */
  const showDeskTrayDock = deskEnabled && !workspaceIsOpen

  function renderDeskTrayDock() {
    if (!showDeskTrayDock) return null
    return (
      <DeskGreenFoldersDrawer defaultExtended={false}>
        {deskTrayDock ?? <p className="b01-furniture-empty arc-desk-ideas-empty">Captures land here in IDEAS.</p>}
      </DeskGreenFoldersDrawer>
    )
  }

  function renderPlannerViewTabs(className: string) {
    if (!indexNav) return null
    const edgeTabSlices = deskEnabled && deskCommittedRasterChromeEnabled()
    return (
      <nav
        className={className}
        aria-label="Planner index"
        data-testid="arc-planner-physical-tabs"
        data-desk-slices={edgeTabSlices ? 'true' : 'false'}
      >
        {VIEW_TABS.map(({ view, label, tabClass }) => {
          const availability = indexNav.availabilityFor(view)
          const unavailable = !availability.available
          const isCurrent = view === indexNav.activeView && !workspaceIsOpen && !open.settings && !tasksIsOpen
          const tabArt = edgeTabSlices ? deskPlannerEdgeTabAssetUrl(label, isCurrent) : null
          return (
            <button
              key={view}
              type="button"
              className={`arc-index-tab ${tabClass}${edgeTabSlices ? ' arc-index-tab--desk-slice' : ''}${isCurrent && edgeTabSlices ? ' arc-index-tab--desk-slice-active' : ''}`}
              aria-current={isCurrent ? 'page' : undefined}
              aria-disabled={unavailable || indexNav.viewSelectionDisabled ? 'true' : undefined}
              title={unavailable ? availability.reason : calendarViewLabel(view)}
              disabled={indexNav.viewSelectionDisabled || unavailable}
              data-desk-slice-tab={label.toLowerCase()}
              style={tabArt ? { backgroundImage: `url(${tabArt})` } : undefined}
              onClick={() => selectViewTab(view)}
            >
              <span className="arc-index-tab-face" aria-hidden="true">
                {EDGE_TAB_ICONS[label]}
              </span>
              <span className="arc-index-tab-label">{label}</span>
            </button>
          )
        })}
        <button
          ref={settingsButton}
          type="button"
          className={`arc-index-tab arc-index-tab--settings${edgeTabSlices ? ' arc-index-tab--desk-slice' : ''}${open.settings && edgeTabSlices ? ' arc-index-tab--desk-slice-active' : ''}`}
          data-testid="arc-planner-settings-edge-tab"
          data-desk-slice-tab="settings"
          data-desk-kelly-asset="settings-tab"
          aria-expanded={open.settings}
          aria-controls="b01-settings-surface"
          aria-current={open.settings ? 'page' : undefined}
          title="Settings"
          style={{ backgroundImage: `url(${deskCanonicalPngUrl('settingsTab')})` }}
          onClick={() => toggle('settings')}
        >
          <span className="arc-index-tab-face" aria-hidden="true">
            {EDGE_TAB_ICONS.SETTINGS}
          </span>
          <span className="arc-index-tab-label">SETTINGS</span>
        </button>
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
          aria-pressed={indexNav.planningIndexActive && !workspaceIsOpen && !open.settings && !tasksIsOpen ? true : undefined}
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
          const isCurrent = view === indexNav.activeView && !workspaceIsOpen && !open.settings && !tasksIsOpen
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
          aria-pressed={indexNav.planningIndexActive && !workspaceIsOpen && !open.settings && !tasksIsOpen ? true : undefined}
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

  const plannerEdgeTabsClass =
    'arc-index-tabs arc-planner-physical-tabs arc-planner-physical-tabs--desk-edge'

  const plannerBlock = (
    <div className="arc-planner-object">
      {deskEnabled
        ? renderPlannerViewTabs(plannerEdgeTabsClass)
        : null}
      {!deskEnabled ? renderIndexTabs('arc-index-tabs') : null}
      <div className={`arc-calendar-spread${deskEnabled ? ' arc-calendar-spread--desk' : ''}`}>
        {deskEnabled ? <DeskPlannerFrameSlices /> : null}
        {spreadChrome}
        {deskEditToolbar}
        <div className={`b01-calendar-owner${deskEditMode ? ' b01-calendar-owner--workspace-edit' : ''}`}>{children}</div>
      </div>
    </div>
  )

  return (
    <div
      className={`b01-furniture-composition${deskEnabled ? ' b01-furniture-composition--desk' : ''}${yearExpanded ? ' b01-furniture-composition--year-expanded' : ''}${deskEditMode ? ' b01-furniture-composition--desk-edit' : ''}`}
      data-testid="b01-furniture-composition"
      data-workspace-open={workspaceIsOpen ? 'true' : 'false'}
      data-settings-open={open.settings ? 'true' : 'false'}
      data-side-panel={sidePanel}
      data-desk-enabled={deskEnabled ? 'true' : 'false'}
      data-desk-edit-mode={deskEditMode ? 'true' : 'false'}
      data-year-expanded={yearExpanded ? 'true' : 'false'}
      data-calendar-enlarged={calendarEnlarged ? 'true' : 'false'}
    >
      {deskEnabled ? (
        <div className="arc-desk-viewport" data-testid="arc-desk-viewport">
          <div className="arc-desk-tabletop" data-testid="arc-desk-tabletop">
            {deskWoodWordmark ? <div className="arc-desk-wood-wordmark-slot">{deskWoodWordmark}</div> : null}
            {renderDeskUtilityTabs()}
            <div
              className={`arc-desk-surface${deskEditMode ? ' arc-desk-surface--edit' : ''}`}
              data-layout-grid={layoutGridActive ? 'true' : 'false'}
              data-furniture-locked={deskEditMode ? 'false' : 'true'}
            >
              <DeskHelpButton />
              {deskEditMode ? <div className="arc-desk-zone-grid" aria-hidden="true" /> : null}
              {layoutGridActive ? (
                <>
                  {wrapDeskObject('planner', 'Planner', plannerBlock)}
                  {wrapDeskObject('tray', 'Tray', renderDeskTrayDock())}
                  {wrapDeskObject('msc', 'Must Should Could', deskPriorityDock ? (
                    <aside className="arc-desk-priority-dock" aria-label="Must Should Could pad" data-testid="arc-desk-priority-dock">
                      <DeskTodosFolder>{deskPriorityDock}</DeskTodosFolder>
                    </aside>
                  ) : null)}
                  {wrapDeskObject('arctable', 'ArcTable', deskArcTableFixture ? (
                    <div className="arc-desk-arctable-anchor" data-testid="arc-desk-arctable-anchor">{deskArcTableFixture}</div>
                  ) : null)}
                  {wrapDeskObject('notes', 'Desk notes', deskNotesDock ? (
                    <aside className="arc-desk-notes-dock" aria-label="Desk notes">{deskNotesDock}</aside>
                  ) : null)}
                </>
              ) : (
                <>
                  {plannerBlock}
                  {renderDeskTrayDock()}
                  {deskPriorityDock ? (
                    <aside className="arc-desk-priority-dock" aria-label="Must Should Could pad" data-testid="arc-desk-priority-dock">
                      <DeskTodosFolder>{deskPriorityDock}</DeskTodosFolder>
                    </aside>
                  ) : null}
                  {deskNotesDock ? (
                    <aside className="arc-desk-notes-dock" aria-label="Desk notes">{deskNotesDock}</aside>
                  ) : null}
                  {deskArcTableFixture ? (
                    <div className="arc-desk-arctable-anchor" data-testid="arc-desk-arctable-anchor">{deskArcTableFixture}</div>
                  ) : null}
                </>
              )}
              {deskQuickCapture ? deskQuickCapture : null}
              {/* Independent of IDEAS tray chrome (incl. future landscape tray) */}
              <DeskAccentPostIts />
            </div>
          </div>
        </div>
      ) : (
        plannerBlock
      )}

      <div className={`b01-side-rail b01-index-rail${deskEnabled ? ' b01-side-rail--desk-overlays' : ''}`}>
        {!deskEnabled ? renderIndexTabs('arc-index-tabs') : null}

        <div className="b01-side-panels">
          <aside className="b01-tool-owner b01-settings-owner" data-state={open.settings ? 'open' : 'closed'} aria-label="Settings furniture">
            <div
              id="b01-settings-surface"
              ref={settingsSurface}
              className="b01-furniture-surface b01-settings-surface"
              inert={!open.settings ? true : undefined}
            >
              <div className="b01-surface-heading"><p className="b01-furniture-kicker">Settings</p><button type="button" onClick={() => close('settings')} aria-label="Close Settings">Close</button></div>
              {settings}
            </div>
          </aside>

          <aside className="b01-tool-owner b01-fridge-owner" data-state={workspaceIsOpen ? 'open' : 'closed'} aria-label={`${workspacePanelLabel} furniture`}>
            <div id="b01-fridge-surface" className={`b01-furniture-surface b01-fridge-surface${deskEnabled ? ' b01-tray-surface' : ''}`} inert={!workspaceIsOpen ? true : undefined}>
              <div className="b01-surface-heading"><p className="b01-furniture-kicker">{workspacePanelLabel}</p><button type="button" onClick={() => close('workspace')} aria-label={`Close ${workspacePanelLabel}`}>Close</button></div>
              {workspace ?? <p className="b01-furniture-empty">No loose planning material yet.</p>}
            </div>
          </aside>

          <aside className="b01-tool-owner b01-task-owner" data-state={tasksIsOpen ? 'open' : 'closed'} aria-label="Task Bar furniture">
            <div id="b01-task-surface" className="b01-furniture-surface b01-task-surface" inert={!tasksIsOpen ? true : undefined}>
              <div className="b01-surface-heading"><p className="b01-furniture-kicker">Tasks</p><button type="button" onClick={() => close('tasks')} aria-label="Close Tasks">Close</button></div>
              {tasks ?? <><div><strong>Must</strong></div><div><strong>Should</strong></div><div><strong>Could</strong></div></>}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
