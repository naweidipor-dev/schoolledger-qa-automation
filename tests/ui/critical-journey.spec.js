import { expect, test } from "./fixtures.js";

test("admin can sign in and view reconciled dashboard metrics", async ({ page, loginPage, credentials }) => {
  await loginPage.signInSuccessfully(credentials.admin.username, credentials.admin.password);
  await expect(page.locator("#metrics .metric-card")).toHaveCount(5);
  await expect(page.getByText("Ready for testing")).toBeVisible();
});

test("invalid login shows a useful error", async ({ loginPage, credentials }) => {
  await loginPage.signIn(credentials.admin.username, "wrong-password");
  await expect(loginPage.error).toContainText("incorrect");
});

test("admin creates a student and finds it using search", async ({ loginPage, studentsPage, credentials }) => {
  await loginPage.signInSuccessfully(credentials.admin.username, credentials.admin.password);
  await studentsPage.open();
  await studentsPage.createStudent({
    firstName: "Automation",
    lastName: "Candidate",
    email: `candidate-${Date.now()}@example.test`,
    grade: "Grade 8",
    guardianName: "Test Guardian"
  });
  await studentsPage.expectStudentVisible("Automation Candidate");
});

test("viewer sees read-only navigation without write actions", async ({ loginPage, studentsPage, credentials }) => {
  await loginPage.signInSuccessfully(credentials.viewer.username, credentials.viewer.password);
  await studentsPage.open();
  await expect(studentsPage.addStudent).toBeHidden();
  await expect(studentsPage.rows.first()).toBeVisible();
});

test("SDET Lab diagnostics detect a controlled stale-dashboard fault", async ({ page, loginPage, credentials }) => {
  await loginPage.signInSuccessfully(credentials.admin.username, credentials.admin.password);
  await page.getByRole("button", { name: /SDET Lab/ }).click();
  await page.getByLabel("Simulate stale dashboard total").check();
  await page.getByRole("button", { name: "Apply lab configuration" }).click();
  await page.getByRole("button", { name: "Run checks" }).click();
  await expect(page.locator("#diagnostic-summary")).toContainText("NO-GO");
  await page.getByLabel("Simulate stale dashboard total").uncheck();
  await page.getByRole("button", { name: "Apply lab configuration" }).click();
});
