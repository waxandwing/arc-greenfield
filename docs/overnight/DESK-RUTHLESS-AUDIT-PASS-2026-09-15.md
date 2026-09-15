# Desk Ruthless Audit Pass — integration tip

**Branch:** `cursor/vertical-slices-desk-audit-b637` (from `cursor/arc-production-integration`)  
**Date:** 2026-09-15  
**Authority:** `docs/overnight/AUDIT-RULES-FROM-DRIVE.md` (Google Drive Arc folder)  
**Evidence:** `docs/overnight/evidence/desk-ruthless-audit/`

## Score summary

| Layer | Verdict | Notes |
|-------|---------|-------|
| Drive **Product Application** (calendar center, furniture geometry) | **YELLOW→GREEN** on structural smokes | Enlarge uses portal; furniture smokes unchanged |
| Drive **Desktop Blueprint** (edge tabs, no left rail, no calendar squeeze) | **PASS** | Smokes + code |
| Drive **Gate 1 accessibility veto** (keyboard/focus on enlarge) | **PASS** | Escape, focus trap, return focus — `tests/arc-desk-pass.smoke.mjs` |
| Drive **Gate 1 product survival** (view switch in pop-out) | **PASS** | Live calendar body in dialog |
| Drive **80/20** (structure vs poster branding) | **YELLOW** | Slices add expression; live grid DOM preserved |
| Kelly **pixel** gate (`DESK-PIXEL-REQUIREMENTS.md`) | **FAIL (RED)** | ~60% RGB diff vs Kelly comp — unchanged by slices alone |
| Repo **IA ruthless** (`ARC-RUTHLESS-UI-UX-AUDIT.md`) | **RED** (pre-existing) | Title stack / notes chrome — out of slice scope |

**Overall integration tip:** **YELLOW** — ship-worthy for structural/integration continuity; not Drive-GREEN for full Design Ruthless Gate (pixel + IA RED remain).

---

## Rule → evidence → verdict

### Product Application Rules (`1SyjMBgVU5uGBRUilg7knt4RFSHs1tTIVZqqDdz9hlzg`)

| Rule (quoted intent) | Evidence | Verdict | Fix if FAIL |
|----------------------|----------|---------|-------------|
| “The planner/calendar remains the product center.” | `02-desk-week-vertical-tabs.png`; `.arc-calendar-spread--desk` dominates tabletop | **PASS** | — |
| “Approximately 80% structure, 20% expression.” | Slices are decorative/interactive-chrome overlays; week grid is live React | **YELLOW** | Reduce slice coverage if expression reads as poster |
| “The central calendar does not resize or squeeze when furniture opens.” | `npm run test:arc-desk-pass` TRAY/settings paths; enlarge does not change spread box | **PASS** | — |
| “Do not … add visual chrome that reduces calendar area.” | Enlarge is optional portal; inline spread hidden via placeholder only while open | **PASS** | — |
| “All actions remain understandable without decorative effects.” | Tab labels remain text; `VITE_ARC_DESK_SLICES=false` CSS fallback | **PASS** | — |

### Desktop Interaction Blueprint (`1r2zvNXj07Qm4sD9aCk19hIpa2SIdksPTkBuaO_Mnv6o`)

| Rule | Evidence | Verdict | Fix |
|------|----------|---------|-----|
| “There is NO LEFT RAIL.” | Smoke: `.b01-side-rail > .arc-index-tabs` count 0 | **PASS** | — |
| “Utility systems enter as tabs/drawers attached to the outer edge.” | IDEAS dock, TO-DOS folder, edge DAY/WEEK/MONTH/YEAR | **PASS** | — |
| “Furniture does NOT overlay the calendar.” | TRAY drawer replaces dock; settings slide from utility tabs | **PASS** | — |
| “The calendar remains geometrically true while furniture is open.” | Same spread dimensions in smoke with workspace open | **PASS** | — |
| Canonical Day/Week/Month/Year Map lenses | Edge tabs + pop-out tabs; year desk smoke | **PASS** | — |

### Ruthless Audit Gates — Gate 1 (`1gjsSsfeKRI5Y52_eti1qTs-XKEnuq1Ql1R3p-_xKpVY`)

| Rule | Evidence | Verdict | Fix |
|------|----------|---------|-----|
| Test 8 — “Accessibility veto … keyboard operation … blocks GREEN.” | `DeskCalendarPopOut`: `role="dialog"`, Escape, Tab cycle; smoke enlarge/dismiss | **PASS** | — |
| Test 9 — “Product survival: dense calendar states … furniture open states.” | `test:arc-desk-pass` + edit mode + year desk | **PASS** | — |
| “Do Not Lose … calendar-first center, teacher authority.” | Desk shell + Kelly demo seed | **PASS** | — |
| Full Gate 1 battery (blind recognition, deprivation, etc.) | **Not run this pass** | **YELLOW** | Schedule brand gate pass pre-TABLE |

### Desk slice / vertical tab integration (this pass)

| Requirement | Evidence | Verdict | Fix |
|-------------|----------|---------|-----|
| Slice manifest + committed PNGs under `public/assets/desk/slices/` | `manifest.json`, `deskSliceManifestData.ts`, 11 PNG families | **PASS** | — |
| Vertical DAY/WEEK/MONTH/YEAR Figma crops | `data-desk-slices="true"`; `planner-edge-tab-*.png`; smoke backgroundImage assert | **PASS** | Fine-tune crop alignment |
| Calendar enlarge pop-out | `03-calendar-enlarge-popout.png`; `desk-calendar-popout` testids | **PASS** | — |
| IDEAS / TO-DOS / frame / start-class slices | `desk-slice-ideas-drawer`; component `data-desk-slices` | **PASS** | — |

### Pixel / Kelly comp (repo gate, aligns with Gate 1 survival)

| Requirement | Evidence | Verdict | Fix |
|-------------|----------|---------|-----|
| Honest pixel match vs Kelly 1696×1254 | `DESK-PIXEL-REQUIREMENTS.md` ~60% diff | **FAIL (RED)** | Viewport scale, course headers, rainbow mark, denim photo parity |
| TO-DOS denim photographic | Slice body shipped; global diff still high | **YELLOW** | Continue icarus/figma reconciliation |

---

## Smokes run

| Command | Result |
|---------|--------|
| `npm run test:contracts` | **PASS** (includes `deskSliceManifest.contract.ts`) |
| `npm run test:arc-desk-pass` | **PASS** (enlarge, edge tab slices, TRAY, edit mode, year) |

---

## Open RED items

1. **Kelly global pixel diff ~60%** — `DESK-PIXEL-REQUIREMENTS.md` items 18, 25–26, 13 (denim parity partial).
2. **IA title stack / notes chrome** — `ARC-RUTHLESS-UI-UX-AUDIT.md` ranks 1–4 (pre-existing; not introduced by slice pass).
3. **Full Design Ruthless Gate 1** (blind recognition, progressive deprivation, competitive camouflage, etc.) — not executed against this build; required for Drive-GREEN before TABLE skin per gates doc.

## Open YELLOW items

1. **80/20 expression balance** — monitor slice + pop-out backdrop weight in dense Week.
2. **Vertical tab crop alignment** — rasters on buttons; active WEEK crop reused for all active states.
3. **Drive gate documents** still marked YELLOW “for owner approval” — audits applied as working rules, not canonical GREEN++.
