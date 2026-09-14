# assets910 candidate library (cloud ingest)

**Not production.** This folder is the agreed Cloud Agent ingest path for the Wax & Wing **assets910** candidate library. Files here are used for **audit and reconciliation only** until Kelly approves the production shortlist.

## How to populate (option 3 — environment snapshot)

1. On a machine that has `ARC ASSETS 910.zip` or `/Users/knyhagen/assets910`, extract the **full library** into this directory so paths look like:

   ```
   .local/assets910/
   README.md
   AUDIT_STATUS.txt          (if present in archive)
   PLACEMENT.md
   GOLD-AUDIT.md
   … production PNG/SVG/fonts …
   ```

2. Do **not** copy into `public/assets/` until the updated `docs/overnight/ASSET-RECONCILIATION-REPORT.md` shortlist is approved.

3. Save a **Cloud Agent environment snapshot** from a session where this folder is populated (Portal → Environment → snapshot). New agents on that environment should see `.local/assets910/` without re-uploading the zip each run.

4. Start a follow-up agent on `cursor/arc-production-integration` with: **“Continue asset reconciliation — assets910 is in `.local/assets910/`.”**

## Verification

From repo root:

```bash
test -d .local/assets910 && find .local/assets910 -type f ! -name README.md | wc -l
```

Prior multiprep audit referenced on the order of **317 production rasters** plus manifests/fonts in the archive subset — use manifest files as sanity checks, not as the only gate.

## Git

Binary contents under `.local/assets910/` are **gitignored**. Only this README is tracked.
