import { useEffect, useRef, useState, type ReactNode } from 'react'
import '../styles/b01-furniture.css'
import '../styles/b01-fridge-content.css'

type DrawerName = 'settings' | 'workspace' | 'tasks'

type Props = {
  settings: ReactNode
  workspace?: ReactNode
  tasks?: ReactNode
  children: ReactNode
  dismissSideDrawers?: boolean
  openRequest?: { name: DrawerName; token: number } | null
  workspaceOpen?: boolean
  onWorkspaceOpenChange?: (open: boolean) => void
}

export function B01Furniture({ settings, workspace, tasks, children, dismissSideDrawers = false, openRequest = null, workspaceOpen, onWorkspaceOpenChange }: Props) {
  const [open, setOpen] = useState<Record<DrawerName, boolean>>({ settings: false, workspace: false, tasks: false })
  const settingsButton = useRef<HTMLButtonElement>(null)
  const workspaceButton = useRef<HTMLButtonElement>(null)
  const tasksButton = useRef<HTMLButtonElement>(null)
  const workspaceIsOpen = workspaceOpen ?? open.workspace

  function toggle(name: DrawerName) {
    if (name === 'workspace') {
      setOpen({ settings: false, workspace: workspaceOpen === undefined ? !open.workspace : false, tasks: false })
      onWorkspaceOpenChange?.(!workspaceIsOpen)
      return
    }
    const nextOpen = name === 'settings' ? !open.settings : !open.tasks
    setOpen({
      settings: name === 'settings' && nextOpen,
      workspace: false,
      tasks: name === 'tasks' && nextOpen,
    })
    onWorkspaceOpenChange?.(false)
  }

  function close(name: DrawerName) {
    if (name === 'workspace') {
      setOpen((current) => ({ ...current, workspace: false }))
      onWorkspaceOpenChange?.(false)
    } else {
      setOpen((current) => ({ ...current, [name]: false }))
    }
    const owner = name === 'settings' ? settingsButton : name === 'workspace' ? workspaceButton : tasksButton
    requestAnimationFrame(() => owner.current?.focus())
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      const active: DrawerName | null = open.tasks ? 'tasks' : workspaceIsOpen ? 'workspace' : open.settings ? 'settings' : null
      if (!active) return
      event.preventDefault()
      if (active === 'workspace') {
        setOpen((current) => ({ ...current, workspace: false }))
        onWorkspaceOpenChange?.(false)
      } else {
        setOpen((current) => ({ ...current, [active]: false }))
      }
      const owner = active === 'settings' ? settingsButton : active === 'workspace' ? workspaceButton : tasksButton
      requestAnimationFrame(() => owner.current?.focus())
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, workspaceIsOpen, onWorkspaceOpenChange])

  useEffect(() => {
    if (!dismissSideDrawers) return
    setOpen((current) => current.settings || current.workspace ? { ...current, settings: false, workspace: false } : current)
    if (workspaceIsOpen) onWorkspaceOpenChange?.(false)
  }, [dismissSideDrawers])

  useEffect(() => {
    if (!openRequest) return
    setOpen({
      settings: openRequest.name === 'settings',
      workspace: openRequest.name === 'workspace' && workspaceOpen === undefined,
      tasks: openRequest.name === 'tasks',
    })
    onWorkspaceOpenChange?.(openRequest.name === 'workspace')
  }, [openRequest?.token])

  return (
    <div className="b01-furniture-composition" data-testid="b01-furniture-composition" data-workspace-open={workspaceIsOpen ? 'true' : 'false'}>
      <nav className="b01-utility-rail" aria-label="Plan tools">
        <span className="b01-utility-label">Plan tools</span>
        <aside className="b01-tool-owner b01-settings-owner" data-state={open.settings ? 'open' : 'closed'} aria-label="Settings furniture">
          <button ref={settingsButton} className="b01-tool-trigger" type="button" aria-expanded={open.settings} aria-controls="b01-settings-surface" onClick={() => toggle('settings')}>Settings</button>
          <div id="b01-settings-surface" className="b01-furniture-surface b01-settings-surface" inert={!open.settings ? true : undefined}>
            <div className="b01-surface-heading"><p className="b01-furniture-kicker">Settings</p><button type="button" onClick={() => close('settings')} aria-label="Close Settings">Close</button></div>
            {settings}
          </div>
        </aside>

        <aside className="b01-tool-owner b01-fridge-owner" data-state={workspaceIsOpen ? 'open' : 'closed'} aria-label="Workspace furniture">
          <button ref={workspaceButton} className="b01-tool-trigger" type="button" aria-expanded={workspaceIsOpen} aria-controls="b01-fridge-surface" onClick={() => toggle('workspace')}>Workspace</button>
          <div id="b01-fridge-surface" className="b01-furniture-surface b01-fridge-surface" inert={!workspaceIsOpen ? true : undefined}>
            <div className="b01-surface-heading"><p className="b01-furniture-kicker">Workspace</p><button type="button" onClick={() => close('workspace')} aria-label="Close Workspace">Close</button></div>
            {workspace ?? <p className="b01-furniture-empty">No loose planning material yet.</p>}
          </div>
        </aside>

        <aside className="b01-tool-owner b01-task-owner" data-state={open.tasks ? 'open' : 'closed'} aria-label="Task Bar furniture">
          <button ref={tasksButton} className="b01-tool-trigger" type="button" aria-expanded={open.tasks} aria-controls="b01-task-surface" onClick={() => toggle('tasks')}>Tasks</button>
          <div id="b01-task-surface" className="b01-furniture-surface b01-task-surface" inert={!open.tasks ? true : undefined}>
            <div className="b01-surface-heading"><p className="b01-furniture-kicker">Tasks</p><button type="button" onClick={() => close('tasks')} aria-label="Close Tasks">Close</button></div>
            {tasks ?? <><div><strong>Must</strong></div><div><strong>Should</strong></div><div><strong>Could</strong></div></>}
          </div>
        </aside>
      </nav>

      <div className="b01-calendar-owner">{children}</div>
    </div>
  )
}
