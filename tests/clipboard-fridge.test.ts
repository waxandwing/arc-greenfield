import test from "node:test";
import assert from "node:assert/strict";
import { emptyWorkspace, type Plan } from "../lib/domain";
import { createClipboard, pasteClipboard } from "../lib/clipboard";

function plan(overrides: Partial<Plan> & Pick<Plan, "id" | "title" | "type">): Plan {
  const { id, title, type, ...rest } = overrides;
  return { id, title, type, courseId: "course-a", date: "2026-09-08", endDate: type === "unit" ? "2026-09-12" : null, location: "calendar", parentUnitId: null, childOrder: null, fixedDate: false, continuationOfId: null, notes: "", resources: [], details: {}, ...rest };
}

test("copying a Unit tree to Fridge preserves course and hierarchy", () => {
  const workspace = emptyWorkspace();
  workspace.plans = [
    plan({ id: "unit", title: "Prehistory", type: "unit" }),
    plan({ id: "lesson", title: "Visual Analysis", type: "lesson", parentUnitId: "unit", childOrder: 0, date: "2026-09-09" })
  ];
  const clipboard = createClipboard(workspace, "unit", "copy");
  assert.ok(clipboard);
  const result = pasteClipboard(workspace, clipboard!, { location: "fridge", date: null, courseId: null });
  const added = result.workspace.plans.filter((item) => !["unit", "lesson"].includes(item.id));
  const copiedUnit = added.find((item) => item.type === "unit");
  const copiedLesson = added.find((item) => item.type === "lesson");
  assert.equal(copiedUnit?.location, "fridge");
  assert.equal(copiedUnit?.courseId, "course-a");
  assert.equal(copiedLesson?.courseId, "course-a");
  assert.equal(copiedLesson?.parentUnitId, copiedUnit?.id);
});
