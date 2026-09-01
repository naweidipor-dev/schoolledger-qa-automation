import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Store, permissions } from "./store.mjs";
import { fieldErrors, moneyToCents, requiredText, validDate, validEmail } from "./validation.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(rootDir, "public");
const mimeTypes = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml" };
const securityHeaders = {
  "Content-Security-Policy": "default-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY"
};

function responseHeaders(headers = {}) {
  return { ...securityHeaders, ...headers };
}

function send(response, status, body, headers = {}) {
  const payload = body === undefined ? "" : JSON.stringify(body);
  response.writeHead(status, responseHeaders({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers }));
  response.end(payload);
}

function failure(response, status, code, message, fields) {
  send(response, status, { error: { code, message, ...(fields && { fields }) } });
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1_000_000) throw Object.assign(new Error("Request body is too large"), { status: 413 });
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw Object.assign(new Error("Request body must be valid JSON"), { status: 400 }); }
}

function authUser(request, store) {
  const header = request.headers.authorization ?? "";
  return store.userForToken(header.startsWith("Bearer ") ? header.slice(7) : "");
}

function requirePermission(response, user, permission) {
  if (!user) {
    failure(response, 401, "UNAUTHENTICATED", "Sign in to continue");
    return false;
  }
  if (!permissions[user.role]?.has(permission)) {
    failure(response, 403, "FORBIDDEN", `The ${user.role} role cannot perform this action`);
    return false;
  }
  return true;
}

function studentView(store, student) {
  const invoices = store.data.invoices.filter((invoice) => invoice.studentId === student.id);
  return { ...student, invoiceCount: invoices.length, outstandingCents: invoices.reduce((sum, invoice) => sum + invoice.amountCents - invoice.paidCents, 0) };
}

