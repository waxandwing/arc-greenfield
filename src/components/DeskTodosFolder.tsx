import type { ReactNode } from 'react'
import { deskCanonicalPngUrl } from '../desk/deskCanonicalPng'
import { deskCommittedRasterChromeEnabled } from '../desk/deskSliceRuntime'
import { DeskChromeSlice } from './DeskChromeSlice'

type Props = { children: ReactNode }

/** Physical TO-DOS denim folder left of planner (always visible — Kelly Teaching week). */
export function DeskTodosFolder({ children }: Props) {
  const slicesEnabled = deskCommittedRasterChromeEnabled()
  const todosTabSrc = deskCanonicalPngUrl('todosTab')
  return (
    <div
      className="arc-desk-todos-folder"
      data-testid="arc-desk-todos-folder"
      data-desk-slices={slicesEnabled ? 'true' : 'false'}
      data-extended="true"
      data-kelly-todos-tab="canonical-png"
    >
      {slicesEnabled ? (
        <DeskChromeSlice sliceId="todos-folder-body" testId="desk-slice-todos-body" />
      ) : (
        <div className="arc-desk-todos-folder-sheet" aria-hidden="true" data-testid="desk-source-todos-body" />
      )}
      {/* Prefer Kelly ingested todos-tab.png (USE-intent) over slice tab crop. */}
      <img
        className="arc-desk-todos-folder-tab arc-desk-todos-folder-tab--kelly"
        src={todosTabSrc}
        alt=""
        aria-hidden="true"
        data-testid="desk-slice-todos-tab"
        data-desk-kelly-asset="todos-tab"
        decoding="async"
      />
      <p className="sr-only">TO-DOS priorities folder</p>
      <div className="arc-desk-todos-folder-body" data-testid="arc-desk-todos-folder-body">
        {children}
      </div>
    </div>
  )
}
