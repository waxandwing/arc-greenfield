# Arc deployment asset map

Status: deployment gate evidence for PR #101. This file does not approve substitute assets.

## Entry/title media

Canonical source evidence from the 2026-09-07 Arc entry UI audit requires:

| Runtime path | Required asset | Status |
| --- | --- | --- |
| `/assets/arc-entry-alpha.webm` | Founder-approved 900×900 VP9-alpha WebM; transparent pixels preserved; light paper notes opaque; final Arc logo bounds preserved | **BLOCKED — canonical binary not present in the current GitHub branch, ChatGPT Library search, or connected Drive search** |
| `/assets/arc-entry-poster.png` | Transparent static poster/final-mark fallback paired with the canonical alpha video | **BLOCKED — canonical binary not positively identified** |

Do not use `Arc_Making_It_Make_Sense_Motion.mp4`, `Arc_Making_It_Make_Sense_Motion_v7.mp4`, or another H.264/opaque export as a fallback. The audited title package specifically excludes the opaque H.264 path because it reintroduces a baked paper background.

The title React shell may reference the canonical runtime paths before the binaries arrive so the asset contract is stable, but title-media QA is Red until both canonical assets are present and decoded/rendered successfully.

## Planner/interface assets

The planner mounted at `/core` is the protected `develop @ 224e66a6a93447ea1930c5806c47b70e4c866ac1` functional baseline. Deployment work must not recreate or replace furniture/interface art merely to satisfy hosting.

PR #100 remains the separate founder-visual-authority branch. Any founder-approved Settings, Fridge/Drawer, Task Bar, logo, notebook, paper, magnet, sticky, tape, or furniture asset reconciled from #100 must retain its approved source asset. Substitute CSS/vector redraws are not considered equivalent without founder approval.

## Asset deployment gate

Before preview is considered visually deployable:

1. Canonical VP9-alpha WebM exists at the controlled runtime path.
2. Canonical transparent poster exists at the controlled runtime path.
3. Both return HTTP 200 in the preview deployment.
4. WebM alpha is verified in rendered desktop and 390×844 paths.
5. Reduced-motion and autoplay-failure states reveal a usable static title state.
6. No runtime request points to stale production domains, archived builds, or duplicate asset paths.
7. PR #100 introduces no substitute/recreated furniture where an approved asset exists.
