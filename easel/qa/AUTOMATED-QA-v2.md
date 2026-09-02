# Easel automated UI QA v2 — 2026-09-02

This is automated DOM/layout smoke testing in Chromium using the recovered demo state. It is not a substitute for live-device, assistive-technology, or real-teacher testing.

## Edit / planning shell viewport matrix
The current hardening layer cleared horizontal overflow and kept the first actionable lesson direction above the fold at:
- 1366×768
- 1280×720
- 1440×900
- 1920×1080
- 683×384 CSS viewport, used as a stress proxy for ~200% browser zoom on a 1366px-wide classroom laptop

## Plan / Present mode checks
- Plan uses a deliberately warmer private-workspace surface and remains within the viewport.
- Present hides Plan and does not expose roster content in the smoke DOM.
- Present at 683×384 now compacts the live stage instead of giving it equal vertical weight.
- Latest 683×384 measurement: board 46→332px, live stage 56→136.3px, first direction 204.3→233.3px. No horizontal overflow.

## Still not cleared
- Real browser zoom at 200% on physical classroom hardware
- NVDA/JAWS/VoiceOver/ChromeVox smoke passes
- Touch smartboard interaction
- Full keyboard task circuit
- Live Vercel build generated from the exact Git source commit
- Real external beta testers

## Release decision
Remain PREVIEW ONLY. Automated responsive risk is materially improved, but accessibility and deployment zero-tolerance gates require live clearance.
