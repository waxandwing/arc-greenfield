# ARC Desk Visual Implementation Report

**Branch:** `cursor/arc-production-integration`  
**Implementation SHA:** `TBD` (desk visual: `c8f79ae`; follow-up tests/evidence on integration after `4701345`)  
**Figma authority:** file `CfWcuQPY4ljYXondICj2ZX`, frame node `6:3194` (1696×1254 ref; wood field 1440×1024)  
**Behavioral authority:** Arc on branch (planning, tray, MSC, edit workspace, stacks unchanged)

## Summary

Recomposed Plan calendar mode into a **physical desk**: centered light-wood **tabletop** (`1440×1024` aspect, scaled in viewport), absolute placement of planner / tray / MSC / quick capture / notes / ArcTable, **planner-attached index tabs** (no vertical SaaS rail on desk), and **no page scroll** (html/body + shell lock; internal planner scroll only). Domain logic, routing, drag contracts, and ArcTable internals were not rewritten.

## Component mapping (Kelly 1–12)

| # | Spec | Implementation |
|---|------|----------------|
| 1 | Desk root, light wood, no SaaS shell | `.arc-shell--desk` neutral mat; `.arc-desk-viewport` + `.arc-desk-tabletop` wood grain |
| 2 | Planner ~944×652, cream, green trim, strong shadow | `.arc-calendar-spread--desk` + proportional `.arc-planner-object` slot (~65.6×63.7%) |
| 3 | Physical tabs on planner | `.arc-planner-physical-tabs` on planner; side rail tabs hidden when `deskEnabled` |
| 4 | Tray upper-central, blue molded asset | `.arc-desk-tray-dock` + `blue-molded-tray.png`; `WorkspacePanel` unchanged |
| 5 | MSC pad left, rotated cream pad | `.arc-desk-priority-dock` + `DeskPriorityPad`; `rotate(-2.2deg)` |
| 6 | Quick capture upper-right sticky | `DeskQuickCaptureSticky` + existing `GlobalCaptureAffordance` |
| 7 | Notes secondary object | `DeskNotesObject` when `showDeskNotes`; Day/Month note UI unchanged in views |
| 8 | ArcTable ~132×132, AT-001 assets | `ArcTableDeskFixture` `markSize={132}`; SVG mark unchanged |
| 9 | Object shadows | Per-object drop-shadow / box-shadow on planner, tray, MSC, sticky, notes |
| 10 | Typography | No font token changes (Instrument Serif, Inter, League Spartan) |
| 11 | Desktop, no page scroll | `html:has(.arc-shell--desk)` overflow hidden; tabletop scales with `min()` |
| 12 | Edit Workspace + move/pin | Existing grid edit mode + `deskLayout` persistence verified |

## Files changed

- `src/components/B01Furniture.tsx` — desk viewport/tabletop, physical tabs, overlay side rail
- `src/components/AppFrame.tsx` — desk quick capture sticky; capture removed from shell bar on desk
- `src/components/DeskQuickCaptureSticky.tsx` — new presentation wrapper
- `src/components/DeskNotesObject.tsx` — new secondary notes pad
- `src/components/ArcTableDeskFixture.tsx` — optional `markSize` (132 on desk)
- `src/styles/arc-desk.css` — physical layout, shadows, sticky, tab strip
- `src/styles/b01-furniture.css` — desk overlay panels (`b01-side-rail--desk-overlays`)
- `tests/arc-desk-pass.smoke.mjs` — wood assertion on `.arc-desk-tabletop`
- `tests/arc-desk-figma-evidence.mjs` — evidence capture at 1696×1254
- `package.json` — `test:arc-desk-figma-pass`
- Minor: `CalendarProjectionView.tsx`, `deskPreferences.ts` (typecheck)

## Behaviors verified

| Behavior | Result |
|----------|--------|
| `npm run test:contracts` | **GREEN** |
| `npm run test:arc-desk-pass` | **GREEN** — tray, MSC, ArcTable, edit workspace, layout persistence, year desk |
| `npm run test:edit-workspace` | **GREEN** — stacks, pin, tray drag |
| `npm run test:arc-desk-mark` | **GREEN** — AT-001 mark, quadrants, entitlements |
| `npm run test:plan-year` | **GREEN** — Year semantics intact; smoke fix removed duplicate `getByText('My Teaching Day')` strict-mode clash with settings `<option>` (unrelated to desk layout) |
| Preview `4173` + `?demo=1` | Rebuilt bundle; preview restarted on port 4173 |

Preserved (not modified): planning domain, capture persistence, tray↔planner DnD, MSC promote, day notes laws, ArcTable session surfaces, shift/recovery, onboarding logic.

## Visual diffs retained

- Side-by-side and pass screenshots under `docs/overnight/evidence/arc-desk-figma-pass/`
- Updated desk pass shots under `docs/overnight/evidence/arc-desk-pass/` (smoke run)

## Mismatches / honest gaps

| Item | Severity | Notes |
|------|----------|-------|
| Figma `6:3194` export via MCP | **YELLOW** | Node not resolved in MCP session; `01-figma-reference.png` seeded from prior desk pass reference |
| `06-tray-drag.png` | — | Captured via evidence script (tray post-it hover + pointer down; quick-capture overlay pointer-events disabled for shot) |
| Pixel parity vs Figma | **YELLOW** | Proportional CSS slots, not literal px engine; reconciliation pass 04–09 captured |
| `test:plan-year` (historical) | — | Was **RED** on duplicate-text Playwright strict mode; fixed in smoke selector only |
| Mobile desk | **YELLOW** | Unchanged: tray/MSC hidden `<900px`; tabs wrap on planner |

## RED / YELLOW rollup

- **RED:** none at this SHA.
- **YELLOW:** Figma MCP frame export; sub-pixel Figma parity; mobile desk unchanged.

## Evidence list

`docs/overnight/evidence/arc-desk-figma-pass/`:

- `01-figma-reference.png`
- `02-implementation-pass-1.png`
- `03-side-by-side.png` (ref + impl composite, base64 embed)
- `04-final-desk.png`
- `05-edit-workspace.png`
- `06-tray-drag.png`
- `07-day.png`, `08-week.png`, `09-month.png`

## Preview

Local: `npm run preview -- --host 127.0.0.1 --port 4173` → `http://127.0.0.1:4173/?demo=1`

**Stop:** Implementation + report only — no merge, no deploy.
