export type ArcShortcutAction =
  | "undo"
  | "redo"
  | "copy"
  | "cut"
  | "paste"
  | "save"
  | "delete"
  | "escape";

export type ArcPlanningIntentAction =
  | "open-move"
  | "preview-park"
  | "command-search";

export type ShortcutInput = {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
};

export function resolveArcShortcut(input: ShortcutInput): ArcShortcutAction | null {
  const command = input.metaKey || input.ctrlKey;
  const key = input.key.toLowerCase();

  if (key === "escape") return "escape";
  if ((key === "backspace" || key === "delete") && !command && !input.altKey) return "delete";
  if (!command || input.altKey) return null;

  if (key === "z" && input.shiftKey) return "redo";
  if (key === "z") return "undo";
  if (key === "y") return "redo";
  if (key === "c") return "copy";
  if (key === "x") return "cut";
  if (key === "v") return "paste";
  if (key === "s") return "save";
  return null;
}

/**
 * Resolves the R&D keyboard intents without executing them.
 *
 * The live shell should call this only when the corresponding Move/Park/Search
 * surfaces are implemented. Keeping this separate from resolveArcShortcut means
 * we do not advertise keys that currently do nothing.
 * Trace: A2K-A11Y-001 calendar keyboard contract.
 */
export function resolvePlanningIntentShortcut(input: ShortcutInput): ArcPlanningIntentAction | null {
  const command = input.metaKey || input.ctrlKey;
  const key = input.key.toLowerCase();

  if (input.altKey || input.shiftKey) return null;
  if (command && key === "k") return "command-search";
  if (command) return null;
  if (key === "m") return "open-move";
  if (key === "f") return "preview-park";
  return null;
}

export const ARC_SHORTCUT_LABELS: Array<{ action: ArcShortcutAction; label: string }> = [
  { action: "undo", label: "⌘/Ctrl Z · Undo" },
  { action: "redo", label: "⌘/Ctrl Shift Z · Redo" },
  { action: "copy", label: "⌘/Ctrl C · Copy selection" },
  { action: "cut", label: "⌘/Ctrl X · Cut selection" },
  { action: "paste", label: "⌘/Ctrl V · Paste selection" },
  { action: "save", label: "⌘/Ctrl S · Save now" },
  { action: "delete", label: "Delete · Remove selection" },
  { action: "escape", label: "Esc · Clear selection" }
];

export const ARC_PLANNING_INTENT_LABELS: Array<{ action: ArcPlanningIntentAction; label: string }> = [
  { action: "open-move", label: "M · Open Move for selected plan" },
  { action: "preview-park", label: "F · Preview Park in Fridge" },
  { action: "command-search", label: "⌘/Ctrl K · Quick actions and search" }
];
