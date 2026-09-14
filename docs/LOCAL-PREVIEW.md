# Local desk build and preview

Use the **integration branch** for the Arc desk (wood tabletop, tray, MSC pad, ArcTable). `main` does not carry this build by default.

## Three steps (Kelly-simple)

1. **Open the project folder** in Terminal — the folder that has `package.json` (after clone: `cd arc-greenfield`).
2. **Get the desk branch and install:**
   ```bash
   git fetch origin
   git checkout cursor/arc-production-integration
   git pull origin cursor/arc-production-integration
   npm install
   ```
   If `checkout` says the branch is missing, create it from the remote:
   ```bash
   git fetch origin && git switch -c cursor/arc-production-integration --track origin/cursor/arc-production-integration
   ```
3. **Build and open the desk preview:**
   ```bash
   npm run preview:desk
   ```
   In the browser open:
   ```text
   http://127.0.0.1:4173/?demo=1&demoReset=1
   ```

### How to tell OLD vs NEW

| You see… | Which build |
|----------|-------------|
| Green/cream **pattern** around the planner, **CALENDAR** label, **Month** dropdown, big **cream** field behind the planner | **OLD** plan shell — wrong branch, stale build, or preview not from this repo |
| **Light wood** edge-to-edge (viewport + tabletop), planner tabs on the spread (**DAY / WEEK / MONTH**), **Teaching week** title, tray on the wood, `desk-v2` stamp | **NEW** desk (`desk-v2`) — cream is only *inside* the green planner frame, not the desk surround |

With `npm run preview:desk`, a tiny footer shows `desk-v2 · <git sha>` (in the built `index.html` **and** after React loads) and the browser console logs the same. The `<html>` tag gets `data-build="desk-v2@<sha>"` during the production build — you should see the stamp even before JavaScript finishes loading.

## Run every command from the repo root

Git and npm only work when your shell’s current directory is the cloned **arc-greenfield** folder (the directory that contains `package.json`).

- **Do not** run `git` or `npm` from your home directory (`~`, e.g. `/Users/kellynyhagen`). You will see `fatal: not a git repository` and `ENOENT` for `package.json`.
- If you already cloned the repo somewhere else, **`cd` to that path first**, then run the commands below.
- After a fresh clone, you **must** `cd arc-greenfield` before checkout, install, or preview.

## First-time setup (full flow)

```bash
git clone https://github.com/waxandwing/arc-greenfield.git
cd arc-greenfield
git fetch origin
git checkout cursor/arc-production-integration
git pull origin cursor/arc-production-integration
npm install
```

Node version: see `.node-version` in the repo root (`npm ci` is fine if you prefer a clean install).

## Already cloned?

```bash
cd /path/to/arc-greenfield
git fetch origin
git checkout cursor/arc-production-integration
git pull origin cursor/arc-production-integration
npm install
```

Replace `/path/to/arc-greenfield` with wherever you cloned the repo on your machine.

## Production bundle + preview (recommended)

From the repo root, builds the Vite production bundle, then serves it locally (same flow CI smokes expect on port **4173**):

```bash
npm run preview:desk
```

Open in the browser:

```text
http://127.0.0.1:4173/?demo=1&demoReset=1
```

- `demo=1` — seed demo teaching-week content (AP / 2D / 3D) when storage is empty or on first visit.
- `demoReset=1` — wipe saved local data and re-seed, then reload.

Without query params, use saved browser data or set `VITE_ARC_DEMO=true` before `npm run build:bundle` for auto-seed on empty storage.

## Dev server (hot reload)

For day-to-day UI work without a full production build:

```bash
npm run dev:desk
```

Then open:

```text
http://127.0.0.1:4317/?demo=1&demoReset=1
```

## Aliases

| Script | What it does |
|--------|----------------|
| `npm run preview:desk` | `build:bundle` → Vite preview @ 127.0.0.1:4173 (stamped `desk-v2`) |
| `npm run start:desk` | Same as `preview:desk` |
| `npm run dev:desk` | Vite dev @ 127.0.0.1:4317 |

`npm run preview` (no `:desk`) still works but does not pin host/port or desk build stamp; prefer `preview:desk` for desk verification.

## Optional checks

Fast gate (no browser):

```bash
npm run test:contracts
```

Full release gate:

```bash
npm run build
```

Browser smokes (with preview already running on 4173):

```bash
npm run test:arc-desk-pass
```

Override base URL if needed: `ARC_BASE_URL=http://127.0.0.1:4173 npm run test:arc-desk-pass`

## Shareable preview on GitHub (no local server)

Pushes to **`cursor/arc-production-integration`** run [`.github/workflows/desk-preview-pages.yml`](../.github/workflows/desk-preview-pages.yml), which builds the stamped **desk-v2** bundle with base path `/arc-greenfield/` and publishes it to **GitHub Pages**.

**Public URL (Kelly bookmark):**

```text
https://waxandwing.github.io/arc-greenfield/?demo=1&demoReset=1
```

- `demo=1` — seed demo teaching-week content when storage is empty.
- `demoReset=1` — wipe saved local data, re-seed, then reload (same as local preview).

