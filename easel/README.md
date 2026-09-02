# Arc Easel

Canonical integration workspace for Easel while it is being hardened for inclusion in Arc.

## Branch model

- `main` — Arc canonical baseline; Easel production promotion is never made directly from unreviewed work.
- `easel/develop` — Easel integration and QA branch.
- short-lived `easel/feature-*` branches — deleted after merge.

## Release gates

Easel does not promote until all zero-tolerance gates pass: no data loss, no class/lesson context drift, no clipped or unreachable UI at 200% zoom, complete keyboard access to critical actions, no student-private information on Present, no missing assets, and exact source commit-to-deployment traceability.
