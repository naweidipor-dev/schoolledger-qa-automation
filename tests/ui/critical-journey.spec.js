import { expect, test } from "@playwright/test";

async function login(page, username = "qa.admin", password = "Admin123!") {
  await page.goto("/");
  await page.getByTestId("username").fill(username);
  await page.getByTestId("password").fill(password);
  await page.getByTestId("login-submit").click();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
}

test.beforeEach(async ({ request }) => {
  const loginResponse = await request.post("/api/auth/login", { data: { username: "qa.admin", password: "Admin123!" } });
  const { token } = await loginResponse.json();
  await request.post("/api/reset", { headers: { Authorization: `Bearer ${token}` } });
});

test("admin can sign in and view reconciled dashboard metrics", async ({ page }) => {
  await login(page);
  await expect(page.locator("#metrics .metric-card")).toHaveCount(5);
  await expect(page.getByText("Ready for testing")).toBeVisible();
});

test("invalid login shows a useful error", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("username").fill("qa.admin");
  await page.getByTestId("password").fill("wrong-password");
  await page.getByTestId("login-submit").click();
  await expect(page.getByRole("alert")).toContainText("incorrect");
});

test("admin creates a student and finds it using search", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Students" }).click();
  await page.getByRole("button", { name: "Add student" }).click();
  await page.getByTestId("firstName").fill("Automation");
  await page.getByTestId("lastName").fill("Candidate");
  await page.getByTestId("email").fill(`candidate-${Date.now()}@example.test`);
  await page.getByTestId("grade").fill("Grade 8");
  await page.getByTestId("guardianName").fill("Test Guardian");
  await page.getByRole("button", { name: "Create student" }).click();
  await page.locator("#student-search").fill("Automation Candidate");
  const createdStudent = page.getByTestId("student-row").filter({ hasText: "Automation Candidate" });
  await expect(createdStudent).toHaveCount(1);
});

test("viewer sees read-only navigation without write actions", async ({ page }) => {
  await login(page, "viewer", "Viewer123!");
  await page.getByRole("button", { name: "Students" }).click();
  await expect(page.getByRole("button", { name: "Add student" })).toBeHidden();
  await expect(page.getByTestId("student-row").first()).toBeVisible();
});

test("SDET Lab diagnostics detect a controlled stale-dashboard fault", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: /SDET Lab/ }).click();
  await page.getByLabel("Simulate stale dashboard total").check();
  await page.getByRole("button", { name: "Apply lab configuration" }).click();
  await page.getByRole("button", { name: "Run checks" }).click();
  await expect(page.locator("#diagnostic-summary")).toContainText("NO-GO");
  await page.getByLabel("Simulate stale dashboard total").uncheck();
  await page.getByRole("button", { name: "Apply lab configuration" }).click();
});
