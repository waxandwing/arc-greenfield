import { arcBuildInfo, deskPreviewBuildEnabled } from '../buildInfo'

export function DeskBuildStamp() {
  if (!deskPreviewBuildEnabled()) return null
  const label = arcBuildInfo.label || 'desk-v2'
  const branch = arcBuildInfo.branch.trim()
  const line = branch
    ? `${label} · ${branch} · ${arcBuildInfo.sha}`
    : `${label} · ${arcBuildInfo.sha}`
  return (
    <footer className="arc-desk-build-stamp" aria-hidden="true">
      {line}
    </footer>
  )
}
