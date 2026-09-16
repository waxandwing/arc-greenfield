# ArcBuild handback — Teaching week visual audit

- **Branch:** main
- **SHA:** `4969108` (visual core `0d72c17`; smoke `243fa46`; handback tip)
- **Pushed:** yes — `origin/main`
- **Audit addressed:** `docs/overnight/ARC-BUILD-VISUAL-AUDIT-VS-TEACHING-WEEK-2026-09-15.md`

## Requirements addressed

| Req | Status | Notes |
|-----|--------|-------|
| Req 1 title/kicker/rainbow | DONE | Three-arch rainbow PNG; kicker above title (`desk-planner-week-kicker`) |
| Req 2 denim TO-DOS | DONE | Always-visible denim folder + side tab; no floating SaaS cards |
| Req 3 IDEAS drawer | DONE | Tray body peeks when collapsed; committed chrome |
| Req 4 week grid 3 courses | DONE | AP / 2D / 3D × Mon–Fri demo seed (day label `MON 7` polish still YELLOW) |
| Req 5 de-modal + edge tabs | DONE | Quieter Search/Today/Enlarge; paper edge tabs; softer frame |
| Req 6 start class / wood | DONE | Hide script detail; lighter furniture shadow |

## Tests

| Command | Result |
|---------|--------|
| test:contracts | PASS |
| test:arc-desk-pass | PASS |
| test:desk-pixel-pass | not re-run this pass (still expect RED >>15%) |

## Remaining for next audit

- **Major blocker (2026-09-16 re-audit):** 22 Kelly **labeled SVG binaries** still absent — drop at `uploads/desk-incoming/` (`LABELED-SVG-CHECKLIST.md`). Do **not** invent wood/tray/tab substitutes.
- Visual grade improved **RED → YELLOW/RED**; title/kicker/rainbow/3-course week above are **historical DONE**, not current fails.
- Wiring order when binaries land: wood → tray → settings/todos tabs → calendar tabs → calendar bg/rainbow/today/start-class/magnets → pixel gate (`public/assets/desk/canonical/README.md`).
- Pixel RGB gate vs authority still open (expect >>15% until labeled art wires)
- Day headers `MON 7` polish — YELLOW
- IDEAS “LINE” stone label — YELLOW
