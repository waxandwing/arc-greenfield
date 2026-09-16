import { FormEvent, KeyboardEvent, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import type { CaptureAnchorInput } from '../planning'
import {
  parseQuickCaptureCommand,
  quickCaptureDestinationLabel,
  quickCaptureHintForDraft,
  type QuickCaptureKind,
} from '../planning/quickCaptureCommand'
import { requestDeskPostItSpawn } from '../desk/deskPostItEvents'
import { DeskPostIt } from './DeskPostIt'

type Props = {
  disabled?: boolean
  defaultUnitId?: string | null
  onSave: (text: string, anchor: CaptureAnchorInput) => string | null
  coachMark?: ReactNode
}

/**
 * Upper-right mustard paper sticky — live desk object (not tray raster).
 * Inline type-first jot only (no capture modal/dialog).
 * Enter saves to IDEAS by default. Optional power-user prefixes (u/l/i/n) still parse when typed.
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

  function commit(raw: string): QuickCaptureKind | null {
    const parsed = parseQuickCaptureCommand(raw)
    if (!parsed.text || disabled) return null
    const anchor: CaptureAnchorInput = {
      sourceView: `quick-capture:${parsed.kind}`,
    }
    if (unitId.trim() && parsed.kind !== 'unit') anchor.unitId = unitId.trim()
    const id = onSave(parsed.text, anchor)
    if (!id) return null
    requestDeskPostItSpawn({ kind: parsed.kind, text: parsed.text, focusBlank: false })
    return parsed.kind
  }

  function afterSave(kind: QuickCaptureKind) {
    setText('')
    setNotice(quickCaptureDestinationLabel(kind))
    clearNoticeLater()
    // Keep QC focused so the next Enter cycle is immediate; spawned blank is also ready on wood.
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const kind = commit(text)
    if (!kind) return
    afterSave(kind)
  }

  function onNoteKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey) return
    event.preventDefault()
    const kind = commit(text)
    if (!kind) return
    afterSave(kind)
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
            placeholder="Write…  u / l / i / n"
            aria-label="Quick capture note"
            onChange={(event) => setText(event.target.value)}
            onKeyDown={onNoteKeyDown}
          />
          <p className="arc-desk-capture-sticky-hint" data-testid="arc-desk-quick-capture-hint">
            {quickCaptureHintForDraft(text)}
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
