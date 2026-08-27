import { randomUUID } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const users = [
  { id: "usr-admin", username: "qa.admin", password: "Admin123!", name: "QA Admin", role: "admin" },
  { id: "usr-accountant", username: "accountant", password: "Account123!", name: "School Accountant", role: "accountant" },
  { id: "usr-viewer", username: "viewer", password: "Viewer123!", name: "Read-only Reviewer", role: "viewer" }
];

export class Store {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.seedPath = path.join(rootDir, "data", "seed.json");
    this.runtimePath = path.join(rootDir, "data", "runtime-db.json");
    this.sessions = new Map();
    this.labConfig = { latencyMs: 0, paymentFailure: false, staleDashboard: false };
    this.data = null;
  }

  async init({ reset = false } = {}) {
    await mkdir(path.dirname(this.runtimePath), { recursive: true });
    if (reset) await copyFile(this.seedPath, this.runtimePath);
    try {
      this.data = JSON.parse(await readFile(this.runtimePath, "utf8"));
    } catch {
      await copyFile(this.seedPath, this.runtimePath);
      this.data = JSON.parse(await readFile(this.runtimePath, "utf8"));
    }
    this.refreshInvoiceStatuses();
    await this.save();
    return this;
  }

  async save() {
    await writeFile(this.runtimePath, `${JSON.stringify(this.data, null, 2)}\n`, "utf8");
  }

  login(username, password) {
    const user = users.find((candidate) => candidate.username === username && candidate.password === password);
    if (!user) return null;
    const token = randomUUID();
    this.sessions.set(token, { id: user.id, username: user.username, name: user.name, role: user.role });
    return { token, user: this.sessions.get(token) };
  }

  userForToken(token) {
    return this.sessions.get(token) ?? null;
  }

  refreshInvoiceStatuses() {
    const today = new Date().toISOString().slice(0, 10);
    for (const invoice of this.data.invoices) {
      if (invoice.paidCents >= invoice.amountCents) invoice.status = "paid";
      else if (invoice.paidCents > 0) invoice.status = "partial";
      else if (invoice.dueDate < today) invoice.status = "overdue";
      else invoice.status = "open";
    }
  }

  addAudit(user, action, entity, entityId, details) {
    this.data.audit.unshift({
      id: randomUUID(), actor: user.username, action, entity, entityId, details,
      createdAt: new Date().toISOString()
    });
    this.data.audit = this.data.audit.slice(0, 100);
  }

  newId(prefix) {
    return `${prefix}-${randomUUID().slice(0, 8)}`;
  }

  async reset(user) {
    await copyFile(this.seedPath, this.runtimePath);
    this.data = JSON.parse(await readFile(this.runtimePath, "utf8"));
    this.labConfig = { latencyMs: 0, paymentFailure: false, staleDashboard: false };
    this.addAudit(user, "DATABASE_RESET", "database", "runtime", "Demo data restored to its original state");
    await this.save();
  }
}

export const permissions = {
  admin: new Set(["read", "student:create", "student:update", "student:delete", "invoice:create", "payment:create", "refund:create", "reset", "lab:configure"]),
  accountant: new Set(["read", "student:create", "student:update", "invoice:create", "payment:create", "refund:create"]),
  viewer: new Set(["read"])
};
