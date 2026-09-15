# Arc desk labeled asset authority

Source: Kelly-labeled SVG handoff, 2026-09-15.

These assets are staged for visual reconciliation. They do **not** automatically supersede currently wired production assets until the component mapping is verified. Filenames containing `(USE)` in the source handoff are the strongest source-of-truth signal.

## Canonical map

| Canonical file | Original labeled source | Intended role | Authority |
|---|---|---|---|
| `arc-upper-left-logo.svg` | `Art upper left logo.svg` | Arc mark on wood / upper-left desk | canonical candidate |
| `arctable-mark.svg` | `arctable vector icon.svg` | generic ArcTable identity | canonical candidate |
| `start-class-mark.svg` | `start class arctable logo.svg` | Start Class desk control | canonical |
| `magnet-blue.svg` | `blue icon magnet.svg` | blue physical magnet | canonical |
| `magnet-green.svg` | `green icon magnet.svg` | green physical magnet | canonical |
| `magnet-mustard.svg` | `magnet vector yellow.svg` | mustard physical magnet | canonical |
| `magnet-terracotta.svg` | `red icon magnet.svg` | terracotta/red physical magnet | canonical |
| `postit-blue.svg` | `Blue post it.svg` | blue Post-it object | canonical candidate |
| `postit-stack.svg` | `Post it stack.svg` | stacked paper/Post-it object | canonical candidate |
| `calendar-background.svg` | `calendar background.svg` | planner/calendar physical background | canonical candidate |
| `calendar-tab-selected.svg` | `calendar selected tab view.svg` | selected planner-view tab body | canonical |
| `calendar-tab-unselected.svg` | `unselected calendar states.svg` | inactive planner-view tab body | canonical |
| `calendar-class-selected-marker.svg` | `selected class calendar icon vector.svg` | class-focus selection marker | canonical |
| `calendar-date-rainbow.svg` | `to left of date on calendar rainbow icon.svg` | accent left of calendar date | canonical |
| `today-button.svg` | `today button.svg` | Today physical control | canonical |
| `today-highlight.svg` | `today highlighter icon.svg` | Today marker/highlighter | canonical |
| `settings-tab.svg` | `Settings tab (USE).svg` | SETTINGS physical tab | **USE / canonical** |
| `todos-tab.svg` | `TODO tab (use).svg` | TO-DOS physical tab | **USE / canonical** |
| `todos-tab-alt.svg` | `TODOS tab.svg` | alternate/legacy TO-DOS reference | reference only |
| `ideas-tray.svg` | `tray image (use).svg` | IDEAS tray/drawer | **USE / canonical** |
| `ideas-tray-vector-alt.svg` | `Ideas Tray Vector.svg` | simplified/alternate tray | reference only |
| `wood-background-light.svg` | `Wood Background Light.svg` | light wood desk surface | canonical candidate |

## Implementation rules

1. Do not mark an asset reconciled merely because its file loads.
2. Verify role, scale, crop, aspect ratio, edge behavior, layering, lighting and placement against the approved desk reference.
3. Prefer labeled source assets over screenshot-derived crop PNGs when they describe the complete object.
4. Never use `object-fit: fill` on tactile source art unless a specifically documented scalable interior region exists.
5. Some SVG files contain embedded raster texture. Do not aggressively optimize, trace, or re-vectorize them without visual comparison.
6. `calendar-tab-selected.svg` and `calendar-tab-unselected.svg` are state bodies; DAY/WEEK/MONTH/YEAR should remain live accessible labels unless later authority proves otherwise.
7. `calendar-class-selected-marker.svg` is not interchangeable with the general selected calendar-view tab.
8. `start-class-mark.svg` is distinct from the generic ArcTable mark.
9. `ideas-tray.svg`, `settings-tab.svg`, and `todos-tab.svg` came from explicitly labeled `(USE)` files and should lead their respective reconciliations.
10. Keep current production assets intact until visual reconciliation and smoke tests are complete.
