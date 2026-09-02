import { test, expect } from "@playwright/test";
import { completeFirstRun } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test("Unit Focus can resize a Unit range without drag and the change persists", async ({ page }) => {
  await completeFirstRun(page, { teacherName: "Arc Range Teacher" });

  await page.getByRole("button", { name: "＋ Unit" }).click();
  await page.getByPlaceholder("Unit title").fill("Egypt");
  await page.getByRole("button", { name: "Add", exact: true }).click();

  const unit = page.locator(".unitMagnet").filter({ hasText: "Egypt" }).first();
  await unit.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator('.arcMagnetEditor[aria-label="Unit Focus"]')).toBeVisible();

  const end = page.getByLabel("Unit end", { exact: true });
  await expect(end).toBeVisible();
  await end.fill("2026-09-18");
  await expect(end).toHaveValue("2026-09-18");

  await page.getByRole("button", { name: "Close Unit Focus" }).click();
  await unit.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Unit end", { exact: true })).toHaveValue("2026-09-18");
});
