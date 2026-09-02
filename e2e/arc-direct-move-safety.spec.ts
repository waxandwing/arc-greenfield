import { test, expect } from "@playwright/test";
import { completeFirstRun } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

async function addLesson(page: import("@playwright/test").Page, day: "Mon" | "Tue", title: string) {
  await page.getByRole("button", { name: `Add lesson or unit to Studio Art on ${day}` }).click();
  await page.getByPlaceholder("Lesson title").fill(title);
  await page.keyboard.press("Enter");
}

test("direct Week move names a collision and preserves both Lessons", async ({ page }) => {
  await completeFirstRun(page, { teacherName: "Arc Safety Teacher" });
  await addLesson(page, "Mon", "Discussion");
  await addLesson(page, "Tue", "Quiz");

  const actions = page.locator('.magnetActions[aria-label="Actions for Discussion"]');
  await actions.getByRole("button", { name: "Move Discussion later" }).click();

  await expect(page.getByRole("status")).toContainText("Quiz is already scheduled there. Nothing moved.");
  await expect(page.getByText("Discussion", { exact: true })).toBeVisible();
  await expect(page.getByText("Quiz", { exact: true })).toBeVisible();
});
