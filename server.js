import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createStateStore } from "./storage.js";
import { KnowledgeService } from "./knowledge.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUNDLED_DATA_DIR = path.join(__dirname, "data");
const DEFAULT_DATA_DIR = BUNDLED_DATA_DIR;
const DATA_DIR = path.resolve(globalThis.process?.env?.ESTATELAB_DATA_DIR || DEFAULT_DATA_DIR);
const DB_PATH = path.join(DATA_DIR, "db.json");
const BUNDLED_DB_PATH = path.join(BUNDLED_DATA_DIR, "db.json");
const RAG_PATH = path.resolve(globalThis.process?.env?.ESTATELAB_RAG_PATH || path.join(__dirname, "rag", "corpus.json"));
const PUBLIC_DIR = path.join(__dirname, "public");
const PORT = Number(globalThis.process?.env?.PORT || 3000);
const HOST = String(globalThis.process?.env?.HOST || "0.0.0.0").trim();
const DATABASE_URL = String(globalThis.process?.env?.DATABASE_URL || "").trim();
const OBJECT_DIR = path.resolve(globalThis.process?.env?.ESTATELAB_OBJECT_DIR || path.join(DATA_DIR, "objects"));

const jsonHeaders = { "Content-Type": "application/json; charset=utf-8" };
const OWNER_TOKEN = String(globalThis.process?.env?.ESTATELAB_OWNER_TOKEN || "");
const RAW_OPENAI_API_KEY = String(globalThis.process?.env?.OPENAI_API_KEY || "").trim();
const OPENROUTER_API_KEY = String(globalThis.process?.env?.OPENROUTER_API_KEY || "").trim();
const OPENAI_KEY_IS_OPENROUTER = /^sk-or-/i.test(RAW_OPENAI_API_KEY);
const LLM_PROVIDER = String(globalThis.process?.env?.LLM_PROVIDER || (OPENROUTER_API_KEY || OPENAI_KEY_IS_OPENROUTER ? "openrouter" : "openai")).trim().toLowerCase();
const LLM_API_KEY = String(globalThis.process?.env?.LLM_API_KEY || (LLM_PROVIDER === "openrouter" ? OPENROUTER_API_KEY || (OPENAI_KEY_IS_OPENROUTER ? RAW_OPENAI_API_KEY : "") : RAW_OPENAI_API_KEY)).trim();
const OPENROUTER_FREE_ROUTING = String(globalThis.process?.env?.OPENROUTER_FREE_ROUTING || "true").trim().toLowerCase() !== "false";
const RAW_LLM_MODEL = String(globalThis.process?.env?.LLM_MODEL || globalThis.process?.env?.OPENAI_MODEL || "gpt-4.1-mini").trim();
const CONFIGURED_LLM_MODEL = RAW_LLM_MODEL.replace(/^LLM_MODEL\s*=\s*/i, "").trim();
const LLM_MODEL = LLM_PROVIDER === "openrouter" && OPENROUTER_FREE_ROUTING ? "openrouter/free" : CONFIGURED_LLM_MODEL;
const LLM_BASE_URL = String(globalThis.process?.env?.LLM_BASE_URL || (LLM_PROVIDER === "openrouter" ? "https://openrouter.ai/api/v1" : "https://api.openai.com/v1")).replace(/\/$/, "");
const OPENROUTER_SITE_URL = String(globalThis.process?.env?.OPENROUTER_SITE_URL || "").trim();
const OPENAI_SERVICES_API_KEY = String(globalThis.process?.env?.OPENAI_SERVICES_API_KEY || (OPENAI_KEY_IS_OPENROUTER ? "" : RAW_OPENAI_API_KEY)).trim();
const OPENAI_EMBEDDING_MODEL = String(globalThis.process?.env?.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small").trim();
const OPENAI_TRANSCRIPTION_MODEL = String(globalThis.process?.env?.OPENAI_TRANSCRIPTION_MODEL || "gpt-4o-mini-transcribe").trim();
const OPENAI_SPEECH_MODEL = String(globalThis.process?.env?.OPENAI_SPEECH_MODEL || "gpt-4o-mini-tts").trim();
const OPENAI_SPEECH_VOICE = String(globalThis.process?.env?.OPENAI_SPEECH_VOICE || "marin").trim();
const OPENAI_TIMEOUT_MS = Math.max(5000, Number(globalThis.process?.env?.OPENAI_TIMEOUT_MS || 25000));
const EMAIL_WEBHOOK_URL = String(globalThis.process?.env?.ESTATELAB_EMAIL_WEBHOOK_URL || "").trim();
const EMAIL_WEBHOOK_SECRET = String(globalThis.process?.env?.ESTATELAB_EMAIL_WEBHOOK_SECRET || "").trim();
const REQUIRE_EMAIL_VERIFICATION = String(globalThis.process?.env?.ESTATELAB_REQUIRE_EMAIL_VERIFICATION || "false").toLowerCase() === "true";
const AUTH_DEBUG_TOKENS = String(globalThis.process?.env?.ESTATELAB_AUTH_DEBUG_TOKENS || "false").toLowerCase() === "true";
const AUTH_COOKIE = "estatelab_session";
const AUTH_SESSION_DAYS = Math.max(1, Number(globalThis.process?.env?.ESTATELAB_AUTH_SESSION_DAYS || 30));
const BILLING_ENFORCEMENT = String(globalThis.process?.env?.APEX_BILLING_ENFORCEMENT || "false").toLowerCase() === "true";
const BILLING_WEBHOOK_SECRET = String(globalThis.process?.env?.APEX_BILLING_WEBHOOK_SECRET || "").trim();
const PRO_CHECKOUT_URL = String(globalThis.process?.env?.APEX_PRO_CHECKOUT_URL || "").trim();
const ADVISOR_CHECKOUT_URL = String(globalThis.process?.env?.APEX_ADVISOR_CHECKOUT_URL || "").trim();
const PRO_PRICE_RM = Math.max(1, Number(globalThis.process?.env?.APEX_PRO_PRICE_RM || 59));
const ADVISOR_PRICE_RM = Math.max(1, Number(globalThis.process?.env?.APEX_ADVISOR_PRICE_RM || 199));
const AUTH_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const AUTH_ATTEMPT_LIMIT = 10;
const MAX_JSON_BODY_BYTES = 8 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
const DEFAULT_SESSION_TITLE = "New Apex Session";
const scrypt = promisify(scryptCallback);
const authAttempts = new Map();
const requestWindows = new Map();
const llmRuntime = {
  configuredModel: LLM_MODEL,
  resolvedModel: "",
  lastUsedAt: ""
};
const BILLING_PLANS = {
  free: {
    id: "free",
    name: "Free",
    priceRm: 0,
    reportLimit: 3,
    historyLimit: 5,
    checkoutUrl: "",
    features: ["Framework chat", "3 deal reports monthly", "5 saved reports"]
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceRm: PRO_PRICE_RM,
    reportLimit: 30,
    historyLimit: 50,
    checkoutUrl: PRO_CHECKOUT_URL,
    features: ["Framework and AI reasoning", "30 deal reports monthly", "50 saved reports", "Long-term memory"]
  },
  advisor: {
    id: "advisor",
    name: "Advisor",
    priceRm: ADVISOR_PRICE_RM,
    reportLimit: 150,
    historyLimit: 200,
    checkoutUrl: ADVISOR_CHECKOUT_URL,
    features: ["150 deal reports monthly", "200 saved reports", "Multi-deal workflow", "Priority capacity"]
  }
};
const knowledgeService = new KnowledgeService({
  objectDir: OBJECT_DIR,
  apiKey: OPENAI_SERVICES_API_KEY,
  embeddingModel: OPENAI_EMBEDDING_MODEL,
  transcriptionModel: OPENAI_TRANSCRIPTION_MODEL,
  speechModel: OPENAI_SPEECH_MODEL,
  timeoutMs: OPENAI_TIMEOUT_MS
});
const thinkingQuestions = [
  {
    id: "mandate-job",
    category: "Mandate",
    question: "What exact job must real estate do in your overall wealth plan, and by when?",
    why: "A deal can look attractive while being wrong for the role you actually need it to play."
  },
  {
    id: "risk-budget",
    category: "Risk",
    question: "What loss, negative cash flow, or period of illiquidity would be painful enough to change your life plans?",
    why: "Your real risk limit is set by consequences, not by a generic return target."
  },
  {
    id: "investor-edge",
    category: "Edge",
    question: "What can you repeatedly know, access, or execute better than the typical buyer?",
    why: "A replicable advantage matters more than a one-off attractive property."
  },
  {
    id: "market-causality",
    category: "Market",
    question: "Which three causal forces currently drive your preferred Malaysian market, and what observable indicators would prove each force is strengthening?",
    why: "This separates a market narrative from a testable market thesis."
  },
  {
    id: "disconfirming-evidence",
    category: "Judgment",
    question: "What evidence would make you admit that your favorite current market or strategy is no longer attractive?",
    why: "Naming disconfirming evidence in advance reduces confirmation bias."
  },
  {
    id: "opportunity-cost",
    category: "Capital",
    question: "What is the best realistic alternative use of the same cash, time, and borrowing capacity?",
    why: "A positive return is not enough when another option is materially better."
  },
  {
    id: "execution-bottleneck",
    category: "Execution",
    question: "Which part of sourcing, financing, due diligence, renovation, leasing, or management most limits your results today?",
    why: "The weakest repeatable capability often determines portfolio performance."
  },
  {
    id: "portable-principle",
    category: "Learning",
    question: "Which lesson from your past experience do you believe should hold across locations, and where might it fail?",
    why: "This turns experience into a portable principle without pretending context never matters."
  }
];
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function readStorageSeed(file, fallback) {
  if (!existsSync(file)) return fallback;
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    throw new Error(`Apex Analytic cannot read the storage seed at ${file}: ${error.message}`);
  }
}

let stateStore;

function normalizedDbState(db) {
  return {
    properties: db?.properties || [],
    comps: db?.comps || [],
    brain: normalizeBrain(db?.brain),
    knowledge: normalizeKnowledge(db?.knowledge),
    jarvis: normalizeJarvis(db?.jarvis),
    auth: normalizeAuth(db?.auth),
    ...(db?._storageRevision === undefined ? {} : { _storageRevision: db._storageRevision })
  };
}

async function initializeStore() {
  const fallback = { properties: [], comps: [], brain: emptyBrain(), knowledge: emptyKnowledge(), jarvis: emptyJarvis(), auth: emptyAuth() };
  const seedPath = existsSync(DB_PATH) ? DB_PATH : BUNDLED_DB_PATH;
  const rawSeed = await readStorageSeed(seedPath, fallback);
  const seed = normalizedDbState(rawSeed);
  if (Number(rawSeed.auth?.version || 0) < 1) seed.jarvis = emptyJarvis();
  stateStore = await createStateStore({
    databaseUrl: DATABASE_URL,
    filePath: DB_PATH,
    seedState: seed
  });
  await knowledgeService.init();
}

async function readDb() {
  return stateStore.read();
}

async function writeDb(db) {
  await stateStore.write(normalizedDbState(db));
}

function emptyBrain() {
  return { answers: [], beliefs: [], decisions: [] };
}

function emptyJarvis() {
  return { sessions: [] };
}

function emptyAuth() {
  return { version: 5, users: [], sessions: [], tokens: [] };
}

function normalizeUserMemory(memory) {
  const validCategories = new Set(["preference", "goal", "constraint", "experience", "decision", "general"]);
  const validStatuses = new Set(["pending", "approved", "dismissed"]);
  const items = Array.isArray(memory?.items)
    ? memory.items.map((item) => ({
      id: String(item.id || randomUUID()),
      category: validCategories.has(item.category) ? item.category : "general",
      content: String(item.content || "").replace(/\s+/g, " ").trim().slice(0, 500),
      status: validStatuses.has(item.status) ? item.status : "pending",
      sourceMessageId: String(item.sourceMessageId || "").slice(0, 80),
      createdAt: String(item.createdAt || new Date().toISOString()),
      updatedAt: String(item.updatedAt || item.createdAt || new Date().toISOString()),
      reviewedAt: String(item.reviewedAt || "")
    })).filter((item) => item.content).slice(0, 200)
    : [];
  return { version: 1, items };
}

function billingPeriod(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  return `${safeDate.getUTCFullYear()}-${String(safeDate.getUTCMonth() + 1).padStart(2, "0")}`;
}

function normalizeUserBilling(billing) {
  const validPlans = new Set(Object.keys(BILLING_PLANS));
  const validStatuses = new Set(["active", "trialing", "past_due", "canceled"]);
  const currentPeriod = billingPeriod();
  const storedPeriod = String(billing?.usage?.period || "");
  return {
    version: 1,
    plan: validPlans.has(billing?.plan) ? billing.plan : "free",
    status: validStatuses.has(billing?.status) ? billing.status : "active",
    reportCredits: Math.max(0, Math.min(10000, Math.floor(Number(billing?.reportCredits || 0)))),
    usage: {
      period: currentPeriod,
      count: storedPeriod === currentPeriod ? Math.max(0, Math.floor(Number(billing?.usage?.count || 0))) : 0
    },
    externalCustomerId: String(billing?.externalCustomerId || "").slice(0, 160),
    externalSubscriptionId: String(billing?.externalSubscriptionId || "").slice(0, 160),
    processedEvents: Array.isArray(billing?.processedEvents) ? billing.processedEvents.map(String).slice(-100) : [],
    updatedAt: String(billing?.updatedAt || new Date().toISOString())
  };
}

function reportText(value, limit = 1200) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
}

function reportList(items, limit = 12) {
  return Array.isArray(items) ? items.map((item) => reportText(item)).filter(Boolean).slice(0, limit) : [];
}

function normalizeReportContext(context) {
  const cleanRecord = (record) => Object.fromEntries(Object.entries(record || {})
    .slice(0, 40)
    .map(([key, value]) => [String(key).slice(0, 80), reportText(value, 800)])
    .filter(([, value]) => value));
  return {
    dealCard: cleanRecord(context?.dealCard),
    financialProfile: cleanRecord(context?.financialProfile)
  };
}

function normalizeReportMarketIntelligence(market = {}) {
  const observations = Array.isArray(market.observations) ? market.observations.slice(0, 12).map((item) => ({
    id: reportText(item?.id, 100),
    title: reportText(item?.title, 240),
    metricType: reportText(item?.metricType, 40),
    value: item?.value === null || item?.value === undefined ? null : Number(item.value),
    unit: reportText(item?.unit, 40),
    observedAt: reportText(item?.observedAt, 40),
    sourceType: reportText(item?.sourceType, 80),
    confidence: ["high", "medium", "low"].includes(item?.confidence) ? item.confidence : "medium",
    notes: reportText(item?.notes, 1800),
    body: reportText(item?.body, 2200),
    freshness: {
      status: ["fresh", "aging", "stale"].includes(item?.freshness?.status) ? item.freshness.status : "stale",
      ageDays: Math.max(0, Number(item?.freshness?.ageDays || 0)),
      thresholdDays: Math.max(1, Number(item?.freshness?.thresholdDays || 180))
    }
  })).filter((item) => item.id && item.title) : [];
  const trends = Array.isArray(market.trends) ? market.trends.slice(0, 8).map((trend) => ({
    subject: reportText(trend?.subject, 160),
    metricType: reportText(trend?.metricType, 40),
    direction: ["up", "down", "stable"].includes(trend?.direction) ? trend.direction : "stable",
    percentChange: trend?.percentChange === null || trend?.percentChange === undefined ? null : Number(trend.percentChange),
    unit: reportText(trend?.unit, 40),
    latestValue: Number(trend?.latestValue || 0),
    previousValue: Number(trend?.previousValue || 0),
    latestObservedAt: reportText(trend?.latestObservedAt, 40),
    previousObservedAt: reportText(trend?.previousObservedAt, 40)
  })) : [];
  const counts = observations.reduce((summary, item) => {
    summary[item.freshness.status] += 1;
    return summary;
  }, { fresh: 0, aging: 0, stale: 0 });
  return {
    observations,
    trends,
    summary: {
      matched: observations.length,
      ...counts,
      latestObservedAt: reportText(market?.summary?.latestObservedAt, 40),
      warning: reportText(market?.summary?.warning, 500)
    }
  };
}

function normalizeReportAnalysis(analysis = {}) {
  const objectList = (items, limit, mapper) => Array.isArray(items) ? items.slice(0, limit).map(mapper) : [];
  return {
    verdict: reportText(analysis.verdict, 40),
    summary: reportText(analysis.summary, 600),
    confidence: Math.max(0, Math.min(100, Number(analysis.confidence || 0))),
    completeness: Math.max(0, Math.min(100, Number(analysis.completeness || 0))),
    averageScore: Math.max(0, Math.min(100, Number(analysis.averageScore || 0))),
    voiceSummary: reportText(analysis.voiceSummary, 1200),
    aiCommentary: reportText(analysis.aiCommentary, 3000),
    counterThesis: reportText(analysis.counterThesis, 1500),
    metrics: objectList(analysis.metrics, 12, (item) => ({ label: reportText(item?.label, 80), value: reportText(item?.value, 80) })),
    dimensions: objectList(analysis.dimensions, 4, (item) => ({
      key: reportText(item?.key, 30),
      label: reportText(item?.label, 80),
      score: Math.max(0, Math.min(100, Number(item?.score || 0))),
      status: ["strong", "watch", "weak"].includes(item?.status) ? item.status : "watch"
    })),
    scenarios: objectList(analysis.scenarios, 6, (item) => ({
      label: reportText(item?.label, 80),
      assumption: reportText(item?.assumption, 240),
      monthlyCashFlow: Number(item?.monthlyCashFlow || 0),
      value: reportText(item?.value, 80),
      status: ["resilient", "pressure", "risk", "unknown"].includes(item?.status) ? item.status : "unknown"
    })),
    stages: objectList(analysis.stages, 7, (item) => ({
      number: Math.max(1, Math.min(7, Number(item?.number || 1))),
      name: reportText(item?.name, 100),
      score: Math.max(0, Math.min(100, Number(item?.score || 0))),
      status: ["pass", "watch", "risk", "incomplete"].includes(item?.status) ? item.status : "incomplete",
      summary: reportText(item?.summary, 500)
    })),
    hardStops: reportList(analysis.hardStops),
    watchouts: reportList(analysis.watchouts),
    missingEvidence: reportList(analysis.missingEvidence),
    nextActions: reportList(analysis.nextActions),
    marketIntelligence: normalizeReportMarketIntelligence(analysis.marketIntelligence),
    context: normalizeReportContext(analysis.context)
  };
}

function normalizeUserReports(reports) {
  const items = Array.isArray(reports?.items)
    ? reports.items.map((item) => ({
      id: String(item.id || randomUUID()),
      subject: reportText(item.subject || "Untitled deal", 160),
      createdAt: String(item.createdAt || new Date().toISOString()),
      analysis: normalizeReportAnalysis(item.analysis)
    })).filter((item) => item.analysis.verdict).slice(0, 200)
    : [];
  return { version: 1, items };
}

function optionalJournalScore(value) {
  if (value === "" || value === undefined || value === null) return "";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(100, Math.round(numeric))) : "";
}

function normalizeJournalEntry(item = {}) {
  const validDecisions = new Set(["proceed", "pause", "reject", "investigate"]);
  const validOutcomes = new Set(["not_reviewed", "abandoned", "holding", "sold"]);
  const outcomeStatus = validOutcomes.has(item?.outcome?.status) ? item.outcome.status : "not_reviewed";
  return {
    id: String(item.id || randomUUID()),
    reportId: String(item.reportId || "").slice(0, 100),
    subject: reportText(item.subject || "Untitled deal", 160),
    createdAt: String(item.createdAt || new Date().toISOString()),
    updatedAt: String(item.updatedAt || item.createdAt || new Date().toISOString()),
    lockedAt: String(item.lockedAt || ""),
    prePurchase: {
      decision: validDecisions.has(item?.prePurchase?.decision) ? item.prePurchase.decision : "investigate",
      thesis: reportText(item?.prePurchase?.thesis, 2000),
      counterThesis: reportText(item?.prePurchase?.counterThesis, 2000),
      killCriterion: reportText(item?.prePurchase?.killCriterion, 1200),
      holdingPeriod: reportText(item?.prePurchase?.holdingPeriod, 120),
      confidence: Math.max(0, Math.min(100, Math.round(Number(item?.prePurchase?.confidence || 0)))),
      notes: reportText(item?.prePurchase?.notes, 2000)
    },
    outcome: {
      status: outcomeStatus,
      actualRent: reportText(item?.outcome?.actualRent, 120),
      currentValue: reportText(item?.outcome?.currentValue, 120),
      result: reportText(item?.outcome?.result, 2000),
      lesson: reportText(item?.outcome?.lesson, 2000),
      processScore: optionalJournalScore(item?.outcome?.processScore),
      executionScore: optionalJournalScore(item?.outcome?.executionScore),
      outcomeScore: optionalJournalScore(item?.outcome?.outcomeScore),
      luckScore: optionalJournalScore(item?.outcome?.luckScore),
      reviewedAt: String(item?.outcome?.reviewedAt || "")
    },
    snapshot: normalizeReportAnalysis(item.snapshot)
  };
}

function normalizeUserJournal(journal) {
  const items = Array.isArray(journal?.items)
    ? journal.items.map(normalizeJournalEntry).filter((item) => item.reportId && item.subject).slice(0, 100)
    : [];
  return { version: 1, items };
}

function normalizeAuth(auth) {
  const now = Date.now();
  const legacyUsersAreVerified = Number(auth?.version || 1) < 2;
  return {
    version: 5,
    users: Array.isArray(auth?.users)
      ? auth.users.map((user) => ({
        id: String(user.id || ""),
        email: String(user.email || "").trim().toLowerCase(),
        displayName: String(user.displayName || "").trim(),
        passwordHash: String(user.passwordHash || ""),
        role: user.role === "admin" ? "admin" : "member",
        memory: normalizeUserMemory(user.memory),
        billing: normalizeUserBilling(user.billing),
        reports: normalizeUserReports(user.reports),
        journal: normalizeUserJournal(user.journal),
        emailVerifiedAt: String(user.emailVerifiedAt || (legacyUsersAreVerified ? user.createdAt || new Date().toISOString() : "")),
        disabledAt: String(user.disabledAt || ""),
        createdAt: String(user.createdAt || new Date().toISOString())
      })).filter((user) => user.id && user.email && user.passwordHash).slice(0, 10000)
      : [],
    sessions: Array.isArray(auth?.sessions)
      ? auth.sessions.map((session) => ({
        tokenHash: String(session.tokenHash || ""),
        userId: String(session.userId || ""),
        createdAt: String(session.createdAt || new Date().toISOString()),
        expiresAt: String(session.expiresAt || "")
      })).filter((session) => session.tokenHash && session.userId && Date.parse(session.expiresAt) > now).slice(0, 20000)
      : [],
    tokens: Array.isArray(auth?.tokens)
      ? auth.tokens.map((token) => ({
        tokenHash: String(token.tokenHash || ""),
        userId: String(token.userId || ""),
        purpose: token.purpose === "password-reset" ? "password-reset" : "email-verification",
        createdAt: String(token.createdAt || new Date().toISOString()),
        expiresAt: String(token.expiresAt || "")
      })).filter((token) => token.tokenHash && token.userId && Date.parse(token.expiresAt) > now).slice(0, 20000)
      : []
  };
}

