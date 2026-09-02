import { test, expect, type Page } from "@playwright/test";
import { completeFirstRun } from "./helpers";

const QUARTERS: Array<[string, string]> = [
  ["2026-08-10", "2026-10-09"],
  ["2026-10-12", "2026-12-18"],
  ["2027-01-04", "2027-03-12"],
  ["2027-03-15", "2027-05-28"]
];

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
  await completeFirstRun(page, { teacherName: "Arc Beta Teacher" });
  await createUnitWithLesson(page);

  await page.locator(".unitMagnet").filter({ hasText: "Foundations" }).first().click();
  await expect(page.locator('.arcMagnetEditor[aria-label="Unit Focus"]')).toBeVisible();
  await expect(page.getByText("Contour Warm-up", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Week" })).toHaveClass(/active/);
  await page.screenshot({ path: "test-results/ui-week-unit-focus.png", fullPage: true });
});

test("Month copy paste has a complete non-drag keyboard path", async ({ page }) => {
  await completeFirstRun(page, { teacherName: "Arc Beta Teacher" });
  await createUnitWithLesson(page);

  await page.getByRole("button", { name: "Month" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".monthSurface")).toBeVisible();

  const foundationUnit = page.getByRole("button", { name: /Foundations, Unit from/ }).first();
  await foundationUnit.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Copy" }).focus();
  await page.keyboard.press("Enter");

  const targetDate = page.getByRole("button", { name: "Select 2026-09-15 as paste target", exact: true });
  await targetDate.focus();
  await page.keyboard.press("Enter");
  const pasteButton = page.getByRole("button", { name: "Paste", exact: true });
  await expect(pasteButton).toBeEnabled();
  await pasteButton.focus();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("button", { name: /Foundations, Unit from/ })).toHaveCount(2);
  await page.screenshot({ path: "test-results/ui-month-keyboard-copy-paste.png", fullPage: true });
});

test("Quarter copy paste has a complete non-drag keyboard path", async ({ page }) => {
  await completeFirstRun(page, { teacherName: "Arc Beta Teacher", quarters: QUARTERS });
  await createUnitWithLesson(page);

  await page.getByRole("button", { name: "Quarter" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".quarterSurface")).toBeVisible();

  const foundationUnit = page.getByRole("button", { name: /Foundations, Unit from/ }).first();
  await foundationUnit.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Copy" }).focus();
  await page.keyboard.press("Enter");

  const targetDate = page.getByRole("button", { name: "Select 2026-09-15 as paste target", exact: true });
  await targetDate.focus();
  await page.keyboard.press("Enter");
  const pasteButton = page.getByRole("button", { name: "Paste", exact: true });
  await expect(pasteButton).toBeEnabled();
  await pasteButton.focus();
  await page.keyboard.press("Enter");

  await expect(page.getByRole("button", { name: /Foundations, Unit from/ })).toHaveCount(2);
  await page.screenshot({ path: "test-results/ui-quarter-keyboard-copy-paste.png", fullPage: true });
});

test("Must Should Could is one lifecycle: add, red-circle, cross out, then delete", async ({ page }) => {
  await completeFirstRun(page, { teacherName: "Arc Beta Teacher" });

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
  await completeFirstRun(page, { teacherName: "Arc Beta Teacher" });
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
