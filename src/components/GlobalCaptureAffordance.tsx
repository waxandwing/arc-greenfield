import { FormEvent, useEffect, useId, useRef, useState } from 'react'
import type { ISODate } from '../calendar'
import type { CaptureAnchorInput, UnitWorkspace } from '../planning'

type Props = {
  disabled?: boolean
  units: UnitWorkspace | null
  defaultUnitId?: string | null
  onSave: (text: string, anchor: CaptureAnchorInput) => string | null
}

export function GlobalCaptureAffordance({ disabled = false, units, defaultUnitId, onSave }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [unitId, setUnitId] = useState(defaultUnitId ?? '')
  const [notice, setNotice] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputId = useId()

  useEffect(() => {
    if (defaultUnitId) setUnitId(defaultUnitId)
  }, [defaultUnitId])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  function close() {
    setOpen(false)
    setText('')
    setNotice(null)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const anchor: CaptureAnchorInput = {}
    if (unitId.trim()) anchor.unitId = unitId.trim()
    const id = onSave(text, anchor)
    if (!id) return
    setNotice('Captured.')
    window.setTimeout(close, 700)
  }

  const unitChoices = units?.units ?? []
  const showDestination = unitChoices.length > 1

  return (
    <>
      <button
        type="button"
        className="arc-capture-trigger"
        data-testid="global-capture-trigger"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        + Capture
      </button>
      <dialog ref={dialogRef} className="arc-capture-dialog" aria-labelledby={`${inputId}-label`} onClose={close}>
        <form className="arc-capture-dialog-inner" onSubmit={submit}>
          <p className="section-label" id={`${inputId}-label`}>Capture</p>
          <label htmlFor={inputId} className="sr-only">Thought to capture</label>
          <input
            id={inputId}
            value={text}
            autoFocus
            placeholder="Write it now — organize later"
            onChange={(event) => setText(event.target.value)}
          />
          {showDestination ? (
            <label className="arc-capture-destination">
              <span>Unit hint (optional)</span>
              <select value={unitId} onChange={(event) => setUnitId(event.target.value)}>
                <option value="">No unit yet</option>
                {unitChoices.map((unit) => (
                  <option key={unit.id} value={unit.id}>{unit.title}</option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="arc-capture-dialog-actions">
            <button type="button" className="text-button" onClick={close}>Cancel</button>
            <button type="submit" className="primary-button" disabled={!text.trim()}>Save</button>
          </div>
          {notice ? <p className="arc-capture-notice" role="status">{notice}</p> : null}
        </form>
      </dialog>
    </>
  )
}

export type CaptureContextFromPlan = CaptureAnchorInput & { anchorDate?: ISODate | null }

export function captureAnchorFromPlan(input: {
  anchorDate: ISODate | null
  activeView: string
  planContext: {
    courseId?: string
    sectionId?: string
    unitId?: string
    lessonId?: string
    focus?: string
    teachingBlockId?: string
  } | null
  workspaceMode: string
}): CaptureAnchorInput {
  const sourceView = input.workspaceMode !== 'calendar'
    ? input.workspaceMode
    : input.planContext?.focus === 'lesson'
      ? `${input.activeView}:lesson`
      : input.planContext?.focus === 'class'
        ? `${input.activeView}:class`
        : input.planContext?.teachingBlockId
          ? `${input.activeView}:planning`
          : input.activeView
  return {
    anchorDate: input.anchorDate ?? undefined,
    courseId: input.planContext?.courseId,
    sectionId: input.planContext?.sectionId,
    unitId: input.planContext?.unitId,
    lessonId: input.planContext?.lessonId,
    sourceView,
  }
}
