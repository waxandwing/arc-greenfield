# Kelly — still seeing the old CALENDAR shell?

Plain checklist when the app looks like **cream planner + green pattern + “CALENDAR” + Month dropdown** instead of **wood desk + Teaching week + DAY/WEEK/MONTH tabs**.

## What each branch and command actually serves

| Where you are | `npm run dev` | `npm run preview:desk` |
|---------------|---------------|-------------------------|
| **`main`** | Legacy plan shell only (no wood desk, no `desk-v2` stamp). Default Vite port **5173**. | **Script does not exist** on `main`. |
| **`cursor/arc-production-integration`** | Same **source tree** as desk, but **without** desk preview env unless you use **`npm run dev:desk`**. Plain `dev` often keeps **onboarding / stale localStorage** → looks like the old shell. Port **5173**. | **Production desk build**: sets `VITE_ARC_DESK_PREVIEW`, `desk-v2` label, demo seed path, footer stamp. Serves **`dist/`** at **http://127.0.0.1:4173**. |

**Kelly rule:** For the wood **Teaching week** desk, use **`cursor/arc-production-integration`** + **`npm run preview:desk`** (or hot reload: **`npm run dev:desk`** on port **4317**).

**Not the desk:** `https://waxandwing.github.io/arc-greenfield/` tracks **`main`** unless a separate integration deploy exists — do **not** use Pages as proof of the desk.

## Five-step fix (do these in order)

1. **Correct folder** — Terminal `pwd` must be the clone root where `package.json` lists **`"preview:desk"`** in `scripts`. If that script is missing, you are on **`main`** or inside the wrong nested copy.  
   `cd` to your clone (e.g. `~/arc-greenfield`), not `~`.

2. **Correct branch** —  
   `git fetch origin`  
   `git checkout cursor/arc-production-integration`  
   `git pull origin cursor/arc-production-integration`  
   Confirm: `git branch --show-current` → `cursor/arc-production-integration`.

3. **Install once** — `npm install`

4. **Correct command (not plain `dev`)** —  
   `npm run preview:desk`  
   Wait for the build to finish. Preflight prints **cwd**, **branch**, **commit**, and the demo URL.

5. **Correct URL + fresh data** — Open exactly:  
   `http://127.0.0.1:4173/?demo=1&demoReset=1`  
   If port **4173** is busy, either open that URL anyway (old server may already be running) or run `npm run preview:desk:stop` and retry **`preview:desk`**.

## How you know the NEW desk loaded

- **Wood** fills the viewport; planner sits on the tabletop.
- Title **Teaching week** (demo lands on Week), not **This Month** with a Month dropdown.
- Bottom-right footer: **`desk-v2 · cursor/arc-production-integration · <short sha>`** (or similar).
- DevTools: `<html data-build="desk-v2@…">` on the built preview page.
- Console: `[Arc desk preview] desk-v2@…` (desk preview builds only).

## If it still looks OLD after the five steps

| Symptom | Likely cause |
|---------|----------------|
| No `preview:desk` in `package.json` | Still on **`main`** — checkout integration (step 2). |
| No `desk-v2` footer / no `data-build` | Ran **`npm run dev`**, plain **`npm run preview`**, or opened **5173** instead of **4173** after **`preview:desk`**. |
| Footer says old SHA | Stale **`dist/`** or stale server on 4173 — **`preview:desk:stop`**, then **`preview:desk`** again. |
| Cream + CALENDAR on integration + `dev` only | Use **`preview:desk`** or **`dev:desk`** + `?demo=1&demoReset=1`; plain `dev` skips desk preview env and may leave onboarding blocking the desk shell. |
| github.io looks old | Expected for **`main`** — use local **`preview:desk`**, not Pages. |

## Quick self-check commands

```bash
git branch --show-current
node -e "console.log(require('./package.json').scripts['preview:desk']?.slice(0,40)||'MISSING')"
curl -sS http://127.0.0.1:4173/ | grep -E 'desk-v2|data-build' || echo 'No desk stamp — wrong server or wrong build'
```

## More detail

- [docs/LOCAL-PREVIEW.md](../LOCAL-PREVIEW.md) — ports, aliases, troubleshooting table  
- [docs/overnight/KELLY-DESK-PREVIEW-REPORT.md](./KELLY-DESK-PREVIEW-REPORT.md) — what the old shell looks like vs desk  
- [docs/overnight/ARC-CURSOR-RESTRUCTURE-HANDOFF.md](./ARC-CURSOR-RESTRUCTURE-HANDOFF.md) — branch policy (desk not on `main`)