function emptyKnowledge() {
  return { version: 2, documents: [], chunks: [], retrievalEvents: [], projects: [], observations: [] };
}

const MARKET_METRIC_TYPES = new Set([
  "transaction", "rent", "occupancy", "rental_enquiry", "supply", "auction",
  "unsold_stock", "launch_sales", "management", "catalyst", "financing", "buyer_sentiment", "other"
]);
const MARKET_CONFIDENCE_LEVELS = new Set(["high", "medium", "low"]);
const MARKET_FRESHNESS_DAYS = {
  rent: 90,
  occupancy: 90,
  rental_enquiry: 60,
  launch_sales: 90,
  unsold_stock: 90,
  buyer_sentiment: 90,
  transaction: 180,
  auction: 180,
  supply: 180,
  financing: 180,
  management: 365,
  catalyst: 365,
  other: 180
};

function cleanMarketText(value, limit = 240) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
}

function cleanMarketDate(value, fallback = "") {
  const timestamp = Date.parse(String(value || ""));
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : fallback;
}

function optionalMarketNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeMarketProject(project) {
  const now = new Date().toISOString();
  const name = cleanMarketText(project?.name, 160);
  if (!name) return null;
  return {
    id: cleanMarketText(project?.id || randomUUID(), 100),
    name,
    area: cleanMarketText(project?.area, 120),
    state: cleanMarketText(project?.state, 80),
    propertyType: cleanMarketText(project?.propertyType, 80),
    developer: cleanMarketText(project?.developer, 120),
    tenure: cleanMarketText(project?.tenure, 100),
    completionYear: Math.max(0, Math.min(2200, Math.floor(Number(project?.completionYear || 0)))),
    status: cleanMarketText(project?.status || "watching", 60).toLowerCase(),
    aliases: Array.isArray(project?.aliases)
      ? [...new Set(project.aliases.map((alias) => cleanMarketText(alias, 120)).filter(Boolean))].slice(0, 20)
      : [],
    createdAt: cleanMarketDate(project?.createdAt, now),
    updatedAt: cleanMarketDate(project?.updatedAt || project?.createdAt, now)
  };
}

function normalizeMarketObservation(observation, projectIds = new Set()) {
  const now = new Date().toISOString();
  const metricType = MARKET_METRIC_TYPES.has(String(observation?.metricType || "").toLowerCase())
    ? String(observation.metricType).toLowerCase()
    : "other";
  const projectId = cleanMarketText(observation?.projectId, 100);
  const confidence = String(observation?.confidence || "medium").toLowerCase();
  return {
    id: cleanMarketText(observation?.id || randomUUID(), 100),
    projectId: projectIds.has(projectId) ? projectId : "",
    projectName: cleanMarketText(observation?.projectName, 160),
    area: cleanMarketText(observation?.area, 120),
    state: cleanMarketText(observation?.state, 80),
    metricType,
    value: optionalMarketNumber(observation?.value),
    unit: cleanMarketText(observation?.unit, 40),
    observedAt: cleanMarketDate(observation?.observedAt || observation?.periodDate, now),
    sourceType: cleanMarketText(observation?.sourceType || "owner observation", 80),
    sourceReference: cleanMarketText(observation?.sourceReference || observation?.sourceUrl, 1000),
    confidence: MARKET_CONFIDENCE_LEVELS.has(confidence) ? confidence : "medium",
    notes: cleanMarketText(observation?.notes, 1800),
    createdAt: cleanMarketDate(observation?.createdAt, now),
    updatedAt: cleanMarketDate(observation?.updatedAt || observation?.createdAt, now)
  };
}

function normalizeKnowledge(knowledge) {
  const documents = Array.isArray(knowledge?.documents)
    ? knowledge.documents.map((document) => ({
      id: String(document.id || ""),
      title: String(document.title || "Untitled evidence").trim(),
      filename: String(document.filename || "evidence.txt").trim(),
      mimeType: String(document.mimeType || "application/octet-stream").trim(),
      storageKey: String(document.storageKey || "").trim(),
      checksum: String(document.checksum || "").trim(),
      sourceUrl: String(document.sourceUrl || "").trim(),
      tags: Array.isArray(document.tags) ? document.tags.map(String).slice(0, 20) : [],
      status: document.status === "stored" ? "stored" : "indexed",
      indexMode: document.indexMode === "hybrid" ? "hybrid" : "lexical",
      chunkCount: Math.max(0, Number(document.chunkCount || 0)),
      createdAt: String(document.createdAt || new Date().toISOString()),
      updatedAt: String(document.updatedAt || document.createdAt || new Date().toISOString())
    })).filter((document) => document.id && document.storageKey).slice(-500)
    : [];
  const documentIds = new Set(documents.map((document) => document.id));
  const chunks = Array.isArray(knowledge?.chunks)
    ? knowledge.chunks.map((chunk) => ({
      id: String(chunk.id || ""),
      documentId: String(chunk.documentId || ""),
      position: Math.max(0, Number(chunk.position || 0)),
      content: String(chunk.content || "").trim().slice(0, 3000),
      embedding: Array.isArray(chunk.embedding) ? chunk.embedding.map(Number) : null
    })).filter((chunk) => chunk.id && documentIds.has(chunk.documentId) && chunk.content).slice(-5000)
    : [];
  const retrievalEvents = Array.isArray(knowledge?.retrievalEvents)
    ? knowledge.retrievalEvents.map((event) => ({
      id: String(event.id || randomUUID()),
      createdAt: String(event.createdAt || new Date().toISOString()),
      queryHash: String(event.queryHash || ""),
      queryLength: Math.max(0, Number(event.queryLength || 0)),
      mode: String(event.mode || "lexical"),
      sourceIds: Array.isArray(event.sourceIds) ? event.sourceIds.map(String).slice(0, 10) : [],
      latencyMs: Math.max(0, Number(event.latencyMs || 0)),
      userId: String(event.userId || "")
    })).slice(-1000)
    : [];
  const projects = Array.isArray(knowledge?.projects)
    ? knowledge.projects.map(normalizeMarketProject).filter(Boolean).slice(-1000)
    : [];
  const projectIds = new Set(projects.map((project) => project.id));
  const observations = Array.isArray(knowledge?.observations)
    ? knowledge.observations
      .map((observation) => normalizeMarketObservation(observation, projectIds))
      .filter((observation) => observation.projectId || observation.projectName || observation.area)
      .slice(-10000)
    : [];
  return { version: 2, documents, chunks, retrievalEvents, projects, observations };
}

function normalizeBrain(brain) {
  return {
    answers: Array.isArray(brain?.answers) ? brain.answers : [],
    beliefs: Array.isArray(brain?.beliefs) ? brain.beliefs : [],
    decisions: Array.isArray(brain?.decisions) ? brain.decisions : []
  };
}

function normalizeJarvis(jarvis) {
  return {
    sessions: Array.isArray(jarvis?.sessions)
      ? jarvis.sessions.map(normalizeJarvisSession).filter(Boolean).slice(0, 80)
      : []
  };
}

function normalizeJarvisSession(session) {
  if (!session?.id) return null;
  const messages = Array.isArray(session.messages)
    ? session.messages.map(normalizeJarvisMessage).filter(Boolean).slice(-80)
    : [];
  return {
    id: String(session.id),
    createdAt: String(session.createdAt || new Date().toISOString()),
    updatedAt: String(session.updatedAt || session.createdAt || new Date().toISOString()),
    title: String(session.title || DEFAULT_SESSION_TITLE).trim(),
    clientId: String(session.clientId || "browser").trim(),
    userId: String(session.userId || "").trim(),
    messages
  };
}

function normalizeJarvisMessage(message) {
  if (!message?.role || !message?.content) return null;
  return {
    id: String(message.id || randomUUID()),
    role: message.role === "user" ? "user" : "jarvis",
    content: String(message.content).trim(),
    createdAt: String(message.createdAt || new Date().toISOString()),
    mode: ["framework", "llm"].includes(message.mode) ? message.mode : "",
    provider: String(message.provider || "").trim().slice(0, 40),
    model: String(message.model || "").trim().slice(0, 160),
    sources: Array.isArray(message.sources) ? message.sources.slice(0, 8) : []
  };
}

function createJarvisSession(body = {}, user = null) {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    title: String(body.title || DEFAULT_SESSION_TITLE).trim(),
    clientId: String(body.clientId || "browser").trim(),
    userId: String(user?.id || "").trim(),
    messages: []
  };
}

function publicJarvisSession(session) {
  return {
    id: session.id,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    title: session.title,
    messages: session.messages
  };
}

function publicJarvisSessionSummary(session) {
  return {
    id: session.id,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    title: session.title,
    messageCount: session.messages.length
  };
}

function publicUser(user) {
  const billing = publicBillingStatus(user);
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role || "member",
    plan: billing.plan.id,
    planStatus: billing.status,
    emailVerified: Boolean(user.emailVerifiedAt),
    disabled: Boolean(user.disabledAt),
    createdAt: user.createdAt
  };
}

function effectivePlanId(billing) {
  const normalized = normalizeUserBilling(billing);
  if (normalized.plan === "free") return "free";
  return ["active", "trialing"].includes(normalized.status) ? normalized.plan : "free";
}

function publicPlan(plan) {
  return {
    id: plan.id,
    name: plan.name,
    priceRm: plan.priceRm,
    reportLimit: plan.reportLimit,
    historyLimit: plan.historyLimit,
    features: plan.features,
    checkoutAvailable: Boolean(plan.checkoutUrl)
  };
}

function publicBillingStatus(user) {
  const billing = normalizeUserBilling(user?.billing);
  const plan = BILLING_PLANS[effectivePlanId(billing)];
  const monthlyRemaining = Math.max(0, plan.reportLimit - billing.usage.count);
  const reports = normalizeUserReports(user?.reports);
  return {
    plan: publicPlan(plan),
    subscribedPlan: billing.plan,
    status: billing.status,
    usage: {
      period: billing.usage.period,
      used: billing.usage.count,
      limit: plan.reportLimit,
      credits: billing.reportCredits,
      remaining: monthlyRemaining + billing.reportCredits
    },
    history: {
      saved: reports.items.length,
      limit: plan.historyLimit
    },
    enforcementEnabled: BILLING_ENFORCEMENT
  };
}

function canCreateDealReport(user) {
  if (!user) return !BILLING_ENFORCEMENT;
  return publicBillingStatus(user).usage.remaining > 0 || !BILLING_ENFORCEMENT;
}

function consumeDealReport(user) {
  if (!user) return null;
  user.billing = normalizeUserBilling(user.billing);
  const plan = BILLING_PLANS[effectivePlanId(user.billing)];
  if (user.billing.usage.count < plan.reportLimit || !BILLING_ENFORCEMENT) {
    user.billing.usage.count += 1;
  } else if (user.billing.reportCredits > 0) {
    user.billing.reportCredits -= 1;
  } else {
    return null;
  }
  user.billing.updatedAt = new Date().toISOString();
  return publicBillingStatus(user);
}

function saveDealReport(user, subject, analysis) {
  if (!user) return null;
  user.reports = normalizeUserReports(user.reports);
  const item = {
    id: randomUUID(),
    subject: reportText(subject || "Untitled deal", 160),
    createdAt: new Date().toISOString(),
    analysis: normalizeReportAnalysis(analysis)
  };
  const historyLimit = BILLING_PLANS[effectivePlanId(user.billing)].historyLimit;
  user.reports.items = [item, ...user.reports.items].slice(0, historyLimit);
  return item;
}

function publicReportSummary(item) {
  return {
    id: item.id,
    subject: item.subject,
    createdAt: item.createdAt,
    verdict: item.analysis.verdict,
    averageScore: item.analysis.averageScore,
    confidence: item.analysis.confidence,
    weakestDimension: [...item.analysis.dimensions].sort((a, b) => a.score - b.score)[0] || null
  };
}

function journalSkillSignal(entry) {
  const outcome = entry.outcome || {};
  if (!outcome.reviewedAt) return "Outcome not reviewed";
  const process = Number(outcome.processScore);
  const execution = Number(outcome.executionScore);
  const result = Number(outcome.outcomeScore);
  const luck = Number(outcome.luckScore);
  if (process >= 70 && execution >= 65 && result >= 65 && luck < 60) return "Disciplined process with supporting outcome";
  if (process >= 70 && result < 50) return "Sound process, adverse outcome";
  if (process < 60 && result >= 70) return luck >= 60 ? "Positive result with material luck" : "Result exceeded the recorded process";
  if (process < 50 && result < 50) return "Weak process and weak result";
  return "Mixed evidence; avoid a strong skill conclusion";
}

function publicJournalSummary(item) {
  return {
    id: item.id,
    reportId: item.reportId,
    subject: item.subject,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    locked: Boolean(item.lockedAt),
    lockedAt: item.lockedAt,
    decision: item.prePurchase.decision,
    confidence: item.prePurchase.confidence,
    outcomeStatus: item.outcome.status,
    reviewed: Boolean(item.outcome.reviewedAt),
    skillSignal: journalSkillSignal(item),
    snapshotScore: item.snapshot.averageScore,
    snapshotVerdict: item.snapshot.verdict
  };
}

function journalCollectionSummary(journal) {
  const items = normalizeUserJournal(journal).items;
  const reviewed = items.filter((item) => item.outcome.reviewedAt);
  const scored = reviewed.filter((item) => item.outcome.processScore !== "");
  return {
    total: items.length,
    drafts: items.filter((item) => !item.lockedAt).length,
    locked: items.filter((item) => item.lockedAt).length,
    reviewed: reviewed.length,
    averageProcessScore: scored.length
      ? Math.round(scored.reduce((sum, item) => sum + Number(item.outcome.processScore), 0) / scored.length)
      : null
  };
}

function lockedUserJournal(user) {
  return normalizeUserJournal(user?.journal).items.filter((item) => item.lockedAt);
}

function checkoutUrlFor(planId, user) {
  const plan = BILLING_PLANS[planId];
  if (!plan?.checkoutUrl) return "";
  const replacements = {
    "{email}": encodeURIComponent(user.email),
    "{userId}": encodeURIComponent(user.id),
    "{plan}": encodeURIComponent(planId)
  };
  const resolved = Object.entries(replacements).reduce((url, [token, value]) => url.replaceAll(token, value), plan.checkoutUrl);
  try {
    const parsed = new URL(resolved);
    return ["https:", "http:"].includes(parsed.protocol) ? parsed.toString() : "";
  } catch {
    return "";
  }
}

