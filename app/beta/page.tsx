"use client";

import { FormEvent, useState } from "react";
import styles from "./beta.module.css";

export default function BetaAccessPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password || working) return;
    setWorking(true);
    setError("");

    try {
      const response = await fetch("/api/beta-access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password })
      });
      const payload = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "That beta password did not work.");
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");
      window.location.assign(next && next.startsWith("/") ? next : "/");
    } catch {
      setError("Arc could not verify the beta password. Try again.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.mark} aria-hidden="true"><span /><span /><span /></div>
        <p className={styles.eyebrow}>Arc private beta</p>
        <h1>Come on in.</h1>
        <p className={styles.copy}>This build is still being tested with teachers. Enter the shared beta password to open the planning desk.</p>
        <form onSubmit={submit} className={styles.form}>
          <label>
            <span>Beta password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" autoFocus />
          </label>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button type="submit" disabled={!password || working}>{working ? "Checking…" : "Open Arc"}</button>
        </form>
        <p className={styles.note}>Wax &amp; Wing · Arc</p>
      </section>
    </main>
  );
}
