# Current implementation status

Active branch: `rebuild/workspace-operations`

This branch is intentionally not merged or deployed.

Implemented foundation:
- full-screen workspace CSS and folder-push layout;
- actual Arc logo path preserved as Home control;
- six planning horizons;
- Fridge object bank;
- Unit tree operation layer;
- Week/Month/Quarter drag and direct Lesson-to-Unit nesting;
- cross-view clipboard;
- MSC lifecycle and plan linking;
- Tack / Extend / Copy-next / week reuse / quarter checkpoint;
- drag Trash + Undo history;
- Year mini-month quarter structure with lapsed-day X asset;
- in-context Magnet Details / Unit Focus;
- filters and landing preferences.

Verification still required:
- TypeScript/typecheck on the exact branch;
- Node behavioral test suite on the exact branch;
- rendered interaction verification;
- ruthless simulated panel after CI result;
- no merge/deploy until those gates are cleared.
