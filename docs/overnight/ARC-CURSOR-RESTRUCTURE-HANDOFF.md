# Arc desk — Cursor restructure handoff (Kelly + future agents)

> **If you only read one thing**
>
> The **Arc wood desk** (Teaching week mock) lives on branch **`cursor/arc-production-integration`**, not **`main`**. Open the repo folder you cloned in Cursor, run the copy-paste block in [Local preview (copy-paste)](#local-preview-copy-paste), then open **`http://127.0.0.1:4173/?demo=1&demoReset=1`**. You should see **wood**, title **Teaching week**, kicker **SEPTEMBER 7 - 11 • WEEK 4**, and a tiny bottom-right **footer stamp** like **`desk-v2 · cursor/arc-production-integration · e32b8b7`**. If you see cream everywhere with **CALENDAR** / **Month** and **no** `desk-v2` stamp, you are on the wrong **branch** or wrong **project folder** — fix that before judging the desk.

**Last updated:** 2026-09-15 · integration tip ~`e32b8b7`  
**Repo:** [waxandwing/arc-greenfield](https://github.com/waxandwing/arc-greenfield)

---

## Plain terms (30 seconds)

| Word | Meaning here |
|------|----------------|
| **Branch** | A named line of work in Git. Desk work = **`cursor/arc-production-integration`**. **`main`** = older plan shell only — **not** where the desk is built. |
| **Project folder** | The folder you **opened in Cursor** (File → Open Folder). It must be the clone that contains **`package.json`** (usually named **`arc-greenfield`**). Running git/npm from your home folder or a different clone = wrong place. |
| **Preview** | A built copy of the app running in the browser (local port **4173** or GitHub Pages). |
| **Footer stamp** | Small text bottom-right: **`desk-v2 · <branch> · <short git sha>`** — proves you are on the integration desk build, not legacy cream UI. |

---

## 1. What this project IS

**Arc** (this repo) is Kelly’s teacher planning product. The current **north star** for visual work is the **first Teaching week comp**: a **wood tabletop** with **IDEAS** drawer, **TO-DOS** denim folder, **cream planner spread** titled **Teaching week**, week grid (AP / 2D / 3D), vertical **DAY / WEEK / MONTH / YEAR** tabs on the planner edge, and **Start class** on the wood.

That target is written in **`docs/overnight/MASTER-DESK-VISUAL-GOAL.md`**. Agents compare every pass to Kelly’s comp + Figma frame `37:11052`.

**Kelly rule:** Do **not** merge desk work into **`main`** unless Kelly explicitly asks. **`main`** stays a legacy shell lane.

---

## 2. WHERE work lives

| Location | Use it for desk? |
|----------|------------------|
| **`cursor/arc-production-integration`** | **YES** — all desk slices, preview scripts, Pages deploy, overnight docs |
| **`main`** | **NO** for desk preview — no `preview:desk`, no wood desk bundle |
| **`develop` / feature branches** | Plan continuity history; not the desk coordination lane |

**Spell it out:** `cursor/arc-production-integration`  
(checkout name is exactly that, including the `cursor/` prefix.)

---

## 3. Three ways to look at the desk

### A) Cursor Cloud Agent preview URL

When Kelly (or an agent) runs a **Cursor Cloud Agent** on this repo **on the integration branch**, the agent run page on Cursor shows a **Preview** link to the built app (often **`127.0.0.1:4173`** on the agent VM, surfaced as a clickable preview).

- Use demo URL: **`?demo=1&demoReset=1`** on that preview so the Teaching week seed loads.
- Check the same **footer stamp** as local (`desk-v2 · … · <sha>`).
- Cloud agents should **commit on `cursor/arc-production-integration`** only; they do not need Kelly to open a PR unless she asks.

### B) Local Cursor + terminal (Kelly’s laptop)

1. In Cursor: **File → Open Folder** → pick your **`arc-greenfield`** clone (**project folder** = that folder).
2. Open the integrated terminal (it should start **inside** that folder — you should see `package.json` if you list files).
3. Follow [Local preview (copy-paste)](#local-preview-copy-paste) below.
4. More detail: **`docs/LOCAL-PREVIEW.md`**.

### C) GitHub Pages (no local server)

Pushes to **`cursor/arc-production-integration`** can publish a stamped **desk-v2** build to Pages:

```text
https://waxandwing.github.io/arc-greenfield/?demo=1&demoReset=1
```

Allow **2–5 minutes** after a push; hard-refresh if the stamp SHA looks old. One-time repo setting: Pages **Source = GitHub Actions** (see **`docs/LOCAL-PREVIEW.md`**).

---

## Local preview (copy-paste)

Run from the **repo root** (folder with `package.json`):

```bash
git fetch origin
git checkout cursor/arc-production-integration
git pull origin cursor/arc-production-integration
npm install
npm run preview:desk
```

Then open in the browser:

```text
http://127.0.0.1:4173/?demo=1&demoReset=1
```

Stop the server with **Ctrl+C** when done. If port 4173 is busy, try opening the URL anyway (preview may already be running) or run **`npm run preview:desk:stop`**.

---

## 4. How to know you’re right

You have the **correct** desk build when **all** of these are true:

1. **Wood** fills the outer viewport (not a big cream mat with green pattern behind everything).
2. Planner title **Teaching week** (not “This Month” or Year grid as home).
3. Kicker **SEPTEMBER 7 - 11 • WEEK 4** (Kelly demo week).
4. Bottom-right **footer stamp**: **`desk-v2 · cursor/arc-production-integration · <sha>`** matching **`git rev-parse --short HEAD`** on your machine.
5. **IDEAS** (green drawer top-center) and **TO-DOS** (denim folder left) visible on the comp layout.

**Wrong build signs:** **CALENDAR** header, month dropdown on the spread, cream-only surround, **no** `desk-v2` stamp → almost always **`main`**, wrong folder, or you ran **`npm run dev`** / plain **`npm run preview`** instead of **`npm run preview:desk`**.

---

## 5. Cursor workflow restructure

### For Kelly

- Start agent work from the **Create repo** flow in Cursor (repo pill = **arc-greenfield**).
- Tell agents: **work on branch `cursor/arc-production-integration`**, pull before preview, **no PR** unless you want one.
- Ignore **`main`** for desk visual review — it will look “stuck” on the old shell.

### For Cloud Agents (every pass)

1. **Branch:** `cursor/arc-production-integration` only — no merge to **`main`**, no Vercel deploy, no PR unless Kelly asks.
2. **Read first:** this handoff → **`MASTER-DESK-VISUAL-GOAL.md`** → **`AGENT-WORK-QUEUE.md`**.
3. **Do not settle:** blockers → log questions for Kelly in the queue; pixel diff **~60%** is **not** done; no false “100%” claims.
4. **Gates after desk UI changes:** `npm run test:arc-desk-pass`; after contracts/navigation touches: `npm run test:contracts`.
5. **Honesty:** update ruthless audit notes; Kelly still owns rows in the live **Google Drive Ruthless Design Audit** sheet.

### Agent queue docs (source of truth for “what’s next”)

| Doc | Role |
|-----|------|
| **`docs/overnight/AGENT-WORK-QUEUE.md`** | Ordered work items, blockers, **QUESTIONS FOR KELLY** |
| **`docs/overnight/MASTER-DESK-VISUAL-GOAL.md`** | Visual north star + do-not-settle rules |
| **`docs/LOCAL-PREVIEW.md`** | Kelly-local preview troubleshooting |
| **`docs/overnight/ARCTABLE-ICARUS-PLANNER-MERGE.md`** | ArcTable vertical slices + merge questions |

---

## 6. What’s DONE vs NEXT

Snapshot from the queue @ integration tip (~`e32b8b7` / recent audit @ `3067c83` lineage):

### Done (recent)

- **Vertical Figma/Arc slices** (tabs, IDEAS drawer, TO-DOS folder, start-class frame) — manifest + **`test:desk-slices`**
- **Calendar enlarge pop-out** (inline week + modal YEAR/DAY) — **`DeskCalendarPopOut`**
- **ArcTable slice 1** — Start class / fixture → live from Teaching week (week row + desk mark; hooks order fix)
- **Today ←/→** cluster on planner header; Kelly demo row labels (**P1 • 8:05–9:00**, etc.)
- Structural smokes green on stamped **`desk-v2`** preview builds

### In progress / next

| Priority | Item | Notes |
|----------|------|--------|
| **NEXT (P0)** | **Planner header** — rainbow mark beside “Teaching week”, Today chevron pill polish | Audit **FAIL #18** on rainbow |
| **P1** | **Course row rails** + period/time blocks | Left color rails still FAIL vs comp |
| **P0 audit** | **Ruthless Design Audit** | **YELLOW** — not Drive-GREEN overall (`DESK-RUTHLESS-AUDIT-PASS-2026-09-15.md`) |
| **Blocked** | **Pixel pass** | Global RGB diff **~60%** (target **&lt;15%**); needs header/row/tab/folder slices + assets |

**Enlarge:** calendar pop-out done; use enlarge trigger on desk for week modal navigation.

---

## 7. Questions only Kelly can answer

Short list (details in queue + ArcTable merge doc):

1. **Drive Ruthless Design Audit sheet** — Kelly updates PASS/FAIL rows each agent pass (agents document in repo; MCP does not replace the workbook).
2. **Rainbow title mark** — Figma export or node id for the icon beside **Teaching week** (requirement **#18** FAIL).
3. **Period times** — Confirm P4/P5 times for 2D/3D rows if they differ from demo labels.
4. **ArcTable × icarus** — Teaching Mode transport vs local ArcTable; **`paid-live`** on demo; start-class on focus column only; hidden **`/table`** QA route; NOW/NEXT/hold scope; Drive path for **GREENPP** assets (see **`ARCTABLE-ICARUS-PLANNER-MERGE.md`**).

---

## 8. Quick links

- GitHub branch: `https://github.com/waxandwing/arc-greenfield/tree/cursor/arc-production-integration`
- Pages desk URL: `https://waxandwing.github.io/arc-greenfield/?demo=1&demoReset=1`
- Local preview guide: **`docs/LOCAL-PREVIEW.md`**

---

*This file is the single primary handoff for Arc desk + Cursor restructure. Update it when integration tip or queue snapshot meaningfully changes.*
