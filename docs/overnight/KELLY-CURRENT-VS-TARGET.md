# Kelly desk: current display vs visual target

**For Kelly and agents — read this before using any full-desk PNG.**

## Visual target (north star)

**Teaching week** mock: wood tabletop, IDEAS drawer, TO-DOS folder, planner title **Teaching week**, kicker **SEPTEMBER 7 - 11 • WEEK 4**, **WEEK** tab active, week grid (AP / 2D / 3D).

| Role | Path |
|------|------|
| Kelly Teaching week comp (pixel truth) | `/home/ubuntu/.cursor/projects/workspace/assets/f5602c3b-2ac0-4b74-a4ad-2f359a219b9a.png` |
| Figma hero export | `docs/overnight/evidence/figma-desk-6-3194/01-codex-image-37-11052.png` |
| Committed hero frame | `public/assets/desk/figma/desk-hero-37-11052.png` |

Full spec: `docs/overnight/MASTER-DESK-VISUAL-GOAL.md` and `docs/overnight/DESK-PIXEL-REQUIREMENTS.md`.

## Current broken display (baseline only — not the target)

Kelly confirmed the **desk v3 preview-repair** screenshot (**2026-08-03**) shows how the app **looks today**, including wrong month-home layout and other drift. **Do not** wire this file as authority comp, Figma hero, or default `DESK_KELLY_REF`.

| Copy | Path |
|------|------|
| Evidence (git) | `docs/overnight/evidence/kelly-current-display-2026-08-03.png` |
| Incoming drop | `uploads/desk-incoming/kelly-desk-v3-preview-repair-2026-08-03.png` |

Use these only to document **current state** or diff “where we are” vs Teaching week — never as the design north star.

## Pixel pass default

`npm run test:desk-pixel-pass` compares preview to the **Teaching week** Kelly comp (override with `DESK_KELLY_REF` if needed). It must **not** default to the v3 current-display PNG.

## What went wrong (2026-09-15)

Agent run **bc-3a15e226** (commit `c29f613`) copied the v3 screenshot into `public/assets/desk/figma/` and treated it as authority. That was reverted on main: file moved to evidence, docs and `scripts/desk-pixel-pass.mjs` restored to Teaching week.
