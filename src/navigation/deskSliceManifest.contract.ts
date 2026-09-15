import {
  DESK_SLICE_MANIFEST,
  deskPlannerEdgeTabAssetPath,
  deskSliceAssetPath,
  deskSliceById,
  deskSlicesForTarget,
} from './deskSliceManifestData'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

assert(DESK_SLICE_MANIFEST.slices.length >= 11, 'Desk slice manifest must list chrome + vertical tab exports.')

for (const slice of DESK_SLICE_MANIFEST.slices) {
  assert(slice.id.length > 0, 'Slice id required.')
  assert(slice.file.endsWith('.png'), 'Desk slices must be committed PNG rasters.')
  assert(slice.placement.zIndex >= 0, 'Slice z-index must be non-negative.')
  assert(deskSliceById(slice.id)?.id === slice.id, 'Slice lookup must round-trip.')
  assert(deskSliceAssetPath(slice.id)?.includes(slice.file), 'Slice asset path must include filename.')
}

assert(
  deskSlicesForTarget('DeskGreenFoldersDrawer').some((slice) => slice.id === 'ideas-drawer-chrome'),
  'IDEAS drawer must map to figma slice.',
)

assert(
  deskSlicesForTarget('DeskTodosFolder').length >= 2,
  'TO-DOS folder must map body + tab slices.',
)

assert(
  deskSlicesForTarget('arc-planner-physical-tabs--desk-edge').length >= 5,
  'Vertical planner edge tabs must map active + inactive slice stack.',
)

assert(
  deskPlannerEdgeTabAssetPath('WEEK', true)?.includes('planner-edge-tab-active'),
  'Active edge tab must resolve active figma crop.',
)
assert(
  deskPlannerEdgeTabAssetPath('DAY', false)?.includes('planner-edge-tab-day-inactive'),
  'Inactive edge tab must resolve per-label figma crop.',
)

console.log('deskSliceManifest contract passed')
