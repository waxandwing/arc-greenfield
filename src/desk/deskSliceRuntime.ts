import { publicAssetUrl } from '../publicAssetUrl'
import { deskSliceById, type DeskSliceId } from '../navigation/deskSliceManifestData'

export function deskSliceUsesEnabled(): boolean {
  return import.meta.env.VITE_ARC_DESK_SLICES !== 'false'
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
