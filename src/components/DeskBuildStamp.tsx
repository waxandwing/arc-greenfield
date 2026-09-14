import { arcBuildInfo, deskPreviewBuildEnabled } from '../buildInfo'

export function DeskBuildStamp() {
  if (!deskPreviewBuildEnabled()) return null
  const label = arcBuildInfo.label || 'desk-v2'
  return (
    <footer className="arc-desk-build-stamp" aria-hidden="true">
      {label} · {arcBuildInfo.sha}
    </footer>
  )
}
