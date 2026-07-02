import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OWNER_TOKEN = "security-test-owner-token-1234567890";

async function freePort() {
  const probe = net.createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", resolve);
  });
  const address = probe.address();
  await new Promise((resolve) => probe.close(resolve));
  return address.port;
}

async function waitForHealth(baseUrl, child) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Test server exited with code ${child.exitCode}.`);
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // Startup is still in progress.
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Test server did not become ready.");
}

async function post(baseUrl, pathname, body, headers = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body)
  });
  return { response, payload: await response.json().catch(() => ({})) };
}

test("security hardening and Malaysian deal-cost engine", async (t) => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), "apex-security-"));
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [path.join(repoDir, "server.js")], {
    cwd: repoDir,
    env: {
      ...process.env,
      PORT: String(port),
      ESTATELAB_DATA_DIR: dataDir,
      ESTATELAB_OWNER_TOKEN: OWNER_TOKEN,
      OPENAI_API_KEY: "",
      OPENROUTER_API_KEY: ""
    },
    stdio: "ignore"
  });

  t.after(async () => {
    if (child.exitCode === null) {
      child.kill();
      await new Promise((resolve) => child.once("exit", resolve));
    }
    await rm(dataDir, { recursive: true, force: true });
  });

  await waitForHealth(baseUrl, child);

  await t.test("API responses carry security headers", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("x-frame-options"), "DENY");
    assert.ok(response.headers.get("referrer-policy"));
  });

  await t.test("static HTML carries a content security policy", async () => {
    const response = await fetch(`${baseUrl}/`);
    assert.equal(response.status, 200);
    const csp = response.headers.get("content-security-policy") || "";
    assert.match(csp, /default-src 'self'/);
    assert.match(csp, /frame-ancestors 'none'/);
  });

  await t.test("path traversal and malformed URLs are rejected", async () => {
    const traversal = await fetch(`${baseUrl}/..%2Fserver.js`);
    assert.ok([400, 403, 404].includes(traversal.status), `unexpected status ${traversal.status}`);
    const body = await traversal.text();
    assert.ok(!body.includes("ESTATELAB_OWNER_TOKEN"), "server source must not leak");
    const malformed = await fetch(`${baseUrl}/%zz`);
    assert.ok([400, 404].includes(malformed.status));
  });

  await t.test("owner APIs refuse missing and wrong tokens", async () => {
    const missing = await fetch(`${baseUrl}/api/owner/documents`);
    assert.equal(missing.status, 403);
    const wrong = await fetch(`${baseUrl}/api/owner/documents`, {
      headers: { "x-estatelab-owner-token": "wrong-token" }
    });
    assert.equal(wrong.status, 403);
    const right = await fetch(`${baseUrl}/api/owner/documents`, {
      headers: { "x-estatelab-owner-token": OWNER_TOKEN }
    });
    assert.equal(right.status, 200);
  });

  await t.test("deal-cost calculator returns tiered Malaysian estimates", async () => {
    const { response, payload } = await post(baseUrl, "/api/tools/deal-costs", {
      price: 500000,
      loanMarginPercent: 90,
      holdingYears: 7
    });
    assert.equal(response.status, 200);
    const estimate = payload.estimate;
    assert.equal(estimate.downPayment, 50000);
    assert.equal(estimate.loanAmount, 450000);
    const motDuty = estimate.items.find((item) => item.label.includes("MOT"));
    assert.equal(motDuty.amount, 9000);
    const loanDuty = estimate.items.find((item) => item.label.includes("loan agreement"));
    assert.equal(loanDuty.amount, 2250);
    const spaFee = estimate.items.find((item) => item.label === "SPA legal fee");
    assert.equal(spaFee.amount, 6250);
    assert.equal(estimate.totalTransactionCosts, 25125);
    assert.equal(estimate.estimatedCashToStart, 75125);
    assert.equal(estimate.rpgt.applicableRate, 0);

    const invalid = await post(baseUrl, "/api/tools/deal-costs", { price: -5 });
    assert.equal(invalid.response.status, 400);
  });

  await t.test("deal analysis embeds the acquisition cost estimate", async () => {
    const { response, payload } = await post(baseUrl, "/api/jarvis/analyze-deal", {
      dealCard: {
        area: "Bayan Lepas, Penang",
        projectName: "Cost Engine Residence",
        askingPrice: "RM450k",
        expectedRent: "RM2,200",
        estimatedInstallment: "RM1,900",
        loanMarginPlan: "90% margin"
      },
      financialProfile: { holdingPeriod: "7" }
    }, { "x-estatelab-client-id": "cost-test" });
    assert.equal(response.status, 200);
    const costs = payload.analysis.acquisitionCostEstimate;
    assert.ok(costs, "analysis should include acquisitionCostEstimate");
    assert.equal(costs.loanMarginPercent, 90);
    assert.ok(costs.totalTransactionCosts > 0);
    assert.ok(payload.analysis.metrics.some((metric) => metric.label === "Estimated cash to start"));
    assert.match(payload.message.content, /Estimated Malaysian entry costs/);
  });

  await t.test("guest sessions cannot evict another client's sessions", async () => {
    const first = await post(baseUrl, "/api/jarvis/sessions", {}, { "x-estatelab-client-id": "client-keep" });
    assert.equal(first.response.status, 201);
    const keepId = first.payload.session.id;
    for (let index = 0; index < 25; index += 1) {
      await post(baseUrl, "/api/jarvis/sessions", { title: `Flood ${index}` }, { "x-estatelab-client-id": "client-flood" });
    }
    const lookup = await fetch(`${baseUrl}/api/jarvis/sessions/${keepId}`, {
      headers: { "x-estatelab-client-id": "client-keep" }
    });
    assert.equal(lookup.status, 200, "other client's session should survive a flood");
    const floodList = await fetch(`${baseUrl}/api/jarvis/sessions`, {
      headers: { "x-estatelab-client-id": "client-flood" }
    });
    const floodSessions = (await floodList.json()).sessions;
    assert.ok(floodSessions.length <= 20, "per-owner session cap should hold");
  });

  await t.test("affordability calculator applies DSR and stress bands", async () => {
    const { response, payload } = await post(baseUrl, "/api/tools/affordability", {
      monthlyIncome: 10000,
      monthlyCommitments: 2000,
      interestRate: 4.3,
      tenureYears: 30,
      dsrLimit: 70
    });
    assert.equal(response.status, 200);
    const estimate = payload.estimate;
    assert.equal(estimate.currentDsr, 20);
    assert.equal(estimate.maxNewInstallment, 5000);
    assert.ok(estimate.maxLoan > 900000, `maxLoan ${estimate.maxLoan} should exceed RM900k`);
    assert.ok(estimate.stressTest.maxLoan < estimate.maxLoan, "stressed loan must be lower");
    const invalid = await post(baseUrl, "/api/tools/affordability", { monthlyIncome: 0 });
    assert.equal(invalid.response.status, 400);
  });

  await t.test("account export requires sign-in and returns private data", async () => {
    const anonymous = await fetch(`${baseUrl}/api/me/export`);
    assert.equal(anonymous.status, 401);
    const register = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "export@example.com", displayName: "Export Tester", password: "long-password-123" })
    });
    assert.equal(register.status, 201);
    const cookie = (register.headers.get("set-cookie") || "").split(";")[0];
    const exportResponse = await fetch(`${baseUrl}/api/me/export`, { headers: { cookie } });
    assert.equal(exportResponse.status, 200);
    const exported = await exportResponse.json();
    assert.equal(exported.format, "apex-analytic-account-export.v1");
    assert.equal(exported.profile.email, "export@example.com");
    assert.ok(Array.isArray(exported.reports));
    assert.ok(Array.isArray(exported.journal));
  });

  await t.test("owner export returns the knowledge base backup", async () => {
    const forbidden = await fetch(`${baseUrl}/api/owner/export`);
    assert.equal(forbidden.status, 403);
    const response = await fetch(`${baseUrl}/api/owner/export`, {
      headers: { "x-estatelab-owner-token": OWNER_TOKEN }
    });
    assert.equal(response.status, 200);
    const exported = await response.json();
    assert.equal(exported.format, "apex-analytic-owner-export.v1");
    assert.ok(Array.isArray(exported.brain.beliefs) && exported.brain.beliefs.length > 0);
    assert.ok(Array.isArray(exported.knowledge.projects));
    assert.equal(exported.knowledge.chunks, undefined, "chunks stay out unless requested");
  });

  await t.test("property creation ignores client-supplied ids", async () => {
    const { response, payload } = await post(baseUrl, "/api/properties", {
      id: "attacker-chosen-id",
      name: "Mass assignment probe",
      price: 300000
    }, { "x-estatelab-owner-token": OWNER_TOKEN });
    assert.equal(response.status, 201);
    assert.notEqual(payload.id, "attacker-chosen-id");
  });
});
