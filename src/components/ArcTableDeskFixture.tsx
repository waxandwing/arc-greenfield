import { useEffect, useState } from 'react'
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

const MARK_SIZE = 96

type Props = {
  access?: ArcTableDeskAccess
  liveActive: boolean
  contextLine?: string | null
  interactionsDisabled?: boolean
  onDeskAction: (action: ArcTableDeskAction) => void
  onExplorePreview: () => void
  onAddArcTable?: () => void
}

export function ArcTableDeskFixture({
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

  useEffect(() => {
    setQuadrantMode(quadrantLauncherMeetsA11y(MARK_SIZE))
  }, [])

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
              size={MARK_SIZE}
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
                size={MARK_SIZE}
                interactive={false}
                liveActive={liveActive}
                hovered={null}
                onHover={() => {}}
                onActivate={() => {}}
              />
            </button>
          )}
        </div>
        {contextLine || hoverLabel ? (
          <p className="arc-desk-arctable-context" aria-live="polite">
            {hoverLabel ?? contextLine}
          </p>
        ) : null}
      </div>

      {previewCopy ? (
        <div
          className="arc-desk-arctable-preview-layer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="arc-desk-preview-title"
        >
          <div className="arc-desk-arctable-preview-card">
            <p className="b01-furniture-kicker">{previewCopy.kicker}</p>
            <h2 id="arc-desk-preview-title">{previewCopy.title}</h2>
            <p>{previewCopy.body}</p>
            <div className="arc-desk-arctable-preview-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setPreviewAction(null)
                  onExplorePreview()
                }}
              >
                Explore ArcTable
              </button>
              {onAddArcTable ? (
                <button type="button" className="quiet-button" onClick={() => { setPreviewAction(null); onAddArcTable() }}>
                  Add ArcTable
                </button>
              ) : null}
              <button type="button" className="quiet-button" onClick={() => setPreviewAction(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
