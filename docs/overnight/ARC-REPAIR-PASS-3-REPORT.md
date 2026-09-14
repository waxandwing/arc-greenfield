# ARC Repair Pass 3 — Capture, Chrome, Onboarding, Settings, Tabs (Report)

**Branch:** `cursor/arc-production-integration` (feature work: `cursor/arc-pass-3-tabs-drawer-43c2`)  
**Scope:** UX and setup surfaces only — **no** changes to planning law (Now / Needs Attention, Move / Shift / Recovery, Month / Year structure, ArcTable semantics, or exact-return-on-close behavior).

## Stop condition

### A. Commit SHA

**`cb035af`** (Pass 3 code + tab evidence; tab smoke regenerates `docs/overnight/evidence/repair-pass-3-tabs/`).

### B. Pass 3 themes (§33–48 + capture/header/onboarding)

| Theme | Result |
|-------|--------|
| Capture-first chrome | App-level `.arc-header` hidden; Arc mark + **Capture** live in `PlannerShellBar` inside the cream spread (`repair-pass-3-chrome.css`, `PlannerShellBar.tsx`). |
| Global capture | `GlobalCaptureAffordance` + anchor persistence (`captureWorkspace.ts`, `capturePersistence.ts`); coach mark after minimum setup (`CaptureCoachMark.tsx`, onboarding flag). |
| Workspace captures | Primary list + promote / schedule actions in `WorkspacePanel.tsx`; contract updates in `captureWorkspace.contract.ts`. |
| Onboarding | Returning-teacher bypass + school NCES persistence (`repairPass3Setup.contract.ts`, `onboardingPersistence.ts`, `ArcOnboarding.tsx`). |
| Teaching day setup | Bell schedule lookup hook + notice (`schoolBellScheduleLookup.ts`, `TeachingDaySetup.tsx`). |
| Settings furniture | Existing groups retained (`SettingsFurnitureContent.tsx`); entry via **SETTINGS** tab only (no new navigation law). |

### C. Tab + drawer refinement (§1–14)

**Before (Pass 2 shell lock):** Full-height **dark green index rail** behind vertical tabs (`shell-emphasis.css` / `shell-visibility-lock.css`) — tabs read as exterior nav, not planner index. Workspace/settings used **fixed overlay** with planner dimming (`repair-pass-2-chrome.css`).

**After (Pass 3):**

| Requirement | Implementation |
|-------------|----------------|
| No dark vertical nav rail | `repair-pass-3-chrome.css` resets `.arc-index-tabs` to transparent; per-tab muted Arc palette on projecting chips (`b01-furniture.css`). |
| Planner-attached tabs | Horizontal labels; flat inner edge, rounded outer; active = stronger cream fill + mustard inset + elevation. |
| Desktop push | `B01Furniture` side rail grid: tabs + 320–420px panel; `data-side-panel` on composition; planner stays visible (dimming removed). |
| Tab ↔ panel continuity | Open WORKSPACE / SETTINGS: active tab square inner edge, panel shares surface color (`repair-pass-3-chrome.css`). |
| Tablet / mobile | ≤900px: fixed overlay panels; ≤520px: near-full-width settings. |
| Exact return | Unchanged — close only toggles drawer; smokes assert active index tab unchanged. |

### D. Evidence

**Folder:** `docs/overnight/evidence/repair-pass-3-tabs/`

| File | Shows |
|------|--------|
| `day-tabs-closed.png` | DAY tab active, muted chips, no dark rail |
| `week-tabs-closed.png` | WEEK destination color |
| `workspace-open-push.png` | Desktop push + tab/panel join |
| `settings-open-push.png` | Settings push width |
| `tablet-workspace-overlay.png` | ≤900px overlay |
| `mobile-settings.png` | Narrow full-width settings |

**Before reference:** dark rail visible in older shell evidence (e.g. repair-pass-2 workspace shots with vertical cream-on-green rail).

### E. Tests

| Command | Purpose |
|---------|---------|
| `npm run test:contracts` | Includes `repairPass3Setup.contract.ts` |
| `node tests/repair-pass-3-tabs.smoke.mjs` | Tab rail + push + exact-return + evidence capture |
| Existing plan / repair smokes | Regression guard (no nav law edits) |

### F. Files touched (Pass 3 cumulative)

- **Tabs / drawers:** `B01Furniture.tsx`, `b01-furniture.css`, `repair-pass-3-chrome.css`
- **Capture / header / onboarding / settings:** see working tree on branch (AppFrame, WorkspacePanel, TeachingDaySetup, etc.)
- **Report:** this file
- **Smoke:** `tests/repair-pass-3-tabs.smoke.mjs`

## Success criteria (§14)

- Tabs read as **planner index**, not app nav.
- **No** full-height dark green tab rail.
- Arc-muted destination colors per tab.
- Desktop **push** for Workspace / Settings; graceful overlay on tablet/mobile.
- **No** navigation or planning law changes.
