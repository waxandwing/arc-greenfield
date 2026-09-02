import { test, expect } from "@playwright/test";
import { completeFirstRun } from "./helpers";

const DESKTOP_SETUP = {
  teacherName: "Arc Test Teacher",
  noSchoolDate: { date: "2026-09-07", label: "Labor Day" },
  quarters: [
    ["2026-08-10", "2026-10-09"],
    ["2026-10-12", "2026-12-18"],
    ["2027-01-04", "2027-03-12"],
    ["2027-03-15", "2027-05-28"]
  ] as Array<[string, string]>
};

async function seedTeachFromDay(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "＋ Unit", exact: true }).click();
  await page.getByPlaceholder("Unit title").fill("Seeing + Drawing");
  await page.getByRole("button", { name: "Add", exact: true }).click();

  const unit = page.locator(".unitMagnet").filter({ hasText: "Seeing + Drawing" }).first();
  await expect(unit).toBeVisible();
  await unit.click();
  const unitEditor = page.locator('.arcMagnetEditor[aria-label="Unit Focus"]');
  await expect(unitEditor).toBeVisible();
  await unitEditor.getByLabel("Move / schedule").fill("2026-09-01");
  await unitEditor.getByPlaceholder("Add lesson").fill("Blind contour warm-up");
  await unitEditor.getByPlaceholder("Add lesson").press("Enter");

  const lessonEditor = page.locator('.arcMagnetEditor[aria-label="Lesson details"]');
  await expect(lessonEditor).toBeVisible();
  await expect(lessonEditor.getByLabel("Title")).toHaveValue("Blind contour warm-up");
  await expect(lessonEditor.getByText("Unit: Seeing + Drawing", { exact: true })).toBeVisible();
  await lessonEditor.getByLabel("Notes").fill("Two slow drawings. Keep eyes on the object, not the page.");
  const resources = lessonEditor.locator(".editorUnitList").filter({ hasText: "Resources" });
  await resources.getByPlaceholder("Label").fill("Contour reference");
  await resources.getByPlaceholder("https://").fill("https://example.com/contour");
  await resources.getByRole("button", { name: "＋", exact: true }).click();
  await lessonEditor.getByRole("button", { name: "×", exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test("first run reaches a functional Arc desk without a fake calendar source", async ({ page }) => {
  await completeFirstRun(page, DESKTOP_SETUP);

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

test("Arc color scheme is user-selectable, asset-derived, and survives reload", async ({ page }, testInfo) => {
  await completeFirstRun(page, DESKTOP_SETUP);

  await expect(page.getByRole("radiogroup", { name: "Arc color scheme" })).toHaveCount(0);
  await page.getByRole("button", { name: "More", exact: true }).click();
  const palette = page.getByRole("radiogroup", { name: "Arc color scheme" });
  await expect(palette).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("palette-picker.png"), fullPage: false });
  await page.getByRole("radio", { name: /Blueprint/ }).click();

  await expect(page.getByRole("radio", { name: /Blueprint/ })).toHaveAttribute("aria-checked", "true");
  await expect(page.locator(".arcWorkspace")).toHaveAttribute("data-color-scheme", "blueprint");
  await expect.poll(async () => page.evaluate(() => {
    const raw = localStorage.getItem("arc.greenfield.workspace.v1");
    return raw ? JSON.parse(raw).preferences.colorScheme : null;
  })).toBe("blueprint");

  await page.reload();
  await expect(page.locator(".arcWorkspace")).toHaveAttribute("data-color-scheme", "blueprint");
  await page.getByRole("button", { name: "More", exact: true }).click();
  await expect(page.getByRole("radio", { name: /Blueprint/ })).toHaveAttribute("aria-checked", "true");
});

test("Day is a real teach-from-it surface and Year renders each school month once", async ({ page }, testInfo) => {
  await completeFirstRun(page, DESKTOP_SETUP);
  await seedTeachFromDay(page);

  await page.getByRole("button", { name: "Day", exact: true }).click();
  await expect(page.getByText("Teach from today", { exact: true })).toBeVisible();
  await expect(page.locator(".dayCourse.teachingCard")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Studio Art", exact: true })).toBeVisible();
  await expect(page.getByText("Seeing + Drawing", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Blind contour warm-up", exact: true })).toBeVisible();
  await expect(page.getByText("Two slow drawings. Keep eyes on the object, not the page.", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Contour reference", exact: true })).toBeVisible();
  const reflection = page.getByPlaceholder("A sentence is enough.");
  await reflection.fill("Students needed one more demo before the second drawing.");
  await expect(reflection).toHaveValue("Students needed one more demo before the second drawing.");
  await page.screenshot({ path: testInfo.outputPath("day-teach-surface.png"), fullPage: false });

  await page.getByRole("button", { name: "Year", exact: true }).click();
  await expect(page.getByText("Each month appears once. Quarter color changes on the actual boundary date.", { exact: true })).toBeVisible();
  await expect(page.locator(".yearMiniMonth")).toHaveCount(10);
  await expect(page.locator(".yearMiniMonth").filter({ hasText: "October" })).toHaveCount(1);
  const paintedXs = page.locator('img[src="/arc-x.png"]');
  await expect(paintedXs.first()).toBeVisible();
  expect(await paintedXs.count()).toBeGreaterThan(0);
  const loaded = await paintedXs.first().evaluate((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0);
  expect(loaded).toBeTruthy();
  await page.screenshot({ path: testInfo.outputPath("year-map.png"), fullPage: false });
});

test("desktop planning shell stays inside the viewport at supported laptop sizes", async ({ page }) => {
  await completeFirstRun(page, DESKTOP_SETUP);
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
  await completeFirstRun(page, DESKTOP_SETUP);
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
