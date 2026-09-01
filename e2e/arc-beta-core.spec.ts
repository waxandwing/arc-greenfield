import { test, expect, type Page } from "@playwright/test";

async function completeFirstRun(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Make Arc yours." })).toBeVisible();
  await page.getByPlaceholder("What should Arc call you?").fill("Arc Beta Teacher");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByPlaceholder("Course name").fill("Studio Art");
  await page.getByPlaceholder("Period / block").fill("2");
  await page.getByRole("button", { name: "Add class" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("First student day").fill("2026-08-10");
  await page.getByLabel("Last student day").fill("2027-05-28");
  await page.getByRole("button", { name: "Open my desk" }).click();
  await expect(page.getByRole("button", { name: "Arc home" })).toBeVisible();
}

async function createUnitWithLesson(page: Page) {
  await page.getByRole("button", { name: "＋ Unit" }).click();
  await page.getByPlaceholder("Unit title").fill("Foundations");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText("Foundations", { exact: true }).first()).toBeVisible();

  const unit = page.locator(".unitMagnet").filter({ hasText: "Foundations" }).first();
  await unit.getByRole("button", { name: "＋ Lesson" }).click();
  await page.getByPlaceholder("Lesson title").fill("Contour Warm-up");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText("Contour Warm-up", { exact: true }).first()).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test("core Unit workflow creates a real Unit tree and opens Unit Focus without leaving Week", async ({ page }) => {
  await completeFirstRun(page);
  await createUnitWithLesson(page);

  await page.locator(".unitMagnet").filter({ hasText: "Foundations" }).first().click();
  await expect(page.locator('.arcMagnetEditor[aria-label="Unit Focus"]')).toBeVisible();
  await expect(page.getByText("Contour Warm-up", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Week" })).toHaveClass(/active/);
  await page.screenshot({ path: "test-results/ui-week-unit-focus.png", fullPage: true });
});

test("Month is an editing surface: select a Unit, copy it, choose a date, and paste a new tree", async ({ page }) => {
  await completeFirstRun(page);
  await createUnitWithLesson(page);

  await page.getByRole("button", { name: "Month" }).click();
  await expect(page.locator(".monthSurface")).toBeVisible();
  const foundationUnit = page.getByRole("button", { name: /Foundations, Unit from/ }).first();
  await foundationUnit.click();
  await page.getByRole("button", { name: "Copy" }).click();

  const targetDay = page.locator(".monthDay").filter({ has: page.locator(".monthDate") }).nth(10);
  await targetDay.click();
  await expect(page.getByRole("button", { name: "Paste" })).toBeEnabled();
  await page.getByRole("button", { name: "Paste" }).click();
  await expect(page.getByRole("button", { name: /Foundations, Unit from/ })).toHaveCount(2);
  await page.screenshot({ path: "test-results/ui-month-copy-paste.png", fullPage: true });
});

test("Must Should Could is one lifecycle: add, red-circle, cross out, then delete", async ({ page }) => {
  await completeFirstRun(page);

  await page.getByRole("button", { name: "Must", exact: true }).click();
  await page.getByPlaceholder("Add to must").fill("Call family");
  await page.getByPlaceholder("Add to must").press("Enter");
  await expect(page.getByRole("button", { name: "Call family" })).toBeVisible();

  await page.getByRole("button", { name: "Red circle this task" }).click();
  await expect(page.getByRole("button", { name: "Remove red circle" })).toBeVisible();
  await page.screenshot({ path: "test-results/ui-msc-red-circle.png", fullPage: true });
  await page.getByRole("button", { name: "Call family" }).click();
  await expect(page.getByRole("button", { name: "Delete crossed-out task" })).toBeVisible();
  await page.getByRole("button", { name: "Delete crossed-out task" }).click();
  await expect(page.getByRole("button", { name: "Call family" })).toHaveCount(0);
});

test("full-screen shell does not grow the document when Fridge and priorities are open", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await completeFirstRun(page);
  await page.getByRole("button", { name: "Fridge" }).click();
  await expect(page.getByRole("heading", { name: "Fridge Door" })).toBeVisible();
  await page.getByRole("button", { name: "Must", exact: true }).click();

  const measurements = await page.evaluate(() => ({
    innerHeight: window.innerHeight,
    scrollHeight: document.documentElement.scrollHeight,
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    viewportHeight: document.querySelector('.arcCalendarViewport')?.getBoundingClientRect().height ?? 0,
    folderWidth: document.querySelector('.arcFolder')?.getBoundingClientRect().width ?? 0
  }));

  expect(measurements.scrollHeight, `vertical overflow ${JSON.stringify(measurements)}`).toBeLessThanOrEqual(measurements.innerHeight + 4);
  expect(measurements.scrollWidth, `horizontal overflow ${JSON.stringify(measurements)}`).toBeLessThanOrEqual(measurements.innerWidth + 4);
  expect(measurements.viewportHeight).toBeGreaterThan(180);
  expect(measurements.folderWidth).toBeGreaterThan(250);
  await page.screenshot({ path: "test-results/ui-fridge-msc-fullscreen.png", fullPage: true });
});
