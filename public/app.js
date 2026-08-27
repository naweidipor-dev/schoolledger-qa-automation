const state = { token: localStorage.getItem("schoolledger-token"), user: null, students: [], invoices: [], payments: [] };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const money = (cents = 0) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(cents / 100);
const date = (value) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value.length === 10 ? `${value}T00:00:00Z` : value));
const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));

async function api(path, options = {}) {
  const headers = { ...(options.body && { "Content-Type": "application/json" }), ...(state.token && { Authorization: `Bearer ${state.token}` }), ...options.headers };
  const response = await fetch(path, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(body.error?.message ?? `Request failed with ${response.status}`), { status: response.status, fields: body.error?.fields, code: body.error?.code });
  return body;
}

function toast(message, error = false) {
  const element = $("#toast");
  element.textContent = message;
  element.className = `toast show${error ? " error" : ""}`;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.className = "toast", 3200);
}

async function signIn(username, password) {
  const result = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
  state.token = result.token;
  state.user = result.user;
  localStorage.setItem("schoolledger-token", result.token);
  showApp();
  await loadDashboard();
}

function showApp() {
  $("#login-screen").classList.add("hidden");
  $("#app").classList.remove("hidden");
  $("#user-name").textContent = state.user.name;
  $("#user-role").textContent = state.user.role;
  $("#user-avatar").textContent = state.user.name.split(" ").map((word) => word[0]).slice(0, 2).join("");
  $$(".write-action").forEach((button) => button.hidden = state.user.role === "viewer" || (["reset-data", "apply-faults"].includes(button.id) && state.user.role !== "admin"));
}

function signOut() {
  localStorage.removeItem("schoolledger-token");
  state.token = null; state.user = null;
  $("#app").classList.add("hidden");
  $("#login-screen").classList.remove("hidden");
  $("#password").value = "";
}

async function restoreSession() {
  if (!state.token) return;
  try { state.user = (await api("/api/me")).user; showApp(); await loadDashboard(); }
  catch { signOut(); }
}

function navigate(page) {
  $$(".page").forEach((element) => element.classList.remove("active-page"));
  $$(".nav-item").forEach((element) => element.classList.toggle("active", element.dataset.page === page));
  $(`#page-${page}`).classList.add("active-page");
  const titles = { dashboard: ["FINANCE OPERATIONS", "Overview"], students: ["ACCOUNT MANAGEMENT", "Students"], invoices: ["RECEIVABLES", "Invoices"], payments: ["TRANSACTIONS", "Payments"], audit: ["EVIDENCE", "Audit trail"], sdet: ["ENGINEERING PRACTICE", "SDET Lab"], practice: ["LEARNING PLAN", "QA practice"] };
  $("#page-kicker").textContent = titles[page][0]; $("#page-title").textContent = titles[page][1];
  $(".sidebar").classList.remove("open");
  if (page === "dashboard") loadDashboard();
  if (page === "students") loadStudents();
  if (page === "invoices") loadInvoices();
  if (page === "payments") loadPayments();
  if (page === "audit") loadAudit();
  if (page === "sdet") loadSdetLab();
  if (page === "practice") renderTestCases();
}

