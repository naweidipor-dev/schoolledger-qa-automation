import { expect, test } from "./fixtures.js";

test("login page fits a mobile viewport without horizontal overflow", { tag: ["@regression", "@mobile"] }, async ({ page, loginPage }) => {
  await loginPage.open();

  await test.step("Verify the mobile login controls remain visible and usable", async () => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(loginPage.username).toBeVisible();
    await expect(loginPage.password).toBeVisible();
    await expect(loginPage.submit).toBeVisible();

    const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const contentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(contentWidth).toBeLessThanOrEqual(viewportWidth);
  });
});

test("signed-in user can open mobile navigation and reach Students", { tag: ["@regression", "@mobile"] }, async ({ page, loginPage, credentials }) => {
  await loginPage.signInSuccessfully(credentials.admin.username, credentials.admin.password);

  await test.step("Open the collapsed navigation menu", async () => {
    const menuButton = page.getByRole("button", { name: "Toggle navigation" });
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    await expect(page.locator(".sidebar")).toHaveClass(/open/);
  });

  await test.step("Navigate to the Students directory", async () => {
    await page.getByRole("button", { name: "Students" }).click();
    await expect(page.getByRole("heading", { name: "Students", exact: true })).toBeVisible();
    await expect(page.getByLabel("Search students")).toBeVisible();
  });
});
