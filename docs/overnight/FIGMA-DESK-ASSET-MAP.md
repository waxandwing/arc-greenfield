# Figma desk asset map (Kelly three-state mockup)

**Figma file:** `CfWcuQPY4ljYXondICj2ZX` (page `30:46` — Arc Multi-Prep Synthesis)  
**Legacy frame id:** `6:3194` — **not present** in this file revision (MCP 2026-09-15).  
**Closest exported comps:** `37:11052` (Codex desk hero, 1672×941) and `37:11053` (image-gen-7, 1448×1086) under frame `37:11061` “Theme source- Arc and Arctable”.

Evidence PNGs: `docs/overnight/evidence/figma-desk-6-3194/`.

## Three mockup states (Kelly)

| State | Figma (this file) | In repo (`public/assets/`) | Gap |
|-------|-------------------|----------------------------|-----|
| **Teaching week center** | Raster comps `37:11052` / `37:11053` — green planner spread, “Teaching week” title, week grid | Planner chrome is **CSS** (`arc-desk.css`, `shell-visibility-lock.css`); paper `arc/planner-paper.png`, `arctable/paper-cream.png` | No single exported **planner frame PNG**; tab mustard strip uses `desk/planner-tab-mustard.png` only |
| **Green Notes tray (top)** | Blue/green molded tray in comp (top-center) | `desk/blue-molded-tray.png` | Color naming drift (asset is blue-molded; mock reads green-teal). No separate **notes-only** tray art |
| **Today’s Priorities folder (left)** | Wood folder tab “YOUR DAY” / priorities copy in `37:11052` | **None** — `DeskPriorityPad` is CSS + `DeskPriorityPad.tsx` | Missing **folder tab raster** (wood grain + tab geometry) |
| **Quick Capture sticky** | Yellow sticky + “Quick Capture” in comp | **None** — sticky is CSS (`DeskQuickCaptureSticky`) | Missing optional **sticky note texture** PNG |
| **ArcTable logo (corner)** | Circular mark in comp | `arctable/AT-001_table-mark.svg` (+ PNG icon set under `arctable/logo-icon-*`) | Mark OK; **132px desk scale** is CSS/SVG, not Figma slice |
| **Light wood tabletop** | Full-bleed wood in comp | `arc/icarus/texture-wood.png` | Shipped (`--arc-wood-surface-image`) |
| **Exterior / pattern (non-desk)** | Pattern visible behind folder in some comps | `arc/pattern-grid-tile-2048.png`, `arc/patterns/*` | Desk mode correctly **suppresses** pattern on shell; Figma still shows pattern in marketing comps |

## `public/assets/desk/` (committed)

| File | Role |
|------|------|
| `texture-wood.png` (icarus) | Desk shell + tabletop background |
| `light-wood-desk.png` | Schedule setup / onboarding alt (`--arc-schedule-setup-wood`) |
| `blue-molded-tray.png` | Molded tray dock texture |
| `planner-tab-mustard.png` | Selected planner index tab fill |

## `public/assets/arc/` (desk-adjacent)

| File | Role |
|------|------|
| `planner-paper.png`, `texture-cream-paper.png` | Planner / note surfaces |
| `arc-mark.png`, `arc-mark-stacked.png` | Arc wordmark (non-desk shell) |
| `pattern-*`, `patterns/at-pattern-*` | Legacy shell exterior (not desk tabletop) |

## `public/assets/arctable/` (desk fixture)

| File | Role |
|------|------|
| `AT-001_table-mark.svg` | ArcTable desk mark (primary) |
| `logo-icon-framed-arc-*` | Alternate marks / entitlements |
| `paper-cream.png` | Shared cream paper texture |

## Exportable Figma assets (recommended next imports)

From MCP screenshots (download before URLs expire):

1. **Priority folder** — isolate from `37:11052` or rebuild as layered export (wood + tab).
2. **Quick capture sticky** — isolate yellow pad from same comp.
3. **Tray variant** — if design switches to green tray, export tray layer separately (do not recolor `blue-molded-tray.png` without design sign-off).
4. **Planner chrome slice** — optional 944×652 reference PNG for pixel-diff tests (not required for runtime if CSS stays authoritative).

## Runtime vs Figma

Implementation uses **proportional CSS slots** on `1440×1024` tabletop, not fixed 1696×1254 Figma frame. Pixel parity blockers: missing folder + sticky rasters, tray hue, planner tab placement on spread edge, and Year view mini-grid UX (routing defaults to **Week** for desk home).
