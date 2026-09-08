# Arc preview deployment external settings

These settings are intentionally outside source control. They are required before PR #101 can produce a trustworthy preview.

## Vercel project

Project: `arc-greenfield-preview`

Repository: `waxandwing/arc-greenfield`

### Build & Development Settings

- Framework Preset: **Vite**
- Root Directory: **repository root** (the directory that directly contains `package.json`; do not point at a parent workspace or nested folder)
- Build Command: source-controlled `npm run build`
- Output Directory: source-controlled `dist`
- Git automatic deployment remains disabled while this is an audited preview candidate.

The old failure `ENOENT /vercel/path1/package.json` is not acceptable evidence. The first trusted preview build must show dependency install/build executing in the actual repository root.

### Preview environment variables only

Add to the **Preview** environment (not Production for this stage):

- `SUPABASE_URL` = API URL of the existing Supabase project `arc`
- `SUPABASE_PUBLISHABLE_KEY` = active modern publishable key of that same project
- `ARC_BETA_COOKIE_SECRET` = a server-only unpredictable secret of at least 32 characters used only to sign the beta-access cookie

`ARC_BETA_COOKIE_SECRET` is mandatory. If it is missing or too short, `/api/beta-access` must fail closed and must not issue or validate beta-access cookies.

Do not add a Supabase `service_role`/secret key to the Vite client or runtime config endpoint. Do not expose `ARC_BETA_COOKIE_SECRET` through `/api/runtime-config`, Vite environment variables, or client bundles.

## Supabase Auth

Existing project: `arc`

Google identities already exist in this project, confirming the Google provider has been used. Before live preview auth testing, Supabase Auth URL configuration must allow the exact Vercel preview origin callback:

`https://<preview-host>/auth/callback`

Keep the eventual production Arc domain separate until preview is Green.

## Preview release rule

This configuration authorizes only a Vercel Preview deployment after the founder explicitly requests one. It does not authorize automatic Git deployment, production target deployment, domain promotion, or merging PR #100.
