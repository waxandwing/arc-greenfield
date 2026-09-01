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

  await page.getByLabel("First student day", { exact: true }).fill("2026-08-10");
  await page.getByLabel("Last student day", { exact: true }).fill("2027-05-28");
  await page.getByLabel("No-school date", { exact: true }).fill("2026-09-07");
  await page.getByLabel("No-school date label", { exact: true }).fill("Labor Day");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText("Labor Day", { exact: true })).toBeVisible();

  await page.locator("details.quarterDetails > summary").click();
  const quarters = [
    ["2026-08-10", "2026-10-09"],
    ["2026-10-12", "2026-12-18"],
    ["2027-01-04", "2027-03-12"],
    ["2027-03-15", "2027-05-28"]
  ];
  for (let index = 0; index < quarters.length; index += 1) {
    await page.getByLabel(`Quarter ${index + 1} start`).fill(quarters[index][0]);
    await page.getByLabel(`Quarter ${index + 1} end`).fill(quarters[index][1]);
  }

  await page.getByRole("button", { name: "Open my desk" }).click();
  await expect(page.getByRole("button", { name: "Arc home" })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test("first run reaches a functional Arc desk without a fake calendar source", async ({ page }) => {
  await completeFirstRun(page);

  await expect(page.getByRole("button", { name: "Fridge", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Shift", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save now", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Fridge", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Fridge Door", exact: true })).toBeVisible();
  await page.getByPlaceholder("idea title").fill("Try cyanotype warm-up");
  await page.getByRole("button", { name: "Add to Fridge", exact: true }).click();
  await expect(page.getByText("Try cyanotype warm-up", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Fridge", exact: true }).click();
  await page.getByRole("button", { name: "Month", exact: true }).click();
  await expect(page.locator(".arcCalendarViewport")).toBeVisible();
  await page.getByRole("button", { name: "Week", exact: true }).click();
  await expect(page.locator(".arcCalendarViewport")).toBeVisible();
});

test("Arc color scheme is user-selectable, asset-derived, and persists", async ({ page }) => {
  await completeFirstRun(page);

  const palette = page.getByRole("button", { name: /Palette · Arc Studio/ });
  await expect(palette).toBeVisible();
  await palette.click();
  await expect(page.getByRole("radiogroup", { name: "Arc color scheme" })).toBeVisible();
  await page.getByRole("radio", { name: /Blueprint/ }).click();

  await page.waitForLoadState("domcontentloaded");
  await expect(page.getByRole("button", { name: /Palette · Blueprint/ })).toBeVisible();
  await expect(page.locator(".arcWorkspace")).toHaveAttribute("data-color-scheme", "blueprint");

  const stored = await page.evaluate(() => {
    const raw = localStorage.getItem("arc.greenfield.workspace.v1");
    return raw ? JSON.parse(raw).preferences.colorScheme : null;
  });
  expect(stored).toBe("blueprint");
});

test("Day is the teach-from-it surface and Year renders each school month once", async ({ page }) => {
  await completeFirstRun(page);

  await page.getByRole("button", { name: "Day", exact: true }).click();
  await expect(page.getByText("Teach from today", { exact: true })).toBeVisible();
  await expect(page.locator(".dayCourse.teachingCard")).toHaveCount(1);
  await expect(page.getByText("Studio Art", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Year", exact: true }).click();
  await expect(page.getByText("Each month appears once. Quarter color changes on the actual boundary date.", { exact: true })).toBeVisible();
  await expect(page.locator(".yearMiniMonth")).toHaveCount(10);
  await expect(page.locator(".yearMiniMonth").filter({ hasText: "October" })).toHaveCount(1);
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
  for (let index = 0; index < 24; index += 1) {
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
