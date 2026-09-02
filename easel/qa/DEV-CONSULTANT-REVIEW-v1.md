# Easel simulated consultant review v1

These are structured expert-role simulations for design QA, not interviews with real external consultants.

## Front-end engineer
**Score: 4.5/10**
Strong: single-page app is lightweight, no framework tax, named functions are not duplicated, local-first behavior is easy to reason about.
Risk: recovered base still has 85 duplicate selector names, 17 media-query blocks, 15 !important declarations, large cross-domain state object, and behavior coupled directly to DOM nodes. Recommendation: keep the static architecture but extract state domains and replace cascade patches with mode-owned styles.

## Accessibility specialist
**Score: 5/10**
Strong: visible focus treatment, 44px minimum controls in many places, keyboard shortcuts, focus trapping, reduced-motion support, some non-drag paths.
Risk: 200% zoom failure has already been observed; screen-reader semantics and forced-colors need actual testing; drag-equivalent behavior is inconsistent; projector-sized Present controls can become unreachable at constrained CSS viewports.

## Interaction designer
**Score: 6.5/10**
Strong: persistent directions + live stage + classroom tools is a coherent teaching model. Phase navigation matches classroom pacing.
Risk: Plan/Edit/Present mental models overlap, context help is visually noisy, and private versus projected actions are not yet visually separated enough.

## Ed-tech product designer
**Score: 7/10**
Strong: Easel occupies a useful space between slide-delivery products and widget dashboards. Classroom interruption/recovery, pass state, cleanup, phase pacing, and class context create a meaningful niche.
Risk: do not chase interaction breadth. Win on immediate launch from Arc, persistent class state, and low ceremony.

## Privacy/security reviewer
**Score: 6/10**
Strong: roster/pass data is local-first and Plan is intended to remain teacher-only.
Risk: projection privacy must be a hard invariant, not a styling convention. Class switching, projected names, future Drive integration, and browser persistence require explicit data-boundary tests.

## Classroom technology specialist
**Score: 6/10**
Strong: timer, phase state, cleanup, media, randomizer, pass state, and persistent directions map to real classroom routines.
Risk: projector disconnect, display scaling, browser zoom, touch screens, and mismatched extended-display setups need dedicated recovery tests.
