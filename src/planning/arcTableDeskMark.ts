/** AT-001 table mark geometry + quadrant → ArcTable concept mapping (brief). */

/** Canonical ArcTable logo raster (Kelly); matches AT-001 quadrant colors. Inline SVG used on desk for hit targets. */
export const ARC_TABLE_MARK_ASSET = '/assets/arctable/logo-icon-framed-arc-primary-512.png'
export const ARC_TABLE_MARK_LOGO_ALIAS = '/assets/arctable/arctable-logo-primary.png'
export const ARC_TABLE_MARK_ASSET_SVG = '/assets/arctable/AT-001_table-mark.svg'
/** Horizontal mark + TABLE lockup for dark student / projected headers. */
export const ARC_TABLE_HEADER_DARK_ASSET = '/assets/arctable/header-compact-dark.png'

export const ARC_TABLE_MARK_VIEWBOX = 100
export const ARC_TABLE_MARK_INSET = 7
export const ARC_TABLE_MARK_ARC_RADIUS = 43

export type ArcTableDeskQuadrant = 'live' | 'timer' | 'tools' | 'media'

export const ARC_TABLE_DESK_QUADRANT_ORDER: ArcTableDeskQuadrant[] = ['live', 'timer', 'tools', 'media']

export const ARC_TABLE_DESK_QUADRANT_COLORS: Record<ArcTableDeskQuadrant, string> = {
  live: '#2F5E8E',
  timer: '#C44532',
  tools: '#C89B2F',
  media: '#1F4B3A',
}

export const ARC_TABLE_DESK_QUADRANT_PATHS: Record<ArcTableDeskQuadrant, string> = {
  live: 'M 7 50 A 43 43 0 0 1 50 7 L 7 7 Z',
  timer: 'M 50 7 A 43 43 0 0 1 93 50 L 93 7 Z',
  tools: 'M 7 50 A 43 43 0 0 0 50 93 L 7 93 Z',
  media: 'M 93 50 A 43 43 0 0 0 50 93 L 93 93 Z',
}

/** Hover/focus label copy aligned with ArcTable live surfaces. */
export const ARC_TABLE_DESK_QUADRANT_LABELS: Record<ArcTableDeskQuadrant, string> = {
  live: 'Live class',
  timer: 'Timer & cleanup',
  tools: 'People & class tools',
  media: 'Media & directions',
}

/** Center cream diamond — open ArcTable home (geometry aligned with AT-001). */
export const ARC_TABLE_DESK_CENTER_PATH = 'M 50 28 L 72 50 L 50 72 L 28 50 Z'

/** Expanded hit slop (~44px at 100 viewBox) for keyboard/pointer targets. */
export const ARC_TABLE_DESK_QUADRANT_HIT_PATHS: Record<ArcTableDeskQuadrant, string> = {
  live: 'M 4 50 A 46 46 0 0 1 50 4 L 4 4 Z',
  timer: 'M 50 4 A 46 46 0 0 1 96 50 L 96 4 Z',
  tools: 'M 4 50 A 46 46 0 0 0 50 96 L 4 96 Z',
  media: 'M 96 50 A 46 46 0 0 0 50 96 L 96 96 Z',
}

export const ARC_TABLE_DESK_CENTER_HIT_PATH = 'M 50 22 L 78 50 L 50 78 L 22 50 Z'

export type ArcTableDeskTeacherTool = 'timer' | 'people' | 'passes' | 'media'

export function deskQuadrantToTeacherTool(quadrant: ArcTableDeskQuadrant): ArcTableDeskTeacherTool | null {
  switch (quadrant) {
    case 'live':
      return null
    case 'timer':
      return 'timer'
    case 'tools':
      return 'people'
    case 'media':
      return 'media'
    default:
      return null
  }
}
