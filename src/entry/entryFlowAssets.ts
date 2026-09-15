import { publicAssetCssUrl } from '../publicAssetUrl'

const ENTRY_TEXTURE_PATHS = {
  cream: 'assets/arc/texture-cream-paper.png',
  blue: 'assets/arc/texture-blue-paper.png',
} as const

export function applyEntryFlowAssetCssUrls(): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement.style
  root.setProperty('--entry-texture-cream', publicAssetCssUrl(ENTRY_TEXTURE_PATHS.cream))
  root.setProperty('--entry-texture-blue', publicAssetCssUrl(ENTRY_TEXTURE_PATHS.blue))
}
