# Master desk visual goal (Kelly north star)

**Branch:** `cursor/arc-production-integration` only — no merge to `main`, no Vercel deploy, no PR from this coordination lane unless Kelly asks.

**Authority comps (pixel truth):**

| Asset | Path |
|-------|------|
| Kelly first comp (Teaching week) | `/home/ubuntu/.cursor/projects/workspace/assets/f5602c3b-2ac0-4b74-a4ad-2f359a219b9a.png` |
| Figma Codex hero export | `docs/overnight/evidence/figma-desk-6-3194/01-codex-image-37-11052.png` |
| Runtime reference frame | Figma `37:11052` @ 1440×1024 tabletop (`public/assets/desk/figma/desk-hero-37-11052.png`) |

## North star (non-negotiable)

The **live desk** at `?demo=1&demoReset=1` / `npm run preview:desk` must read as Kelly’s **Teaching week** mock:

1. **Wood viewport** — full-bleed icarus `texture-wood`; Arc wordmark top-left on wood (not in cream planner).
2. **IDEAS** — forest-green drawer **top-center**, **collapsed by default**, circular stone tokens visible when slices off; Figma slice chrome when slices on.
3. **TO-DOS** — denim **vertical folder** left of planner; MUST / SHOULD / COULD priority pad inside folder body.
4. **Planner spread** — cream paper, **green frame trim**, title **Teaching week**, kicker **SEPTEMBER 7 - 11 • WEEK 4** (Kelly demo dates).
5. **Week grid** — MON–FRI headers, three courses (AP / 2D / 3D), unit bar **UNIT 2.1 Ancient Mesopotamia**, lesson pills, Thu focus marker.
6. **Vertical tabs** — **DAY / WEEK / MONTH / YEAR** on the **right edge of the planner spread** (not a side app rail); **WEEK** active for home.
7. **Header tools** — search field + **Today** on planner header right (chevron pill styling is in-scope polish).
8. **Start class** — script label + quadrant ArcTable mark, bottom-right on wood, green frame.
9. **Default view** — **Week / Teaching week**, not Year mini-month grid, not Month “This Month” title.

Structural locks are in `docs/overnight/DESK-PIXEL-REQUIREMENTS.md` and `tests/arc-desk-pass.smoke.mjs`.

## Explicitly out of scope

- **Year mini-month grid as default desk home** — Year is reachable via tabs / pop-out, not the hero default.
- **Blue molded tray** as primary capture chrome — replaced by green IDEAS drawer + utility TRAY drawer.
- **CSS-only fake chrome** when committed Figma slice PNGs exist for that region (use `deskSliceManifest` + `DeskChromeSlice`).
- **Checklist at 100%** without honest pixel diff — ~99% or Ruthless Audit PASS on visual rules is the bar.
- **Fridge / Task Bar furniture** as desk hero elements — utilities only; not Kelly comp furniture.
- **Merge main, Vercel, PR** from overnight passes unless Kelly directs.

## Do not settle

Kelly directive for every Arc desk agent pass:

1. **Blockers → ask Kelly.** If you are stuck on access, authority, or a product call, stop guessing and record a **specific question for Kelly** in `docs/overnight/AGENT-WORK-QUEUE.md` (blockers log) — do not mark the slice “done.”
2. **Insufficient Figma access → document + request export.** Name the Figma file key, node id, and missing layer or export; ask Kelly for PNG/SVG or MCP access before claiming chrome parity.
3. **Pixel diff &gt; 15% → keep slicing.** A smoke pass or ~60% RGB diff is **not** close enough; continue vertical slices (header, rows, tabs, folder) and re-run `npm run test:desk-pixel-pass` until diff drops or an asset blocker is filed.
4. **No false 100% claims.** PARTIAL/FAIL in `DESK-PIXEL-REQUIREMENTS.md` stays honest until metrics or Ruthless Audit PASS says otherwise.

## Agent charter (every pass)

### Must do

1. Work only on **`cursor/arc-production-integration`** (linear tip; reconcile WIP before new features).
2. Compare against **Kelly comp + 37:11052** before and after; capture evidence under `docs/overnight/evidence/`.
3. Prefer **Figma/Arc slice rasters** from `public/assets/desk/slices/` over new CSS gradients when a slice exists in manifest.
4. Keep **Kelly demo seed** (`src/demo/kellyDeskDemo.ts`, `applyDemoSeed`) aligned with Sept 7–11 week.
5. Run **`npm run test:arc-desk-pass`** after desk UI changes; run **`npm run test:contracts`** when touching `.contract.ts` or navigation/planning invariants.
6. After each pass, file/update **Google Drive Arc folder — Ruthless Design Audit** (and related audits per bc-47986dad intent): state rules tested, PASS/FAIL per visual rule, blockers named honestly.

### Must not do

1. Reintroduce **duplicate** planner shell chrome, side index rail, or cream mat around wood.
2. Ship **placeholder copy** that contradicts comp (FOLDERS vs IDEAS, “This Month” on desk home).
3. **Recolor** assets without design export (e.g. blue tray → green without new PNG).
4. Claim **pixel parity** without metrics in `docs/overnight/evidence/desk-pixel-pass/`.
5. Expand scope into **unrelated** onboarding, Pages CI, or main-branch promotion.

## Definition of done

**Done** when either:

- **Pixel gate:** normalized 1696×1254 (or agreed viewport) RGB diff vs Kelly comp **&lt; 15%**, with SSIM trend improving pass-over-pass; or
- **Audit gate:** Ruthless Design Audit **PASS** on all **P0 visual rules** in `DESK-PIXEL-REQUIREMENTS.md` (wood, IDEAS, TO-DOS, planner chrome, tabs, start class, demo week), with remaining gaps listed as PARTIAL/FAIL with asset or IA blockers.

Until then, status stays **in progress**; smoke tests passing ≠ visual done.

## Coordination references

- Work queue: `docs/overnight/AGENT-WORK-QUEUE.md`
- Slice manifest: `src/navigation/deskSliceManifest.ts`, `public/assets/desk/slices/manifest.json`
- Pixel honesty: `docs/overnight/evidence/desk-pixel-pass/round-3-REPORT.md` (latest round)
- Recent integration commits: `b030b24`, `50a51b3`, `ed6b214`, `0c1c563`
