# Arc Greenfield

Clean implementation of Arc by Wax & Wing.

## Authority

This repository is the only active implementation path for the Arc greenfield rebuild.

Product authority: **ARC — Canonical Product Spec — Greenfield Rebuild**  
https://docs.google.com/document/d/1SdC1jmvAeXCcrZriYRTnxoKmtQLjsbreBfYQHKlah7s/edit

The previous `waxandwing/arc-instructional-calendar` repository, its branches, ZIPs, previews, and deployments are historical/reference material only. Do not copy them into this repository wholesale.

## Non-negotiable implementation rules

- Build from the canonical product specification, not prior Arc code.
- One responsive application and one canonical domain model.
- One school-calendar service.
- One persistence layer with durable local fallback and authenticated sync.
- Stable IDs for all user-owned planning objects and relationships.
- The rendered UI is a projection of canonical state, never the state store itself.
- No demo/fabricated teacher data.
- No visible placeholder controls.
- No version-number CSS patch layers.
- No automatic production deployment during development.
- Every QA preview must visibly display its build ID and Git commit SHA.
- If the visible build fingerprint and deployed commit do not match, stop testing immediately.

## Delivery order

0. Repository + deployment reset
1. Trustworthy skeleton
2. Core planning loop
3. Flexible planning
4. Trust + real beta
5. Paid/later systems

Production is intentionally separate from this repository until the greenfield beta gates pass.
