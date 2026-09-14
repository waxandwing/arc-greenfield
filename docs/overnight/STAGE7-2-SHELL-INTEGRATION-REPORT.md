# Stage 7.2 — Arc shell integration

**Branch:** `cursor/arc-production-integration`  
**Base:** `a5d64e7` (sample CSV) atop Stage 7 final skin (`b1233b4`)  
**Scope:** Plan shell composition, index navigation, presentation-only calendar UX; no planning-law or ArcTable engine changes; no merge or deploy.

---

## A. Contained planner object

**Severity: GREEN**

- `b01-furniture-composition` wraps calendar in `arc-planner-object` (cream `--field-elevated`) with `--shell-frame-green` frame inset.
- Brand breezeblock tile at ~62–68% green wash (`tokens.css`, `b01-furniture.css`, `arc-plan-shell.css`); pattern stays on frame, not inside cells.
- Top app header: inverted Arc mark (`/assets/arc/arc-mark.png`), minimal chrome.

Evidence: `00-contact-sheet.png`, `04-week.png`.

---

## B. Right-side planner index

**Severity: GREEN**

- Vertical index tabs: DAY, WEEK, MONTH, YEAR, PLANNING, WORKSPACE, SETTINGS, TASKS (`B01Furniture.tsx`).
- Calendar stage header drops duplicate view dropdown; period controls + recovery remain (`CalendarStageHeader.tsx`).
- Smokes use `tests/helpers/selectPlanView.mjs` for tab navigation.

Evidence: `11-day-index-tabs.png`, `12-index-tabs.png`.

---

## C. Plan state header depth (ArcTable surface family)

**Severity: GREEN**

- Three-band header uses paper / people texture tokens (`--plan-surface-*`) aligned with ArcTable material system.
- No change to focus grammar (view → context → time).

Evidence: `01-teaching-day.png`, `02-class.png`.

---

## D. Week / Month presentation

**Severity: GREEN**

- **Week:** Course bands AP mustard, 2D dusty blue, 3D sage; unit spans; off-day column hatch (`planning-day-slot--off`); Mon–Fri columns when `showWeekends` is false (Monday–Sunday week projection preserved for planning law).
- **Month:** Clickable unit bands via `unitStartDate`; reduced noise for unknown/no-school cell copy; off-day tint.
- **Progressive disclosure:** Week lesson Open / Move / More when class/section context active.

Evidence: `04-week.png`, `05-month.png`, `09-week-lesson-more.png`.

---

## E. P5, Workspace, Settings

**Severity: GREEN**

- PLANNING index tab opens planning period from Teaching Day rail.
- WORKSPACE / SETTINGS drawers unchanged in law; styled inside planner object.

Evidence: `07-planning-period.png`, `08-workspace.png`, `10-settings.png`.

---

## F. Engineering baseline

**Severity: GREEN**

After Stage 7.2 WIP:

- `npm run build` — PASS  
- Plan smokes (`test:plan-*`, `test:browser-plan`, `test:browser-a11y`) — PASS  
- Contract suite (via `build`) — PASS  

---

## G. Known carry-forward (not Stage 7.2)

**Severity: YELLOW (unchanged backlog)**

- Tasks add flow, backdrop dismiss on overlays, school search → teaching-day prefill, workspace drag-to-calendar.
- Settings/Workspace stubs during early onboarding.
- Optional human pass on dense Month at 400% zoom.

---

## Recommendation

**GREEN FOR STAGE 7.2 SHELL REVIEW**

Shell integration matches the teaching-week mockup direction: framed cream planner, external pattern, index tabs, real Arc mark, course color differentiation. Navigation and planning laws preserved.

---

## Evidence

`docs/overnight/evidence/stage7-2-shell/` — see `CONTACT-SHEET.md`.

Capture: `node tests/stage7-2-shell-evidence.mjs` (requires `vite preview` on `4173` or `ARC_BASE_URL`).
