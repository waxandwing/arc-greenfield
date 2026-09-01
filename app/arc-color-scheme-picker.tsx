"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ArcColorScheme, Workspace } from "../lib/domain";

const WORKSPACE_KEY = "arc.greenfield.workspace.v1";
const SCHEME_KEY = "arc.colorScheme";

const SCHEMES: Array<{
  id: ArcColorScheme;
  label: string;
  note: string;
  swatches: string[];
  vars: Record<string, string>;
}> = [
  {
    id: "studio",
    label: "Arc Studio",
    note: "The original Arc asset family.",
    swatches: ["#174F64", "#AAC7D0", "#EFBE3F", "#F0D538", "#DF8968"],
    vars: {
      "--arc-paper": "#F6F1E7", "--arc-deep": "#174F64", "--arc-teal": "#6F9EAA", "--arc-blue": "#AAC7D0",
      "--arc-gold": "#EFBE3F", "--arc-coral": "#DF8968", "--arc-orange": "#EFAA57",
      "--arc-q1": "#F0D538", "--arc-q2": "#EFAA57", "--arc-q3": "#AAC7D0", "--arc-q4": "#DF8968"
    }
  },
  {
    id: "sunroom",
    label: "Sunroom",
    note: "More yellow and warm paper, still unmistakably Arc.",
    swatches: ["#F0D538", "#EFBE3F", "#EFAA57", "#AAC7D0", "#174F64"],
    vars: {
      "--arc-paper": "#F8F1DF", "--arc-deep": "#174F64", "--arc-teal": "#8AAEB6", "--arc-blue": "#C3DADF",
      "--arc-gold": "#EFBE3F", "--arc-coral": "#DF8968", "--arc-orange": "#EFAA57",
      "--arc-q1": "#F0D538", "--arc-q2": "#EFBE3F", "--arc-q3": "#AAC7D0", "--arc-q4": "#DF8968"
    }
  },
  {
    id: "blueprint",
    label: "Blueprint",
    note: "Leans into the painted Arc blues without going corporate.",
    swatches: ["#174F64", "#6F9EAA", "#AAC7D0", "#EFBE3F", "#DF8968"],
    vars: {
      "--arc-paper": "#F4F1E9", "--arc-deep": "#174F64", "--arc-teal": "#6F9EAA", "--arc-blue": "#AAC7D0",
      "--arc-gold": "#EFBE3F", "--arc-coral": "#DF8968", "--arc-orange": "#EFAA57",
      "--arc-q1": "#AAC7D0", "--arc-q2": "#6F9EAA", "--arc-q3": "#EFBE3F", "--arc-q4": "#DF8968"
    }
  },
  {
    id: "clay",
    label: "Clay + Paper",
    note: "Coral and orange forward, balanced by Arc blue.",
    swatches: ["#DF8968", "#EFAA57", "#EFBE3F", "#AAC7D0", "#174F64"],
    vars: {
      "--arc-paper": "#F7EFE5", "--arc-deep": "#174F64", "--arc-teal": "#7FA7AD", "--arc-blue": "#BDD4DA",
      "--arc-gold": "#EFBE3F", "--arc-coral": "#DF8968", "--arc-orange": "#EFAA57",
      "--arc-q1": "#EFBE3F", "--arc-q2": "#EFAA57", "--arc-q3": "#DF8968", "--arc-q4": "#AAC7D0"
    }
  }
];

function readWorkspace(): Workspace | null {
  try {
    const raw = window.localStorage.getItem(WORKSPACE_KEY);
    return raw ? JSON.parse(raw) as Workspace : null;
  } catch {
    return null;
  }
}

function applyScheme(id: ArcColorScheme) {
  const scheme = SCHEMES.find((item) => item.id === id) ?? SCHEMES[0];
  const root = document.querySelector<HTMLElement>(".arcWorkspace");
  if (!root) return false;
  root.dataset.colorScheme = scheme.id;
  Object.entries(scheme.vars).forEach(([key, value]) => root.style.setProperty(key, value));
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
    const workspace = readWorkspace();
    const saved = window.localStorage.getItem(SCHEME_KEY) as ArcColorScheme | null;
    const next = saved ?? workspace?.preferences?.colorScheme ?? "studio";
    setSelected(next);

    const current = readWorkspace();
    if (current && current.preferences?.colorScheme !== next) {
      window.localStorage.setItem(WORKSPACE_KEY, JSON.stringify({
        ...current,
        preferences: { ...current.preferences, colorScheme: next }
      }));
    }

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
    window.localStorage.setItem(SCHEME_KEY, id);
    const workspace = readWorkspace();
    if (workspace) {
      window.localStorage.setItem(WORKSPACE_KEY, JSON.stringify({
        ...workspace,
        preferences: { ...workspace.preferences, colorScheme: id },
        updatedAt: new Date().toISOString()
      }));
    }
  }

  if (!mountNode) return null;

  return createPortal(
    <section aria-label="Color scheme" style={{ display: "grid", gap: 7, margin: "10px 0", padding: 10, border: "1px solid #C8BDAB", borderRadius: 10, background: "#FFFDF8" }}>
      <div><strong style={{ display: "block", color: "#174F64", fontFamily: "Georgia, serif", fontWeight: 500 }}>Color scheme</strong><span style={{ color: "#687175", fontSize: 10 }}>Built from the Arc asset palette.</span></div>
      <div role="radiogroup" aria-label="Arc color scheme" style={{ display: "grid", gap: 5 }}>
        {SCHEMES.map((scheme) => <button key={scheme.id} type="button" role="radio" aria-checked={selected === scheme.id} onClick={() => choose(scheme.id)} style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr auto", gap: 7, alignItems: "center", padding: "7px 8px", border: selected === scheme.id ? "2px solid #174F64" : "1px solid #DDD5C6", borderRadius: 8, background: "#FFFDF8", textAlign: "left", cursor: "pointer" }}>
          <span><b style={{ display: "block", fontSize: 12 }}>{scheme.label}</b><small style={{ color: "#687175", fontSize: 10 }}>{scheme.note}</small></span>
          <span aria-hidden="true" style={{ display: "flex", gap: 2 }}>{scheme.swatches.map((color) => <i key={color} style={{ display: "block", width: 11, height: 22, borderRadius: 3, background: color }} />)}</span>
        </button>)}
      </div>
    </section>,
    mountNode
  );
}
