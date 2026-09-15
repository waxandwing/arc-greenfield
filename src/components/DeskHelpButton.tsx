import { useCallback, useEffect, useId, useRef, useState } from 'react'

/** Quiet “?” on the wood — short desk tips for teachers. */
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
              Click <strong>IDEAS</strong> to slide the tray down over the calendar. TO-DOS and sticky
              notes stay on the wood.
            </li>
            <li>Drag magnets and post-its on the desk — they land in IDEAS.</li>
            <li>
              <strong>start class</strong> opens ArcTable for the next period.
            </li>
            <li>
              Click the bottom corner of a sticky to mark it as a <strong>lesson</strong> (corner
              dot). Link overlapping stickies to group a unit and class around that lesson.
            </li>
          </ul>
          <button type="button" className="arc-desk-help-close" onClick={close}>
            Close
          </button>
        </div>
      </dialog>
    </div>
  )
}
