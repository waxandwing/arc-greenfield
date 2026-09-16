/**
 * Quick Capture command prefixes typed on the mustard sticky.
 * Leading token + rest of line: `u mesopotamia`, `l intro`, `i field trip`, `n bring clay`.
 */

export type QuickCaptureKind = 'unit' | 'lesson' | 'idea' | 'note'

export type ParsedQuickCaptureCommand = {
  kind: QuickCaptureKind
  /** Body text after the prefix (or full line when no prefix). */
  text: string
  /** True when a recognized `u`/`l`/`i`/`n` prefix was used. */
  hadPrefix: boolean
}

const PREFIX_TO_KIND: Record<string, QuickCaptureKind> = {
  u: 'unit',
  l: 'lesson',
  i: 'idea',
  n: 'note',
}

export function parseQuickCaptureCommand(raw: string): ParsedQuickCaptureCommand {
  const trimmed = raw.trim()
  if (!trimmed) return { kind: 'idea', text: '', hadPrefix: false }

  const match = /^([ulin])\s+(.+)$/i.exec(trimmed)
  if (!match) {
    return { kind: 'idea', text: trimmed, hadPrefix: false }
  }

  const token = match[1].toLowerCase()
  const kind = PREFIX_TO_KIND[token]
  const text = match[2].trim()
  if (!kind || !text) {
    return { kind: 'idea', text: trimmed, hadPrefix: false }
  }
  return { kind, text, hadPrefix: true }
}

export function quickCaptureDestinationLabel(kind: QuickCaptureKind): string {
  switch (kind) {
    case 'unit':
      return 'Saved as unit'
    case 'lesson':
      return 'Saved as lesson'
    case 'note':
      return 'Saved as note'
    case 'idea':
    default:
      return 'Saved to IDEAS'
  }
}

export function quickCaptureHintForDraft(raw: string): string {
  const trimmed = raw.trimStart()
  // Only reveal prefix destinations after the teacher has started a recognized command.
  if (/^u\s+/i.test(trimmed)) return 'Enter saves as unit · next sticky ready'
  if (/^l\s+/i.test(trimmed)) return 'Enter saves as lesson · next sticky ready'
  if (/^n\s+/i.test(trimmed)) return 'Enter saves as note · next sticky ready'
  if (/^i\s+/i.test(trimmed)) return 'Enter saves to IDEAS · next sticky ready'
  return 'Enter saves to IDEAS'
}
