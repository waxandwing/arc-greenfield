# Arc beta deployment vertical slice

Functional baseline: `develop @ 224e66a6a93447ea1930c5806c47b70e4c866ac1`.

Do not merge PR #100 into this branch until its furniture checks are Green.

## Target flow

`/` title page → Interest / Beta → Google auth → server beta allowlist → `/core` planner → Supabase persistence.

## Non-negotiables

- Keep the current Vite planner model and mount it at `/core`; do not rebuild Arc in Next.js.
- Keep `main` out of the deployment path.
- Use founder-approved animation/media and interface assets only; do not substitute recreated furniture.
- Preserve strict build/test gates.
- Preview deployment only until the full deployment gate is Green.
- Auth must use existing Supabase project and server-side beta authorization.
- Persistence must use user-owned `arc_workspaces` rows with RLS and account isolation.
- Prove save → reload → same account and account A ≠ account B.
- Structural Reds go to the Bug Fix Log.

## Deployment gate

Desktop 1440 + 1280, small laptop, 390×844 touch, high zoom, keyboard-only, screen reader, title animation/alpha behavior, gate/auth, persistence, furniture open/close, object interactions, Undo, Task Bar, Fridge, and cross-account isolation.
