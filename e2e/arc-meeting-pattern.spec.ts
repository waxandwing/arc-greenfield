import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test("class meeting days persist from onboarding into the Arc workspace", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByPlaceholder("What should Arc call you?").fill("Schedule Test Teacher");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByPlaceholder("Course name").fill("Ceramics");
  await page.getByPlaceholder("Period / block").fill("3");
  await page.getByRole("button", { name: "Add class" }).click();

  const meetingDays = page.getByRole("group", { name: "Ceramics meeting days" });
  await expect(meetingDays).toBeVisible();
  await meetingDays.getByRole("button", { name: "Ceramics meets Tuesday" }).click();
  await meetingDays.getByRole("button", { name: "Ceramics meets Thursday" }).click();
  await expect(meetingDays.getByRole("button", { name: "Ceramics meets Monday" })).toHaveAttribute("aria-pressed", "true");
  await expect(meetingDays.getByRole("button", { name: "Ceramics meets Tuesday" })).toHaveAttribute("aria-pressed", "false");
  await expect(meetingDays.getByRole("button", { name: "Ceramics meets Wednesday" })).toHaveAttribute("aria-pressed", "true");
  await expect(meetingDays.getByRole("button", { name: "Ceramics meets Thursday" })).toHaveAttribute("aria-pressed", "false");
  await expect(meetingDays.getByRole("button", { name: "Ceramics meets Friday" })).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({ path: testInfo.outputPath("meeting-days-mwf.png"), fullPage: false });

  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("First student day", { exact: true }).fill("2026-08-10");
  await page.getByLabel("Last student day", { exact: true }).fill("2027-05-28");
  await page.getByRole("button", { name: "Open my desk" }).click();
  await expect(page.getByRole("heading", { name: "Getting to Know Arc" })).toBeVisible();
  await page.getByRole("button", { name: "Back to Arc", exact: true }).click();
  await expect(page.getByRole("button", { name: "Arc home" })).toBeVisible();

  const stored = await page.evaluate(() => {
    const raw = localStorage.getItem("arc.greenfield.workspace.v1");
    const workspace = raw ? JSON.parse(raw) : null;
    return workspace?.courses?.[0]?.meetingPattern ?? null;
  });
  expect(stored).toEqual({ kind: "weekdays", weekdays: [1, 3, 5] });
});
