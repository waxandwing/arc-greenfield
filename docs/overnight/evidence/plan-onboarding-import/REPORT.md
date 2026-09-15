# Plan onboarding + import composition evidence

Date: 2026-09-14

Branch: `cursor/arc-production-integration`

## Composition

Onboarding and curriculum import now render inside the shared Arc Plan shell (`arc-shell`, `arc-header`, `CalendarStageHeader`, `calendar-canvas`) instead of the former isolated `onboarding-shell`.

Governed onboarding components (`ArcOnboarding`, `CalendarSetup`, `ClassSetup`, `TeachingDaySetup`) and the shared `CurriculumImport` pipeline are unchanged; only navigation chrome and spacing were recomposed.

## Screenshots

| File | Flow |
|---|---|
| `01-welcome.png` | Welcome in Plan shell |
| `02-school-year.png` | School year step |
| `03-courses-sections.png` | Shared Course + repeated Sections |
| `04-build-my-day.png` | Explicit Planning block |
| `05-bell-time-ambiguity.png` | Optional bell-time ambiguity |
| `06-first-day.png` | Teaching Day landing + v2 spine |
| `07-first-capture.png` | First Capture teaching moment |
| `08-import-source.png` | Settings import source |
| `09-parse-result.png` | Parse preview (no canonical write) |
| `10-ambiguity-review.png` | Ambiguity hold |
| `11-proposed-structure.png` | Proposal review |
| `12-return-to-arc.png` | Confirmed import → Return to Day |

Where pixel flows match the prior isolated-shell proof, identical PNGs from `docs/overnight/evidence/import-onboarding/` are copied into this folder by the smoke gate (see test harness).

## Verification

- `npm run test:plan-onboarding-import`
- `npm run test:import-onboarding` (regression on shared import/onboarding behavior)