After you push (or someone runs **Actions → Desk preview (GitHub Pages) → Run workflow**), the site is usually live within **about 2–5 minutes** (build ~1–3 min, deploy ~30–90 s). Hard-refresh if you still see an old bundle; check the **`desk-v2 · <sha>`** stamp matches the commit you expect.

### One-time repo setup (Kelly / repo admin)

GitHub Pages must be set to deploy **from GitHub Actions** (not “Deploy from a branch”):

1. Open **https://github.com/waxandwing/arc-greenfield/settings/pages**
2. Under **Build and deployment → Source**, choose **GitHub Actions**
3. Save if prompted

Until that is enabled, the workflow may fail on deploy or Pages will stay 404 — enabling Actions as the source is a one-time step per repo.

### Match the Pages build locally

```bash
GITHUB_PAGES=true VITE_ARC_DESK_PREVIEW=true VITE_ARC_BUILD_LABEL=desk-v2 VITE_ARC_GIT_SHA=$(git rev-parse --short HEAD) npm run build:bundle
npx vite preview --host 127.0.0.1 --port 4173 --strictPort --base /arc-greenfield/
```

Then open `http://127.0.0.1:4173/arc-greenfield/?demo=1&demoReset=1`.

## Cloud agent vs your laptop

Cloud agents sometimes keep a long-lived preview in tmux (e.g. `arc-desk-preview-4173`). **On your machine you do not need tmux** — run `npm run preview:desk` in a terminal and stop it with Ctrl+C when done.

## Troubleshooting

<!-- Kelly: cream UI with no desk-v2 footer stamp = wrong repo folder, still on main, or you did not run npm run preview:desk (old bundle). Fix: cd arc-greenfield, checkout cursor/arc-production-integration, npm run preview:desk, open ?demo=1&demoReset=1 — bottom-right must say desk-v2 · <git sha>. -->

**Kelly-simple:** If the planner looks like **cream everywhere** and there is **no** tiny **`desk-v2 · …`** stamp in the bottom-right corner, you are **not** running the new desk build. That is almost always the **wrong folder**, **`main`** (or another branch), or you ran **`npm run dev`** / plain **`npm run preview`** instead of **`npm run preview:desk`**.

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| Cream mat / green pattern around planner, **CALENDAR** label, month dropdown | Old plan shell or stale bundle | `cd` to repo root, `git checkout cursor/arc-production-integration`, `git pull`, `npm run preview:desk` |
| No `desk-v2` footer stamp, no `data-build="desk-v2@…"` on `<html>` | Build was not `preview:desk` (env stamp missing) or wrong checkout | Run **`npm run preview:desk`** only; preflight prints cwd, branch, commit |
| Preflight fails on branch | Not on integration branch and commit ≠ `origin/cursor/arc-production-integration` | `git fetch origin`, then checkout integration **or** pull until your commit matches origin; see switch command above if checkout fails |
| Said **"nope"** after preflight blocked you | Wrong branch **and** old commit, or checkout failed silently | From repo root: `git fetch origin`, then either `git switch cursor/arc-production-integration && git pull` **or** stay on your repair branch but `git merge origin/cursor/arc-production-integration` so HEAD matches origin; run `npm run preview:desk` again; open `?demo=1&demoReset=1` — you need **wood** + **`desk-v2 · …`** stamp |
| Still wrong after pull | Preview from another clone or port | Stop other servers; use `http://127.0.0.1:4173/?demo=1&demoReset=1` |

### Verify the stamp (proves you have new JS + HTML)

1. Run `npm run preview:desk` — the terminal prints **cwd**, **branch**, **commit**, and the demo URL.
2. Open `http://127.0.0.1:4173/?demo=1&demoReset=1`.
3. Bottom-right footer: **`desk-v2 · <short git sha>`** (also injected into `dist/index.html` before JS runs).
4. DevTools → Elements → `<html data-build="desk-v2@<sha>">`.
5. Console: `[Arc desk preview] desk-v2@<sha>`.

If step 3–5 fail, you do **not** have the integration desk build — CSS-only tweaks cannot add the stamp.

### CalendarStageHeader vs desk shell

On the **desk** build, legacy **Calendar** chrome (`CALENDAR` label, month dropdown in the spread header) is **hidden by CSS** when `.arc-shell--desk` is active. If you still see that header, the app never entered the desk shell (onboarding / wrong branch / old bundle). **`?demo=1&demoReset=1`** re-seeds storage and reloads so onboarding is skipped and the wood desk shell (`arc-shell--desk`) can mount. No stamp ⇒ the new code path is not loaded at all.

**Month view inside the desk:** The planner spread can stay **cream/paper** while the **outer** viewport is **wood** — that is normal. If the **full page** is cream with the green **pattern** mat and a **CALENDAR** stage header, you are still on the legacy plan shell, not `.arc-shell--desk`. Preview builds also honor **`?forceDesk=1`** (with `demo=1`) to bypass onboarding gating when stale storage blocked the desk path.
