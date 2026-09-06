export type ArcShortcutAction =
  | "undo"
  | "redo"
  | "copy"
  | "cut"
  | "paste"
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
  return null;
}
