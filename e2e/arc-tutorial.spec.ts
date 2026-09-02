import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test("new teachers can complete the eight-step Arc walkthrough and are not forced through it again", async ({ page }, testInfo) => {
  await page.goto("/");
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
