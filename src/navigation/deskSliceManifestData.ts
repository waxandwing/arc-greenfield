export type DeskSliceRole = 'decorative' | 'live-chrome' | 'interactive-chrome'

export type DeskSlicePlacement = {
  scope: 'component' | 'spread' | 'tabletop'
  position: 'absolute'
  inset?: string
  left?: string
  right?: string
  top?: string
  bottom?: string
  width?: string
  height?: string
  objectFit?: 'cover' | 'contain' | 'fill'
  objectPosition?: string
  zIndex: number
}

export type DeskSliceDefinition = {
  id: string
  file: string
  role: DeskSliceRole
  liveChrome: boolean
  target: string
  placement: DeskSlicePlacement
}

export const DESK_SLICE_MANIFEST = {
  version: 1 as const,
  source: {
    figmaFileKey: 'CfWcuQPY4ljYXondICj2ZX',
    heroNodeId: '37:11052',
    cropReferenceNodeId: '37:11053',
    referenceFrame: { width: 1440, height: 1024 },
  },
  slices: [
    {
      id: 'ideas-drawer-chrome',
      file: 'ideas-drawer-chrome.png',
      role: 'decorative',
      liveChrome: false,
      target: 'DeskGreenFoldersDrawer',
      placement: {
        scope: 'component',
        position: 'absolute',
        inset: '0',
        objectFit: 'cover',
        objectPosition: 'center top',
        zIndex: 1,
      },
    },
    {
      id: 'todos-folder-body',
      file: 'todos-folder-body.png',
      role: 'decorative',
      liveChrome: false,
      target: 'DeskTodosFolder',
      placement: {
        scope: 'component',
        position: 'absolute',
        inset: '0',
        objectFit: 'fill',
        zIndex: 0,
      },
    },
    {
      id: 'todos-folder-tab',
      file: 'todos-folder-tab.png',
      role: 'decorative',
      liveChrome: false,
      target: 'DeskTodosFolder',
      placement: {
        scope: 'component',
        position: 'absolute',
        left: '-8%',
        top: '34%',
        width: '28%',
        height: '42%',
        objectFit: 'contain',
        zIndex: 2,
      },
    },
    {
      id: 'planner-frame-top-accent',
      file: 'planner-frame-top-accent.png',
      role: 'decorative',
      liveChrome: false,
      target: 'arc-calendar-spread--desk',
      placement: {
        scope: 'spread',
        position: 'absolute',
        left: '0',
        right: '44px',
        top: '-2px',
        height: '18px',
        objectFit: 'cover',
        objectPosition: 'center top',
        zIndex: 3,
      },
    },
    {
      id: 'planner-frame-left-accent',
      file: 'planner-frame-left-accent.png',
      role: 'decorative',
      liveChrome: false,
      target: 'arc-calendar-spread--desk',
      placement: {
        scope: 'spread',
        position: 'absolute',
        left: '-1px',
        top: '12%',
        bottom: '8%',
        width: '12px',
        objectFit: 'cover',
        zIndex: 3,
      },
    },
    {
      id: 'start-class-frame',
      file: 'start-class-frame.png',
      role: 'decorative',
      liveChrome: false,
      target: 'ArcTableDeskFixture',
      placement: {
        scope: 'component',
        position: 'absolute',
        inset: '-8%',
        objectFit: 'contain',
        zIndex: 0,
      },
    },
    {
      id: 'planner-edge-tab-active',
      file: 'planner-edge-tab-active.png',
      role: 'interactive-chrome',
      liveChrome: true,
      target: 'arc-planner-physical-tabs--desk-edge',
      placement: {
        scope: 'spread',
        position: 'absolute',
        zIndex: 46,
      },
    },
    {
      id: 'planner-edge-tab-day-inactive',
      file: 'planner-edge-tab-day-inactive.png',
      role: 'interactive-chrome',
      liveChrome: true,
      target: 'arc-planner-physical-tabs--desk-edge',
      placement: {
        scope: 'spread',
        position: 'absolute',
        zIndex: 45,
      },
    },
    {
      id: 'planner-edge-tab-week-inactive',
      file: 'planner-edge-tab-week-inactive.png',
      role: 'interactive-chrome',
      liveChrome: true,
      target: 'arc-planner-physical-tabs--desk-edge',
      placement: {
        scope: 'spread',
        position: 'absolute',
        zIndex: 45,
      },
    },
    {
      id: 'planner-edge-tab-month-inactive',
      file: 'planner-edge-tab-month-inactive.png',
      role: 'interactive-chrome',
      liveChrome: true,
      target: 'arc-planner-physical-tabs--desk-edge',
      placement: {
        scope: 'spread',
        position: 'absolute',
        zIndex: 45,
      },
    },
    {
      id: 'planner-edge-tab-year-inactive',
      file: 'planner-edge-tab-year-inactive.png',
      role: 'interactive-chrome',
      liveChrome: true,
      target: 'arc-planner-physical-tabs--desk-edge',
      placement: {
        scope: 'spread',
        position: 'absolute',
        zIndex: 45,
      },
    },
  ] satisfies DeskSliceDefinition[],
}

export type DeskSliceId = (typeof DESK_SLICE_MANIFEST.slices)[number]['id']

const sliceById = new Map<string, DeskSliceDefinition>(
  DESK_SLICE_MANIFEST.slices.map((slice) => [slice.id, slice]),
)

export function deskSliceById(id: string): DeskSliceDefinition | null {
  return sliceById.get(id) ?? null
}

export function deskSlicesForTarget(target: string): DeskSliceDefinition[] {
  return DESK_SLICE_MANIFEST.slices.filter((slice) => slice.target === target)
}

export function deskSliceAssetPath(id: string): string | null {
  const slice = deskSliceById(id)
  if (!slice) return null
  return `assets/desk/slices/${slice.file}`
}

const EDGE_TAB_LABEL_TO_SLICE: Record<string, DeskSliceId> = {
  DAY: 'planner-edge-tab-day-inactive',
  WEEK: 'planner-edge-tab-week-inactive',
  MONTH: 'planner-edge-tab-month-inactive',
  YEAR: 'planner-edge-tab-year-inactive',
}

/** Relative public asset path for vertical planner edge tab rasters. */
export function deskPlannerEdgeTabAssetPath(label: string, active: boolean): string | null {
  if (active) return deskSliceAssetPath('planner-edge-tab-active')
  const sliceId = EDGE_TAB_LABEL_TO_SLICE[label]
  return sliceId ? deskSliceAssetPath(sliceId) : null
}
