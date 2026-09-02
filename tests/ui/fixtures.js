import { test as base, expect } from "@playwright/test";
import { SchoolLedgerApi } from "./api/school-ledger.api.js";
import { LoginPage } from "./pages/login.page.js";
import { StudentsPage } from "./pages/students.page.js";
import { FinancePage } from "./pages/finance.page.js";

export const test = base.extend({
  credentials: async ({}, use) => {
    await use({
      admin: { username: "qa.admin", password: "Admin123!" },
      viewer: { username: "viewer", password: "Viewer123!" }
    });
  },

  api: async ({ request }, use) => {
    await use(new SchoolLedgerApi(request));
  },

  resetDemoData: [async ({ api, credentials }, use) => {
    await api.resetDemoData(credentials.admin);
    await use();
  }, { auto: true }],

  loginPage: async ({ page }, use) => { await use(new LoginPage(page)); },
  studentsPage: async ({ page }, use) => { await use(new StudentsPage(page)); },
  financePage: async ({ page }, use) => { await use(new FinancePage(page)); }
});

export { expect };
