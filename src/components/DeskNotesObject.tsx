import type { ReactNode } from 'react'

type Props = {
  children?: ReactNode
  /** When true, renders as a planner header strip (not a floating wood dock pad). */
  strip?: boolean
}

/** Secondary desk notes pad — lives under weekday/date headers when desk notes are enabled. */
export function DeskNotesObject({ children, strip = false }: Props) {
  return (
    <div
      className={`arc-desk-notes-object${strip ? ' arc-desk-notes-object--strip' : ''}`}
      data-testid="arc-desk-notes-object"
      data-notes-placement={strip ? 'planner-header' : 'dock'}
    >
      <p className="arc-desk-notes-object-label">Day notes</p>
      <div className="arc-desk-notes-object-body">
        {children ?? <p className="b01-furniture-empty">Open Day or Month to edit notes on dates.</p>}
      </div>
    </div>
  )
}
