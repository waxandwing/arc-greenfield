# Stage 7.2.1 — Shell emphasis pass

**Branch:** `cursor/arc-production-integration`  
**Base:** `f851177`  
**Scope:** Visual emphasis only — hierarchy, shell dominance, Week/Month de-carding, index tabs, branded exterior. No planning-law, navigation-logic, or ArcTable surface changes.

---

## Recommendation

**GREEN FOR FINAL VISUAL JURY** (pending Kelly thumbnail review of `00-contact-sheet.png`)

Engineering baseline green after emphasis pass. Residual YELLOW: dense Month at 400% human pass; Task bar moved to Settings (intentional per brief).

---

## Stop report (A–O)

| Item | Detail |
|------|--------|
| **A. Commit** | Set at push time after this commit |
| **B. Files** | `src/styles/shell-emphasis.css`, `tokens.css`, `main.tsx`, `B01Furniture.tsx`, `SettingsFurnitureContent.tsx`, `AppFrame.tsx`, tests, evidence |
| **C. React markup** | Yes — removed TASKS index tab; added Settings “Task bar” entry; controlled `tasksOpen` on B01 |
| **D. Shell** | Stronger frame inset/border, planner drop shadow, exterior wash + large-scale breezeblock (multiply), cream interior separation |
| **E. Background** | Real `/assets/arctable/breezeblock-tile.png` outside planner; radial brand tints; quiet interior |
| **F. Tabs** | Index strip attached to shell (green rail, cream active tab, mustard inset); TASKS removed from permanent index |
| **G. Courses** | Stronger AP/2D/3D bands + Week row territories (left edge + gradient) |
| **H. Week** | De-carded lessons, transparent cells, territory unit bands, course rows as bands not grid cards |
| **I. Month** | Quieter signal boxes (transparent), softer day cells |
| **J. Workspace** | Shell-native drawer styling; planner object retained when overlay open |
| **K. ArcTable** | Unchanged; `arctable-continuity.smoke.mjs` PASS |
| **L. Tests** | `npm run build`, all plan smokes, browser-a11y, B01, ArcTable — PASS |
| **M. Evidence** | `docs/overnight/evidence/stage7-2-1-shell-emphasis/` (`00`–`13`) |
| **N. YELLOWs** | Month density at extreme zoom; optional future course-specific Class left-edge via `data-course-id` on Day |
| **O.** | **GREEN FOR FINAL VISUAL JURY** |

Capture: `node tests/stage7-2-1-shell-emphasis-evidence.mjs` (preview on `:4173`).
