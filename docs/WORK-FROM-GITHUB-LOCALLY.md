# Work from GitHub on your Mac (cheat sheet)

**Kelly one command:** `npm run kelly:desk` then open `http://127.0.0.1:4173/?demo=1&demoReset=1` (preflight + frees port 4173 + fresh desk build).

**No terminal:** GitHub Pages (after each `main` deploy) — https://waxandwing.github.io/arc-greenfield/?demo=1&demoReset=1 — footer should show current `main` SHA (e.g. `1149408`).

**Clone URL:** `https://github.com/waxandwing/arc-greenfield.git`  
**Default branch:** `main` — wood desk + `kelly:desk` and Teaching week source assets (SVG/PNG defaults; synced 2026-09-15 — pull `main` before preview).  
**Optional:** `cursor/arc-production-integration` stays in sync for agent coordination; you do **not** need to check it out for daily preview.  
**Full handoff:** [docs/overnight/ARC-CURSOR-RESTRUCTURE-HANDOFF.md](overnight/ARC-CURSOR-RESTRUCTURE-HANDOFF.md)

---

## Cloud vs local

**Cloud agent** = code on Cursor’s remote VM. **Local** = repo cloned on your Mac, opened in **Cursor desktop**; `git` and `npm` run on your machine. Use local for daily preview; pull from GitHub after cloud agents push.

---

## One-time

- [Node.js LTS](https://nodejs.org) + Git (Xcode CLI tools or [git-scm.com](https://git-scm.com))
- [Cursor desktop](https://cursor.com)

---

## First clone

```bash
git clone https://github.com/waxandwing/arc-greenfield.git
cd arc-greenfield
```

`cd` = go into the project folder (must contain `package.json`).

**Cursor:** File → Open Folder → pick `arc-greenfield`.

---

## Every desk session

```bash
cd /path/to/arc-greenfield
git pull origin main
npm run kelly:desk
```

Open: `http://127.0.0.1:4173/?demo=1&demoReset=1`

Check footer: **`desk-v2 · main · <sha>`** (not cream-only old shell).

First time after clone: run `npm install` once in the repo folder.

Port stuck? `npm run preview:desk:stop` then retry.

---

## Cursor Agent

- **Local:** Agent chat with **your cloned folder** open — edits stay on your Mac.
- **Cloud:** Run at cursor.com/agents; then **`git pull`** on Mac to get commits.
- **Avoid:** Cloud “new project” that is not this repo; opening the wrong clone folder or running plain `npm run dev` instead of `kelly:desk`.

---

## Troubleshooting

See [docs/LOCAL-PREVIEW.md](LOCAL-PREVIEW.md).
