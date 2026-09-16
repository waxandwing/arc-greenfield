import type { DeskPostItTone } from '../components/DeskPostIt'

export type DeskMagnetColor = 'blue' | 'green' | 'mustard' | 'terracotta'

/**
 * Prefer Kelly source art when present.
 * Blue/slate + green faces: Kelly PNG upload session 2026-09-16 (not interim CSS disc SVGs).
 * Mustard/terracotta still wait on labeled SVG binaries (or later PNG drops).
 * UnitMagnetBadge probes preferred then falls back — missing files do not flash broken.
 */
const MAGNET_SRC: Record<DeskMagnetColor, string> = {
  blue: '/assets/desk/canonical/magnet-blue.png',
  green: '/assets/desk/canonical/magnet-green.png',
  mustard: '/assets/desk/canonical/magnet-mustard.png',
  terracotta: '/assets/desk/canonical/magnet-terracotta.png',
}

const MAGNET_FALLBACK: Record<DeskMagnetColor, string> = {
  blue: '/assets/desk/magnets/magnet-blue.svg',
  green: '/assets/desk/magnets/magnet-green.png',
  mustard: '/assets/desk/magnets/magnet-mustard.svg',
  terracotta: '/assets/desk/magnets/magnet-terracotta.svg',
}

/** Map sticky tone → physical magnet color (cream units use green). */
export function deskMagnetColorForTone(tone: DeskPostItTone): DeskMagnetColor {
  if (tone === 'pink') return 'terracotta'
  if (tone === 'mustard') return 'mustard'
  if (tone === 'blue') return 'blue'
  return 'green'
}

export function deskMagnetSrcForTone(tone: DeskPostItTone): string {
  return MAGNET_SRC[deskMagnetColorForTone(tone)]
}

export function deskMagnetFallbackSrcForTone(tone: DeskPostItTone): string {
  return MAGNET_FALLBACK[deskMagnetColorForTone(tone)]
}
