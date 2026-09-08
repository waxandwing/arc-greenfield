# Group 4 — Entry / Gate / Access provenance recovery

Base: `develop @ 224e66a6a93447ea1930c5806c47b70e4c866ac1`
Branch: `group4/entry-gate-access`

## Scope

Group 4 owns only the entry opener, beta access, interest surface, optional sync, callback/loading/error/access states, and the server-side beta password gate.

This recovery does not modify `AppFrame`, `B01Furniture`, calendar shell, object grammar, drag/state, persistence, or planner internals.

## Planner seam

The historical static planner bundle and the earlier `api/planner.js` server are intentionally excluded. On deployment, `/core/planner` resolves to the current Vite `/index.html` inherited from current `develop` only when the beta cookie is valid; otherwise it resolves to `/beta`.

The historical planner head `4f9a00ab53e60f0ba9732662e27fde2c93afe106` is not inserted or treated as planner authority.

## Access contract

- Password-first beta access.
- Shared beta password: `icarus` (stored only as a SHA-256 comparison target in shipped server code).
- Google/sync is optional and lives after beta entry.
- Beta cookie is HttpOnly and SameSite=Lax.
- `/beta`, `/interest`, `/sync`, `/auth/callback`, and access/error/loading states remain Group 4 surfaces.

## Media recovery status

The delivered transparent opener media is binary. The current GitHub connector available for this recovery can create UTF-8 repository files but cannot safely upload the delivered WebM/PNG bytes from the local handoff package. The HTML opener has therefore been recovered, but the binary opener assets are not committed in this branch. Do not substitute a historical or approximate media asset. This remains an infrastructure/visual Red until the exact delivered binaries are added through a binary-safe Git path.

Visual acceptance must not be marked Green without rendered evidence.
