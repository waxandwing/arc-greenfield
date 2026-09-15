# Audit rules extracted from Google Drive (Arc folder)

**Extracted:** 2026-09-15  
**Method:** Google Drive MCP `search_files` + `read_file_content` on Arc Brand Library and Gold Interface folders.

## Drive sources (name → file id)

| Document | Drive id | Applies to desk / slices |
|----------|----------|---------------------------|
| ARC — Ruthless Audit Gates — FOR APPROVAL | `1gjsSsfeKRI5Y52_eti1qTs-XKEnuq1Ql1R3p-_xKpVY` | Pass/fail semantics, accessibility veto, product survival |
| ARC — Product Application Rules — FOR APPROVAL | `1SyjMBgVU5uGBRUilg7knt4RFSHs1tTIVZqqDdz9hlzg` | 80/20, calendar hero, furniture geometry |
| ARC — Brand Library READ ME + Governance | `1qvPYGIqwAMj0vq4BLquhY12qao8-plEtG5190Dw3ahI` | Status colors, do-not-improve, content legibility wins |
| ARC — Brand Approval Index v0.1 | `1iAcDYOt5J_dhpm5pbeny-fQKkTsCpmL-DsQV_ywQ_f4` | Review order; audit before TABLE skin |
| ARC — Desktop Interaction Blueprint — Canonical Handoff | `1r2zvNXj07Qm4sD9aCk19hIpa2SIdksPTkBuaO_Mnv6o` | No left rail, edge furniture, calendar must not squeeze |
| ARC — Ruthless Design Audit — Brand, Naming & Identity System v2 | `11qcGHzuEaigFuBdATrqkbsCXuD3CZ_BstG4e0OQ4ufk` | Brand/naming (TABLE hold); not desk pixel gate |
| Folder: ARC — Gold Interface Audit + Asset Production | `1aRIYA3X1zOS0Tg7j-J9yylI_c50AuudM` | Asset production context |
| Folder: 02 — Architectural + Ruthless Audit | `1EwgNczYutE-R5_JdH2r3tWm5bcNt1pDc` | Listed; no child files visible to agent |

**Repo fallbacks when a rule is product-specific:** `docs/overnight/DESK-PIXEL-REQUIREMENTS.md`, `docs/overnight/DESK-SLICE-PLACEMENT.md`, `docs/overnight/ARC-RUTHLESS-UI-UX-AUDIT.md`.

---

## Status definitions (Drive governance)

- **GREEN** — approved / passes; no unresolved RED.
- **YELLOW** — working, promising, or audit structure pending owner approval; not production-canonical alone.
- **RED** — blocking: failed test, inaccessible core path, identity/accessibility/semantics break.
- **GREEN++** — protected; change requires evidence.
- **HOLD** — intentionally inactive (e.g. TABLE skin until ARC audits GREEN).

**Ruthless gate PASS (Design + Marketing):** no unresolved RED; no critical YELLOW affecting identity, accessibility, teacher comprehension, or product semantics (`1gjsSsfeKRI5Y52_…`).

**Accessibility veto:** any failure of legibility, contrast, reduced motion, keyboard operation, or non-color signaling **blocks GREEN** (Gate 1 test 8).

---

## Gate 1 — Design Ruthless Audit (required tests)

1. Blind recognition (mark without word/color/texture).
2. Progressive deprivation (mono, 32px, 16px, print, projector, Smart Board, dark mode, grayscale, vinyl).
3. Competitive camouflage.
4. Trend subtraction.
5. Semiotic misread.
6. Parent-brand stress (TABLE, LENS, future names).
7. Counterfeit ARC test.
8. **Accessibility veto** (above).
9. **Product survival:** dense calendar, long names, furniture open states, month/quarter reductions, hostile outputs.

**Scoring:** each item gets **QUALITY** + **NECESSITY**. Document: Problem → Evidence → Severity → Recommendation → Do Not Lose.

**Do not improve without evidence:** open C, breathing room, teacher authority, **calendar-first center**, adult material quality, concrete classroom voice.

---

## Product Application Rules (desk-relevant)

- **Center of gravity:** planner/calendar is product center; brand must not compete with plans.
- **80/20:** ~80% structure (hierarchy, spacing, object semantics, legibility, interaction, recovery); ~20% expression (texture, editorial type, color, print cues).
- **Calendar:** hero surface; current day visible; objects distinguishable by form before color; month/quarter remain useful (not decorative chips).
- **Furniture:** Settings left, Fridge right, Task bar bottom; **central calendar does not resize or squeeze when furniture opens**.
- **Do not:** dashboard cards; decorative geometry on every panel; chrome that reduces calendar area; color-only state signals.

---

## Desktop Interaction Blueprint (founder-locked)

- **No left rail**; no permanent full-height sidebar.
- Utilities enter as **tabs/drawers on outer edge** of planner; furniture slides from **outer edge**.
- Furniture **does not overlay** the calendar; **does not squeeze/scale/reflow** canonical calendar geometry.
- Calendar-first; warm paper / editorial hierarchy; no generic SaaS shell.
- Canonical views: Day, Week, Month, Year Map — lenses over one state.
- Settings drawer on left outer edge is not a rail; opening must not alter calendar geometry.

---

## Brand Library governance

- Do not redesign product behavior to serve branding; **content legibility, accessibility, classroom usability, object semantics win every tie**.
- Ruthless tests required beyond ideal mockups (reduction, grayscale, poor print, accessibility, etc.).
- TABLE skin **held** until ARC parent approval and ruthless audits GREEN.

---

## Checklist mapped to this pass (Desk / Plan shell / slices / enlarge)

| Rule (quoted intent) | Audit hook |
|----------------------|------------|
| Calendar-first center | Shell smoke + ruthless audit § calendar dominance |
| Furniture must not squeeze calendar | TRAY/settings open smokes; enlarge uses portal, inline placeholder only |
| Edge-attached planner tabs (DAY/WEEK/MONTH/YEAR) | `arc-planner-physical-tabs--desk-edge` + slice rasters |
| Accessibility veto (keyboard, focus) | Enlarge dialog: Escape, focus trap, return focus to trigger |
| Product survival (dense calendar / view switch) | Pop-out body renders live `calendarWorkspaceStage`; tab switching in dialog |
| 80/20 — structure over poster branding | Slices decorative/interactive-chrome; live grid remains DOM |
| No dashboard-card planner | Existing desk composition smoke |
| Pixel fidelity vs Kelly comp | `DESK-PIXEL-REQUIREMENTS.md` honest ~60% diff — **not** Drive GREEN for pixel |
