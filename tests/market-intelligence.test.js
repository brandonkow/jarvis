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

  const deniedCase = await request(baseUrl, "/api/owner/development-cases", {
    method: "POST",
    body: { projectName: "Evidence Residence", area: "Bayan Lepas" }
  });
  assert.equal(deniedCase.response.status, 403);

  const createdCase = await request(baseUrl, "/api/owner/development-cases", {
    method: "POST",
    owner: true,
    body: {
      projectId,
      projectName: "Evidence Residence",
      area: "Bayan Lepas",
      state: "Penang",
      propertyType: "Condo",
      developer: "Evidence Development",
      priceSegment: "RM450k-RM550k mass-affluent high-rise",
      targetBuyer: "Own-stay buyers and investors who still need rent coverage.",
      targetTenant: "White-collar tenants working near Bayan Lepas.",
      strengths: "Efficient family-friendly layout, good rent evidence, and broad buyer pool.",
      weaknesses: "Future similar high-rise supply within 2.5km must be watched.",
      managementView: "Management is responsive and common areas are clean.",
      residentProfile: "Mix of owners, white-collar tenants, and families.",
      supplyThreat: "Newer similar layout and pricing would be the main threat.",
      rentalOutlook: "Rent appears defendable if achieved rent stays near RM2,800.",
      resaleOutlook: "Broad enough because the unit can speak to both own-stay and investor buyers.",
      ownerVerdict: "Shortlist only if current transactions and rent still support the entry price.",
      verdict: "shortlist",
      confidence: "high",
      rating: 84,
      sourceBasis: "Site visit, agent rent feedback, and owner market observation.",
      observedAt: daysAgo(3),
      tags: ["Penang", "Bayan Lepas", "rental", "family"]
    }
  });
  assert.equal(createdCase.response.status, 201);
  assert.equal(createdCase.payload.case.projectName, "Evidence Residence");

  const updatedCase = await request(baseUrl, `/api/owner/development-cases/${createdCase.payload.case.id}`, {
    method: "PATCH",
    owner: true,
    body: {
      ownerVerdict: "Updated view: shortlist only after confirming current rent, management, and the 2.5km supply set.",
      verdict: "watch",
      confidence: "medium",
      rating: 76
    }
  });
  assert.equal(updatedCase.response.status, 200);
  assert.equal(updatedCase.payload.case.verdict, "watch");
  assert.match(updatedCase.payload.case.ownerVerdict, /Updated view/);

  const cases = await request(baseUrl, "/api/owner/development-cases?q=Evidence", { owner: true });
  assert.equal(cases.response.status, 200);
  assert.equal(cases.payload.summary.matched, 1);
  assert.equal(cases.payload.cases[0].verdict, "watch");
  assert.equal(cases.payload.summary.coverage.projects, 1);
  assert.equal(cases.payload.summary.coverage.incomplete, 0);

  const caseStatus = await request(baseUrl, "/api/jarvis/status");
  assert.equal(caseStatus.payload.ownerMarket.developmentCases, 1);

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
        cashOutlay: "RM80k",
        conservativeFairValue: "RM500k",
        bankValuationSupport: "Multiple banker support",
        loanPrecheckStatus: "Pre-approved / eligibility checked",
        loanMarginPlan: "Around 90% standard",
        instalmentStress: "10% higher instalment tested",
        cashBufferAfterPurchase: "6+ months reserve after purchase",
        financingDocumentReadiness: "Complete income / CTOS / CCRIS documents",
        financingNotes: "Banker checked valuation, DSR, margin, documents, and 10% instalment stress.",
        nearbySupply: "Similar future supply",
        supplyRadius: "Within 2.5km checked",
        substituteCount: "Less than 5",
        substituteThreat: "Newer similar layout or pricing",
        futureSupplyTiming: "Under construction",
        absorptionEvidence: "Occupancy and rent holding strong",
        unsoldStockSignal: "Elevated unsold stock",
        densityLiftStress: "High density but prime pricing",
        supplyNotes: "Owner observation flags similar high-rise supply within 2.5km, so absorption must be re-verified.",
        siteVisitEvidence: "Physical visit with photos / notes",
        lobbyGuardhouseSignal: "Welcoming lobby and professional guardhouse",
        liftCarparkCorridorSignal: "Fast lift, bright car park, good corridor",
        commonAreaCondition: "Clean and well maintained",
        residentBehaviourSignal: "Respectful and responsible",
        managementResponseSignal: "Fast reply and solution-oriented",
        defectLeakageSignal: "No major defect or leakage",
        arrearsJmbSignal: "Healthy collection and JMB culture",
        siteManagementNotes: "Management replied fast, common areas were clean, residents were respectful, and no leakage was observed.",
        siteVisit: "Completed",
        legalCheck: "Clear",
        legalTitleType: "Residential title / HDA serviced residence",
        titleTransferStatus: "Issued title / transfer path clear",
        caveatRestrictionStatus: "No caveat or blocking restriction",
        sellerAuthorityStatus: "Seller authority and documents verified",
        arrearsUtilitiesStatus: "Maintenance, quit rent, assessment, utilities clear",
        stakeholderFlowStatus: "All payments through lawyer stakeholder / bank channels",
        lawyerCoordinationStatus: "Lawyer reviewed / responsive with milestones",
        legalTransactionNotes: "Lawyer reviewed land search, seller documents, arrears, and stakeholder fund flow.",
        comparableTransactions: "3 or more",
        comparableSource: "Brickz / official transaction data",
        comparableRecency: "0-6 months",
        comparableMatchQuality: "Same project",
        comparablePriceRange: "RM460k - RM500k",
        comparableAdjustmentNotes: "Adjusted for floor, view, renovation, and parking.",
        rentEvidence: "Signed tenancy or achieved rent",
        rentalSource: "Signed tenancy / achieved rent record",
        rentalRecency: "0-3 months",
        tenantUrgency: "High inquiry",
        vacancySignal: "0-1 month",
        rentalSustainability: "Stable year-round demand",
        rentalAdjustmentNotes: "Achieved rent checked against tenant profile, furnishing, vacancy, and nearby supply."
      },
      financialProfile: { monthlyIncome: "RM10,000", cashReserveMonths: "8", existingProperties: "1" }
    }
  });
  assert.equal(deal.response.status, 200);
  assert.equal(deal.payload.analysis.marketIntelligence.summary.matched, 3);
  assert.equal(deal.payload.analysis.marketIntelligence.summary.stale, 1);
  assert.equal(deal.payload.analysis.caseIntelligence.version, "case-v1");
  assert.equal(deal.payload.analysis.caseIntelligence.status, "watch");
  assert.equal(deal.payload.analysis.caseIntelligence.matched, 1);
  assert.equal(deal.payload.analysis.caseIntelligence.cases[0].projectName, "Evidence Residence");
  assert.ok(deal.payload.analysis.marketIntelligence.trends.some((trend) => trend.metricType === "rent" && trend.direction === "up"));
  assert.match(deal.payload.analysis.stages.find((stage) => stage.number === 6).summary, /founder development case/i);
  assert.ok(deal.payload.sources.some((source) => source.type === "market" && source.freshness === "fresh"));
  assert.ok(deal.payload.sources.some((source) => source.type === "case" && source.title.includes("Evidence Residence")));
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
  assert.match(chat.payload.answer, /Owner case library/i);
  assert.match(chat.payload.answer, /stale and must be re-verified/i);
  assert.ok(chat.payload.sources.some((source) => source.type === "market"));
  assert.ok(chat.payload.sources.some((source) => source.type === "case"));

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

  const deniedExport = await request(baseUrl, "/api/owner/export");
  assert.equal(deniedExport.response.status, 403);
  const ownerExport = await request(baseUrl, "/api/owner/export", { owner: true });
  assert.equal(ownerExport.response.status, 200);
  assert.equal(ownerExport.payload.exportType, "owner-knowledge-backup");
  assert.equal(ownerExport.payload.counts.projects, 2);
  assert.equal(ownerExport.payload.counts.observations, 4);
  assert.equal(ownerExport.payload.counts.developmentCases, 1);
  assert.equal(ownerExport.payload.integrity.algorithm, "sha256");
  assert.match(ownerExport.payload.integrity.hash, /^[a-f0-9]{64}$/);
  assert.ok(Array.isArray(ownerExport.payload.knowledge.projects));
  assert.ok(Array.isArray(ownerExport.payload.knowledge.developmentCases));

  const deniedRestore = await request(baseUrl, "/api/owner/restore", {
    method: "POST",
    body: { backup: ownerExport.payload, dryRun: true }
  });
  assert.equal(deniedRestore.response.status, 403);
  const restorePreview = await request(baseUrl, "/api/owner/restore", {
    method: "POST",
    owner: true,
    body: { backup: ownerExport.payload, dryRun: true }
  });
  assert.equal(restorePreview.response.status, 200);
  assert.equal(restorePreview.payload.valid, true);
  assert.equal(restorePreview.payload.dryRun, true);
  assert.equal(restorePreview.payload.confirmationPhrase, "RESTORE OWNER KNOWLEDGE");
  assert.equal(restorePreview.payload.incoming.projects, 2);
  const blockedRestore = await request(baseUrl, "/api/owner/restore", {
    method: "POST",
    owner: true,
    body: { backup: ownerExport.payload, dryRun: false }
  });
  assert.equal(blockedRestore.response.status, 409);
  const tamperedBackup = {
    ...ownerExport.payload,
    knowledge: {
      ...ownerExport.payload.knowledge,
      projects: [...ownerExport.payload.knowledge.projects, { id: "tampered", name: "Tampered Project" }]
    }
  };
  const tamperedRestore = await request(baseUrl, "/api/owner/restore", {
    method: "POST",
    owner: true,
    body: { backup: tamperedBackup, dryRun: true }
  });
  assert.equal(tamperedRestore.response.status, 400);
  assert.match(tamperedRestore.payload.errors.join(" "), /integrity check failed/i);
  const restoredBackup = await request(baseUrl, "/api/owner/restore", {
    method: "POST",
    owner: true,
    body: { backup: ownerExport.payload, dryRun: false, confirmRestore: "RESTORE OWNER KNOWLEDGE" }
  });
  assert.equal(restoredBackup.response.status, 200);
  assert.equal(restoredBackup.payload.restored, true);
  assert.equal(restoredBackup.payload.counts.projects, 2);

  const blockedDelete = await request(baseUrl, `/api/owner/market/projects/${projectId}`, { method: "DELETE", owner: true });
  assert.equal(blockedDelete.response.status, 409);
  const cascadeDelete = await request(baseUrl, `/api/owner/market/projects/${projectId}?cascade=true`, { method: "DELETE", owner: true });
  assert.equal(cascadeDelete.response.status, 200);
  assert.equal(cascadeDelete.payload.deletedObservations, 3);
});
