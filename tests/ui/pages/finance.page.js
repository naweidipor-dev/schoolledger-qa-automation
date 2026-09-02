import { expect, test } from "@playwright/test";

const money = (cents) => new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP"
}).format(cents / 100);

export class FinancePage {
  constructor(page) {
    this.page = page;
    this.dialog = page.getByRole("dialog");
    this.invoiceRows = page.getByTestId("invoice-row");
    this.paymentRows = page.getByTestId("payment-row");
  }

  async openInvoices() {
    await test.step("Open Invoices", async () => {
      await this.page.getByRole("button", { name: "Invoices" }).click();
    });
  }

  async createInvoice({ studentOption, description, amount, dueDate }) {
    await test.step(`Create invoice ${description}`, async () => {
      await this.page.locator("#add-invoice").click();
      await this.page.getByTestId("studentId").selectOption({ label: studentOption });
      await this.page.getByTestId("description").fill(description);
      await this.page.getByTestId("amount").fill(amount);
      await this.page.getByTestId("dueDate").fill(dueDate);
      await this.dialog.getByRole("button", { name: "Create invoice" }).click();
      await expect(this.dialog).toBeHidden();
    });
  }

  invoiceRow(description) {
    return this.invoiceRows.filter({ hasText: description });
  }

  async recordPaymentFromInvoice({ description, amount, method, reference }) {
    await test.step(`Pay invoice ${description}`, async () => {
      const row = this.invoiceRow(description);
      await expect(row).toHaveCount(1);
      await row.getByRole("button", { name: "Pay" }).click();
      await this.page.getByTestId("amount").fill(amount);
      await this.page.getByTestId("method").selectOption(method);
      await this.page.getByTestId("reference").fill(reference);
      await this.dialog.getByRole("button", { name: "Record payment" }).click();
      await expect(this.dialog).toBeHidden();
    });
  }

  async expectInvoicePaid(description) {
    await test.step(`Verify invoice ${description} is fully paid`, async () => {
      const row = this.invoiceRow(description);
      await expect(row).toContainText("paid");
      await expect(row).toContainText("£0.00");
    });
  }

  async expectPaymentVisible(reference, amount) {
    await test.step(`Verify payment ${reference}`, async () => {
      await this.page.getByRole("button", { name: "Payments" }).click();
      const row = this.paymentRows.filter({ hasText: reference });
      await expect(row).toHaveCount(1);
      await expect(row).toContainText(amount);
      await expect(row).toContainText("completed");
    });
  }

  async expectDashboardMetrics(metrics, reference) {
    await test.step("Reconcile dashboard UI with API totals", async () => {
      await this.page.getByRole("button", { name: "Overview" }).click();
      const metric = (label) => this.page.locator("#metrics .metric-card").filter({ hasText: label });
      await expect(metric("Total billed")).toContainText(money(metrics.totalBilledCents));
      await expect(metric("Collected")).toContainText(money(metrics.collectedCents));
      await expect(metric("Outstanding")).toContainText(money(metrics.outstandingCents));
      await expect(this.page.locator("#recent-payments")).toContainText(reference);
    });
  }
}
