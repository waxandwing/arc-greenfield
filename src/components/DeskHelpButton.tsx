import { useCallback, useEffect, useId, useRef, useState } from 'react'

const LOCAL_PREVIEW_DOC =
  'https://github.com/waxandwing/arc-greenfield/blob/main/docs/LOCAL-PREVIEW.md'
const HANDOFF_DOC =
  'https://github.com/waxandwing/arc-greenfield/blob/main/docs/overnight/ARC-CURSOR-RESTRUCTURE-HANDOFF.md'

/** Quiet “?” on the wood — desk tips + links to local preview / handoff docs. */
export function DeskHelpButton() {
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const close = useCallback(() => setOpen(false), [])

  return (
    <div className="arc-desk-help">
      <button
        type="button"
        className="arc-desk-help-button"
        data-testid="desk-help-button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Desk help"
        onClick={() => setOpen(true)}
      >
        ?
      </button>
      <dialog
        ref={dialogRef}
        className="arc-desk-help-dialog"
        aria-labelledby={titleId}
        onClose={close}
        onCancel={close}
      >
        <div className="arc-desk-help-dialog-inner">
          <p className="arc-desk-help-kicker">Desk tips</p>
          <h2 id={titleId}>How this wood works</h2>
          <ul>
            <li>
              Click <strong>IDEAS</strong> to slide the tray down from the top over the calendar. TO-DOS and sticky notes stay on the wood.
            </li>
            <li>Drag magnets and post-its on the desk — captures land in IDEAS / Tray.</li>
            <li>
              <strong>start class</strong> opens ArcTable for the next period on the mark.
            </li>
          </ul>
          <p className="arc-desk-help-links">
            <a href={LOCAL_PREVIEW_DOC} target="_blank" rel="noreferrer">
              Local preview
            </a>
            <a href={HANDOFF_DOC} target="_blank" rel="noreferrer">
              Handoff notes
            </a>
          </p>
          <button type="button" className="quiet-button arc-desk-help-close" onClick={close}>
            Close
          </button>
        </div>
      </dialog>
    </div>
  )
}
