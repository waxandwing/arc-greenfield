import { test, expect } from "@playwright/test";
import { completeFirstRun } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test("Week defaults to the teacher workweek", async ({ page }) => {
  await completeFirstRun(page, { teacherName: "Arc Week Teacher" });
  await expect(page.getByRole("button", { name: "Add lesson or unit to Studio Art on Fri" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add lesson or unit to Studio Art on Sat" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add lesson or unit to Studio Art on Sun" })).toHaveCount(0);
});

test("Week shows Saturday and Sunday when the teacher opts in", async ({ page }) => {
  await completeFirstRun(page, { teacherName: "Arc Weekend Teacher", weekendsVisible: true });
  await expect(page.getByRole("button", { name: "Add lesson or unit to Studio Art on Sat" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add lesson or unit to Studio Art on Sun" })).toBeVisible();

  await page.getByRole("button", { name: "Add lesson or unit to Studio Art on Sat" }).focus();
  await page.keyboard.press("Enter");
  await page.getByPlaceholder("Lesson title").fill("Weekend workshop");
  await page.keyboard.press("Enter");
  await expect(page.getByText("Weekend workshop", { exact: true })).toBeVisible();
});
