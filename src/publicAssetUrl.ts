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
  /** Full viewport / `.arc-desk-tabletop` — Icarus wood (compare to Figma). */
  woodSurface: 'assets/arc/icarus/texture-wood.png',
  /** Schedule setup / onboarding calendar-on-wood only — not main desk authority. */
  scheduleSetupWood: 'assets/desk/light-wood-desk.png',
  /** Legacy molded tray — superseded on live desk by green folders drawer PNG. */
  blueTray: 'assets/desk/blue-molded-tray.png',
  /** Landscape textured IDEAS drawer (preferred over tall SVG fallback). */
  greenFoldersDrawer: 'assets/desk/green-folders-drawer.png',
  plannerTabMustard: 'assets/desk/planner-tab-mustard.png',
} as const

/** Overrides token defaults so `/assets/...` resolves under Vite base on GitHub Pages. */
export function applyPublicAssetCssUrls(): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement.style
  root.setProperty('--arc-wood-surface-image', publicAssetCssUrl(DESK_ASSET_PATHS.woodSurface))
  root.setProperty('--arc-schedule-setup-wood', publicAssetCssUrl(DESK_ASSET_PATHS.scheduleSetupWood))
  root.setProperty('--arc-desk-tray-texture', publicAssetCssUrl(DESK_ASSET_PATHS.greenFoldersDrawer))
  root.setProperty('--arc-desk-green-folders-drawer', publicAssetCssUrl(DESK_ASSET_PATHS.greenFoldersDrawer))
  root.setProperty('--arc-desk-planner-tab-mustard', publicAssetCssUrl(DESK_ASSET_PATHS.plannerTabMustard))
}
