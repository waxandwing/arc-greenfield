/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ARC_CALENDAR_TEXT_ENDPOINT?: string
  readonly VITE_ARC_CALENDAR_TEXT_AUTH_TOKEN?: string
  readonly VITE_ARC_CALENDAR_TEXT_API_KEY?: string
  /** When "true", empty browsers load the gauntlet demo fixture (same as ?demo=1). */
  readonly VITE_ARC_DEMO?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
