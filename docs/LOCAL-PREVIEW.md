# Local desk build and preview

Use the **integration branch** for the Arc desk (wood tabletop, tray, MSC pad, ArcTable). `main` does not carry this build by default.

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

- `demo=1` — seed demo teaching-day content (AP / 2D / 3D) when storage is empty or on first visit.
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
| `npm run preview:desk` | `build:bundle` → Vite preview @ 127.0.0.1:4173 |
| `npm run start:desk` | Same as `preview:desk` |
| `npm run dev:desk` | Vite dev @ 127.0.0.1:4317 |

`npm run preview` (no `:desk`) still works but does not pin host/port; prefer `preview:desk` for desk verification.

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
