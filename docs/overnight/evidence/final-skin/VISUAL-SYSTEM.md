# Arc Plan — final visual system (Stage 7)

Central tokens live in `src/styles/tokens.css`. Plan shell layering: `arc-fonts.css` → `arc-plan-shell.css` → feature CSS.

## Color

| Token | Value | Use |
|-------|-------|-----|
| `--field` | `#FBF8F0` | Plan page background (cream paper field) |
| `--paper` / `--paper-raised` | `#F3EBDD` / `#F7F1E7` | Raised cells, inputs |
| `--field-elevated` | `#FFFDF8` | Cards, overlays |
| `--ink` | `#2C2E2E` | Primary text, selected period rail |
| `--soft-charcoal` | `#4A4945` | Secondary copy, kickers |
| `--accent-blue` / `--accent-blue-deep` | `#657F90` / `#4A6678` | Plan CTAs, links, import emphasis (preferred over pine on Plan) |
| `--dusty-blue` / `--focus-blue` | `#7C9CAD` / `#657F90` | Focus rings, import SOURCE lane |
| `--mustard` | `#E4B33D` | Primary buttons, PROPOSAL lane accent |
| `--terracotta-text` | `#A84F32` | Warnings, held work, fixed anchors |
| `--pine-live` | `#1F4B3A` | **ArcTable live classroom only** (chip, student header) |

## Typography

| Token | Stack | Use |
|-------|-------|-----|
| `--font-display` / `--font-editorial` | Instrument Serif + serif fallbacks | View titles, lesson headings, Year/Month hero type |
| `--font-ui` | Inter + League Spartan | Body, controls, dense grids |
| `--font-label` | League Spartan | Kickers, section labels, uppercase rails |
| `--type-view-title` | clamp 34–42px Instrument Serif | H1 view switcher |
| `--type-section` | 12px League Spartan 800 | `.section-label` grammar (unchanged copy roles) |

Fonts loaded via `src/styles/arc-fonts.css` (`/assets/InstrumentSerif-Regular.ttf`, `Inter-Variable.woff2`, `LeagueSpartan-VF.woff2`).

## Spacing & geometry

Spacing scale: `--space-1` (4px) through `--space-16` (64px). Radii: `--radius-sm|md|lg`, organic `--radius-bloop` for cropped decorative shapes on `.arc-shell` (not repeating trim/scallop borders). Gutters: `--page-gutter` 32px, `--mobile-gutter` 20px.

## Surfaces & motion

Lines: `--line-subtle`, `--line-strong`, `--control-border`. Shadows: `--shadow-hairline`, `--shadow-field`, `--shadow-overlay`. Motion: `--duration-fast` 120ms, `--duration-medium` 220ms, `--ease-out-soft`; respects `prefers-reduced-motion` in shell and ArcTable.

## Import review lanes (visual distinction)

- **SOURCE** (left column): dusty-blue left rule + blue section label
- **Arc proposal**: mustard left rule + terracotta section label
- **Re-import / ambiguity**: lavender left rule; resolution `em` uses accent blue (CHANGE)

## Explicitly not in Plan skin

Journal spine, Fridge chrome, dark-green-dominant Plan backgrounds, SaaS dashboard cards, repeating scallop top trim, new product features.
