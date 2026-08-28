import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { createServer } from "../../src/server.mjs";

let server;
let baseUrl;
let adminToken;
let viewerToken;

async function request(path, { token, method = "GET", body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { ...(token && { Authorization: `Bearer ${token}` }), ...(body && { "Content-Type": "application/json" }) },
    body: body ? JSON.stringify(body) : undefined
  });
  return { status: response.status, body: await response.json() };
}

async function login(username, password) {
  const result = await request("/api/auth/login", { method: "POST", body: { username, password } });
  assert.equal(result.status, 200);
  return result.body.token;
}

describe("SchoolLedger REST API", { concurrency: 1 }, () => {
  before(async () => {
    ({ server } = await createServer({ reset: true }));
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    adminToken = await login("qa.admin", "Admin123!");
    viewerToken = await login("viewer", "Viewer123!");
  });

  after(async () => {
    if (server?.listening) await new Promise((resolve) => server.close(resolve));
  });

  test("health endpoint is public", async () => {
    const result = await request("/api/health");
    assert.equal(result.status, 200);
    assert.equal(result.body.status, "ok");
  });

  test("invalid credentials return a consistent error contract", async () => {
    const result = await request("/api/auth/login", { method: "POST", body: { username: "qa.admin", password: "wrong" } });
    assert.equal(result.status, 401);
    assert.equal(result.body.error.code, "INVALID_CREDENTIALS");
  });

  test("protected routes reject missing tokens", async () => {
    const result = await request("/api/dashboard");
    assert.equal(result.status, 401);
    assert.equal(result.body.error.code, "UNAUTHENTICATED");
  });

  test("viewer cannot create a student", async () => {
    const result = await request("/api/students", { token: viewerToken, method: "POST", body: {} });
    assert.equal(result.status, 403);
    assert.equal(result.body.error.code, "FORBIDDEN");
  });

  test("student validation identifies individual fields", async () => {
    const result = await request("/api/students", { token: adminToken, method: "POST", body: { firstName: "", lastName: "", email: "bad", status: "unknown" } });
    assert.equal(result.status, 422);
    assert.equal(result.body.error.code, "VALIDATION_ERROR");
    assert.ok(result.body.error.fields.email);
    assert.ok(result.body.error.fields.guardianName);
  });

  test("student, invoice and payment form a consistent lifecycle", async () => {
    const studentResult = await request("/api/students", { token: adminToken, method: "POST", body: { firstName: "Test", lastName: "Learner", email: "unique.learner@example.test", grade: "Grade 8", guardianName: "QA Guardian", status: "active" } });
    assert.equal(studentResult.status, 201);
    const studentId = studentResult.body.student.id;

    const duplicate = await request("/api/students", { token: adminToken, method: "POST", body: { firstName: "Other", lastName: "Learner", email: "unique.learner@example.test", grade: "Grade 8", guardianName: "QA Guardian", status: "active" } });
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body.error.code, "DUPLICATE_EMAIL");

    const invoiceResult = await request("/api/invoices", { token: adminToken, method: "POST", body: { studentId, description: "Automation lab fee", amount: 120, dueDate: "2026-12-15" } });
    assert.equal(invoiceResult.status, 201);
    assert.equal(invoiceResult.body.invoice.amountCents, 12000);
    const invoiceId = invoiceResult.body.invoice.id;

    const paymentResult = await request("/api/payments", { token: adminToken, method: "POST", body: { invoiceId, amount: 50, method: "card", reference: "AUTOMATION-UNIQUE-001" } });
    assert.equal(paymentResult.status, 201);
    assert.equal(paymentResult.body.invoice.status, "partial");
    assert.equal(paymentResult.body.invoice.outstandingCents, 7000);

    const overpayment = await request("/api/payments", { token: adminToken, method: "POST", body: { invoiceId, amount: 80, method: "cash", reference: "AUTOMATION-UNIQUE-002" } });
    assert.equal(overpayment.status, 422);
    assert.ok(overpayment.body.error.fields.amount);
  });

  test("dashboard money equation remains consistent", async () => {
    const result = await request("/api/dashboard", { token: adminToken });
    assert.equal(result.status, 200);
    const metrics = result.body.metrics;
    assert.equal(metrics.totalBilledCents - metrics.collectedCents, metrics.outstandingCents);
    assert.ok(metrics.collectionRate >= 0 && metrics.collectionRate <= 100);
  });

  test("SDET Lab exposes controlled faults and diagnostics", async () => {
    const viewerChange = await request("/api/lab/config", { token: viewerToken, method: "PATCH", body: { staleDashboard: true } });
    assert.equal(viewerChange.status, 403);

    const enabled = await request("/api/lab/config", { token: adminToken, method: "PATCH", body: { staleDashboard: true, paymentFailure: true, latencyMs: 0 } });
    assert.equal(enabled.status, 200);

    const diagnostics = await request("/api/lab/diagnostics", { token: adminToken });
    assert.equal(diagnostics.status, 200);
    assert.equal(diagnostics.body.recommendation, "NO-GO");
    assert.equal(diagnostics.body.checks.find((item) => item.id === "money").passed, false);

    const paymentFailure = await request("/api/payments", { token: adminToken, method: "POST", body: { invoiceId: "inv-2003", amount: 10, method: "cash", reference: "FAULT-CHECK" } });
    assert.equal(paymentFailure.status, 503);
    assert.equal(paymentFailure.body.error.code, "PAYMENT_SERVICE_UNAVAILABLE");

    const disabled = await request("/api/lab/config", { token: adminToken, method: "PATCH", body: { staleDashboard: false, paymentFailure: false, latencyMs: 0 } });
    assert.equal(disabled.status, 200);
    const healthy = await request("/api/lab/diagnostics", { token: adminToken });
    assert.equal(healthy.body.recommendation, "GO");
  });
});
