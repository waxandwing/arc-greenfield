# Kelly desk asset incorporation pass

**Drop-folder steps (drag, add, commit, push):** see `uploads/desk-incoming/README.txt`.

**Run:** 2026-09-15 (Cloud Agent, after Kelly reported files in `uploads/desk-incoming`)  
**Branch checked:** `main` @ `94a35d64684474db8d04d9e4301c3ea706355c9f` (before this doc commit)  
**Prior agent:** bc-0b3c8b5b likely ran when the drop folder had no assets yet.

---

## Incoming folder inventory (repo)

| Path | Size |
|------|------|
| `uploads/desk-incoming/README.txt` | 688 B |
| `uploads/desk-incoming/.gitkeep` | 0 B |

**Asset files (PNG, SVG, JPG, WebP, etc.):** **0**

`git status uploads/` — clean; nothing untracked under `uploads/`.

---

## Incorporated this pass?

**No.** There were no image files in the repo to move into `public/assets/…` or wire through manifest/slices.

Existing desk slices in `public/assets/desk/slices/` are unchanged from prior work on `main` (manifest + runtime already present).

---

## Kelly: your files are probably only on your Mac

If you copied PNGs/SVGs into `uploads/desk-incoming` on your laptop, Git does **not** upload them until you **commit and push**. The cloud agent only sees what is on GitHub.

### Option A — Terminal (recommended)

From your Arc repo folder on your Mac:

```bash
cd /path/to/arc-greenfield
git checkout main
git pull origin main
```

Copy your desk files into `uploads/desk-incoming/`. Edit `uploads/desk-incoming/README.txt` and list each filename with one line saying what it is.

Then:

```bash
git add uploads/desk-incoming/
git status
git commit -m "Add Kelly desk assets to incoming drop folder"
git push origin main
```

After push, ask Cursor:

> Incorporate the desk assets in `uploads/desk-incoming`.

### Option B — Cursor UI

1. Open this repo in Cursor and make sure you are on **main** (pull latest).
2. Drag your files into `uploads/desk-incoming/` in the file tree.
3. Update `uploads/desk-incoming/README.txt` with the file list.
4. Source Control → stage `uploads/desk-incoming/` → commit → **Push**.

---

## After assets are on GitHub

An agent will sort files per `docs/KELLY-WHERE-TO-PUT-DESK-ASSETS.md`, update slices/manifest/CSS if needed, and push to `main`.

**You preview the desk with:**

```bash
npm run kelly:desk
```

Then open: `http://127.0.0.1:4173/?demo=1&demoReset=1`

Check the bottom-right footer stamp (`desk-v2 · main · <sha>`) matches the latest commit after you pull.
