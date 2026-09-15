import { publicAssetUrl } from '../publicAssetUrl'
import { deskSliceById, type DeskSliceId } from '../navigation/deskSliceManifestData'

/**
 * Comp-crop rasters under `assets/desk/slices/` — opt-in only.
 * Default desk preview uses committed SVG/PNG source files (green drawer, CSS tabs, ArcTable mark).
 * Enable crops: `VITE_ARC_DESK_SLICES=true` at build time or `?deskSlices=1` in the URL.
 */
export function deskSliceUsesEnabled(): boolean {
  if (typeof window !== 'undefined') {
    const flag = new URLSearchParams(window.location.search).get('deskSlices')
    if (flag === '1') return true
    if (flag === '0') return false
  }
  return import.meta.env.VITE_ARC_DESK_SLICES === 'true'
}

/** Week title cluster mark — vector source unless comp-crop slice mode is on. */
export function deskPlannerTitleMarkUrl(): string {
  if (deskSliceUsesEnabled()) {
    return publicAssetUrl('assets/desk/planner-rainbow-mark.png')
  }
  return publicAssetUrl('assets/arctable/AT-001_table-mark.svg')
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

/** Figma crop for vertical planner edge tabs (active cream vs denim inactive). */
export function deskPlannerEdgeTabAssetUrl(label: string, active: boolean): string | null {
  if (active) return deskSliceAssetUrl('planner-edge-tab-active')
  const sliceId = EDGE_TAB_LABEL_TO_SLICE[label]
  return sliceId ? deskSliceAssetUrl(sliceId) : null
}
