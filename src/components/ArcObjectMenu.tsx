import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

export type ArcObjectMenuItem = {
  id: string
  label: string
  onSelect: () => void
}

export function ArcObjectMenu({
  label,
  items,
  children,
  showMoreButton = true,
}: {
  label: string
  items: ArcObjectMenuItem[]
  children: ReactNode
  showMoreButton?: boolean
}) {
  const menuId = useId()
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function openAt(clientX: number, clientY: number) {
    setCoords({ x: clientX, y: clientY })
    setOpen(true)
  }

  return (
    <div
      className="arc-object-menu-host"
      ref={rootRef}
      onContextMenu={(event) => {
        event.preventDefault()
        openAt(event.clientX, event.clientY)
      }}
    >
      {/* Body keeps title/meta stacking vertical so More cannot crush text into one char/line. */}
      <div className="arc-object-menu-body">{children}</div>
      {showMoreButton ? (
        <button
          type="button"
          className="arc-object-menu-trigger"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={`More actions for ${label}`}
          onClick={(event) => {
            const rect = (event.currentTarget as HTMLButtonElement).getBoundingClientRect()
            openAt(rect.left, rect.bottom + 4)
          }}
        >
          More
        </button>
      ) : null}
      {open && coords ? (
        <ul
          id={menuId}
          className="arc-object-menu"
          role="menu"
          style={{ top: coords.y, left: coords.x }}
        >
          {items.map((item) => (
            <li key={item.id} role="none">
              <button
                type="button"
                role="menuitem"
                className="arc-object-menu-item"
                onClick={() => {
                  item.onSelect()
                  setOpen(false)
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export function promptMoveToDate(current: string, min?: string, max?: string): string | null {
  const next = window.prompt('Move to date (YYYY-MM-DD)', current)
  if (next === null) return null
  const trimmed = next.trim()
  if (!trimmed) return null
  if (min && trimmed < min) return null
  if (max && trimmed > max) return null
  return trimmed
}
