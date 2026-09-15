# Arc Repair Pass 1 — Remove app chrome

**Branch:** `cursor/arc-production-integration`  
**Base audit:** `docs/overnight/ARC-RUTHLESS-UI-UX-AUDIT.md`  
**Mode:** IA / progressive disclosure — not a redesign.

---

## Stop condition report

### A. Files changed

| Area | Files |
|------|--------|
| Headers | `CalendarStageHeader.tsx`, `PlanStateHeader.tsx`, `AppFrame.tsx` |
| Setup | `ProgressiveSetupPrompt.tsx`, `AppFrame.tsx` |
| Notes | `PlanningNotes.tsx`, `planningCalendar.css` (existing classes reused) |
| Week layout | `CalendarProjectionView.tsx` |
| Chrome CSS | `repair-pass-1-chrome.css` (new), `main.tsx`, `shell-visibility-lock.css` |
| Tests | `arc-plan-continuity`, `plan-navigation`, `plan-week`, `plan-month`, `plan-year`, `import-onboarding`, `plan-onboarding-import`, `b01-furniture` smokes |
| Evidence | `docs/overnight/evidence/plan-navigation/`, `plan-week/`, `plan-p5/`, `arc-plan/` (refreshed via smokes) |

### B. Title / header changes

- Spread **`calendar-stage-header`** becomes **tools-only** when plan state is active (`editorialTitleManaged`): period ← Today →, recovery/undo — **no visible Day/Week h1**.
- **`PlanStateHeader`** is the single **`<h1>`** editorial line (`My Teaching Day`, `This Week`, lesson title, etc.).
- Removed redundant kicker for day/week/month/year day-focus (kicker only for class / lesson / workspace overlay).
- Hidden spread school-year label in tools row (CSS); date lives on plan-state secondary line.
- Removed duplicate **ProjectionHeading** on Day when planning content is shown.

### C. Setup gating behavior

- **`ProgressiveSetupPrompt`** only on **Day** view (not Week/Month/Year).
- Prompts limited to **day order / planning period / bell times** — **curriculum CTA removed** from everyday surfaces (Settings/import unchanged).
- Still uses existing **`SetupCapabilities`** flags; no new completion banner.

### D. Notes interaction change

- Default: quiet **`+ Note`** button only (no empty copy, no composer).
- Expanded: composer with **New Note**, Add Note, Cancel; date inherits **`focusDate`**; **Change date** via `<details>`.
- Existing notes still render when present.
- Day: notes moved **below** continuity content; Week: notes **below** grid.

### E. Week above-fold result

- Removed standalone **Open Workspace** row (index tab remains).
- Grid moved **above** notes block.
- Reduced spread/canvas padding (repair-pass CSS overrides).
- **Subjective:** course header row should land higher on ~768–900px viewports; verify in refreshed `plan-week/03-week-selected-day.png`.

### F. arc-header reduction

- **`min-height` 64px → 44px**, tighter vertical padding (`repair-pass-1-chrome.css` + inherits `arc-plan-shell`).

### G. Frame simplification

- Removed **composition outline** ring (`shell-visibility-lock`).
- **`arc-planner-object` padding** 6px → 3px; dropped extra inset box-shadow stack on planner object (keeps `--shell-planner-shadow`).

### H. Index rail changes

- Narrower rail (46px), lighter green, softer inactive tab color, mustard inset on active — still vertical index tabs, not sidebar nav.

### I. Accessibility results

- Plan state exposes **`aria-label`** summarizing primary + secondary.
- Spread tools row retains **sr-only** view label when editorial title managed.
- Notes: **`+ Note`** button keyboard-focusable; composer **Escape** closes; **New Note** labeled.
- **Lesson focus:** plan-state **`h1`** + lesson body **`h2`** — tests updated to target **`level: 1`** for canonical lesson title.
- Skip link **`#calendar-stage`** unchanged.

### J. Tests

`npm run build` (contracts + typecheck + bundle) — pass.

Against `http://127.0.0.1:4173`:

- `test:plan-navigation` — pass  
- `test:plan-week` — pass (Workspace via index tab)  
- `test:plan-month` — pass  
- `test:plan-p5` — pass  
- `test:browser-plan` — pass  

### K. Evidence path

- `docs/overnight/evidence/plan-navigation/` — Day, Class, Lesson, Workspace  
- `docs/overnight/evidence/plan-week/`  
- `docs/overnight/evidence/plan-p5/`  
- `docs/overnight/evidence/arc-plan/` — continuity contact set  

### L. Remaining RED / YELLOW (from audit)

| Status | Item |
|--------|------|
| **YELLOW** | Lesson **h1 + h2** duplicate title (semantic polish later) |
| **YELLOW** | **`plan-state-header` focus bands** (class/lesson) still use emphasis CSS from shell-visibility-lock — lighter box removed but gradients remain |
| **YELLOW** | **Recovery** link still in spread tools when count > 0 |
| **YELLOW** | **Month** notes order unchanged (intentionally out of scope) |
| **YELLOW** | **Week cell** link density (`Open` / `Move` / `More`) |
| **RED→YELLOW** | Setup banner may still show on **Day** until gauntlet fixture completes day-order capabilities |
| **GREEN** | Period rail, course territories, Workspace overlay, Move/Start class, ArcTable untouched |

---

**No merge. No Vercel.**
