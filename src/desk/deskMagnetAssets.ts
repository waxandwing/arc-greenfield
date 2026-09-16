import type { DeskPostItTone } from '../components/DeskPostIt'

export type DeskMagnetColor = 'blue' | 'green' | 'mustard' | 'terracotta'

/** Prefer Kelly labeled canonical magnets when present; else desk magnet discs. */
const MAGNET_SRC: Record<DeskMagnetColor, string> = {
  blue: '/assets/desk/canonical/magnet-blue.svg',
  green: '/assets/desk/canonical/magnet-green.svg',
  mustard: '/assets/desk/canonical/magnet-mustard.svg',
  terracotta: '/assets/desk/canonical/magnet-terracotta.svg',
}

const MAGNET_FALLBACK: Record<DeskMagnetColor, string> = {
  blue: '/assets/desk/magnets/magnet-blue.svg',
  green: '/assets/desk/magnets/magnet-green.svg',
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
