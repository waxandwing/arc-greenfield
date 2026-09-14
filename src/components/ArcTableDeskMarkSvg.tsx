import type { KeyboardEvent } from 'react'
import {
  ARC_TABLE_DESK_QUADRANT_HIT_PATHS,
  ARC_TABLE_DESK_CENTER_HIT_PATH,
  ARC_TABLE_DESK_QUADRANT_ORDER,
  ARC_TABLE_MARK_ASSET_SVG,
  ARC_TABLE_MARK_VIEWBOX,
  type ArcTableDeskQuadrant,
} from '../planning/arcTableDeskMark'
import { deskTargetToAction, resolveDeskActionLabel, type ArcTableDeskTarget } from '../planning/arcTableDeskActions'

type Props = {
  size: number
  interactive: boolean
  liveActive: boolean
  hovered: ArcTableDeskTarget | null
  onHover: (target: ArcTableDeskTarget | null) => void
  onActivate: (target: ArcTableDeskTarget) => void
}

export function ArcTableDeskMarkSvg({ size, interactive, liveActive, hovered, onHover, onActivate }: Props) {
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
      <image
        href={ARC_TABLE_MARK_ASSET_SVG}
        width={ARC_TABLE_MARK_VIEWBOX}
        height={ARC_TABLE_MARK_VIEWBOX}
        pointerEvents="none"
      />
      {interactive ? (
        <>
          {renderTarget('center', hovered, liveActive, onHover, onActivate)}
          {ARC_TABLE_DESK_QUADRANT_ORDER.map((quadrant) =>
            renderTarget(quadrant, hovered, liveActive, onHover, onActivate),
          )}
        </>
      ) : null}
    </svg>
  )
}

function renderTarget(
  target: ArcTableDeskTarget,
  hovered: ArcTableDeskTarget | null,
  liveActive: boolean,
  onHover: (target: ArcTableDeskTarget | null) => void,
  onActivate: (target: ArcTableDeskTarget) => void,
) {
  const action = deskTargetToAction(target)
  const label = resolveDeskActionLabel(action, liveActive)
  const active = hovered === target
  const hitPath =
    target === 'center'
      ? ARC_TABLE_DESK_CENTER_HIT_PATH
      : ARC_TABLE_DESK_QUADRANT_HIT_PATHS[target]
  const quadrantClass =
    target === 'center' ? 'arc-desk-mark-center' : `arc-desk-mark-quadrant arc-desk-mark-quadrant--${target}`

  return (
    <g
      key={target}
      role="button"
      tabIndex={0}
      className={`${quadrantClass}${active ? ' arc-desk-mark-target--active' : ''}`}
      aria-label={label}
      onFocus={() => onHover(target)}
      onBlur={() => onHover(null)}
      onMouseEnter={() => onHover(target)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onActivate(target)}
      onKeyDown={(event: KeyboardEvent<SVGGElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onActivate(target)
        }
      }}
    >
      <path className="arc-desk-mark-hit" fill="transparent" d={hitPath} pointerEvents="all" />
      {active ? (
        <text className="arc-desk-mark-quadrant-label" aria-hidden x={labelAnchor(target).x} y={labelAnchor(target).y}>
          {label}
        </text>
      ) : null}
    </g>
  )
}

function labelAnchor(target: ArcTableDeskTarget): { x: number; y: number } {
  switch (target) {
    case 'center':
      return { x: 50, y: 54 }
    case 'live':
      return { x: 12, y: 28 }
    case 'timer':
      return { x: 52, y: 28 }
    case 'tools':
      return { x: 12, y: 78 }
    case 'media':
      return { x: 48, y: 78 }
    default:
      return { x: 50, y: 50 }
  }
}
