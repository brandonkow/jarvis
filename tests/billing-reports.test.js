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

async function request(baseUrl, pathname, { method = "GET", body, cookie = "", authorization = "" } = {}) {
  const headers = { "x-estatelab-client-id": "billing-report-test" };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (cookie) headers.cookie = cookie;
  if (authorization) headers.authorization = authorization;
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const payload = response.status === 204 ? null : await response.json();
  return { response, payload, cookie: String(response.headers.get("set-cookie") || "").split(";")[0] };
}

const dealCard = {
  area: "Bayan Lepas, Penang",
  projectName: "Billing Test Residence",
  propertyType: "Condo",
  propertyAge: "4",
  askingPrice: "RM400k",
  conservativeFairValue: "RM500k",
  expectedRent: "RM3,000",
  maintenance: "RM300",
  estimatedInstallment: "RM2,000",
  cashOutlay: "RM80k",
  bankValuationSupport: "Multiple banker support",
  loanPrecheckStatus: "Pre-approved / eligibility checked",
  loanMarginPlan: "Around 90% standard",
  instalmentStress: "10% higher instalment tested",
  cashBufferAfterPurchase: "6+ months reserve after purchase",
  financingDocumentReadiness: "Complete income / CTOS / CCRIS documents",
  financingNotes: "Banker checked valuation, DSR, margin, documents, and 10% instalment stress.",
  supplyRadius: "Within 2.5km checked",
  substituteCount: "Less than 5",
  substituteThreat: "No direct similar substitute",
  futureSupplyTiming: "No material VP nearby",
  absorptionEvidence: "Occupancy and rent holding strong",
  unsoldStockSignal: "Less than 1% unsold",
  densityLiftStress: "Below 1.5k units and lift wait acceptable",
  supplyNotes: "Closest substitutes checked; no direct similar threat and rent is holding.",
  siteVisitEvidence: "Physical visit with photos / notes",
  lobbyGuardhouseSignal: "Welcoming lobby and professional guardhouse",
  liftCarparkCorridorSignal: "Fast lift, bright car park, good corridor",
  commonAreaCondition: "Clean and well maintained",
  residentBehaviourSignal: "Respectful and responsible",
  managementResponseSignal: "Fast reply and solution-oriented",
  defectLeakageSignal: "No major defect or leakage",
  arrearsJmbSignal: "Healthy collection and JMB culture",
  siteManagementNotes: "Management replied fast, common areas were clean, residents were respectful, and no leakage was observed.",
  tenure: "Freehold residential title",
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
  existingProperties: "1"
};

test("billing meters reports, preserves private history, and accepts idempotent upgrades", async (t) => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), "apex-billing-"));
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [path.join(repoDir, "server.js")], {
    cwd: repoDir,
    env: {
      ...process.env,
      PORT: String(port),
      ESTATELAB_DATA_DIR: dataDir,
      ESTATELAB_AUTH_DEBUG_TOKENS: "true",
      APEX_BILLING_ENFORCEMENT: "true",
      APEX_BILLING_WEBHOOK_SECRET: "billing-test-secret",
      APEX_PRO_CHECKOUT_URL: "https://checkout.example/pro?email={email}&account={userId}",
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
  const plans = await request(baseUrl, "/api/billing/plans");
  assert.equal(plans.payload.plans.find((plan) => plan.id === "pro").checkoutAvailable, true);
  assert.equal(plans.payload.enforcementEnabled, true);

  const guestSession = await request(baseUrl, "/api/jarvis/sessions", { method: "POST", body: {} });
  const guestReport = await request(baseUrl, "/api/jarvis/analyze-deal", {
    method: "POST",
    body: { sessionId: guestSession.payload.session.id, dealCard, financialProfile }
  });
  assert.equal(guestReport.response.status, 401);
  assert.equal(guestReport.payload.code, "SIGN_IN_REQUIRED");

  const registration = await request(baseUrl, "/api/auth/register", {
    method: "POST",
    body: { displayName: "Billing Member", email: "billing@example.com", password: "billing-password-123" }
  });
  const cookie = registration.cookie;
  const session = await request(baseUrl, "/api/jarvis/sessions", { method: "POST", cookie, body: {} });

  for (let index = 1; index <= 3; index += 1) {
    const report = await request(baseUrl, "/api/jarvis/analyze-deal", {
      method: "POST",
      cookie,
      body: { sessionId: session.payload.session.id, dealCard: { ...dealCard, projectName: `Billing Test ${index}` }, financialProfile }
    });
    assert.equal(report.response.status, 200);
    assert.equal(report.payload.savedReport.subject, `Billing Test ${index}`);
    assert.equal(report.payload.billing.usage.used, index);
  }

  const limited = await request(baseUrl, "/api/jarvis/analyze-deal", {
    method: "POST",
    cookie,
    body: { sessionId: session.payload.session.id, dealCard, financialProfile }
  });
  assert.equal(limited.response.status, 402);
  assert.equal(limited.payload.code, "REPORT_LIMIT_REACHED");

  const history = await request(baseUrl, "/api/reports", { cookie });
  assert.equal(history.payload.reports.length, 3);
  const saved = await request(baseUrl, `/api/reports/${history.payload.reports[0].id}`, { cookie });
  assert.equal(saved.payload.report.analysis.dimensions.length, 4);

  const deniedWebhook = await request(baseUrl, "/api/billing/webhook", {
    method: "POST",
    body: { eventId: "event-upgrade", email: "billing@example.com", plan: "pro", status: "active" }
  });
  assert.equal(deniedWebhook.response.status, 401);

  const upgradeBody = { eventId: "event-upgrade", email: "billing@example.com", plan: "pro", status: "active", externalSubscriptionId: "sub-1" };
  const upgrade = await request(baseUrl, "/api/billing/webhook", {
    method: "POST",
    authorization: "Bearer billing-test-secret",
    body: upgradeBody
  });
  assert.equal(upgrade.payload.billing.plan.id, "pro");
  assert.equal(upgrade.payload.duplicate, false);
  const duplicate = await request(baseUrl, "/api/billing/webhook", {
    method: "POST",
    authorization: "Bearer billing-test-secret",
    body: upgradeBody
  });
  assert.equal(duplicate.payload.duplicate, true);

  const checkout = await request(baseUrl, "/api/billing/checkout", { method: "POST", cookie, body: { plan: "pro" } });
  assert.match(checkout.payload.checkoutUrl, /billing%40example\.com/);
  const paidReport = await request(baseUrl, "/api/jarvis/analyze-deal", {
    method: "POST",
    cookie,
    body: { sessionId: session.payload.session.id, dealCard, financialProfile }
  });
  assert.equal(paidReport.response.status, 200);
  assert.equal(paidReport.payload.billing.plan.id, "pro");

  const removed = await request(baseUrl, `/api/reports/${history.payload.reports[0].id}`, { method: "DELETE", cookie });
  assert.equal(removed.response.status, 204);
});
