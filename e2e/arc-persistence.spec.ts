import { test, expect } from "@playwright/test";
import { completeFirstRun } from "./helpers";

test("a saved Fridge magnet survives a hard reload", async ({ page }) => {
  await completeFirstRun(page, {
    teacherName: "Persistence Teacher",
    clearStorageOnce: true
  });

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
