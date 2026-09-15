# ArcTable × Icarus × Arc planner merge plan

**Branch:** `cursor/arc-production-integration`  
**Pass date:** 2026-09-15  
**North star:** `docs/overnight/MASTER-DESK-VISUAL-GOAL.md`  
**Queue:** `docs/overnight/AGENT-WORK-QUEUE.md`

## Icarus SHAs reviewed

| Ref | Branch | SHA |
|-----|--------|-----|
| I1 | `main` | `58797b98b4f3210df366dff0192058420878a013` |
| I2 | `arc-table-greenpp` | `82af68af7622d240aebf50ccca7ba9a09783e4e5` |
| I3 | `teaching-mode` | `a09b7dcb5d4d6c6d4732147bafaad25d6754c32b` |

Greenfield ArcTable behavior authority: `docs/overnight/ARC_MULTIPREP_ARCTABLE_REPORT.md`.

---

## Phase 1 — Icarus functional inventory (summary)

### I2 `/table` prototype (`src/table/ArcTable.tsx`)

- **Entry:** `/table` route, no planner coupling.
- **Teacher:** Tools / People / Pass drawers; lesson copy; local timer; flow list; progress bar.
- **Student:** Toggle display; timer + up-next footer (local state only).
- **Persistence:** None. End class is non-functional UI.
- **Spec:** `docs/arctable-asset-manifest.md` (GOLD asset slots, missing canonical families).

### I1 `LiveClassroomOverlay`

- **Entry:** store `ui.liveClassroom` from planner.
- **Outcomes:** complete / stop+note / skip; fail closed on final delivery.
- **No** timer, quadrants, student projection, or plan-while-live.

### I3 Teaching Mode

- **Entry:** `teaching-room.html` + `src/teaching/*`.
- **Flows:** start/resume, hold/advance, room display (privacy-safe projection), passes, disconnect/reconnect, end with confirmation (46/46 functional gate).
- **Not merged** into greenfield ArcTable yet.

---

## Phase 2 — Gap matrix (icarus vs greenfield)

| Capability | Icarus | Greenfield | Gap |
|------------|--------|------------|-----|
| Desk start-class fixture | Visual | `ArcTableDeskFixture` + slices | Visual (queue B/C/F) |
| Quadrant → live/tools | Manifest | `arcTableDeskActions` + launch intent | GREEN w/ `paid-live` |
| Week row → ArcTable | N/A | Slice 1 | Was missing → wired |
| Teacher monitor + plan-while-live | I2 static / I3 machine | Full ArcTable | GREEN (hooks fix for desk) |
| Timer / cleanup / people / passes / media | I2 mock | `arcTableLiveState` v2 | GREEN++ |
| Student surface | I2 toggle | `ArcTableStudentSurface` | GREEN++ |
| Teaching Mode transport | I3 | — | YELLOW (Kelly decision) |
| Explore highlights | Governing spec | Preview dialogs only | YELLOW |
| `/table` route | I2 | — | Reference only |

---

## Phase 3 — Vertical slices (order)

1. **Slice 1 — Start class / fixture → live from Teaching week** (shipped): week focus column + desk mark; `startClass(..., liveDate?)`; AppFrame hooks order fix.
2. **Slice 2 — Plan-while-live on desk home:** Return to ArcTable across Week default + edge tabs.
3. **Slice 3 — Desk quadrants → tools:** paid-live smoke for timer/people/passes/media launch.
4. **Slice 4 — Student / room transport:** optional I3 adapter behind flag.
5. **Slice 5 — Explore / discovery:** use-history highlights (no planning writes).
6. **Slice 6 — Green++ asset reskin:** Drive PNGs from icarus manifest.

---

## Phase 4 — Slice 1 files

| File | Change |
|------|--------|
| `AppFrame.tsx` | `liveDate` on `startClass`; ArcTable returns after all hooks |
| `CalendarProjectionView.tsx` | Pass `onStartClass` into Week strip |
| `PlanningWeekDayView.tsx` | Start class on focus-day tiles |
| `tests/arctable-continuity.smoke.mjs` | Week-row launch gate; desk-safe TRAY click |

---

## Top 5 functions to restore

1. Week-home live launch (slice 1).
2. Desk quadrant launcher → session + tool intent.
3. Plan-while-live with stable Teacher Monitor entry.
4. Student / room projection (local done; I3 transport optional).
5. Explore / discovery affordances on desk entry.

---

## QUESTIONS FOR KELLY

1. Adopt I3 **network Teaching Mode** vs stay **local ArcTable** until backend exists?
2. Should `?demo=1` desk use **`paid-live`** so Start class executes live (not preview)?
3. **Start class** only on **focus day column** vs all week days?
4. Expose hidden **`/table`** in greenfield for asset QA?
5. **NOW/NEXT / hold / blackout** in scope for planner ArcTable v2?
6. Drive path for **`ARC_TABLE_*_GREENPP.png`** assets in icarus manifest?

---

## Verification

```bash
npm run test:contracts
npm run build:bundle
node tests/arctable-continuity.smoke.mjs
```
