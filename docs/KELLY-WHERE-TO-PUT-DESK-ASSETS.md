# Where to put desk assets (Kelly)

This guide is for **adding or updating pictures and graphics** for the Arc **desk** screen. Developers move files from here into the live app; you do not need to touch code folders.

---

## The simple rule

| If the file is… | Put it here |
|-----------------|-------------|
| A **small cropped PNG** that sits on top of a desk piece (folder tab, planner edge, tray chrome, “Start class” frame, etc.) | `public/assets/desk/slices/` |
| A **full-desk or Figma export** used as a reference (hero mockup, not wired directly in the app) | `public/assets/desk/figma/` |
| **Whole-desk or large desk props** (wood surface variant, molded tray, mustard planner tab strip, drawer SVG) | `public/assets/desk/` (same folder as `light-wood-desk.png`) |
| **Wood, paper, or pattern textures** shared with the wider Arc look | `public/assets/arc/icarus/` |
| **ArcTable logo, cream paper, board/timer chrome** for the desk corner fixture | `public/assets/arctable/` |
| **You are not sure** which bucket it belongs in | `uploads/desk-incoming/` (see below) |

**Do not** put image files under `src/`. That folder is for app code. Only a developer should wire assets from `public/assets/` into the app.

**Do not** edit `public/assets/desk/slices/manifest.json` yourself. After slice PNGs are in place, ask a developer or Cursor agent to update the manifest and runtime wiring.

---

## What each folder is for

### `public/assets/desk/slices/`

Pixel-accurate **PNG slices** cut from the Kelly desk mockup. The app loads them using names listed in `manifest.json` in this same folder.

Examples already in the repo: `todos-folder-tab.png`, `ideas-drawer-chrome.png`, `planner-edge-tab-week-inactive.png`, `start-class-frame.png`, and similar.

When you add a **new slice**, use a **clear lowercase name with hyphens** (same style as the files above) and tell the agent which desk piece it replaces.

### `public/assets/desk/figma/`

**Reference exports** from Figma (full comp or hero), for comparison and future cropping—not usually linked directly in the UI.

Example: `desk-hero-37-11052.png`.

### `public/assets/desk/` (top level)

**Larger single assets** for the desk layout:

| File (examples) | Purpose |
|-----------------|--------|
| `light-wood-desk.png` | Light wood tabletop (e.g. schedule setup) |
| `blue-molded-tray.png` | Molded tray / dock texture |
| `planner-tab-mustard.png` | Selected planner tab color strip |
| `green-folders-drawer.svg` | Green folders / IDEAS drawer graphic (vector) |

### `public/assets/arc/icarus/`

**Textures and brand surfaces** promoted from the Icarus design library: wood, cream/mustard/blue paper, geometric pattern, stacked Arc mark, etc. The main desk wood background uses `texture-wood.png` here.

### `public/assets/arctable/`

**ArcTable-specific** art: table mark (`AT-001_table-mark.svg`), logo icons, cream paper, timer/board UI chrome used on or near the desk.

### `docs/overnight/` (for your awareness only)

Technical notes for agents (e.g. `DESK-SLICE-PLACEMENT.md`, `FIGMA-DESK-ASSET-MAP.md`). **You do not need to put files here** unless an agent asks for evidence screenshots.

---

## Asset purpose → folder (quick lookup)

| Asset purpose | Folder path |
|---------------|-------------|
| Cropped desk chrome PNG (folder, planner frame, tabs, tray chrome) | `public/assets/desk/slices/` |
| Slice list / placement metadata (developer) | `public/assets/desk/slices/manifest.json` |
| Figma hero or full comp reference PNG | `public/assets/desk/figma/` |
| Desk wood, tray, tab strip, drawer SVG | `public/assets/desk/` |
| Wood / paper / pattern textures | `public/assets/arc/icarus/` |
| ArcTable mark, logos, cream paper, fixture chrome | `public/assets/arctable/` |
| Not sure / batch drop from Drive or export | `uploads/desk-incoming/` |

---

## If you are unsure: use the drop folder

1. Copy your files into **`uploads/desk-incoming/`** at the repo root (create the folder if it is missing).
2. Add or update **`uploads/desk-incoming/README.txt`** with a plain list of filenames and one line each about what they are for (e.g. “new priorities folder tab from Figma 9/15”).
3. Do **not** worry about git or `src/`—an agent will sort them into `public/assets/…` and hook them up.

The **`uploads/`** folder at the repo root is your **staging area**. It is meant for incoming art that is not sorted yet. Files you put here may show as “untracked” in git until a developer or agent commits them to the right `public/assets/` path.

---

## How to ask Cursor to incorporate your files

In a Cloud Agent or Cursor chat on this repo, say something like:

> **Incorporate the desk assets in `uploads/desk-incoming`.**  
> Use `docs/KELLY-WHERE-TO-PUT-DESK-ASSETS.md` and `docs/overnight/DESK-SLICE-PLACEMENT.md` for placement. Update slices and manifest if needed.

If files are already in the correct `public/assets/…` folder, say:

> **Wire up the new PNGs in `public/assets/desk/slices/`** (or name the exact path).

---

## What developers handle (so you can skip it)

- `src/navigation/deskSliceManifestData.ts` and `src/desk/deskSliceRuntime.ts` — code that points the app at slice PNGs  
- `scripts/export-desk-figma-slices.mjs` — re-export from Figma evidence  
- Comp-crop slices are **off by default**. Developers enable with `VITE_ARC_DESK_SLICES=true` or `?deskSlices=1` (see `TEACHING-WEEK-ASSETS-HONESTY.md`)

---

## Related docs (optional reading)

- `docs/overnight/DESK-SLICE-PLACEMENT.md` — which slice goes on which desk widget  
- `docs/overnight/FIGMA-DESK-ASSET-MAP.md` — Figma file vs what is already in the repo  
