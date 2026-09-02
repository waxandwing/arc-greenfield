import { test, expect } from "@playwright/test";
import { completeFirstRun } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

async function addMondayLesson(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Add lesson or unit to Studio Art on Mon" }).click();
  await page.getByPlaceholder("Lesson title").fill("Wheel demo");
  await page.keyboard.press("Enter");
}

async function dragLessonToTuesday(page: import("@playwright/test").Page) {
  const lesson = page.getByRole("button", { name: "Wheel demo", exact: true });
  const dateButton = page.getByRole("button", { name: "Select 2026-09-01 as paste target", exact: true });
  await lesson.dragTo(dateButton.locator("xpath=.."));
  await expect(page.getByRole("status")).toContainText(/Wheel demo would land on Tue, Sep 1, when Studio Art does not meet\. Nothing moved\./);
  await expect(page.getByRole("button", { name: "Wheel demo", exact: true })).toBeVisible();
}

test("Month uses the same meeting-day move safety as Week", async ({ page }) => {
  await completeFirstRun(page, { teacherName: "Month Safety Teacher", meetingWeekdays: [1, 3, 5] });
  await addMondayLesson(page);
  await page.getByRole("button", { name: "Month", exact: true }).click();
  await dragLessonToTuesday(page);
});

test("Quarter uses the same meeting-day move safety as Week", async ({ page }) => {
  await completeFirstRun(page, {
    teacherName: "Quarter Safety Teacher",
    meetingWeekdays: [1, 3, 5],
    quarters: [
      ["2026-08-10", "2026-10-09"],
      ["2026-10-12", "2026-12-18"],
      ["2027-01-04", "2027-03-12"],
      ["2027-03-15", "2027-05-28"]
    ]
  });
  await addMondayLesson(page);
  await page.getByRole("button", { name: "Quarter", exact: true }).click();
  await dragLessonToTuesday(page);
});
