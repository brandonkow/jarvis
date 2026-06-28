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

async function request(baseUrl, pathname, { method = "GET", body, cookie = "", clientId = "journal-device" } = {}) {
  const headers = { "x-estatelab-client-id": clientId };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (cookie) headers.cookie = cookie;
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const payload = response.status === 204 ? null : await response.json();
  return { response, payload, cookie: String(response.headers.get("set-cookie") || "").split(";")[0] };
}

test("decision journal locks pre-purchase reasoning and recalls reviewed lessons privately", async (t) => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), "apex-journal-"));
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [path.join(repoDir, "server.js")], {
    cwd: repoDir,
    env: { ...process.env, PORT: String(port), ESTATELAB_DATA_DIR: dataDir, OPENAI_API_KEY: "", OPENROUTER_API_KEY: "" },
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
  const registration = await request(baseUrl, "/api/auth/register", {
    method: "POST",
    body: { displayName: "Journal Member", email: "journal@example.com", password: "journal-password-123" }
  });
  const cookie = registration.cookie;
  const session = await request(baseUrl, "/api/jarvis/sessions", { method: "POST", cookie, body: {} });
  const dealCard = {
    area: "Bayan Lepas, Penang",
    projectName: "Journal Test Residence",
    propertyType: "Condo",
    askingPrice: "RM400k",
    conservativeFairValue: "RM500k",
    expectedRent: "RM3,000",
    maintenance: "RM300",
    estimatedInstallment: "RM2,000",
    unitPosition: "Good",
    ownStayAppeal: "Strong",
    managementQuality: "Strong",
    exitBuyerPool: "Own-stay and investor",
    comparableTransactions: "3 or more",
    comparableSource: "Brickz / official transaction data",
    comparableRecency: "0-6 months",
    comparableMatchQuality: "Same project",
    comparablePriceRange: "RM480k - RM520k",
    comparableAdjustmentNotes: "Adjusted for floor, view, renovation, and parking.",
    rentEvidence: "Signed tenancy or achieved rent",
    rentalSource: "Signed tenancy / achieved rent record",
    rentalRecency: "0-3 months",
    tenantUrgency: "High inquiry",
    vacancySignal: "0-1 month",
    rentalSustainability: "Stable year-round demand",
    rentalAdjustmentNotes: "Achieved rent checked against tenant profile, furnishing, vacancy, and nearby supply.",
    siteVisit: "Completed",
    legalCheck: "Clear",
    nearbySupply: "No direct similar supply",
    investmentThesis: "Employment demand should sustain rent and broad resale demand.",
    killCriterion: "Walk away if achieved rent or title cannot be verified."
  };
  const financialProfile = {
    monthlyIncome: "RM10,000",
    cashReserveMonths: "8",
    cashAvailable: "RM150k",
    currentDebt: "RM1,000",
    holdingPeriod: "7",
    existingProperties: "1"
  };
  const analysis = await request(baseUrl, "/api/jarvis/analyze-deal", {
    method: "POST",
    cookie,
    body: { sessionId: session.payload.session.id, dealCard, financialProfile }
  });
  const reportId = analysis.payload.savedReport.id;

  const created = await request(baseUrl, "/api/journal", { method: "POST", cookie, body: { reportId } });
  assert.equal(created.response.status, 201);
  assert.match(created.payload.decision.prePurchase.thesis, /employment demand/i);
  assert.equal(created.payload.decision.prePurchase.holdingPeriod, "7");
  const decisionId = created.payload.decision.id;

  const duplicate = await request(baseUrl, "/api/journal", { method: "POST", cookie, body: { reportId } });
  assert.equal(duplicate.payload.existing, true);
  assert.equal(duplicate.payload.decision.id, decisionId);

  const updated = await request(baseUrl, `/api/journal/${decisionId}`, {
    method: "PATCH",
    cookie,
    body: {
      action: "update",
      decision: "proceed",
      confidence: 78,
      thesis: "Employment demand and a wide buyer pool should support the seven-year hold.",
      counterThesis: "Newer supply may weaken rent and exit pricing before resale.",
      killCriterion: "Stop if signed rent is below RM2,500 or title is not clear.",
      holdingPeriod: "7 years",
      notes: "Verify management response time before commitment."
    }
  });
  assert.equal(updated.payload.decision.prePurchase.decision, "proceed");
  const locked = await request(baseUrl, `/api/journal/${decisionId}`, { method: "PATCH", cookie, body: { action: "lock" } });
  assert.ok(locked.payload.decision.lockedAt);

  const hindsightEdit = await request(baseUrl, `/api/journal/${decisionId}`, {
    method: "PATCH",
    cookie,
    body: { action: "update", thesis: "Rewrite after result" }
  });
  assert.equal(hindsightEdit.response.status, 409);
  const lockedDelete = await request(baseUrl, `/api/journal/${decisionId}`, { method: "DELETE", cookie });
  assert.equal(lockedDelete.response.status, 409);

  const reviewed = await request(baseUrl, `/api/journal/${decisionId}`, {
    method: "PATCH",
    cookie,
    body: {
      action: "review",
      outcomeStatus: "holding",
      actualRent: "RM2,800",
      currentValue: "RM515k",
      processScore: 82,
      executionScore: 76,
      outcomeScore: 72,
      luckScore: 35,
      result: "The property rented within one month and management remained responsive.",
      lesson: "Management response and broad tenant demand mattered more than decorative facilities."
    }
  });
  assert.equal(reviewed.payload.summary.skillSignal, "Disciplined process with supporting outcome");

  const memory = await request(baseUrl, "/api/memory", {
    method: "POST",
    cookie,
    body: { content: "I prefer deals where management response and broad tenant demand are clearly proven before purchase." }
  });
  assert.equal(memory.response.status, 201);
  const approvedMemory = await request(baseUrl, `/api/memory/${memory.payload.item.id}`, {
    method: "PATCH",
    cookie,
    body: { action: "approve" }
  });
  assert.equal(approvedMemory.payload.item.status, "approved");
  const memorySettings = await request(baseUrl, "/api/memory/settings", {
    method: "PATCH",
    cookie,
    body: { reasoningEnabled: true }
  });
  assert.equal(memorySettings.payload.settings.reasoningEnabled, true);

  const learnedReport = await request(baseUrl, "/api/jarvis/analyze-deal", {
    method: "POST",
    cookie,
    body: {
      sessionId: session.payload.session.id,
      dealCard: {
        ...dealCard,
        projectName: "Journal Test Residence Phase 2",
        investmentThesis: "Management response and broad tenant demand should support this similar deal.",
        mainConcern: "Need to compare against the previous lesson on management response."
      },
      financialProfile
    }
  });
  assert.equal(learnedReport.response.status, 200);
  assert.equal(learnedReport.payload.analysis.learningLoop.memoryCount, 1);
  assert.equal(learnedReport.payload.analysis.learningLoop.journalCount, 1);
  assert.equal(learnedReport.payload.analysis.learningLoop.profile.approvedCount, 1);
  assert.match(learnedReport.payload.analysis.learningLoop.profile.riskStyle, /cautious/i);
  assert.equal(learnedReport.payload.analysis.personalizedChallenge.status, "reminder");
  assert.match(learnedReport.payload.analysis.personalizedChallenge.message, /management response/i);
  assert.ok(learnedReport.payload.analysis.personalizedChallenge.checks.some((check) => /management/i.test(check.action)));
  assert.ok(learnedReport.payload.analysis.learningLoop.signals.some((signal) => signal.type === "memory" && /management response/i.test(signal.body)));
  assert.ok(learnedReport.payload.analysis.learningLoop.signals.some((signal) => signal.type === "journal" && /Management response/i.test(signal.body)));
  assert.ok(learnedReport.payload.analysis.nextActions.some((action) => /remembered lesson/i.test(action)));
  assert.equal(learnedReport.payload.analysis.dealMemoryComparison.status, "matched");
  assert.ok(learnedReport.payload.analysis.dealMemoryComparison.matches.some((match) => /Journal Test Residence/i.test(match.subject)));
  assert.ok(learnedReport.payload.analysis.beliefTracker.beliefs.some((belief) => /management response/i.test(belief.label)));
  assert.ok(learnedReport.payload.analysis.sourceTransparency.sources.some((source) => source.type === "memory" && source.status === "used"));
  assert.ok(learnedReport.payload.analysis.sourceTransparency.sources.some((source) => source.type === "journal" && source.status === "used"));
  assert.ok(learnedReport.payload.analysis.sourceTransparency.sources.some((source) => source.type === "saved_deal" && source.status === "used"));
  assert.ok(["clear", "review"].includes(learnedReport.payload.analysis.memoryConflicts.status));
  assert.ok(learnedReport.payload.analysis.personalOperatingRules.rules.some((rule) => /Site-visit|Cash-flow|Cheap|memory/i.test(rule.label)));
  assert.ok(learnedReport.payload.sources.some((source) => source.type === "memory" && source.id === memory.payload.item.id));
  assert.ok(learnedReport.payload.sources.some((source) => source.type === "journal" && source.id === decisionId));
  assert.ok(learnedReport.payload.sources.some((source) => source.type === "saved_report" && source.id === reportId));

  const collection = await request(baseUrl, "/api/journal", { cookie });
  assert.equal(collection.payload.summary.reviewed, 1);
  assert.equal(collection.payload.summary.averageProcessScore, 82);

  const recalled = await request(baseUrl, "/api/jarvis/query", {
    method: "POST",
    cookie,
    body: { sessionId: session.payload.session.id, query: "What did I learn from Journal Test Residence?" }
  });
  assert.ok(recalled.payload.sources.some((source) => source.type === "journal" && source.id === decisionId));
  assert.match(recalled.payload.answer, /management response/i);

  const secondRegistration = await request(baseUrl, "/api/auth/register", {
    method: "POST",
    clientId: "second-journal-device",
    body: { displayName: "Other Member", email: "other-journal@example.com", password: "other-password-123" }
  });
  const isolated = await request(baseUrl, "/api/journal", { cookie: secondRegistration.cookie, clientId: "second-journal-device" });
  assert.equal(isolated.payload.decisions.length, 0);
});
