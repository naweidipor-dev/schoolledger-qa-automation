import { test as base, expect } from "@playwright/test";
import { LoginPage } from "./pages/login.page.js";
import { StudentsPage } from "./pages/students.page.js";

export const test = base.extend({
  credentials: async ({}, use) => {
    await use({
      admin: { username: "qa.admin", password: "Admin123!" },
      viewer: { username: "viewer", password: "Viewer123!" }
    });
  },

  resetDemoData: [async ({ request, credentials }, use) => {
    const loginResponse = await request.post("/api/auth/login", { data: credentials.admin });
    expect(loginResponse.ok()).toBeTruthy();
    const { token } = await loginResponse.json();
    const resetResponse = await request.post("/api/reset", { headers: { Authorization: `Bearer ${token}` } });
    expect(resetResponse.ok()).toBeTruthy();
    await use();
  }, { auto: true }],

  loginPage: async ({ page }, use) => { await use(new LoginPage(page)); },
  studentsPage: async ({ page }, use) => { await use(new StudentsPage(page)); }
});

export { expect };
