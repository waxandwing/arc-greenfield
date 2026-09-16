import { publicAssetUrl } from '../publicAssetUrl'

/** Kelly chat PNG ingest (2026-09-16) — interim wires until labeled SVG USE binaries land. */
export const DESK_CANONICAL_PNG = {
  todosTab: 'assets/desk/canonical/todos-tab.png',
  todosTabAlt: 'assets/desk/canonical/todos-tab-alt.png',
  ideasTray: 'assets/desk/canonical/ideas-tray.png',
  settingsTab: 'assets/desk/canonical/settings-tab.png',
  postitBlue: 'assets/desk/canonical/postit-blue.png',
  postitCream: 'assets/desk/canonical/postit-cream.png',
} as const

export function deskCanonicalPngUrl(key: keyof typeof DESK_CANONICAL_PNG): string {
  return publicAssetUrl(DESK_CANONICAL_PNG[key])
}
