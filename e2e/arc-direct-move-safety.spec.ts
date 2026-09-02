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

test("direct Week move refuses a day the class does not meet", async ({ page }) => {
  await completeFirstRun(page, { teacherName: "Arc MWF Teacher" });
  await expect(page.locator(".arcSaveStatus")).toContainText("Saved on this device");
  await page.evaluate(() => {
    const key = "arc.greenfield.workspace.v1";
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const workspace = JSON.parse(raw);
    workspace.courses[0].meetingPattern = { kind: "weekdays", weekdays: [1, 3, 5] };
    workspace.updatedAt = new Date(Date.now() + 5).toISOString();
    localStorage.setItem(key, JSON.stringify(workspace));
  });
  await page.reload();
  await expect(page.getByRole("button", { name: "Arc home" })).toBeVisible();

  await addLesson(page, "Mon", "Wheel demo");
  const actions = page.locator('.magnetActions[aria-label="Actions for Wheel demo"]');
  await actions.getByRole("button", { name: "Move Wheel demo later" }).click();

  await expect(page.getByRole("status")).toContainText(/Wheel demo would land on Tue, .* when Studio Art does not meet\. Nothing moved\./);
  await expect(page.getByText("Wheel demo", { exact: true })).toBeVisible();
});
