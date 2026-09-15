import type { CSSProperties } from 'react'
import { deskSliceAssetUrl } from '../desk/deskSliceRuntime'
import { deskSliceById, type DeskSliceId } from '../navigation/deskSliceManifestData'

type Props = {
  sliceId: DeskSliceId
  className?: string
  testId?: string
}

function placementStyle(sliceId: DeskSliceId): CSSProperties {
  const slice = deskSliceById(sliceId)
  if (!slice) return {}
  const p = slice.placement
  return {
    position: p.position,
    inset: p.inset,
    left: p.left,
    right: p.right,
    top: p.top,
    bottom: p.bottom,
    width: p.width,
    height: p.height,
    objectFit: p.objectFit,
    objectPosition: p.objectPosition,
    zIndex: p.zIndex,
    pointerEvents: 'none',
  }
}

export function DeskChromeSlice({ sliceId, className = '', testId }: Props) {
  const src = deskSliceAssetUrl(sliceId)
  if (!src) return null
  return (
    <img
      className={`arc-desk-chrome-slice arc-desk-chrome-slice--${sliceId} ${className}`.trim()}
      src={src}
      alt=""
      aria-hidden="true"
      data-desk-slice={sliceId}
      data-testid={testId}
      style={placementStyle(sliceId)}
      decoding="async"
    />
  )
}
