import { test, expect } from "@playwright/test";
import { completeFirstRun } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test("Recovery Desk shows the exact next class meeting before a shift", async ({ page }) => {
  await completeFirstRun(page, {
    teacherName: "Recovery Preview Teacher",
    meetingWeekdays: [1, 3, 5]
  });

  await page.getByRole("button", { name: "Add lesson or unit to Studio Art on Mon" }).click();
  await page.getByPlaceholder("Lesson title").fill("Wheel demo");
  await page.keyboard.press("Enter");

  await page.goto("/recovery");
  await expect(page.getByRole("heading", { name: "Recovery Desk" })).toBeVisible();
  await page.getByLabel("Date", { exact: true }).fill("2026-08-31");
  await page.getByRole("button", { name: "Preview the ripple" }).click();

  await expect(page.getByRole("heading", { name: "Nothing moves until you confirm." })).toBeVisible();
  await expect(page.getByText("Wheel demo", { exact: true })).toBeVisible();
  await expect(page.getByText("Mon, Aug 31 → Wed, Sep 2", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm safe moves" })).toBeEnabled();

  await page.goto("/");
  await page.getByRole("button", { name: "Month", exact: true }).click();
  await expect(page.getByRole("button", { name: "Wheel demo", exact: true })).toBeVisible();
});
