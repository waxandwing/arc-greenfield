"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ArcColorScheme } from "../lib/domain";
import { ARC_COLOR_SCHEMES, arcColorScheme } from "../lib/arc-color-schemes";
import { loadWorkspace, saveWorkspace } from "../lib/workspace-store";

function applyScheme(id: ArcColorScheme) {
  const scheme = arcColorScheme(id);
  const root = document.querySelector<HTMLElement>(".arcWorkspace");
  if (!root) return false;

  root.dataset.colorScheme = scheme.id;
  root.style.setProperty("--arc-paper", scheme.paper);
  root.style.setProperty("--arc-deep", scheme.deep);
  root.style.setProperty("--arc-teal", scheme.blue);
  root.style.setProperty("--arc-blue", scheme.blue);
  root.style.setProperty("--arc-gold", scheme.gold);
  root.style.setProperty("--arc-yellow", scheme.yellow);
  root.style.setProperty("--arc-orange", scheme.orange);
  root.style.setProperty("--arc-coral", scheme.coral);
  scheme.quarters.forEach((color, index) => root.style.setProperty(`--arc-q${index + 1}`, color));
  return true;
}

function findMorePreferencesMount(): HTMLElement | null {
  const folders = [...document.querySelectorAll<HTMLElement>(".arcFolderInner")];
  const more = folders.find((folder) => folder.querySelector(".arcFolderHead h2")?.textContent?.trim() === "More");
  return more?.querySelector<HTMLElement>(".arcFolderScroll") ?? null;
}

export function ArcColorSchemePicker() {
  const [selected, setSelected] = useState<ArcColorScheme>("studio");
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const workspace = loadWorkspace();
    const next = workspace.preferences.colorScheme ?? "studio";
    setSelected(next);

    const sync = () => {
      applyScheme(next);
      setMountNode(findMorePreferencesMount());
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  function choose(id: ArcColorScheme) {
    setSelected(id);
    applyScheme(id);
    const workspace = loadWorkspace();
    saveWorkspace({
      ...workspace,
      preferences: { ...workspace.preferences, colorScheme: id },
      updatedAt: new Date().toISOString()
    });
  }

  if (!mountNode) return null;

  return createPortal(
    <section aria-label="Color scheme" style={{ display: "grid", gap: 7, margin: "10px 0", padding: 10, border: "1px solid #C8BDAB", borderRadius: 10, background: "#FFFDF8" }}>
      <div>
        <strong style={{ display: "block", color: "#174F64", fontFamily: "Georgia, serif", fontWeight: 500 }}>Color scheme</strong>
        <span style={{ color: "#687175", fontSize: 10 }}>Built from the Arc asset palette.</span>
      </div>
      <div role="radiogroup" aria-label="Arc color scheme" style={{ display: "grid", gap: 5 }}>
        {ARC_COLOR_SCHEMES.map((scheme) => (
          <button
            key={scheme.id}
            type="button"
            role="radio"
            aria-checked={selected === scheme.id}
            onClick={() => choose(scheme.id)}
            style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr auto", gap: 7, alignItems: "center", padding: "7px 8px", border: selected === scheme.id ? "2px solid #174F64" : "1px solid #DDD5C6", borderRadius: 8, background: "#FFFDF8", textAlign: "left", cursor: "pointer" }}
          >
            <span>
              <b style={{ display: "block", fontSize: 12 }}>{scheme.label}</b>
              <small style={{ color: "#687175", fontSize: 10 }}>{scheme.description}</small>
            </span>
            <span aria-hidden="true" style={{ display: "flex", gap: 2 }}>
              {[scheme.deep, scheme.blue, scheme.gold, scheme.yellow, scheme.coral].map((color) => <i key={color} style={{ display: "block", width: 11, height: 22, borderRadius: 3, background: color }} />)}
            </span>
          </button>
        ))}
      </div>
    </section>,
    mountNode
  );
}
