import { expect, test } from "./fixtures.js";

test("admin can sign in and view reconciled dashboard metrics", { tag: ["@smoke", "@regression"] }, async ({ page, loginPage, credentials }) => {
  await loginPage.signInSuccessfully(credentials.admin.username, credentials.admin.password);
  await expect(page.locator("#metrics .metric-card")).toHaveCount(5);
  await expect(page.getByText("Ready for testing")).toBeVisible();
});

test("invalid login shows a useful error", { tag: ["@smoke", "@regression"] }, async ({ loginPage, credentials }) => {
  await loginPage.signIn(credentials.admin.username, "wrong-password");
  await expect(loginPage.error).toContainText("incorrect");
});

test("admin creates a student and finds it using search", { tag: "@regression" }, async ({ loginPage, studentsPage, credentials }) => {
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

test("admin seeds a student through the API and verifies it in the UI", { tag: "@regression" }, async ({ api, loginPage, studentsPage, credentials }) => {
  const student = {
    firstName: "Hybrid",
    lastName: "Learner",
    email: `hybrid-${Date.now()}@example.test`,
    grade: "Grade 9",
    guardianName: "API Setup Guardian",
    status: "active"
  };

  await api.createStudent(credentials.admin, student);
  await loginPage.signInSuccessfully(credentials.admin.username, credentials.admin.password);
  await studentsPage.open();
  await studentsPage.expectStudentVisible(`${student.firstName} ${student.lastName}`);
});

test("admin completes an invoice payment and reconciles the dashboard", { tag: "@regression" }, async ({ api, financePage, loginPage, studentsPage, credentials }) => {
  const uniqueId = Date.now();
  const student = {
    firstName: "Finance",
    lastName: `Journey${uniqueId}`,
    email: `finance-${uniqueId}@example.test`,
    grade: "Grade 10",
    guardianName: "Reconciliation Guardian"
  };
  const description = `Automation tuition ${uniqueId}`;
  const reference = `E2E-${uniqueId}`;

  await loginPage.signInSuccessfully(credentials.admin.username, credentials.admin.password);
  await studentsPage.open();
  await studentsPage.createStudent(student);
  await studentsPage.expectStudentVisible(`${student.firstName} ${student.lastName}`);

  await financePage.openInvoices();
  await financePage.createInvoice({
    studentOption: `${student.firstName} ${student.lastName} · ${student.grade}`,
    description,
    amount: "125.00",
    dueDate: "2026-12-31"
  });
  await financePage.recordPaymentFromInvoice({
    description,
    amount: "125.00",
    method: "bank_transfer",
    reference
  });
  await financePage.expectInvoicePaid(description);
  await financePage.expectPaymentVisible(reference, "£125.00");

  const { metrics } = await api.getDashboard(credentials.admin);
  await financePage.expectDashboardMetrics(metrics, reference);
});

test("viewer sees read-only navigation without write actions", { tag: "@regression" }, async ({ loginPage, studentsPage, credentials }) => {
  await loginPage.signInSuccessfully(credentials.viewer.username, credentials.viewer.password);
  await studentsPage.open();
  await expect(studentsPage.addStudent).toBeHidden();
  await expect(studentsPage.rows.first()).toBeVisible();
});

test("SDET Lab diagnostics detect a controlled stale-dashboard fault", { tag: "@regression" }, async ({ page, loginPage, credentials }) => {
  await loginPage.signInSuccessfully(credentials.admin.username, credentials.admin.password);
  await page.getByRole("button", { name: /SDET Lab/ }).click();
  await page.getByLabel("Simulate stale dashboard total").check();
  await page.getByRole("button", { name: "Apply lab configuration" }).click();
  await page.getByRole("button", { name: "Run checks" }).click();
  await expect(page.locator("#diagnostic-summary")).toContainText("NO-GO");
  await page.getByLabel("Simulate stale dashboard total").uncheck();
  await page.getByRole("button", { name: "Apply lab configuration" }).click();
});
