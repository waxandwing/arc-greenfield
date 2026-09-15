# Icarus promotion pass report (Kelly)

**Date:** 2026-09-15  
**Branch:** `cursor/icarus-promotion-pass-0350` (includes merged `cursor/desk-surface-authority-ffca` on `cursor/arc-production-integration`)  
**Scope:** Visual compare only — no extra Icarus imports, no tray/mark/fridge/onboarding edits.

## Winners

| Surface | Winner | Rationale |
|---------|--------|-----------|
| **Wood — full viewport / tabletop** (`--arc-wood-surface-image`) | **`public/assets/arc/icarus/texture-wood.png`** | Only committed **seamless** light-wood field at desk scale (1536×1024). Pre-merge production pointed the viewport at `desk/light-wood-desk.png`, which is a **composed onboarding frame** (folder tab, copy, pattern border)—unusable as full-bleed tabletop. Icarus tile reads clean under planner/tray slots with low luminance noise (σ≈5.2 vs Figma folder crop σ≈29.9). **Tone:** ~10–15 RGB units lighter/golden than Figma honey folder wood—see YELLOW. |
| **Wood — schedule setup / calendar-on-wood** (`--arc-schedule-setup-wood`) | **`public/assets/desk/light-wood-desk.png`** (unchanged) | Literal Kelly onboarding folder comp; warm honey grain aligns with Figma `37:11052` folder crop (mean RGB within ~8 units). Stays off the main viewport token per `DESK-SURFACE-AUTHORITY.md`. |
| **Cream — planner-like rectangle fill** (`--plan-surface-paper`, ArcTable body) | **Production `public/assets/arc/planner-paper.png`** (= **`arctable/paper-cream.png`**, same bytes) | Softer mottled cream keeps grid/type legibility under green planner chrome; Icarus `texture-cream-paper.png` shows finer fiber tooth that competes with UI lines in the desk mock. |
| **Cream — paper texture overlay** (`--plan-surface-paper-texture`, entry flow) | **`public/assets/arc/texture-cream-paper.png`** (already shipped) | **Byte-identical** to `public/assets/arc/icarus/texture-cream-paper.png` (MD5 `62008f7b…`); no Icarus-folder promotion needed. |

## Visual rationale (Figma authority)

Reference: `docs/overnight/evidence/figma-desk-6-3194/01-codex-image-37-11052.png`, map `docs/overnight/FIGMA-DESK-ASSET-MAP.md`.

- **Grain & contrast:** Figma folder wood and cropped `light-wood-desk` wood share warm horizontal grain with moderate contrast. Icarus viewport wood is **finer and calmer**—better for a full-screen UI field, slightly **under-warm** vs comp.
- **Crop / asset class:** `light-wood-desk.png` must not return as the viewport URL; side-by-side `01c-*` shows why (folder UI + pattern). Cropped folder wood is tone reference only.
- **Tactile realism:** Icarus wood improves realism vs the old “whole PNG stretched” viewport bug; schedule setup keeps the literal folder raster.
- **Legibility / Arc fit:** Paler icarus tabletop preserves contrast for green planner chrome and blue tray; production cream paper stays the planner interior fill.

## Files changed (this pass)

| Path | Change |
|------|--------|
| `docs/overnight/ICARUS-PROMOTION-PASS-REPORT.md` | This report |
| `docs/overnight/evidence/icarus-promotion-pass/*` | Contact sheets + `metrics.json` |
| `scripts/icarus-promotion-contact-sheet.py` | Evidence generator |

**No `src/` or asset wiring changes** — merged desk-surface authority already matches these winners (`texture-wood` viewport, `light-wood-desk` schedule setup, planner/cream tokens unchanged).

## Tests run

```text
npm run test:arc-desk-pass
→ Arc desk demo reset smoke passed
→ Arc desk pass smoke passed
```

(Contract tests not run — `src/` untouched.)

## Evidence paths

- `docs/overnight/evidence/icarus-promotion-pass/00-figma-reference-37-11052-thumb.png`
- `docs/overnight/evidence/icarus-promotion-pass/01-wood-tabletop-texture-compare.png`
- `docs/overnight/evidence/icarus-promotion-pass/01b-figma-wood-folder-crop-reference.png`
- `docs/overnight/evidence/icarus-promotion-pass/01c-wood-three-way-figma-icarus-lightwood-crop.png`
- `docs/overnight/evidence/icarus-promotion-pass/02-wood-desk-composition-mock-planner-paper.png`
- `docs/overnight/evidence/icarus-promotion-pass/03-cream-planner-rectangle-side-by-side.png`
- `docs/overnight/evidence/icarus-promotion-pass/metrics.json`

## YELLOW concerns

1. **Icarus wood tone vs Figma honey** — viewport tile is blonder/cooler than folder wood in `37:11052`; consider a future **color-grade pass** on `texture-wood.png`, not wiring `light-wood-desk.png` back to `--arc-wood-surface-image`.
2. **Do not tile `light-wood-desk.png` whole-frame** for viewport (regression risk pre-`bd79bd1`).
3. **Icarus cream duplicate** — `icarus/texture-cream-paper.png` equals `arc/texture-cream-paper.png`; keep single canonical path in tokens to avoid drift.
4. **Not promoted (by scope):** pattern-arc-geometric, mustard/blue papers, calendar-open-planner, arc-mark-stacked.

## Compare-only assets (unchanged)

- `public/assets/arc/icarus/texture-wood.png` ↔ `public/assets/desk/light-wood-desk.png`
- `public/assets/arc/icarus/texture-cream-paper.png` ↔ `planner-paper.png` / `paper-cream.png`
