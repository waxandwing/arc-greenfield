import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ARC_TABLE_DESK_PREVIEW_COPY,
  deskTargetToAction,
  resolveDeskActionLabel,
  routeArcTableDeskAction,
  type ArcTableDeskAction,
  type ArcTableDeskTarget,
} from '../planning/arcTableDeskActions'
import {
  normalizeArcTableDeskAccess,
  quadrantLauncherMeetsA11y,
  type ArcTableDeskAccess,
} from '../planning/arcTableDeskAccess'
import { ArcTableDeskMarkSvg } from './ArcTableDeskMarkSvg'

const DEFAULT_MARK_SIZE = 96

type Props = {
  markSize?: number
  access?: ArcTableDeskAccess
  liveActive: boolean
  contextLine?: string | null
  interactionsDisabled?: boolean
  onDeskAction: (action: ArcTableDeskAction) => void
  onExplorePreview: () => void
  onAddArcTable?: () => void
}

export function ArcTableDeskFixture({
  markSize = DEFAULT_MARK_SIZE,
  access = normalizeArcTableDeskAccess(import.meta.env.VITE_ARCTABLE_DESK_ACCESS),
  liveActive,
  contextLine = null,
  interactionsDisabled = false,
  onDeskAction,
  onExplorePreview,
  onAddArcTable,
}: Props) {
  const [quadrantMode, setQuadrantMode] = useState(false)
  const [previewAction, setPreviewAction] = useState<ArcTableDeskAction | null>(null)
  const [hovered, setHovered] = useState<ArcTableDeskTarget | null>(null)
  const previewReturnFocusRef = useRef<HTMLElement | null>(null)
  const previewLayerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setQuadrantMode(quadrantLauncherMeetsA11y(markSize))
  }, [markSize])

  const closePreview = useCallback(() => {
    setPreviewAction(null)
    const restore = previewReturnFocusRef.current
    previewReturnFocusRef.current = null
    if (restore && typeof restore.focus === 'function') {
      requestAnimationFrame(() => restore.focus())
    }
  }, [])

  useEffect(() => {
    if (!previewAction) return
    previewReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const frame = requestAnimationFrame(() => {
      const layer = previewLayerRef.current
      if (!layer) return
      const focusable = layer.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      focusable?.focus()
    })
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closePreview()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [previewAction, closePreview])

  function openPreview(action: ArcTableDeskAction) {
    setPreviewAction(action)
    onExplorePreview()
  }

  function requestTarget(target: ArcTableDeskTarget) {
    if (interactionsDisabled) return
    const action = deskTargetToAction(target)
    if (routeArcTableDeskAction(access) === 'preview') {
      openPreview(action)
      return
    }
    onDeskAction(action)
  }

  function singleEntry() {
    if (interactionsDisabled) return
    const action: ArcTableDeskAction = 'open'
    if (routeArcTableDeskAction(access) === 'preview') {
      openPreview(action)
      return
    }
    onDeskAction(action)
  }

  const stateClass =
    access === 'paid-live'
      ? liveActive
        ? 'arc-desk-arctable--live'
        : 'arc-desk-arctable--paid-idle'
      : 'arc-desk-arctable--preview'

  const previewCopy = previewAction ? ARC_TABLE_DESK_PREVIEW_COPY[previewAction] : null
  const hoverAction = hovered ? deskTargetToAction(hovered) : null
  const hoverLabel = hoverAction ? resolveDeskActionLabel(hoverAction, liveActive) : null
  const scriptLine = resolveDeskActionLabel('startOrResume', liveActive)
  const displayScript = hoverLabel ?? scriptLine
  const displayDetail = !hoverLabel ? contextLine : null

  return (
    <>
      <div
        className={`arc-desk-arctable ${stateClass}${interactionsDisabled ? ' arc-desk-arctable--interactions-off' : ''}`}
        data-testid="arc-desk-arctable"
        data-access={access}
        data-quadrant-mode={quadrantMode ? 'true' : 'false'}
        data-live={liveActive ? 'true' : 'false'}
        data-interactions-disabled={interactionsDisabled ? 'true' : 'false'}
      >
        {liveActive ? <span className="arc-desk-arctable-live-badge">Live</span> : null}
        <div className="arc-desk-arctable-mark-wrap">
          {quadrantMode ? (
            <ArcTableDeskMarkSvg
              size={markSize}
              interactive={!interactionsDisabled}
              liveActive={liveActive}
              hovered={hovered}
              onHover={setHovered}
              onActivate={requestTarget}
            />
          ) : (
            <button
              type="button"
              className="arc-desk-arctable-single"
              disabled={interactionsDisabled}
              aria-label={access === 'paid-live' ? 'Open ArcTable' : 'Preview ArcTable'}
              onClick={singleEntry}
            >
              <ArcTableDeskMarkSvg
                size={markSize}
                interactive={false}
                liveActive={liveActive}
                hovered={null}
                onHover={() => {}}
                onActivate={() => {}}
              />
            </button>
          )}
        </div>
        {displayScript ? (
          <p className="arc-desk-arctable-script" aria-live="polite">
            {displayScript}
          </p>
        ) : null}
        {displayDetail ? <p className="arc-desk-arctable-script-detail">{displayDetail}</p> : null}
      </div>

      {previewCopy
        ? createPortal(
            <div
              ref={previewLayerRef}
              className="arc-desk-arctable-preview-layer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="arc-desk-preview-title"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) closePreview()
              }}
            >
              <div
                className="arc-desk-arctable-preview-card"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <p className="b01-furniture-kicker">{previewCopy.kicker}</p>
                <h2 id="arc-desk-preview-title">{previewCopy.title}</h2>
                <p>{previewCopy.body}</p>
                <div className="arc-desk-arctable-preview-actions">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      closePreview()
                      onExplorePreview()
                    }}
                  >
                    Explore ArcTable
                  </button>
                  {onAddArcTable ? (
                    <button
                      type="button"
                      className="quiet-button"
                      onClick={() => {
                        closePreview()
                        onAddArcTable()
                      }}
                    >
                      Add ArcTable
                    </button>
                  ) : null}
                  <button type="button" className="quiet-button" onClick={closePreview}>
                    Close
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
