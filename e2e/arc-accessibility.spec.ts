import { test, expect, type Page } from "@playwright/test";

async function completeFirstRun(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Make Arc yours." })).toBeVisible();
  await page.getByPlaceholder("What should Arc call you?").fill("Arc Accessibility Teacher");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByPlaceholder("Course name").fill("Studio Art");
  await page.getByPlaceholder("Period / block").fill("2");
  await page.getByRole("button", { name: "Add class" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("First student day", { exact: true }).fill("2026-08-10");
  await page.getByLabel("Last student day", { exact: true }).fill("2027-05-28");
  await page.getByRole("button", { name: "Open my desk" }).click();
  await expect(page.getByRole("button", { name: "Arc home" })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test("Arc remains operable at an effective 200 percent desktop viewport", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "zoom-200");
  await completeFirstRun(page);
  await page.setViewportSize({ width: 720, height: 450 });

  await expect(page.getByRole("button", { name: "Fridge", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Shift", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "More", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save now", exact: true })).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
    calendarWidth: document.querySelector('.arcCalendarViewport')?.getBoundingClientRect().width ?? 0,
    calendarHeight: document.querySelector('.arcCalendarViewport')?.getBoundingClientRect().height ?? 0
  }));
  expect(dimensions.scrollWidth, `document horizontal overflow ${JSON.stringify(dimensions)}`).toBeLessThanOrEqual(dimensions.innerWidth + 4);
  expect(dimensions.scrollHeight, `document vertical overflow ${JSON.stringify(dimensions)}`).toBeLessThanOrEqual(dimensions.innerHeight + 4);
  expect(dimensions.calendarWidth).toBeGreaterThan(300);
  expect(dimensions.calendarHeight).toBeGreaterThan(120);

  await page.getByRole("button", { name: "Fridge", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Fridge Door", exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("zoom-200-fridge.png"), fullPage: false });
});

test("reduced motion and forced colors keep the primary planning path reachable", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "reduced-motion-high-contrast");
  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  await completeFirstRun(page);

  const media = await page.evaluate(() => ({
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    forcedColors: matchMedia("(forced-colors: active)").matches
  }));
  expect(media.reducedMotion).toBeTruthy();
  expect(media.forcedColors).toBeTruthy();

  await page.keyboard.press("Tab");
  const encountered = new Set<string>();
  for (let index = 0; index < 32; index += 1) {
    const label = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      return active?.getAttribute("aria-label") || active?.textContent?.trim().slice(0, 60) || "";
    });
    encountered.add(label);
    await page.keyboard.press("Tab");
  }
  expect([...encountered].some((value) => /Fridge/i.test(value))).toBeTruthy();
  expect([...encountered].some((value) => /Shift/i.test(value))).toBeTruthy();
  expect([...encountered].some((value) => /Save now/i.test(value))).toBeTruthy();

  await page.getByRole("button", { name: "Day", exact: true }).click();
  await expect(page.getByText("Teach from today", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("forced-colors-day.png"), fullPage: false });
});
