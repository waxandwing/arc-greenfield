"use client";

import { useRef, useState } from "react";
import type { Workspace } from "../lib/domain";
import { decodeWorkspace } from "../lib/workspace-store";

type Props = {
  recoveryRaw: string;
  onRestore: (workspace: Workspace) => void;
  onStartFresh: () => void;
};

function downloadRecovery(raw: string) {
  const blob = new Blob([raw], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `arc-workspace-recovery-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function WorkspaceRecoveryScreen({ recoveryRaw, onRestore, onStartFresh }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmFresh, setConfirmFresh] = useState(false);

  async function inspectRepairFile(file: File | undefined) {
    if (!file) return;
    try {
      const raw = await file.text();
      const result = decodeWorkspace(raw);
      if (result.status !== "loaded") {
        setMessage("That file still is not safe for Arc to open. Nothing was replaced.");
        return;
      }
      setMessage(null);
      onRestore(result.workspace);
    } catch {
      setMessage("Arc could not read that repair file. Nothing was replaced.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <main className="workspaceRecoveryShell">
      <section className="workspaceRecoveryPaper" aria-labelledby="workspace-recovery-title">
        <p className="eyebrow">Recovery</p>
        <h1 id="workspace-recovery-title">Arc found saved work it cannot safely open.</h1>
        <p className="workspaceRecoveryLead">
          Your original saved data is still here. Arc moved a copy into recovery instead of replacing it with an empty planner.
        </p>

        <div className="workspaceRecoveryRule" />

        <div className="workspaceRecoveryActions">
          <button type="button" className="recoveryPrimary" onClick={() => downloadRecovery(recoveryRaw)}>
            Export recovery copy
          </button>
          <button type="button" onClick={() => inputRef.current?.click()}>
            Open a repaired copy…
          </button>
          <input
            ref={inputRef}
            className="srOnly"
            type="file"
            accept="application/json,.json"
            onChange={(event) => void inspectRepairFile(event.target.files?.[0])}
          />
        </div>

        <p className="workspaceRecoveryNote">
          Export first if you want an outside backup. Opening a repaired copy never deletes the quarantined original.
        </p>

        {message && <p className="workspaceRecoveryMessage" role="alert">{message}</p>}

        <div className="workspaceRecoveryFresh">
          {!confirmFresh ? (
            <button type="button" className="quietRecoveryAction" onClick={() => setConfirmFresh(true)}>
              Start with a blank planner instead
            </button>
          ) : (
            <div className="workspaceRecoveryConfirm" role="group" aria-label="Confirm starting fresh">
              <p>This creates a new active workspace. The recovery copy will still be kept.</p>
              <button type="button" onClick={onStartFresh}>Start fresh</button>
              <button type="button" className="quietRecoveryAction" onClick={() => setConfirmFresh(false)}>Keep recovery screen</button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
