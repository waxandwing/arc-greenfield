"use client";

import type { ArcColorScheme } from "../lib/domain";
import { ARC_COLOR_SCHEMES } from "../lib/arc-color-schemes";
import styles from "./arc-color-scheme-picker.module.css";

export function ArcColorSchemeControl({ selected, onChange }: { selected: ArcColorScheme; onChange: (id: ArcColorScheme) => void }) {
  return (
    <section aria-label="Color scheme" className={styles.panel}>
      <div>
        <strong className={styles.heading}>Color scheme</strong>
        <span className={styles.note}>Built from the Arc asset palette.</span>
      </div>
      <div role="radiogroup" aria-label="Arc color scheme" className={styles.choices}>
        {ARC_COLOR_SCHEMES.map((scheme) => (
          <button key={scheme.id} type="button" role="radio" aria-checked={selected === scheme.id} onClick={() => onChange(scheme.id)} className={styles.choice}>
            <span>
              <b>{scheme.label}</b>
              <small>{scheme.description}</small>
            </span>
            <span aria-hidden="true" className={styles.swatches}>
              {[scheme.deep, scheme.blue, scheme.gold, scheme.yellow, scheme.coral].map((color) => <i key={color} className={styles.swatch} style={{ background: color }} />)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
