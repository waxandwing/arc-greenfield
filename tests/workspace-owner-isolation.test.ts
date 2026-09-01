import test from "node:test";
import assert from "node:assert/strict";
import { emptyWorkspace } from "../lib/domain";
import { loadWorkspace, saveWorkspace, setActiveWorkspaceOwner, workspaceStorageKey } from "../lib/workspace-store";

class FakeStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  get length() { return this.values.size; }
}

function withFakeWindow(run: () => void) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  const localStorage = new FakeStorage();
  Object.defineProperty(globalThis, "window", { value: { localStorage }, configurable: true });
  try { run(); }
  finally {
    if (previous) Object.defineProperty(globalThis, "window", previous);
    else delete (globalThis as { window?: unknown }).window;
  }
}

test("authenticated owners receive distinct local workspace keys", () => {
  assert.notEqual(workspaceStorageKey("teacher-a"), workspaceStorageKey("teacher-b"));
  assert.equal(workspaceStorageKey(null), "arc.greenfield.workspace.v1");
});

test("two authenticated teachers on one device cannot load each other's local workspace", () => {
  withFakeWindow(() => {
    const teacherA = emptyWorkspace();
    teacherA.teacherName = "Teacher A";
    teacherA.ownerId = "teacher-a";
    saveWorkspace(teacherA, "teacher-a");

    const teacherB = emptyWorkspace();
    teacherB.teacherName = "Teacher B";
    teacherB.ownerId = "teacher-b";
    saveWorkspace(teacherB, "teacher-b");

    assert.equal(loadWorkspace("teacher-a").teacherName, "Teacher A");
    assert.equal(loadWorkspace("teacher-a").ownerId, "teacher-a");
    assert.equal(loadWorkspace("teacher-b").teacherName, "Teacher B");
    assert.equal(loadWorkspace("teacher-b").ownerId, "teacher-b");
  });
});

test("ArcShell-style ownerless load follows the active authenticated owner marker", () => {
  withFakeWindow(() => {
    const workspace = emptyWorkspace();
    workspace.teacherName = "Teacher A";
    workspace.ownerId = "teacher-a";
    saveWorkspace(workspace, "teacher-a");

    setActiveWorkspaceOwner("teacher-a");
    assert.equal(loadWorkspace().teacherName, "Teacher A");

    setActiveWorkspaceOwner(null);
    assert.equal(loadWorkspace().teacherName, "");
    assert.equal(loadWorkspace().ownerId, null);
  });
});
