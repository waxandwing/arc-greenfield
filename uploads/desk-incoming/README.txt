Kelly desk asset drop folder
==============================

**PRIMARY DROP PATH FOR LABELED SVGs:** this folder — `uploads/desk-incoming/`

Put new desk PNGs, SVGs, or exports here when you are not sure of the final folder.
Git is set up to track files in this folder (PNG and SVG are not ignored).

Steps to get your files onto GitHub so an agent can use them:

  1. Drag your PNG or SVG files into this folder (uploads/desk-incoming/) in Cursor or Finder.
  2. Edit this README and add one line per file under "Files in this folder" — filename plus what the image is.
  3. In Terminal, from the repo root: git add uploads/desk-incoming/
  4. Commit: git commit -m "Add Kelly desk assets to incoming drop folder"
  5. Push: git push origin main
  6. In Cursor, ask: "Incorporate the desk assets in uploads/desk-incoming"

An agent will move files into public/assets/desk/, public/assets/desk/slices/,
public/assets/desk/figma/, public/assets/desk/canonical/, public/assets/arc/icarus/,
or public/assets/arctable/ as appropriate. Do not put images in src/.

Example line for the list below:
  new-priorities-tab.png — folder tab from Figma export 2026-09-15

Files in this folder (update this list when you add assets):

  kelly-desk-v3-preview-repair-2026-08-03.png — CURRENT APP DISPLAY (broken baseline, not visual target); evidence copy at docs/overnight/evidence/kelly-current-display-2026-08-03.png — see docs/overnight/KELLY-CURRENT-VS-TARGET.md
  LABELED-SVG-CHECKLIST.md — checklist of the 22 expected Kelly labeled SVG filenames + P0 wiring stubs

Teaching week zip (Teaching_week__1__01fd.zip) — extracted to teaching-week-1/:
  Only 1.png (full comp) + 2.png (blank). The app uses REAL files from public/assets/desk/ — not crops from 1.png — unless a developer turns on comp-crop mode.
  Please add a separate export pack here: one PNG or SVG per layer (IDEAS drawer, TO-DOS folder, planner tabs, frame accents, title mark). See docs/overnight/TEACHING-WEEK-ASSETS-HONESTY.md.

========================================================================
BLOCKED — Kelly labeled SVG pack (22 files) — drop HERE
========================================================================

Re-hunt 2026-09-16 confirmed the 22 labeled source SVGs are still missing from:
  git (incl. asset-reconciliation-labeled-svgs), Drive (only 2 unrelated legacy SVGs),
  Gmail, uploads/, public/assets/, /tmp artifacts, LFS, and Skin Lab zips.

Exact expected filenames are listed in LABELED-SVG-CHECKLIST.md. Highest priority (USE):

  - Settings tab (USE).svg
  - TODO tab (use).svg
  - tray image (use).svg
  - Wood Background Light.svg
  - calendar background.svg
  - calendar selected tab view.svg / unselected calendar states.svg
  - start class arctable logo.svg
  - blue/green/yellow/red magnet SVGs
  - to left of date on calendar rainbow icon.svg
  - today button.svg / today highlighter icon.svg

Preserve exact names (incl. "(USE)"). A single zip is fine.
Agents rename into public/assets/desk/canonical/ and wire P0 1–9 — they must NOT invent fake Kelly art.
