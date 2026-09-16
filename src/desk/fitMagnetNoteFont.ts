/** Min/max hand-lettering size on an 88px unit magnet face. */
export const MAGNET_NOTE_MIN_PX = 9
export const MAGNET_NOTE_MAX_PX = 30

/**
 * Binary-search the largest integer size in [min, max] that still fits.
 * `fitsAt` should measure after applying that size (reflow included).
 */
export function chooseFittingSize(
  min: number,
  max: number,
  fitsAt: (px: number) => boolean,
): number {
  const loBound = Math.max(1, Math.floor(min))
  const hiBound = Math.max(loBound, Math.floor(max))
  let lo = loBound
  let hi = hiBound
  let best = loBound
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (fitsAt(mid)) {
      best = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return best
}

function magnetNoteFits(el: HTMLTextAreaElement): boolean {
  // +1 tolerance for subpixel scroll metrics across browsers.
  return el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1
}

/**
 * Scale unit-magnet note text to fill the writing area: short labels grow,
 * long names shrink so they stay inside without overflow/clip scrollbars.
 * Keeps a real textarea so the caret still blinks on focus.
 */
export function fitMagnetNoteFont(
  el: HTMLTextAreaElement,
  opts?: { minPx?: number; maxPx?: number },
): number {
  const minPx = opts?.minPx ?? MAGNET_NOTE_MIN_PX
  const maxPx = opts?.maxPx ?? MAGNET_NOTE_MAX_PX

  // Reset before measuring so prior padding/line-height don't poison the search.
  el.style.paddingTop = '0px'
  el.style.lineHeight = '1.1'

  if (!el.value.trim()) {
    // Placeholder / empty: readable mid size, vertically centered.
    const emptySize = Math.min(maxPx, Math.max(minPx, 15))
    el.style.fontSize = `${emptySize}px`
    if (el.clientHeight > 0) {
      el.style.lineHeight = `${el.clientHeight}px`
    }
    return emptySize
  }

  const size = chooseFittingSize(minPx, maxPx, (px) => {
    el.style.fontSize = `${px}px`
    el.style.lineHeight = '1.1'
    // Force layout so scroll metrics match the candidate size.
    void el.offsetHeight
    return magnetNoteFits(el)
  })

  el.style.fontSize = `${size}px`
  el.style.lineHeight = '1.1'
  void el.offsetHeight

  // One visual line (no wrap): stretch line-height to vertically center in the face.
  const wrapped = el.scrollHeight > size * 1.1 * 1.35
  if (!wrapped && el.clientHeight > 0) {
    el.style.lineHeight = `${el.clientHeight}px`
    void el.offsetHeight
    if (!magnetNoteFits(el)) {
      el.style.lineHeight = '1.1'
    }
  }

  return size
}
