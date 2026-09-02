import { test, expect } from "@playwright/test";
import { completeFirstRun } from "./helpers";

const QUARTERS: Array<[string, string]> = [
  ["2026-08-10", "2026-10-09"],
  ["2026-10-12", "2026-12-18"],
  ["2027-01-04", "2027-03-12"],
  ["2027-03-15", "2027-05-28"]
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test("Week defaults to the teacher workweek", async ({ page }) => {
  await completeFirstRun(page, { teacherName: "Arc Week Teacher" });
  await expect(page.getByRole("button", { name: "Add lesson or unit to Studio Art on Fri" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add lesson or unit to Studio Art on Sat" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add lesson or unit to Studio Art on Sun" })).toHaveCount(0);
});

test("weekend opt-in is visible in Week, Month, and Quarter", async ({ page }) => {
  await completeFirstRun(page, { teacherName: "Arc Weekend Teacher", weekendsVisible: true, quarters: QUARTERS });
  await expect(page.getByRole("button", { name: "Add lesson or unit to Studio Art on Sat" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add lesson or unit to Studio Art on Sun" })).toBeVisible();

  await page.getByRole("button", { name: "Add lesson or unit to Studio Art on Sat" }).focus();
  await page.keyboard.press("Enter");
  await page.getByPlaceholder("Lesson title").fill("Weekend workshop");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Weekend workshop", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Month" }).click();
  await expect(page.locator(".monthDayLabels").getByText("Sat", { exact: true })).toBeVisible();
  await expect(page.locator(".monthDayLabels").getByText("Sun", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Quarter" }).click();
  const firstQuarterWeek = page.locator(".quarterWeek").first();
  await expect(firstQuarterWeek.locator(".quarterDay")).toHaveCount(7);
  await expect(firstQuarterWeek.getByRole("button", { name: /Sat/ })).toBeVisible();
  await expect(firstQuarterWeek.getByRole("button", { name: /Sun/ })).toBeVisible();
});
