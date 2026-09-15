import type { ReactNode } from 'react'
import { deskCommittedRasterChromeEnabled } from '../desk/deskSliceRuntime'
import { DeskChromeSlice } from './DeskChromeSlice'

type Props = {
  children: ReactNode
}

/** Physical TO-DOS folder chrome (denim tab) wrapping the MSC priority pad on the wood desk. */
export function DeskTodosFolder({ children }: Props) {
  const slicesEnabled = deskCommittedRasterChromeEnabled()

  return (
    <div
      className="arc-desk-todos-folder"
      data-testid="arc-desk-todos-folder"
      data-desk-slices={slicesEnabled ? 'true' : 'false'}
    >
      {slicesEnabled ? (
        <>
          <DeskChromeSlice sliceId="todos-folder-body" testId="desk-slice-todos-body" />
          <DeskChromeSlice sliceId="todos-folder-tab" testId="desk-slice-todos-tab" />
        </>
      ) : (
        <>
          <div className="arc-desk-todos-folder-sheet" aria-hidden="true" data-testid="desk-source-todos-body" />
          <p className="arc-desk-todos-folder-tab" aria-hidden="true" data-testid="desk-source-todos-tab">
            TO-DOS
          </p>
        </>
      )}
      <p className="sr-only">TO-DOS priorities folder</p>
      <div className="arc-desk-todos-folder-body">{children}</div>
    </div>
  )
}
