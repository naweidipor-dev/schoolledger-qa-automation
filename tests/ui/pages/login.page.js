import { expect, test } from "@playwright/test";

export class LoginPage {
  constructor(page) {
    this.page = page;
    this.username = page.getByTestId("username");
    this.password = page.getByTestId("password");
    this.submit = page.getByTestId("login-submit");
    this.error = page.getByRole("alert");
  }

  async open() {
    await test.step("Open the SchoolLedger login page", async () => {
      await this.page.goto("/");
    });
  }

  async signIn(username, password) {
    await test.step(`Sign in as ${username}`, async () => {
      await this.open();
      await this.username.fill(username);
      await this.password.fill(password);
      await this.submit.click();
    });
  }

  async signInSuccessfully(username, password) {
    await this.signIn(username, password);
    await test.step("Verify the Overview dashboard is displayed", async () => {
      await expect(this.page.getByRole("heading", { name: "Overview" })).toBeVisible();
    });
  }
}
