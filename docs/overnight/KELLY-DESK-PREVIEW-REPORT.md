# Kelly — what you saw vs the desk preview (Mac)

## What you saw (screenshot 36cac402)

That screen is the **old Arc planner shell**, not the physical desk pass:

- Cream planner on the **green/pattern** background (not light wood)
- **CALENDAR** kicker and **Month** view dropdown (legacy chrome)
- **“This Month”** header instead of **Teaching week**
- Month cells showing **Unknown** (calendar-only grid padding / stale data)

On `cursor/arc-production-integration`, the desk turns on when you have a saved calendar, you are in Plan/calendar mode, and onboarding is finished. The old dropdown lived in `CalendarViewSwitcher`; integration uses **DAY / WEEK / MONTH** tabs on the planner and hides the CALENDAR header in desk mode.

If you still see the old shell, you are almost always on a **stale build or wrong branch** — not a hidden “desk flag.”

## What to do on your Mac (three steps)

1. In Terminal, `cd` into your **arc-greenfield** clone (the folder with `package.json`).
2. Run:
   ```bash
   git fetch origin
   git checkout cursor/arc-production-integration
   git pull origin cursor/arc-production-integration
   npm install
   ```
3. Run:
   ```bash
   npm run preview:desk
   ```
   Open:
   ```text
   http://127.0.0.1:4173/?demo=1&demoReset=1
   ```

`demoReset=1` clears old `arc.*` browser data and reloads with the gauntlet teaching-week demo so onboarding does not block the desk.

## How you know you have the NEW desk

- **Wood tabletop** fills the scene; tray, MSC pad, and ArcTable sit on the wood
- Planner has **attached tabs** (DAY, WEEK, MONTH, …) on the spread — not a Month dropdown
- Title reads **Teaching week** (demo opens on Week)
- Bottom-right footer: **`desk-v2 · <short git sha>`** (and the same line in the browser console)
- In DevTools, `<html data-build="desk-v2@<sha>">`

## If it still looks OLD

- Confirm branch: `git branch --show-current` → `cursor/arc-production-integration`
- Confirm you ran **`preview:desk`**, not plain `npm run dev` from another folder
- Hard refresh or use a private window after `?demo=1&demoReset=1`
- Check the footer/console for `desk-v2` — if missing, the bundle was not built with `npm run preview:desk`

No merge or deploy is required for this check — local preview only.
