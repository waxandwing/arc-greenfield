import type { KeyboardEvent } from 'react'
import {
  ARC_TABLE_DESK_QUADRANT_COLORS,
  ARC_TABLE_DESK_QUADRANT_LABELS,
  ARC_TABLE_DESK_QUADRANT_ORDER,
  ARC_TABLE_DESK_QUADRANT_PATHS,
  ARC_TABLE_MARK_INSET,
  ARC_TABLE_MARK_VIEWBOX,
  type ArcTableDeskQuadrant,
} from '../planning/arcTableDeskMark'

type Props = {
  size: number
  interactive: boolean
  hovered: ArcTableDeskQuadrant | null
  onHover: (quadrant: ArcTableDeskQuadrant | null) => void
  onActivate: (quadrant: ArcTableDeskQuadrant) => void
}

export function ArcTableDeskMarkSvg({ size, interactive, hovered, onHover, onActivate }: Props) {
  const inner = ARC_TABLE_MARK_VIEWBOX - ARC_TABLE_MARK_INSET * 2
  return (
    <svg
      className="arc-desk-mark-svg"
      width={size}
      height={size}
      viewBox={`0 0 ${ARC_TABLE_MARK_VIEWBOX} ${ARC_TABLE_MARK_VIEWBOX}`}
      xmlns="http://www.w3.org/2000/svg"
      role={interactive ? 'group' : 'img'}
      aria-label={interactive ? 'ArcTable desk mark' : 'ArcTable mark'}
    >
      <rect width={ARC_TABLE_MARK_VIEWBOX} height={ARC_TABLE_MARK_VIEWBOX} fill="#1F4B3A" pointerEvents="none" />
      <rect
        x={ARC_TABLE_MARK_INSET}
        y={ARC_TABLE_MARK_INSET}
        width={inner}
        height={inner}
        fill="#F4E9D1"
        pointerEvents="none"
      />
      {ARC_TABLE_DESK_QUADRANT_ORDER.map((quadrant) => {
        const active = hovered === quadrant
        const path = (
          <path
            fill={ARC_TABLE_DESK_QUADRANT_COLORS[quadrant]}
            d={ARC_TABLE_DESK_QUADRANT_PATHS[quadrant]}
            pointerEvents={interactive ? 'all' : 'none'}
          />
        )
        if (!interactive) {
          return <g key={quadrant} aria-hidden>{path}</g>
        }
        return (
          <g
            key={quadrant}
            role="button"
            tabIndex={0}
            className={`arc-desk-mark-quadrant arc-desk-mark-quadrant--${quadrant}${active ? ' arc-desk-mark-quadrant--active' : ''}`}
            aria-label={ARC_TABLE_DESK_QUADRANT_LABELS[quadrant]}
            onFocus={() => onHover(quadrant)}
            onBlur={() => onHover(null)}
            onMouseEnter={() => onHover(quadrant)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onActivate(quadrant)}
            onKeyDown={(event: KeyboardEvent<SVGGElement>) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onActivate(quadrant)
              }
            }}
          >
            {path}
            {active ? (
              <text
                className="arc-desk-mark-quadrant-label"
                aria-hidden
                x={quadrantLabelAnchor(quadrant).x}
                y={quadrantLabelAnchor(quadrant).y}
              >
                {ARC_TABLE_DESK_QUADRANT_LABELS[quadrant]}
              </text>
            ) : null}
          </g>
        )
      })}
    </svg>
  )
}

function quadrantLabelAnchor(quadrant: ArcTableDeskQuadrant): { x: number; y: number } {
  switch (quadrant) {
    case 'live':
      return { x: 12, y: 28 }
    case 'timer':
      return { x: 52, y: 28 }
    case 'tools':
      return { x: 12, y: 78 }
    case 'media':
      return { x: 48, y: 78 }
    default:
      return { x: 12, y: 50 }
  }
}
