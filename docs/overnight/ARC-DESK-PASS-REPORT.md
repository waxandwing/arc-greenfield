# ARC Desk Pass Report

Branch: `cursor/arc-production-integration`  
Baseline: Arc Desk pass 3 + AT-001 mark + workspace layout migration (`97ebda9`)

## Stop condition (A–Z)

| ID | Item | Status |
|----|------|--------|
| A | Arc IS the Desk — single viewport, internal scroll only | **GREEN** — `.arc-shell--desk` locks page overflow; planner canvas scrolls internally |
| B | Material hierarchy (pattern → wood → cream/blue/paper) | **GREEN** — wood slab + pattern shell + molded tray asset |
| C | Planner object (Day/Week/Month/Year index) | **GREEN** — existing index tabs retained |
| D | Preferred desk planner view persisted | **GREEN** — `arc.desk-preferences.v1` + Settings → Home desk |
| E | Year view IA (mini months, remain, caught-up, quarters) | **GREEN** — `SchoolYearDeskView` + open course progression |
| F | Year expansion compresses tray/MSC | **GREEN** — `b01-furniture-composition--year-expanded` |
| G | Tray visible language | **GREEN** — TRAY tab + headings; internal `workspace` drawer id retained |
| H | Tray persistence / migration | **GREEN** — same `arc.captures.v1` + lesson unplaced flows |
| I | MSC pad on desk (not in tray) | **GREEN** — `DeskPriorityPad` column |
| J | Capture → tray + feedback | **GREEN** — existing global capture + "Captured." |
| K | Capture → MSC (canonical move) | **GREEN** — drag capture to lane promotes to task + removes capture |
| L | Drag audit | **YELLOW** — HTML5 DnD reused/extended (`deskDrag.ts`); tray↔calendar lesson DnD not expanded |
| M | Day notes / Important laws | **GREEN** — untouched through integration (`2079ff4`) |
| N | Settings §43 Home desk | **GREEN** — `HomeDeskPreferences` |
| O | Onboarding / school lookup / logo | **GREEN** — no regressions in touched paths |
| P | ArcTable entry | **GREEN** — AT-001 desk mark (5 actions + entitlement previews); routes via existing ArcTable session |
| Q | Move/Shift/Recovery | **GREEN** — out of scope, unchanged |
| R | Now/Needs Attention | **GREEN** — unchanged |
| S | Day retreat law | **GREEN** — unchanged |
| T | Section divergence | **GREEN** — unchanged |
| U | ArcTable internals | **GREEN** — unchanged |
| V | Import confirmation law | **GREEN** — unchanged |
| W | Evidence contact sheet | **GREEN** — `docs/overnight/evidence/arc-desk-pass/` |
| X | Contracts | **GREEN** — desk prefs, year desk projection, desk drag, `arcTableDeskActions` |
| Y | Smokes | **GREEN** — `tests/arc-desk-pass.smoke.mjs`, `tests/arc-desk-mark.smoke.mjs` |
| Z | Visual addendum (wood, tray, tab, year grid) | **GREEN** — assets in `public/assets/desk/` |

## Drag audit (summary)

| Flow | Before | After |
|------|--------|-------|
| Day note move | HTML5 drag in `CalendarDayNotes` | Unchanged |
| Task priority | Select menu in task bar | + desk pad drag + drop between lanes |
| Tray capture | Click/select promote | + drag to MSC lanes (removes capture id) |
| Tray ↔ calendar | Not implemented in source | **YELLOW** — still promote/place via menus |

## Visual addendum compliance

- Light wood desk: `public/assets/desk/light-wood-desk.png` on `.arc-desk-wood-frame`
- Blue molded tray: rim/well uses `blue-molded-tray.png` + inset shadows
- Mustard tab: texture on `.arc-index-tab--workspace`
- Year authority: mini-month grid, countdown, caught-up X, quarter legend

## Honest scope notes

- **Desk notes strip**: preference only; placeholder copy (optional surface not fully built).
- **Mobile desk**: tray/MSC docks hidden `<900px`; index TRAY drawer remains.
- **Full photoreal desk clutter**: intentionally omitted (editorial/tactile CSS only).

## ArcTable desk mark (functional)

- Asset: `public/assets/arctable/AT-001_table-mark.svg` (referenced from `ArcTableDeskMarkSvg`, not redrawn).
- Actions (`arcTableDeskActions.ts`): center **open**; blue **startOrResume**; clay **timerCleanup**; mustard **classTools**; green **mediaDirections**.
- Entitlement: single `ArcTableDeskFixture`; `paid-live` executes via `AppFrame` → `useArcTableSession` + `setArcTableDeskLaunch`; `free-preview` shows per-action preview with Explore / Add ArcTable (mark never grayed or locked).
- Edit desk: `interactionsDisabled` while desk edit session is active (re-enabled on Done).
- Evidence: `docs/overnight/evidence/arc-desk-mark/` (idle, quadrant hover, center/timer previews).

## Tests

```bash
npm run test:contracts
npm run test:arc-desk-pass
npm run test:arc-desk-mark
npm run test:plan-year
```

Evidence screenshots: `docs/overnight/evidence/arc-desk-pass/` (+ reference `00`), `arc-desk-mark/` for AT-001 interactions.
