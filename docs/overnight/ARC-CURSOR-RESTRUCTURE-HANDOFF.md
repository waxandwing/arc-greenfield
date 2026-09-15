# Arc + Cursor restructure handoff (Kelly)

**Repo:** [waxandwing/arc-greenfield](https://github.com/waxandwing/arc-greenfield)  
**Desk integration branch:** `cursor/arc-production-integration`  
**Quick bookmark:** [docs/WORK-FROM-GITHUB-LOCALLY.md](../WORK-FROM-GITHUB-LOCALLY.md)

This document is the plain-English map for where Arc desk work lives, how to preview it, and how to use Cursor without depending on a cloud-only VM.

---

## What changed (one screen)

- The **Arc desk** (wood tabletop, tray, Teaching week planner, `desk-v2` build stamp) is on **`cursor/arc-production-integration`**, not on `main`.
- **`main`** is still the protected release line; it does not carry the desk preview scripts or slices you are reviewing.
- **GitHub** (`waxandwing/arc-greenfield`) is the source of truth for code Kelly and agents should use on a Mac.
- **Cloud agents** (Cursor background runs on a remote machine) are useful for overnight passes, but Kelly’s day-to-day should be: **clone on Mac → open folder in Cursor → pull integration branch → `npm run preview:desk`.**

Step-by-step terminal commands after you are on the right branch: [docs/LOCAL-PREVIEW.md](../LOCAL-PREVIEW.md).

---

## Branch and preview authority

| Goal | Branch | Command / URL |
|------|--------|----------------|
| Kelly desk review | `cursor/arc-production-integration` | `npm run preview:desk` → `http://127.0.0.1:4173/?demo=1&demoReset=1` |
| Release / old plan shell | `main` | Not for desk preview |
| Agent overnight queue | Same integration branch | See [AGENT-WORK-QUEUE.md](./AGENT-WORK-QUEUE.md) |

**Verify you are on NEW desk:** bottom-right footer shows **`desk-v2 · cursor/arc-production-integration · <git sha>`** (wood surround, not cream plan shell everywhere).

---

## Three ways people preview (do not mix them up)

1. **Kelly Mac (preferred):** Clone repo locally, checkout integration, `npm run preview:desk` on port 4173.
2. **Cursor cloud agent VM:** An agent runs commands on a remote workspace; good for batch work, not required for Kelly to see the desk.
3. **Stale/wrong folder:** Another clone, wrong branch, or `npm run dev` / plain `preview` — shows OLD cream UI; fix with branch + `preview:desk` (see LOCAL-PREVIEW troubleshooting).

---

## Work on your Mac from GitHub (not cloud)

### Cloud vs local (one paragraph)

A **cloud agent** runs in Cursor’s remote environment: the code lives on a VM, and you watch progress in the browser. **Local** means the same GitHub repo is **cloned onto your Mac**, you open that folder in **Cursor desktop**, and Terminal commands (`git`, `npm run preview:desk`) run on **your** machine. Both can push to GitHub, but only the local folder is “your” desk preview unless you deliberately start a cloud run. For daily review and pairing with an agent on **your** code, use local.

### One-time setup on your Mac

1. **Git** — If `git --version` works in Terminal, you are fine. Otherwise install Xcode Command Line Tools (`xcode-select --install`) or Git from [git-scm.com](https://git-scm.com/).
2. **Node.js** — Install current LTS from [https://nodejs.org](https://nodejs.org) (includes `npm`). You need this for `npm install` and `npm run preview:desk`.
3. **Cursor desktop** — Install from [https://cursor.com](https://cursor.com) and sign in with the same account you use for agents.

### Clone the repo (first time)

In Terminal:

```bash
git clone https://github.com/waxandwing/arc-greenfield.git
cd arc-greenfield
```

- **`git clone …`** downloads a copy of the repository from GitHub into a new folder named `arc-greenfield`.
- **`cd arc-greenfield`** means “go into that folder” so the next commands run **inside** the project (where `package.json` lives). If you skip `cd`, `git` and `npm` will fail or touch the wrong place.

### Open the project in Cursor (not “New cloud project”)

1. Launch **Cursor** (desktop app).
2. **File → Open Folder…**
3. Choose the **`arc-greenfield`** folder you cloned (the one that contains `package.json`).

You should see the repo tree in the sidebar. That is your **local workspace**.

### Always use the integration branch before preview

```bash
git fetch origin
git checkout cursor/arc-production-integration
git pull origin cursor/arc-production-integration
npm install
```

Do **not** run `npm run preview:desk` from `main` — you will get the old plan shell without a useful `desk-v2` stamp.

### Daily loop (Kelly)

1. Open Terminal, **`cd`** to your `arc-greenfield` folder.
2. **`git pull origin cursor/arc-production-integration`** (get latest desk work).
3. **`npm install`** only if `package-lock.json` changed or an agent told you to.
4. **`npm run preview:desk`**
5. Browser: **`http://127.0.0.1:4173/?demo=1&demoReset=1`**
6. Confirm footer: **`desk-v2 · cursor/arc-production-integration · <sha>`** matches `git rev-parse --short HEAD`.

Stop preview: **Ctrl+C** in the Terminal tab, or `npm run preview:desk:stop` if port 4173 is stuck.

### Cursor Agent: attach to **local** repo vs cloud-only

| You want… | Do this |
|-----------|---------|
| Agent edits **files on your Mac** | Open the cloned **`arc-greenfield`** folder in Cursor desktop → open **Agent / Chat** with that folder as the workspace. Ask it to run `npm run preview:desk` in **your** Terminal. |
| Agent works overnight without your Mac on | Start a **cloud agent** from Cursor (e.g. linked to the GitHub repo). When it finishes, **`git pull`** on your Mac to pick up its commits on `cursor/arc-production-integration`. |
| Avoid | Starting a cloud **New Project** that is **not** tied to `waxandwing/arc-greenfield`, or previewing from a random folder — you will not see desk-v2. |

**Rule of thumb:** If the Cursor window title / path is your Mac’s `arc-greenfield` clone, the agent is local. If the run lives at `cursor.com/agents/…` with a remote VM, it is cloud — still fine, but Kelly’s preview should come from **your** pull + `preview:desk`.

---

## Done vs next (desk)

- **Done:** Desk slices, demo seed, `preview:desk` preflight (branch gate), build stamp with branch + SHA, local preview docs.
- **Next:** Visual parity items in [AGENT-WORK-QUEUE.md](./AGENT-WORK-QUEUE.md) (planner header, row rails, pixel pass).

---

## Related docs

- [docs/WORK-FROM-GITHUB-LOCALLY.md](../WORK-FROM-GITHUB-LOCALLY.md) — one-page cheat sheet
- [docs/LOCAL-PREVIEW.md](../LOCAL-PREVIEW.md) — commands, troubleshooting, port 4173
- [docs/overnight/KELLY-DESK-PREVIEW-REPORT.md](./KELLY-DESK-PREVIEW-REPORT.md) — review checklist

---

## Repo missing?

**Origin is configured:** `https://github.com/waxandwing/arc-greenfield.git` — Kelly can clone immediately; no need to create a new GitHub repo.

If clone ever fails with “repository not found,” confirm GitHub access to the **waxandwing** org and that you are signed into the correct account.
