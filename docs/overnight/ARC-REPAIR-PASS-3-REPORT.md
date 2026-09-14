# ARC Repair Pass 3 — Capture-first & quiet chrome

Branch: `cursor/arc-production-integration`

## Recommendation

**GREEN FOR NEXT UX REVIEW** — Global Capture, onboarding restoration, bell-schedule proposal path, quiet chrome, and Workspace progressive disclosure are implemented with contract + smoke coverage. Keyboard shortcut deferred (documented below).

## Stop conditions

| ID | Item | Result |
|----|------|--------|
| **A** | Commit SHA | _(see git push output below)_ |
| **B** | Global + Capture on primary planner states | `GlobalCaptureAffordance` on Day/Week/Month/Year/Planning/class depth via shared shell; dialog saves with plan anchor metadata; success “Captured.” closes without opening Workspace |
| **C** | Try Capture banner removed | Permanent `FirstCapturePrompt` removed; one-time `CaptureCoachMark` with `firstCapturePromptDismissed` persistence |
| **D** | Workspace visual burden reduced | Captures-first panel; lessons/units/curriculum in `<details>`; organize/convert/delete on selected capture card |
| **E** | Workspace IA Option A vs B | **Recommendation: Option A** — keep WORKSPACE index tab, subordinate visually (`arc-index-tab--secondary`), Capture-first global path; Option B (remove tab) rejected without product approval |
| **F** | Onboarding flow restored | School year → classes (“what do you teach”) → Build your teaching day (explicit blocks + planning) → land in Day; `onboardingFlowActive` + `resolveOnboardingStage` honor draft until `landed` |
| **G** | Returning users skip setup | Unchanged returning-teacher gate + `repairPass3Setup.contract.ts` |
| **H** | School schedule lookup E2E | `schoolBellScheduleLookup.ts` (NCES id → curated proposal or fallback copy); `TeachingDaySetup` shows source + “Use proposed schedule” confirmation |
| **I** | Canonical logo | `/assets/arc/arc-mark.png` in `PlannerShellBar`; no invert filter |
| **J** | Dark full-width header removed | `.arc-header` hidden; logo + quiet controls inside planner spread |
| **K** | Recovery quieter | Header trigger `Recovery · N` with tertiary styling |
| **L** | Capture persistence metadata | `anchorDate`, `courseId`, `sectionId`, `unitId`, `lessonId`, `sourceView` on `PlanningCapture` |
| **M** | Keyboard shortcut | **Future** — global dialog + coach mark only; no unsafe default chord (document for Settings / power-user pass) |
| **N** | Tests added | `schoolBellScheduleLookup.contract.ts`, `repairPass3Setup.contract.ts`, `tests/repair-pass-3.smoke.mjs`; onboarding smoke updated for global Capture |
| **O** | Contracts | `npm run test:contracts` green |
| **P** | Regression smokes | `test:plan-onboarding-import`, `test:repair-pass-2-1`, `test:repair-pass-3` green |
| **Q** | Evidence | `docs/overnight/evidence/repair-pass-3/` (`00-contact-sheet.png` … `11-returning-user-day.png`) |
| **R** | Scope guardrails | No changes to Now/Needs Attention semantics, Move/Shift/Recovery logic, Month/Year/ArcTable |
| **S** | Deploy / merge | Not performed (per brief) |

## Workspace IA audit (Option A vs B)

| | Option A — Keep WORKSPACE tab, subordinate | Option B — Remove WORKSPACE tab |
|--|--|--|
| Capture path | Global + Capture (primary); Workspace for organize/place | Would force Capture-only or deep links |
| Risk | Tab clutter | Needs explicit approval; breaks muscle memory for organize flows |
| Pass 3 choice | **Ship A** — tab de-emphasized, Capture global | Not implemented |

## Evidence

```bash
npm run build:bundle
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
npm run test:repair-pass-3
python3 scripts/build-repair-pass-3-contact-sheet.py
```

## Files (high signal)

- Capture: `GlobalCaptureAffordance.tsx`, `CaptureCoachMark.tsx`, `captureWorkspace.ts`, `useArcWorkspace.ts`
- Chrome: `PlannerShellBar.tsx`, `repair-pass-3-chrome.css`, `AppFrame.tsx`, `CalendarStageHeader.tsx`, `WorkspacePanel.tsx`
- Onboarding / schedule: `ArcOnboarding.tsx`, `TeachingDaySetup.tsx`, `schoolBellScheduleLookup.ts`
- Tests: `tests/repair-pass-3.smoke.mjs`, `repairPass3Setup.contract.ts`
