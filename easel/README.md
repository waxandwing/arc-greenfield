# Arc Easel

Canonical integration workspace for Easel while it is being hardened for inclusion in Arc.

## Branch model

- `main` — Arc canonical baseline; Easel production promotion is never made directly from unreviewed work.
- `easel/develop` — Easel integration and QA branch.
- short-lived `easel/feature-*` branches — deleted after merge.

## Deployment preservation baseline

- Vercel project: `easel`
- Production deployment: `dpl_6dkMW9YTjEaTmQLN4MvBBkRd1FHh`
- Production URL: `easel-8kc4nngjz-arc-e714.vercel.app`
- Production alias includes `easel.waxandwing.com`
- Vercel source type: `drop` — this production build is not Git-linked.

The production drop is preservation evidence. Do not overwrite it during hardening.

## Hardened candidate

`easel-hardening-v1.zip` is the current source candidate. Its `index.html` loads the split runtime layers (`styles/base-1..5.css`, `plan.css`, `present.css`, `accessibility.css`, and `scripts/app-1..7.js`). The ZIP also contains duplicate monolithic `app.js` and `styles/base.css`; they are not loaded and must be pruned from the canonical runtime.

## Release gates

Easel does not promote until all zero-tolerance gates pass: no data loss, no class/lesson context drift, no clipped or unreachable UI at 200% zoom, complete keyboard access to critical actions, no student-private information on Present, no missing assets, and exact source commit-to-deployment traceability.

Release flow: preserve production drop → commit one pruned source tree → deploy preview from exact Git SHA → run QA → explicitly promote only after clearance.
