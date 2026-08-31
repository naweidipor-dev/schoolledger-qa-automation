import { expect, test } from "./fixtures.js";

test("login page exposes accessible names and status messaging", { tag: "@regression" }, async ({ page }) => {
  await test.step("Open the login page", async () => {
    await page.goto("/");
  });

  await test.step("Verify semantic headings and labelled form controls", async () => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(
      "Practise quality engineering on a real workflow."
    );
    await expect(page.getByLabel("Username")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Show password" })).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("alert")).toBeAttached();
  });
});

test("login controls support keyboard navigation and password disclosure", { tag: "@regression" }, async ({ page }) => {
  await page.goto("/");
  const username = page.getByLabel("Username");
  const password = page.getByLabel("Password", { exact: true });
  const passwordToggle = page.getByRole("button", { name: "Show password" });

  await test.step("Move through the login controls with the keyboard", async () => {
    await username.focus();
    await expect(username).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(password).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(passwordToggle).toBeFocused();
  });

  await test.step("Operate the password disclosure without a mouse", async () => {
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Hide password" })).toHaveAttribute("aria-pressed", "true");
    await expect(password).toHaveAttribute("type", "text");
  });
});
