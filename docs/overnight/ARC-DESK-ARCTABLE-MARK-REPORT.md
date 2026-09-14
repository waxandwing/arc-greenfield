# ArcTable desk mark (AT-001) report

Branch: `cursor/arc-production-integration` (feature: `cursor/arctable-mark-desk-4c01`)  
Date: 2026-09-14

## Summary

Desk **ArcTable mark** uses canonical vector asset `public/assets/arctable/AT-001_table-mark.svg` (corner quarter-arcs on cream center, pine outer frame). The live fixture renders **inline SVG** with per-quadrant hit targets — not CSS overlay “fake” quadrants on a PNG.

## Quadrant mapping (verified vs ArcTable Teacher Monitor)

| Mark corner | Color | Desk concept | ArcTable surface |
|-------------|-------|--------------|------------------|
| Top-left | `#2F5E8E` | Start / Live class | Session launch / resume → Teacher Monitor |
| Top-right | `#C44532` | Timer / cleanup | Classroom timer focus (always-visible control) |
| Bottom-left | `#C89B2F` | People / class tools | People picker tool panel |
| Bottom-right | `#1F4B3A` | Media / directions | Media tool panel (directions stay on lesson board) |

## Interaction laws

- **Idle:** full mark intact on wood desk (`arc-desk-arctable-anchor`), shadow only — no card chrome.
- **Hover / focus:** active quadrant path lifts ~1.5px toward its corner + short SVG label.
- **Paid (`VITE_ARCTABLE_DESK_ACCESS=paid-live`):** quadrant activates launch/resume and opens the mapped live tool via session-scoped launch intent.
- **Free (default):** non-live quadrants show preview notice; **Live** quadrant opens **Explore ArcTable** dialog.
- **A11y fallback:** below 88px effective size or `prefers-reduced-motion: reduce` → single button over the full mark (quadrant mode off).

## Assets

- **Authority:** `public/assets/arctable/AT-001_table-mark.svg`
- **Rejected for fixture:** PNG logo icons / CSS quadrant divs (removed from `arc-desk.css`).

## Code touchpoints

- `src/components/ArcTableDeskMarkSvg.tsx`, `ArcTableDeskFixture.tsx`
- `src/planning/arcTableDeskMark.ts`, `arcTableDeskAccess.ts`, `arcTableDeskLaunch.ts`, `arcTableDeskLaunchOptions.ts`
- `src/components/AppFrame.tsx` — `deskArcTableFixture` wiring
- `src/components/ArcTableSurfaces.tsx` — consumes desk launch intent for tool/timer focus
- `src/styles/arc-desk.css` — vector quadrant motion + preview layer

## Verification

- Contract: `src/planning/arcTableDeskAccess.contract.ts` (mapping + a11y gate + launch intent)
- Browser: `node tests/arc-desk-mark.smoke.mjs` → evidence under `docs/overnight/evidence/arc-desk-mark/`

## Out of scope

Merge, deploy, Vercel — not performed.
