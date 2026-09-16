# Desk surface authority (Kelly)

**Singular wood authority (2026-09-16):** `public/assets/desk/canonical/wood-background-light.png`

Supersedes competing surfaces:

- `public/assets/arc/icarus/texture-wood.png` (legacy Icarus viewport)
- `public/assets/desk/light-wood-desk.png` (legacy schedule-setup / composed frame)

| Context | Asset | CSS token |
|---------|--------|-----------|
| **Full viewport / working frame** (`.arc-shell--desk`) | `public/assets/desk/canonical/wood-background-light.png` | `--arc-wood-surface-image` |
| **Schedule setup / onboarding** (calendar-on-wood) | same file | `--arc-schedule-setup-wood` |

## Wire rules

- `background-size: cover` (never `fill` / `100% 100%` stretch)
- No recolor filters, gradients, or blend washes over the wood grain
- Wiring: `src/publicAssetUrl.ts` → `applyPublicAssetCssUrls()` (GitHub Pages base-aware). Defaults: `src/styles/tokens.css`
- Provenance: `public/assets/desk/canonical/PROVENANCE-kelly-wood-todos-tab-2026-09-16.json`

**Date:** 2026-09-16 · Branch: `cursor/kelly-wood-todos-tab-e444`
