import { test, expect } from "@playwright/test";
import { completeFirstRun } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("Fridge explains itself once, then the same click opens the tool", async ({ page }) => {
  await completeFirstRun(page, { teacherName: "Arc Help Teacher", contextualHelp: true });

  const fridge = page.getByRole("button", { name: "Fridge", exact: true });
  await fridge.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: "The Fridge is where good plans can wait." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Fridge Door" })).toHaveCount(0);

  await page.getByRole("button", { name: "Got it" }).click();
  await expect(fridge).toBeFocused();
  await fridge.click();
  await expect(page.getByRole("heading", { name: "Fridge Door" })).toBeVisible();
});

test("Escape closes first-use help and returns focus to the trigger", async ({ page }) => {
  await completeFirstRun(page, { teacherName: "Arc Help Keyboard", contextualHelp: true });
  const shift = page.getByRole("button", { name: "Shift", exact: true });
  await shift.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(shift).toBeFocused();
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
