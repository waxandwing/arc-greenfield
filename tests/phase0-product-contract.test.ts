import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ARC_HELP_TOPICS } from "../lib/arc-help-guidance";
import { arcColorScheme } from "../lib/arc-color-schemes";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

test("Phase 0 keeps the approved Arc identity and calendar-centered shell", () => {
  const shell = read("app/arc-shell.tsx");
  assert.match(shell, /src="\/arc\.png"/);
  assert.match(shell, /arcCalendarViewport/);
  assert.match(shell, /Day/);
  assert.match(shell, /Week/);
  assert.match(shell, /Month/);
  assert.match(shell, /Quarter/);
  assert.match(shell, /Year/);
  assert.doesNotMatch(shell, /Ask AI/i);
  assert.doesNotMatch(shell, /AI dashboard/i);
});

test("Arc Studio retains the approved asset-derived brand palette", () => {
  const studio = arcColorScheme("studio");
  assert.equal(studio.paper.toUpperCase(), "#F6F1E7");
  assert.equal(studio.deep.toUpperCase(), "#174F64");
  assert.equal(studio.blue.toUpperCase(), "#AAC7D0");
  assert.equal(studio.gold.toUpperCase(), "#EFBE3F");
  assert.equal(studio.yellow.toUpperCase(), "#F0D538");
  assert.equal(studio.orange.toUpperCase(), "#EFAA57");
  assert.equal(studio.coral.toUpperCase(), "#DF8968");
});

test("normal first-run entry no longer gates the calendar behind a tutorial", () => {
  const entry = read("app/arc-entry.tsx");
  assert.doesNotMatch(entry, /complete\s*&&\s*!tutorialComplete/);
  assert.doesNotMatch(entry, /How Arc works\./);
  assert.match(entry, /showExploreArc/);
});

test("Getting to Know Arc uses one canonical help registry rather than duplicated tutorial copy", () => {
  const explore = read("app/arc-tutorial-screen.tsx");
  assert.match(explore, /ARC_HELP_TOPICS/);
  assert.doesNotMatch(explore, /const STEPS/);
  assert.equal(ARC_HELP_TOPICS.length, 9);
  assert.equal(new Set(ARC_HELP_TOPICS.map((topic) => topic.id)).size, ARC_HELP_TOPICS.length);
  assert.ok(ARC_HELP_TOPICS.every((topic) => topic.title && topic.body && topic.bullets.length > 0));
});
