import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("richer Day and truthful Year components remain available", () => {
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

test("live shell uses the richer Day and truthful Year projections", () => {
  const shell = readFileSync(resolve(process.cwd(), "app/arc-shell.tsx"), "utf8");
  assert.match(shell, /import \{ DayPlanningView \} from "\.\/day-planning-view"/);
  assert.match(shell, /import \{ YearMapView \} from "\.\/year-map-view"/);
  assert.match(shell, /activeView === "day" && <DayPlanningView/);
  assert.match(shell, /activeView === "year" && <YearMapView/);
  assert.equal(/function DayView\(/.test(shell), false, "shallow local DayView must not return");
  assert.equal(/function YearView\(/.test(shell), false, "duplicate-month local YearView must not return");
});
