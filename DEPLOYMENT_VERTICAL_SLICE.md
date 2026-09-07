# Arc beta deployment vertical slice

Functional baseline: `develop @ 224e66a6a93447ea1930c5806c47b70e4c866ac1`

Visual-authority work: PR #100 remains separate and must not be merged into this deployment candidate until B01/B05/B06 furniture checks are Green.

## Architecture contract

Arc remains a Vite planner. This branch does not rebuild Arc in Next.js and does not rewrite the protected planner model for deployment.

Target chain:

`/` title → `/interest` or `/beta` → Google auth → `/auth/callback` → server beta allowlist → `/core` → protected Arc planner → authenticated `arc_workspaces` save/reload

## Implemented on this branch

- Thin route shell around the existing planner; planner mounts at `/core` only after beta access + cloud restore.
- Localhost-only `/` planner compatibility so the frozen B01–B07 regression suite can still exercise the protected core without weakening the deployed gate.
- Google OAuth entry/callback handling and refresh-token recovery.
- Server `/api/beta-gate` endpoint that validates the Supabase user and performs an RLS-scoped allowlist lookup.
- `beta_allowlist_select_self` RLS policy: an authenticated user can read only the row whose email matches their signed-in JWT email.
- Existing `arc_workspaces` ownership RLS retained; no service-role key is exposed to the browser.
- Cloud bridge hydrates the existing Arc browser-storage contract before mounting the planner and mirrors Arc-owned storage keys back into that user’s workspace row.
- Visible cloud-save status; persistence failure is not silent.
- `/interest` writes to the existing RLS-protected `arc_interest_signups` table.
- Vercel SPA rewrites for `/interest`, `/beta`, `/auth/callback`, and `/core` while preserving the strict `npm run build` gate and preview-only/manual Git deployment setting.
- Canonical deployment asset contract documented in `docs/DEPLOYMENT_ASSET_MAP.md`.

## Green requirements before preview is trusted

- Full frozen CI matrix completes Green on the exact candidate head.
- Vercel project Root Directory is repository root (the directory containing `package.json`).
- Preview environment contains `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` from the existing `arc` Supabase project.
- Supabase Google redirect allowlist accepts the exact preview callback URL `/auth/callback`.
- Canonical 900×900 VP9-alpha title WebM and transparent poster are present at the controlled runtime paths; no opaque MP4 substitute.
- Preview proves title/interest/beta/auth/core paths, same-account save→reload, and account A ≠ account B.
- Desktop 1440/1280, small laptop, 390×844 touch, high zoom, keyboard, screen-reader, furniture, Task Bar, Fridge, Undo, and planner interaction gates pass.

## Hard boundaries

- No `main`.
- No PR #100 merge while its furniture gate is Red.
- No production Vercel target.
- No `arc.waxandwing.com` promotion until the deployment gate is Green.
