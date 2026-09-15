/** Vite `base`-aware URLs for files under `public/` (GitHub Pages `/arc-greenfield/`). */

export function publicAssetUrl(path: string): string {
  const trimmed = path.replace(/^\//, '')
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  return `${base}${trimmed}`
}

export function publicAssetCssUrl(path: string): string {
  return `url(${publicAssetUrl(path)})`
}

const DESK_ASSET_PATHS = {
  wood: 'assets/desk/light-wood-desk.png',
  blueTray: 'assets/desk/blue-molded-tray.png',
  plannerTabMustard: 'assets/desk/planner-tab-mustard.png',
} as const

/** Overrides token defaults so `/assets/...` resolves under Vite base on GitHub Pages. */
export function applyPublicAssetCssUrls(): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement.style
  root.setProperty('--arc-wood-surface-image', publicAssetCssUrl(DESK_ASSET_PATHS.wood))
  root.setProperty('--arc-desk-tray-texture', publicAssetCssUrl(DESK_ASSET_PATHS.blueTray))
  root.setProperty('--arc-desk-planner-tab-mustard', publicAssetCssUrl(DESK_ASSET_PATHS.plannerTabMustard))
}
