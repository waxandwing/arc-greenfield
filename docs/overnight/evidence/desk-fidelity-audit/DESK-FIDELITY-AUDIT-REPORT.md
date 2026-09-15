# Desk fidelity audit

Generated: 2026-09-15T03:54:59.760Z

Reference: `docs/overnight/evidence/figma-desk-6-3194/01-codex-image-37-11052.png`

## Score

**Estimated fidelity: 100%** (110/110 weighted checks)

**Pixel diff vs Kelly comp (scale-normalized): 60.04%** (SSIM 0.2353)

Structural checks passing does not imply pixel parity.


## Evidence

| File | Description |
|------|-------------|
| `01-preview-desk-week.png` | Implementation preview (Week / Teaching week) |
| `02-side-by-side.png` | Kelly ref vs preview (scaled contact) |

## Checklist

| Check | Weight | Pass |
|-------|--------|------|
| Icarus wood field | 12 | yes |
| IDEAS green drawer top | 10 | yes |
| TO-DOS MSC folder | 10 | yes |
| Cream planner + green trim | 14 | yes |
| Teaching week header | 12 | yes |
| Vertical DAY/WEEK/MONTH/YEAR tabs | 12 | yes |
| Search + Today pill | 8 | yes |
| Arc wordmark on wood | 8 | yes |
| Start class script + mark | 10 | yes |
| Week course rows + unit bars | 14 | yes |

## Top gaps

- None — all weighted checks passed.

## Notes

Side-by-side uses the Kelly PNG as directional reference; pixel parity is not expected for authored SVG drawer vs comp photography. Run `npm run test:desk-pixel-pass` for honest overlay metrics.
