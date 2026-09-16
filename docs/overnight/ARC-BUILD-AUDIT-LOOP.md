# ArcBuild audit ↔ implementation loop

**For:** ArcBuild audit agent (auditor) and Cursor implementation agent (builder)  
**Product branch:** `main` (`waxandwing/arc-greenfield`)  
**North star comp:** Teaching week — `docs/overnight/evidence/kelly-teaching-week-authority.png` (from Kelly zip `1.png`)  
**Honesty:** `docs/overnight/TEACHING-WEEK-ASSETS-HONESTY.md` (source PNG/SVG vs comp crops)

## Roles

| Agent | Responsibility |
|-------|----------------|
| **ArcBuild audit agent** | Run audits each iteration against master build rules, Drive gates, pixel/fidelity smokes, and queue items. Emit **actionable requirements** (PASS/FAIL, file hints, P0/P1). |
| **Implementation agent** (this lane) | Apply requirements on `main`, run gates, **commit + push**, return **handback packet** below so ArcBuild can re-audit. |

Kelly routes audit output → implementation; implementation handback → ArcBuild re-run.

## Default commands (implementation must run before handback)

```bash
git checkout main && git pull origin main
npm run test:contracts
npm run test:arc-desk-pass    # desk preview; needs preview build per package.json
npm run test:desk-slices      # when slice manifest touched
npm run test:desk-pixel-pass  # when visual parity claimed; ref = Teaching week authority PNG
```

Local preview Kelly uses: `npm run kelly:desk` → `http://127.0.0.1:4173/?demo=1&demoReset=1`  
Footer must match: `desk-v2 · main · <short-sha>`.

## What the audit agent sends (requirements payload)

Prefer a structured message each iteration:

1. **Audit id / pass name** (e.g. Drive ruthless P0, pixel round, ArcBuild master build checklist)
2. **Baseline SHA** audited
3. **Verdict** per rule (PASS / YELLOW / FAIL / RED) with rule ids or doc section links
4. **Required changes** — ordered list; each item: outcome, suggested paths, acceptance check
5. **Blockers for Kelly only** — separate from builder work

Reference docs: `docs/overnight/AUDIT-RULES-FROM-DRIVE.md`, `DESK-RUTHLESS-AUDIT-PASS-2026-09-15.md`, `MASTER-DESK-VISUAL-GOAL.md`, `AGENT-WORK-QUEUE.md`, `TEACHING-WEEK-ZIP-INCORPORATION.md`.

**Behavior contract (while fidelity continues):** `ARC-HARD-UI-AUDIT-INTUITIVE-HELPFUL-2026-09-15.md` — pointer + six scenario acceptance checks in `docs/overnight/README.md`. Visual PRs must not regress teacher comprehension / recovery.

## Handback packet (implementation → ArcBuild audit agent)

After changes, reply with this block (copy-paste for auditor):

```markdown
## ArcBuild handback

- **Branch:** main
- **SHA:** `<full or short git rev-parse HEAD>`
- **Pushed:** yes/no — `origin/main` at `<sha>`

### Requirements addressed
| Req | Status | Notes |
|-----|--------|-------|
| … | DONE / PARTIAL / BLOCKED | … |

### Tests
| Command | Result |
|---------|--------|
| test:contracts | PASS/FAIL |
| test:arc-desk-pass | PASS/FAIL |
| test:desk-pixel-pass | PASS/FAIL + diff % if run |

### Evidence / docs
- …

### Remaining for next audit
- …

### Kelly-only blockers
- …
```

**Rule:** Do not claim visual DONE if `test:desk-pixel-pass` is still >>15% RGB diff unless audit scope excluded pixel.

## Master build alignment

- **Visual reference:** Teaching week authority PNG (not `kelly-current-display-*` — that is “what was wrong”).
- **Assets:** Prefer real files in `public/assets/` and `uploads/desk-incoming/`; comp crops only with `?deskSlices=1` / explicit audit request.
- **Queue sync:** Update `AGENT-WORK-QUEUE.md` item status when closing A–F or ArcBuild-specific rows.

## Git

- Work on **`main`** unless Kelly specifies otherwise.
- **Always `git push origin main`** after green contract/desk gates so Kelly and ArcBuild audit the same generation.
- No PR unless Kelly asks.
