import { useState } from 'react'

export function FirstCapturePrompt({ onSave, onDismiss, onPlace }: { onSave: (text: string) => string | null; onDismiss: () => void; onPlace: () => void }) {
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)
  if (saved) return <aside className="first-capture-prompt" aria-label="Capture saved"><div><p className="section-label">Saved in Workspace</p><strong>Know where it belongs?</strong><p>Place it when you know, or leave it loose without losing it.</p></div><div className="first-capture-actions"><button type="button" className="primary-button" onClick={onPlace}>Place it</button><button type="button" className="quiet-button" onClick={onDismiss}>Leave it here</button></div></aside>
  return <aside className="first-capture-prompt" aria-labelledby="first-capture-title"><div><p className="section-label">Try Capture</p><strong id="first-capture-title">Something you need to remember for class?</strong><p>Write the thought now. Organize it when you have the context.</p></div><form onSubmit={(event) => { event.preventDefault(); if (onSave(text)) setSaved(true) }}><label className="sr-only" htmlFor="first-capture-text">Capture thought</label><input id="first-capture-text" value={text} onChange={(event) => setText(event.target.value)} placeholder="Prep charcoal for Period 3" /><button type="submit" className="primary-button" disabled={!text.trim()}>Save Capture</button><button type="button" className="text-button" onClick={onDismiss}>Not now</button></form></aside>
}
