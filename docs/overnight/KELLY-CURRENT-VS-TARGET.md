# Kelly desk: what you see vs what we owe

Plain English side-by-side. **Do not** use the left screenshot as a pixel-pass or design target.

| What Kelly sees today (broken) | What we owe (north star) |
| --- | --- |
| **File:** `docs/overnight/evidence/kelly-current-display-2026-08-03.png` | **File:** `docs/overnight/evidence/kelly-teaching-week-authority.png` (Kelly zip `1.png`, 1366×768) |
| Wood desk + IDEAS + TO-DOS furniture (layout mostly there) | Same wood + IDEAS + TO-DOS furniture |
| Planner stuck on **MONTH** tab | **WEEK** tab active on planner edge |
| Title reads **“This Month”** (often clipped as **“Th Mo”**) | Title **Teaching week** |
| Kicker / month label **AUGUST** | Kicker **SEPTEMBER 7 - 11 • WEEK 4** |
| Month grid (Sun–Fri dates in August) | Mon–Fri **week grid** with AP / 2D / 3D rows and Mesopotamia unit bar |
| Caused by **old browser storage** keeping Month view + August anchor, or opening preview **without** `?demo=1&demoReset=1` | **`npm run preview:desk`** then **`?demo=1&demoReset=1`** — or plain reload after fix; app normalizes Month → Teaching week on desk |

## For agents

- **Target spec:** `docs/overnight/MASTER-DESK-VISUAL-GOAL.md`, `docs/overnight/DESK-PIXEL-REQUIREMENTS.md`
- **Pixel pass default:** `docs/overnight/evidence/kelly-teaching-week-authority.png`, not the current-display PNG
- **Baseline only:** `uploads/desk-incoming/kelly-desk-v3-preview-repair-2026-08-03.png` (same image as evidence file)

## What went wrong (2026-09-15)

Agent **bc-3a15e226** (commit `c29f613`) mislabeled the v3 preview-repair screenshot as the “authority comp” and pointed `desk-pixel-pass` at it. That was corrected on main: image moved to evidence, docs and pixel ref restored to Teaching week.
