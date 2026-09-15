# Green folders drawer (Kelly comp integration)

## Assets

| Asset | Path | Source |
|-------|------|--------|
| Green folders drawer (authored) | `public/assets/desk/green-folders-drawer.svg` | No Kelly SVG in repo; vector authored from Figma ref `docs/overnight/evidence/figma-desk-6-3194/01-codex-image-37-11052.png` and three-state mockup (forest green panel, decorative post-its, **FOLDERS** pull tab) |
| Legacy blue molded tray (retained, not used on live dock) | `public/assets/desk/blue-molded-tray.png` | Previous desk tray texture |
| Wood authority (unchanged) | `assets/arc/icarus/texture-wood.png` via `--arc-wood-surface-image` | DESK-SURFACE-AUTHORITY |

CSS token: `--arc-desk-green-folders-drawer` / `--arc-desk-tray-texture` set in `applyPublicAssetCssUrls()` (`src/publicAssetUrl.ts`).

## Behavior

- **Retracted:** `.arc-desk-green-folders-drawer[data-extended='false']` — drawer translated mostly off-screen at the top; **FOLDERS** tab remains clickable.
- **Extended:** `[data-extended='true']` — drawer slides down over the planner (~middle of wood); `WorkspacePanel` content fills the well (same stack/promotion logic as before).
- **TRAY index tab:** Opens the side `WorkspacePanel` (`b01-fridge-surface` / `.b01-tray-surface`); physical dock hides (`data-workspace-open='true'`) — desk law unchanged.
- No icarus `fridge-*` imagery imported; ArcTable mark and onboarding untouched.

## Code

- `src/components/DeskGreenFoldersDrawer.tsx` — visual chrome + extend/retract toggle
- `src/components/B01Furniture.tsx` — physical dock uses green drawer instead of blue molded rim
- `src/styles/arc-desk.css` — top-anchored drawer motion and well styling

## UI toggle

Click the **FOLDERS** tab on the green drawer (`data-testid="arc-desk-folders-tab"`) to retract/extend the physical drawer. Click planner **TRAY** to open/close the full tray side panel.

## Evidence

Screenshots: `docs/overnight/evidence/green-folders-drawer/`
