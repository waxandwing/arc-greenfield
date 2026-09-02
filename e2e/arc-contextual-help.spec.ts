import { test, expect } from "@playwright/test";
import { completeFirstRun } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test("Fridge explains itself once, then the same click opens the tool", async ({ page }) => {
  await completeFirstRun(page, { teacherName: "Arc Help Teacher", contextualHelp: true });

  await page.getByRole("button", { name: "Fridge", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "The Fridge keeps work without forcing a date." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Fridge Door" })).toHaveCount(0);

  await page.getByRole("button", { name: "Got it" }).click();
  await page.getByRole("button", { name: "Fridge", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Fridge Door" })).toBeVisible();
});

test("explored contextual help stays explored after reload", async ({ page }) => {
  await completeFirstRun(page, { teacherName: "Arc Help Persistence", contextualHelp: true });
  await page.getByRole("button", { name: "Shift", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Shift is for the day that went sideways." })).toBeVisible();
  await page.getByRole("button", { name: "Got it" }).click();

  await page.reload();
  await expect(page.getByRole("button", { name: "Arc home" })).toBeVisible();
  await page.getByRole("button", { name: "Shift", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Shift" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("persistent question mark reopens help on demand", async ({ page }) => {
  await completeFirstRun(page, { teacherName: "Arc Help Mark", contextualHelp: true });
  await page.getByRole("button", { name: "Open Arc help" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "The calendar is home." })).toBeVisible();
});

test("teacher can hide the question mark and stop automatic first-time tips", async ({ page }) => {
  await completeFirstRun(page, { teacherName: "Arc Help Choice", contextualHelp: true });
  await page.getByRole("button", { name: "Open Arc help" }).click();
  await page.getByText("Help preferences", { exact: true }).click();
  await page.getByLabel("Show first-time tips").uncheck();
  await page.getByLabel("Show the ? help button").uncheck();
  await page.getByRole("button", { name: "Got it" }).click();
  await expect(page.getByRole("button", { name: "Open Arc help" })).toHaveCount(0);

  await page.getByRole("button", { name: "Fridge", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Fridge Door" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
