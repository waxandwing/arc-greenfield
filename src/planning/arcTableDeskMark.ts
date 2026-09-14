/** AT-001 table mark geometry + quadrant → ArcTable concept mapping (brief). */

/** Approved production raster (Kelly 2026-09-14); SVG paths remain for geometry reference only. */
export const ARC_TABLE_MARK_ASSET = '/assets/arctable/logo-icon-framed-arc-primary-512.png'
export const ARC_TABLE_MARK_ASSET_SVG = '/assets/arctable/AT-001_table-mark.svg'

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
