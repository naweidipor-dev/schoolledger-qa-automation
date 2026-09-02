import { expect, test } from "@playwright/test";

export class SchoolLedgerApi {
  constructor(request) {
    this.request = request;
  }

  async authenticate(credentials) {
    return test.step(`Authenticate through the API as ${credentials.username}`, async () => {
      const response = await this.request.post("/api/auth/login", { data: credentials });
      expect(response.ok()).toBeTruthy();
      const { token } = await response.json();
      return token;
    });
  }

  async resetDemoData(credentials) {
    await test.step("Reset SchoolLedger test data through the API", async () => {
      const token = await this.authenticate(credentials);
      const response = await this.request.post("/api/reset", {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect(response.ok()).toBeTruthy();
    });
  }

  async createStudent(credentials, student) {
    return test.step(`Create ${student.firstName} ${student.lastName} through the API`, async () => {
      const token = await this.authenticate(credentials);
      const response = await this.request.post("/api/students", {
        headers: { Authorization: `Bearer ${token}` },
        data: student
      });
      expect(response.status()).toBe(201);
      return response.json();
    });
  }

  async getDashboard(credentials) {
    return test.step("Read reconciled dashboard totals through the API", async () => {
      const token = await this.authenticate(credentials);
      const response = await this.request.get("/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect(response.ok()).toBeTruthy();
      return response.json();
    });
  }
}
