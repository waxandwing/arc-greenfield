# Arc desk — Cursor restructure handoff (Kelly + future agents)

> **If you only read one thing**
>
> The **Arc wood desk** (Teaching week mock) is on **`main`** as of **2026-09-15** (Kelly Option 1 merge). Clone, `npm install`, then **`npm run kelly:desk`**, and open **`http://127.0.0.1:4173/?demo=1&demoReset=1`**. You should see **wood**, title **Teaching week**, kicker **SEPTEMBER 7 - 11 • WEEK 4**, and a tiny bottom-right **footer stamp** like **`desk-v2 · main · <sha>`**. If you see cream everywhere with **CALENDAR** / **Month** and **no** `desk-v2` stamp, you are in the wrong **project folder** or you skipped **`kelly:desk`** — fix that before judging the desk.

**Last updated:** 2026-09-15 (desk merged to `main`)  
**Repo:** [waxandwing/arc-greenfield](https://github.com/waxandwing/arc-greenfield)  
**Mac cheat sheet:** [`docs/WORK-FROM-GITHUB-LOCALLY.md`](../WORK-FROM-GITHUB-LOCALLY.md)

---

## Plain terms (30 seconds)

| Word | Meaning here |
|------|----------------|
| **Branch** | **`main`** = default clone; wood desk + `kelly:desk`. **`cursor/arc-production-integration`** = agent coordination lane (optional checkout; kept in sync with `main`). |
| **Project folder** | The folder you **opened in Cursor** (File → Open Folder). It must be the clone that contains **`package.json`** (usually named **`arc-greenfield`**). Running git/npm from your home folder or a different clone = wrong place. |
| **Preview** | A built copy of the app running in the browser (local port **4173**, Cloud Agent preview link, or GitHub Pages). |
| **Footer stamp** | Small text bottom-right: **`desk-v2 · <branch> · <short git sha>`** — proves you are on the integration desk build, not legacy cream UI. |

---

## 1. What this project IS

**Arc** (this repo) is Kelly’s teacher planning product. The current **north star** for visual work is the **first Teaching week comp**: a **wood tabletop** with **IDEAS** drawer, **TO-DOS** denim folder, **cream planner spread** titled **Teaching week**, week grid (AP / 2D / 3D), vertical **DAY / WEEK / MONTH / YEAR** tabs on the planner edge, and **Start class** on the wood.

That target is written in **`docs/overnight/MASTER-DESK-VISUAL-GOAL.md`**. Agents compare every pass to Kelly’s comp + Figma frame `37:11052`.

**Kelly rule (updated 2026-09-15):** Desk is merged to **`main`** for simple clone + one command. Agents may still commit on **`cursor/arc-production-integration`**; merge or fast-forward to **`main`** when Kelly wants Mac preview updated.

---

## 2. WHERE work lives

| Location | Use it for desk? |
|----------|------------------|
| **`main`** | **YES** — default branch; `kelly:desk`, wood desk, GitHub Pages deploy |
| **`cursor/arc-production-integration`** | **YES** — agent lane; should match `main` tip after each merge |
| **`develop` / feature branches** | Plan continuity history; not the desk coordination lane |

---

## 3. Three ways to look at the desk

### A) Cursor Cloud Agent preview URL

When Kelly (or an agent) runs a **Cursor Cloud Agent** on this repo **on the integration branch**, the run page on Cursor (`cursor.com/agents/…`) shows a **Preview** link to the built app (often port **4173** on the agent VM).

- Append **`?demo=1&demoReset=1`** so the Teaching week seed loads.
- Check the same **footer stamp** as local (`desk-v2 · … · <sha>`).
- Cloud agents **commit on `cursor/arc-production-integration`** only; **no PR** unless Kelly asks.

### B) Local Cursor + terminal (Kelly’s laptop)

1. In Cursor: **File → Open Folder** → pick your **`arc-greenfield`** clone (**project folder** = that folder — not “New cloud project” unless you intend a remote-only run).
2. Open the integrated terminal (it should start **inside** that folder — you should see `package.json` if you list files).
3. Follow [Local preview (copy-paste)](#local-preview-copy-paste) below.
4. More detail: **`docs/LOCAL-PREVIEW.md`** and **`docs/WORK-FROM-GITHUB-LOCALLY.md`**.

**Cloud vs local (one line):** A cloud agent edits on a remote VM; your **Mac clone** is what you use for day-to-day preview after **`git pull`**.

### C) GitHub Pages (no local server)

Pushes to **`main`** (or **`cursor/arc-production-integration`**) publish a stamped **desk-v2** build to Pages:

```text
https://waxandwing.github.io/arc-greenfield/?demo=1&demoReset=1
```

Allow **2–5 minutes** after a push; hard-refresh if the stamp SHA looks old. One-time repo setting: Pages **Source = GitHub Actions** (see **`docs/LOCAL-PREVIEW.md`**).

---

## Local preview (copy-paste)

Run from the **repo root** (folder with `package.json`):

```bash
git clone https://github.com/waxandwing/arc-greenfield.git
cd arc-greenfield
npm install
npm run kelly:desk
```

Already cloned? `git pull origin main` then `npm run kelly:desk`.

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
4. Bottom-right **footer stamp**: **`desk-v2 · main · <sha>`** matching **`git rev-parse --short HEAD`** on your machine.
5. **IDEAS** (green drawer top-center) and **TO-DOS** (denim folder left) visible on the comp layout.

**Wrong build signs:** **CALENDAR** header, month dropdown on the spread, cream-only surround, **no** `desk-v2` stamp → wrong folder, stale clone, or you ran **`npm run dev`** / plain **`npm run preview`** instead of **`npm run kelly:desk`**.

---

## 5. Cursor workflow restructure

### For Kelly

- In Cursor, pick repo **`waxandwing/arc-greenfield`** (Create / repo pill — not a random empty project).
- Tell agents: desk on **`main`**; optional lane **`cursor/arc-production-integration`**, **no PR** unless you want one.
- After a **cloud agent** finishes, on your Mac: **`git pull origin main`** then **`npm run kelly:desk`**.

### For Cloud Agents (every pass)

1. **Branch:** prefer **`cursor/arc-production-integration`** for agent commits; land on **`main`** when Kelly wants Mac preview updated. No Vercel deploy, no PR unless Kelly asks.
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

Snapshot from the queue (audit lineage @ `3067c83`; pull integration for latest tip):

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

- GitHub default: `https://github.com/waxandwing/arc-greenfield/tree/main`
- Agent lane: `https://github.com/waxandwing/arc-greenfield/tree/cursor/arc-production-integration`
- Pages desk URL: `https://waxandwing.github.io/arc-greenfield/?demo=1&demoReset=1`
- Local preview guide: **`docs/LOCAL-PREVIEW.md`**
- Mac clone + Cursor open folder: **`docs/WORK-FROM-GITHUB-LOCALLY.md`**

---

*This file is the single primary handoff for Arc desk + Cursor restructure. Update it when integration tip or queue snapshot meaningfully changes.*
