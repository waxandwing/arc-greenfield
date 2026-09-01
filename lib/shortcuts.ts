export type ArcShortcutAction =
  | "undo"
  | "redo"
  | "copy"
  | "cut"
  | "paste"
  | "save"
  | "delete"
  | "escape";

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
