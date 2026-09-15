import { useEffect, useState, type ChangeEvent } from 'react'
import { DeskPostIt, type DeskPostItPosition, type DeskPostItTone } from './DeskPostIt'

const NOTE_STORAGE_KEY = 'arc.desk-postit-notes.v1'

type AccentSpec = {
  postItId: string
  tone: DeskPostItTone
  defaultPosition: DeskPostItPosition
  tiltDeg: number
  testId: string
  label: string
}

const ACCENTS: AccentSpec[] = [
  {
    postItId: 'accent-mustard',
    tone: 'mustard',
    defaultPosition: { leftPct: 31.5, topPct: 1.5 },
    tiltDeg: -6,
    testId: 'arc-desk-post-it-accent-mustard',
    label: 'Mustard post-it',
  },
  {
    postItId: 'accent-pink',
    tone: 'pink',
    defaultPosition: { leftPct: 41.5, topPct: 0.8 },
    tiltDeg: 4,
    testId: 'arc-desk-post-it-accent-pink',
    label: 'Pink post-it',
  },
  {
    postItId: 'accent-blue',
    tone: 'blue',
    defaultPosition: { leftPct: 51.5, topPct: 1.6 },
    tiltDeg: -3,
    testId: 'arc-desk-post-it-accent-blue',
    label: 'Blue post-it',
  },
]

function readStoredNote(postItId: string): string {
  try {
    const raw = localStorage.getItem(NOTE_STORAGE_KEY)
    if (!raw) return ''
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const next = parsed[postItId]
    return typeof next === 'string' ? next : ''
  } catch {
    return ''
  }
}

function writeStoredNote(postItId: string, text: string) {
  try {
    const raw = localStorage.getItem(NOTE_STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {}
    if (text) parsed[postItId] = text
    else delete parsed[postItId]
    localStorage.setItem(NOTE_STORAGE_KEY, JSON.stringify(parsed))
  } catch {
    /* ignore quota / private mode */
  }
}

function DeskAccentPostIt({ postItId, tone, defaultPosition, tiltDeg, testId, label }: AccentSpec) {
  const [text, setText] = useState(() => readStoredNote(postItId))

  useEffect(() => {
    writeStoredNote(postItId, text)
  }, [postItId, text])

  const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value)
  }

  return (
    <DeskPostIt
      postItId={postItId}
      tone={tone}
      defaultPosition={defaultPosition}
      tiltDeg={tiltDeg}
      className="arc-desk-post-it--accent"
      testId={testId}
      aria-label={label}
    >
      {/* Grip strip: drag starts here; textarea clicks stay editable (DeskPostIt skips form controls). */}
      <div className="arc-desk-post-it-grip" aria-hidden="true" data-testid={`${testId}-grip`} />
      <textarea
        className="arc-desk-post-it-note"
        data-testid={`${testId}-note`}
        data-desk-post-it-note={postItId}
        value={text}
        onChange={onChange}
        rows={5}
        spellCheck
        placeholder="Write…"
        aria-label={`${label} note`}
      />
    </DeskPostIt>
  )
}

/**
 * Loose accent post-its on the wood — replacements for former tray-chrome baked stickies.
 * Siblings of the IDEAS tray under arc-desk-surface so landscape tray chrome can change independently.
 * Writable + localStorage note text; drag from the grip strip so click-to-edit does not start a drag.
 */
export function DeskAccentPostIts() {
  return (
    <>
      {ACCENTS.map((accent) => (
        <DeskAccentPostIt key={accent.postItId} {...accent} />
      ))}
    </>
  )
}