const starterTestCases = [
  { id: "API-LOGIN-001", scenario: "Valid admin login", expected: "200 OK; token returned; role is admin", actual: "200 OK; token and admin user returned", status: "Pass", evidence: "Postman automated assertions", notes: "Automated: status, token, role, username and response time" },
  { id: "API-LOGIN-002", scenario: "Invalid password", expected: "401 Unauthorized; no token returned", actual: "401 Unauthorized; invalid credentials rejected", status: "Pass", evidence: "Postman automated assertions", notes: "Automated: status, error contract, no token and response time" },
  { id: "API-AUTH-003", scenario: "Access students API without a valid token", expected: "401 Unauthorized", actual: "401 Unauthorized; UNAUTHENTICATED", status: "Pass", evidence: "Postman automated assertions", notes: "Automated: missing-token error and no data returned" },
  { id: "API-AUTH-004", scenario: "Access students API with a valid admin token", expected: "200 OK; students returned", actual: "200 OK; students returned", status: "Pass", evidence: "Postman automated assertions", notes: "Automated: status, array, count, schema and response time" },
  { id: "API-STUDENT-005", scenario: "Create student with missing fields", expected: "422 validation errors", actual: "422 validation errors returned", status: "Pass", evidence: "Postman automated assertions", notes: "Automated: status, error contract, required fields, no student and response time" },
  { id: "API-STUDENT-006", scenario: "Create a valid student", expected: "201 Created", actual: "201 Created; 5 automated assertions passed", status: "Pass", evidence: "Postman automated assertions", notes: "Automated: status, ID, data contract, email domain and response time" },
  { id: "API-STUDENT-007", scenario: "Create student with duplicate email", expected: "409 Conflict", actual: "409 Conflict; 5 automated assertions passed", status: "Pass", evidence: "Postman automated assertions", notes: "Automated: status, duplicate code, email error, no student and response time" },
  { id: "API-STUDENT-008", scenario: "Create student with invalid email", expected: "422 email validation error", actual: "422 invalid email rejected; 5 automated assertions passed", status: "Pass", evidence: "Postman automated assertions", notes: "Automated: status, validation code, email error, no student and response time" },
  { id: "API-HEALTH-000", scenario: "Verify API health endpoint", expected: "200 OK; status ok", actual: "200 OK; 4/4 assertions passed in 52 ms", status: "Pass", evidence: "Postman automated assertions", notes: "Automated: status, service contract and response time" },
  { id: "API-INVOICE-009", scenario: "Create a valid invoice", expected: "201 Created; invoice open", actual: "201 Created; 5 automated assertions passed", status: "Pass", evidence: "Postman automated assertions", notes: "Automated: status, ID, open state, monetary values and response time" },
  { id: "API-PAYMENT-010", scenario: "Record a partial payment", expected: "201 Created; invoice partial", actual: "201 Created; 5 automated assertions passed", status: "Pass", evidence: "Postman automated assertions", notes: "Automated: status, payment ID, amount, partial balance and response time" },
  { id: "API-PAYMENT-011", scenario: "Complete invoice payment", expected: "201 Created; invoice paid; outstanding balance zero", actual: "201 Created; 5 automated assertions passed", status: "Pass", evidence: "Postman automated assertions", notes: "Automated: status, payment ID, amount, paid balance and response time" },
  { id: "API-PAYMENT-012", scenario: "Submit payment against a paid invoice", expected: "422; payment rejected; outstanding balance remains zero", actual: "422; 5 automated assertions passed", status: "Pass", evidence: "Postman automated assertions", notes: "Automated: status, validation code, amount error, no payment and response time" },
  { id: "API-PAYMENT-013", scenario: "Submit a duplicate payment reference", expected: "409 Conflict; DUPLICATE_REFERENCE; no payment created", actual: "409 Conflict; 5 automated assertions passed", status: "Pass", evidence: "Postman automated assertions", notes: "Automated: status, duplicate code, reference error, no payment and response time" },
  { id: "API-REFUND-014", scenario: "Create a valid partial refund", expected: "201 Created; refund returned; invoice becomes partial", actual: "201 Created; 5 automated assertions passed", status: "Pass", evidence: "Postman automated assertions", notes: "Automated: status, refund ID, amount, invoice balance and response time" },
  { id: "API-REFUND-015", scenario: "Reject refund above refundable balance", expected: "422 VALIDATION_ERROR; no refund created", actual: "422 VALIDATION_ERROR; 5 automated assertions passed", status: "Pass", evidence: "Postman automated assertions", notes: "Automated: status, validation code, amount error, no refund and response time" },
  { id: "API-RBAC-016", scenario: "Viewer attempts to create a student", expected: "403 FORBIDDEN; student not created", actual: "403 FORBIDDEN; 5 automated assertions passed", status: "Pass", evidence: "Postman automated assertions", notes: "Automated: status, forbidden code, role message, no student and response time" }
];
function getTestCases() {
  try {
    const saved = JSON.parse(localStorage.getItem("schoolledger-test-cases"));
    const existing = Array.isArray(saved) ? [...saved] : [];
    let restoredMissingRecord = false;
    for (const record of starterTestCases) {
      if (!existing.some((item) => item.id === record.id)) { existing.push(record); restoredMissingRecord = true; }
    }
    if (restoredMissingRecord) localStorage.setItem("schoolledger-test-cases", JSON.stringify(existing));
    if (localStorage.getItem("schoolledger-record-migration") !== "31") {
      const merged = existing;
      const automatedIds = new Set(["API-HEALTH-000", "API-LOGIN-001", "API-LOGIN-002", "API-AUTH-003", "API-AUTH-004", "API-STUDENT-005", "API-STUDENT-006", "API-STUDENT-007", "API-STUDENT-008", "API-INVOICE-009", "API-PAYMENT-010", "API-PAYMENT-011", "API-PAYMENT-012", "API-PAYMENT-013", "API-REFUND-014", "API-REFUND-015", "API-RBAC-016"]);
      for (const record of starterTestCases) {
        const index = merged.findIndex((item) => item.id === record.id);
        if (index < 0) merged.push(record); else if (automatedIds.has(record.id)) merged[index] = record;
      }
      localStorage.setItem("schoolledger-test-cases", JSON.stringify(merged));
      localStorage.setItem("schoolledger-record-migration", "31");
      return merged;
    }
    return existing;
  } catch { return starterTestCases; }
}
function saveTestCases(cases) { localStorage.setItem("schoolledger-test-cases", JSON.stringify(cases)); }
function renderTestCases() {
  const body = $("#test-cases-body"); if (!body) return; const cases = getTestCases();
  $("#test-case-count").textContent = `${cases.length} ${cases.length === 1 ? "case" : "cases"}`;
  body.innerHTML = cases.length ? cases.map((item, index) => `<tr><td><strong>${escapeHtml(item.id)}</strong></td><td>${escapeHtml(item.scenario)}</td><td>${escapeHtml(item.expected)}</td><td>${escapeHtml(item.actual || "Not recorded")}</td><td><span class="status ${escapeHtml(item.status.toLowerCase().replace(" ", "-"))}">${escapeHtml(item.status)}</span></td><td>${escapeHtml([item.evidence, item.notes].filter(Boolean).join(" · ") || "—")}</td><td><div class="case-row-actions"><button class="row-action" data-edit-case="${index}">Edit</button><button class="row-action delete" data-delete-case="${index}">Delete</button></div></td></tr>`).join("") : '<tr><td colspan="7" class="empty">No test cases recorded yet.</td></tr>';
}
function testCaseFromForm() { return { id: $("#test-case-id").value.trim(), scenario: $("#test-case-scenario").value.trim(), expected: $("#test-case-expected").value.trim(), actual: $("#test-case-actual").value.trim(), status: $("#test-case-status").value, evidence: $("#test-case-evidence").value.trim(), notes: $("#test-case-notes").value.trim() }; }
function resetTestCaseForm() { $("#test-case-form").reset(); $("#test-case-edit-index").value = ""; $("#cancel-test-case-edit").classList.add("hidden"); localStorage.removeItem("schoolledger-test-case-draft"); $("#test-case-autosave").textContent = "Ready"; }
function restoreTestCaseDraft() {
  try { const draft = JSON.parse(localStorage.getItem("schoolledger-test-case-draft")); if (!draft) return; for (const [key, value] of Object.entries(draft.item || {})) { const field = $(`#test-case-${key}`); if (field) field.value = value; } $("#test-case-edit-index").value = draft.editIndex ?? ""; if (draft.editIndex !== "" && draft.editIndex != null) $("#cancel-test-case-edit").classList.remove("hidden"); $("#test-case-autosave").textContent = "Draft restored"; } catch {}
}
function autoSaveTestCase() {
  const item = testCaseFromForm(); const editIndex = $("#test-case-edit-index").value;
  localStorage.setItem("schoolledger-test-case-draft", JSON.stringify({ item, editIndex })); $("#test-case-autosave").textContent = "Draft saved";
  if (![item.id, item.scenario, item.expected, item.actual].every(Boolean)) return;
  const cases = getTestCases(); let index = editIndex === "" ? cases.findIndex((entry) => entry.id.toLowerCase() === item.id.toLowerCase()) : Number(editIndex);
  if (index < 0) { cases.push(item); index = cases.length - 1; } else cases[index] = item;
  $("#test-case-edit-index").value = String(index); $("#cancel-test-case-edit").classList.remove("hidden"); saveTestCases(cases); renderTestCases();
  localStorage.setItem("schoolledger-test-case-draft", JSON.stringify({ item, editIndex: String(index) })); $("#test-case-autosave").textContent = `Autosaved ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}
function submitTestCase(event) {
  event.preventDefault(); const item = testCaseFromForm();
  const cases = getTestCases(); const editIndex = $("#test-case-edit-index").value;
  if (editIndex === "" && cases.some((entry) => entry.id.toLowerCase() === item.id.toLowerCase())) return toast("Test case ID already exists", true);
  if (editIndex === "") cases.push(item); else cases[Number(editIndex)] = item; saveTestCases(cases); renderTestCases(); resetTestCaseForm(); toast(editIndex === "" ? "Test case saved" : "Test case updated");
}
function handleTestCaseAction(event) {
  const edit = event.target.closest("[data-edit-case]"); const remove = event.target.closest("[data-delete-case]"); const cases = getTestCases();
  if (edit) { const index = Number(edit.dataset.editCase); const item = cases[index]; $("#test-case-edit-index").value = index; $("#test-case-id").value = item.id; $("#test-case-scenario").value = item.scenario; $("#test-case-expected").value = item.expected; $("#test-case-actual").value = item.actual; $("#test-case-status").value = item.status; $("#test-case-evidence").value = item.evidence; $("#test-case-notes").value = item.notes; $("#cancel-test-case-edit").classList.remove("hidden"); $("#test-case-id").focus(); }
  if (remove) { const index = Number(remove.dataset.deleteCase); if (!confirm(`Delete ${cases[index].id}?`)) return; cases.splice(index, 1); saveTestCases(cases); renderTestCases(); toast("Test case deleted"); }
}

async function loadDashboard() {
  const data = await api("/api/dashboard");
  const metrics = [
    ["Active students", data.metrics.activeStudents, "Current enrolments"],
    ["Total billed", money(data.metrics.totalBilledCents), "All invoices"],
    ["Collected", money(data.metrics.collectedCents), `${data.metrics.collectionRate}% collection rate`],
    ["Outstanding", money(data.metrics.outstandingCents), "Remaining balance"],
    ["Overdue", data.metrics.overdueCount, "Requires attention"]
  ];
  $("#metrics").innerHTML = metrics.map(([label, value, note]) => `<article class="metric-card"><small>${label}</small><strong>${value}</strong><em>${note}</em></article>`).join("");
  $("#attention-list").innerHTML = data.attentionInvoices.length ? data.attentionInvoices.map((item) => `<div class="list-row"><div><strong>${escapeHtml(item.studentName)}</strong><small>${escapeHtml(item.description)} · Due ${date(item.dueDate)}</small></div><div class="amount"><strong>${money(item.outstandingCents)}</strong><span class="status ${item.status}">${item.status}</span></div></div>`).join("") : `<div class="empty">Nothing needs attention.</div>`;
  $("#recent-payments").innerHTML = data.recentPayments.length ? data.recentPayments.map((item) => `<div class="list-row"><div><strong>${escapeHtml(item.invoice.studentName)}</strong><small>${escapeHtml(item.reference)} · ${date(item.createdAt)}</small></div><div class="amount"><strong>${money(item.amountCents)}</strong><span class="status completed">completed</span></div></div>`).join("") : `<div class="empty">No payments recorded.</div>`;
}

async function loadStudents() {
  const q = encodeURIComponent($("#student-search").value.trim());
  const status = $("#student-status").value;
  const data = await api(`/api/students?q=${q}&status=${status}`);
  state.students = data.students;
  $("#student-count").textContent = `${data.total} record${data.total === 1 ? "" : "s"}`;
  $("#students-body").innerHTML = data.students.length ? data.students.map((student) => `<tr data-testid="student-row"><td><strong>${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</strong><small>${escapeHtml(student.email)}</small></td><td>${escapeHtml(student.grade)}</td><td>${escapeHtml(student.guardianName)}</td><td><span class="status ${student.status}">${student.status}</span></td><td>${student.invoiceCount}</td><td>${money(student.outstandingCents)}</td></tr>`).join("") : `<tr><td colspan="6" class="empty">No students match the filter.</td></tr>`;
}

async function loadInvoices() {
  const data = await api(`/api/invoices?status=${$("#invoice-status").value}`);
  state.invoices = data.invoices;
  $("#invoice-count").textContent = `${data.total} invoice${data.total === 1 ? "" : "s"}`;
  $("#invoices-body").innerHTML = data.invoices.length ? data.invoices.map((invoice) => `<tr data-testid="invoice-row"><td><strong>${escapeHtml(invoice.id)}</strong><small>${date(invoice.createdAt)}</small></td><td>${escapeHtml(invoice.studentName)}</td><td>${escapeHtml(invoice.description)}</td><td>${date(invoice.dueDate)}</td><td><span class="status ${invoice.status}">${invoice.status}</span></td><td>${money(invoice.amountCents)}</td><td>${money(invoice.outstandingCents)}</td><td>${invoice.outstandingCents > 0 && state.user.role !== "viewer" ? `<button class="row-action" data-pay="${invoice.id}">Pay</button>` : ""}</td></tr>`).join("") : `<tr><td colspan="8" class="empty">No invoices match the filter.</td></tr>`;
}

async function loadPayments() {
  const data = await api("/api/payments");
  state.payments = data.payments;
  $("#payments-body").innerHTML = data.payments.length ? data.payments.map((payment) => `<tr data-testid="payment-row"><td><strong>${escapeHtml(payment.id)}</strong><small><span class="status ${payment.status}">${payment.status}</span></small></td><td>${escapeHtml(payment.invoiceId)}</td><td>${escapeHtml(payment.method.replace("_", " "))}</td><td>${escapeHtml(payment.reference)}</td><td>${date(payment.createdAt)}</td><td>${money(payment.amountCents)}</td><td>${state.user.role !== "viewer" ? `<button class="row-action" data-refund="${payment.id}">Refund</button>` : ""}</td></tr>`).join("") : `<tr><td colspan="7" class="empty">No payments recorded.</td></tr>`;
}

async function loadAudit() {
  const data = await api("/api/audit");
  $("#audit-body").innerHTML = data.events.map((event) => `<tr><td>${date(event.createdAt)}</td><td>${escapeHtml(event.actor)}</td><td><strong>${escapeHtml(event.action.replaceAll("_", " "))}</strong></td><td>${escapeHtml(event.entity)}<small>${escapeHtml(event.entityId)}</small></td><td>${escapeHtml(event.details)}</td></tr>`).join("");
}

function updateSdetProgress() {
  const completed = JSON.parse(localStorage.getItem("schoolledger-sdet-skills") ?? "[]");
  $$('[data-skill]').forEach((box) => box.checked = completed.includes(box.dataset.skill));
  $("#sdet-progress").textContent = `${Math.round(completed.length / $$('[data-skill]').length * 100)}%`;
}

async function loadSdetLab() {
  updateSdetProgress();
  const result = await api("/api/lab/config");
  $("#fault-latency").value = String(result.config.latencyMs);
  $("#fault-payment").checked = result.config.paymentFailure;
  $("#fault-dashboard").checked = result.config.staleDashboard;
  const faulted = result.config.latencyMs > 0 || result.config.paymentFailure || result.config.staleDashboard;
  $("#fault-state").textContent = faulted ? "fault active" : "normal";
  $("#fault-state").className = `status ${faulted ? "overdue" : "active"}`;
  $$("#fault-latency,#fault-payment,#fault-dashboard").forEach((control) => control.disabled = !result.configurable);
}

async function runDiagnostics() {
  $("#diagnostic-summary").className = "diagnostic-summary";
  $("#diagnostic-summary").textContent = "Running checks…";
  try {
    const result = await api("/api/lab/diagnostics");
    $("#diagnostic-summary").className = `diagnostic-summary ${result.recommendation.toLowerCase()}`;
    $("#diagnostic-summary").innerHTML = `<span>Release recommendation</span><strong>${result.recommendation}</strong>`;
    $("#diagnostic-results").innerHTML = result.checks.map((check) => `<div class="diagnostic-row ${check.passed ? "" : "failed"}"><span class="check-icon">${check.passed ? "✓" : "!"}</span><div><strong>${escapeHtml(check.name)}</strong><small>${escapeHtml(check.evidence)}</small></div></div>`).join("");
  } catch (error) {
    $("#diagnostic-summary").className = "diagnostic-summary no-go";
    $("#diagnostic-summary").textContent = error.message;
  }
}

async function sendConsoleRequest(event) {
  event.preventDefault();
  const method = $("#api-method").value;
  const path = $("#api-path").value.trim();
  if (!path.startsWith("/api/")) { $("#api-response").textContent = "Only local /api/ endpoints are allowed."; return; }
  const started = performance.now();
  try {
    const rawBody = $("#api-body").value.trim();
    const response = await fetch(path, { method, headers: { Authorization: `Bearer ${state.token}`, ...(rawBody && { "Content-Type": "application/json" }) }, body: method === "GET" || !rawBody ? undefined : JSON.stringify(JSON.parse(rawBody)) });
    const body = await response.json();
    $("#api-status").textContent = `${response.status} ${response.statusText}`;
    $("#api-duration").textContent = `${Math.round(performance.now() - started)} ms`;
    $("#api-response").textContent = JSON.stringify(body, null, 2);
  } catch (error) {
    $("#api-status").textContent = "Request error";
    $("#api-duration").textContent = `${Math.round(performance.now() - started)} ms`;
    $("#api-response").textContent = error.message;
  }
}

function generateStudentData() {
  const id = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  state.generatedStudent = { firstName: "SDET", lastName: `Learner${id.slice(-4)}`, email: `sdet.${id}@example.test`, grade: `Grade ${2 + Math.floor(Math.random() * 9)}`, guardianName: `Test Guardian ${id.slice(-3)}`, status: "active" };
  $("#generated-student").textContent = JSON.stringify(state.generatedStudent, null, 2);
  $("#create-generated-student").disabled = state.user.role === "viewer";
}

async function createGeneratedStudent() {
  if (!state.generatedStudent) return;
  try {
    const result = await api("/api/students", { method: "POST", body: JSON.stringify(state.generatedStudent) });
    toast(`Created test data: ${result.student.id}`);
    state.generatedStudent = null;
    $("#generated-student").textContent = "Generate another unique student payload.";
    $("#create-generated-student").disabled = true;
  } catch (error) { toast(error.message, true); }
}

async function applyFaults() {
  try {
    await api("/api/lab/config", { method: "PATCH", body: JSON.stringify({ latencyMs: Number($("#fault-latency").value), paymentFailure: $("#fault-payment").checked, staleDashboard: $("#fault-dashboard").checked }) });
    toast("SDET Lab configuration applied");
    await loadSdetLab();
  } catch (error) { toast(error.message, true); }
}

const formConfigs = {
  student: { kicker: "ACCOUNT MANAGEMENT", title: "Add student", submit: "Create student", path: "/api/students", fields: [
    ["firstName", "First name", "text", "Amina"], ["lastName", "Last name", "text", "Shah"], ["email", "Guardian email", "email", "guardian@example.test"], ["grade", "Grade", "text", "Grade 6"], ["guardianName", "Guardian name", "text", "Imran Shah"], ["status", "Status", "select", [["active", "Active"], ["inactive", "Inactive"]]]
  ]},
  invoice: { kicker: "RECEIVABLES", title: "Create invoice", submit: "Create invoice", path: "/api/invoices", fields: [] },
  payment: { kicker: "TRANSACTIONS", title: "Record payment", submit: "Record payment", path: "/api/payments", fields: [] },
  refund: { kicker: "CONTROLLED REVERSAL", title: "Create refund", submit: "Refund payment", path: "/api/refunds", fields: [] }
};

function fieldMarkup([name, label, type, value], full = false) {
  const className = full ? "full-field" : "";
  const control = type === "select" ? `<select id="field-${name}" name="${name}" data-testid="${name}">${value.map(([key, text]) => `<option value="${escapeHtml(key)}">${escapeHtml(text)}</option>`).join("")}</select>` : `<input id="field-${name}" name="${name}" type="${type}" ${type === "number" ? 'min="0.01" step="0.01"' : ""} placeholder="${escapeHtml(value)}" data-testid="${name}">`;
  return `<label class="${className}">${label}${control}<span class="field-error" data-error="${name}"></span></label>`;
}

async function openForm(type, preset = {}) {
  const config = formConfigs[type];
  if (["invoice", "payment"].includes(type) && !state.invoices.length) await loadInvoices();
  if (type === "invoice" && !state.students.length) await loadStudents();
  let fields = config.fields;
  if (type === "invoice") fields = [["studentId", "Student", "select", state.students.filter((item) => item.status === "active").map((item) => [item.id, `${item.firstName} ${item.lastName} · ${item.grade}`])], ["description", "Description", "text", "Autumn tuition"], ["amount", "Amount (GBP)", "number", "850.00"], ["dueDate", "Due date", "date", ""]];
  if (type === "payment") fields = [["invoiceId", "Invoice", "select", state.invoices.filter((item) => item.outstandingCents > 0).map((item) => [item.id, `${item.studentName} · ${money(item.outstandingCents)} due`])], ["amount", "Amount (GBP)", "number", "100.00"], ["method", "Method", "select", [["card", "Card"], ["cash", "Cash"], ["bank_transfer", "Bank transfer"]]], ["reference", "Unique reference", "text", "PAY-2026-001"]];
  if (type === "refund") fields = [["paymentId", "Payment", "select", state.payments.map((item) => [item.id, `${item.reference} · ${money(item.amountCents)}`])], ["amount", "Refund amount (GBP)", "number", "50.00"], ["reason", "Reason", "text", "Duplicate payment"]];
  $("#dialog-kicker").textContent = config.kicker; $("#dialog-title").textContent = config.title; $("#dialog-submit").textContent = config.submit;
  $("#dialog-fields").innerHTML = fields.map((field) => fieldMarkup(field, ["description", "reason"].includes(field[0]))).join("");
  $("#entity-form").dataset.type = type; $("#dialog-error").textContent = "";
  for (const [key, value] of Object.entries(preset)) if ($(`#field-${key}`)) $(`#field-${key}`).value = value;
  $("#form-dialog").showModal();
}

async function submitForm(event) {
  event.preventDefault();
  const type = event.currentTarget.dataset.type; const config = formConfigs[type];
  $$(".field-error").forEach((element) => element.textContent = ""); $("#dialog-error").textContent = "";
  const body = Object.fromEntries(new FormData(event.currentTarget).entries());
  try {
    await api(config.path, { method: "POST", body: JSON.stringify(body) });
    $("#form-dialog").close(); toast(`${config.title} completed`);
    await Promise.all([loadDashboard(), loadStudents(), loadInvoices(), loadPayments()]);
  } catch (error) {
    if (error.fields) for (const [field, message] of Object.entries(error.fields)) { const target = $(`[data-error="${field}"]`); if (target) target.textContent = message; }
    $("#dialog-error").textContent = error.message;
  }
}

$("#login-form").addEventListener("submit", async (event) => { event.preventDefault(); $("#login-error").textContent = ""; try { await signIn($("#username").value.trim(), $("#password").value); } catch (error) { $("#login-error").textContent = error.message; } });
$("#toggle-password").addEventListener("click", () => {
  const password = $("#password");
  const toggle = $("#toggle-password");
  const isVisible = password.type === "text";
  password.type = isVisible ? "password" : "text";
  toggle.textContent = isVisible ? "Show" : "Hide";
  toggle.setAttribute("aria-label", isVisible ? "Show password" : "Hide password");
  toggle.setAttribute("aria-pressed", String(!isVisible));
});
$$('[data-demo]').forEach((button) => button.addEventListener("click", () => { const credentials = { admin: ["qa.admin", "Admin123!"], accountant: ["accountant", "Account123!"], viewer: ["viewer", "Viewer123!"] }[button.dataset.demo]; $("#username").value = credentials[0]; $("#password").value = credentials[1]; }));
$$('.nav-item').forEach((button) => button.addEventListener("click", () => navigate(button.dataset.page)));
$$('[data-go]').forEach((button) => button.addEventListener("click", () => navigate(button.dataset.go)));
$("#logout-button").addEventListener("click", signOut); $("#menu-button").addEventListener("click", () => $(".sidebar").classList.toggle("open"));
$("#student-search").addEventListener("input", () => { clearTimeout(state.searchTimer); state.searchTimer = setTimeout(loadStudents, 220); });
$("#student-status").addEventListener("change", loadStudents); $("#invoice-status").addEventListener("change", loadInvoices);
$("#add-student").addEventListener("click", () => openForm("student")); $("#add-invoice").addEventListener("click", () => openForm("invoice")); $("#add-payment").addEventListener("click", () => openForm("payment"));
$("#invoices-body").addEventListener("click", (event) => { const button = event.target.closest("[data-pay]"); if (button) openForm("payment", { invoiceId: button.dataset.pay }); });
$("#payments-body").addEventListener("click", (event) => { const button = event.target.closest("[data-refund]"); if (button) openForm("refund", { paymentId: button.dataset.refund }); });
$("#dialog-close").addEventListener("click", () => $("#form-dialog").close()); $("#dialog-cancel").addEventListener("click", () => $("#form-dialog").close()); $("#entity-form").addEventListener("submit", submitForm);
$("#run-diagnostics").addEventListener("click", runDiagnostics);
$("#api-console-form").addEventListener("submit", sendConsoleRequest);
$("#generate-student").addEventListener("click", generateStudentData);
$("#create-generated-student").addEventListener("click", createGeneratedStudent);
$("#apply-faults").addEventListener("click", applyFaults);
$("#test-case-form").addEventListener("submit", submitTestCase);
$("#test-case-form").addEventListener("input", () => { clearTimeout(state.testCaseAutosaveTimer); state.testCaseAutosaveTimer = setTimeout(autoSaveTestCase, 450); });
$("#test-case-form").addEventListener("change", autoSaveTestCase);
$("#test-cases-body").addEventListener("click", handleTestCaseAction);
$("#cancel-test-case-edit").addEventListener("click", resetTestCaseForm);
$$('[data-skill]').forEach((box) => box.addEventListener("change", () => { const completed = $$('[data-skill]').filter((item) => item.checked).map((item) => item.dataset.skill); localStorage.setItem("schoolledger-sdet-skills", JSON.stringify(completed)); updateSdetProgress(); }));
$("#reset-data").addEventListener("click", async () => { if (!confirm("Reset all demo data to the original training state?")) return; try { await api("/api/reset", { method: "POST" }); toast("Demo data reset"); await Promise.all([loadDashboard(), loadStudents(), loadInvoices(), loadPayments(), loadAudit()]); } catch (error) { toast(error.message, true); } });

renderTestCases(); restoreTestCaseDraft(); restoreSession();
