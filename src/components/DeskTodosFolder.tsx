import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

/** Physical TO-DOS folder chrome (denim tab) wrapping the MSC priority pad on the wood desk. */
export function DeskTodosFolder({ children }: Props) {
  return (
    <div className="arc-desk-todos-folder" data-testid="arc-desk-todos-folder">
      <div className="arc-desk-todos-folder-sheet" aria-hidden="true" />
      <p className="arc-desk-todos-folder-tab" aria-hidden="true">
        TO-DOS
      </p>
      <div className="arc-desk-todos-folder-body">{children}</div>
    </div>
  )
}
