import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { performance } from "node:perf_hooks";
import { createServer } from "../../src/server.mjs";

const sampleCount = 20;
const warmupCount = 3;
const p95LimitMs = Number(process.env.PERF_P95_MS ?? 500);

let server;
let baseUrl;
let adminToken;

async function timedRequest(path, options = {}) {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}${path}`, options);
  await response.arrayBuffer();
  return { status: response.status, durationMs: performance.now() - startedAt };
}

function percentile(values, percentileRank) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.ceil((percentileRank / 100) * sorted.length) - 1];
}

async function measureEndpoint(name, path, options = {}) {
  for (let attempt = 0; attempt < warmupCount; attempt += 1) {
    const warmup = await timedRequest(path, options);
    assert.equal(warmup.status, 200, `${name} warm-up request must succeed`);
  }

  const durations = [];
  for (let sample = 0; sample < sampleCount; sample += 1) {
    const result = await timedRequest(path, options);
    assert.equal(result.status, 200, `${name} sample ${sample + 1} must succeed`);
    durations.push(result.durationMs);
  }

  const metrics = {
    averageMs: durations.reduce((total, duration) => total + duration, 0) / durations.length,
    p95Ms: percentile(durations, 95),
    maxMs: Math.max(...durations)
  };
  console.log(`${name}: avg=${metrics.averageMs.toFixed(1)}ms p95=${metrics.p95Ms.toFixed(1)}ms max=${metrics.maxMs.toFixed(1)}ms samples=${sampleCount}`);
  assert.ok(metrics.p95Ms <= p95LimitMs, `${name} p95 ${metrics.p95Ms.toFixed(1)}ms exceeded ${p95LimitMs}ms`);
}

describe("API performance smoke", { concurrency: 1 }, () => {
  before(async () => {
    ({ server } = await createServer({ reset: true }));
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "qa.admin", password: "Admin123!" })
    });
    assert.equal(loginResponse.status, 200);
    adminToken = (await loginResponse.json()).token;
  });

  after(async () => {
    if (server?.listening) await new Promise((resolve) => server.close(resolve));
  });

  test("health endpoint stays within the p95 latency budget", async () => {
    await measureEndpoint("GET /api/health", "/api/health");
  });

  test("authenticated dashboard stays within the p95 latency budget", async () => {
    await measureEndpoint("GET /api/dashboard", "/api/dashboard", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  });
});
