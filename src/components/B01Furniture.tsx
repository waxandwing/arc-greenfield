import { useEffect, useRef, useState, type ReactNode } from 'react'
import '../styles/b01-furniture.css'
import '../styles/b01-furniture-fullspace.css'
import '../styles/b01-fridge-content.css'

type DrawerName = 'settings' | 'fridge' | 'tasks'

type Props = {
  settings: ReactNode
  fridge?: ReactNode
  tasks?: ReactNode
  onCleanUpFocus?: () => void
  children: ReactNode
}

const ALL_CLOSED: Record<DrawerName, boolean> = { settings: false, fridge: false, tasks: false }

export function B01Furniture({ settings, fridge, tasks, onCleanUpFocus, children }: Props) {
  const [open, setOpen] = useState<Record<DrawerName, boolean>>(ALL_CLOSED)
  const settingsButton = useRef<HTMLButtonElement>(null)
  const fridgeButton = useRef<HTMLButtonElement>(null)
  const tasksButton = useRef<HTMLButtonElement>(null)
  const cleanUpFocusPending = useRef(false)
  const anyOpen = open.settings || open.fridge || open.tasks

  function toggle(name: DrawerName) {
    setOpen((current) => ({ ...current, [name]: !current[name] }))
  }

  function cleanUp() {
    cleanUpFocusPending.current = true
    setOpen(ALL_CLOSED)
  }

  useEffect(() => {
    if (anyOpen || !cleanUpFocusPending.current) return
    cleanUpFocusPending.current = false
    onCleanUpFocus?.()
  }, [anyOpen, onCleanUpFocus])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return

      const target = event.target instanceof HTMLElement ? event.target : null
      const focusedOwner = target?.closest<HTMLElement>('[data-b01-owner]')?.dataset.b01Owner as DrawerName | undefined
      const active: DrawerName | null =
        focusedOwner && open[focusedOwner]
          ? focusedOwner
          : open.tasks
            ? 'tasks'
            : open.fridge
              ? 'fridge'
              : open.settings
                ? 'settings'
                : null

      if (!active) return
      event.preventDefault()
      setOpen((current) => ({ ...current, [active]: false }))
      const owner = active === 'settings' ? settingsButton : active === 'fridge' ? fridgeButton : tasksButton
      requestAnimationFrame(() => owner.current?.focus())
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <div className="b01-furniture-composition" data-testid="b01-furniture-composition">
      <aside className="b01-side-owner b01-settings-owner" data-b01-owner="settings" data-state={open.settings ? 'open' : 'closed'} aria-label="Settings furniture">
        <img className="b01-furniture-art" src={`/assets/arc-furniture/${open.settings ? '16' : '15'}.svg`} alt="" aria-hidden="true" />
        <button ref={settingsButton} className="b01-edge-tab b01-edge-tab--left" type="button" aria-label="Settings" aria-expanded={open.settings} aria-controls="b01-settings-surface" onClick={() => toggle('settings')}><span aria-hidden="true">Settings</span></button>
        <div id="b01-settings-surface" className="b01-furniture-surface b01-settings-surface" inert={!open.settings ? true : undefined}>
          <p className="b01-furniture-kicker">Settings</p>
          {settings}
        </div>
      </aside>

      <aside className="b01-side-owner b01-fridge-owner" data-b01-owner="fridge" data-state={open.fridge ? 'open' : 'closed'} aria-label="Fridge furniture">
        <img className="b01-furniture-art" src={`/assets/arc-furniture/${open.fridge ? '17' : '18'}.svg`} alt="" aria-hidden="true" />
        <button ref={fridgeButton} className="b01-edge-tab b01-edge-tab--right" type="button" aria-label="Fridge" aria-expanded={open.fridge} aria-controls="b01-fridge-surface" onClick={() => toggle('fridge')}><span aria-hidden="true">Fridge</span></button>
        <div id="b01-fridge-surface" className="b01-furniture-surface b01-fridge-surface" inert={!open.fridge ? true : undefined}>
          <p className="b01-furniture-kicker">Fridge</p>
          {fridge ?? <p className="b01-furniture-empty">No loose planning objects yet.</p>}
        </div>
      </aside>

      <div className="b01-calendar-owner">{children}</div>

      <aside className="b01-task-owner" data-b01-owner="tasks" data-state={open.tasks ? 'open' : 'closed'} aria-label="Task Bar furniture">
        <img className="b01-furniture-art" src={`/assets/arc-furniture/${open.tasks ? '13' : '14'}.svg`} alt="" aria-hidden="true" />
        <button ref={tasksButton} className="b01-task-tab" type="button" aria-label="Task Bar" aria-expanded={open.tasks} aria-controls="b01-task-surface" onMouseDown={(event) => event.preventDefault()} onClick={() => toggle('tasks')}><span aria-hidden="true">Task Bar</span></button>
        {anyOpen ? <button type="button" className="b05-clean-up" onClick={cleanUp}>Clean Up</button> : null}
        <div id="b01-task-surface" className="b01-furniture-surface b01-task-surface" inert={!open.tasks ? true : undefined}>
          {tasks ?? <><div><strong>Must</strong></div><div><strong>Should</strong></div><div><strong>Could</strong></div></>}
        </div>
      </aside>
    </div>
  )
}
