import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test("a saved Fridge magnet survives a hard reload", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("What should Arc call you?").fill("Persistence Teacher");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByPlaceholder("Course name").fill("Studio Art");
  await page.getByPlaceholder("Period / block").fill("2");
  await page.getByRole("button", { name: "Add class" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("First student day", { exact: true }).fill("2026-08-10");
  await page.getByLabel("Last student day", { exact: true }).fill("2027-05-28");
  await page.getByRole("button", { name: "Open my desk" }).click();

  await page.getByRole("button", { name: "Fridge", exact: true }).click();
  await page.getByPlaceholder("idea title").fill("Try cyanotype warm-up");
  await page.getByRole("button", { name: "Add to Fridge", exact: true }).click();
  await expect(page.getByText("Try cyanotype warm-up", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Save now", exact: true }).click();

  await page.reload();
  await expect(page.getByRole("button", { name: "Arc home" })).toBeVisible();
  const fridge = page.getByRole("button", { name: "Fridge", exact: true });
  if (await page.getByRole("heading", { name: "Fridge Door", exact: true }).count() === 0) await fridge.click();
  await expect(page.getByText("Try cyanotype warm-up", { exact: true })).toBeVisible();

  const storedOwner = await page.evaluate(() => {
    const raw = localStorage.getItem("arc.greenfield.workspace.v1");
    return raw ? JSON.parse(raw).ownerId : "missing";
  });
  expect(storedOwner).toBeNull();
});
