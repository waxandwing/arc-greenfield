"use client";

import Link from "next/link";
import styles from "./recovery-shortcut.module.css";

export function RecoveryShortcut() {
  return (
    <Link className={styles.shortcut} href="/today" aria-label="Open Recovery Desk">
      <span className={styles.dot} aria-hidden="true" />
      Recovery Desk
    </Link>
  );
}
