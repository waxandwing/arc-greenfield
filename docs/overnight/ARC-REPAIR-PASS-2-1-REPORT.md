# ARC Repair Pass 2.1 — Product semantics lock

Branch: `cursor/arc-production-integration`

## Summary

Locked Planning Period **Now** to post–Period 5 actionable prep (not “all of today”), deduped shared canonical lessons, routed stopped lessons on today’s schedule to **Needs attention**, and made the **DAY** planner index retreat to Teaching Day on the same anchor date from Class, Lesson, and Planning depth.

## Stop condition

| Item | Result |
|------|--------|
| **A. commit SHA** | `07cec30` |
| **B. files changed** | `src/planning/planningPeriodAttention.ts`, `src/planning/planContextResolution.ts` (prior), `src/planning/*.contract.ts`, `src/components/AppFrame.tsx` (prior), `tests/helpers/selectPlanView.mjs`, `tests/repair-pass-2-1.smoke.mjs`, `tests/plan-navigation.smoke.mjs`, other smoke imports, `package.json`, this report |
| **C. old Now behavior** | Every lesson scheduled today across all sections appeared in Now (“all of today”). |
| **D. new Now behavior** | Only upcoming teaching blocks after canonical Planning time (legacy Period 5 pivot); excludes completed/skipped/in-progress stopped prep; orders by next period; shared canonical lesson → one row. |
| **E. dedupe rule** | Group by `lessonId` + `unitId`; lead section = earliest upcoming period; reason lists all shared sections. |
| **F. ordering rule** | Sort Now by teaching-day rail period order, then course/section/lesson tie-breakers. |
| **G. Needs Attention boundary** | Stopped lessons (including when listed on today’s schedule), section-behind, next-planned unchanged; no manufactured urgency. |
| **H. tests added** | `planningPeriodNow.contract.ts` (A–G), extended `planningPeriodAttention.contract.ts`, `planContextResolution.contract.ts` (DAY from class/planning), `tests/repair-pass-2-1.smoke.mjs` |
| **I. Day tab behavior** | `enterPlanView(..., 'Day')` → `goPlanHome` same `anchorDate`, clears class/lesson/planning depth |
| **J. redundant return controls removed** | No “Return to Teaching Day” button in UI; wordmark `Teaching Day home`; smokes use DAY tab |
| **K. Workspace exact-return** | Close Workspace returns underlying focus; DAY tab explicitly retreats (smoke + plan-navigation) |
| **L. evidence path** | `docs/overnight/evidence/repair-pass-2-1/` |
| **M. remaining ambiguity** | Explicit `teachingDay.blocks` planning pivot uses first planning block, not Period 5 number—acceptable when schools configure explicit rails |
| **N. recommendation** | **GREEN FOR NEXT RUTHLESS UX REVIEW** |

## Evidence

Run: `npm run build:bundle && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort` then `npm run test:repair-pass-2-1`.

Files: `00-contact-sheet.png` … `08-workspace-exact-return.png`.
