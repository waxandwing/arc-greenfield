import { test, expect, type Page } from "@playwright/test";

async function reachTutorial(page: Page) {
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
  await expect(page.getByRole("heading", { name: "How Arc works." })).toBeVisible();
}

async function finishTutorial(page: Page) {
  for (let index = 0; index < 7; index += 1) {
    await page.getByRole("button", { name: "Next", exact: true }).click();
  }
  await page.getByRole("button", { name: "Open Arc", exact: true }).click();
  await expect(page.getByRole("button", { name: "Arc home" })).toBeVisible();
}

test("new teachers can complete the eight-step Arc walkthrough and are not forced through it again", async ({ page }, testInfo) => {
  await reachTutorial(page);

  await expect(page.getByRole("tab", { name: /Calendar/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("The calendar is home.", { exact: true })).toBeVisible();
  await expect(page.getByText("The Fridge holds things before they have a date.", { exact: true })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("tutorial-first-step.png"), fullPage: false });

  const expectedTitles = [
    "The Fridge holds things before they have a date.",
    "Units own Lessons.",
    "Move plans instead of rebuilding them.",
    "Must / Should / Could is a working strip, not another task app.",
    "Shift is for the day that went sideways.",
    "Day is the teach-from-it view.",
    "Undo freely. Save deliberately."
  ];

  for (const title of expectedTitles) {
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  }

  await expect(page.getByText("The current beta saves locally on this device; cloud sync is not being implied until it exists.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Open Arc", exact: true }).click();
  await expect(page.getByRole("button", { name: "Arc home" })).toBeVisible();

  const tutorialCompleted = await page.evaluate(() => {
    const raw = localStorage.getItem("arc.greenfield.workspace.v1");
    return raw ? JSON.parse(raw).preferences.tutorialCompleted : null;
  });
  expect(tutorialCompleted).toBe(true);

  await page.reload();
  await expect(page.getByRole("button", { name: "Arc home" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "How Arc works." })).toHaveCount(0);
});

test("returning teachers can review the tutorial without losing setup", async ({ page }) => {
  await reachTutorial(page);
  await finishTutorial(page);

  await page.getByRole("button", { name: "More", exact: true }).click();
  await page.getByRole("button", { name: "Review Arc tutorial", exact: true }).click();
  await expect(page.getByRole("heading", { name: "How Arc works." })).toBeVisible();
  await expect(page.getByText("Tutorial Teacher", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Skip tutorial", exact: true }).click();
  await expect(page.getByRole("button", { name: "Arc home" })).toBeVisible();
  await page.getByRole("button", { name: "More", exact: true }).click();
  await page.getByRole("button", { name: "School + classes setup", exact: true }).click();
  await expect(page.getByPlaceholder("What should Arc call you?")).toHaveValue("Tutorial Teacher");
  await expect(page.getByText("Studio Art", { exact: true })).toBeVisible();
});

test("the tutorial can be navigated without a pointer", async ({ page }) => {
  await reachTutorial(page);

  await page.getByRole("tab", { name: /Calendar/ }).focus();
  await page.keyboard.press("Tab");
  const focusOrder: string[] = [];
  for (let index = 0; index < 14; index += 1) {
    const label = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      return active?.textContent?.trim().replace(/\s+/g, " ").slice(0, 80) || active?.getAttribute("aria-label") || "";
    });
    focusOrder.push(label);
    await page.keyboard.press("Tab");
  }
  expect(focusOrder.some((value) => /Skip tutorial/i.test(value))).toBeTruthy();
  expect(focusOrder.some((value) => /^Next$/i.test(value))).toBeTruthy();

  await page.getByRole("button", { name: "Next", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("The Fridge holds things before they have a date.", { exact: true })).toBeVisible();
});
