# Stage 7 — Final Arc Plan visual system + skin

**Repo:** waxandwing/arc-greenfield  
**Branch:** `cursor/arc-production-integration`  
**Base:** `b7282aa`  
**Date:** 2026-09-14  
**Scope:** Visual-only maturity for Arc Plan; ArcTable minor token alignment; no behavior, navigation, or planning-law changes; no merge or deploy.

---

## A. Token & typography system

**Severity: GREEN**

- Centralized tokens in `src/styles/tokens.css`: paper/field/ink, accent blue (Plan), pine-live (ArcTable), spacing, geometry (`--radius-bloop`), surfaces, motion.
- Font loading in `src/styles/arc-fonts.css`: Instrument Serif, Inter, League Spartan → `--font-display`, `--font-ui`, `--font-label`.
- Summary: `docs/overnight/evidence/final-skin/VISUAL-SYSTEM.md`.

No state-header grammar changes; depth via type, spacing, and material—not bright state fills.

---

## B. Plan shell & global chrome

**Severity: GREEN**

- `arc-plan-shell.css`: cream `--field` background, cropped bloop accents (fixed, non-repeating), header on paper glass, live-return on mustard/ink (not pine-dominant).
- Removed Nunito; body and controls use Inter/League Spartan stack.
- No journal spine, Fridge product chrome, scallop trim, or dark-green Plan field.

Evidence: `01-teaching-day.png`, `08-workspace.png`.

---

## C. Teaching Day → Class → Lesson

**Severity: GREEN**

- Period rail selection: ink fill (not pine dashboard chips).
- Start class: `--accent-blue-deep` (Plan action); held/planned hierarchy unchanged.
- Editorial titles use Instrument Serif via `--font-editorial`.

Evidence: `01-teaching-day.png`, `02-class.png`, `03-lesson.png`.

---

## D. Week → Month → Year

**Severity: GREEN**

- Week: unequal day column widths preserved (behavior unchanged); grid on `--paper` with blue lesson accents.
- Month: continuity lens; unit bands unchanged in structure.
- Year: calm compressed unit tracks (no Month×12 dashboard); underlay tints retained.

Evidence: `04-week.png`, `05-month.png`, `06-year.png`.

---

## E. Planning period (P5) & Workspace

**Severity: GREEN**

- P5 lens: editorial buckets, not SaaS cards (`07-p5.png`).
- Workspace: fixed overlay (`b01-furniture-surface`), import link uses accent blue; no Fridge language.

Evidence: `07-p5.png`, `08-workspace.png`.

---

## F. Move / Shift / Recovery

**Severity: GREEN**

- Recovery review: type/spacing/material only (preview badge, terracotta anchors unchanged in meaning).
- Move panel styling inherits Plan tokens.

Evidence: `09-move-shift-recovery.png`.

---

## G. Onboarding & import

**Severity: GREEN**

- Onboarding: large Instrument Serif welcome; first-capture band uses blue-soft gradient (not pine block).
- Import: SOURCE vs Arc proposal vs re-import visually distinct (blue / mustard / lavender rules); parse emphasis uses accent blue not pine.

Evidence: `10-onboarding.png`, `11-import.png`.

---

## H. ArcTable consistency check

**Severity: GREEN (minor Plan alignment only)**

- Plan tokens referenced for field + label stack; **Teacher Monitor and Student Surface preserved** (pine live chip, student header, board dominance, tool furniture law).
- No dashboard refactor of classroom utilities.

Evidence: `12-arctable-teacher.png`, `13-arctable-student.png`.

---

## I. Ruthless visual QA checklist

| Check | Result |
|-------|--------|
| Cream paper field on Plan surfaces | PASS |
| Dark ink primary text | PASS |
| Instrument Serif + Inter + League Spartan via tokens | PASS |
| Softer blue accent on Plan (CTAs, links, import) | PASS |
| No dark-green-dominant Plan background | PASS |
| No repeating top trim / scallop border | PASS |
| No SaaS dashboard card stacks on Plan/P5 | PASS |
| No Fridge / journal / spine chrome | PASS |
| State header grammar unchanged | PASS |
| Week unequal widths | PASS (smokes) |
| Year compressed, not 12× Month | PASS |
| Import SOURCE / PROPOSAL / ambiguity lanes distinct | PASS |
| ArcTable live loop unchanged | PASS (`arctable-continuity.smoke.mjs`) |
| a11y / keyboard / 390px reflow | PASS (`test:browser-a11y`) |

**Carry-forward YELLOW (unchanged from Stage 6):** Cross Out product law; curriculum CSV scope; 400% human pass on dense Month/Year; optional URL/history for view transitions.

---

## Recommendation

**GREEN FOR FINAL VISUAL REVIEW**

Plan skin is aligned with the ArcTable family at the token and editorial level without altering classroom surfaces or planning law. Full engineering baseline green after skin.

---

## Files changed

| Path | Purpose |
|------|---------|
| `src/styles/tokens.css` | Central visual tokens |
| `src/styles/arc-fonts.css` | Font faces |
| `src/styles/arc-plan-shell.css` | Plan shell field, bloops, accent buttons |
| `src/styles/global.css` | Token wiring, de-pine Plan chrome |
| `src/styles/planningDay.css` | Period rail + Start class accents |
| `src/styles/planningCalendar.css` | Editorial + note add button |
| `src/styles/onboarding.css` | First-capture band |
| `src/styles/curriculumImport.css` | Import lane distinction |
| `src/styles/b01-fridge-content.css` | Workspace import link |
| `src/styles/arctable.css` | Minor field/font token refs |
| `src/main.tsx` | Import order |
| `index.html` | theme-color |
| `tests/final-skin-evidence.mjs` | Evidence capture |
| `docs/overnight/evidence/final-skin/*` | Screenshots + VISUAL-SYSTEM.md |
| `docs/overnight/STAGE7-FINAL-SKIN-REPORT.md` | This report |

---

## Tests (full baseline — PASS after skin)

```text
npm run build
npm run test:plan-navigation
npm run test:plan-week
npm run test:plan-month
npm run test:plan-year
npm run test:plan-p5
npm run test:plan-move-shift
npm run test:plan-onboarding-import
npm run test:import-onboarding
npm run test:browser-plan
npm run test:browser-a11y
node tests/phase2-calendar-edge-planning-truth.mjs
node tests/phase2-nondrag-keyboard-parity.mjs
node tests/phase2-object-actions-section-divergence.mjs
node tests/phase2-planning-truth.mjs
node tests/phase2-recovery-undo-continuity.mjs
node tests/rgav-phase2-independent.mjs
node tests/arctable-continuity.smoke.mjs
node tests/final-skin-evidence.mjs
git diff --check
```

No merge performed (per Stage 7 stop rule).
