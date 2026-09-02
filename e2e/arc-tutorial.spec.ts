import { test, expect, type Page } from "@playwright/test";

async function completeSetup(page: Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByPlaceholder("What should Arc call you?").fill("Tutorial Teacher");
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

async function openExploreArc(page: Page) {
  await page.getByRole("button", { name: "More", exact: true }).click();
  await page.getByRole("button", { name: "Review Arc tutorial", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Getting to Know Arc" })).toBeVisible();
}

test("new teachers reach the real calendar without a forced tutorial", async ({ page }, testInfo) => {
  await completeSetup(page);

  await expect(page.getByRole("heading", { name: "Getting to Know Arc" })).toHaveCount(0);
  await expect(page.locator(".arcCalendarViewport")).toBeVisible();
  await expect(page.getByRole("button", { name: "Fridge", exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("first-use-calendar-no-tour.png"), fullPage: false });

  await page.reload();
  await expect(page.getByRole("button", { name: "Arc home" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Getting to Know Arc" })).toHaveCount(0);
});

test("Explore Arc is optional, restartable, and uses the canonical help topics", async ({ page }, testInfo) => {
  await completeSetup(page);
  await openExploreArc(page);

  await expect(page.getByRole("tab", { name: /Calendar/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("The calendar is home.", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("explore-arc-calendar-topic.png"), fullPage: false });

  const topics = [
    "The Fridge keeps work without forcing a date.",
    "Units own ordered Lessons.",
    "A Lesson can be committed in stages.",
    "Move the plan instead of rebuilding it.",
    "This is an attention strip, not another task app.",
    "Shift is for the day that went sideways.",
    "Day is the teach-from-it view.",
    "Undo freely. Save state must tell the truth."
  ];

  for (const title of topics) {
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  }

  await expect(page.getByText("The current beta saves on this device; Arc must not imply cloud sync until it exists.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Done exploring", exact: true }).click();
  await expect(page.getByRole("button", { name: "Arc home" })).toBeVisible();

  await openExploreArc(page);
  await expect(page.getByText("The calendar is home.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Back to Arc", exact: true }).click();
  await expect(page.getByRole("button", { name: "Arc home" })).toBeVisible();
});

test("exploring help does not alter teacher setup", async ({ page }) => {
  await completeSetup(page);
  await openExploreArc(page);
  await page.getByRole("button", { name: "Back to Arc", exact: true }).click();

  await page.getByRole("button", { name: "More", exact: true }).click();
  await page.getByRole("button", { name: "School + classes setup", exact: true }).click();
  await expect(page.getByPlaceholder("What should Arc call you?")).toHaveValue("Tutorial Teacher");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByText("Studio Art", { exact: true })).toBeVisible();
  await expect(page.getByText("2", { exact: true }).first()).toBeVisible();
});

test("Explore Arc can be navigated without a pointer", async ({ page }) => {
  await completeSetup(page);
  await openExploreArc(page);

  await page.getByRole("tab", { name: /Calendar/ }).focus();
  const focusOrder: string[] = [];
  for (let index = 0; index < 18; index += 1) {
    const label = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      return active?.getAttribute("aria-label") || active?.textContent?.trim().replace(/\s+/g, " ").slice(0, 80) || "";
    });
    focusOrder.push(label);
    await page.keyboard.press("Tab");
  }
  expect(focusOrder.some((value) => /Back to Arc/i.test(value))).toBeTruthy();
  expect(focusOrder.some((value) => /^Next$/i.test(value))).toBeTruthy();

  await page.getByRole("button", { name: "Next", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("The Fridge keeps work without forcing a date.", { exact: true })).toBeVisible();
});
