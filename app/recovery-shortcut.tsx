"use client";

import Link from "next/link";
import styles from "./recovery-shortcut.module.css";

export function RecoveryShortcut() {
  return (
    <Link className={styles.shortcut} href="/recovery" aria-label="Open Recovery Desk">
      <span aria-hidden="true" />
      Recovery
    </Link>
  );
}
