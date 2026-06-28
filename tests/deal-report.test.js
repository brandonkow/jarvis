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

async function post(baseUrl, pathname, body) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-estatelab-client-id": "deal-report-test"
    },
    body: JSON.stringify(body)
  });
  return { response, payload: await response.json() };
}

test("deal report separates evidence, suitability, exit risk, and downside scenarios", async (t) => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), "apex-deal-report-"));
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
  const session = await post(baseUrl, "/api/jarvis/sessions", {});
  const dealCard = {
    area: "Bayan Lepas, Penang",
    projectName: "Evidence Residence",
    propertyType: "Condo",
    propertyAge: "5",
    askingPrice: "RM400k",
    conservativeFairValue: "RM500k",
    expectedRent: "RM3,000",
    maintenance: "RM300",
    estimatedInstallment: "RM2,000",
    cashOutlay: "RM80k",
    annualAssessmentQuitRent: "RM1,200",
    annualInsuranceTax: "RM600",
    monthlyRepairReserve: "RM200",
    furnishingBudget: "RM20k",
    vacancyStressMonths: "2",
    tenure: "Freehold residential title",
    unitPosition: "Good",
    ownStayAppeal: "Strong",
    managementQuality: "Strong",
    exitBuyerPool: "Own-stay and investor",
    comparableTransactions: "3 or more",
    rentEvidence: "Signed tenancy or achieved rent",
    siteVisit: "Completed",
    legalCheck: "Clear",
    dealSource: "Agency in-house app",
    agentBehavior: "One-time genuine approach",
    sellerMotivation: "Urgent cash need and open to negotiation",
    siteVisitNotes: "Clean lobby, fast lift, family-oriented facilities, bright car park, and good vibe.",
    targetTenant: "Working professionals",
    tenantScreening: "Employment proof, identity, and occupant count checked.",
    furnishingStrategy: "Fully furnished",
    exitStrategyPlan: "Sell vacant after renovation",
    resalePreparation: "Bank value, staging, renovation, vacant viewing, and buyer objection list.",
    nearbySupply: "No direct similar supply",
    investmentThesis: "Employment demand supports rent and the unit has broad resale appeal.",
    killCriterion: "Walk away if title or achieved rent cannot be verified."
  };
  const financialProfile = {
    monthlyIncome: "RM10,000",
    cashReserveMonths: "8",
    cashAvailable: "RM150k",
    currentDebt: "RM1,000",
    investmentGoal: "Balanced rental and resale",
    holdingPeriod: "7",
    existingProperties: "1",
    portfolioRole: "Cash-flow base",
    existingPortfolioHealth: "Stable rent and costs",
    concentrationRisk: "Low",
    nextPurchaseReason: "Build a cash-flow base before larger appreciation plays."
  };

  const result = await post(baseUrl, "/api/jarvis/analyze-deal", {
    sessionId: session.payload.session.id,
    dealCard,
    financialProfile
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.payload.analysis.dimensions.length, 4);
  assert.deepEqual(result.payload.analysis.dimensions.map((item) => item.key), ["property", "investor", "evidence", "exit"]);
  assert.equal(result.payload.analysis.dimensions.find((item) => item.key === "evidence").score, 95);
  assert.equal(result.payload.analysis.scenarios.length, 4);
  assert.equal(result.payload.analysis.scenarios[0].monthlyCashFlow, 700);
  assert.ok(result.payload.analysis.scenarios[3].monthlyCashFlow < result.payload.analysis.scenarios[0].monthlyCashFlow);
  assert.equal(result.payload.analysis.stressEnvelope.status, "pressure");
  assert.equal(result.payload.analysis.stressEnvelope.baseTrueHolding, "RM350");
  assert.equal(result.payload.analysis.stressEnvelope.stressedTrueHolding, "-RM600");
  assert.equal(result.payload.analysis.stressEnvelope.cashAfterStressReserves, "RM50,000");
  assert.ok(result.payload.analysis.stressEnvelope.reserveSurvivalMonths >= 80);
  assert.ok(result.payload.analysis.stressEnvelope.assumptions.some((item) => item.label === "Repair reserve" && item.source === "provided"));
  assert.equal(result.payload.analysis.portfolioGate.status, "review");
  assert.equal(result.payload.analysis.portfolioGate.checks.length, 6);
  assert.ok(result.payload.analysis.portfolioGate.checks.some((item) => item.label === "Portfolio role" && item.status === "clear"));
  assert.ok(result.payload.analysis.portfolioGate.checks.some((item) => item.label === "Combined stress survival" && item.status === "caution"));
  assert.equal(result.payload.analysis.marketPulse.status, "opportunity");
  assert.equal(result.payload.analysis.marketPulse.checks.length, 5);
  assert.ok(result.payload.analysis.marketPulse.checks.some((item) => item.label === "Supply absorption" && item.status === "clear"));
  assert.equal(result.payload.analysis.holdExitPlan.action, "monitor");
  assert.equal(result.payload.analysis.holdExitPlan.triggers.length, 6);
  assert.ok(result.payload.analysis.holdExitPlan.triggers.some((item) => item.label === "Refinance review" && item.status === "watch"));
  assert.equal(result.payload.analysis.decisionSeal.status, "conditional");
  assert.equal(result.payload.analysis.decisionSeal.conditions.length, 7);
  assert.ok(result.payload.analysis.decisionSeal.conditions.some((item) => item.label === "Stress survival" && item.status === "review"));
  assert.equal(result.payload.analysis.siteVisitAssistant.status, "ready");
  assert.equal(result.payload.analysis.siteVisitAssistant.checks.length, 5);
  assert.ok(result.payload.analysis.siteVisitAssistant.checks.some((item) => item.label === "Own-stay vibe" && item.status === "clear"));
  assert.equal(result.payload.analysis.sourcingProfessional.status, "clean");
  assert.equal(result.payload.analysis.sourcingProfessional.checks.length, 5);
  assert.ok(result.payload.analysis.sourcingProfessional.checks.some((item) => item.label === "Agent behaviour" && item.status === "clear"));
  assert.equal(result.payload.analysis.tenantRentalPlan.status, "ready");
  assert.equal(result.payload.analysis.tenantRentalPlan.checks.length, 5);
  assert.ok(result.payload.analysis.tenantRentalPlan.checks.some((item) => item.label === "Screening discipline" && item.status === "clear"));
  assert.equal(result.payload.analysis.exitStrategy.status, "clear");
  assert.equal(result.payload.analysis.exitStrategy.checks.length, 5);
  assert.ok(result.payload.analysis.exitStrategy.checks.some((item) => item.label === "Resale emotion" && item.status === "clear"));
  assert.ok(result.payload.analysis.metrics.some((metric) => metric.label === "Operating yield"));
  assert.equal(result.payload.analysis.verdict, "SHORTLIST");
  assert.equal(result.payload.analysis.engineVersion, "Apex v4.0");
  assert.equal(result.payload.analysis.reasoningMode, "Framework only");
  assert.deepEqual(result.payload.analysis.recommendationBlockers, []);
  assert.equal(result.payload.analysis.challengeMode.label, "Mentor challenge");
  assert.equal(result.payload.analysis.decisionFocus.label, "Shortlist, not buy yet");
  assert.equal(result.payload.analysis.investorReadiness.label, "Ready");
  assert.ok(result.payload.analysis.investorReadiness.score >= 80);
  assert.equal(result.payload.analysis.evidenceChecklist.length, 8);
  assert.ok(result.payload.analysis.evidenceChecklist.some((item) => item.label === "Completed value evidence" && item.status === "done"));
  assert.equal(result.payload.analysis.evidenceEngine.status, "proven");
  assert.equal(result.payload.analysis.evidenceEngine.score, 100);
  assert.equal(result.payload.analysis.evidenceEngine.gates.length, 7);
  assert.match(result.payload.analysis.evidenceEngine.recommendationGate, /Shortlist-level confidence allowed/i);
  assert.equal(result.payload.analysis.dueDiligencePlan.tasks.length, 10);
  assert.ok(result.payload.analysis.dueDiligencePlan.tasks.some((item) => item.owner === "Lawyer" && item.status === "done"));
  assert.ok(result.payload.analysis.dueDiligencePlan.tasks.some((item) => item.owner === "Agent" && /subsale/i.test(item.action)));
  assert.equal(result.payload.analysis.executionPlan.posture, "Controlled negotiation");
  assert.equal(result.payload.analysis.executionPlan.openingAnchor, "RM400,000");
  assert.equal(result.payload.analysis.executionPlan.maximumOffer, "RM400,000");
  assert.equal(result.payload.analysis.executionPlan.actions.length, 11);
  assert.ok(result.payload.analysis.executionPlan.actions.some((item) => item.lane === "Offer" && item.status === "clear"));
  assert.ok(result.payload.analysis.executionPlan.actions.some((item) => item.lane === "Renovation" && /RM20,000/.test(item.action)));

  const provisional = await post(baseUrl, "/api/jarvis/analyze-deal", {
    sessionId: session.payload.session.id,
    dealCard: { ...dealCard, siteVisit: "Not yet" },
    financialProfile
  });
  assert.equal(provisional.payload.analysis.verdict, "INVESTIGATE");
  assert.ok(provisional.payload.analysis.confidence <= 64);
  assert.ok(provisional.payload.analysis.recommendationBlockers.some((message) => /site visit/i.test(message)));
  assert.equal(provisional.payload.analysis.challengeMode.label, "Evidence blocker");
  assert.equal(provisional.payload.analysis.decisionFocus.label, "Clear before shortlist");
  assert.ok(provisional.payload.analysis.evidenceChecklist.some((item) => item.label === "Site visit and project feel" && item.status === "missing"));
  assert.ok(provisional.payload.analysis.evidenceEngine.score < 100);
  assert.ok(provisional.payload.analysis.evidenceEngine.criticalGaps.some((item) => /Site and management/i.test(item)));
  assert.ok(provisional.payload.analysis.dueDiligencePlan.tasks.some((item) => item.owner === "Site Visit" && item.priority === "high" && item.status === "required"));
  assert.ok(provisional.payload.analysis.executionPlan.actions.some((item) => item.lane === "Site" && item.status === "caution"));

  const boundaryBreach = await post(baseUrl, "/api/jarvis/analyze-deal", {
    sessionId: session.payload.session.id,
    dealCard: {
      ...dealCard,
      mainConcern: "Marked-up consideration with cash back through a bulk purchase arrangement."
    },
    financialProfile
  });
  assert.equal(boundaryBreach.payload.analysis.verdict, "REJECT");
  assert.ok(boundaryBreach.payload.analysis.hardStops.some((message) => /Marked-up/i.test(message)));
  assert.ok(boundaryBreach.payload.analysis.hardStops.some((message) => /bulk purchase/i.test(message)));
  assert.equal(boundaryBreach.payload.analysis.challengeMode.label, "Refuse validation");
  assert.equal(boundaryBreach.payload.analysis.decisionFocus.tone, "danger");
  assert.equal(boundaryBreach.payload.analysis.executionPlan.posture, "No offer");
  assert.ok(boundaryBreach.payload.analysis.executionPlan.walkAway.includes("clean, legally supportable"));
  assert.equal(boundaryBreach.payload.analysis.portfolioGate.status, "block");
  assert.equal(boundaryBreach.payload.analysis.holdExitPlan.action, "pause");
  assert.equal(boundaryBreach.payload.analysis.decisionSeal.status, "blocked");
  assert.equal(boundaryBreach.payload.analysis.evidenceEngine.status, "blocked");

  const forcedFinancing = await post(baseUrl, "/api/jarvis/analyze-deal", {
    sessionId: session.payload.session.id,
    dealCard,
    financialProfile: {
      ...financialProfile,
      financialConcern: "Loan rejected by many banks and CTOS looks weak."
    }
  });
  assert.equal(forcedFinancing.payload.analysis.verdict, "PAUSE");
  assert.ok(forcedFinancing.payload.analysis.hardStops.some((message) => /loan rejection/i.test(message)));
  assert.equal(forcedFinancing.payload.analysis.challengeMode.label, "Profile or holding pause");
  assert.equal(forcedFinancing.payload.analysis.investorReadiness.label, "Not ready");

  const unsafe = await post(baseUrl, "/api/jarvis/analyze-deal", {
    sessionId: session.payload.session.id,
    dealCard: { ...dealCard, legalCheck: "Issue found" },
    financialProfile
  });
  assert.equal(unsafe.payload.analysis.verdict, "REJECT");
  assert.ok(unsafe.payload.analysis.hardStops.some((message) => /title or legal issue/i.test(message)));
  assert.ok(unsafe.payload.analysis.evidenceEngine.gates.some((gate) => gate.label === "Legal and title safety" && gate.status === "blocked"));
});
