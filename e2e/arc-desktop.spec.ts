import { test, expect } from "@playwright/test";

async function completeFirstRun(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Make Arc yours." })).toBeVisible();

  await page.getByPlaceholder("What should Arc call you?").fill("Arc Test Teacher");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByPlaceholder("Course name").fill("Studio Art");
  await page.getByPlaceholder("Period / block").fill("2");
  await page.getByRole("button", { name: "Add class" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("First student day").fill("2026-08-10");
  await page.getByLabel("Last student day").fill("2027-05-28");
  await page.getByLabel("No-school date").fill("2026-09-07");
  await page.getByLabel("No-school date label").fill("Labor Day");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText("Labor Day")).toBeVisible();

  await page.getByRole("button", { name: "Open my desk" }).click();
  await expect(page.getByRole("button", { name: "Arc home" })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test("first run reaches a functional Arc desk without a fake calendar source", async ({ page }) => {
  await completeFirstRun(page);

  await expect(page.getByRole("button", { name: "Fridge" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Shift" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save now" })).toBeVisible();

  await page.getByRole("button", { name: "Fridge" }).click();
  await expect(page.getByRole("heading", { name: "Fridge Door" })).toBeVisible();
  await page.getByPlaceholder("idea title").fill("Try cyanotype warm-up");
  await page.getByRole("button", { name: "Add to Fridge" }).click();
  await expect(page.getByText("Try cyanotype warm-up")).toBeVisible();

  await page.getByRole("button", { name: "Fridge" }).click();
  await page.getByRole("button", { name: "Month" }).click();
  await expect(page.locator(".arcCalendarViewport")).toBeVisible();
  await page.getByRole("button", { name: "Week" }).click();
  await expect(page.locator(".arcCalendarViewport")).toBeVisible();
});

test("desktop planning shell stays inside the viewport at supported laptop sizes", async ({ page }) => {
  await completeFirstRun(page);
  const measurements = await page.evaluate(() => ({
    innerHeight: window.innerHeight,
    scrollHeight: document.documentElement.scrollHeight,
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));

  expect(measurements.scrollHeight, `vertical overflow ${JSON.stringify(measurements)}`).toBeLessThanOrEqual(measurements.innerHeight + 4);
  expect(measurements.scrollWidth, `horizontal overflow ${JSON.stringify(measurements)}`).toBeLessThanOrEqual(measurements.innerWidth + 4);
});

test("core planning controls are keyboard reachable", async ({ page }) => {
  await completeFirstRun(page);
  await page.keyboard.press("Tab");
  const focusOrder: string[] = [];
  for (let index = 0; index < 18; index += 1) {
    const label = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      return active?.getAttribute("aria-label") || active?.textContent?.trim().slice(0, 40) || active?.tagName || "";
    });
    focusOrder.push(label);
    await page.keyboard.press("Tab");
  }
  expect(focusOrder.some((value) => /Fridge/i.test(value))).toBeTruthy();
  expect(focusOrder.some((value) => /Shift/i.test(value))).toBeTruthy();
  expect(focusOrder.some((value) => /Save now/i.test(value))).toBeTruthy();
});
