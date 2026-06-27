import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

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

async function request(baseUrl, pathname, { method = "GET", body, owner = false } = {}) {
  const headers = { "x-estatelab-client-id": "market-intelligence-test" };
  if (owner) headers["x-estatelab-owner-token"] = "owner-market-token";
  if (body !== undefined) headers["content-type"] = "application/json";
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { response, payload: response.status === 204 ? null : await response.json() };
}

function daysAgo(days) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

test("owner market observations add dated trends and freshness warnings to Apex reasoning", async (t) => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), "apex-market-"));
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [path.join(repoDir, "server.js")], {
    cwd: repoDir,
    env: {
      ...process.env,
      PORT: String(port),
      ESTATELAB_DATA_DIR: dataDir,
      ESTATELAB_OWNER_TOKEN: "owner-market-token",
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
  const status = await request(baseUrl, "/api/jarvis/status");
  assert.equal(status.response.status, 200);
  assert.equal(status.payload.ownerMarket.enabled, true);
  assert.equal(status.payload.ownerMarket.marketObservations, 0);

  const denied = await request(baseUrl, "/api/owner/market/projects", {
    method: "POST",
    body: { name: "Owner-only Residence" }
  });
  assert.equal(denied.response.status, 403);

  const createdProject = await request(baseUrl, "/api/owner/market/projects", {
    method: "POST",
    owner: true,
    body: {
      name: "Evidence Residence",
      area: "Bayan Lepas",
      state: "Penang",
      propertyType: "Condo",
      developer: "Evidence Development",
      tenure: "Freehold",
      aliases: ["ER Penang"]
    }
  });
  assert.equal(createdProject.response.status, 201);
  const projectId = createdProject.payload.project.id;

  const observationInputs = [
    {
      projectId,
      metricType: "rent",
      value: 2600,
      unit: "RM/month",
      observedAt: daysAgo(45),
      sourceType: "rental agent",
      confidence: "high",
      notes: "Achieved two-bedroom rent from a signed tenancy."
    },
    {
      projectId,
      metricType: "rent",
      value: 2800,
      unit: "RM/month",
      observedAt: daysAgo(5),
      sourceType: "rental agent",
      sourceReference: "private-agent@example.com",
      confidence: "high",
      notes: "Latest achieved two-bedroom rent from a signed tenancy."
    },
    {
      projectId,
      metricType: "supply",
      value: 900,
      unit: "units",
      observedAt: daysAgo(500),
      sourceType: "developer launch material",
      confidence: "medium",
      notes: "New similar high-rise supply was announced within 2.5km."
    }
  ];
  for (const body of observationInputs) {
    const created = await request(baseUrl, "/api/owner/market/observations", { method: "POST", owner: true, body });
    assert.equal(created.response.status, 201);
  }

  const observations = await request(baseUrl, `/api/owner/market/observations?projectId=${projectId}`, { owner: true });
  assert.equal(observations.response.status, 200);
  assert.equal(observations.payload.summary.matched, 3);
  assert.equal(observations.payload.summary.fresh, 2);
  assert.equal(observations.payload.summary.stale, 1);
  const latestRent = observations.payload.observations.find((item) => item.metricType === "rent" && item.value === 2800);
  assert.equal(latestRent.trend.direction, "up");
  assert.equal(latestRent.trend.percentChange, 7.7);

  const session = await request(baseUrl, "/api/jarvis/sessions", { method: "POST", body: {} });
  const deal = await request(baseUrl, "/api/jarvis/analyze-deal", {
    method: "POST",
    body: {
      sessionId: session.payload.session.id,
      dealCard: {
        projectName: "Evidence Residence",
        area: "Bayan Lepas, Penang",
        propertyType: "Condo",
        askingPrice: "RM480k",
        expectedRent: "RM2,800",
        estimatedInstallment: "RM2,100",
        maintenance: "RM300",
        nearbySupply: "Similar future supply",
        comparableTransactions: "3 or more",
        rentEvidence: "Signed tenancy or achieved rent"
      },
      financialProfile: { monthlyIncome: "RM10,000", cashReserveMonths: "8", existingProperties: "1" }
    }
  });
  assert.equal(deal.response.status, 200);
  assert.equal(deal.payload.analysis.marketIntelligence.summary.matched, 3);
  assert.equal(deal.payload.analysis.marketIntelligence.summary.stale, 1);
  assert.ok(deal.payload.analysis.marketIntelligence.trends.some((trend) => trend.metricType === "rent" && trend.direction === "up"));
  assert.match(deal.payload.analysis.stages.find((stage) => stage.number === 6).summary, /owner market observations match/i);
  assert.ok(deal.payload.sources.some((source) => source.type === "market" && source.freshness === "fresh"));
  assert.equal(JSON.stringify(deal.payload).includes("private-agent@example.com"), false);

  const chat = await request(baseUrl, "/api/jarvis/query", {
    method: "POST",
    body: {
      sessionId: session.payload.session.id,
      query: "What does our latest Evidence Residence rental and supply evidence say?"
    }
  });
  assert.equal(chat.response.status, 200);
  assert.match(chat.payload.answer, /Market intelligence/i);
  assert.match(chat.payload.answer, /stale and must be re-verified/i);
  assert.ok(chat.payload.sources.some((source) => source.type === "market"));

  const batch = await request(baseUrl, "/api/owner/market/import", {
    method: "POST",
    owner: true,
    body: {
      projects: [{ id: "batch-project", name: "Batch Suites", area: "KLCC", state: "Kuala Lumpur" }],
      observations: [{ projectId: "batch-project", metricType: "occupancy", value: 92, unit: "%", observedAt: daysAgo(8), notes: "Agent-estimated occupied units." }]
    }
  });
  assert.equal(batch.response.status, 201);
  assert.deepEqual(batch.payload.imported, { projects: 1, observations: 1 });

  const blockedDelete = await request(baseUrl, `/api/owner/market/projects/${projectId}`, { method: "DELETE", owner: true });
  assert.equal(blockedDelete.response.status, 409);
  const cascadeDelete = await request(baseUrl, `/api/owner/market/projects/${projectId}?cascade=true`, { method: "DELETE", owner: true });
  assert.equal(cascadeDelete.response.status, 200);
  assert.equal(cascadeDelete.payload.deletedObservations, 3);
});
