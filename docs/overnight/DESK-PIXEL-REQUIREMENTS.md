# Desk pixel requirements (Kelly Teaching week comp)

**Source authority:** Kelly comp PNG (`Teaching week IDEAS/TO-DOS`), Figma desk export, prior audit at `50a51b3`.

**Honest pixel gate (1696×1254, scale-normalized):** see `docs/overnight/evidence/desk-pixel-pass/round-4-REPORT.md` (latest) — **~60.08% RGB diff vs Kelly** (SSIM ~0.20). Structural smoke checks can pass while pixels differ.

**Queue alignment:** `docs/overnight/AGENT-WORK-QUEUE.md` — slice stack **A DONE**; header **B** + course rows **C** in progress; pixel loop **F** blocked until B/C.

| # | Requirement | File / selector / testid | Status |
|---|-------------|---------------------------|--------|
| **Wood & shell** |
| 1 | Full-viewport icarus wood (no cream plan mat) | `arc-desk.css` `.arc-shell--desk`, `texture-wood` | PASS |
| 2 | Physical tabletop 1440×1024 aspect field | `.arc-desk-tabletop`, `data-testid="arc-desk-tabletop"` | PASS |
| 3 | Arc wordmark on wood (top-left) | `arc-desk-wood-wordmark`, `data-testid="arc-desk-wood-wordmark"` | PASS |
| 4 | Build stamp `desk-v2 · <sha>` footer | `DeskBuildStamp`, `preview:desk` env | PASS |
| **IDEAS drawer** |
| 5 | Forest-green drawer dock top-center | `DeskGreenFoldersDrawer`, `.arc-desk-tray-dock` | PASS |
| 6 | Collapsed default (stones visible, not TRAY copy) | `defaultExtended={false}`, `data-extended="false"` | PASS |
| 7 | IDEAS tab label (not FOLDERS) | `.arc-desk-ideas-tab`, `green-folders-drawer.svg` | PASS |
| 8 | Four circular stone tokens (mustard, terracotta, blue, forest) | `.arc-desk-green-drawer-token--*` | PASS |
| 9 | SVG drawer art matches comp depth | `ideas-drawer-chrome.png` slice + SVG fallback | PARTIAL (A shipped) |
| **TO-DOS folder** |
| 10 | Denim vertical folder left of planner | `DeskTodosFolder`, slice `todos-folder-*` | PARTIAL (A shipped) |
| 11 | Vertical TO-DOS tab on folder edge | `.arc-desk-todos-folder-tab` | PASS |
| 12 | MUST DO / SHOULD DO / COULD DO labels | `DeskPriorityPad` `folderChrome`, `.desk-priority-pad--folder` | PASS |
| 13 | Denim texture vs Kelly photographic fold | `todos-folder-body.png` when slices on | PARTIAL (A shipped) |
| **Planner spread** |
| 14 | Cream paper + green frame border | `.arc-calendar-spread--desk` | PASS |
| 15 | Title “Teaching week” (Instrument Serif) | `.plan-state-primary`, `arc-fonts.css` | PASS |
| 16 | Kicker `SEPTEMBER 7 - 11 • WEEK 4` | `formatKellyDeskWeekSecondary`, `deskWeekRangeLabel` | PASS |
| 17 | Search + Today pill (header right) | `desk-planner-search`, `desk-planner-today` | PASS |
| 18 | Rainbow/arch mark beside title | `desk-planner-rainbow-mark`, Kelly crop | PARTIAL |
| 19 | `< Today >` chevron pill styling | `.desk-planner-today-cluster`, `desk-planner-today` | PARTIAL (chevron cluster; chevrons not wired) |
| **Week grid** |
| 20 | MON–FRI day numbers header row | `PlanningWeekDayView`, desk date CSS | PARTIAL |
| 21 | Thu focus marker (orange semicircle) | `.planning-date-heading--focus` | PARTIAL |
| 22 | Three courses AP / 2D / 3D | Kelly demo seed `kellyDeskDemo.ts` | PASS |
| 23 | Unit bar `UNIT 2.1 Ancient Mesopotamia` | demo units + `.planning-unit-span` | PASS |
| 24 | Daily lesson pills (Mesopotamia set) | demo lessons | PASS |
| 25 | Course time blocks `P1 • 8:05–9:00` style | Kelly demo section names + `.planning-row-label` desk CSS | PARTIAL (labels; colored left rails still off) |
| 26 | “Weekends?” footer on spread | Kelly comp | FAIL |
| **Vertical tabs** |
| 27 | DAY / WEEK / MONTH / YEAR on planner right edge | `.arc-planner-physical-tabs--desk-edge` | PASS |
| 28 | WEEK active state (cream tab) | `.arc-index-tab[aria-current='page']` | PASS |
| 29 | Denim/tab texture match comp | `planner-edge-tab-*.png` + slice CSS | IN PROGRESS (A) |
| **Start class** |
| 30 | Quadrant AT mark + green frame | `ArcTableDeskFixture`, `.arc-desk-arctable` | PASS |
| 31 | Script “start class” (lowercase serif) | `.arc-desk-arctable-script` | PASS |
| 32 | No extra context line under script in comp | `.arc-desk-arctable-script-detail` hidden on desk | PARTIAL |
| **Capture / TRAY laws** |
| 33 | Mustard Quick Capture sticky upper-right on wood | `DeskQuickCaptureSticky` inline type-first only (no `arc-capture-dialog`); Enter → IDEAS | PASS |
| 34 | TRAY content via IDEAS extend | `DeskGreenFoldersDrawer` + smokes | PASS |
| 35 | Full TRAY workspace via utility (off-screen) | `arc-desk-utility-tabs` | PASS |
| 36 | TRAY does not stack with molded dock | `arc-desk-pass.smoke.mjs` | PASS |
| **Demo / preview** |
| 37 | `?demo=1&demoReset=1` seeds Kelly week on desk preview | `applyDemoSeed.ts` + `kellyDeskDemo.ts` | PASS |
| 38 | Integration branch + `npm run preview:desk` | `docs/LOCAL-PREVIEW.md` | PASS |
| **Tests** |
| 39 | `npm run test:desk-pixel-pass` | `scripts/desk-pixel-pass.mjs` | PASS |
| 40 | `npm run test:arc-desk-pass` | `tests/arc-desk-pass.smoke.mjs` (+ slice testids) | PASS (re-run after A1 commit) |
| 41 | `npm run test:desk-fidelity-audit` (structural) | `tests/desk-fidelity-audit.mjs` | PASS (not pixel) |

## Evidence paths

- Pixel overlay: `docs/overnight/evidence/desk-pixel-pass/round-1-*`, `round-2-*`
- Structural audit: `docs/overnight/evidence/desk-fidelity-audit/`
- Before/after: compare `round-1-preview-1696x1254.png` vs `round-2-preview-1696x1254.png`

## Top remaining pixel gaps (priority)

1. **Global diff ~60%** — viewport scaling, SVG vs photo chrome, and unstylized course header blocks dominate.
2. **TO-DOS denim** — still CSS gradient; comp uses photographic folder/tray texture.
3. **IDEAS drawer** — authored SVG + tokens vs comp photography and LINE stone label.
4. **Planner header** — missing rainbow icon; Today control not chevron pill.
5. **Course row chrome** — period/time blocks and colored left rails not matching comp layout.
6. **3D row / Weekends footer** — minor content/chrome omissions vs comp.
