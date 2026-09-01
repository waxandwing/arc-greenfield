import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("richer Day and truthful Year components remain available for the live shell", () => {
  const day = readFileSync(resolve(process.cwd(), "app/day-planning-view.tsx"), "utf8");
  const year = readFileSync(resolve(process.cwd(), "app/year-map-view.tsx"), "utf8");
  assert.match(day, /export function DayPlanningView/);
  assert.match(day, /Mark taught/);
  assert.match(day, /What changed\?/);
  assert.match(day, /resources/);
  assert.match(year, /export function YearMapView/);
  assert.match(year, /yearMonths\(workspace\.calendar\)/);
  assert.match(year, /pastInstructional/);
  assert.match(year, /quarterForDate/);
});

test("legacy shell still exposes Day and Year switcher until component wiring lands", () => {
  const shell = readFileSync(resolve(process.cwd(), "app/arc-shell.tsx"), "utf8");
  assert.match(shell, /id: "day"/);
  assert.match(shell, /id: "year"/);
});
