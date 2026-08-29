import { expect } from "@playwright/test";

export class StudentsPage {
  constructor(page) {
    this.page = page;
    this.addStudent = page.getByRole("button", { name: "Add student" });
    this.search = page.locator("#student-search");
    this.rows = page.getByTestId("student-row");
  }

  async open() { await this.page.getByRole("button", { name: "Students" }).click(); }

  async createStudent(student) {
    await this.addStudent.click();
    await this.page.getByTestId("firstName").fill(student.firstName);
    await this.page.getByTestId("lastName").fill(student.lastName);
    await this.page.getByTestId("email").fill(student.email);
    await this.page.getByTestId("grade").fill(student.grade);
    await this.page.getByTestId("guardianName").fill(student.guardianName);
    await this.page.getByRole("button", { name: "Create student" }).click();
  }

  async expectStudentVisible(fullName) {
    await this.search.fill(fullName);
    await expect(this.rows.filter({ hasText: fullName })).toHaveCount(1);
  }
}
