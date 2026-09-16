import { publicAssetUrl } from '../publicAssetUrl'
import { deskSliceById, type DeskSliceId } from '../navigation/deskSliceManifestData'

/**
 * Full comp-crop overlay stack (frame accents + IDEAS chrome rasters + all slices).
 * Opt-in: `VITE_ARC_DESK_SLICES=true` or `?deskSlices=1`.
 */
export function deskSliceUsesEnabled(): boolean {
  if (typeof window !== 'undefined') {
    const flag = new URLSearchParams(window.location.search).get('deskSlices')
    if (flag === '1') return true
    if (flag === '0') return false
  }
  return import.meta.env.VITE_ARC_DESK_SLICES === 'true'
}

/**
 * Committed PNG/SVG files in `public/assets/desk/` (tabs, folder, title mark) — default ON.
 * Disable: `?deskRaster=0` or `VITE_ARC_DESK_RASTER=false`.
 */
export function deskCommittedRasterChromeEnabled(): boolean {
  if (typeof window !== 'undefined') {
    const flag = new URLSearchParams(window.location.search).get('deskRaster')
    if (flag === '0') return false
    if (flag === '1') return true
  }
  return import.meta.env.VITE_ARC_DESK_RASTER !== 'false'
}

/** Kelly canonical desk PNGs under `public/assets/desk/canonical/`. */
export function deskCanonicalAssetUrl(file: string): string {
  return publicAssetUrl(`assets/desk/canonical/${file.replace(/^\//, '')}`)
}

/** Copper brushed SETTINGS physical tab (Kelly 2026-09-16 PNG). */
export function deskSettingsTabUrl(): string {
  return deskCanonicalAssetUrl('settings-tab.png')
}

/** Cursive start class + ArcTable quadrant mark (Kelly 2026-09-16 PNG). */
export function deskStartClassMarkUrl(): string {
  return deskCanonicalAssetUrl('start-class-mark.png')
}

/** Cream paper tray / post-it stack base (Kelly 2026-09-16 PNG) — staged for tray stack wire. */
export function deskPostitStackBaseUrl(): string {
  return deskCanonicalAssetUrl('postit-stack-base.png')
}

/** Week title cluster mark — Kelly calendar-date-rainbow PNG (default); interim / vector fallbacks when ?deskRaster=0. */
export function deskPlannerTitleMarkUrl(): string {
  if (deskSliceUsesEnabled() || deskCommittedRasterChromeEnabled()) {
    return deskCanonicalAssetUrl('calendar-date-rainbow.png')
  }
  // Prefer dedicated rainbow arches — not AT-001 (green square + quadrant fill).
  return publicAssetUrl('assets/desk/planner-rainbow-mark.svg')
}

export function deskSliceAssetUrl(id: DeskSliceId): string | null {
  const slice = deskSliceById(id)
  if (!slice) return null
  return publicAssetUrl(`assets/desk/slices/${slice.file}`)
}

const EDGE_TAB_LABEL_TO_SLICE: Record<string, DeskSliceId> = {
  DAY: 'planner-edge-tab-day-inactive',
  WEEK: 'planner-edge-tab-week-inactive',
  MONTH: 'planner-edge-tab-month-inactive',
  YEAR: 'planner-edge-tab-year-inactive',
}

/**
 * Planner edge tab bodies.
 * Active: Kelly 2026-09-16 green vertical `canonical/calendar-tab.png` when raster chrome is on.
 * Inactive: existing slice crops until selected/unselected SVG pair lands.
 */
export function deskPlannerEdgeTabAssetUrl(label: string, active: boolean): string | null {
  if (active) {
    if (deskCommittedRasterChromeEnabled()) {
      return publicAssetUrl('assets/desk/canonical/calendar-tab.png')
    }
    return deskSliceAssetUrl('planner-edge-tab-active')
  }
  const sliceId = EDGE_TAB_LABEL_TO_SLICE[label]
  return sliceId ? deskSliceAssetUrl(sliceId) : null
}

/** Kelly cream green-rim planner plate. */
export function deskCalendarBackgroundUrl(): string {
  return publicAssetUrl('assets/desk/canonical/calendar-background.png')
}

/** Kelly felt sage IDEAS tray (replaces green-folders-drawer authority). */
export function deskIdeasTrayUrl(): string {
  return publicAssetUrl('assets/desk/canonical/ideas-tray.png')
}
