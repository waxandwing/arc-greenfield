# Arc Frontend Gold Master — v23.3 Interface × Greenfield Brain

Status: **fixture-rendering / visual QA only**
Branch: `chatgpt/frontend-gold-master-23x`

## Purpose

This branch is the visual/frontend convergence pass. The interface authority is the recovered v23.3 planner composition; the behavior/data authority remains Greenfield. The goal is not to remove capability. It is to stop making teachers carry the visual weight of the capability.

## Hard gate

No new backend/service wiring should begin until every Gold Master surface renders from fixture data and passes visual, usability, accessibility, and parity review.

## QA entry

Use the `gold` query parameter:

- `?gold=week`
- `?gold=day`
- `?gold=month`
- `?gold=quarter`
- `?gold=year`
- `?gold=unit`
- `?gold=ideas`
- `?gold=connections`
- `?gold=arctable`
- `?gold=pocket`
- `?gold=settings`
- `?gold=onboarding`
- `?gold=trust`

The Gold Master route bypasses onboarding intentionally and uses fixture data only. It does not mutate Greenfield planning state.

## Visual authority

- Calendar first. Week remains the default reference surface.
- Monday-first school week.
- Coral, mustard, sky blue, cream, charcoal. Green is supporting only.
- Arc uses the Arc identity. ArcTable identity appears only when entering live teaching.
- Tactility comes from paper, texture, typography, thin rules, subtle shadow, and occasional pattern. No decorative furniture dependency.
- No floral ornament.
- No generic SaaS card dashboard.
- Avoid excessive pills/rounded rectangles.
- Lesson title > class/section > unit > time.
- Side tools never steal calendar width without a clear teacher benefit.

## Greenfield parity that must survive

| Capability | Gold Master surface | Wiring status |
| --- | --- | --- |
| Course → Section → Unit → Lesson | Week / Unit | Existing backend, not wired to fixture UI |
| Section-specific divergence | Day / Week continuity state | Existing backend, pending frontend binding |
| Protected taught history | Day / Week | Existing backend, pending frontend binding |
| Fixed-date protection | Week / Shift preview | Existing backend, pending frontend binding |
| Shift consequence preview | Shift | Existing backend, pending frontend binding |
| Undo protections | Trust / Shift result | Existing backend, pending frontend binding |
| Quick capture | Ideas / Pocket | Existing backend, pending frontend binding |
| Ideas persistence | Ideas | Existing backend, pending frontend binding |
| Must / Should / Could | Week / Ideas | Existing backend, pending frontend binding |
| Import + reuse | Connections / Settings | Existing backend, pending frontend binding |
| School calendar intelligence | Month / Quarter / Year | Existing backend, pending frontend binding |
| ArcTable continuity | ArcTable | Existing backend, pending frontend binding |
| Pocket state continuity | Pocket | Surface rendered; integration pending |
| Local/offline resilience | Trust states | Existing backend, pending new UI messages |
| Keyboard / non-drag alternatives | All | Must remain a release requirement |

## Frontend QA order

1. Week legibility
2. Selected lesson + inline create
3. Shift consequence preview
4. Day teaching companion
5. Ideas + To-Do
6. Month
7. Quarter
8. Year
9. Unit focus
10. Connections
11. ArcTable
12. Pocket
13. Settings
14. Onboarding
15. Trust / empty / error states
16. Small laptop
17. Tablet
18. Mobile

## Smoke test

`npm run test:gold-master`

The test renders every fixture route, captures evidence screenshots under `docs/overnight/evidence/gold-master/`, verifies Week essentials, verifies ArcTable live identity, verifies Pocket capture, and fails on runtime console/page errors.

## Integration rule

When Greenfield behavior is connected, do not reproduce the old Greenfield visual structure simply because a backend concept exists. Bind behavior into the approved Gold Master surface. If a capability needs explanation before it can be used, first attempt contextual disclosure rather than adding permanent navigation or another panel.

## Approval question

For every new control or visible state:

> Does this help a teacher understand or act faster, or is it merely exposing how the software works?

If it is the latter, the frontend is not finished.
