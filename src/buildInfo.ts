export const arcBuildInfo = {
  sha: import.meta.env.VITE_ARC_GIT_SHA ?? 'dev',
  label: import.meta.env.VITE_ARC_BUILD_LABEL ?? '',
  branch: import.meta.env.VITE_ARC_GIT_BRANCH ?? '',
}

export function deskPreviewBuildEnabled(): boolean {
  return arcBuildInfo.label === 'desk-v2' || import.meta.env.VITE_ARC_DESK_PREVIEW === 'true'
}

/** Dev / desk-preview only: stamp html + console so local builds are identifiable. */
export function applyArcBuildStamp(): void {
  if (typeof document === 'undefined') return
  const stampedPreview = deskPreviewBuildEnabled()
  if (!stampedPreview && !import.meta.env.DEV) return

  const stamp = [arcBuildInfo.label || 'arc', arcBuildInfo.sha].filter(Boolean).join('@')
  document.documentElement.dataset.build = stamp

  if (stampedPreview) {
    console.info(`[Arc desk preview] ${stamp}`)
    document.getElementById('arc-desk-build-stamp-html')?.remove()
  }
}
