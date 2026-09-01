import test from "node:test";
import assert from "node:assert/strict";
import { emptyWorkspace, type Plan } from "../lib/domain";
import { applyCut, createClipboard, pasteClipboard } from "../lib/clipboard";

function plan(overrides: Partial<Plan> & Pick<Plan, "id" | "title" | "type">): Plan {
  const { id, title, type, ...rest } = overrides;
  return { id, title, type, courseId: "course-a", date: "2026-09-08", endDate: type === "unit" ? "2026-09-12" : null, location: "calendar", parentUnitId: null, childOrder: null, fixedDate: false, continuationOfId: null, notes: "", resources: [], details: {}, ...rest };
}

test("Cut consumes once and preserves Unit/Lesson IDs", () => {
  const workspace = emptyWorkspace();
  workspace.plans = [plan({ id: "unit", title: "Prehistory", type: "unit" }), plan({ id: "lesson", title: "Visual Analysis", type: "lesson", parentUnitId: "unit", childOrder: 0, date: "2026-09-09" })];
  const clipboard = createClipboard(workspace, "unit", "cut");
  assert.ok(clipboard);
  const cutWorkspace = applyCut(workspace, clipboard!);
  assert.equal(cutWorkspace.plans.length, 0);
  const result = pasteClipboard(cutWorkspace, clipboard!, { location: "calendar", date: "2026-09-15", courseId: "course-a" });
  assert.equal(result.pastedRootId, "unit");
  assert.equal(result.nextClipboard, null);
  assert.equal(result.workspace.plans.find((item) => item.id === "unit")?.date, "2026-09-15");
  assert.equal(result.workspace.plans.find((item) => item.id === "lesson")?.date, "2026-09-16");
  assert.equal(result.workspace.plans.find((item) => item.id === "lesson")?.parentUnitId, "unit");
});

test("Undo-restored source is replaced rather than duplicated when Cut is pasted", () => {
  const workspace = emptyWorkspace();
  workspace.plans = [plan({ id: "unit", title: "Prehistory", type: "unit" }), plan({ id: "lesson", title: "Visual Analysis", type: "lesson", parentUnitId: "unit", childOrder: 0 })];
  const clipboard = createClipboard(workspace, "unit", "cut");
  assert.ok(clipboard);
  const result = pasteClipboard(workspace, clipboard!, { location: "fridge", date: null, courseId: null });
  assert.equal(result.workspace.plans.filter((item) => item.id === "unit").length, 1);
  assert.equal(result.workspace.plans.filter((item) => item.id === "lesson").length, 1);
  assert.equal(result.workspace.plans.find((item) => item.id === "unit")?.location, "fridge");
});
