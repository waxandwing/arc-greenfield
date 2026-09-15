import { FormEvent, KeyboardEvent, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import type { CaptureAnchorInput } from '../planning'
import { DeskPostIt } from './DeskPostIt'

type Props = {
  disabled?: boolean
  defaultUnitId?: string | null
  onSave: (text: string, anchor: CaptureAnchorInput) => string | null
  coachMark?: ReactNode
}

/**
 * Upper-right mustard paper sticky — live desk object (not tray raster).
 * Inline type-first jot only (no capture modal/dialog). Enter saves to IDEAS / tray.
 * Grip strip for drag; note body stays editable (same contract as accent post-its).
 */
export function DeskQuickCaptureSticky({
  disabled = false,
  defaultUnitId = null,
  onSave,
  coachMark = null,
}: Props) {
  const [text, setText] = useState('')
  const [unitId, setUnitId] = useState(defaultUnitId ?? '')
  const [notice, setNotice] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const noticeTimerRef = useRef<number | null>(null)
  const inputId = useId()

  useEffect(() => {
    if (defaultUnitId) setUnitId(defaultUnitId)
  }, [defaultUnitId])

  useEffect(() => () => {
    if (noticeTimerRef.current != null) window.clearTimeout(noticeTimerRef.current)
  }, [])

  function clearNoticeLater(ms = 1400) {
    if (noticeTimerRef.current != null) window.clearTimeout(noticeTimerRef.current)
    noticeTimerRef.current = window.setTimeout(() => {
      setNotice(null)
      noticeTimerRef.current = null
    }, ms)
  }

  function commit(raw: string): boolean {
    const trimmed = raw.trim()
    if (!trimmed || disabled) return false
    const anchor: CaptureAnchorInput = {}
    if (unitId.trim()) anchor.unitId = unitId.trim()
    return Boolean(onSave(trimmed, anchor))
  }

  function afterSave() {
    setText('')
    setNotice('Saved to IDEAS')
    clearNoticeLater()
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!commit(text)) return
    afterSave()
    inputRef.current?.focus()
  }

  function onNoteKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey) return
    event.preventDefault()
    if (!commit(text)) return
    afterSave()
  }

  return (
    <DeskPostIt
      postItId="quick-capture"
      tone="mustard"
      defaultPosition={{ leftPct: 79.5, topPct: 4 }}
      tiltDeg={-2.2}
      className="arc-desk-capture-sticky"
      testId="arc-desk-quick-capture"
      aria-label="Quick capture sticky"
    >
      <div className="arc-desk-post-it-grip" aria-hidden="true" data-testid="arc-desk-quick-capture-grip" />
      <p className="arc-desk-capture-sticky-title">Quick capture</p>
      <div className="arc-desk-capture-sticky-well">
        <form className="arc-desk-capture-sticky-form" onSubmit={submit} data-testid="arc-desk-quick-capture-form">
          <label htmlFor={inputId} className="sr-only">Thought to capture</label>
          <textarea
            ref={inputRef}
            id={inputId}
            className="arc-desk-post-it-note arc-desk-capture-sticky-note"
            data-testid="arc-desk-quick-capture-note"
            value={text}
            disabled={disabled}
            rows={4}
            spellCheck
            placeholder="Write…"
            aria-label="Quick capture note"
            onChange={(event) => setText(event.target.value)}
            onKeyDown={onNoteKeyDown}
          />
          <p className="arc-desk-capture-sticky-hint" data-testid="arc-desk-quick-capture-hint">
            Enter saves to IDEAS
          </p>
          {notice ? (
            <p className="arc-desk-capture-sticky-notice" role="status" data-testid="arc-desk-quick-capture-notice">
              {notice}
            </p>
          ) : null}
        </form>
        {coachMark}
      </div>
    </DeskPostIt>
  )
}