function invoiceView(store, invoice) {
  const student = store.data.students.find((candidate) => candidate.id === invoice.studentId);
  return { ...invoice, outstandingCents: invoice.amountCents - invoice.paidCents, studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown student" };
}

function dashboard(store) {
  store.refreshInvoiceStatuses();
  const activeStudents = store.data.students.filter((student) => student.status === "active").length;
  const totalBilledCents = store.data.invoices.reduce((sum, invoice) => sum + invoice.amountCents, 0);
  const collectedCents = store.data.invoices.reduce((sum, invoice) => sum + invoice.paidCents, 0);
  const outstandingCents = totalBilledCents - collectedCents + (store.labConfig.staleDashboard ? 10000 : 0);
  const overdueCount = store.data.invoices.filter((invoice) => invoice.status === "overdue").length;
  return {
    metrics: { activeStudents, totalBilledCents, collectedCents, outstandingCents, overdueCount, collectionRate: totalBilledCents ? Math.round(collectedCents / totalBilledCents * 100) : 0 },
    recentPayments: store.data.payments.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map((payment) => ({ ...payment, invoice: invoiceView(store, store.data.invoices.find((item) => item.id === payment.invoiceId)) })),
    attentionInvoices: store.data.invoices.filter((invoice) => ["overdue", "partial"].includes(invoice.status)).map((invoice) => invoiceView(store, invoice)).slice(0, 5)
  };
}

function diagnostics(store) {
  store.refreshInvoiceStatuses();
  const totalBilledCents = store.data.invoices.reduce((sum, item) => sum + item.amountCents, 0);
  const collectedCents = store.data.invoices.reduce((sum, item) => sum + item.paidCents, 0);
  const dashboardOutstanding = totalBilledCents - collectedCents + (store.labConfig.staleDashboard ? 10000 : 0);
  const studentIds = new Set(store.data.students.map((item) => item.id));
  const references = store.data.payments.map((item) => item.reference.toLowerCase());
  const checks = [
    { id: "health", name: "Service health", passed: true, evidence: "API process is responding" },
    { id: "money", name: "Financial reconciliation", passed: totalBilledCents - collectedCents === dashboardOutstanding, evidence: `billed ${totalBilledCents} - collected ${collectedCents} = dashboard outstanding ${dashboardOutstanding}` },
    { id: "balances", name: "Invoice balance invariant", passed: store.data.invoices.every((item) => item.paidCents >= 0 && item.paidCents <= item.amountCents), evidence: "Every paid value must be between zero and billed amount" },
    { id: "relationships", name: "Student/invoice relationships", passed: store.data.invoices.every((item) => studentIds.has(item.studentId)), evidence: "Every invoice must reference an existing student" },
    { id: "references", name: "Unique payment references", passed: references.length === new Set(references).size, evidence: "Duplicate references would indicate an idempotency failure" },
    { id: "audit", name: "Audit evidence available", passed: store.data.audit.length > 0, evidence: `${store.data.audit.length} audit event(s) available` }
  ];
  return { recommendation: checks.every((item) => item.passed) ? "GO" : "NO-GO", checks, generatedAt: new Date().toISOString(), labConfig: store.labConfig };
}

async function api(request, response, store, url) {
  if (request.method === "GET" && url.pathname === "/api/health") return send(response, 200, { status: "ok", service: "school-ledger-api", timestamp: new Date().toISOString() });
  if (request.method === "POST" && url.pathname === "/api/auth/login") {
    const body = await readJson(request);
    const result = store.login(body.username, body.password);
    if (!result) return failure(response, 401, "INVALID_CREDENTIALS", "Username or password is incorrect");
    return send(response, 200, result);
  }

  const user = authUser(request, store);
  if (user && store.labConfig.latencyMs) await new Promise((resolve) => setTimeout(resolve, store.labConfig.latencyMs));
  if (request.method === "GET" && url.pathname === "/api/me") {
    if (!requirePermission(response, user, "read")) return;
    return send(response, 200, { user });
  }
  if (request.method === "GET" && url.pathname === "/api/dashboard") {
    if (!requirePermission(response, user, "read")) return;
    return send(response, 200, dashboard(store));
  }
  if (request.method === "GET" && url.pathname === "/api/lab/config") {
    if (!requirePermission(response, user, "read")) return;
    return send(response, 200, { config: store.labConfig, configurable: permissions[user.role].has("lab:configure") });
  }
  if (request.method === "PATCH" && url.pathname === "/api/lab/config") {
    if (!requirePermission(response, user, "lab:configure")) return;
    const body = await readJson(request);
    const allowedLatency = [0, 300, 1000, 2000];
    if (body.latencyMs !== undefined && !allowedLatency.includes(Number(body.latencyMs))) return failure(response, 422, "VALIDATION_ERROR", "Latency must be 0, 300, 1000 or 2000 milliseconds", { latencyMs: "Choose a supported latency" });
    if (body.paymentFailure !== undefined && typeof body.paymentFailure !== "boolean") return failure(response, 422, "VALIDATION_ERROR", "Payment failure must be boolean");
    if (body.staleDashboard !== undefined && typeof body.staleDashboard !== "boolean") return failure(response, 422, "VALIDATION_ERROR", "Stale dashboard must be boolean");
    store.labConfig = { ...store.labConfig, ...body, ...(body.latencyMs !== undefined && { latencyMs: Number(body.latencyMs) }) };
    store.addAudit(user, "LAB_CONFIG_UPDATED", "lab", "fault-injection", JSON.stringify(store.labConfig));
    await store.save();
    return send(response, 200, { config: store.labConfig });
  }
  if (request.method === "GET" && url.pathname === "/api/lab/diagnostics") {
    if (!requirePermission(response, user, "read")) return;
    return send(response, 200, diagnostics(store));
  }
  if (request.method === "GET" && url.pathname === "/api/students") {
    if (!requirePermission(response, user, "read")) return;
    const q = (url.searchParams.get("q") ?? "").toLowerCase();
    const status = url.searchParams.get("status") ?? "all";
    const students = store.data.students.filter((student) => {
      const searchable = `${student.firstName} ${student.lastName} ${student.email} ${student.grade}`.toLowerCase();
      return (!q || searchable.includes(q)) && (status === "all" || student.status === status);
    }).map((student) => studentView(store, student));
    return send(response, 200, { students, total: students.length });
  }
  if (request.method === "POST" && url.pathname === "/api/students") {
    if (!requirePermission(response, user, "student:create")) return;
    const body = await readJson(request);
    const errors = fieldErrors({
      firstName: requiredText(body.firstName, "First name", 2, 50),
      lastName: requiredText(body.lastName, "Last name", 2, 50),
      email: validEmail(body.email) ? null : "Enter a valid guardian email",
      grade: requiredText(body.grade, "Grade", 2, 30),
      guardianName: requiredText(body.guardianName, "Guardian name", 2, 80),
      status: ["active", "inactive"].includes(body.status) ? null : "Status must be active or inactive"
    });
    if (Object.keys(errors).length) return failure(response, 422, "VALIDATION_ERROR", "Check the highlighted fields", errors);
    if (store.data.students.some((student) => student.email.toLowerCase() === body.email.trim().toLowerCase())) return failure(response, 409, "DUPLICATE_EMAIL", "A student with this guardian email already exists", { email: "Email must be unique" });
    const student = { id: store.newId("stu"), firstName: body.firstName.trim(), lastName: body.lastName.trim(), email: body.email.trim().toLowerCase(), grade: body.grade.trim(), guardianName: body.guardianName.trim(), status: body.status, createdAt: new Date().toISOString() };
    store.data.students.push(student);
    store.addAudit(user, "STUDENT_CREATED", "student", student.id, `${student.firstName} ${student.lastName}`);
    await store.save();
    return send(response, 201, { student: studentView(store, student) });
  }
  const studentMatch = url.pathname.match(/^\/api\/students\/([^/]+)$/);
  if (studentMatch && request.method === "PATCH") {
    if (!requirePermission(response, user, "student:update")) return;
    const student = store.data.students.find((item) => item.id === studentMatch[1]);
    if (!student) return failure(response, 404, "NOT_FOUND", "Student was not found");
    const body = await readJson(request);
    const allowed = ["firstName", "lastName", "email", "grade", "guardianName", "status"];
    for (const key of allowed) if (body[key] !== undefined) student[key] = typeof body[key] === "string" ? body[key].trim() : body[key];
    if (!validEmail(student.email) || !["active", "inactive"].includes(student.status)) return failure(response, 422, "VALIDATION_ERROR", "Email and status must be valid");
    store.addAudit(user, "STUDENT_UPDATED", "student", student.id, `${student.firstName} ${student.lastName}`);
    await store.save();
    return send(response, 200, { student: studentView(store, student) });
  }
  if (studentMatch && request.method === "DELETE") {
    if (!requirePermission(response, user, "student:delete")) return;
    const index = store.data.students.findIndex((item) => item.id === studentMatch[1]);
    if (index < 0) return failure(response, 404, "NOT_FOUND", "Student was not found");
    if (store.data.invoices.some((invoice) => invoice.studentId === studentMatch[1])) return failure(response, 409, "STUDENT_HAS_INVOICES", "Students with invoices cannot be deleted; mark the student inactive instead");
    const [student] = store.data.students.splice(index, 1);
    store.addAudit(user, "STUDENT_DELETED", "student", student.id, `${student.firstName} ${student.lastName}`);
    await store.save();
    return send(response, 200, { deleted: true });
  }
  if (request.method === "GET" && url.pathname === "/api/invoices") {
    if (!requirePermission(response, user, "read")) return;
    store.refreshInvoiceStatuses();
    const status = url.searchParams.get("status") ?? "all";
    const invoices = store.data.invoices.filter((invoice) => status === "all" || invoice.status === status).map((invoice) => invoiceView(store, invoice));
    return send(response, 200, { invoices, total: invoices.length });
  }
  if (request.method === "POST" && url.pathname === "/api/invoices") {
    if (!requirePermission(response, user, "invoice:create")) return;
    const body = await readJson(request);
    const amountCents = moneyToCents(body.amount);
    const errors = fieldErrors({
      studentId: store.data.students.some((student) => student.id === body.studentId && student.status === "active") ? null : "Choose an active student",
      description: requiredText(body.description, "Description", 3, 120),
      amount: amountCents ? null : "Amount must be between 0.01 and 1,000,000",
      dueDate: validDate(body.dueDate) ? null : "Enter a valid due date"
    });
    if (Object.keys(errors).length) return failure(response, 422, "VALIDATION_ERROR", "Check the highlighted fields", errors);
    const invoice = { id: store.newId("inv"), studentId: body.studentId, description: body.description.trim(), amountCents, paidCents: 0, dueDate: body.dueDate, status: "open", createdAt: new Date().toISOString() };
    store.data.invoices.push(invoice);
    store.refreshInvoiceStatuses();
    store.addAudit(user, "INVOICE_CREATED", "invoice", invoice.id, `${invoice.description}: ${amountCents} cents`);
    await store.save();
    return send(response, 201, { invoice: invoiceView(store, invoice) });
  }
  if (request.method === "POST" && url.pathname === "/api/payments") {
    if (!requirePermission(response, user, "payment:create")) return;
    if (store.labConfig.paymentFailure) return failure(response, 503, "PAYMENT_SERVICE_UNAVAILABLE", "Controlled SDET Lab fault: payment service is unavailable");
    const body = await readJson(request);
    const invoice = store.data.invoices.find((item) => item.id === body.invoiceId);
    const amountCents = moneyToCents(body.amount);
    const outstanding = invoice ? invoice.amountCents - invoice.paidCents : 0;
    const errors = fieldErrors({
      invoiceId: invoice ? null : "Choose an invoice",
      amount: amountCents && amountCents <= outstanding ? null : "Amount must be positive and cannot exceed the outstanding balance",
      method: ["card", "cash", "bank_transfer"].includes(body.method) ? null : "Choose a supported payment method",
      reference: requiredText(body.reference, "Reference", 3, 60)
    });
    if (Object.keys(errors).length) return failure(response, 422, "VALIDATION_ERROR", "Check the highlighted fields", errors);
    if (store.data.payments.some((payment) => payment.reference.toLowerCase() === body.reference.trim().toLowerCase())) return failure(response, 409, "DUPLICATE_REFERENCE", "Payment reference must be unique", { reference: "Reference already exists" });
    const payment = { id: store.newId("pay"), invoiceId: invoice.id, amountCents, method: body.method, reference: body.reference.trim(), status: "completed", createdAt: new Date().toISOString() };
    store.data.payments.unshift(payment);
    invoice.paidCents += amountCents;
    store.refreshInvoiceStatuses();
    store.addAudit(user, "PAYMENT_RECORDED", "payment", payment.id, `${amountCents} cents for ${invoice.id}`);
    await store.save();
    return send(response, 201, { payment, invoice: invoiceView(store, invoice) });
  }
  if (request.method === "POST" && url.pathname === "/api/refunds") {
    if (!requirePermission(response, user, "refund:create")) return;
    const body = await readJson(request);
    const payment = store.data.payments.find((item) => item.id === body.paymentId && item.status === "completed");
    const amountCents = moneyToCents(body.amount);
    const alreadyRefunded = payment ? store.data.refunds.filter((refund) => refund.paymentId === payment.id).reduce((sum, refund) => sum + refund.amountCents, 0) : 0;
    const errors = fieldErrors({
      paymentId: payment ? null : "Choose a completed payment",
      amount: payment && amountCents && amountCents <= payment.amountCents - alreadyRefunded ? null : "Refund must be positive and cannot exceed the refundable amount",
      reason: requiredText(body.reason, "Reason", 5, 150)
    });
    if (Object.keys(errors).length) return failure(response, 422, "VALIDATION_ERROR", "Check the highlighted fields", errors);
    const refund = { id: store.newId("ref"), paymentId: payment.id, amountCents, reason: body.reason.trim(), createdAt: new Date().toISOString() };
    store.data.refunds.unshift(refund);
    const invoice = store.data.invoices.find((item) => item.id === payment.invoiceId);
    invoice.paidCents -= amountCents;
    store.refreshInvoiceStatuses();
    store.addAudit(user, "REFUND_CREATED", "refund", refund.id, `${amountCents} cents from ${payment.id}`);
    await store.save();
    return send(response, 201, { refund, invoice: invoiceView(store, invoice) });
  }
  if (request.method === "GET" && url.pathname === "/api/payments") {
    if (!requirePermission(response, user, "read")) return;
    return send(response, 200, { payments: store.data.payments, refunds: store.data.refunds });
  }
  if (request.method === "GET" && url.pathname === "/api/audit") {
    if (!requirePermission(response, user, "read")) return;
    return send(response, 200, { events: store.data.audit, total: store.data.audit.length });
  }
  if (request.method === "POST" && url.pathname === "/api/reset") {
    if (!requirePermission(response, user, "reset")) return;
    await store.reset(user);
    return send(response, 200, { reset: true });
  }
  return failure(response, 404, "NOT_FOUND", "API route was not found");
}

async function staticFile(request, response, url) {
  const relative = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
  const resolved = path.resolve(publicDir, relative);
  if (!resolved.startsWith(publicDir)) return false;
  try {
    const fileStat = await stat(resolved);
    if (!fileStat.isFile()) return false;
    const content = await readFile(resolved);
    response.writeHead(200, responseHeaders({ "Content-Type": mimeTypes[path.extname(resolved)] ?? "application/octet-stream", "Cache-Control": "no-cache" }));
    response.end(content);
    return true;
  } catch { return false; }
}

export async function createServer({ reset = false } = {}) {
  const store = await new Store(rootDir).init({ reset });
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
    try {
      if (url.pathname.startsWith("/api/")) await api(request, response, store, url);
      else if (!(await staticFile(request, response, url))) {
        const index = await readFile(path.join(publicDir, "index.html"));
        response.writeHead(200, responseHeaders({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" }));
        response.end(index);
      }
    } catch (error) {
      console.error(error);
      failure(response, error.status ?? 500, error.status === 400 ? "INVALID_JSON" : "INTERNAL_ERROR", error.message ?? "Unexpected server error");
    }
  });
  return { server, store };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 4173);
  const { server } = await createServer();
  server.listen(port, "127.0.0.1", () => console.log(`SchoolLedger QA Lab running at http://127.0.0.1:${port}`));
}
