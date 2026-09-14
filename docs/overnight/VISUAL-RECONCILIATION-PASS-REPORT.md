# Visual reconciliation pass report

**Branch:** `cursor/arc-production-integration`  
**Kelly brief:** ARC VISUAL RECONCILIATION — ASSETS + SHELL SCALE (2026-09-14)  
**Mode:** Presentation only — no planning law, navigation, or ArcTable behavior changes.

---

## A. Files changed

| Area | Files |
|------|--------|
| Tokens / exterior | `src/styles/tokens.css`, `public/assets/arc/pattern-grid-tile-2048.png` |
| Spread / paper | `src/styles/shell-visibility-lock.css` |
| Presentation pass | `src/styles/visual-reconciliation.css` (new), `src/main.tsx` |
| Logo | `src/components/AppFrame.tsx`, `src/styles/arc-plan-shell.css` |
| Course motif hook | `src/components/PlanningDayContinuityView.tsx` (`data-course-id`) |
| Doc | `docs/overnight/ASSET-RECONCILIATION-REPORT.md` (palette duplicate fix) |
| Evidence | `docs/overnight/evidence/plan-navigation/`, `plan-week/`, `plan-month/`, `plan-p5/`, `arc-plan/` (smoke PNG refresh) |

## B. Markup changed

**Yes — minimal:** `data-course-id` on focused `day-continuity-course` for Day-view course motif CSS. No navigation or data-model changes.

## C. Calendar scale changes

- Reduced canvas stretch: `max-width: 1180px`, centered; lower `min-height` caps (`min(360px, calc(100dvh - 380px))`).
- Spread `min-height` capped at `min(720px, calc(100dvh - 168px))` vs full viewport fill.
- Inner owner padding `space-5`–`space-7`; stage padding increased.

## D. Planner margin / shell balance

- More padding on `.arc-calendar-stage` and `.b01-calendar-owner`.
- `.projection-section` inset tightened so grid does not hug spread edges.
- Frame weight unchanged; breathing room increased inside cream spread.

## E. Exterior pattern implementation

- **Primary:** `pattern-grid-tile-2048.png` (REF-PATTERN-GRID).
- **Wash:** 88% cream (`--shell-pattern-wash`).
- **Scale:** 560px desktop / 380px mobile (calmer, larger tile).
- AT-PATTERN 05 no longer primary; 06 remains `--shell-pattern-dots` alternate.

## F. Logo usage

- Plan header: **`arc-mark.png`** (invert on green app header restored).
- Favicon: framed **`logo-icon-framed-arc-primary-512.png`** (unchanged).
- ArcTable: **`header-compact*.png`** untouched.

## G. Week changes

- Section row `min-height` 76px; course blocks 84px; unit lane 34px.
- Lessons: borderless quiet rows; unit bands as territory strips (no card chrome).
- Course tints + left borders retained; top border removed on week courses.

## H. Month changes

- Day cells `min-height` 96px; softer borders/backgrounds (inherits + pass overrides).
- Quieter day headings and lesson signals; unit stack border softened.

## I. Course motif implementation

CSS `::before` signatures on week + day course headings:

| Course | Motif |
|--------|--------|
| AP Art History | Mustard wedge (triangle) |
| 2D Art 1 | Dusty blue semicircle arc |
| 3D Art 1 | Sage dot |

One motif per course; no terracotta ring on 3D.

## J. Typography hierarchy changes

- Spread `view-title`: Instrument Serif, clamp 28–38px.
- Plan state class/lesson primary: Instrument Serif; lesson title clamp up slightly.
- “Calendar” section label visually hidden (still in DOM for accessibility).

## K. Workspace changes

**None** (product language and fridge internal names unchanged).

## L. ArcTable unchanged

**Confirmed** — no edits to ArcTable components, surfaces, or header assets.

## M. Tests

All passed against `http://127.0.0.1:4173` preview:

- `npm run build`
- `npm run test:plan-navigation`
- `npm run test:plan-week`
- `npm run test:plan-month`
- `npm run test:plan-p5`
- `npm run test:browser-plan` (arc-plan continuity)

## N. Evidence path

- `docs/overnight/evidence/plan-navigation/` — Teaching Day, Class, Lesson, Workspace
- `docs/overnight/evidence/plan-week/`
- `docs/overnight/evidence/plan-month/`
- `docs/overnight/evidence/plan-p5/`
- `docs/overnight/evidence/arc-plan/` — multiprep / continuity contact set

## O. Remaining visual YELLOWs

1. **Week vs reference** — Unit bands may still read slightly card-like on dense fixtures; may need one more border/background pass.
2. **Day teaching-day multi-course** — Motifs only on class-focus surface (single course visible); full-day roster view not in current Day DOM.
3. **Pattern fade** — 88% wash + 560px tile is subjective; Kelly may want 90–92% wash or larger tile still.
4. **Icarus texture** — Layered at 94% cream over 640px repeat; verify on low-DPI displays.
5. **Mobile calendar min-height** — Tuned but not re-shot on physical narrow devices in this pass.
6. **assets910** — Deferred per brief; no blocking crosswalk.

---

**Stop:** No merge, deploy, or Vercel actions taken.
