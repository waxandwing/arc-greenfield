import { test, expect, type Page } from "@playwright/test";
import { completeFirstRun } from "./helpers";

const QUARTERS: Array<[string, string]> = [
  ["2026-08-10", "2026-10-09"],
  ["2026-10-12", "2026-12-18"],
  ["2027-01-04", "2027-03-12"],
  ["2027-03-15", "2027-05-28"]
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

async function addLesson(page: Page, day: "Mon" | "Tue", title: string) {
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
  await completeFirstRun(page, {
    teacherName: "Arc MWF Teacher",
    meetingWeekdays: [1, 3, 5]
  });

  await addLesson(page, "Mon", "Wheel demo");
  const actions = page.locator('.magnetActions[aria-label="Actions for Wheel demo"]');
  await actions.getByRole("button", { name: "Move Wheel demo later" }).click();

  await expect(page.getByRole("status")).toContainText(/Wheel demo would land on Tue, .* when Studio Art does not meet\. Nothing moved\./);
  await expect(page.getByText("Wheel demo", { exact: true })).toBeVisible();
});

test("Month drag refuses a day the class does not meet and keeps the Lesson", async ({ page }) => {
  await completeFirstRun(page, {
    teacherName: "Arc Month Safety Teacher",
    meetingWeekdays: [1, 3, 5]
  });
  await addLesson(page, "Mon", "Wheel demo");

  await page.getByRole("button", { name: "Month", exact: true }).click();
  await expect(page.locator(".monthSurface")).toBeVisible();

  const source = page.getByRole("button", { name: "Wheel demo", exact: true });
  const target = page.getByRole("button", { name: "Select 2026-09-01 as paste target", exact: true }).locator("..");
  await source.dragTo(target);

  await expect(page.getByRole("status")).toContainText(/Wheel demo would land on Tue, .* when Studio Art does not meet\. Nothing moved\./);
  await expect(page.getByRole("button", { name: "Wheel demo", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Select 2026-08-31 as paste target", exact: true }).locator("..")).toContainText("Wheel demo");
});

test("Quarter drag names a collision and preserves both Lessons", async ({ page }) => {
  await completeFirstRun(page, {
    teacherName: "Arc Quarter Safety Teacher",
    quarters: QUARTERS
  });
  await addLesson(page, "Mon", "Discussion");
  await addLesson(page, "Tue", "Quiz");

  await page.getByRole("button", { name: "Quarter", exact: true }).click();
  await expect(page.locator(".quarterSurface")).toBeVisible();

  const source = page.getByRole("button", { name: "Discussion", exact: true });
  const target = page.getByRole("button", { name: "Select 2026-09-01 as paste target", exact: true }).locator("..");
  await source.dragTo(target);

  await expect(page.getByRole("status")).toContainText("Quiz is already scheduled there. Nothing moved.");
  await expect(page.getByRole("button", { name: "Discussion", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Quiz", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Select 2026-08-31 as paste target", exact: true }).locator("..")).toContainText("Discussion");
});