function billingWebhookAuthorized(req) {
  if (!BILLING_WEBHOOK_SECRET) return false;
  const supplied = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const expected = Buffer.from(BILLING_WEBHOOK_SECRET);
  const actual = Buffer.from(supplied);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function publicMemoryItem(item) {
  return {
    id: item.id,
    category: item.category,
    content: item.content,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    reviewedAt: item.reviewedAt
  };
}

function memorySummary(memory) {
  const items = normalizeUserMemory(memory).items;
  return {
    pending: items.filter((item) => item.status === "pending").length,
    approved: items.filter((item) => item.status === "approved").length
  };
}

function memoryCategory(content) {
  const text = String(content || "").toLowerCase();
  if (/\b(?:prefer|avoid|refuse|favourite|favorite)\b/.test(text)) return "preference";
  if (/\b(?:goal|target|aim|plan|priority)\b/.test(text)) return "goal";
  if (/\b(?:budget|cannot|can't|must|need|limit|constraint|reserve)\b/.test(text)) return "constraint";
  if (/\b(?:experience|learned|lesson|noticed|observed|found)\b/.test(text)) return "experience";
  if (/\b(?:decided|decision|will buy|will not buy|won't buy)\b/.test(text)) return "decision";
  return "general";
}

function proposeLongTermMemory(message, memory, sourceMessageId) {
  const original = String(message || "").replace(/\s+/g, " ").trim();
  if (original.length < 12 || original.length > 1200) return null;
  const explicitRemember = /^\s*(?:please\s+)?remember\b/i.test(original);
  if (original.endsWith("?") && !explicitRemember) return null;
  const durableCue = /\b(?:remember(?: that)?|i (?:prefer|avoid|refuse|believe|always|never|usually)|my (?:goal|priority|budget|strategy|target|risk tolerance|holding period)|from my experience|i (?:learned|noticed|observed|found)|i have decided)\b/i;
  if (!durableCue.test(original)) return null;
  const content = original.replace(/^\s*(?:please\s+)?remember(?:\s+that)?\s*/i, "").slice(0, 500).trim();
  if (content.length < 8) return null;
  const normalized = content.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const existing = normalizeUserMemory(memory).items.find((item) => item.content.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() === normalized);
  if (existing) return null;
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    category: memoryCategory(content),
    content,
    status: "pending",
    sourceMessageId: String(sourceMessageId || ""),
    createdAt: now,
    updatedAt: now,
    reviewedAt: ""
  };
}

function approvedUserMemories(user) {
  return normalizeUserMemory(user?.memory).items.filter((item) => item.status === "approved");
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(String(password), salt, 64);
  return `scrypt$${salt}$${Buffer.from(derived).toString("hex")}`;
}

async function verifyPassword(password, encoded) {
  const [algorithm, salt, expectedHex] = String(encoded || "").split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = Buffer.from(await scrypt(String(password), salt, expected.length));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function hashAuthToken(token) {
  return createHash("sha256").update(String(token || "")).digest("hex");
}

function parseCookies(req) {
  return String(req.headers.cookie || "").split(";").reduce((cookies, entry) => {
    const separator = entry.indexOf("=");
    if (separator < 0) return cookies;
    const key = entry.slice(0, separator).trim();
    const value = entry.slice(separator + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function secureRequest(req) {
  const forwarded = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  return forwarded === "https" || Boolean(req.socket?.encrypted);
}

function authCookie(req, token, maxAgeSeconds) {
  const parts = [
    `${AUTH_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`
  ];
  if (secureRequest(req)) parts.push("Secure");
  return parts.join("; ");
}

function createAuthSession(userId) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + AUTH_SESSION_DAYS * 24 * 60 * 60 * 1000);
  return {
    token,
    record: {
      tokenHash: hashAuthToken(token),
      userId,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    },
    maxAgeSeconds: AUTH_SESSION_DAYS * 24 * 60 * 60
  };
}

function createOneTimeToken(userId, purpose, lifetimeMinutes = 60) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  return {
    token,
    record: {
      tokenHash: hashAuthToken(token),
      userId,
      purpose,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + lifetimeMinutes * 60 * 1000).toISOString()
    }
  };
}

function replaceAuthToken(auth, record) {
  const tokens = (auth.tokens || []).filter((token) => !(token.userId === record.userId && token.purpose === record.purpose));
  return { ...auth, tokens: [record, ...tokens].slice(0, 20000) };
}

async function deliverAuthToken(user, purpose, token, expiresAt) {
  if (!EMAIL_WEBHOOK_URL) return false;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(EMAIL_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(EMAIL_WEBHOOK_SECRET ? { "Authorization": `Bearer ${EMAIL_WEBHOOK_SECRET}` } : {})
      },
      body: JSON.stringify({
        app: "Apex Analytic",
        type: purpose,
        to: user.email,
        displayName: user.displayName,
        token,
        expiresAt
      }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Email webhook failed with status ${response.status}.`);
    return true;
  } finally {
    clearTimeout(timeout);
  }
}

function debugTokenPayload(purpose, token) {
  return AUTH_DEBUG_TOKENS ? { debug: { purpose, token } } : {};
}

function currentAuth(req, db) {
  const token = parseCookies(req)[AUTH_COOKIE];
  if (!token) return { user: null, session: null };
  const tokenHash = hashAuthToken(token);
  const session = db.auth.sessions.find((item) => item.tokenHash === tokenHash);
  if (!session) return { user: null, session: null };
  const user = db.auth.users.find((item) => item.id === session.userId);
  return user && !user.disabledAt ? { user, session } : { user: null, session: null };
}

function requestClientId(req, body = {}) {
  const header = req.headers["x-estatelab-client-id"];
  const value = Array.isArray(header) ? header[0] : header;
  return String(value || body.clientId || "").trim();
}

function canAccessJarvisSession(session, actor, clientId) {
  if (!session) return false;
  if (session.userId) return Boolean(actor.user && session.userId === actor.user.id);
  return Boolean(clientId && session.clientId === clientId);
}

function accessibleJarvisSession(db, id, actor, clientId) {
  const session = db.jarvis.sessions.find((item) => item.id === String(id || ""));
  return canAccessJarvisSession(session, actor, clientId) ? session : null;
}

function claimJarvisSession(session, actor, clientId) {
  if (session && actor.user && !session.userId && session.clientId === clientId) {
    session.userId = actor.user.id;
  }
  return session;
}

function authRateKey(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || String(req.socket?.remoteAddress || "unknown");
}

function allowAuthAttempt(req) {
  const key = authRateKey(req);
  const now = Date.now();
  if (authAttempts.size > 5000) {
    for (const [attemptKey, timestamps] of authAttempts) {
      if (!timestamps.some((timestamp) => now - timestamp < AUTH_ATTEMPT_WINDOW_MS)) authAttempts.delete(attemptKey);
    }
    if (authAttempts.size > 5000) authAttempts.delete(authAttempts.keys().next().value);
  }
  const recent = (authAttempts.get(key) || []).filter((timestamp) => now - timestamp < AUTH_ATTEMPT_WINDOW_MS);
  if (recent.length >= AUTH_ATTEMPT_LIMIT) {
    authAttempts.set(key, recent);
    return false;
  }
  recent.push(now);
  authAttempts.set(key, recent);
  return true;
}

function clearAuthAttempts(req) {
  authAttempts.delete(authRateKey(req));
}

function allowRequest(req, bucket, limit, windowMs) {
  const now = Date.now();
  const key = `${bucket}:${authRateKey(req)}`;
  const entry = requestWindows.get(key);
  if (!entry || now >= entry.resetAt) {
    requestWindows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  if (requestWindows.size > 10000) {
    for (const [requestKey, value] of requestWindows) {
      if (now >= value.resetAt) requestWindows.delete(requestKey);
    }
  }
  return true;
}

function titleFromQuery(query) {
  const clean = String(query || "").replace(/\s+/g, " ").trim();
  if (!clean) return DEFAULT_SESSION_TITLE;
  return clean.length > 46 ? `${clean.slice(0, 43).trim()}...` : clean;
}

function defaultSessionTitle(title) {
  return [DEFAULT_SESSION_TITLE, "New Jarvis Session"].includes(String(title || ""));
}

function upsertJarvisSession(jarvis, session) {
  const normalized = normalizeJarvisSession(session);
  if (!normalized) return jarvis;
  const sessions = (jarvis.sessions || []).filter((item) => item.id !== normalized.id);
  return { ...jarvis, sessions: [normalized, ...sessions].slice(0, 80) };
}

function nextThinkingQuestion(brain) {
  const answered = new Set(brain.answers.map((answer) => answer.questionId));
  return thinkingQuestions.find((question) => !answered.has(question.id))
    || thinkingQuestions[brain.answers.length % thinkingQuestions.length];
}

function auditDecision(decision) {
  const observations = [];
  if (!decision.counterThesis) observations.push("No serious counter-thesis has been recorded.");
  if (!decision.killCriteria) observations.push("No observable kill criterion has been defined.");
  if (!decision.alternatives) observations.push("The opportunity cost has not been compared with a realistic alternative.");
  if (!decision.evidence) observations.push("The thesis has not been tied to specific evidence.");
  if (Number(decision.confidence || 0) >= 80 && observations.length >= 2) {
    observations.push("Confidence is high relative to the amount of documented challenge.");
  }
  return observations.length ? observations : ["The decision frame covers thesis, challenge, evidence, alternatives, and exit conditions."];
}

function brainSummary(brain) {
  return {
    answeredQuestions: brain.answers.length,
    activeBeliefs: brain.beliefs.filter((belief) => belief.status !== "retired").length,
    decisions: brain.decisions.length,
    openChallenges: brain.decisions.reduce((sum, decision) => sum + auditDecision(decision).filter((item) => item.startsWith("No ")).length, 0)
  };
}

function money(value) {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
}

function monthlyMortgage(principal, annualRate, years) {
  if (!principal || principal <= 0) return 0;
  const months = Math.max(1, years * 12);
  const rate = annualRate / 100 / 12;
  if (!rate) return principal / months;
  return principal * (rate * (1 + rate) ** months) / ((1 + rate) ** months - 1);
}

function boundedScore(value) {
  return Math.max(0, Math.min(5, Number(value || 0)));
}

function boundedPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.max(0, Math.min(100, numeric));
}

function analyzeSelection(input) {
  const weights = {
    demandIntensity: 11,
    priceSegmentLiquidity: 11,
    ownStayAppeal: 11,
    buyerPoolBreadth: 11,
    rentalHoldingPower: 12,
    relativePropertyQuality: 10,
    microLocationQuality: 10,
    entryPriceDiscipline: 10,
    futureSupplyDefense: 9,
    buildingLegalQuality: 5
  };
  const labels = {
    demandIntensity: "Area demand intensity",
    priceSegmentLiquidity: "Price-segment liquidity",
    ownStayAppeal: "Own-stay appeal",
    buyerPoolBreadth: "Buyer-pool breadth",
    rentalHoldingPower: "Rental holding power",
    relativePropertyQuality: "Relative property quality",
    microLocationQuality: "Micro-location quality",
    entryPriceDiscipline: "Entry-price discipline",
    futureSupplyDefense: "Future-supply defense",
    buildingLegalQuality: "Building and legal quality"
  };
  const scoredFactors = Object.entries(weights).map(([key, weight]) => ({
    key,
    label: labels[key],
    score: boundedScore(input[key]),
    weight
  }));
  const score = money(scoredFactors.reduce((sum, factor) => sum + (factor.score / 5) * factor.weight, 0));
  const askingPrice = Number(input.askingPrice || 0);
  const areaMedianPrice = Number(input.areaMedianPrice || 0);
  const fairValue = Number(input.conservativeFairValue || 0);
  const renovationBudget = Number(input.renovationBudget || 0);
  const otherAcquisitionCosts = Number(input.otherAcquisitionCosts || 0);
  const monthlyRent = Number(input.expectedMonthlyRent || 0);
  const monthlyNonDebtCosts = Number(input.monthlyNonDebtCosts || 0);
  const allInCost = askingPrice + renovationBudget + otherAcquisitionCosts;
  const discountToFairValue = fairValue ? ((fairValue - askingPrice) / fairValue) * 100 : 0;
  const allInMarginToFairValue = fairValue ? ((fairValue - allInCost) / fairValue) * 100 : 0;
  const positionVsAreaMedian = areaMedianPrice ? ((askingPrice - areaMedianPrice) / areaMedianPrice) * 100 : 0;
  const grossYieldOnCost = allInCost ? ((monthlyRent * 12) / allInCost) * 100 : 0;
  const netPreDebtYieldOnCost = allInCost ? (((monthlyRent - monthlyNonDebtCosts) * 12) / allInCost) * 100 : 0;
  const evidenceConfidence = boundedPercent(input.evidenceConfidence);
  const hardStops = [];
  const challenges = [];
  if (boundedScore(input.demandIntensity) <= 1) hardStops.push("The area lacks strong, observable demand.");
  if (boundedScore(input.priceSegmentLiquidity) <= 1) hardStops.push("The selected price segment has weak transaction or financing liquidity.");
  if (boundedScore(input.ownStayAppeal) <= 1) hardStops.push("The property lacks credible own-stay appeal.");
  if (boundedScore(input.buyerPoolBreadth) <= 1) hardStops.push("The future buyer pool is concentrated in one narrow segment.");
  if (boundedScore(input.rentalHoldingPower) <= 1) hardStops.push("Rental holding power is too weak for the stated mandate.");
  if (boundedScore(input.futureSupplyDefense) <= 1) hardStops.push("Future supply or substitute competition threatens the thesis.");
  if (boundedScore(input.buildingLegalQuality) <= 1) hardStops.push("Building condition, management, title, or legal issues threaten transactionability.");
  if (boundedScore(input.entryPriceDiscipline) <= 1) hardStops.push("The entry price is not adequately supported by comparable evidence.");
  if (fairValue && allInCost > fairValue) challenges.push("All-in cost exceeds conservative fair value; the base case depends on future appreciation or an exceptional buyer.");
  if (evidenceConfidence !== null && evidenceConfidence < 60) challenges.push("Evidence confidence is low; classify as monitor or investigate until the missing proof is obtained.");
  if (boundedScore(input.ownStayAppeal) >= 4 && boundedScore(input.priceSegmentLiquidity) <= 2) {
    challenges.push("Own-stay appeal may not overcome weak affordability or financing liquidity in this price segment.");
  }
  if (boundedScore(input.demandIntensity) >= 4 && boundedScore(input.microLocationQuality) <= 2) {
    challenges.push("Strong area demand may not translate to this property's exact street, project, block, or unit.");
  }
  if (boundedScore(input.buyerPoolBreadth) >= 4 && boundedScore(input.ownStayAppeal) <= 2) {
    challenges.push("The claimed broad buyer pool is not supported by sufficient own-stay appeal.");
  }

  const weakestFactors = scoredFactors
    .slice()
    .sort((a, b) => a.score - b.score || b.weight - a.weight)
    .slice(0, 3)
    .map(({ label, score: factorScore }) => `${label}: ${factorScore}/5`);
  let verdict = "Reject";
  if (score >= 88) verdict = "Strong buy candidate";
  else if (score >= 80) verdict = "Shortlist";
  else if (score >= 70) verdict = "Negotiate";
  else if (score >= 60) verdict = "Monitor";
  if (hardStops.length) verdict = "Reject or resolve hard stops";
  else if (evidenceConfidence !== null && evidenceConfidence < 60 && score >= 70) verdict = "Monitor evidence gaps";
  const buyerDepthScore = money((
    boundedScore(input.ownStayAppeal)
    + boundedScore(input.buyerPoolBreadth)
    + boundedScore(input.priceSegmentLiquidity)
  ) / 15 * 100);
  const subScores = {
    rentalHolding: money(boundedScore(input.rentalHoldingPower) / 5 * 100),
    resaleExit: money((
      boundedScore(input.priceSegmentLiquidity)
      + boundedScore(input.buyerPoolBreadth)
      + boundedScore(input.futureSupplyDefense)
      + boundedScore(input.buildingLegalQuality)
    ) / 20 * 100),
    ownStayAppeal: money((
      boundedScore(input.ownStayAppeal)
      + boundedScore(input.relativePropertyQuality)
      + boundedScore(input.microLocationQuality)
    ) / 15 * 100),
    riskControl: money((
      boundedScore(input.buildingLegalQuality)
      + boundedScore(input.futureSupplyDefense)
      + boundedScore(input.entryPriceDiscipline)
    ) / 15 * 100),
    entryDiscipline: money(boundedScore(input.entryPriceDiscipline) / 5 * 100)
  };

  return {
    score,
    verdict,
    evidenceConfidence,
    subScores,
    allInCost: money(allInCost),
    discountToFairValue: money(discountToFairValue),
    allInMarginToFairValue: money(allInMarginToFairValue),
    positionVsAreaMedian: money(positionVsAreaMedian),
    buyerDepthScore,
    grossYieldOnCost: money(grossYieldOnCost),
    netPreDebtYieldOnCost: money(netPreDebtYieldOnCost),
    hardStops,
    challenges,
    weakestFactors,
    scoredFactors
  };
}

function analyzeProperty(input) {
  const price = Number(input.price || 0);
  const rent = Number(input.monthlyRent || 0);
  const vacancyRate = Number(input.vacancyRate || 0) / 100;
  const downPaymentRate = Number(input.downPaymentRate || 0) / 100;
  const interestRate = Number(input.interestRate || 0);
  const loanYears = Number(input.loanYears || 30);
  const closingCosts = Number(input.closingCosts || 0);
  const rehabBudget = Number(input.rehabBudget || 0);
  const taxes = Number(input.annualTaxes || 0) / 12;
  const insurance = Number(input.annualInsurance || 0) / 12;
  const hoa = Number(input.monthlyHoa || 0);
  const maintenance = Number(input.monthlyMaintenance || rent * 0.08);
  const management = Number(input.monthlyManagement || rent * 0.08);
  const otherExpenses = Number(input.otherMonthlyExpenses || 0);
  const downPayment = price * downPaymentRate;
  const loanAmount = Math.max(0, price - downPayment);
  const debtService = monthlyMortgage(loanAmount, interestRate, loanYears);
  const effectiveRent = rent * (1 - vacancyRate);
  const operatingExpenses = taxes + insurance + hoa + maintenance + management + otherExpenses;
  const noi = effectiveRent - operatingExpenses;
  const cashFlow = noi - debtService;
  const cashNeeded = downPayment + closingCosts + rehabBudget;
  const annualNoi = noi * 12;
  const annualCashFlow = cashFlow * 12;
  const capRate = price ? (annualNoi / price) * 100 : 0;
  const cashOnCash = cashNeeded ? (annualCashFlow / cashNeeded) * 100 : 0;
  const dscr = debtService ? noi / debtService : 0;
  const onePercentRule = price ? (rent / price) * 100 : 0;
  const breakEvenOccupancy = rent ? ((operatingExpenses + debtService) / rent) * 100 : 0;

  let rating = "Watch";
  if (cashFlow > 250 && cashOnCash >= 8 && dscr >= 1.25) rating = "Strong";
  if (cashFlow < 0 || dscr < 1) rating = "Risky";

  return {
    monthlyMortgage: money(debtService),
    effectiveRent: money(effectiveRent),
    operatingExpenses: money(operatingExpenses),
    noi: money(noi),
    monthlyCashFlow: money(cashFlow),
    annualCashFlow: money(annualCashFlow),
    cashNeeded: money(cashNeeded),
    capRate: money(capRate),
    cashOnCash: money(cashOnCash),
    dscr: money(dscr),
    onePercentRule: money(onePercentRule),
    breakEvenOccupancy: money(breakEvenOccupancy),
    rating
  };
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9.%\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function termScore(queryTerms, text) {
  const haystack = tokenize(text);
  return queryTerms.reduce((sum, term) => sum + haystack.filter((word) => word.includes(term) || term.includes(word)).length, 0);
}

function conciseText(text, maxLength = 220) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  const sentenceEnd = clean.slice(0, maxLength).match(/^.*[.!?](?=\s|$)/)?.[0];
  return sentenceEnd || `${clean.slice(0, maxLength - 3).trim()}...`;
}

function hasAnyTerm(queryTerms, terms) {
  return terms.some((term) => queryTerms.some((queryTerm) => queryTerm.includes(term) || term.includes(queryTerm)));
}

function findBestByTerms(items, terms, fields) {
  return items
    .map((item) => ({
      item,
      score: termScore(terms, fields.map((field) => item[field]).join(" "))
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .at(0)?.item;
}

function uniqueLines(lines, limit = 4) {
  const seen = new Set();
  return lines
    .map((line) => String(line || "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((line) => {
      const key = line.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

function bulletSection(title, lines, limit = 4) {
  const bullets = uniqueLines(lines, limit);
  if (!bullets.length) return "";
  return `${title}\n${bullets.map((line) => `- ${line}`).join("\n")}`;
}

function shortSentence(text, maxLength = 150) {
  return conciseText(text, maxLength).replace(/\.$/, "");
}

function uniqueSources(items, limit = 6) {
  const seen = new Set();
  return items
    .filter(Boolean)
    .filter((item) => {
      const key = String(item.id || item.title || JSON.stringify(item));
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

function marketMetricLabel(metricType) {
  return String(metricType || "other")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function marketFreshness(observation, now = Date.now()) {
  const thresholdDays = MARKET_FRESHNESS_DAYS[observation.metricType] || MARKET_FRESHNESS_DAYS.other;
  const timestamp = Date.parse(observation.observedAt);
  const ageDays = Number.isFinite(timestamp) ? Math.max(0, Math.floor((now - timestamp) / 86400000)) : Number.MAX_SAFE_INTEGER;
  const status = ageDays <= thresholdDays ? "fresh" : ageDays <= thresholdDays * 2 ? "aging" : "stale";
  return { status, ageDays, thresholdDays };
}

function marketProjectFor(observation, knowledge) {
  return knowledge.projects.find((project) => project.id === observation.projectId) || null;
}

function marketObservationSubject(observation, project = null) {
  return project?.name || observation.projectName || observation.area || "Area observation";
}

function marketSubjectKey(observation, project = null) {
  return observation.projectId || `${marketObservationSubject(observation, project).toLowerCase()}|${observation.area.toLowerCase()}`;
}

function marketObservationValue(observation) {
  if (observation.value === null) return "qualitative observation";
  return `${observation.value}${observation.unit ? ` ${observation.unit}` : ""}`;
}

function marketObservationText(observation, project, freshness) {
  const detail = conciseText(observation.notes || marketObservationValue(observation), 420);
  return `${marketObservationSubject(observation, project)} - ${marketMetricLabel(observation.metricType)}: ${detail}. Observed ${observation.observedAt.slice(0, 10)}; ${freshness.status}, ${freshness.ageDays} days old; ${observation.confidence} confidence; source: ${observation.sourceType}.`;
}

function marketTrendFor(observation, knowledge) {
  if (observation.value === null) return null;
  const project = marketProjectFor(observation, knowledge);
  const key = marketSubjectKey(observation, project);
  const points = knowledge.observations
    .filter((item) => item.metricType === observation.metricType && item.value !== null)
    .filter((item) => marketSubjectKey(item, marketProjectFor(item, knowledge)) === key)
    .sort((left, right) => String(right.observedAt).localeCompare(String(left.observedAt)));
  if (points.length < 2) return null;
  const latest = points[0];
  const previous = points.find((item) => item.observedAt < latest.observedAt);
  if (!previous || latest.value === null || previous.value === null) return null;
  const change = latest.value - previous.value;
  const percentChange = previous.value === 0 ? null : Number(((change / Math.abs(previous.value)) * 100).toFixed(1));
  const stableBand = previous.value === 0 ? 0 : Math.abs(previous.value) * 0.02;
  const direction = Math.abs(change) <= stableBand ? "stable" : change > 0 ? "up" : "down";
  return {
    subject: marketObservationSubject(latest, marketProjectFor(latest, knowledge)),
    metricType: latest.metricType,
    direction,
    change: Number(change.toFixed(2)),
    percentChange,
    unit: latest.unit,
    latestValue: latest.value,
    previousValue: previous.value,
    latestObservedAt: latest.observedAt,
    previousObservedAt: previous.observedAt
  };
}

function selectMarketIntelligence(query, knowledge = emptyKnowledge(), limit = 6) {
  const terms = tokenize(query);
  if (!terms.length || !knowledge.observations.length) {
    return { observations: [], trends: [], summary: { matched: 0, fresh: 0, aging: 0, stale: 0, latestObservedAt: "", warning: "No matching owner market observations." } };
  }
  const ranked = knowledge.observations
    .map((observation) => {
      const project = marketProjectFor(observation, knowledge);
      const searchText = [
        project?.name, project?.aliases?.join(" "), project?.area, project?.state, project?.propertyType, project?.developer,
        observation.projectName, observation.area, observation.state, observation.metricType, observation.notes,
        observation.sourceType, observation.sourceReference
      ].filter(Boolean).join(" ");
      const score = termScore(terms, searchText);
      const freshness = marketFreshness(observation);
      const publicObservation = { ...observation };
      delete publicObservation.sourceReference;
      return {
        ...publicObservation,
        project: project ? { id: project.id, name: project.name, area: project.area, state: project.state } : null,
        score,
        freshness,
        title: `${marketObservationSubject(observation, project)} - ${marketMetricLabel(observation.metricType)}`,
        body: marketObservationText(observation, project, freshness)
      };
    })
    .filter((observation) => observation.score > 0)
    .sort((left, right) => right.score - left.score || String(right.observedAt).localeCompare(String(left.observedAt)))
    .slice(0, Math.max(1, Math.min(20, limit)));
  const trendKeys = new Set();
  const trends = ranked.map((observation) => marketTrendFor(observation, knowledge)).filter((trend) => {
    if (!trend) return false;
    const key = `${trend.subject}|${trend.metricType}`;
    if (trendKeys.has(key)) return false;
    trendKeys.add(key);
    return true;
  });
  const counts = ranked.reduce((summary, observation) => {
    summary[observation.freshness.status] += 1;
    return summary;
  }, { fresh: 0, aging: 0, stale: 0 });
  const latestObservedAt = ranked.map((item) => item.observedAt).sort().at(-1) || "";
  const warning = counts.stale
    ? `${counts.stale} matched observation${counts.stale === 1 ? " is" : "s are"} stale and must be re-verified.`
    : counts.aging
      ? `${counts.aging} matched observation${counts.aging === 1 ? " is" : "s are"} aging.`
      : ranked.length ? "Matched observations are within their freshness windows." : "No matching owner market observations.";
  return { observations: ranked, trends, summary: { matched: ranked.length, ...counts, latestObservedAt, warning } };
}

function marketIntelligenceForPrompt(marketIntelligence) {
  if (!marketIntelligence?.observations?.length) return "No matching owner market observation.";
  const lines = marketIntelligence.observations.map((observation) => `- ${observation.body}`);
  const trends = marketIntelligence.trends.map((trend) => `- Trend: ${trend.subject} ${marketMetricLabel(trend.metricType)} is ${trend.direction}${trend.percentChange === null ? "" : ` (${trend.percentChange}% versus the prior observation)`}.`);
  return [...lines, ...trends, `- Freshness warning: ${marketIntelligence.summary.warning}`].join("\n");
}

function marketSources(marketIntelligence) {
  return (marketIntelligence?.observations || []).map((observation) => ({
    id: observation.id,
    title: observation.title,
    type: "market",
    preview: conciseText(observation.body, 180),
    score: observation.score,
    observedAt: observation.observedAt,
    freshness: observation.freshness.status,
    metricType: observation.metricType
  }));
}

function marketInputError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function findMarketProject(knowledge, { id = "", name = "", area = "" } = {}) {
  if (id) return knowledge.projects.find((project) => project.id === id) || null;
  const cleanName = cleanMarketText(name, 160).toLowerCase();
  const cleanArea = cleanMarketText(area, 120).toLowerCase();
  if (!cleanName) return null;
  return knowledge.projects.find((project) => project.name.toLowerCase() === cleanName && (!cleanArea || project.area.toLowerCase() === cleanArea)) || null;
}

function marketProjectFromInput(body = {}, existing = null) {
  const now = new Date().toISOString();
  const project = normalizeMarketProject({
    ...(existing || {}),
    ...body,
    id: existing?.id || randomUUID(),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  });
  if (!project) throw marketInputError("Project name is required.");
  return project;
}

function marketObservationFromInput(body = {}, knowledge, existing = null) {
  const merged = { ...(existing || {}), ...body };
  const metricType = String(merged.metricType || "").toLowerCase();
  if (!MARKET_METRIC_TYPES.has(metricType)) {
    throw marketInputError(`metricType must be one of: ${[...MARKET_METRIC_TYPES].join(", ")}.`);
  }
  if (!merged.observedAt || !Number.isFinite(Date.parse(String(merged.observedAt)))) {
    throw marketInputError("A valid observedAt date is required.");
  }
  let project = null;
  if (merged.projectId) {
    project = findMarketProject(knowledge, { id: String(merged.projectId) });
    if (!project) throw marketInputError("The linked market project does not exist.");
  } else if (merged.projectName) {
    project = findMarketProject(knowledge, { name: merged.projectName, area: merged.area });
  }
  const now = new Date().toISOString();
  const projectIds = new Set(knowledge.projects.map((item) => item.id));
  const observation = normalizeMarketObservation({
    ...merged,
    id: existing?.id || randomUUID(),
    projectId: project?.id || "",
    projectName: merged.projectName || project?.name || "",
    area: merged.area || project?.area || "",
    state: merged.state || project?.state || "",
    createdAt: existing?.createdAt || now,
    updatedAt: now
  }, projectIds);
  if (!observation.projectId && !observation.projectName && !observation.area) {
    throw marketInputError("Link the observation to a project or provide a projectName or area.");
  }
  if (observation.value === null && !observation.notes) {
    throw marketInputError("Provide a numeric value or a qualitative note.");
  }
  return observation;
}

function compactQuery(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasRealEstateIntent(clean, words) {
  const estateTerms = new Set([
    "property", "estate", "condo", "condominium", "apartment", "serviced", "flat",
    "high", "rise", "landed", "terrace", "semi", "bungalow", "shop", "commercial",
    "industrial", "land", "rent", "rental", "yield", "tenant", "vacancy", "cashflow",
    "cash", "flow", "installment", "instalment", "maintenance", "sinking", "buy",
    "purchase", "sell", "resale", "subsale", "auction", "valuation", "market", "price",
    "loan", "financing", "bank", "dsr", "ccris", "ctos", "freehold", "leasehold",
    "title", "developer", "project", "management", "resident", "density", "supply",
    "demand", "occupancy", "furnishing", "renovation", "layout", "view", "penang",
    "kl", "kuala", "lumpur", "selangor", "malaysia", "brickz"
  ]);
  return words.some((word) => estateTerms.has(word))
    || /\b(rm\s*)?\d+(\.\d+)?\s*(k|m|%)\b/.test(clean)
    || clean.includes("2 5km")
    || clean.includes("2 5 km");
}

function detectCompanionIntent(query) {
  const clean = compactQuery(query);
  if (!clean) return "empty";
  const words = clean.split(" ");

  if (hasRealEstateIntent(clean, words)) return null;

  const greetingTerms = new Set([
    "hi", "hai", "hello", "helo", "hey", "yo", "sup", "wassup", "morning",
    "afternoon", "evening", "gm", "hiya"
  ]);
  const thanksTerms = new Set(["thanks", "thank", "thx", "tq", "appreciate"]);
  const byeTerms = new Set(["bye", "goodbye", "later", "cya", "night"]);
  const ackTerms = new Set(["ok", "okay", "k", "noted", "done", "alright", "sure", "fine", "nice"]);

  if (words.length <= 8 && words.some((word) => greetingTerms.has(word))) return "greeting";
  if (words.length <= 8 && (clean.includes("what s up") || clean.includes("whats up") || clean.includes("howdy"))) return "greeting";
  if (words.length <= 10 && (clean.includes("how are you") || clean.includes("how r u") || clean.includes("how are u"))) return "how_are_you";
  if (words.length <= 10 && (clean.includes("are you there") || clean.includes("you there") || clean.includes("can you hear me"))) return "presence";
  if (words.length <= 8 && (words[0] === "test" || clean.includes("testing") || clean.includes("mic test"))) return "test";
  if (words.length <= 12 && (clean.includes("what can you do") || clean.includes("who are you") || clean.includes("help me") || clean === "help")) return "capability";
  if (words.length <= 12 && (clean.includes("what do you think") || clean.includes("analyse this") || clean.includes("analyze this") || clean.includes("advise me"))) return "need_context";
  if (words.length <= 8 && (words.some((word) => thanksTerms.has(word)) || clean.includes("thank you"))) return "thanks";
  if (words.length <= 8 && words.some((word) => byeTerms.has(word))) return "bye";
  if (words.length <= 5 && (ackTerms.has(clean) || words.every((word) => ackTerms.has(word)))) return "ack";
  return null;
}

function companionAnswer(kind) {
  if (kind === "greeting") {
    return "Hey, I am here. Give me a property, area, price, rent, or concern, and we will pressure-test it together.";
  }
  if (kind === "how_are_you") {
    return "I am good. More importantly, I am switched on. Bring me the next deal, area, or doubt you want to examine.";
  }
  if (kind === "presence") {
    return "Yes, I am here. Send me the property or market question and I will help you think it through.";
  }
  if (kind === "test") {
    return "Signal is good. Apex Analytic is ready.";
  }
  if (kind === "capability") {
    return "I can help you screen properties, challenge your assumptions, test rental and resale risk, and turn the Apex Analytic framework into a clearer decision. Start with any area, project, price, rent, or concern.";
  }
  if (kind === "need_context") {
    return "I can, but give me something concrete first: area, property type, price, expected rent, and your main concern. Then I can pressure-test it properly.";
  }
  if (kind === "thanks") {
    return "Anytime. Bring me the next property or market question when you are ready.";
  }
  if (kind === "bye") {
    return "Alright, talk soon. I will keep the framework ready for the next deal.";
  }
  if (kind === "ack") {
    return "Noted. What do you want to examine next?";
  }
  return "I am here. What property or market question should we look at?";
}

const dealContextLabels = {
  area: "Area",
  projectName: "Project",
  propertyType: "Property type",
  propertyAge: "Property age",
  askingPrice: "Asking price",
  conservativeFairValue: "Conservative fair value",
  expectedRent: "Expected rent",
  maintenance: "Maintenance",
  estimatedInstallment: "Estimated installment",
  cashOutlay: "Cash outlay",
  tenure: "Tenure",
  unitPosition: "Unit position",
  ownStayAppeal: "Own-stay appeal",
  managementQuality: "Management and build quality",
  exitBuyerPool: "Exit buyer pool",
  evidenceConfidence: "Evidence confidence",
  comparableTransactions: "Completed comparable transactions",
  rentEvidence: "Rental evidence",
  siteVisit: "Site visit",
  legalCheck: "Title and legal check",
  nearbySupply: "Nearby supply",
  investmentThesis: "Investment thesis",
  mainConcern: "Main concern",
  killCriterion: "Kill criterion"
};

const profileContextLabels = {
  monthlyIncome: "Monthly income",
  cashReserveMonths: "Cash reserve months",
  cashAvailable: "Cash available",
  currentDebt: "Current debt",
  riskStyle: "Risk style",
  investmentGoal: "Investment goal",
  holdingPeriod: "Holding period",
  existingProperties: "Existing properties",
  nearTermCommitment: "Near-term commitment",
  financialConcern: "Financial concern"
};

function cleanContextRecord(record, labels) {
  return Object.keys(labels).reduce((context, key) => {
    const value = String(record?.[key] || "").replace(/\s+/g, " ").trim();
    if (value) context[key] = value;
    return context;
  }, {});
}

function hasContextData(context) {
  return Boolean(Object.keys(context.dealCard || {}).length || Object.keys(context.financialProfile || {}).length);
}

function contextText(record, labels, title) {
  const lines = Object.entries(record || {})
    .map(([key, value]) => `${labels[key] || key}: ${value}`);
  return lines.length ? `${title}: ${lines.join("; ")}` : "";
}

function parseAmount(value) {
  const clean = String(value || "").toLowerCase().replace(/,/g, "").replace(/rm/g, "").trim();
  const match = clean.match(/(\d+(\.\d+)?)\s*(k|m)?/);
  if (!match) return 0;
  const base = Number(match[1]);
  if (!Number.isFinite(base)) return 0;
  if (match[3] === "m") return base * 1_000_000;
  if (match[3] === "k") return base * 1_000;
  return base;
}

function dealContextNotes(dealCard) {
  const notes = [];
  const price = parseAmount(dealCard.askingPrice);
  const rent = parseAmount(dealCard.expectedRent);
  const maintenance = parseAmount(dealCard.maintenance);
  if (price && rent) {
    const yieldPercent = money((rent * 12 / price) * 100);
    notes.push(`Deal card implies about ${yieldPercent}% gross yield before vacancy and costs.`);
    if (yieldPercent < 6) notes.push("That is below the founder's 6% gross-yield screening baseline. It is not the same as 6% net ROI, so holding costs still need a separate test.");
  }
  if (maintenance && rent) {
    const rentAfterMaintenance = money(rent - maintenance);
    notes.push(`After maintenance, rent before loan is roughly RM${rentAfterMaintenance} per month.`);
  }
  if (dealCard.nearbySupply) notes.push("Nearby supply has been flagged by the user, so substitute competition must be checked carefully.");
  if (dealCard.mainConcern) notes.push(`User concern to address: ${dealCard.mainConcern}`);
  return notes;
}

function profileContextNotes(financialProfile) {
  const notes = [];
  const reserveMonths = Number(String(financialProfile.cashReserveMonths || "").match(/\d+(\.\d+)?/)?.[0] || 0);
  const income = parseAmount(financialProfile.monthlyIncome);
  const debt = parseAmount(financialProfile.currentDebt);
  if (reserveMonths) {
    notes.push(reserveMonths >= 6
      ? "Cash reserve meets the 6-month baseline."
      : "Cash reserve is below the 6-month baseline; I would slow down before taking property risk.");
  }
  if (income && debt) {
    const debtRatio = money((debt / income) * 100);
    notes.push(`Current declared debt is about ${debtRatio}% of monthly income before this new property.`);
  }
  if (financialProfile.riskStyle) notes.push(`User self-classifies as ${financialProfile.riskStyle.toLowerCase()} risk style.`);
  if (financialProfile.investmentGoal) notes.push(`Stated goal: ${financialProfile.investmentGoal}.`);
  if (financialProfile.financialConcern) notes.push(`Financial concern to address: ${financialProfile.financialConcern}`);
  return notes;
}

function parsePlainNumber(value) {
  const match = String(value || "").replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  const numeric = Number(match?.[0]);
  return Number.isFinite(numeric) ? numeric : 0;
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function uniqueText(items, limit = 12) {
  return [...new Set(items.map((item) => String(item || "").trim()).filter(Boolean))].slice(0, limit);
}

function hasStatedRisk(value) {
  const clean = String(value || "").trim().toLowerCase();
  if (!clean) return false;
  return !/^(no|none|nil|n\/a|nothing|not currently|no concern|no upcoming)\b/.test(clean);
}

function formatRinggit(value) {
  if (!Number.isFinite(value)) return "Not available";
  const sign = value < 0 ? "-" : "";
  return `${sign}RM${Math.abs(Math.round(value)).toLocaleString("en-MY")}`;
}

function stressStatus(monthlyCashFlow) {
  if (!Number.isFinite(monthlyCashFlow)) return "unknown";
  if (monthlyCashFlow >= 0) return "resilient";
  if (monthlyCashFlow >= -300) return "pressure";
  return "risk";
}

function analyzeSevenStageDeal(rawDealCard = {}, rawFinancialProfile = {}) {
  const dealCard = cleanContextRecord(rawDealCard, dealContextLabels);
  const financialProfile = cleanContextRecord(rawFinancialProfile, profileContextLabels);
  const price = parseAmount(dealCard.askingPrice);
  const fairValue = parseAmount(dealCard.conservativeFairValue);
  const rent = parseAmount(dealCard.expectedRent);
  const maintenance = parseAmount(dealCard.maintenance);
  const installment = parseAmount(dealCard.estimatedInstallment);
  const cashOutlay = parseAmount(dealCard.cashOutlay);
  const income = parseAmount(financialProfile.monthlyIncome);
  const currentDebt = parseAmount(financialProfile.currentDebt);
  const cashAvailable = parseAmount(financialProfile.cashAvailable);
  const reserveMonths = parsePlainNumber(financialProfile.cashReserveMonths);
  const reserveProvided = Boolean(financialProfile.cashReserveMonths);
  const cashAvailableProvided = Boolean(financialProfile.cashAvailable);
  const cashOutlayProvided = Boolean(dealCard.cashOutlay);
  const holdingYears = parsePlainNumber(financialProfile.holdingPeriod);
  const existingProperties = parsePlainNumber(financialProfile.existingProperties);
  const propertyAge = parsePlainNumber(dealCard.propertyAge);
  const propertyType = String(dealCard.propertyType || "").toLowerCase();
  const goal = String(financialProfile.investmentGoal || "").toLowerCase();
  const tenure = String(dealCard.tenure || "").toLowerCase();
  const isHighRise = /(condo|apartment|flat|serviced|high.?rise)/.test(propertyType);
  const isLanded = /(landed|terrace|semi|bungalow|townhouse)/.test(propertyType);
  const isAppreciationGoal = goal.includes("appreciation");
  const grossYield = price && rent ? (rent * 12 / price) * 100 : null;
  const operatingYield = price && rent
    ? (((rent * 11) - (maintenance * 12)) / price) * 100
    : null;
  const discountToFairValue = price && fairValue ? ((fairValue - price) / fairValue) * 100 : null;
  const holdingCashFlow = rent && installment ? rent - installment - maintenance : null;
  const postDealDsr = income && installment ? ((currentDebt + installment) / income) * 100 : null;
  const cashAfterPurchase = cashAvailableProvided && cashOutlayProvided ? cashAvailable - cashOutlay : null;
  const hardStops = [];
  const watchouts = [];
  const missingEvidence = [];

  const addHardStop = (stage, message, action = "reject") => {
    if (!hardStops.some((item) => item.message === message)) hardStops.push({ stage, message, action });
  };

  if (!fairValue) missingEvidence.push("Recent completed subsale or auction evidence for conservative value");
  if (!rent) missingEvidence.push("Achieved rent and tenant-demand evidence from active local agents");
  if (!installment) missingEvidence.push("A lender-backed monthly instalment estimate");
  if (!dealCard.managementQuality) missingEvidence.push("Management, maintenance, and build-quality checks");
  if (!dealCard.nearbySupply) missingEvidence.push("Direct competing supply within roughly 2.5km");
  if (!dealCard.comparableTransactions || dealCard.comparableTransactions === "None") missingEvidence.push("Recent completed comparable transactions");
  if (!dealCard.rentEvidence || dealCard.rentEvidence === "None" || dealCard.rentEvidence === "Listing only") missingEvidence.push("Achieved-rent proof beyond advertised listings");
  if (dealCard.siteVisit !== "Completed") missingEvidence.push("A completed site visit");
  if (dealCard.legalCheck !== "Clear") missingEvidence.push("Clear title, caveat, restriction, and legal checks");
  if (!dealCard.investmentThesis) missingEvidence.push("A written causal investment thesis");
  if (!dealCard.killCriterion) missingEvidence.push("An observable walk-away criterion");

  let propertyScore = 50;
  if (grossYield !== null) propertyScore += grossYield >= 6 ? 10 : -12;
  if (discountToFairValue !== null) {
    if (discountToFairValue >= 20) propertyScore += 15;
    else if (discountToFairValue >= 0) propertyScore += 5;
    else propertyScore -= 20;
  }
  if (dealCard.ownStayAppeal === "Strong") propertyScore += 10;
  if (dealCard.ownStayAppeal === "Weak") propertyScore -= 20;
  if (dealCard.managementQuality === "Strong") propertyScore += 10;
  if (dealCard.managementQuality === "Weak") {
    propertyScore -= 30;
    addHardStop(1, "Weak management or build quality threatens both holding value and saleability.");
  }
  if (dealCard.unitPosition === "Unfavourable") {
    propertyScore -= 18;
    watchouts.push("The unit position may create a permanent rental and resale discount.");
  }
  if (dealCard.exitBuyerPool === "Own-stay and investor") propertyScore += 10;
  if (dealCard.exitBuyerPool === "Investor mainly" || dealCard.exitBuyerPool === "Unclear") {
    propertyScore -= 12;
    watchouts.push("The exit buyer pool may be too narrow or investor-dependent.");
  }
  if (propertyAge > 10 && isHighRise) {
    propertyScore -= 20;
    addHardStop(1, "This high-rise is over 10 years old, outside the founder-default acquisition mandate.");
  }
  if (isLanded && tenure && !tenure.includes("freehold")) {
    propertyScore -= 25;
    addHardStop(1, "The founder-default landed mandate requires freehold tenure.");
  }
  if (tenure.includes("office") || tenure.includes("fully commercial")) {
    propertyScore -= 30;
    addHardStop(1, "A fully office-commercial title falls outside the preferred residential mandate.");
  }
  const concernText = `${dealCard.mainConcern || ""} ${dealCard.investmentThesis || ""}`.toLowerCase();
  if (/(fishy|caveat|title dispute|fake document|misleading|undisclosed cash)/.test(concernText)) {
    addHardStop(1, "The transaction or title appears suspicious and must be resolved before proceeding.");
  }
  if (dealCard.legalCheck === "Issue found") {
    addHardStop(1, "A title or legal issue has been identified and must be resolved before proceeding.");
  }
  if (discountToFairValue !== null && discountToFairValue < 0) {
    watchouts.push("The asking price is above the stated conservative fair value.");
  }
  propertyScore = clampScore(propertyScore);
  const propertyCoreComplete = Boolean(dealCard.area && dealCard.propertyType && price);
  const stageOneRisk = hardStops.some((item) => item.stage === 1);

  let suitabilityScore = 50;
  if (reserveMonths >= 6) suitabilityScore += 20;
  else if (reserveProvided) {
    suitabilityScore -= 30;
    addHardStop(2, "Cash reserve is below the six-month founder baseline.", "pause");
  }
  if (postDealDsr !== null) {
    if (postDealDsr < 50) suitabilityScore += 20;
    else if (postDealDsr < 80) {
      suitabilityScore -= 10;
      watchouts.push("Post-deal debt service would consume a large share of declared income.");
    } else {
      suitabilityScore -= 35;
      addHardStop(2, "Estimated post-deal DSR is in the 80% danger zone.", "pause");
    }
  }
  if (cashAfterPurchase !== null && cashAfterPurchase < 0) {
    suitabilityScore -= 35;
    addHardStop(2, "Declared cash available does not cover the stated acquisition cash outlay.", "pause");
  }
  if (hasStatedRisk(financialProfile.nearTermCommitment)) {
    suitabilityScore -= 15;
    watchouts.push("A near-term life commitment may compete with the capital required for this property.");
  }
  suitabilityScore = clampScore(suitabilityScore);

  let financingScore = 50;
  if (installment) financingScore += 10;
  if (postDealDsr !== null) financingScore += postDealDsr < 50 ? 20 : postDealDsr >= 80 ? -30 : -5;
  if (discountToFairValue !== null) financingScore += discountToFairValue >= 0 ? 10 : -20;
  if (holdingCashFlow !== null) financingScore += holdingCashFlow >= 0 ? 15 : -15;
  if (!installment) financingScore -= 20;
  financingScore = clampScore(financingScore);

  let holdingScore = 50;
  if (holdingCashFlow !== null) {
    if (holdingCashFlow >= 0) holdingScore += 30;
    else if (isLanded && isAppreciationGoal && Math.abs(holdingCashFlow) <= 450) {
      holdingScore += 5;
      watchouts.push("The landed appreciation case has tolerable negative carry only if the user can hold it safely.");
    } else {
      holdingScore -= 35;
      addHardStop(4, "Rent does not provide acceptable coverage for the instalment and recurring charges.", "pause");
    }
  } else {
    holdingScore -= 20;
  }
  if (reserveMonths >= 6) holdingScore += 10;
  if (reserveProvided && reserveMonths < 6) holdingScore -= 15;
  holdingScore = clampScore(holdingScore);

  let portfolioScore = 55;
  if (existingProperties > 5) {
    portfolioScore -= 20;
    watchouts.push("More than five existing properties requires a concentration and correlated-risk review.");
  } else if (financialProfile.existingProperties) {
    portfolioScore += 5;
  }
  if (reserveMonths >= 6) portfolioScore += 15;
  if (hasStatedRisk(financialProfile.nearTermCommitment)) portfolioScore -= 20;
  if (holdingCashFlow !== null && holdingCashFlow < 0) portfolioScore -= 15;
  portfolioScore = clampScore(portfolioScore);

  let marketScore = 45;
  const supplyKnown = Boolean(dealCard.nearbySupply);
  const supplyRisk = supplyKnown && hasStatedRisk(dealCard.nearbySupply);
  if (supplyKnown && !supplyRisk) marketScore += 15;
  if (supplyRisk) {
    marketScore -= 15;
    watchouts.push("Nearby supply may compete for the same tenant and future buyer pool.");
  }
  if (dealCard.comparableTransactions === "3 or more") marketScore += 10;
  if (dealCard.rentEvidence === "Signed tenancy or achieved rent" || dealCard.rentEvidence === "Agent-confirmed") marketScore += 10;
  marketScore = clampScore(marketScore);

  let evidenceScore = 10;
  if (dealCard.comparableTransactions === "3 or more") evidenceScore += 25;
  else if (dealCard.comparableTransactions === "1 to 2") evidenceScore += 14;
  if (dealCard.rentEvidence === "Signed tenancy or achieved rent") evidenceScore += 25;
  else if (dealCard.rentEvidence === "Agent-confirmed") evidenceScore += 18;
  else if (dealCard.rentEvidence === "Listing only") evidenceScore += 5;
  if (dealCard.siteVisit === "Completed") evidenceScore += 20;
  if (dealCard.legalCheck === "Clear") evidenceScore += 15;
  else if (dealCard.legalCheck === "Pending") evidenceScore += 4;
  evidenceScore = clampScore(evidenceScore);

  let journalScore = 35;
  if (dealCard.investmentThesis) journalScore += 25;
  if (dealCard.killCriterion) journalScore += 25;
  if (holdingYears) journalScore += 10;
  if (dealCard.exitBuyerPool && dealCard.exitBuyerPool !== "Unclear") journalScore += 5;
  journalScore = clampScore(journalScore);

  const stage = (number, name, score, status, summary) => ({ number, name, score, status, summary });
  const stages = [
    stage(1, "Property Selection", propertyScore,
      stageOneRisk ? "risk" : !propertyCoreComplete ? "incomplete" : propertyScore >= 70 ? "pass" : propertyScore < 45 ? "risk" : "watch",
      stageOneRisk ? "A property-level hard stop is unresolved." : propertyScore >= 70 ? "The property has a defensible initial shape, subject to evidence." : "Property quality, entry price, or buyer depth needs more proof."),
    stage(2, "Investor Suitability", suitabilityScore,
      hardStops.some((item) => item.stage === 2) ? "risk" : !income || !reserveMonths ? "incomplete" : suitabilityScore >= 70 ? "pass" : "watch",
      suitabilityScore >= 70 ? "The declared profile appears able to carry the deal." : "Cash reserve, affordability, or life commitments need attention."),
    stage(3, "Financing And Deal Structure", financingScore,
      !installment ? "incomplete" : financingScore >= 70 ? "pass" : financingScore < 45 ? "risk" : "watch",
      !installment ? "No lender-backed instalment estimate was provided." : financingScore >= 70 ? "The financing is initially supportable under the supplied numbers." : "Leverage, valuation, or coverage remains fragile."),
    stage(4, "Holding Power", holdingScore,
      holdingCashFlow === null ? "incomplete" : hardStops.some((item) => item.stage === 4) ? "risk" : holdingScore >= 70 ? "pass" : "watch",
      holdingCashFlow === null ? "Rent and instalment are needed for a holding test." : holdingCashFlow >= 0 ? "Rent covers the stated instalment and maintenance." : "The owner must fund a monthly holding shortfall."),
    stage(5, "Portfolio Strategy", portfolioScore,
      !financialProfile.existingProperties && financialProfile.existingProperties !== "0" ? "incomplete" : portfolioScore >= 70 ? "pass" : portfolioScore < 45 ? "risk" : "watch",
      portfolioScore >= 70 ? "The deal does not appear to weaken portfolio resilience." : "Concentration, liquidity, or life-capital competition needs review."),
    stage(6, "Market Intelligence", marketScore,
      !supplyKnown || evidenceScore < 55 ? "incomplete" : marketScore >= 70 ? "pass" : marketScore < 45 ? "risk" : "watch",
      "This stage uses supplied evidence only; live market conditions still require verification."),
    stage(7, "Decision Journal", journalScore,
      !dealCard.investmentThesis || !dealCard.killCriterion ? "incomplete" : journalScore >= 70 ? "pass" : "watch",
      journalScore >= 70 ? "The thesis and walk-away condition are recorded." : "Record the thesis, exit logic, and kill criterion before committing.")
  ];

  const completedFields = [
    dealCard.area, dealCard.propertyType, price, fairValue, rent, installment,
    dealCard.ownStayAppeal, dealCard.managementQuality, dealCard.exitBuyerPool,
    dealCard.comparableTransactions, dealCard.rentEvidence,
    dealCard.siteVisit, dealCard.legalCheck, income, reserveMonths, cashAvailable, currentDebt,
    financialProfile.existingProperties, dealCard.investmentThesis, dealCard.killCriterion
  ].filter((value) => value !== "" && value !== undefined && value !== null && value !== 0).length;
  const completeness = Math.round(completedFields / 20 * 100);

  let exitResilienceScore = 50;
  if (dealCard.exitBuyerPool === "Own-stay and investor") exitResilienceScore += 20;
  else if (dealCard.exitBuyerPool === "Investor mainly" || dealCard.exitBuyerPool === "Unclear") exitResilienceScore -= 20;
  if (dealCard.unitPosition === "Good") exitResilienceScore += 10;
  else if (dealCard.unitPosition === "Unfavourable") exitResilienceScore -= 20;
  if (dealCard.ownStayAppeal === "Strong") exitResilienceScore += 10;
  else if (dealCard.ownStayAppeal === "Weak") exitResilienceScore -= 15;
  if (supplyRisk) exitResilienceScore -= 15;
  if (discountToFairValue !== null && discountToFairValue >= 10) exitResilienceScore += 10;
  exitResilienceScore = clampScore(exitResilienceScore);

  const investorSuitabilityScore = clampScore(
    suitabilityScore * 0.4 + financingScore * 0.2 + holdingScore * 0.3 + portfolioScore * 0.1
  );
  const marketExitScore = clampScore(marketScore * 0.55 + exitResilienceScore * 0.45);
  const dimensions = [
    { key: "property", label: "Property quality", score: propertyScore },
    { key: "investor", label: "Investor suitability", score: investorSuitabilityScore },
    { key: "evidence", label: "Evidence quality", score: evidenceScore },
    { key: "exit", label: "Market and exit", score: marketExitScore }
  ].map((item) => ({
    ...item,
    status: item.score >= 75 ? "strong" : item.score >= 55 ? "watch" : "weak"
  }));
  const averageScore = clampScore(
    propertyScore * 0.3 + investorSuitabilityScore * 0.3 + evidenceScore * 0.2 + marketExitScore * 0.2
  );
  const confidence = Math.min(95, Math.round(evidenceScore * 0.82 + completeness * 0.13));
  const rejectStops = hardStops.filter((item) => item.action === "reject");
  const pauseStops = hardStops.filter((item) => item.action === "pause");
  let verdict = "INVESTIGATE";
  if (rejectStops.length) verdict = "REJECT";
  else if (pauseStops.length) verdict = "PAUSE";
  else if (averageScore >= 74 && confidence >= 65 && !stages.some((item) => item.status === "risk")) verdict = "SHORTLIST";

  let counterThesis = "The property may look affordable or rentable but still fail to attract a broad future buyer pool in a stagnant resale market.";
  if (supplyRisk) counterThesis = "Newer substitute supply may reduce both achieved rent and future resale pricing before this thesis matures.";
  if (dealCard.managementQuality === "Weak") counterThesis = "Strong location and cheap entry may not overcome management deterioration, repair burden, and buyer resistance.";
  if (dealCard.unitPosition === "Unfavourable") counterThesis = "A permanent unit-position defect may make the cheaper entry difficult to recover at resale.";

  const hardStopText = hardStops.map((item) => `Stage ${item.stage}: ${item.message}`);
  const missing = uniqueText(missingEvidence, 7);
  const actions = [];
  if (hardStops.length) actions.push("Resolve every hard stop before paying or committing further capital.");
  actions.push(...missing.slice(0, 3).map((item) => `Obtain: ${item}.`));
  if (dealCard.unitPosition !== "Good" || !dealCard.managementQuality) actions.push("Complete a site visit focused on unit position, management, residents, noise, and common areas.");

  const verdictSummary = verdict === "REJECT"
    ? "The property has an unresolved structural or transaction-level problem."
    : verdict === "PAUSE"
      ? "The property may be workable, but the investor or holding structure is not ready."
      : verdict === "SHORTLIST"
        ? "The deal is strong enough for deeper verification, not automatic purchase."
        : "There is not enough verified evidence for a confident decision yet.";
  const primaryRisk = hardStopText[0] || watchouts[0] || missing[0] || counterThesis;
  const voiceSummary = `My current verdict is ${verdict.toLowerCase()}. ${verdictSummary} The main issue is ${primaryRisk}`;

  const scenarioInputsReady = Boolean(rent && installment);
  const scenarios = scenarioInputsReady ? [
    {
      label: "Base case",
      assumption: "Current rent, instalment, and maintenance",
      monthlyCashFlow: rent - installment - maintenance
    },
    {
      label: "Rent pressure",
      assumption: "Rent falls 10%",
      monthlyCashFlow: (rent * 0.9) - installment - maintenance
    },
    {
      label: "Financing pressure",
      assumption: "Instalment rises 10% as a rate-cost proxy",
      monthlyCashFlow: rent - (installment * 1.1) - maintenance
    },
    {
      label: "Combined downside",
      assumption: "Rent -10%, instalment +10%, one vacant month per year",
      monthlyCashFlow: (((rent * 0.9) * 11) - ((installment * 1.1) * 12) - (maintenance * 12)) / 12
    }
  ].map((item) => ({
    ...item,
    monthlyCashFlow: Math.round(item.monthlyCashFlow),
    value: formatRinggit(item.monthlyCashFlow),
    status: stressStatus(item.monthlyCashFlow)
  })) : [];

  return {
    verdict,
    summary: verdictSummary,
    confidence,
    completeness,
    averageScore,
    voiceSummary,
    counterThesis,
    metrics: [
      grossYield === null ? null : { label: "Gross yield", value: `${money(grossYield)}%` },
      operatingYield === null ? null : { label: "Operating yield", value: `${money(operatingYield)}%` },
      discountToFairValue === null ? null : { label: "Discount to value", value: `${money(discountToFairValue)}%` },
      holdingCashFlow === null ? null : { label: "Monthly holding", value: formatRinggit(holdingCashFlow) },
      postDealDsr === null ? null : { label: "Post-deal DSR", value: `${money(postDealDsr)}%` },
      cashAfterPurchase === null ? null : { label: "Cash after purchase", value: formatRinggit(cashAfterPurchase) }
    ].filter(Boolean),
    stages,
    dimensions,
    scenarios,
    hardStops: hardStopText,
    watchouts: uniqueText(watchouts, 6),
    missingEvidence: missing,
    nextActions: uniqueText(actions, 5),
    context: { dealCard, financialProfile }
  };
}

function dealAnalysisText(analysis) {
  const lines = [
    `${analysis.verdict}: ${analysis.summary}`,
    `Confidence ${analysis.confidence}%. Input completeness ${analysis.completeness}%.`
  ];
  if (analysis.aiCommentary) lines.push("", "Apex Analytic commentary", analysis.aiCommentary);
  if (analysis.dimensions?.length) {
    lines.push("", "Four-part decision read", ...analysis.dimensions.map((item) => `- ${item.label}: ${item.score}/100 (${item.status}).`));
  }
  if (analysis.scenarios?.length) {
    lines.push("", "Downside scenarios", ...analysis.scenarios.map((item) => `- ${item.label}: ${item.value} per month. ${item.assumption}.`));
  }
  if (analysis.marketIntelligence?.observations?.length) {
    lines.push("", "Owner market intelligence");
    lines.push(...analysis.marketIntelligence.observations.map((item) => `- ${item.body}`));
    lines.push(...analysis.marketIntelligence.trends.map((trend) => `- Trend: ${trend.subject} ${marketMetricLabel(trend.metricType)} is ${trend.direction}${trend.percentChange === null ? "" : ` (${trend.percentChange}% versus the prior observation)`}.`));
    lines.push(`- Freshness: ${analysis.marketIntelligence.summary.warning}`);
  }
  lines.push("", "Seven-stage read", ...analysis.stages.map((item) => `- Stage ${item.number}, ${item.name}: ${item.status.toUpperCase()} (${item.score}/100). ${item.summary}`));
  if (analysis.hardStops.length) lines.push("", "Hard stops", ...analysis.hardStops.map((item) => `- ${item}`));
  if (analysis.watchouts.length) lines.push("", "Watch-outs", ...analysis.watchouts.map((item) => `- ${item}`));
  lines.push("", "Strongest counter-thesis", `- ${analysis.counterThesis}`);
  if (analysis.missingEvidence.length) lines.push("", "Missing evidence", ...analysis.missingEvidence.map((item) => `- ${item}`));
  return lines.join("\n");
}

async function dealAnalysisSources() {
  const corpus = await readJson(RAG_PATH, []);
  const ids = new Set([
    "framework-seven-stage-canonical-map",
    "quality-buyer-depth-selection",
    "financing-loan-margin-discipline",
    "holding-shortfall-vacancy-rule",
    "portfolio-next-property-gate",
    "market-crisis-buying-rule",
    "journal-process-outcome-luck"
  ]);
  return corpus
    .filter((item) => ids.has(item.id))
    .map((item) => ({
      id: item.id,
      title: item.title,
      type: "reference",
      preview: conciseText(item.body, 160),
      score: 1
    }));
}

function llmEnabled() {
  return Boolean(LLM_API_KEY && ["openai", "openrouter"].includes(LLM_PROVIDER));
}

function openAiOutputText(payload) {
  if (String(payload?.output_text || "").trim()) return String(payload.output_text).trim();
  const parts = Array.isArray(payload?.output)
    ? payload.output.flatMap((item) => Array.isArray(item?.content) ? item.content : [])
    : [];
  return parts
    .filter((item) => item?.type === "output_text" && item.text)
    .map((item) => String(item.text).trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function chatCompletionText(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content.map((part) => typeof part === "string" ? part : part?.text || "").join("\n").trim();
  }
  return "";
}

function llmResponseWasTruncated(payload, openRouter) {
  if (openRouter) return String(payload?.choices?.[0]?.finish_reason || "").toLowerCase() === "length";
  const reason = String(payload?.incomplete_details?.reason || "").toLowerCase();
  return payload?.status === "incomplete" && ["max_output_tokens", "length"].includes(reason);
}

async function requestLlmText({ instructions, input, maxOutputTokens = 1200 }) {
  if (!llmEnabled()) throw new Error("The LLM provider is not configured.");
  const openRouter = LLM_PROVIDER === "openrouter";
  const attempts = [
    { instructions, maxOutputTokens },
    {
      instructions: `${instructions}\n- Your previous draft reached the output limit. Return a complete answer in at most 450 words. Finish every sentence and list. Use plain text with short bullets; do not use Markdown tables, pipe characters, bold markers, or code fences.`,
      maxOutputTokens: Math.min(4000, Math.max(maxOutputTokens * 2, 1600))
    }
  ];

  for (const attempt of attempts) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
    let payload;
    try {
      const response = await fetch(`${LLM_BASE_URL}/${openRouter ? "chat/completions" : "responses"}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LLM_API_KEY}`,
          "Content-Type": "application/json",
          ...(openRouter && OPENROUTER_SITE_URL ? { "HTTP-Referer": OPENROUTER_SITE_URL } : {}),
          ...(openRouter ? { "X-Title": "Apex Analytic" } : {})
        },
        body: JSON.stringify(openRouter
          ? {
            model: LLM_MODEL,
            messages: [
              { role: "system", content: attempt.instructions },
              { role: "user", content: input }
            ],
            max_tokens: attempt.maxOutputTokens
          }
          : {
            model: LLM_MODEL,
            instructions: attempt.instructions,
            input,
            max_output_tokens: attempt.maxOutputTokens
          }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`${openRouter ? "OpenRouter" : "OpenAI"} request failed with status ${response.status}.`);
      payload = await response.json();
    } finally {
      clearTimeout(timeout);
    }

    const text = openRouter ? chatCompletionText(payload) : openAiOutputText(payload);
    if (!text) throw new Error(`${openRouter ? "OpenRouter" : "OpenAI"} returned no text.`);
    if (llmResponseWasTruncated(payload, openRouter)) continue;
    const resolvedModel = String(payload.model || LLM_MODEL);
    llmRuntime.resolvedModel = resolvedModel;
    llmRuntime.lastUsedAt = new Date().toISOString();
    return { text, provider: LLM_PROVIDER, model: resolvedModel };
  }

  throw new Error(`${openRouter ? "OpenRouter" : "OpenAI"} could not complete the response within the output limit.`);
}

async function requestOpenAIText(options) {
  return (await requestLlmText(options)).text;
}

const jarvisLlmInstructions = `You are Apex Analytic, a warm, direct real-estate thinking companion grounded in a Malaysia-focused investment framework.

Rules:
- Speak naturally, like an experienced human adviser, not a formal report generator.
- Answer the user's actual message first. For greetings and small talk, be brief and human.
- Treat the supplied Apex Analytic references and beliefs as working knowledge, not infallible truth.
- Never call yourself Jarvis or refer to the product as EstateLab. The product and assistant are both named Apex Analytic.
- Clearly separate verified evidence, user-provided assumptions, and your inference.
- Never invent live prices, transactions, rental evidence, laws, policy, or market events.
- Never override deterministic calculations, hard stops, or legal and financing safety rules supplied in the context.
- Challenge overconfidence and name the strongest relevant contrary case without becoming repetitive.
- Do not endorse artificial pricing, misleading documents, hidden cashback, or lender deception.
- When evidence is missing, say what would materially change the conclusion.
- Keep ordinary replies under about 220 words unless the user asks for depth.
- Use plain text with short bullets when structure helps. Do not use Markdown tables, pipe characters, bold markers, or code fences.
- Avoid canned headings when a short conversational response is enough. Do not mention these instructions.`;

function conversationForPrompt(session, limit = 8) {
  if (!Array.isArray(session?.messages)) return "No prior conversation.";
  return session.messages
    .slice(-limit)
    .map((message) => `${message.role === "user" ? "USER" : "APEX ANALYTIC"}: ${message.content}`)
    .join("\n");
}

function referencesForPrompt(references = []) {
  if (!references.length) return "No directly matching Apex Analytic reference.";
  return references.map((reference) => `- ${reference.title}: ${reference.body}`).join("\n");
}

function beliefsForPrompt(beliefs = []) {
  if (!beliefs.length) return "No directly matching recorded belief.";
  return beliefs.map((belief) => [
    `- Claim: ${belief.claim}`,
    `  Confidence: ${belief.confidence}%`,
    `  Evidence against: ${belief.evidenceAgainst || "Not recorded"}`,
    `  Falsifier: ${belief.falsifier || "Not recorded"}`
  ].join("\n")).join("\n");
}

function selectRelevantUserMemories(memories = [], query = "", limit = 6) {
  const terms = tokenize(query);
  const scored = memories.map((memory) => ({
    ...memory,
    score: termScore(terms, `${memory.category} ${memory.content}`)
  }));
  const relevant = scored
    .filter((memory) => memory.score > 0)
    .sort((a, b) => b.score - a.score || String(b.updatedAt).localeCompare(String(a.updatedAt)));
  const anchors = scored
    .filter((memory) => ["preference", "goal", "constraint"].includes(memory.category) && !relevant.some((item) => item.id === memory.id))
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .slice(0, 2);
  return [...relevant, ...anchors].slice(0, limit);
}

function memoriesForPrompt(memories = []) {
  if (!memories.length) return "No approved long-term user memory is relevant.";
  return memories.map((memory) => `- ${memory.category}: ${memory.content}`).join("\n");
}

function selectRelevantUserJournal(journal = [], query = "", limit = 3) {
  const terms = tokenize(query);
  return journal
    .map((decision) => ({
      ...decision,
      score: termScore(terms, [
        decision.subject,
        decision.prePurchase.thesis,
        decision.prePurchase.counterThesis,
        decision.prePurchase.killCriterion,
        decision.outcome.result,
        decision.outcome.lesson
      ].join(" "))
    }))
    .filter((decision) => decision.score > 0)
    .sort((a, b) => b.score - a.score || String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .slice(0, limit);
}

function journalForPrompt(journal = []) {
  if (!journal.length) return "No locked private decision-journal entry is relevant.";
  return journal.map((decision) => [
    `- ${decision.subject}: decision ${decision.prePurchase.decision}. Thesis: ${decision.prePurchase.thesis}`,
    `  Counter-thesis: ${decision.prePurchase.counterThesis}`,
    `  Kill criterion: ${decision.prePurchase.killCriterion}`,
    decision.outcome.reviewedAt ? `  Outcome: ${decision.outcome.result}. Lesson: ${decision.outcome.lesson}. Skill signal: ${journalSkillSignal(decision)}` : "  Outcome not reviewed yet."
  ].join("\n")).join("\n");
}

async function generateJarvisLlmAnswer({
  query,
  session,
  dealCard,
  financialProfile,
  references,
  beliefs,
  decisions,
  memories,
  journal,
  marketIntelligence = null,
  fallbackAnswer
}) {
  const decisionContext = decisions.length
    ? decisions.map((decision) => `- ${decision.subject}: ${decision.thesis}. Counter-thesis: ${decision.counterThesis || "Not recorded"}`).join("\n")
    : "No directly matching prior decision.";
  const structuredContext = [
    contextText(dealCard, dealContextLabels, "Deal card"),
    contextText(financialProfile, profileContextLabels, "Financial profile")
  ].filter(Boolean).join("\n") || "No structured deal or financial profile supplied.";
  const input = `CURRENT USER MESSAGE
${query}

RECENT CONVERSATION
${conversationForPrompt(session)}

STRUCTURED USER CONTEXT
${structuredContext}

RELEVANT APEX ANALYTIC REFERENCES
${referencesForPrompt(references)}

RELEVANT RECORDED BELIEFS
${beliefsForPrompt(beliefs)}

RELEVANT PRIOR DECISIONS
${decisionContext}

APPROVED PRIVATE USER MEMORY
${memoriesForPrompt(memories)}

LOCKED PRIVATE DECISION JOURNAL
${journalForPrompt(journal)}

OWNER-CONTROLLED MARKET INTELLIGENCE
${marketIntelligenceForPrompt(marketIntelligence)}

DETERMINISTIC FALLBACK ANALYSIS
${fallbackAnswer}

Respond to the current user message. Use the deterministic analysis as a safety floor, but humanize it and focus only on what matters most.`;
  return requestLlmText({ instructions: jarvisLlmInstructions, input, maxOutputTokens: 1200 });
}

async function generateDealLlmCommentary(analysis, dealCard, financialProfile, memories = []) {
  const input = `A deterministic seven-stage Apex Analytic engine produced this result:
${dealAnalysisText(analysis)}

Deal context:
${contextText(dealCard, dealContextLabels, "Deal card") || "Not supplied"}

Investor context:
${contextText(financialProfile, profileContextLabels, "Financial profile") || "Not supplied"}

Approved private user memory:
${memoriesForPrompt(memories)}

Give a natural Apex Analytic commentary in 60 to 110 words. Start with the verdict, explain the single most important reason, state the strongest challenge, and end with the next evidence to obtain. Do not alter any score, metric, hard stop, or verdict.`;
  return requestLlmText({ instructions: jarvisLlmInstructions, input, maxOutputTokens: 220 });
}

async function retrieveGuidance(query, property, brain, knowledge = emptyKnowledge()) {
  const corpus = await readJson(RAG_PATH, []);
  const queryTerms = tokenize(`${query} ${property ? JSON.stringify(property) : ""}`);
  const scored = corpus
    .map((doc) => {
      return { ...doc, score: termScore(queryTerms, `${doc.title} ${doc.tags?.join(" ")} ${doc.body}`) };
    })
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  const evidenceResult = await knowledgeService.retrieve(String(query || ""), knowledge.chunks, 4);
  const evidenceHits = evidenceResult.matches.map((chunk) => {
    const document = knowledge.documents.find((item) => item.id === chunk.documentId);
    return { ...chunk, title: document?.title || "Owner evidence", tags: document?.tags || [] };
  });
  const marketIntelligence = selectMarketIntelligence(`${query} ${property ? JSON.stringify(property) : ""}`, knowledge, 6);

  const beliefHits = brain.beliefs
    .map((belief) => ({ ...belief, score: termScore(queryTerms, `${belief.claim} ${belief.scope} ${belief.evidenceFor} ${belief.evidenceAgainst} ${belief.falsifier}`) }))
    .filter((belief) => belief.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const decisionHits = brain.decisions
    .map((decision) => ({ ...decision, score: termScore(queryTerms, `${decision.subject} ${decision.geography} ${decision.thesis} ${decision.counterThesis} ${decision.killCriteria}`) }))
    .filter((decision) => decision.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  const sections = [];
  if (scored.length) sections.push(`Relevant reference guidance:\n${scored.map((doc) => `- ${doc.title}: ${doc.body}`).join("\n")}`);
  if (evidenceHits.length) sections.push(`Relevant owner evidence:\n${evidenceHits.map((item) => `- ${item.title}: ${item.content}`).join("\n")}`);
  if (marketIntelligence.observations.length) sections.push(`Relevant owner market intelligence:\n${marketIntelligenceForPrompt(marketIntelligence)}`);
  if (beliefHits.length) {
    sections.push(`Your relevant recorded beliefs:\n${beliefHits.map((belief) => `- ${belief.claim} (${belief.confidence}% confidence). Falsifier: ${belief.falsifier || "not defined"}`).join("\n")}`);
  }
  if (decisionHits.length) {
    sections.push(`Relevant prior decisions:\n${decisionHits.map((decision) => `- ${decision.subject}: ${decision.thesis}. Strongest counter-thesis: ${decision.counterThesis || "not recorded"}`).join("\n")}`);
  }
  sections.push(`Question to sharpen the judgment:\n- ${nextThinkingQuestion(brain).question}`);

  return {
    answer: sections.join("\n\n"),
    sources: [
      ...scored.map(({ id, title, tags }) => ({ id, title, tags, type: "reference" })),
      ...evidenceHits.map(({ id, title, tags, score }) => ({ id, title, tags, score, type: "evidence" })),
      ...marketSources(marketIntelligence),
      ...beliefHits.map(({ id, claim }) => ({ id, title: claim, type: "belief" })),
      ...decisionHits.map(({ id, subject }) => ({ id, title: subject, type: "decision" }))
    ]
  };
}

async function retrieveJarvisAnswer(query, brain, session, context = {}, knowledge = emptyKnowledge(), userMemories = [], userJournal = []) {
  const dealCard = cleanContextRecord(context.dealCard, dealContextLabels);
  const financialProfile = cleanContextRecord(context.financialProfile, profileContextLabels);
  const hasStructuredContext = hasContextData({ dealCard, financialProfile });
  const contextForSearch = [
    contextText(dealCard, dealContextLabels, "Deal card"),
    contextText(financialProfile, profileContextLabels, "Financial profile")
  ].filter(Boolean).join(" ");
  const relevantMemories = selectRelevantUserMemories(userMemories, `${query} ${contextForSearch}`);
  const relevantJournal = selectRelevantUserJournal(userJournal, `${query} ${contextForSearch}`);
  const companionIntent = detectCompanionIntent(query);
  if (companionIntent && (companionIntent !== "need_context" || !hasStructuredContext)) {
    const fallbackAnswer = companionAnswer(companionIntent);
    if (llmEnabled()) {
      try {
        const completion = await generateJarvisLlmAnswer({
          query,
          session,
          dealCard,
          financialProfile,
          references: [],
          beliefs: [],
          decisions: [],
          memories: relevantMemories,
          journal: [],
          fallbackAnswer
        });
        return { answer: completion.text, sources: [], mode: "llm", provider: completion.provider, model: completion.model, retrievalMode: "none" };
      } catch (error) {
        console.warn(`Apex Analytic LLM fallback: ${error.message}`);
      }
    }
    return { answer: fallbackAnswer, sources: [], mode: "framework", retrievalMode: "none" };
  }

  const corpus = await readJson(RAG_PATH, []);
  const recentSessionContext = Array.isArray(session?.messages)
    ? session.messages.slice(-6).map((message) => message.content).join(" ")
    : "";
  const queryTerms = tokenize(`${recentSessionContext} ${query} ${contextForSearch}`);
  const evidenceResult = await knowledgeService.retrieve(`${recentSessionContext} ${query} ${contextForSearch}`, knowledge.chunks, 4);
  const ownerEvidence = evidenceResult.matches.map((chunk) => {
    const document = knowledge.documents.find((item) => item.id === chunk.documentId);
    return {
      ...chunk,
      title: document?.title || "Owner evidence",
      tags: document?.tags || [],
      body: chunk.content,
      type: "evidence"
    };
  });
  const marketIntelligence = selectMarketIntelligence(`${recentSessionContext} ${query} ${contextForSearch}`, knowledge, 6);
  const topReferences = corpus
    .map((doc) => ({ ...doc, score: termScore(queryTerms, `${doc.title} ${doc.tags?.join(" ")} ${doc.body}`) }))
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const topBeliefs = brain.beliefs
    .filter((belief) => belief.status !== "retired")
    .map((belief) => ({ ...belief, score: termScore(queryTerms, `${belief.claim} ${belief.scope} ${belief.evidenceFor} ${belief.evidenceAgainst} ${belief.falsifier}`) }))
    .filter((belief) => belief.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
  const topDecisions = brain.decisions
    .map((decision) => ({ ...decision, score: termScore(queryTerms, `${decision.subject} ${decision.geography} ${decision.thesis} ${decision.counterThesis} ${decision.killCriteria}`) }))
    .filter((decision) => decision.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 1);
  const topBelief = topBeliefs[0];
  const topDecision = topDecisions[0];
  const rentalReference = findBestByTerms(corpus, ["rental", "yield", "installment", "cash", "vacancy"], ["title", "body"]);
  const supplyReference = findBestByTerms(corpus, ["future", "supply", "competition", "2.5km", "newer", "layout"], ["title", "body"]);
  const buyerPoolReference = findBestByTerms(corpus, ["buyer", "pool", "own", "stay", "exit"], ["title", "body"]);
  const evidenceReference = findBestByTerms(corpus, ["evidence", "agent", "occupancy", "transaction", "brickz", "auction"], ["title", "body"]);

  const isRentalQuestion = hasAnyTerm(queryTerms, ["rental", "rent", "yield", "tenant", "vacancy", "cash", "installment"]);
  const isSupplyQuestion = hasAnyTerm(queryTerms, ["supply", "competition", "competitor", "newer", "2.5km", "density"]);
  const isBuyQuestion = hasAnyTerm(queryTerms, ["buy", "purchase", "deal", "invest", "proceed"]);
  const isPenangQuestion = hasAnyTerm(queryTerms, ["penang"]);
  const hasYieldMention = /\b\d+(\.\d+)?\s*%/.test(`${query} ${contextForSearch}`);
  const dealRead = dealContextNotes(dealCard);
  const profileFit = profileContextNotes(financialProfile);

  let verdict = "My take: I would investigate further before deciding.";
  if (isBuyQuestion && isRentalQuestion && isSupplyQuestion) {
    verdict = "My take: not a yes yet. I would only shortlist it if the rent is real and the future supply risk is defendable.";
  } else if (isBuyQuestion && isRentalQuestion) {
    verdict = "My take: possible shortlist, but only if rent can cover the installment and recurring charges under a conservative case.";
  } else if (isBuyQuestion) {
    verdict = "My take: judge the property quality first, not whether it looks cheap.";
  } else if (hasStructuredContext) {
    verdict = "My take: I can work with this context. The next step is to test whether the deal and your profile fit each other.";
  }

  const reasoning = [];
  if (/\b6\s*%/.test(query)) reasoning.push("6% yield passes your baseline, but it does not approve the deal by itself.");
  else if (hasYieldMention || isRentalQuestion) reasoning.push("Yield is only a starting clue; actual signed rent and vacancy matter more.");
  if (isSupplyQuestion) reasoning.push("Newer similar projects within 2.5km can steal both tenants and future buyers.");
  if (isPenangQuestion) reasoning.push("In Penang, tenure can matter more, so freehold/leasehold must match the exit buyer pool.");
  if (buyerPoolReference) reasoning.push("I still want both own-stay appeal and investor-grade rent, not just one buyer segment.");
  if (!reasoning.length && topBelief) reasoning.push(shortSentence(topBelief.claim, 150));

  const risks = [];
  if (isSupplyQuestion) risks.push("If the new supply has similar layout and pricing, your unit may lose pricing power.");
  if (isRentalQuestion) risks.push("If rent cannot cover installment plus recurring charges, I would not treat it as a safe high-rise rental play.");
  if (topBelief?.evidenceAgainst) risks.push(shortSentence(topBelief.evidenceAgainst, 150));
  if (topDecision?.counterThesis) risks.push(shortSentence(topDecision.counterThesis, 150));

  const evidenceChecks = [];
  if (isRentalQuestion) evidenceChecks.push("Ask agents for actual signed rent, vacancy speed, and tenant urgency.");
  if (isSupplyQuestion) evidenceChecks.push("List every newer substitute within 2.5km and compare layout, price, facilities, and access.");
  evidenceChecks.push("Check subsale transactions and successful auction bids, not listing prices.");
  if (!isRentalQuestion && !isSupplyQuestion && evidenceReference) evidenceChecks.push(shortSentence(evidenceReference.body, 150));

  const challenge = [];
  if (isSupplyQuestion) challenge.push("If a newer project nearby is priced similarly, why would the next tenant or buyer still choose this unit?");
  else if (topBelief?.falsifier) challenge.push(shortSentence(topBelief.falsifier, 150));
  else challenge.push(nextThinkingQuestion(brain).question);

  const sections = [
    verdict,
    bulletSection("Owner evidence", ownerEvidence.slice(0, 2).map((reference) => `${reference.title}: ${shortSentence(reference.content, 180)}`), 2),
    bulletSection("Market intelligence", marketIntelligence.observations.slice(0, 3).map((observation) => observation.body), 3),
    marketIntelligence.observations.length ? bulletSection("Market freshness", [marketIntelligence.summary.warning], 1) : "",
    bulletSection("Deal read", dealRead, 3),
    bulletSection("Your memory", relevantMemories.map((memory) => memory.content), 3),
    bulletSection("Your decision journal", relevantJournal.map((decision) => {
      const lesson = decision.outcome.reviewedAt ? ` Lesson: ${decision.outcome.lesson}` : "";
      return `${decision.subject}: ${decision.prePurchase.decision}. ${decision.prePurchase.thesis}${lesson}`;
    }), 2),
    bulletSection("Why", reasoning, 3),
    bulletSection("Watch-outs", risks, 2),
    bulletSection("Profile fit", profileFit, 3),
    bulletSection("Check next", evidenceChecks, 3),
    bulletSection("My challenge back", challenge, 1)
  ].filter(Boolean);

  const fallbackAnswer = sections.join("\n\n");
  const promptReferences = uniqueSources([
    ...ownerEvidence,
    ...marketIntelligence.observations,
    ...topReferences,
    rentalReference,
    supplyReference,
    buyerPoolReference,
    evidenceReference
  ], 6);
  const sources = [
      ...ownerEvidence.map((reference) => ({
        id: reference.id,
        title: reference.title,
        type: "evidence",
        preview: conciseText(reference.content, 160),
        score: reference.score
      })),
      ...marketSources(marketIntelligence),
      ...uniqueSources([...topReferences, rentalReference, supplyReference, buyerPoolReference, evidenceReference], 6).map((reference) => ({
        id: reference.id,
        title: reference.title,
        type: "reference",
        preview: conciseText(reference.body, 160),
        score: reference.score
      })),
      ...topBeliefs.map((belief) => ({
        id: belief.id,
        title: belief.claim,
        type: "belief",
        preview: conciseText(belief.evidenceFor || belief.scope, 160),
        score: belief.score
      })),
      ...topDecisions.map((decision) => ({
        id: decision.id,
        title: decision.subject,
        type: "decision",
        preview: conciseText(decision.thesis, 160),
        score: decision.score
      })),
      ...relevantMemories.map((memory) => ({
        id: memory.id,
        title: memory.content,
        type: "memory",
        preview: memory.category,
        score: memory.score
      })),
      ...relevantJournal.map((decision) => ({
        id: decision.id,
        title: decision.subject,
        type: "journal",
        preview: conciseText(decision.outcome.lesson || decision.prePurchase.thesis, 160),
        score: decision.score
      }))
    ];

  if (llmEnabled()) {
    try {
      const completion = await generateJarvisLlmAnswer({
        query,
        session,
        dealCard,
        financialProfile,
        references: promptReferences,
        beliefs: topBeliefs,
        decisions: topDecisions,
        memories: relevantMemories,
        journal: relevantJournal,
        marketIntelligence,
        fallbackAnswer
      });
      return { answer: completion.text, sources, mode: "llm", provider: completion.provider, model: completion.model, retrievalMode: evidenceResult.mode };
    } catch (error) {
      console.warn(`Apex Analytic LLM fallback: ${error.message}`);
    }
  }

  return { answer: fallbackAnswer, sources, mode: "framework", retrievalMode: evidenceResult.mode };
}

async function readBody(req) {
  const chunks = [];
  let totalBytes = 0;
  for await (const chunk of req) {
    totalBytes += chunk.length;
    if (totalBytes > MAX_JSON_BODY_BYTES) {
      const error = new Error("Request body is too large.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("Invalid JSON request body.");
    error.statusCode = 400;
    throw error;
  }
}

function send(res, status, payload, headers = jsonHeaders) {
  res.writeHead(status, headers);
  if (Buffer.isBuffer(payload)) return res.end(payload);
  res.end(typeof payload === "string" ? payload : JSON.stringify(payload));
}

function isPublicApiRoute(method, pathname) {
  return (
    (method === "GET" && pathname === "/api/health")
    || (method === "GET" && pathname === "/api/auth/me")
    || (method === "POST" && pathname === "/api/auth/register")
    || (method === "POST" && pathname === "/api/auth/login")
    || (method === "POST" && pathname === "/api/auth/logout")
    || (method === "POST" && pathname === "/api/auth/request-verification")
    || (method === "POST" && pathname === "/api/auth/verify-email")
    || (method === "POST" && pathname === "/api/auth/forgot-password")
    || (method === "POST" && pathname === "/api/auth/reset-password")
    || (method === "GET" && pathname === "/api/billing/plans")
    || (method === "GET" && pathname === "/api/billing/status")
    || (method === "POST" && pathname === "/api/billing/checkout")
    || (method === "POST" && pathname === "/api/billing/webhook")
    || (method === "GET" && pathname === "/api/reports")
    || (method === "GET" && pathname.startsWith("/api/reports/"))
    || (method === "DELETE" && pathname.startsWith("/api/reports/"))
    || (["GET", "POST"].includes(method) && pathname === "/api/journal")
    || (["GET", "PATCH", "DELETE"].includes(method) && pathname.startsWith("/api/journal/"))
    || (["GET", "POST"].includes(method) && pathname === "/api/memory")
    || (["PATCH", "DELETE"].includes(method) && pathname.startsWith("/api/memory/"))
    || (method === "GET" && pathname === "/api/jarvis/status")
    || (method === "GET" && pathname === "/api/jarvis/sessions")
    || (method === "POST" && pathname === "/api/jarvis/sessions")
    || (method === "GET" && pathname.startsWith("/api/jarvis/sessions/"))
    || (method === "DELETE" && pathname.startsWith("/api/jarvis/sessions/"))
    || (method === "POST" && pathname === "/api/jarvis/analyze-deal")
    || (method === "POST" && pathname === "/api/jarvis/query")
    || (method === "POST" && pathname === "/api/jarvis/transcribe")
    || (method === "POST" && pathname === "/api/jarvis/speech")
  );
}

function isOwnerRequest(req) {
  const tokenHeader = req.headers["x-estatelab-owner-token"];
  const token = Array.isArray(tokenHeader) ? tokenHeader[0] : tokenHeader;
  return Boolean(OWNER_TOKEN && token && token === OWNER_TOKEN);
}

async function serveStatic(req, res) {
  const rawPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const safePath = rawPath === "/" ? "/index.html" : rawPath;
  const filePath = path.normalize(path.join(PUBLIC_DIR, safePath));
  if (!filePath.startsWith(PUBLIC_DIR)) return send(res, 403, "Forbidden", { "Content-Type": "text/plain" });
  try {
    const content = await readFile(filePath);
    send(res, 200, content, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
  } catch {
    send(res, 404, "Not found", { "Content-Type": "text/plain" });
  }
}

async function router(req, res) {
  const url = new URL(req.url, "http://localhost");
  if (!url.pathname.startsWith("/api/")) return serveStatic(req, res);

  if (!isPublicApiRoute(req.method, url.pathname) && !isOwnerRequest(req)) {
    return send(res, 403, {
      error: OWNER_TOKEN
        ? "Owner API access requires x-estatelab-owner-token."
        : "Owner API is disabled until ESTATELAB_OWNER_TOKEN is set on the server."
    });
  }

  const publicRoute = isPublicApiRoute(req.method, url.pathname);
  if (publicRoute && url.pathname.startsWith("/api/jarvis/") && !allowRequest(req, "jarvis", 40, 10 * 60 * 1000)) {
    return send(res, 429, { error: "Apex Analytic has received too many requests from this connection. Pause briefly and try again." }, { ...jsonHeaders, "Retry-After": "600" });
  }
  if (publicRoute && ["/api/jarvis/transcribe", "/api/jarvis/speech"].includes(url.pathname) && !allowRequest(req, "audio", 16, 10 * 60 * 1000)) {
    return send(res, 429, { error: "Voice usage is temporarily limited. Try again shortly." }, { ...jsonHeaders, "Retry-After": "600" });
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    return send(res, 200, {
      status: "ok",
      app: "apex-analytic",
      storage: stateStore.kind,
      time: new Date().toISOString()
    });
  }

  let db = await readDb();
  const requiresAuthMigration = Number(db.auth?.version || 0) < 1;
  db.properties ||= [];
  db.comps ||= [];
  db.brain = normalizeBrain(db.brain);
  db.knowledge = normalizeKnowledge(db.knowledge);
  db.jarvis = normalizeJarvis(db.jarvis);
  db.auth = normalizeAuth(db.auth);
  if (requiresAuthMigration) {
    db.jarvis = emptyJarvis();
    await writeDb(db);
    db = await readDb();
  }
  const actor = currentAuth(req, db);

  if (req.method === "GET" && url.pathname === "/api/auth/me") {
    return send(res, 200, {
      authenticated: Boolean(actor.user),
      user: actor.user ? publicUser(actor.user) : null
    });
  }

  if (req.method === "POST" && url.pathname === "/api/auth/register") {
    if (!allowAuthAttempt(req)) return send(res, 429, { error: "Too many account attempts. Try again later." });
    const body = await readBody(req);
    const email = normalizeEmail(body.email);
    const displayName = String(body.displayName || "").trim();
    const password = String(body.password || "");
    if (!validEmail(email)) return send(res, 400, { error: "Enter a valid email address." });
    if (displayName.length < 2 || displayName.length > 60) {
      return send(res, 400, { error: "Name must be between 2 and 60 characters." });
    }
    if (password.length < 10 || password.length > 128) {
      return send(res, 400, { error: "Password must be between 10 and 128 characters." });
    }
    if (db.auth.users.some((user) => user.email === email)) {
      return send(res, 409, { error: "An account already exists for this email." });
    }

    const user = {
      id: randomUUID(),
      email,
      displayName,
      passwordHash: await hashPassword(password),
      role: "member",
      memory: normalizeUserMemory(),
      billing: normalizeUserBilling(),
      reports: normalizeUserReports(),
      journal: normalizeUserJournal(),
      emailVerifiedAt: "",
      disabledAt: "",
      createdAt: new Date().toISOString()
    };
    const authSession = createAuthSession(user.id);
    const verification = createOneTimeToken(user.id, "email-verification", 24 * 60);
    db.auth.users.push(user);
    db.auth.sessions.unshift(authSession.record);
    db.auth = replaceAuthToken(db.auth, verification.record);
    await writeDb(db);
    deliverAuthToken(user, verification.record.purpose, verification.token, verification.record.expiresAt)
      .catch((error) => console.warn(`Apex Analytic verification delivery: ${error.message}`));
    clearAuthAttempts(req);
    return send(res, 201, {
      authenticated: true,
      user: publicUser(user),
      verificationPending: true,
      ...debugTokenPayload("email-verification", verification.token)
    }, {
      ...jsonHeaders,
      "Set-Cookie": authCookie(req, authSession.token, authSession.maxAgeSeconds)
    });
  }

  if (req.method === "POST" && url.pathname === "/api/auth/login") {
    if (!allowAuthAttempt(req)) return send(res, 429, { error: "Too many account attempts. Try again later." });
    const body = await readBody(req);
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");
    const user = db.auth.users.find((item) => item.email === email);
    let passwordMatches = false;
    if (user) {
      passwordMatches = await verifyPassword(password, user.passwordHash);
    } else {
      await scrypt(password || "invalid", "estatelab-login-check", 64);
    }
    if (!user || !passwordMatches) return send(res, 401, { error: "Email or password is incorrect." });
    if (user.disabledAt) return send(res, 403, { error: "This account has been disabled." });
    if (REQUIRE_EMAIL_VERIFICATION && !user.emailVerifiedAt) {
      return send(res, 403, { error: "Verify your email before signing in." });
    }

    const authSession = createAuthSession(user.id);
    db.auth.sessions.unshift(authSession.record);
    await writeDb(db);
    clearAuthAttempts(req);
    return send(res, 200, {
      authenticated: true,
      user: publicUser(user)
    }, {
      ...jsonHeaders,
      "Set-Cookie": authCookie(req, authSession.token, authSession.maxAgeSeconds)
    });
  }

  if (req.method === "POST" && url.pathname === "/api/auth/logout") {
    if (actor.session) {
      db.auth.sessions = db.auth.sessions.filter((session) => session.tokenHash !== actor.session.tokenHash);
      await writeDb(db);
    }
    return send(res, 200, { authenticated: false, user: null }, {
      ...jsonHeaders,
      "Set-Cookie": authCookie(req, "", 0)
    });
  }

  if (req.method === "POST" && url.pathname === "/api/auth/request-verification") {
    if (!allowAuthAttempt(req)) return send(res, 429, { error: "Too many account attempts. Try again later." });
    if (!actor.user) return send(res, 401, { error: "Sign in before requesting verification." });
    if (actor.user.emailVerifiedAt) return send(res, 200, { sent: false, alreadyVerified: true });
    const verification = createOneTimeToken(actor.user.id, "email-verification", 24 * 60);
    db.auth = replaceAuthToken(db.auth, verification.record);
    await writeDb(db);
    const delivered = await deliverAuthToken(actor.user, verification.record.purpose, verification.token, verification.record.expiresAt)
      .catch((error) => {
        console.warn(`Apex Analytic verification delivery: ${error.message}`);
        return false;
      });
    return send(res, 200, {
      sent: delivered,
      alreadyVerified: false,
      ...debugTokenPayload("email-verification", verification.token)
    });
  }

  if (req.method === "POST" && url.pathname === "/api/auth/verify-email") {
    if (!allowAuthAttempt(req)) return send(res, 429, { error: "Too many account attempts. Try again later." });
    const body = await readBody(req);
    const tokenHash = hashAuthToken(body.token);
    const token = db.auth.tokens.find((item) => item.tokenHash === tokenHash && item.purpose === "email-verification");
    const user = token ? db.auth.users.find((item) => item.id === token.userId) : null;
    if (!token || !user) return send(res, 400, { error: "This verification token is invalid or expired." });
    user.emailVerifiedAt = new Date().toISOString();
    db.auth.tokens = db.auth.tokens.filter((item) => item.tokenHash !== tokenHash);
    await writeDb(db);
    clearAuthAttempts(req);
    return send(res, 200, { verified: true, user: publicUser(user) });
  }

  if (req.method === "POST" && url.pathname === "/api/auth/forgot-password") {
    if (!allowAuthAttempt(req)) return send(res, 429, { error: "Too many account attempts. Try again later." });
    const body = await readBody(req);
    const user = db.auth.users.find((item) => item.email === normalizeEmail(body.email) && !item.disabledAt);
    let debug = {};
    if (user) {
      const reset = createOneTimeToken(user.id, "password-reset", 60);
      db.auth = replaceAuthToken(db.auth, reset.record);
      await writeDb(db);
      deliverAuthToken(user, reset.record.purpose, reset.token, reset.record.expiresAt)
        .catch((error) => console.warn(`Apex Analytic reset delivery: ${error.message}`));
      debug = debugTokenPayload("password-reset", reset.token);
    }
    return send(res, 200, {
      accepted: true,
      message: "If that account exists, password reset instructions have been sent.",
      ...debug
    });
  }

  if (req.method === "POST" && url.pathname === "/api/auth/reset-password") {
    if (!allowAuthAttempt(req)) return send(res, 429, { error: "Too many account attempts. Try again later." });
    const body = await readBody(req);
    const password = String(body.password || "");
    if (password.length < 10 || password.length > 128) {
      return send(res, 400, { error: "Password must be between 10 and 128 characters." });
    }
    const tokenHash = hashAuthToken(body.token);
    const token = db.auth.tokens.find((item) => item.tokenHash === tokenHash && item.purpose === "password-reset");
    const user = token ? db.auth.users.find((item) => item.id === token.userId && !item.disabledAt) : null;
    if (!token || !user) return send(res, 400, { error: "This reset token is invalid or expired." });
    user.passwordHash = await hashPassword(password);
    db.auth.tokens = db.auth.tokens.filter((item) => item.userId !== user.id);
    db.auth.sessions = db.auth.sessions.filter((session) => session.userId !== user.id);
    await writeDb(db);
    clearAuthAttempts(req);
    return send(res, 200, { reset: true });
  }

  if (req.method === "GET" && url.pathname === "/api/billing/plans") {
    return send(res, 200, {
      plans: Object.values(BILLING_PLANS).map(publicPlan),
      enforcementEnabled: BILLING_ENFORCEMENT
    });
  }

  if (req.method === "GET" && url.pathname === "/api/billing/status") {
    if (!actor.user) return send(res, 401, { error: "Sign in to view your plan and report usage." });
    return send(res, 200, publicBillingStatus(actor.user));
  }

  if (req.method === "POST" && url.pathname === "/api/billing/checkout") {
    if (!actor.user) return send(res, 401, { error: "Sign in before upgrading your plan." });
    const body = await readBody(req);
    const planId = String(body.plan || "").toLowerCase();
    if (!["pro", "advisor"].includes(planId)) return send(res, 400, { error: "Choose the Pro or Advisor plan." });
    const checkoutUrl = checkoutUrlFor(planId, actor.user);
    if (!checkoutUrl) {
      return send(res, 503, { error: "Checkout is not connected yet. Configure the checkout URL for this plan first." });
    }
    return send(res, 200, { plan: publicPlan(BILLING_PLANS[planId]), checkoutUrl });
  }

  if (req.method === "POST" && url.pathname === "/api/billing/webhook") {
    if (!BILLING_WEBHOOK_SECRET) return send(res, 503, { error: "Billing webhook is not configured." });
    if (!billingWebhookAuthorized(req)) return send(res, 401, { error: "Billing webhook authorization failed." });
    const body = await readBody(req);
    const eventId = reportText(body.eventId, 160);
    const planId = String(body.plan || "").toLowerCase();
    const status = String(body.status || "active").toLowerCase();
    if (!eventId) return send(res, 400, { error: "Billing eventId is required for idempotency." });
    if (!BILLING_PLANS[planId]) return send(res, 400, { error: "Unknown billing plan." });
    if (!["active", "trialing", "past_due", "canceled"].includes(status)) return send(res, 400, { error: "Unknown billing status." });
    const user = db.auth.users.find((item) => item.id === String(body.userId || "") || item.email === normalizeEmail(body.email));
    if (!user) return send(res, 404, { error: "Billing user was not found." });
    user.billing = normalizeUserBilling(user.billing);
    if (user.billing.processedEvents.includes(eventId)) {
      return send(res, 200, { accepted: true, duplicate: true, billing: publicBillingStatus(user) });
    }
    user.billing.plan = planId;
    user.billing.status = status;
    if (body.externalCustomerId !== undefined) user.billing.externalCustomerId = reportText(body.externalCustomerId, 160);
    if (body.externalSubscriptionId !== undefined) user.billing.externalSubscriptionId = reportText(body.externalSubscriptionId, 160);
    const creditsDelta = Math.max(-10000, Math.min(10000, Math.floor(Number(body.creditsDelta || 0))));
    user.billing.reportCredits = Math.max(0, user.billing.reportCredits + creditsDelta);
    user.billing.processedEvents.push(eventId);
    user.billing.processedEvents = user.billing.processedEvents.slice(-100);
    user.billing.updatedAt = new Date().toISOString();
    await writeDb(db);
    return send(res, 200, { accepted: true, duplicate: false, billing: publicBillingStatus(user) });
  }

  if (req.method === "GET" && url.pathname === "/api/reports") {
    if (!actor.user) return send(res, 401, { error: "Sign in to view private deal reports." });
    actor.user.reports = normalizeUserReports(actor.user.reports);
    return send(res, 200, {
      reports: actor.user.reports.items.map(publicReportSummary),
      billing: publicBillingStatus(actor.user)
    });
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/reports/")) {
    if (!actor.user) return send(res, 401, { error: "Sign in to view private deal reports." });
    const id = url.pathname.split("/").pop();
    actor.user.reports = normalizeUserReports(actor.user.reports);
    const report = actor.user.reports.items.find((item) => item.id === id);
    if (!report) return send(res, 404, { error: "Deal report not found." });
    return send(res, 200, { report, billing: publicBillingStatus(actor.user) });
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/reports/")) {
    if (!actor.user) return send(res, 401, { error: "Sign in to manage private deal reports." });
    const id = url.pathname.split("/").pop();
    actor.user.reports = normalizeUserReports(actor.user.reports);
    const nextItems = actor.user.reports.items.filter((item) => item.id !== id);
    if (nextItems.length === actor.user.reports.items.length) return send(res, 404, { error: "Deal report not found." });
    actor.user.reports.items = nextItems;
    await writeDb(db);
    return send(res, 204, "");
  }

  if (req.method === "GET" && url.pathname === "/api/journal") {
    if (!actor.user) return send(res, 401, { error: "Sign in to use your private decision journal." });
    actor.user.journal = normalizeUserJournal(actor.user.journal);
    return send(res, 200, {
      decisions: actor.user.journal.items.map(publicJournalSummary),
      summary: journalCollectionSummary(actor.user.journal)
    });
  }

  if (req.method === "POST" && url.pathname === "/api/journal") {
    if (!actor.user) return send(res, 401, { error: "Sign in to record a private decision." });
    const body = await readBody(req);
    const reportId = String(body.reportId || "");
    actor.user.reports = normalizeUserReports(actor.user.reports);
    actor.user.journal = normalizeUserJournal(actor.user.journal);
    const report = actor.user.reports.items.find((item) => item.id === reportId);
    if (!report) return send(res, 404, { error: "Create or open a saved Deal Report before recording a decision." });
    const existing = actor.user.journal.items.find((item) => item.reportId === reportId);
    if (existing) return send(res, 200, { decision: existing, existing: true, summary: journalCollectionSummary(actor.user.journal) });
    const deal = report.analysis.context.dealCard || {};
    const profile = report.analysis.context.financialProfile || {};
    const now = new Date().toISOString();
    const decision = normalizeJournalEntry({
      id: randomUUID(),
      reportId,
      subject: report.subject,
      createdAt: now,
      updatedAt: now,
      prePurchase: {
        decision: body.decision || "investigate",
        thesis: body.thesis || deal.investmentThesis,
        counterThesis: body.counterThesis || report.analysis.counterThesis,
        killCriterion: body.killCriterion || deal.killCriterion,
        holdingPeriod: body.holdingPeriod || profile.holdingPeriod,
        confidence: body.confidence ?? report.analysis.confidence,
        notes: body.notes || ""
      },
      outcome: { status: "not_reviewed" },
      snapshot: report.analysis
    });
    actor.user.journal.items.unshift(decision);
    actor.user.journal = normalizeUserJournal(actor.user.journal);
    await writeDb(db);
    return send(res, 201, { decision, existing: false, summary: journalCollectionSummary(actor.user.journal) });
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/journal/")) {
    if (!actor.user) return send(res, 401, { error: "Sign in to view your private decision journal." });
    const id = url.pathname.split("/").pop();
    actor.user.journal = normalizeUserJournal(actor.user.journal);
    const decision = actor.user.journal.items.find((item) => item.id === id);
    if (!decision) return send(res, 404, { error: "Decision record not found." });
    return send(res, 200, { decision, summary: publicJournalSummary(decision) });
  }

  if (req.method === "PATCH" && url.pathname.startsWith("/api/journal/")) {
    if (!actor.user) return send(res, 401, { error: "Sign in to update your private decision journal." });
    const id = url.pathname.split("/").pop();
    const body = await readBody(req);
    actor.user.journal = normalizeUserJournal(actor.user.journal);
    const decision = actor.user.journal.items.find((item) => item.id === id);
    if (!decision) return send(res, 404, { error: "Decision record not found." });
    const action = String(body.action || "update");
    if (action === "update") {
      if (decision.lockedAt) return send(res, 409, { error: "This pre-purchase thesis is locked and cannot be rewritten after the fact." });
      if (body.decision !== undefined) decision.prePurchase.decision = body.decision;
      if (body.thesis !== undefined) decision.prePurchase.thesis = reportText(body.thesis, 2000);
      if (body.counterThesis !== undefined) decision.prePurchase.counterThesis = reportText(body.counterThesis, 2000);
      if (body.killCriterion !== undefined) decision.prePurchase.killCriterion = reportText(body.killCriterion, 1200);
      if (body.holdingPeriod !== undefined) decision.prePurchase.holdingPeriod = reportText(body.holdingPeriod, 120);
      if (body.confidence !== undefined) decision.prePurchase.confidence = Math.max(0, Math.min(100, Math.round(Number(body.confidence || 0))));
      if (body.notes !== undefined) decision.prePurchase.notes = reportText(body.notes, 2000);
    } else if (action === "lock") {
      if (decision.lockedAt) return send(res, 200, { decision, summary: publicJournalSummary(decision) });
      if (decision.prePurchase.thesis.length < 8 || decision.prePurchase.counterThesis.length < 8 || decision.prePurchase.killCriterion.length < 8) {
        return send(res, 400, { error: "Record a thesis, counter-thesis, and kill criterion before locking the decision." });
      }
      decision.lockedAt = new Date().toISOString();
    } else if (action === "review") {
      if (!decision.lockedAt) return send(res, 409, { error: "Lock the pre-purchase thesis before recording an outcome review." });
      const outcomeStatus = String(body.outcomeStatus || "");
      if (!["abandoned", "holding", "sold"].includes(outcomeStatus)) return send(res, 400, { error: "Choose abandoned, holding, or sold for the outcome status." });
      const requiredScores = [body.processScore, body.executionScore, body.outcomeScore, body.luckScore];
      if (requiredScores.some((score) => score === "" || score === undefined || !Number.isFinite(Number(score)))) {
        return send(res, 400, { error: "Score process, execution, outcome, and luck before saving the review." });
      }
      if (reportText(body.result, 2000).length < 8 || reportText(body.lesson, 2000).length < 8) {
        return send(res, 400, { error: "Record both what happened and the lesson before saving the review." });
      }
      decision.outcome = {
        status: outcomeStatus,
        actualRent: reportText(body.actualRent, 120),
        currentValue: reportText(body.currentValue, 120),
        result: reportText(body.result, 2000),
        lesson: reportText(body.lesson, 2000),
        processScore: optionalJournalScore(body.processScore),
        executionScore: optionalJournalScore(body.executionScore),
        outcomeScore: optionalJournalScore(body.outcomeScore),
        luckScore: optionalJournalScore(body.luckScore),
        reviewedAt: new Date().toISOString()
      };
    } else {
      return send(res, 400, { error: "Unknown decision-journal action." });
    }
    decision.updatedAt = new Date().toISOString();
    actor.user.journal = normalizeUserJournal(actor.user.journal);
    const updated = actor.user.journal.items.find((item) => item.id === id);
    await writeDb(db);
    return send(res, 200, { decision: updated, summary: publicJournalSummary(updated), collection: journalCollectionSummary(actor.user.journal) });
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/journal/")) {
    if (!actor.user) return send(res, 401, { error: "Sign in to manage your private decision journal." });
    const id = url.pathname.split("/").pop();
    actor.user.journal = normalizeUserJournal(actor.user.journal);
    const decision = actor.user.journal.items.find((item) => item.id === id);
    if (!decision) return send(res, 404, { error: "Decision record not found." });
    if (decision.lockedAt) return send(res, 409, { error: "Locked decisions are retained to preserve the audit trail." });
    actor.user.journal.items = actor.user.journal.items.filter((item) => item.id !== id);
    await writeDb(db);
    return send(res, 204, "");
  }

  if (req.method === "GET" && url.pathname === "/api/memory") {
    if (!actor.user) return send(res, 401, { error: "Sign in to use long-term memory." });
    actor.user.memory = normalizeUserMemory(actor.user.memory);
    const items = actor.user.memory.items
      .filter((item) => item.status !== "dismissed")
      .map(publicMemoryItem);
    return send(res, 200, { items, summary: memorySummary(actor.user.memory) });
  }

  if (req.method === "POST" && url.pathname === "/api/memory") {
    if (!actor.user) return send(res, 401, { error: "Sign in to use long-term memory." });
    const body = await readBody(req);
    const content = String(body.content || "").replace(/\s+/g, " ").trim().slice(0, 500);
    if (content.length < 8) return send(res, 400, { error: "Memory must contain at least 8 characters." });
    actor.user.memory = normalizeUserMemory(actor.user.memory);
    const duplicate = actor.user.memory.items.find((item) => item.content.toLowerCase() === content.toLowerCase());
    if (duplicate) return send(res, 409, { error: "This memory already exists.", item: publicMemoryItem(duplicate) });
    const now = new Date().toISOString();
    const item = {
      id: randomUUID(),
      category: memoryCategory(body.category || content),
      content,
      status: "pending",
      sourceMessageId: "manual",
      createdAt: now,
      updatedAt: now,
      reviewedAt: ""
    };
    actor.user.memory.items.unshift(item);
    actor.user.memory = normalizeUserMemory(actor.user.memory);
    await writeDb(db);
    return send(res, 201, { item: publicMemoryItem(item), summary: memorySummary(actor.user.memory) });
  }

  if (req.method === "PATCH" && url.pathname.startsWith("/api/memory/")) {
    if (!actor.user) return send(res, 401, { error: "Sign in to use long-term memory." });
    const id = url.pathname.split("/").pop();
    const body = await readBody(req);
    actor.user.memory = normalizeUserMemory(actor.user.memory);
    const item = actor.user.memory.items.find((entry) => entry.id === id);
    if (!item) return send(res, 404, { error: "Memory not found." });
    if (!["approve", "dismiss"].includes(body.action)) return send(res, 400, { error: "Memory action must be approve or dismiss." });
    const now = new Date().toISOString();
    item.status = body.action === "approve" ? "approved" : "dismissed";
    item.updatedAt = now;
    item.reviewedAt = now;
    await writeDb(db);
    return send(res, 200, { item: publicMemoryItem(item), summary: memorySummary(actor.user.memory) });
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/memory/")) {
    if (!actor.user) return send(res, 401, { error: "Sign in to use long-term memory." });
    const id = url.pathname.split("/").pop();
    actor.user.memory = normalizeUserMemory(actor.user.memory);
    const nextItems = actor.user.memory.items.filter((item) => item.id !== id);
    if (nextItems.length === actor.user.memory.items.length) return send(res, 404, { error: "Memory not found." });
    actor.user.memory.items = nextItems;
    await writeDb(db);
    return send(res, 204, "");
  }

  if (req.method === "GET" && url.pathname === "/api/jarvis/status") {
    const corpus = await readJson(RAG_PATH, []);
    return send(res, 200, {
      status: "online",
      mode: "public-apex",
      storage: stateStore.kind,
      knowledge: {
        references: Array.isArray(corpus) ? corpus.length : 0,
        ownerDocuments: db.knowledge.documents.length,
        indexedChunks: db.knowledge.chunks.length,
        trackedProjects: db.knowledge.projects.length,
        marketObservations: db.knowledge.observations.length,
        activeBeliefs: db.brain.beliefs.filter((belief) => belief.status !== "retired").length,
        decisions: db.brain.decisions.length
      },
      llm: {
        enabled: llmEnabled(),
        provider: llmEnabled() ? LLM_PROVIDER : null,
        configuredModel: llmEnabled() ? LLM_MODEL : null,
        resolvedModel: llmEnabled() ? llmRuntime.resolvedModel || null : null,
        lastUsedAt: llmEnabled() ? llmRuntime.lastUsedAt || null : null
      },
      audio: {
        serverStt: knowledgeService.audioEnabled(),
        serverTts: knowledgeService.audioEnabled()
      },
      accounts: {
        emailDelivery: Boolean(EMAIL_WEBHOOK_URL),
        verificationRequired: REQUIRE_EMAIL_VERIFICATION,
        reviewedLongTermMemory: true
      },
      boundary: "Public chats are stored as conversation sessions only. They do not update the owner knowledge base."
    });
  }

  if (req.method === "POST" && url.pathname === "/api/jarvis/transcribe") {
    if (!knowledgeService.audioEnabled()) return send(res, 503, { error: "Server voice is not configured." });
    const body = await readBody(req);
    const audio = Buffer.from(String(body.audioBase64 || ""), "base64");
    if (!audio.length || audio.length > MAX_DOCUMENT_BYTES) return send(res, 400, { error: "Voice recording is missing or too large." });
    const text = await knowledgeService.transcribe(audio, String(body.mimeType || "audio/webm"), String(body.filename || "voice.webm"));
    if (!text) return send(res, 422, { error: "No speech could be transcribed." });
    return send(res, 200, { text });
  }

  if (req.method === "POST" && url.pathname === "/api/jarvis/speech") {
    if (!knowledgeService.audioEnabled()) return send(res, 503, { error: "Server voice is not configured." });
    const body = await readBody(req);
    const text = String(body.text || "").trim();
    if (!text || text.length > 4000) return send(res, 400, { error: "Speech text must be between 1 and 4000 characters." });
    const audio = await knowledgeService.synthesize(text, String(body.voice || OPENAI_SPEECH_VOICE));
    return send(res, 200, audio, { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" });
  }

  if (req.method === "POST" && url.pathname === "/api/jarvis/sessions") {
    const body = await readBody(req);
    const session = createJarvisSession({ ...body, clientId: requestClientId(req, body) || body.clientId }, actor.user);
    db.jarvis = upsertJarvisSession(db.jarvis, session);
    await writeDb(db);
    return send(res, 201, { session: publicJarvisSession(session) });
  }

  if (req.method === "GET" && url.pathname === "/api/jarvis/sessions") {
    const clientId = requestClientId(req);
    const sessions = db.jarvis.sessions
      .filter((session) => canAccessJarvisSession(session, actor, clientId))
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
      .slice(0, 20)
      .map(publicJarvisSessionSummary);
    return send(res, 200, { sessions });
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/jarvis/sessions/")) {
    const id = url.pathname.split("/").pop();
    const clientId = requestClientId(req);
    const session = accessibleJarvisSession(db, id, actor, clientId);
    if (!session) return send(res, 404, { error: "Conversation session not found." });
    const shouldClaim = Boolean(actor.user && !session.userId && session.clientId === clientId);
    claimJarvisSession(session, actor, clientId);
    if (shouldClaim) {
      db.jarvis = upsertJarvisSession(db.jarvis, session);
      await writeDb(db);
    }
    return send(res, 200, { session: publicJarvisSession(session) });
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/jarvis/sessions/")) {
    const id = url.pathname.split("/").pop();
    const session = accessibleJarvisSession(db, id, actor, requestClientId(req));
    if (!session) return send(res, 404, { error: "Conversation session not found." });
    db.jarvis.sessions = db.jarvis.sessions.filter((item) => item.id !== id);
    await writeDb(db);
    return send(res, 204, "");
  }

  if (req.method === "POST" && url.pathname === "/api/jarvis/analyze-deal") {
    const body = await readBody(req);
    const dealCard = cleanContextRecord(body.dealCard, dealContextLabels);
    const financialProfile = cleanContextRecord(body.financialProfile, profileContextLabels);
    if (!dealCard.askingPrice || (!dealCard.area && !dealCard.projectName)) {
      return send(res, 400, { error: "Add an asking price and an area or project before running the deal analysis." });
    }
    if (BILLING_ENFORCEMENT && !actor.user) {
      return send(res, 401, { code: "SIGN_IN_REQUIRED", error: "Sign in to create and save an Apex Deal Report." });
    }
    if (!canCreateDealReport(actor.user)) {
      return send(res, 402, {
        code: "REPORT_LIMIT_REACHED",
        error: "Your monthly deal-report allowance is used. Upgrade your plan or add report credits to continue.",
        billing: publicBillingStatus(actor.user)
      });
    }

    const clientId = requestClientId(req, body);
    let session = accessibleJarvisSession(db, body.sessionId, actor, clientId);
    if (!session) session = createJarvisSession({ clientId }, actor.user);
    claimJarvisSession(session, actor, clientId);
    const subject = dealCard.projectName || dealCard.area || "property deal";
    if (!session.messages.length || defaultSessionTitle(session.title)) session.title = `Deal analysis: ${subject}`;
    const analysis = analyzeSevenStageDeal(dealCard, financialProfile);
    analysis.marketIntelligence = selectMarketIntelligence(`${subject} ${JSON.stringify(dealCard)}`, db.knowledge, 8);
    const marketStage = analysis.stages.find((stage) => stage.number === 6);
    if (marketStage && analysis.marketIntelligence.observations.length) {
      marketStage.summary = `${analysis.marketIntelligence.summary.matched} owner market observation${analysis.marketIntelligence.summary.matched === 1 ? " matches" : "s match"} this deal. ${analysis.marketIntelligence.summary.warning}`;
    }
    const sources = [
      ...marketSources(analysis.marketIntelligence),
      ...await dealAnalysisSources()
    ].slice(0, 12);
    let mode = "framework";
    let completion = null;
    if (llmEnabled()) {
      try {
        const dealMemories = selectRelevantUserMemories(
          approvedUserMemories(actor.user),
          `${subject} ${JSON.stringify(dealCard)} ${JSON.stringify(financialProfile)}`
        );
        completion = await generateDealLlmCommentary(analysis, dealCard, financialProfile, dealMemories);
        analysis.aiCommentary = completion.text;
        analysis.voiceSummary = analysis.aiCommentary;
        mode = "llm";
      } catch (error) {
        console.warn(`Deal analysis LLM fallback: ${error.message}`);
      }
    }
    const now = new Date().toISOString();
    session.messages.push({
      id: randomUUID(),
      role: "user",
      content: `Run the seven-stage Apex Analytic assessment for ${subject}.`,
      createdAt: now,
      sources: []
    });
    const jarvisMessage = {
      id: randomUUID(),
      role: "jarvis",
      content: dealAnalysisText(analysis),
      createdAt: new Date().toISOString(),
      mode,
      provider: mode === "llm" ? completion.provider : "",
      model: mode === "llm" ? completion.model : "",
      sources
    };
    session.messages.push(jarvisMessage);
    session.updatedAt = jarvisMessage.createdAt;
    session.messages = session.messages.slice(-80);
    db.jarvis = upsertJarvisSession(db.jarvis, session);
    const billing = actor.user ? consumeDealReport(actor.user) : null;
    const savedReport = actor.user ? saveDealReport(actor.user, subject, analysis) : null;
    await writeDb(db);
    return send(res, 200, {
      analysis,
      sources,
      mode,
      provider: mode === "llm" ? completion.provider : null,
      model: mode === "llm" ? completion.model : null,
      billing,
      savedReport: savedReport ? publicReportSummary(savedReport) : null,
      message: jarvisMessage,
      session: publicJarvisSession(session)
    });
  }

  if (req.method === "GET" && url.pathname === "/api/owner/documents") {
    return send(res, 200, {
      documents: db.knowledge.documents.slice().sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))),
      summary: {
        documents: db.knowledge.documents.length,
        indexed: db.knowledge.documents.filter((document) => document.status === "indexed").length,
        chunks: db.knowledge.chunks.length,
        embeddingProvider: knowledgeService.embeddingsEnabled() ? "openai" : null
      }
    });
  }

  if (req.method === "POST" && url.pathname === "/api/owner/documents") {
    const body = await readBody(req);
    const title = String(body.title || "").trim();
    const filename = String(body.filename || "evidence.txt").trim();
    const mimeType = String(body.mimeType || "text/plain").trim();
    if (!title || title.length > 160) return send(res, 400, { error: "Document title must be between 1 and 160 characters." });
    let content;
    if (String(body.contentBase64 || "")) content = Buffer.from(String(body.contentBase64), "base64");
    else content = Buffer.from(String(body.text || ""), "utf8");
    if (!content.length) return send(res, 400, { error: "Document content is required." });
    if (content.length > MAX_DOCUMENT_BYTES) return send(res, 413, { error: "Documents are limited to 5 MB." });
    const checksum = createHash("sha256").update(content).digest("hex");
    if (db.knowledge.documents.some((document) => document.checksum === checksum)) {
      return send(res, 409, { error: "This evidence file has already been uploaded." });
    }

    const id = randomUUID();
    const storageKey = await knowledgeService.storeObject(id, filename, content);
    const extracted = knowledgeService.extractText(content, mimeType, filename);
    const indexed = await knowledgeService.indexText(id, extracted);
    const now = new Date().toISOString();
    const document = {
      id,
      title,
      filename,
      mimeType,
      storageKey,
      checksum,
      sourceUrl: String(body.sourceUrl || "").trim().slice(0, 2000),
      tags: Array.isArray(body.tags) ? body.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 20) : [],
      status: indexed.chunks.length ? "indexed" : "stored",
      indexMode: indexed.mode,
      chunkCount: indexed.chunks.length,
      createdAt: now,
      updatedAt: now
    };
    db.knowledge.documents.push(document);
    db.knowledge.chunks.push(...indexed.chunks);
    db.knowledge = normalizeKnowledge(db.knowledge);
    await writeDb(db);
    return send(res, 201, {
      document,
      note: document.status === "stored" ? "The original file is stored, but this format needs text extraction before Apex Analytic can retrieve it." : "Evidence indexed for Apex Analytic retrieval."
    });
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/owner/documents/")) {
    const id = url.pathname.split("/").pop();
    const document = db.knowledge.documents.find((item) => item.id === id);
    if (!document) return send(res, 404, { error: "Evidence document not found." });
    db.knowledge.documents = db.knowledge.documents.filter((item) => item.id !== id);
    db.knowledge.chunks = db.knowledge.chunks.filter((chunk) => chunk.documentId !== id);
    await writeDb(db);
    await knowledgeService.removeObject(id);
    return send(res, 204, "");
  }

  if (req.method === "GET" && url.pathname === "/api/owner/retrieval/metrics") {
    const events = db.knowledge.retrievalEvents;
    const sourceCounts = new Map();
    for (const event of events) {
      for (const sourceId of event.sourceIds) sourceCounts.set(sourceId, (sourceCounts.get(sourceId) || 0) + 1);
    }
    return send(res, 200, {
      totalQueries: events.length,
      modes: events.reduce((counts, event) => ({ ...counts, [event.mode]: (counts[event.mode] || 0) + 1 }), {}),
      averageLatencyMs: events.length ? Math.round(events.reduce((sum, event) => sum + event.latencyMs, 0) / events.length) : 0,
      topSources: [...sourceCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([id, hits]) => ({ id, hits })),
      recent: events.slice(-50).reverse()
    });
  }

  if (req.method === "GET" && url.pathname === "/api/owner/market/projects") {
    const query = String(url.searchParams.get("q") || "").trim().toLowerCase();
    const projects = db.knowledge.projects
      .filter((project) => !query || [project.name, project.area, project.state, project.developer, project.aliases.join(" ")].join(" ").toLowerCase().includes(query))
      .sort((left, right) => left.name.localeCompare(right.name));
    return send(res, 200, {
      projects: projects.map((project) => ({
        ...project,
        observationCount: db.knowledge.observations.filter((observation) => observation.projectId === project.id).length
      })),
      summary: { projects: projects.length, observations: db.knowledge.observations.length }
    });
  }

  if (req.method === "POST" && url.pathname === "/api/owner/market/projects") {
    const body = await readBody(req);
    const project = marketProjectFromInput(body);
    if (findMarketProject(db.knowledge, { name: project.name, area: project.area })) {
      return send(res, 409, { error: "A market project with this name and area already exists." });
    }
    db.knowledge.projects.push(project);
    db.knowledge = normalizeKnowledge(db.knowledge);
    await writeDb(db);
    return send(res, 201, { project });
  }

  if (req.method === "PATCH" && url.pathname.startsWith("/api/owner/market/projects/")) {
    const id = decodeURIComponent(url.pathname.split("/").pop());
    const index = db.knowledge.projects.findIndex((project) => project.id === id);
    if (index === -1) return send(res, 404, { error: "Market project not found." });
    const project = marketProjectFromInput(await readBody(req), db.knowledge.projects[index]);
    const duplicate = db.knowledge.projects.find((item) => item.id !== id && item.name.toLowerCase() === project.name.toLowerCase() && item.area.toLowerCase() === project.area.toLowerCase());
    if (duplicate) return send(res, 409, { error: "A market project with this name and area already exists." });
    db.knowledge.projects[index] = project;
    await writeDb(db);
    return send(res, 200, { project });
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/owner/market/projects/")) {
    const id = decodeURIComponent(url.pathname.split("/").pop());
    const project = db.knowledge.projects.find((item) => item.id === id);
    if (!project) return send(res, 404, { error: "Market project not found." });
    const linkedObservations = db.knowledge.observations.filter((observation) => observation.projectId === id).length;
    const cascade = String(url.searchParams.get("cascade") || "").toLowerCase() === "true";
    if (linkedObservations && !cascade) {
      return send(res, 409, { error: "This project still has linked observations. Use ?cascade=true only when those records should also be deleted.", linkedObservations });
    }
    db.knowledge.projects = db.knowledge.projects.filter((item) => item.id !== id);
    if (cascade) db.knowledge.observations = db.knowledge.observations.filter((observation) => observation.projectId !== id);
    await writeDb(db);
    return send(res, 200, { deleted: true, deletedObservations: cascade ? linkedObservations : 0 });
  }

  if (req.method === "GET" && url.pathname === "/api/owner/market/observations") {
    const projectId = String(url.searchParams.get("projectId") || "").trim();
    const metricType = String(url.searchParams.get("metricType") || "").trim().toLowerCase();
    const area = String(url.searchParams.get("area") || "").trim().toLowerCase();
    const freshnessFilter = String(url.searchParams.get("freshness") || "").trim().toLowerCase();
    const limit = Math.max(1, Math.min(500, Number(url.searchParams.get("limit") || 200)));
    const allMatches = db.knowledge.observations
      .map((observation) => ({
        ...observation,
        project: marketProjectFor(observation, db.knowledge),
        freshness: marketFreshness(observation),
        trend: marketTrendFor(observation, db.knowledge)
      }))
      .filter((observation) => !projectId || observation.projectId === projectId)
      .filter((observation) => !metricType || observation.metricType === metricType)
      .filter((observation) => !area || `${observation.area} ${observation.project?.area || ""}`.toLowerCase().includes(area))
      .filter((observation) => !freshnessFilter || observation.freshness.status === freshnessFilter)
      .sort((left, right) => String(right.observedAt).localeCompare(String(left.observedAt)));
    const counts = allMatches.reduce((summary, observation) => {
      summary[observation.freshness.status] += 1;
      return summary;
    }, { fresh: 0, aging: 0, stale: 0 });
    return send(res, 200, {
      observations: allMatches.slice(0, limit),
      summary: { matched: allMatches.length, returned: Math.min(allMatches.length, limit), ...counts }
    });
  }

  if (req.method === "POST" && url.pathname === "/api/owner/market/observations") {
    const observation = marketObservationFromInput(await readBody(req), db.knowledge);
    db.knowledge.observations.push(observation);
    db.knowledge = normalizeKnowledge(db.knowledge);
    await writeDb(db);
    return send(res, 201, {
      observation: { ...observation, freshness: marketFreshness(observation), trend: marketTrendFor(observation, db.knowledge) }
    });
  }

  if (req.method === "PATCH" && url.pathname.startsWith("/api/owner/market/observations/")) {
    const id = decodeURIComponent(url.pathname.split("/").pop());
    const index = db.knowledge.observations.findIndex((observation) => observation.id === id);
    if (index === -1) return send(res, 404, { error: "Market observation not found." });
    const observation = marketObservationFromInput(await readBody(req), db.knowledge, db.knowledge.observations[index]);
    db.knowledge.observations[index] = observation;
    await writeDb(db);
    return send(res, 200, {
      observation: { ...observation, freshness: marketFreshness(observation), trend: marketTrendFor(observation, db.knowledge) }
    });
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/owner/market/observations/")) {
    const id = decodeURIComponent(url.pathname.split("/").pop());
    if (!db.knowledge.observations.some((observation) => observation.id === id)) return send(res, 404, { error: "Market observation not found." });
    db.knowledge.observations = db.knowledge.observations.filter((observation) => observation.id !== id);
    await writeDb(db);
    return send(res, 204, "");
  }

  if (req.method === "POST" && url.pathname === "/api/owner/market/import") {
    const body = await readBody(req);
    const incomingProjects = Array.isArray(body.projects) ? body.projects : [];
    const incomingObservations = Array.isArray(body.observations) ? body.observations : [];
    if (incomingProjects.length + incomingObservations.length > 200) {
      return send(res, 413, { error: "Each market import is limited to 200 combined projects and observations." });
    }
    const projectReferences = new Map();
    const importedProjects = [];
    const importedObservations = [];
    const skipped = [];
    incomingProjects.forEach((input, index) => {
      try {
        const existing = findMarketProject(db.knowledge, { name: input?.name, area: input?.area });
        const project = existing || marketProjectFromInput(input);
        if (!existing) {
          db.knowledge.projects.push(project);
          importedProjects.push(project);
        }
        if (input?.id) projectReferences.set(String(input.id), project.id);
        projectReferences.set(`${project.name.toLowerCase()}|${project.area.toLowerCase()}`, project.id);
      } catch (error) {
        skipped.push({ type: "project", index, error: error.message });
      }
    });
    incomingObservations.forEach((input, index) => {
      try {
        const referenceKey = `${cleanMarketText(input?.projectName, 160).toLowerCase()}|${cleanMarketText(input?.area, 120).toLowerCase()}`;
        const resolvedProjectId = projectReferences.get(String(input?.projectId || "")) || projectReferences.get(referenceKey) || input?.projectId || "";
        const observation = marketObservationFromInput({ ...input, projectId: resolvedProjectId }, db.knowledge);
        db.knowledge.observations.push(observation);
        importedObservations.push(observation);
      } catch (error) {
        skipped.push({ type: "observation", index, error: error.message });
      }
    });
    db.knowledge = normalizeKnowledge(db.knowledge);
    await writeDb(db);
    return send(res, 201, {
      imported: { projects: importedProjects.length, observations: importedObservations.length },
      skipped,
      projects: importedProjects,
      observations: importedObservations
    });
  }

  if (req.method === "GET" && url.pathname === "/api/admin/users") {
    return send(res, 200, {
      users: db.auth.users.map(publicUser).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    });
  }

  if (req.method === "PATCH" && url.pathname.startsWith("/api/admin/users/")) {
    const id = url.pathname.split("/").pop();
    const user = db.auth.users.find((item) => item.id === id);
    if (!user) return send(res, 404, { error: "User not found." });
    const body = await readBody(req);
    if (body.role !== undefined) user.role = body.role === "admin" ? "admin" : "member";
    if (body.disabled !== undefined) user.disabledAt = body.disabled ? new Date().toISOString() : "";
    if (body.emailVerified !== undefined) user.emailVerifiedAt = body.emailVerified ? (user.emailVerifiedAt || new Date().toISOString()) : "";
    user.billing = normalizeUserBilling(user.billing);
    if (body.plan !== undefined) {
      const plan = String(body.plan).toLowerCase();
      if (!BILLING_PLANS[plan]) return send(res, 400, { error: "Unknown billing plan." });
      user.billing.plan = plan;
    }
    if (body.planStatus !== undefined) {
      const status = String(body.planStatus).toLowerCase();
      if (!["active", "trialing", "past_due", "canceled"].includes(status)) return send(res, 400, { error: "Unknown billing status." });
      user.billing.status = status;
    }
    if (body.reportCredits !== undefined) user.billing.reportCredits = Math.max(0, Math.min(10000, Math.floor(Number(body.reportCredits || 0))));
    user.billing.updatedAt = new Date().toISOString();
    if (user.disabledAt) db.auth.sessions = db.auth.sessions.filter((session) => session.userId !== user.id);
    await writeDb(db);
    return send(res, 200, { user: publicUser(user), billing: publicBillingStatus(user) });
  }

  if (req.method === "GET" && url.pathname === "/api/properties") {
    return send(res, 200, db.properties.map((property) => ({ ...property, analysis: analyzeProperty(property) })));
  }

  if (req.method === "GET" && url.pathname === "/api/comps") {
    return send(res, 200, db.comps.sort((a, b) => String(b.dateOfIndication || "").localeCompare(String(a.dateOfIndication || ""))));
  }

  if (req.method === "GET" && url.pathname === "/api/brain") {
    return send(res, 200, {
      ...db.brain,
      summary: brainSummary(db.brain),
      nextQuestion: nextThinkingQuestion(db.brain),
      decisions: db.brain.decisions.map((decision) => ({ ...decision, audit: auditDecision(decision) }))
    });
  }

  if (req.method === "GET" && url.pathname === "/api/portfolio/summary") {
    const analyzed = db.properties.map((property) => analyzeProperty(property));
    return send(res, 200, {
      count: db.properties.length,
      monthlyCashFlow: money(analyzed.reduce((sum, item) => sum + item.monthlyCashFlow, 0)),
      cashInvested: money(analyzed.reduce((sum, item) => sum + item.cashNeeded, 0)),
      averageCapRate: money(analyzed.reduce((sum, item) => sum + item.capRate, 0) / (analyzed.length || 1)),
      averageCashOnCash: money(analyzed.reduce((sum, item) => sum + item.cashOnCash, 0) / (analyzed.length || 1))
    });
  }

  if (req.method === "POST" && url.pathname === "/api/properties") {
    const body = await readBody(req);
    const property = { id: randomUUID(), createdAt: new Date().toISOString(), ...body };
    db.properties.push(property);
    await writeDb(db);
    return send(res, 201, { ...property, analysis: analyzeProperty(property) });
  }

  if (req.method === "POST" && url.pathname === "/api/brain/answers") {
    const body = await readBody(req);
    if (!String(body.answer || "").trim()) return send(res, 400, { error: "An answer is required" });
    const question = thinkingQuestions.find((item) => item.id === body.questionId);
    const answer = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      questionId: String(body.questionId || "custom"),
      category: String(body.category || question?.category || "Reflection"),
      question: String(body.question || question?.question || "Investor reflection"),
      answer: String(body.answer).trim()
    };
    db.brain.answers.push(answer);
    await writeDb(db);
    return send(res, 201, { answer, nextQuestion: nextThinkingQuestion(db.brain), summary: brainSummary(db.brain) });
  }

  if (req.method === "POST" && url.pathname === "/api/brain/beliefs") {
    const body = await readBody(req);
    if (!String(body.claim || "").trim()) return send(res, 400, { error: "A belief claim is required" });
    const belief = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      status: "active",
      claim: String(body.claim).trim(),
      scope: String(body.scope || "General").trim(),
      confidence: Number(body.confidence || 50),
      evidenceFor: String(body.evidenceFor || "").trim(),
      evidenceAgainst: String(body.evidenceAgainst || "").trim(),
      falsifier: String(body.falsifier || "").trim(),
      nextReview: String(body.nextReview || "").trim()
    };
    db.brain.beliefs.push(belief);
    await writeDb(db);
    return send(res, 201, belief);
  }

  if (req.method === "POST" && url.pathname === "/api/brain/decisions") {
    const body = await readBody(req);
    if (!String(body.subject || "").trim() || !String(body.thesis || "").trim()) {
      return send(res, 400, { error: "Decision subject and thesis are required" });
    }
    const decision = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      subject: String(body.subject).trim(),
      geography: String(body.geography || "Not specified").trim(),
      stance: String(body.stance || "Watch").trim(),
      thesis: String(body.thesis).trim(),
      evidence: String(body.evidence || "").trim(),
      counterThesis: String(body.counterThesis || "").trim(),
      alternatives: String(body.alternatives || "").trim(),
      killCriteria: String(body.killCriteria || "").trim(),
      confidence: Number(body.confidence || 50),
      reviewDate: String(body.reviewDate || "").trim()
    };
    db.brain.decisions.push(decision);
    await writeDb(db);
    return send(res, 201, { ...decision, audit: auditDecision(decision) });
  }

  if (req.method === "POST" && url.pathname === "/api/comps/bulk") {
    const body = await readBody(req);
    const incoming = Array.isArray(body.comps) ? body.comps : [];
    const createdAt = new Date().toISOString();
    const comps = incoming
      .map((comp) => ({
        id: randomUUID(),
        createdAt,
        name: String(comp.name || comp.propertyName || comp.address || "Untitled indication").trim(),
        address: String(comp.address || "").trim(),
        propertyType: String(comp.propertyType || comp.type || "Commercial").trim(),
        indicativePrice: Number(comp.indicativePrice || comp.price || 0),
        dateOfIndication: String(comp.dateOfIndication || comp.date || "").trim(),
        bankInCharge: String(comp.bankInCharge || comp.bank || "").trim(),
        source: String(comp.source || comp.officer || "").trim(),
        latitude: Number(comp.latitude || comp.lat || 0),
        longitude: Number(comp.longitude || comp.lng || comp.lon || 0),
        confidence: String(comp.confidence || "").trim(),
        notes: String(comp.notes || comp.remarks || "").trim()
      }))
      .filter((comp) => Number.isFinite(comp.latitude) && Number.isFinite(comp.longitude) && comp.latitude && comp.longitude);

    db.comps.push(...comps);
    await writeDb(db);
    return send(res, 201, { imported: comps.length, skipped: incoming.length - comps.length, comps });
  }

  if (req.method === "DELETE" && url.pathname === "/api/comps") {
    db.comps = [];
    await writeDb(db);
    return send(res, 204, "");
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/comps/")) {
    const id = url.pathname.split("/").pop();
    db.comps = db.comps.filter((comp) => comp.id !== id);
    await writeDb(db);
    return send(res, 204, "");
  }

  if (req.method === "PUT" && url.pathname.startsWith("/api/properties/")) {
    const id = url.pathname.split("/").pop();
    const body = await readBody(req);
    const index = db.properties.findIndex((property) => property.id === id);
    if (index === -1) return send(res, 404, { error: "Property not found" });
    db.properties[index] = { ...db.properties[index], ...body, updatedAt: new Date().toISOString() };
    await writeDb(db);
    return send(res, 200, { ...db.properties[index], analysis: analyzeProperty(db.properties[index]) });
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/properties/")) {
    const id = url.pathname.split("/").pop();
    const next = db.properties.filter((property) => property.id !== id);
    await writeDb({ ...db, properties: next });
    return send(res, 204, "");
  }

  if (req.method === "POST" && url.pathname === "/api/analyze") {
    const body = await readBody(req);
    return send(res, 200, analyzeProperty(body));
  }

  if (req.method === "POST" && url.pathname === "/api/selection/analyze") {
    const body = await readBody(req);
    return send(res, 200, analyzeSelection(body));
  }

  if (req.method === "POST" && url.pathname === "/api/rag/query") {
    const body = await readBody(req);
    return send(res, 200, await retrieveGuidance(body.query, body.property, db.brain, db.knowledge));
  }

  if (req.method === "POST" && url.pathname === "/api/jarvis/query") {
    const body = await readBody(req);
    const query = String(body.query || "").trim();
    if (!query) return send(res, 400, { error: "An Apex Analytic query is required." });
    if (query.length > 4000) return send(res, 400, { error: "Keep each Apex Analytic message under 4000 characters." });
    const clientId = requestClientId(req, body);
    let session = accessibleJarvisSession(db, body.sessionId, actor, clientId);
    if (!session) session = createJarvisSession({ clientId }, actor.user);
    claimJarvisSession(session, actor, clientId);
    if (!session.messages.length || defaultSessionTitle(session.title)) session.title = titleFromQuery(query);

    const userMessage = {
      id: randomUUID(),
      role: "user",
      content: query,
      createdAt: new Date().toISOString(),
      sources: []
    };
    session.messages.push(userMessage);

    let memoryCandidate = null;
    if (actor.user) {
      actor.user.memory = normalizeUserMemory(actor.user.memory);
      memoryCandidate = proposeLongTermMemory(query, actor.user.memory, userMessage.id);
      if (memoryCandidate) {
        actor.user.memory.items.unshift(memoryCandidate);
        actor.user.memory = normalizeUserMemory(actor.user.memory);
      }
    }

    const retrievalStartedAt = Date.now();
    const result = await retrieveJarvisAnswer(query, db.brain, session, {
      dealCard: body.dealCard,
      financialProfile: body.financialProfile
    }, db.knowledge, approvedUserMemories(actor.user), lockedUserJournal(actor.user));
    const jarvisMessage = {
      id: randomUUID(),
      role: "jarvis",
      content: result.answer,
      createdAt: new Date().toISOString(),
      mode: result.mode,
      provider: result.provider || "",
      model: result.model || "",
      sources: result.sources
    };
    session.messages.push(jarvisMessage);
    session.updatedAt = jarvisMessage.createdAt;
    session.messages = session.messages.slice(-80);
    db.jarvis = upsertJarvisSession(db.jarvis, session);
    db.knowledge.retrievalEvents.push({
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      queryHash: createHash("sha256").update(query).digest("hex").slice(0, 24),
      queryLength: query.length,
      mode: result.retrievalMode || "lexical",
      sourceIds: (result.sources || []).map((source) => source.id).slice(0, 10),
      latencyMs: Date.now() - retrievalStartedAt,
      userId: actor.user?.id || ""
    });
    db.knowledge.retrievalEvents = db.knowledge.retrievalEvents.slice(-1000);
    await writeDb(db);
    return send(res, 200, {
      ...result,
      memoryCandidate: memoryCandidate ? publicMemoryItem(memoryCandidate) : null,
      message: jarvisMessage,
      session: publicJarvisSession(session)
    });
  }

  send(res, 404, { error: "Route not found" });
}

let readyPromise;

function ready() {
  readyPromise ||= initializeStore();
  return readyPromise;
}

function handleError(res, error) {
    console.error(error);
    const status = Number(error.statusCode || 500);
    send(res, status, { error: status === 500 ? "Unexpected server error" : error.message });
}

async function handler(req, res) {
  await ready();
  return router(req, res);
}

function isMainModule() {
  const entry = globalThis.process?.argv?.[1];
  return Boolean(entry && import.meta.url === pathToFileURL(entry).href);
}

let server;

if (isMainModule()) {
  await ready();
  server = http.createServer((req, res) => {
    handler(req, res).catch((error) => handleError(res, error));
  });

  server.listen(PORT, HOST, () => {
    console.log(`Real estate investment tool running at http://${HOST}:${PORT}`);
  });
}

export {
  analyzeSevenStageDeal,
  dealAnalysisText,
  handler,
  requestLlmText,
  requestOpenAIText,
  retrieveJarvisAnswer,
  server
};
