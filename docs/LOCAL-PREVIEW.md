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
| Green/cream **pattern** around the planner, **CALENDAR** label, **Month** dropdown, no wood | **OLD** shell — wrong branch, stale build, or preview not from this repo |
| **Light wood desk**, planner tabs on top of the spread (**DAY / WEEK / MONTH**), **Teaching week** title, tray on the wood | **NEW** desk (`desk-v2`) |

With `npm run preview:desk`, a tiny footer shows `desk-v2 · <git sha>` and the browser console logs the same. The `<html>` tag gets `data-build="desk-v2@<sha>"`.

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

## Cloud agent vs your laptop

Cloud agents sometimes keep a long-lived preview in tmux (e.g. `arc-desk-preview-4173`). **On your machine you do not need tmux** — run `npm run preview:desk` in a terminal and stop it with Ctrl+C when done.
