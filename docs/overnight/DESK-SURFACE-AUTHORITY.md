# Desk surface authority (Kelly)

**Supersedes** any doc that wired `public/assets/desk/light-wood-desk.png` as the canonical full-viewport Arc Desk wood.

| Context | Asset | CSS token |
|---------|--------|-----------|
| **Full viewport / working frame** (`.arc-shell--desk`, `.arc-desk-tabletop`) | `public/assets/arc/icarus/texture-wood.png` | `--arc-wood-surface-image` |
| **Schedule setup / onboarding** (calendar-on-wood alt) | `public/assets/desk/light-wood-desk.png` | `--arc-schedule-setup-wood` |

Wiring: `src/publicAssetUrl.ts` → `applyPublicAssetCssUrls()` (GitHub Pages base-aware). Defaults: `src/styles/tokens.css`.

Compare `texture-wood.png` to Figma desk frame `6:3194` before further art swaps; the token path is production authority, not a pending candidate.

**Date:** 2026-09-15 · Branch: `cursor/arc-production-integration`
