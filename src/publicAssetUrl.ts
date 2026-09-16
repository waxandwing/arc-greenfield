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
  /** Full viewport / `.arc-desk-tabletop` — Kelly wood-background-light (singular desk wood). */
  woodSurface: 'assets/desk/canonical/wood-background-light.png',
  /** Schedule setup / onboarding — same singular Kelly wood authority (cover, no recolor). */
  scheduleSetupWood: 'assets/desk/canonical/wood-background-light.png',
  /** Legacy molded tray — superseded on live desk by green folders drawer PNG. */
  blueTray: 'assets/desk/blue-molded-tray.png',
  /**
   * IDEAS tray authority — Kelly sage drawer with baked IDEAS pull-tab
   * (`canonical/ideas-tray.png`). Supersedes interim `green-folders-drawer.*`.
   */
  greenFoldersDrawer: 'assets/desk/canonical/ideas-tray.png',
  /** Planner plate / calendar physical background (Kelly cream green-rim card). */
  calendarBackground: 'assets/desk/canonical/calendar-background.png',
  /** TO-DOS side tab — Kelly silver brushed metal (`canonical/todos-tab.png`). */
  todosTab: 'assets/desk/canonical/todos-tab.png',
  plannerTabMustard: 'assets/desk/planner-tab-mustard.png',
  /** Kelly post-it paper faces (no yellow/pink PNGs in canonical yet). */
  postitBlue: 'assets/desk/canonical/postit-blue.png',
  postitCream: 'assets/desk/canonical/postit-cream.png',
} as const

export { DESK_ASSET_PATHS }

const ARCTABLE_ASSET_PATHS = {
  paperCream: 'assets/arctable/paper-cream.png',
  progressRail: 'assets/arctable/progress-rail.png',
  boardPanel: 'assets/arctable/board-panel.png',
  timerRing: 'assets/arctable/timer-ring.png',
  timerRingCleanup: 'assets/arctable/timer-ring-cleanup.png',
  timerWell: 'assets/arctable/timer-well.png',
  peopleSurface: 'assets/arctable/people-surface-open.png',
  passPlateAvailable: 'assets/arctable/pass-plate-available.png',
  passPlateActive: 'assets/arctable/pass-plate-active.png',
  cleanupCorner: 'assets/arctable/cleanup-corner-accent.png',
  mediaApparatus: 'assets/arctable/media-apparatus-frame.png',
} as const

/** Overrides token defaults so `/assets/...` resolves under Vite base on GitHub Pages. */
export function applyPublicAssetCssUrls(): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement.style
  root.setProperty('--arc-wood-surface-image', publicAssetCssUrl(DESK_ASSET_PATHS.woodSurface))
  root.setProperty('--arc-schedule-setup-wood', publicAssetCssUrl(DESK_ASSET_PATHS.scheduleSetupWood))
  root.setProperty('--arc-desk-tray-texture', publicAssetCssUrl(DESK_ASSET_PATHS.greenFoldersDrawer))
  root.setProperty('--arc-desk-green-folders-drawer', publicAssetCssUrl(DESK_ASSET_PATHS.greenFoldersDrawer))
  root.setProperty('--arc-desk-calendar-background', publicAssetCssUrl(DESK_ASSET_PATHS.calendarBackground))
  root.setProperty('--arc-desk-todos-tab', publicAssetCssUrl(DESK_ASSET_PATHS.todosTab))
  root.setProperty('--arc-desk-planner-tab-mustard', publicAssetCssUrl(DESK_ASSET_PATHS.plannerTabMustard))
  root.setProperty('--arc-desk-postit-blue', publicAssetCssUrl(DESK_ASSET_PATHS.postitBlue))
  root.setProperty('--arc-desk-postit-cream', publicAssetCssUrl(DESK_ASSET_PATHS.postitCream))
  root.setProperty('--arctable-paper-cream', publicAssetCssUrl(ARCTABLE_ASSET_PATHS.paperCream))
  root.setProperty('--arctable-progress-rail', publicAssetCssUrl(ARCTABLE_ASSET_PATHS.progressRail))
  root.setProperty('--arctable-board-panel', publicAssetCssUrl(ARCTABLE_ASSET_PATHS.boardPanel))
  root.setProperty('--arctable-timer-ring', publicAssetCssUrl(ARCTABLE_ASSET_PATHS.timerRing))
  root.setProperty('--arctable-timer-ring-cleanup', publicAssetCssUrl(ARCTABLE_ASSET_PATHS.timerRingCleanup))
  root.setProperty('--arctable-timer-well', publicAssetCssUrl(ARCTABLE_ASSET_PATHS.timerWell))
  root.setProperty('--arctable-people-surface', publicAssetCssUrl(ARCTABLE_ASSET_PATHS.peopleSurface))
  root.setProperty('--arctable-pass-plate-available', publicAssetCssUrl(ARCTABLE_ASSET_PATHS.passPlateAvailable))
  root.setProperty('--arctable-pass-plate-active', publicAssetCssUrl(ARCTABLE_ASSET_PATHS.passPlateActive))
  root.setProperty('--arctable-cleanup-corner', publicAssetCssUrl(ARCTABLE_ASSET_PATHS.cleanupCorner))
  root.setProperty('--arctable-media-apparatus', publicAssetCssUrl(ARCTABLE_ASSET_PATHS.mediaApparatus))
}
