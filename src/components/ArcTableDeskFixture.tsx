import { useEffect, useId, useState } from 'react'
import {
  ARC_TABLE_DESK_QUADRANT_LABELS,
  type ArcTableDeskQuadrant,
} from '../planning/arcTableDeskMark'
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
  onLaunchQuadrant: (quadrant: ArcTableDeskQuadrant) => void
  onExplorePreview: () => void
}

export function ArcTableDeskFixture({
  access = normalizeArcTableDeskAccess(import.meta.env.VITE_ARCTABLE_DESK_ACCESS),
  liveActive,
  onLaunchQuadrant,
  onExplorePreview,
}: Props) {
  const noticeId = useId()
  const [quadrantMode, setQuadrantMode] = useState(false)
  const [previewNotice, setPreviewNotice] = useState<string | null>(null)
  const [hovered, setHovered] = useState<ArcTableDeskQuadrant | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setQuadrantMode(quadrantLauncherMeetsA11y(MARK_SIZE, reduced))
  }, [])

  function openPreview() {
    setPreviewOpen(true)
    onExplorePreview()
  }

  function requestQuadrant(quadrant: ArcTableDeskQuadrant) {
    if (access === 'free-preview') {
      if (quadrant === 'live') {
        openPreview()
        return
      }
      setPreviewNotice(`${ARC_TABLE_DESK_QUADRANT_LABELS[quadrant]} is part of ArcTable live. Preview from Live class or Explore ArcTable.`)
      return
    }
    onLaunchQuadrant(quadrant)
  }

  function singleEntry() {
    if (access === 'free-preview') {
      openPreview()
      return
    }
    onLaunchQuadrant('live')
  }

  const stateClass =
    access === 'paid-live'
      ? liveActive
        ? 'arc-desk-arctable--live'
        : 'arc-desk-arctable--paid-idle'
      : 'arc-desk-arctable--preview'

  return (
    <>
      <div
        className={`arc-desk-arctable ${stateClass}`}
        data-testid="arc-desk-arctable"
        data-access={access}
        data-quadrant-mode={quadrantMode ? 'true' : 'false'}
        data-live={liveActive ? 'true' : 'false'}
      >
        <div className="arc-desk-arctable-mark-wrap">
          {quadrantMode ? (
            <ArcTableDeskMarkSvg
              size={MARK_SIZE}
              interactive
              hovered={hovered}
              onHover={setHovered}
              onActivate={requestQuadrant}
            />
          ) : (
            <button
              type="button"
              className="arc-desk-arctable-single"
              aria-label={access === 'paid-live' ? 'Open ArcTable live launcher' : 'Preview ArcTable live class'}
              aria-describedby={previewNotice ? noticeId : undefined}
              onClick={singleEntry}
            >
              <ArcTableDeskMarkSvg
                size={MARK_SIZE}
                interactive={false}
                hovered={null}
                onHover={() => {}}
                onActivate={() => {}}
              />
            </button>
          )}
        </div>
        {previewNotice ? (
          <p id={noticeId} className="arc-desk-arctable-notice" role="status">
            {previewNotice}
            <button type="button" className="quiet-button" onClick={() => setPreviewNotice(null)}>
              Dismiss
            </button>
          </p>
        ) : null}
      </div>

      {previewOpen ? (
        <div className="arc-desk-arctable-preview-layer" role="dialog" aria-modal="true" aria-labelledby="arc-desk-preview-title" data-testid="arc-desk-arctable-preview">
          <div className="arc-desk-arctable-preview-card">
            <p className="b01-furniture-kicker">ArcTable preview</p>
            <h2 id="arc-desk-preview-title">Explore ArcTable on your desk</h2>
            <p>
              ArcTable is the live classroom layer: timer, cleanup, people tools, and media projection. Plan stays free; live tools
              open from the mark when ArcTable is enabled for your account.
            </p>
            <div className="arc-desk-arctable-preview-actions">
              <button type="button" className="primary-button" onClick={() => setPreviewOpen(false)}>
                Explore ArcTable
              </button>
              <button type="button" className="quiet-button" onClick={() => setPreviewOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
