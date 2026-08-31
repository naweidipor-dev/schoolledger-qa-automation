import { expect, test } from "./fixtures.js";

const failures = [
  {
    name: "503 service unavailable",
    status: 503,
    contentType: "application/json",
    body: JSON.stringify({ error: { message: "Sign-in service is temporarily unavailable. Please try again." } }),
    expectedMessage: "Sign-in service is temporarily unavailable. Please try again."
  },
  {
    name: "502 non-JSON gateway error",
    status: 502,
    contentType: "text/html",
    body: "<h1>Bad Gateway</h1>",
    expectedMessage: "Request failed with 502"
  }
];

for (const failure of failures) {
  test(`login recovers after a ${failure.name}`, { tag: ["@regression", "@resilience"] }, async ({ page, loginPage, credentials }) => {
    await test.step("Simulate one failed login response in the browser", async () => {
      // The API reset fixture is unaffected; only this page's first login is mocked.
      await page.route("**/api/auth/login", route => route.fulfill({
        status: failure.status,
        contentType: failure.contentType,
        body: failure.body
      }), { times: 1 });
    });

    await test.step("Verify the error is visible and login remains available", async () => {
      await loginPage.signIn(credentials.admin.username, credentials.admin.password);
      await expect(loginPage.error).toHaveText(failure.expectedMessage);
      await expect(loginPage.submit).toBeVisible();
      await expect(loginPage.submit).toBeEnabled();
      await expect(page.getByRole("heading", { name: "Overview", exact: true })).toBeHidden();
    });

    await test.step("Retry on the same page against the real API", async () => {
      // Do not reopen the page: verify the existing form recovers without a refresh.
      await loginPage.submit.click();
      await expect(page.getByRole("heading", { name: "Overview", exact: true })).toBeVisible();
      await expect(page.locator("#metrics .metric-card")).toHaveCount(5);
      await expect(page.locator("#login-error")).toHaveText("");
    });
  });
}
