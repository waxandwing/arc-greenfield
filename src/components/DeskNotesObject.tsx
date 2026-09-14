import type { ReactNode } from 'react'

type Props = {
  children?: ReactNode
}

/** Secondary desk notes pad — Day/Month note authoring stays in planner views. */
export function DeskNotesObject({ children }: Props) {
  return (
    <div className="arc-desk-notes-object" data-testid="arc-desk-notes-object">
      <p className="arc-desk-notes-object-label">Day notes</p>
      <div className="arc-desk-notes-object-body">
        {children ?? <p className="b01-furniture-empty">Open Day or Month to edit notes on dates.</p>}
      </div>
    </div>
  )
}
