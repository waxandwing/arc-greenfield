import { expect, type Page } from "@playwright/test";

type FirstRunOptions = {
  teacherName?: string;
  courseName?: string;
  periodLabel?: string;
  firstStudentDay?: string;
  lastStudentDay?: string;
  noSchoolDate?: { date: string; label: string } | null;
  quarters?: Array<[string, string]> | null;
  clearStorageOnce?: boolean;
  completeTutorial?: boolean;
  weekendsVisible?: boolean;
};

export async function completeFirstRun(page: Page, options: FirstRunOptions = {}) {
  const {
    teacherName = "Arc Test Teacher",
    courseName = "Studio Art",
    periodLabel = "2",
    firstStudentDay = "2026-08-10",
    lastStudentDay = "2027-05-28",
    noSchoolDate = null,
    quarters = null,
    clearStorageOnce = false,
    completeTutorial = false,
    weekendsVisible = false
  } = options;

  await page.goto("/");
  if (clearStorageOnce) {
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  }

  await expect(page.getByRole("heading", { name: "Make Arc yours." })).toBeVisible();
  await page.getByPlaceholder("What should Arc call you?").fill(teacherName);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByPlaceholder("Course name").fill(courseName);
  await page.getByPlaceholder("Period / block").fill(periodLabel);
  await page.getByRole("button", { name: "Add class" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("First student day", { exact: true }).fill(firstStudentDay);
  await page.getByLabel("Last student day", { exact: true }).fill(lastStudentDay);

  if (noSchoolDate) {
    await page.getByLabel("No-school date", { exact: true }).fill(noSchoolDate.date);
    await page.getByLabel("No-school date label", { exact: true }).fill(noSchoolDate.label);
    await page.getByRole("button", { name: "Add", exact: true }).click();
  }

  if (weekendsVisible) {
    await page.getByLabel("Show weekends in calendar views").check();
  }

  if (quarters) {
    await page.locator("details.quarterDetails > summary").click();
    for (let index = 0; index < quarters.length; index += 1) {
      await page.getByLabel(`Quarter ${index + 1} start`).fill(quarters[index][0]);
      await page.getByLabel(`Quarter ${index + 1} end`).fill(quarters[index][1]);
    }
  }

  await page.getByRole("button", { name: "Open my desk" }).click();
  await expect(page.getByRole("heading", { name: "Getting to Know Arc" })).toBeVisible();
  await expect(page.getByRole("tablist", { name: "Explore Arc topics" })).toBeVisible();

  if (completeTutorial) {
    for (let guard = 0; guard < 20; guard += 1) {
      const next = page.getByRole("button", { name: "Next", exact: true });
      if ((await next.count()) === 0) break;
      await next.click();
    }
    await page.getByRole("button", { name: "Done exploring", exact: true }).click();
  } else {
    await page.getByRole("button", { name: "Back to Arc", exact: true }).click();
  }

  await expect(page.getByRole("button", { name: "Arc home" })).toBeVisible();
}
