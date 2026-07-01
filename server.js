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
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "media-src 'self' blob: data:",
    "connect-src 'self'",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'"
  ].join("; ")
};
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
const AUTH_DEBUG_TOKENS = String(globalThis.process?.env?.ESTATELAB_AUTH_DEBUG_TOKENS || "false").toLowerCase() === "true"
  && String(globalThis.process?.env?.NODE_ENV || "").toLowerCase() !== "production";
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
const TRUSTED_PROXY_HOPS = Math.max(1, Number(globalThis.process?.env?.ESTATELAB_TRUSTED_PROXY_HOPS || 1));
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

function normalizeMemorySettings(settings) {
  return {
    captureEnabled: Boolean(settings?.captureEnabled),
    reasoningEnabled: Boolean(settings?.reasoningEnabled),
    updatedAt: String(settings?.updatedAt || "")
  };
}

const MEMORY_CATEGORY_LABELS = {
  preference: "Preference",
  constraint: "Constraint",
  lesson: "Lesson",
  mistake: "Mistake",
  investment_rule: "Investment rule",
  market_belief: "Market belief",
  personal_warning: "Personal warning",
  goal: "Goal",
  experience: "Experience",
  decision: "Decision",
  general: "General"
};

function normalizeMemoryCategory(category, content = "") {
  const normalized = String(category || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (MEMORY_CATEGORY_LABELS[normalized]) return normalized;
  return memoryCategory(content);
}

const ANSWER_STYLE_FEEDBACK = {
  useful: { label: "Useful", note: "Keep this answer shape." },
  shorter: { label: "Shorter", note: "Make future answers shorter and lead with the decision." },
  warmer: { label: "Less formal", note: "Make future answers more natural and mentor-like." },
  evidence: { label: "More proof", note: "Add clearer missing evidence and verification steps." }
};

function normalizeAnswerStyleFeedback(item = {}) {
  const value = String(item.value || "").trim().toLowerCase();
  const option = ANSWER_STYLE_FEEDBACK[value];
  if (!option) return null;
  return {
    id: String(item.id || randomUUID()).slice(0, 100),
    value,
    label: reportText(item.label || option.label, 40),
    note: reportText(item.note || option.note, 180),
    messageId: String(item.messageId || "").slice(0, 100),
    answer: reportText(item.answer, 220),
    createdAt: String(item.createdAt || new Date().toISOString())
  };
}

function normalizeAnswerStyle(answerStyle) {
  const feedback = Array.isArray(answerStyle?.feedback)
    ? answerStyle.feedback.map(normalizeAnswerStyleFeedback).filter(Boolean).slice(0, 40)
    : [];
  return {
    version: 1,
    feedback,
    updatedAt: String(answerStyle?.updatedAt || feedback[0]?.createdAt || "")
  };
}

function normalizeUserMemory(memory) {
  const validStatuses = new Set(["pending", "approved", "dismissed"]);
  const items = Array.isArray(memory?.items)
    ? memory.items.map((item) => ({
      id: String(item.id || randomUUID()),
      category: normalizeMemoryCategory(item.category, item.content),
      content: String(item.content || "").replace(/\s+/g, " ").trim().slice(0, 500),
      status: validStatuses.has(item.status) ? item.status : "pending",
      sourceMessageId: String(item.sourceMessageId || "").slice(0, 80),
      createdAt: String(item.createdAt || new Date().toISOString()),
      updatedAt: String(item.updatedAt || item.createdAt || new Date().toISOString()),
      reviewedAt: String(item.reviewedAt || "")
    })).filter((item) => item.content).slice(0, 200)
    : [];
  return { version: 4, settings: normalizeMemorySettings(memory?.settings), items, answerStyle: normalizeAnswerStyle(memory?.answerStyle) };
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
    .slice(0, 80)
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

function normalizeReportDevelopmentIntelligence(section = {}) {
  const safeStatus = (value, fallback = "watch") => ["tracked", "partial", "thin", "watch", "risk", "clear", "missing", "action"].includes(value) ? value : fallback;
  const lanes = Array.isArray(section.lanes) ? section.lanes.slice(0, 12).map((item) => ({
    version: reportText(item?.version, 20),
    label: reportText(item?.label, 160),
    status: safeStatus(item?.status),
    score: Math.max(0, Math.min(100, Number(item?.score || 0))),
    reading: reportText(item?.reading, 700),
    action: reportText(item?.action, 500)
  })).filter((item) => item.version && item.label) : [];
  return {
    version: reportText(section.version || "v7", 20),
    status: safeStatus(section.status, "thin"),
    score: Math.max(0, Math.min(100, Number(section.score || 0))),
    summary: reportText(section.summary, 900),
    posture: reportText(section.posture, 200),
    observationHealth: {
      matched: Math.max(0, Number(section?.observationHealth?.matched || 0)),
      fresh: Math.max(0, Number(section?.observationHealth?.fresh || 0)),
      aging: Math.max(0, Number(section?.observationHealth?.aging || 0)),
      stale: Math.max(0, Number(section?.observationHealth?.stale || 0)),
      latestObservedAt: reportText(section?.observationHealth?.latestObservedAt, 40)
    },
    lanes,
    actionQueue: Array.isArray(section.actionQueue) ? section.actionQueue.slice(0, 8).map((item) => ({
      version: reportText(item?.version, 20),
      label: reportText(item?.label, 160),
      status: safeStatus(item?.status),
      action: reportText(item?.action, 500)
    })).filter((item) => item.version && item.label) : []
  };
}

function normalizeReportCaseIntelligence(section = {}) {
  const safeStatus = (value, fallback = "thin") => ["tracked", "partial", "thin", "risk", "clear", "watch", "missing", "action"].includes(value) ? value : fallback;
  return {
    version: reportText(section.version || "case-v1", 20),
    status: safeStatus(section.status, "thin"),
    score: Math.max(0, Math.min(100, Number(section.score || 0))),
    summary: reportText(section.summary, 900),
    posture: reportText(section.posture, 240),
    matched: Math.max(0, Number(section.matched || 0)),
    cases: Array.isArray(section.cases) ? section.cases.slice(0, 8).map((item) => ({
      id: reportText(item?.id, 100),
      projectName: reportText(item?.projectName, 160),
      area: reportText(item?.area, 120),
      state: reportText(item?.state, 80),
      propertyType: reportText(item?.propertyType, 80),
      developer: reportText(item?.developer, 120),
      priceSegment: reportText(item?.priceSegment, 120),
      targetBuyer: reportText(item?.targetBuyer, 220),
      targetTenant: reportText(item?.targetTenant, 220),
      verdict: reportText(item?.verdict, 40),
      verdictLabel: reportText(item?.verdictLabel, 80),
      rating: Math.max(0, Math.min(100, Number(item?.rating || 0))),
      confidence: reportText(item?.confidence, 40),
      score: Math.max(0, Math.min(100, Number(item?.score || 0))),
      summary: reportText(item?.summary, 700),
      strengths: reportText(item?.strengths, 700),
      weaknesses: reportText(item?.weaknesses, 700),
      managementView: reportText(item?.managementView, 700),
      residentProfile: reportText(item?.residentProfile, 700),
      supplyThreat: reportText(item?.supplyThreat, 700),
      rentalOutlook: reportText(item?.rentalOutlook, 700),
      resaleOutlook: reportText(item?.resaleOutlook, 700),
      ownerVerdict: reportText(item?.ownerVerdict, 900),
      sourceBasis: reportText(item?.sourceBasis, 500),
      tags: Array.isArray(item?.tags) ? item.tags.slice(0, 20).map((tag) => reportText(tag, 60)).filter(Boolean) : [],
      observedAt: reportText(item?.observedAt, 40)
    })).filter((item) => item.id && item.projectName) : [],
    actionQueue: Array.isArray(section.actionQueue) ? section.actionQueue.slice(0, 6).map((item) => ({
      label: reportText(item?.label, 160),
      status: safeStatus(item?.status, "watch"),
      action: reportText(item?.action, 500)
    })).filter((item) => item.label) : []
  };
}

function normalizeReportDocumentIntelligence(section = {}) {
  const safeStatus = (value, fallback = "thin") => ["proven", "partial", "thin", "risk", "clear", "watch", "missing", "action"].includes(value) ? value : fallback;
  const lanes = Array.isArray(section.lanes) ? section.lanes.slice(0, 12).map((item) => ({
    version: reportText(item?.version, 20),
    label: reportText(item?.label, 160),
    status: safeStatus(item?.status, "watch"),
    score: Math.max(0, Math.min(100, Number(item?.score || 0))),
    reading: reportText(item?.reading, 700),
    action: reportText(item?.action, 500)
  })).filter((item) => item.version && item.label) : [];
  return {
    version: reportText(section.version || "v8", 20),
    status: safeStatus(section.status, "thin"),
    score: Math.max(0, Math.min(100, Number(section.score || 0))),
    summary: reportText(section.summary, 900),
    posture: reportText(section.posture, 240),
    vaultHealth: {
      documents: Math.max(0, Number(section?.vaultHealth?.documents || 0)),
      indexed: Math.max(0, Number(section?.vaultHealth?.indexed || 0)),
      chunks: Math.max(0, Number(section?.vaultHealth?.chunks || 0)),
      matched: Math.max(0, Number(section?.vaultHealth?.matched || 0)),
      mode: reportText(section?.vaultHealth?.mode, 40),
      latestUpdatedAt: reportText(section?.vaultHealth?.latestUpdatedAt, 40)
    },
    lanes,
    matchedEvidence: Array.isArray(section.matchedEvidence) ? section.matchedEvidence.slice(0, 8).map((item) => ({
      id: reportText(item?.id, 140),
      documentId: reportText(item?.documentId, 100),
      title: reportText(item?.title, 180),
      score: Math.max(0, Math.min(100, Number(item?.score || 0))),
      preview: reportText(item?.preview, 500),
      tags: reportList(item?.tags, 8),
      status: safeStatus(item?.status, "watch"),
      updatedAt: reportText(item?.updatedAt, 40)
    })).filter((item) => item.id && item.title) : [],
    actionQueue: Array.isArray(section.actionQueue) ? section.actionQueue.slice(0, 8).map((item) => ({
      version: reportText(item?.version, 20),
      label: reportText(item?.label, 160),
      status: safeStatus(item?.status, "watch"),
      action: reportText(item?.action, 500)
    })).filter((item) => item.version && item.label) : []
  };
}

function normalizeReportPortfolioCommand(section = {}) {
  const safeStatus = (value, fallback = "hold") => ["advance", "hold", "repair", "pause", "clear", "watch", "risk", "missing", "action"].includes(value) ? value : fallback;
  const lanes = Array.isArray(section.lanes) ? section.lanes.slice(0, 12).map((item) => ({
    version: reportText(item?.version, 20),
    label: reportText(item?.label, 160),
    status: safeStatus(item?.status, "watch"),
    score: Math.max(0, Math.min(100, Number(item?.score || 0))),
    reading: reportText(item?.reading, 700),
    action: reportText(item?.action, 500)
  })).filter((item) => item.version && item.label) : [];
  return {
    version: reportText(section.version || "v9", 20),
    status: safeStatus(section.status, "hold"),
    score: Math.max(0, Math.min(100, Number(section.score || 0))),
    summary: reportText(section.summary, 900),
    posture: reportText(section.posture, 240),
    nextMove: reportText(section.nextMove, 500),
    capitalMap: {
      cashAvailable: reportText(section?.capitalMap?.cashAvailable, 80),
      cashOutlay: reportText(section?.capitalMap?.cashOutlay, 80),
      cashAfterPurchase: reportText(section?.capitalMap?.cashAfterPurchase, 80),
      reserveMonths: reportText(section?.capitalMap?.reserveMonths, 80),
      reserveSurvivalMonths: section?.capitalMap?.reserveSurvivalMonths === null ? null : Math.max(0, Number(section?.capitalMap?.reserveSurvivalMonths || 0)),
      postDealDsr: reportText(section?.capitalMap?.postDealDsr, 80),
      holdingCashFlow: reportText(section?.capitalMap?.holdingCashFlow, 80),
      stressedHolding: reportText(section?.capitalMap?.stressedHolding, 80),
      existingProperties: Math.max(0, Number(section?.capitalMap?.existingProperties || 0)),
      portfolioRole: reportText(section?.capitalMap?.portfolioRole, 160)
    },
    lanes,
    actionQueue: Array.isArray(section.actionQueue) ? section.actionQueue.slice(0, 8).map((item) => ({
      version: reportText(item?.version, 20),
      label: reportText(item?.label, 160),
      status: safeStatus(item?.status, "watch"),
      action: reportText(item?.action, 500)
    })).filter((item) => item.version && item.label) : []
  };
}

function normalizeReportFinalCommand(section = {}) {
  const safeStatus = (value, fallback = "investigate") => ["approve", "shortlist", "investigate", "pause", "reject", "clear", "watch", "risk", "missing", "action"].includes(value) ? value : fallback;
  const lanes = Array.isArray(section.lanes) ? section.lanes.slice(0, 12).map((item) => ({
    version: reportText(item?.version, 20),
    label: reportText(item?.label, 160),
    status: safeStatus(item?.status, "watch"),
    score: Math.max(0, Math.min(100, Number(item?.score || 0))),
    reading: reportText(item?.reading, 700),
    action: reportText(item?.action, 500)
  })).filter((item) => item.version && item.label) : [];
  return {
    version: reportText(section.version || "v10", 20),
    status: safeStatus(section.status),
    score: Math.max(0, Math.min(100, Number(section.score || 0))),
    command: reportText(section.command, 120),
    headline: reportText(section.headline, 240),
    summary: reportText(section.summary, 900),
    finalAnswer: reportText(section.finalAnswer, 900),
    nextMove: reportText(section.nextMove, 500),
    contradictionCount: Math.max(0, Number(section.contradictionCount || 0)),
    contradictions: reportList(section.contradictions, 8),
    lanes,
    actionQueue: Array.isArray(section.actionQueue) ? section.actionQueue.slice(0, 8).map((item) => ({
      version: reportText(item?.version, 20),
      label: reportText(item?.label, 160),
      status: safeStatus(item?.status, "watch"),
      action: reportText(item?.action, 500)
    })).filter((item) => item.version && item.label) : []
  };
}

function normalizeReportAnalysis(analysis = {}) {
  const objectList = (items, limit, mapper) => Array.isArray(items) ? items.slice(0, limit).map(mapper) : [];
  return {
    engineVersion: reportText(analysis.engineVersion || "Apex v10.10", 40),
    reasoningMode: reportText(analysis.reasoningMode || "Framework only", 40),
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
    stressEnvelope: {
      summary: reportText(analysis?.stressEnvelope?.summary, 700),
      status: ["resilient", "pressure", "fragile", "unknown"].includes(analysis?.stressEnvelope?.status) ? analysis.stressEnvelope.status : "unknown",
      baseTrueHolding: reportText(analysis?.stressEnvelope?.baseTrueHolding, 80),
      stressedTrueHolding: reportText(analysis?.stressEnvelope?.stressedTrueHolding, 80),
      cashAfterStressReserves: reportText(analysis?.stressEnvelope?.cashAfterStressReserves, 80),
      reserveSurvivalMonths: analysis?.stressEnvelope?.reserveSurvivalMonths === null ? null : Math.max(0, Number(analysis?.stressEnvelope?.reserveSurvivalMonths || 0)),
      assumptions: objectList(analysis?.stressEnvelope?.assumptions, 10, (item) => ({
        label: reportText(item?.label, 120),
        value: reportText(item?.value, 120),
        source: ["provided", "default"].includes(item?.source) ? item.source : "default"
      }))
    },
    portfolioGate: {
      summary: reportText(analysis?.portfolioGate?.summary, 700),
      status: ["allow", "review", "block", "unknown"].includes(analysis?.portfolioGate?.status) ? analysis.portfolioGate.status : "unknown",
      score: Math.max(0, Math.min(100, Number(analysis?.portfolioGate?.score || 0))),
      nextPropertyRule: reportText(analysis?.portfolioGate?.nextPropertyRule, 700),
      checks: objectList(analysis?.portfolioGate?.checks, 10, (item) => ({
        label: reportText(item?.label, 140),
        status: ["clear", "caution", "block"].includes(item?.status) ? item.status : "caution",
        action: reportText(item?.action, 420)
      }))
    },
    marketPulse: {
      summary: reportText(analysis?.marketPulse?.summary, 700),
      status: ["opportunity", "watch", "risk", "unknown"].includes(analysis?.marketPulse?.status) ? analysis.marketPulse.status : "unknown",
      cycle: reportText(analysis?.marketPulse?.cycle, 120),
      liquidity: reportText(analysis?.marketPulse?.liquidity, 120),
      checks: objectList(analysis?.marketPulse?.checks, 10, (item) => ({
        label: reportText(item?.label, 140),
        status: ["clear", "caution", "risk"].includes(item?.status) ? item.status : "caution",
        action: reportText(item?.action, 420)
      }))
    },
    holdExitPlan: {
      summary: reportText(analysis?.holdExitPlan?.summary, 700),
      action: ["hold", "monitor", "refinance", "sell", "pause"].includes(analysis?.holdExitPlan?.action) ? analysis.holdExitPlan.action : "monitor",
      reviewCadence: reportText(analysis?.holdExitPlan?.reviewCadence, 240),
      triggers: objectList(analysis?.holdExitPlan?.triggers, 10, (item) => ({
        label: reportText(item?.label, 140),
        status: ["normal", "watch", "action"].includes(item?.status) ? item.status : "watch",
        action: reportText(item?.action, 420)
      }))
    },
    decisionSeal: {
      status: ["sealed", "conditional", "blocked"].includes(analysis?.decisionSeal?.status) ? analysis.decisionSeal.status : "conditional",
      label: reportText(analysis?.decisionSeal?.label, 120),
      summary: reportText(analysis?.decisionSeal?.summary, 700),
      conditions: objectList(analysis?.decisionSeal?.conditions, 12, (item) => ({
        label: reportText(item?.label, 140),
        status: ["pass", "review", "fail"].includes(item?.status) ? item.status : "review",
        action: reportText(item?.action, 420)
      }))
    },
    siteVisitAssistant: {
      summary: reportText(analysis?.siteVisitAssistant?.summary, 700),
      status: ["ready", "required", "risk", "unknown"].includes(analysis?.siteVisitAssistant?.status) ? analysis.siteVisitAssistant.status : "unknown",
      focus: reportText(analysis?.siteVisitAssistant?.focus, 200),
      checks: objectList(analysis?.siteVisitAssistant?.checks, 10, (item) => ({
        label: reportText(item?.label, 140),
        status: ["clear", "check", "risk"].includes(item?.status) ? item.status : "check",
        action: reportText(item?.action, 420)
      }))
    },
    sourcingProfessional: {
      summary: reportText(analysis?.sourcingProfessional?.summary, 700),
      status: ["clean", "verify", "pressure", "risk", "unknown"].includes(analysis?.sourcingProfessional?.status) ? analysis.sourcingProfessional.status : "unknown",
      posture: reportText(analysis?.sourcingProfessional?.posture, 200),
      checks: objectList(analysis?.sourcingProfessional?.checks, 10, (item) => ({
        label: reportText(item?.label, 140),
        status: ["clear", "verify", "caution", "risk"].includes(item?.status) ? item.status : "verify",
        action: reportText(item?.action, 420)
      }))
    },
    tenantRentalPlan: {
      summary: reportText(analysis?.tenantRentalPlan?.summary, 700),
      status: ["ready", "watch", "risk", "unknown"].includes(analysis?.tenantRentalPlan?.status) ? analysis.tenantRentalPlan.status : "unknown",
      target: reportText(analysis?.tenantRentalPlan?.target, 160),
      checks: objectList(analysis?.tenantRentalPlan?.checks, 10, (item) => ({
        label: reportText(item?.label, 140),
        status: ["clear", "watch", "risk"].includes(item?.status) ? item.status : "watch",
        action: reportText(item?.action, 420)
      }))
    },
    exitStrategy: {
      summary: reportText(analysis?.exitStrategy?.summary, 700),
      status: ["clear", "prepare", "risk", "unknown"].includes(analysis?.exitStrategy?.status) ? analysis.exitStrategy.status : "unknown",
      buyerPsychology: reportText(analysis?.exitStrategy?.buyerPsychology, 240),
      checks: objectList(analysis?.exitStrategy?.checks, 10, (item) => ({
        label: reportText(item?.label, 140),
        status: ["clear", "prepare", "risk"].includes(item?.status) ? item.status : "prepare",
        action: reportText(item?.action, 420)
      }))
    },
    productExperience: {
      mode: reportText(analysis?.productExperience?.mode, 120),
      level: reportText(analysis?.productExperience?.level, 80),
      intent: reportText(analysis?.productExperience?.intent, 120),
      preferredOutput: reportText(analysis?.productExperience?.preferredOutput, 120),
      confidenceComfort: reportText(analysis?.productExperience?.confidenceComfort, 120),
      summary: reportText(analysis?.productExperience?.summary, 700),
      explanationStyle: reportText(analysis?.productExperience?.explanationStyle, 240),
      nextBestAction: reportText(analysis?.productExperience?.nextBestAction, 500),
      onboardingCompleteness: Math.max(0, Math.min(100, Number(analysis?.productExperience?.onboardingCompleteness || 0))),
      checks: objectList(analysis?.productExperience?.checks, 8, (item) => ({
        label: reportText(item?.label, 140),
        status: ["clear", "missing", "watch"].includes(item?.status) ? item.status : "missing",
        action: reportText(item?.action, 420)
      }))
    },
    stages: objectList(analysis.stages, 7, (item) => ({
      number: Math.max(1, Math.min(7, Number(item?.number || 1))),
      name: reportText(item?.name, 100),
      score: Math.max(0, Math.min(100, Number(item?.score || 0))),
      status: ["pass", "watch", "risk", "incomplete"].includes(item?.status) ? item.status : "incomplete",
      summary: reportText(item?.summary, 500)
    })),
    challengeMode: {
      level: ["hard", "missing", "soft"].includes(analysis?.challengeMode?.level) ? analysis.challengeMode.level : "soft",
      label: reportText(analysis?.challengeMode?.label, 80),
      message: reportText(analysis?.challengeMode?.message, 800)
    },
    decisionFocus: {
      label: reportText(analysis?.decisionFocus?.label, 80),
      body: reportText(analysis?.decisionFocus?.body, 900),
      tone: ["danger", "warning", "ready", "neutral"].includes(analysis?.decisionFocus?.tone) ? analysis.decisionFocus.tone : "neutral"
    },
    investorReadiness: {
      label: reportText(analysis?.investorReadiness?.label, 80),
      score: Math.max(0, Math.min(100, Number(analysis?.investorReadiness?.score || 0))),
      summary: reportText(analysis?.investorReadiness?.summary, 800),
      flags: reportList(analysis?.investorReadiness?.flags, 6)
    },
    evidenceChecklist: objectList(analysis.evidenceChecklist, 10, (item) => ({
      label: reportText(item?.label, 120),
      status: ["done", "warning", "missing", "danger"].includes(item?.status) ? item.status : "missing",
      action: reportText(item?.action, 300)
    })),
    evidenceEngine: {
      status: ["proven", "conditional", "weak", "blocked", "unknown"].includes(analysis?.evidenceEngine?.status) ? analysis.evidenceEngine.status : "unknown",
      score: Math.max(0, Math.min(100, Number(analysis?.evidenceEngine?.score || 0))),
      summary: reportText(analysis?.evidenceEngine?.summary, 800),
      recommendationGate: reportText(analysis?.evidenceEngine?.recommendationGate, 240),
      criticalGaps: reportList(analysis?.evidenceEngine?.criticalGaps, 8),
      gates: objectList(analysis?.evidenceEngine?.gates, 10, (item) => ({
        label: reportText(item?.label, 140),
        status: ["proven", "partial", "missing", "blocked"].includes(item?.status) ? item.status : "missing",
        weight: Math.max(0, Math.min(100, Number(item?.weight || 0))),
        score: Math.max(0, Math.min(100, Number(item?.score || 0))),
        proof: reportText(item?.proof, 420),
        gap: reportText(item?.gap, 420),
        action: reportText(item?.action, 420)
      }))
    },
    transactionComparableEvidence: {
      status: ["strong", "usable", "thin", "unsafe", "missing", "unknown"].includes(analysis?.transactionComparableEvidence?.status) ? analysis.transactionComparableEvidence.status : "unknown",
      score: Math.max(0, Math.min(100, Number(analysis?.transactionComparableEvidence?.score || 0))),
      summary: reportText(analysis?.transactionComparableEvidence?.summary, 800),
      valuePosition: reportText(analysis?.transactionComparableEvidence?.valuePosition, 240),
      checks: objectList(analysis?.transactionComparableEvidence?.checks, 8, (item) => ({
        label: reportText(item?.label, 140),
        status: ["strong", "usable", "thin", "unsafe", "missing"].includes(item?.status) ? item.status : "missing",
        proof: reportText(item?.proof, 360),
        gap: reportText(item?.gap, 360),
        action: reportText(item?.action, 420)
      }))
    },
    achievedRentalEvidence: {
      status: ["strong", "usable", "thin", "unsafe", "missing", "unknown"].includes(analysis?.achievedRentalEvidence?.status) ? analysis.achievedRentalEvidence.status : "unknown",
      score: Math.max(0, Math.min(100, Number(analysis?.achievedRentalEvidence?.score || 0))),
      summary: reportText(analysis?.achievedRentalEvidence?.summary, 800),
      coveragePosition: reportText(analysis?.achievedRentalEvidence?.coveragePosition, 260),
      checks: objectList(analysis?.achievedRentalEvidence?.checks, 8, (item) => ({
        label: reportText(item?.label, 140),
        status: ["strong", "usable", "thin", "unsafe", "missing"].includes(item?.status) ? item.status : "missing",
        proof: reportText(item?.proof, 360),
        gap: reportText(item?.gap, 360),
        action: reportText(item?.action, 420)
      }))
    },
    financingValuationEvidence: {
      status: ["strong", "usable", "thin", "unsafe", "missing", "unknown"].includes(analysis?.financingValuationEvidence?.status) ? analysis.financingValuationEvidence.status : "unknown",
      score: Math.max(0, Math.min(100, Number(analysis?.financingValuationEvidence?.score || 0))),
      summary: reportText(analysis?.financingValuationEvidence?.summary, 800),
      affordabilityPosition: reportText(analysis?.financingValuationEvidence?.affordabilityPosition, 300),
      checks: objectList(analysis?.financingValuationEvidence?.checks, 8, (item) => ({
        label: reportText(item?.label, 140),
        status: ["strong", "usable", "thin", "unsafe", "missing"].includes(item?.status) ? item.status : "missing",
        proof: reportText(item?.proof, 360),
        gap: reportText(item?.gap, 360),
        action: reportText(item?.action, 420)
      }))
    },
    supplyAbsorptionEvidence: {
      status: ["strong", "usable", "thin", "unsafe", "missing", "unknown"].includes(analysis?.supplyAbsorptionEvidence?.status) ? analysis.supplyAbsorptionEvidence.status : "unknown",
      score: Math.max(0, Math.min(100, Number(analysis?.supplyAbsorptionEvidence?.score || 0))),
      summary: reportText(analysis?.supplyAbsorptionEvidence?.summary, 800),
      competitionPosition: reportText(analysis?.supplyAbsorptionEvidence?.competitionPosition, 300),
      checks: objectList(analysis?.supplyAbsorptionEvidence?.checks, 8, (item) => ({
        label: reportText(item?.label, 140),
        status: ["strong", "usable", "thin", "unsafe", "missing"].includes(item?.status) ? item.status : "missing",
        proof: reportText(item?.proof, 360),
        gap: reportText(item?.gap, 360),
        action: reportText(item?.action, 420)
      }))
    },
    siteManagementEvidence: {
      status: ["strong", "usable", "thin", "unsafe", "missing", "unknown"].includes(analysis?.siteManagementEvidence?.status) ? analysis.siteManagementEvidence.status : "unknown",
      score: Math.max(0, Math.min(100, Number(analysis?.siteManagementEvidence?.score || 0))),
      summary: reportText(analysis?.siteManagementEvidence?.summary, 800),
      livedQualityPosition: reportText(analysis?.siteManagementEvidence?.livedQualityPosition, 320),
      checks: objectList(analysis?.siteManagementEvidence?.checks, 10, (item) => ({
        label: reportText(item?.label, 140),
        status: ["strong", "usable", "thin", "unsafe", "missing"].includes(item?.status) ? item.status : "missing",
        proof: reportText(item?.proof, 360),
        gap: reportText(item?.gap, 360),
        action: reportText(item?.action, 420)
      }))
    },
    legalTransactionEvidence: {
      status: ["strong", "usable", "thin", "unsafe", "missing", "unknown"].includes(analysis?.legalTransactionEvidence?.status) ? analysis.legalTransactionEvidence.status : "unknown",
      score: Math.max(0, Math.min(100, Number(analysis?.legalTransactionEvidence?.score || 0))),
      summary: reportText(analysis?.legalTransactionEvidence?.summary, 800),
      transactionPosition: reportText(analysis?.legalTransactionEvidence?.transactionPosition, 360),
      checks: objectList(analysis?.legalTransactionEvidence?.checks, 10, (item) => ({
        label: reportText(item?.label, 140),
        status: ["strong", "usable", "thin", "unsafe", "missing"].includes(item?.status) ? item.status : "missing",
        proof: reportText(item?.proof, 360),
        gap: reportText(item?.gap, 360),
        action: reportText(item?.action, 420)
      }))
    },
    dueDiligencePlan: {
      summary: reportText(analysis?.dueDiligencePlan?.summary, 500),
      tasks: objectList(analysis?.dueDiligencePlan?.tasks, 12, (item) => ({
        owner: reportText(item?.owner, 80),
        priority: ["high", "medium", "low"].includes(item?.priority) ? item.priority : "medium",
        status: ["required", "verify", "optional", "done"].includes(item?.status) ? item.status : "required",
        label: reportText(item?.label, 140),
        action: reportText(item?.action, 400)
      }))
    },
    executionPlan: {
      summary: reportText(analysis?.executionPlan?.summary, 600),
      posture: reportText(analysis?.executionPlan?.posture, 80),
      openingAnchor: reportText(analysis?.executionPlan?.openingAnchor, 80),
      maximumOffer: reportText(analysis?.executionPlan?.maximumOffer, 80),
      walkAway: reportText(analysis?.executionPlan?.walkAway, 500),
      actions: objectList(analysis?.executionPlan?.actions, 12, (item) => ({
        lane: reportText(item?.lane, 80),
        status: ["clear", "verify", "caution", "stop"].includes(item?.status) ? item.status : "verify",
        label: reportText(item?.label, 140),
        action: reportText(item?.action, 420)
      })),
      basis: reportList(analysis?.executionPlan?.basis, 6)
    },
    learningLoop: {
      summary: reportText(analysis?.learningLoop?.summary, 500),
      memoryCount: Math.max(0, Number(analysis?.learningLoop?.memoryCount || 0)),
      journalCount: Math.max(0, Number(analysis?.learningLoop?.journalCount || 0)),
      profile: {
        status: ["empty", "building"].includes(analysis?.learningLoop?.profile?.status) ? analysis.learningLoop.profile.status : "empty",
        approvedCount: Math.max(0, Number(analysis?.learningLoop?.profile?.approvedCount || 0)),
        investorType: reportText(analysis?.learningLoop?.profile?.investorType, 120),
        riskStyle: reportText(analysis?.learningLoop?.profile?.riskStyle, 120),
        preferredAssets: reportList(analysis?.learningLoop?.profile?.preferredAssets, 4),
        avoidedRisks: reportList(analysis?.learningLoop?.profile?.avoidedRisks, 5),
        cashFlowRule: reportText(analysis?.learningLoop?.profile?.cashFlowRule, 220),
        holdingPeriod: reportText(analysis?.learningLoop?.profile?.holdingPeriod, 120),
        personalWarnings: reportList(analysis?.learningLoop?.profile?.personalWarnings, 4),
        investmentRules: reportList(analysis?.learningLoop?.profile?.investmentRules, 5),
        marketBeliefs: reportList(analysis?.learningLoop?.profile?.marketBeliefs, 4),
        lessons: reportList(analysis?.learningLoop?.profile?.lessons, 4),
        completeness: Math.max(0, Math.min(100, Number(analysis?.learningLoop?.profile?.completeness || 0))),
        summary: reportText(analysis?.learningLoop?.profile?.summary, 500)
      },
      signals: objectList(analysis?.learningLoop?.signals, 8, (item) => ({
        type: ["memory", "journal"].includes(item?.type) ? item.type : "memory",
        id: reportText(item?.id, 100),
        label: reportText(item?.label, 120),
        body: reportText(item?.body, 600),
        action: reportText(item?.action, 300)
      }))
    },
    personalizedChallenge: {
      status: ["inactive", "reminder", "challenge", "hard"].includes(analysis?.personalizedChallenge?.status) ? analysis.personalizedChallenge.status : "inactive",
      label: reportText(analysis?.personalizedChallenge?.label, 120),
      message: reportText(analysis?.personalizedChallenge?.message, 900),
      profileBasis: reportText(analysis?.personalizedChallenge?.profileBasis, 500),
      checks: objectList(analysis?.personalizedChallenge?.checks, 6, (item) => ({
        label: reportText(item?.label, 140),
        status: ["clear", "check", "warning", "hard"].includes(item?.status) ? item.status : "check",
        action: reportText(item?.action, 420)
      }))
    },
    dealMemoryComparison: {
      status: ["none", "matched", "watch"].includes(analysis?.dealMemoryComparison?.status) ? analysis.dealMemoryComparison.status : "none",
      summary: reportText(analysis?.dealMemoryComparison?.summary, 700),
      matches: objectList(analysis?.dealMemoryComparison?.matches, 5, (item) => ({
        id: reportText(item?.id, 100),
        subject: reportText(item?.subject, 160),
        verdict: reportText(item?.verdict, 40),
        savedAt: reportText(item?.savedAt, 40),
        similarity: Math.max(0, Math.min(100, Number(item?.similarity || 0))),
        reason: reportText(item?.reason, 420),
        action: reportText(item?.action, 420)
      }))
    },
    beliefTracker: {
      status: ["inactive", "tracking", "review"].includes(analysis?.beliefTracker?.status) ? analysis.beliefTracker.status : "inactive",
      summary: reportText(analysis?.beliefTracker?.summary, 700),
      beliefs: objectList(analysis?.beliefTracker?.beliefs, 8, (item) => ({
        label: reportText(item?.label, 160),
        status: ["confirmed", "uncertain", "challenged", "retired"].includes(item?.status) ? item.status : "uncertain",
        basis: reportText(item?.basis, 420),
        action: reportText(item?.action, 420)
      }))
    },
    sourceTransparency: {
      mode: reportText(analysis?.sourceTransparency?.mode, 80),
      summary: reportText(analysis?.sourceTransparency?.summary, 700),
      sources: objectList(analysis?.sourceTransparency?.sources, 8, (item) => ({
        type: ["framework", "ai", "memory", "journal", "saved_deal", "market", "evidence", "case"].includes(item?.type) ? item.type : "framework",
        label: reportText(item?.label, 140),
        status: ["used", "available", "not_used"].includes(item?.status) ? item.status : "used",
        detail: reportText(item?.detail, 420)
      }))
    },
    memoryConflicts: {
      status: ["clear", "review", "inactive"].includes(analysis?.memoryConflicts?.status) ? analysis.memoryConflicts.status : "inactive",
      summary: reportText(analysis?.memoryConflicts?.summary, 700),
      conflicts: objectList(analysis?.memoryConflicts?.conflicts, 6, (item) => ({
        label: reportText(item?.label, 140),
        status: ["clear", "review", "stale"].includes(item?.status) ? item.status : "review",
        memoryA: reportText(item?.memoryA, 420),
        memoryB: reportText(item?.memoryB, 420),
        action: reportText(item?.action, 420)
      }))
    },
    personalOperatingRules: {
      status: ["clear", "check", "warning", "hard"].includes(analysis?.personalOperatingRules?.status) ? analysis.personalOperatingRules.status : "check",
      summary: reportText(analysis?.personalOperatingRules?.summary, 700),
      rules: objectList(analysis?.personalOperatingRules?.rules, 8, (item) => ({
        label: reportText(item?.label, 160),
        status: ["clear", "check", "warning", "hard"].includes(item?.status) ? item.status : "check",
        basis: reportText(item?.basis, 420),
        action: reportText(item?.action, 420)
      }))
    },
    hardStops: reportList(analysis.hardStops),
    recommendationBlockers: reportList(analysis.recommendationBlockers),
    watchouts: reportList(analysis.watchouts),
    missingEvidence: reportList(analysis.missingEvidence),
    nextActions: reportList(analysis.nextActions),
    developmentIntelligence: normalizeReportDevelopmentIntelligence(analysis.developmentIntelligence),
    caseIntelligence: normalizeReportCaseIntelligence(analysis.caseIntelligence),
    documentIntelligence: normalizeReportDocumentIntelligence(analysis.documentIntelligence),
    portfolioCommand: normalizeReportPortfolioCommand(analysis.portfolioCommand),
    finalCommand: normalizeReportFinalCommand(analysis.finalCommand),
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
  return { version: 3, documents: [], chunks: [], retrievalEvents: [], projects: [], observations: [], developmentCases: [] };
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

const CASE_VERDICTS = new Set(["strong_buy", "shortlist", "watch", "avoid", "unknown"]);
const CASE_CONFIDENCE_LEVELS = new Set(["high", "medium", "low"]);

function normalizeDevelopmentCase(input = {}, projectIds = new Set()) {
  const now = new Date().toISOString();
  const projectId = cleanMarketText(input?.projectId, 100);
  const verdict = String(input?.verdict || "watch").toLowerCase();
  const confidence = String(input?.confidence || "medium").toLowerCase();
  const projectName = cleanMarketText(input?.projectName || input?.name, 160);
  if (!projectName) return null;
  return {
    id: cleanMarketText(input?.id || randomUUID(), 100),
    projectId: projectIds.has(projectId) ? projectId : "",
    projectName,
    area: cleanMarketText(input?.area, 120),
    state: cleanMarketText(input?.state, 80),
    propertyType: cleanMarketText(input?.propertyType, 80),
    developer: cleanMarketText(input?.developer, 120),
    priceSegment: cleanMarketText(input?.priceSegment, 120),
    targetBuyer: cleanMarketText(input?.targetBuyer, 220),
    targetTenant: cleanMarketText(input?.targetTenant, 220),
    strengths: cleanMarketText(input?.strengths, 1200),
    weaknesses: cleanMarketText(input?.weaknesses, 1200),
    managementView: cleanMarketText(input?.managementView, 900),
    residentProfile: cleanMarketText(input?.residentProfile, 900),
    supplyThreat: cleanMarketText(input?.supplyThreat, 900),
    rentalOutlook: cleanMarketText(input?.rentalOutlook, 900),
    resaleOutlook: cleanMarketText(input?.resaleOutlook, 900),
    ownerVerdict: cleanMarketText(input?.ownerVerdict || input?.notes, 1200),
    verdict: CASE_VERDICTS.has(verdict) ? verdict : "watch",
    confidence: CASE_CONFIDENCE_LEVELS.has(confidence) ? confidence : "medium",
    rating: Math.max(0, Math.min(100, Math.round(Number(input?.rating || 0)))),
    sourceBasis: cleanMarketText(input?.sourceBasis, 500),
    tags: Array.isArray(input?.tags)
      ? [...new Set(input.tags.map((tag) => cleanMarketText(tag, 60)).filter(Boolean))].slice(0, 20)
      : [],
    observedAt: cleanMarketDate(input?.observedAt, now),
    createdAt: cleanMarketDate(input?.createdAt, now),
    updatedAt: cleanMarketDate(input?.updatedAt || input?.createdAt, now)
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
  const developmentCases = Array.isArray(knowledge?.developmentCases)
    ? knowledge.developmentCases
      .map((item) => normalizeDevelopmentCase(item, projectIds))
      .filter(Boolean)
      .slice(-2000)
    : [];
  return { version: 3, documents, chunks, retrievalEvents, projects, observations, developmentCases };
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
  const title = String(session.title || DEFAULT_SESSION_TITLE).trim();
  return {
    id: String(session.id),
    createdAt: String(session.createdAt || new Date().toISOString()),
    updatedAt: String(session.updatedAt || session.createdAt || new Date().toISOString()),
    title: defaultSessionTitle(title) ? DEFAULT_SESSION_TITLE : title,
    clientId: String(session.clientId || "browser").trim(),
    userId: String(session.userId || "").trim(),
    messages
  };
}

function normalizeJarvisMessage(message) {
  if (!message?.role || !message?.content) return null;
  const contextCoach = message.contextCoach && typeof message.contextCoach === "object"
    ? {
      title: String(message.contextCoach.title || "").trim().slice(0, 120),
      summary: String(message.contextCoach.summary || "").trim().slice(0, 500),
      missing: Array.isArray(message.contextCoach.missing) ? message.contextCoach.missing.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 6) : [],
      prompts: Array.isArray(message.contextCoach.prompts)
        ? message.contextCoach.prompts.map((item) => ({
          label: String(item?.label || "").trim().slice(0, 80),
          text: String(item?.text || "").trim().slice(0, 500),
          kind: String(item?.kind || "question").trim().slice(0, 40)
        })).filter((item) => item.label && item.text).slice(0, 4)
        : []
    }
    : null;
  return {
    id: String(message.id || randomUUID()),
    role: message.role === "user" ? "user" : "jarvis",
    content: String(message.content).trim(),
    createdAt: String(message.createdAt || new Date().toISOString()),
    mode: ["framework", "llm"].includes(message.mode) ? message.mode : "",
    provider: String(message.provider || "").trim().slice(0, 40),
    model: String(message.model || "").trim().slice(0, 160),
    sources: Array.isArray(message.sources) ? message.sources.slice(0, 8) : [],
    contextCoach: contextCoach?.prompts.length || contextCoach?.missing.length ? contextCoach : null
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

function memoryCategoryLabel(category) {
  return MEMORY_CATEGORY_LABELS[category] || "General";
}

function memoryReviewPriority(item) {
  const text = String(item?.content || "").toLowerCase();
  if (["personal_warning", "mistake", "constraint"].includes(item?.category)) return "high";
  if (/\b(?:must|never|avoid|reject|risk|warning|mistake|trap|cash flow|installment|loan|caveat|title)\b/.test(text)) return "high";
  if (["investment_rule", "market_belief", "lesson"].includes(item?.category)) return "medium";
  return "normal";
}

function memoryProfileImpact(item) {
  const category = item?.category || "general";
  if (category === "preference") return "Shapes asset fit and future recommendations.";
  if (category === "constraint") return "Limits what Apex should treat as suitable.";
  if (category === "lesson") return "Improves future checks and challenge mode.";
  if (category === "mistake") return "Becomes a warning against repeat errors.";
  if (category === "investment_rule") return "Can become a personal operating rule.";
  if (category === "market_belief") return "Should be tested against future evidence.";
  if (category === "personal_warning") return "Triggers stronger challenge mode when similar risk appears.";
  if (category === "goal") return "Aligns recommendations with the user's investment mandate.";
  if (category === "decision") return "Preserves a chosen direction for future comparison.";
  return "Useful context, but may need a clearer category.";
}

function publicMemoryItem(item) {
  return {
    id: item.id,
    category: item.category,
    categoryLabel: memoryCategoryLabel(item.category),
    reviewPriority: memoryReviewPriority(item),
    profileImpact: memoryProfileImpact(item),
    content: item.content,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    reviewedAt: item.reviewedAt
  };
}

function answerStyleStats(answerStyle) {
  const normalized = normalizeAnswerStyle(answerStyle);
  return normalized.feedback.reduce((stats, item) => {
    stats[item.value] = (stats[item.value] || 0) + 1;
    return stats;
  }, {});
}

function answerStylePrompt(answerStyle) {
  const normalized = normalizeAnswerStyle(answerStyle);
  if (!normalized.feedback.length) return "";
  const latest = normalized.feedback[0];
  const stats = answerStyleStats(normalized);
  const pattern = Object.entries(ANSWER_STYLE_FEEDBACK)
    .map(([key, option]) => stats[key] ? `${option.label}: ${stats[key]}` : "")
    .filter(Boolean)
    .join(", ");
  return [
    latest?.note ? `Stored account answer-style feedback: ${latest.note}` : "",
    pattern ? `Account feedback pattern: ${pattern}.` : ""
  ].filter(Boolean).join(" ");
}

function publicAnswerStyle(answerStyle) {
  const normalized = normalizeAnswerStyle(answerStyle);
  const latest = normalized.feedback[0] || null;
  return {
    feedbackCount: normalized.feedback.length,
    latestLabel: latest?.label || "",
    latestNote: latest?.note || "",
    summary: answerStylePrompt(normalized),
    updatedAt: normalized.updatedAt
  };
}

function publicMemorySettings(memory) {
  const normalized = normalizeUserMemory(memory);
  const settings = normalized.settings;
  return {
    captureEnabled: settings.captureEnabled,
    reasoningEnabled: settings.reasoningEnabled,
    answerStyle: publicAnswerStyle(normalized.answerStyle)
  };
}

function uniqueProfileValues(values = [], limit = 5) {
  const seen = new Set();
  const clean = [];
  for (const value of values) {
    const text = reportText(value, 180);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    clean.push(text);
    if (clean.length >= limit) break;
  }
  return clean;
}

function firstMatchingMemory(memories, pattern) {
  return memories.find((item) => pattern.test(item.content))?.content || "";
}

function memorySnippets(memories, categories = [], pattern = null, limit = 4) {
  return uniqueProfileValues(memories
    .filter((item) => (!categories.length || categories.includes(item.category)) && (!pattern || pattern.test(item.content)))
    .map((item) => item.content), limit);
}

function extractHoldingPeriod(memories) {
  const match = memories.map((item) => item.content).join(" ").match(/\b(?:hold|holding period|exit|dispose|sell)[^.\n]{0,80}?\b(\d{1,2}(?:\s*(?:-|to)\s*\d{1,2})?)\s*(?:year|years|yr|yrs)\b/i);
  return match ? `${match[1].replace(/\s+/g, " ")} years` : "";
}

function inferInvestorType(memories) {
  const text = memories.map((item) => item.content).join(" ").toLowerCase();
  if (!text) return "Unknown";
  if (/\b(?:seasoned|experienced|multiple properties|portfolio|scale|refinance|cash out)\b/.test(text)) return "Scaling investor";
  if (/\b(?:retail|beginner|normal investor|first property|limited cash)\b/.test(text)) return "Retail investor";
  if (/\b(?:cash rich|cash reserve|high cash|negative cash flow|landed appreciation)\b/.test(text)) return "Capital-backed investor";
  return "Profile building";
}

function inferRiskStyle(memories) {
  const text = memories.map((item) => item.content).join(" ").toLowerCase();
  if (!text) return "Unknown";
  if (/\b(?:avoid|reject|must|cash reserve|cover installment|site visit|legal|caveat|management)\b/.test(text)) return "Evidence-led cautious";
  if (/\b(?:aggressive|leverage|cash out|refinance|scale|fast|same day)\b/.test(text)) return "Opportunistic but needs guardrails";
  if (/\b(?:balanced|both|own stay and investor|cash flow and appreciation)\b/.test(text)) return "Balanced";
  return "Needs more approved memory";
}

function buildInvestorMemoryProfile(memory) {
  const normalized = normalizeUserMemory(memory);
  const approved = normalized.items
    .filter((item) => item.status === "approved")
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  const preferredAssets = uniqueProfileValues([
    ...memorySnippets(approved, ["preference"], /\b(?:prefer|like|target|go for|freehold|condo|serviced|landed|high-rise|residential)\b/i, 4),
    firstMatchingMemory(approved, /\b(?:freehold|condo|serviced apartment|landed|residential|high-rise)\b/i)
  ], 4);
  const avoidedRisks = uniqueProfileValues([
    ...memorySnippets(approved, ["constraint", "personal_warning", "mistake"], /\b(?:avoid|reject|refuse|risk|warning|mistake|trap|poor|bad|weak|caveat|title|management|cash flow|supply)\b/i, 5),
    firstMatchingMemory(approved, /\b(?:avoid|reject|refuse|poor management|low income|factory worker|caveat|bulk purchase|overleverage)\b/i)
  ], 5);
  const cashFlowRule = firstMatchingMemory(approved, /\b(?:rent|rental|cash flow|installment|instalment|maintenance|negative cash flow|yield)\b/i);
  const holdingPeriod = extractHoldingPeriod(approved);
  const personalWarnings = memorySnippets(approved, ["personal_warning", "mistake"], null, 4);
  const investmentRules = memorySnippets(approved, ["investment_rule", "constraint"], null, 5);
  const marketBeliefs = memorySnippets(approved, ["market_belief"], null, 4);
  const lessons = memorySnippets(approved, ["lesson", "experience", "mistake"], null, 4);
  const fields = [
    preferredAssets.length,
    avoidedRisks.length,
    cashFlowRule,
    holdingPeriod,
    personalWarnings.length,
    investmentRules.length,
    marketBeliefs.length || lessons.length
  ].filter(Boolean).length;
  return {
    version: 1,
    status: approved.length ? "building" : "empty",
    approvedCount: approved.length,
    investorType: inferInvestorType(approved),
    riskStyle: inferRiskStyle(approved),
    preferredAssets,
    avoidedRisks,
    cashFlowRule: reportText(cashFlowRule || "Not enough approved memory yet.", 220),
    holdingPeriod: holdingPeriod || "Not enough approved memory yet.",
    personalWarnings,
    investmentRules,
    marketBeliefs,
    lessons,
    completeness: Math.round((fields / 7) * 100),
    summary: approved.length
      ? `Built from ${approved.length} approved memor${approved.length === 1 ? "y" : "ies"}. Treat this as personal context, not market evidence.`
      : "No approved memories yet. The profile will build only after the user approves memory.",
    updatedAt: approved[0]?.updatedAt || ""
  };
}

function memorySummary(memory) {
  const normalized = normalizeUserMemory(memory);
  const items = normalized.items;
  const byCategory = items.filter((item) => item.status !== "dismissed").reduce((summary, item) => {
    summary[item.category] = (summary[item.category] || 0) + 1;
    return summary;
  }, {});
  return {
    pending: items.filter((item) => item.status === "pending").length,
    approved: items.filter((item) => item.status === "approved").length,
    byCategory,
    captureEnabled: normalized.settings.captureEnabled,
    reasoningEnabled: normalized.settings.reasoningEnabled,
    answerStyle: publicAnswerStyle(normalized.answerStyle)
  };
}

function approvedAnswerStyleFeedback(user) {
  const memory = normalizeUserMemory(user?.memory);
  if (!memory.settings.reasoningEnabled) return "";
  return answerStylePrompt(memory.answerStyle);
}

function memoryCategory(content) {
  const text = String(content || "").toLowerCase();
  if (/\b(?:warning|warn me|remind me|fomo|greedy|emotionally chasing|chasing emotionally|overexcited|manipulated)\b/.test(text)) return "personal_warning";
  if (/\b(?:mistake|regret|overlooked|overlook|wrong|trap|trapped|failed|lesson from my mistake)\b/.test(text)) return "mistake";
  if (/\b(?:rule|always|never|must|should reject|walk away|hard stop|do not buy|don't buy|cannot proceed)\b/.test(text)) return "investment_rule";
  if (/\b(?:learned|lesson|noticed|observed|found|from my experience)\b/.test(text)) return "lesson";
  if (/\b(?:prefer|avoid|refuse|favourite|favorite|like|target)\b/.test(text)) return "preference";
  if (/\b(?:i believe|market belief|buyer|tenant|demand|supply|penang|kuala lumpur|kl|selangor|leasehold|freehold|area|market)\b/.test(text)) return "market_belief";
  if (/\b(?:goal|target|aim|plan|priority)\b/.test(text)) return "goal";
  if (/\b(?:budget|cannot|can't|must|need|limit|constraint|reserve)\b/.test(text)) return "constraint";
  if (/\b(?:experience)\b/.test(text)) return "experience";
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
  const memory = normalizeUserMemory(user?.memory);
  if (!memory.settings.reasoningEnabled) return [];
  return memory.items.filter((item) => item.status === "approved");
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
  const chain = String(req.headers["x-forwarded-for"] || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (chain.length) {
    // Trust only the hop(s) our own proxy appends; everything to the left is
    // client-controlled, so count from the right to prevent X-Forwarded-For spoofing.
    const index = Math.max(0, chain.length - TRUSTED_PROXY_HOPS);
    return chain[index] || chain[chain.length - 1];
  }
  return String(req.socket?.remoteAddress || "unknown");
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

function caseVerdictLabel(verdict = "watch") {
  return {
    strong_buy: "Strong Buy",
    shortlist: "Shortlist",
    watch: "Watch",
    avoid: "Avoid",
    unknown: "Unknown"
  }[verdict] || "Watch";
}

function publicDevelopmentCase(item, score = 0) {
  const summaryParts = [
    item.ownerVerdict,
    item.strengths ? `Strengths: ${item.strengths}` : "",
    item.weaknesses ? `Weaknesses: ${item.weaknesses}` : "",
    item.rentalOutlook ? `Rental: ${item.rentalOutlook}` : "",
    item.resaleOutlook ? `Resale: ${item.resaleOutlook}` : ""
  ].filter(Boolean);
  return {
    id: item.id,
    projectName: item.projectName,
    area: item.area,
    state: item.state,
    propertyType: item.propertyType,
    developer: item.developer,
    priceSegment: item.priceSegment,
    targetBuyer: item.targetBuyer,
    targetTenant: item.targetTenant,
    strengths: item.strengths,
    weaknesses: item.weaknesses,
    managementView: item.managementView,
    residentProfile: item.residentProfile,
    supplyThreat: item.supplyThreat,
    rentalOutlook: item.rentalOutlook,
    resaleOutlook: item.resaleOutlook,
    ownerVerdict: item.ownerVerdict,
    verdict: item.verdict,
    verdictLabel: caseVerdictLabel(item.verdict),
    confidence: item.confidence,
    rating: item.rating,
    sourceBasis: item.sourceBasis,
    tags: item.tags,
    observedAt: item.observedAt,
    updatedAt: item.updatedAt,
    score,
    summary: conciseText(summaryParts.join(" "), 700)
  };
}

function selectDevelopmentCaseIntelligence(query, knowledge = emptyKnowledge(), limit = 5) {
  const terms = tokenize(query);
  const cases = Array.isArray(knowledge.developmentCases) ? knowledge.developmentCases : [];
  if (!terms.length || !cases.length) {
    return {
      version: "case-v1",
      status: "thin",
      score: 0,
      matched: 0,
      summary: "No matching owner development case has been recorded yet.",
      posture: "Build case library",
      cases: [],
      actionQueue: [{ label: "Case library gap", status: "missing", action: "Add a founder case note for this project or area before treating Apex as project-specific intelligence." }]
    };
  }
  const ranked = cases
    .map((item) => {
      const searchText = [
        item.projectName, item.area, item.state, item.propertyType, item.developer, item.priceSegment,
        item.targetBuyer, item.targetTenant, item.strengths, item.weaknesses, item.managementView,
        item.residentProfile, item.supplyThreat, item.rentalOutlook, item.resaleOutlook, item.ownerVerdict,
        item.sourceBasis, item.tags?.join(" ")
      ].filter(Boolean).join(" ");
      return { item, score: termScore(terms, searchText) };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || Number(right.item.rating || 0) - Number(left.item.rating || 0))
    .slice(0, Math.max(1, Math.min(12, limit)));
  const publicCases = ranked.map(({ item, score }) => publicDevelopmentCase(item, score));
  const avoidCount = publicCases.filter((item) => item.verdict === "avoid").length;
  const positiveCount = publicCases.filter((item) => ["strong_buy", "shortlist"].includes(item.verdict)).length;
  const highConfidenceCount = publicCases.filter((item) => item.confidence === "high").length;
  const score = publicCases.length
    ? clampScore(publicCases.reduce((sum, item) => sum + (item.rating || (item.verdict === "avoid" ? 25 : item.verdict === "watch" ? 55 : 75)), 0) / publicCases.length)
    : 0;
  const status = !publicCases.length
    ? "thin"
    : avoidCount
      ? "risk"
      : positiveCount && highConfidenceCount
        ? "tracked"
        : positiveCount
          ? "partial"
          : "watch";
  const strongest = publicCases[0];
  const actionQueue = [];
  if (!publicCases.length) {
    actionQueue.push({ label: "No case match", status: "missing", action: "Add a case note for this project, closest substitute, or micro-area." });
  } else {
    actionQueue.push({ label: "Founder case review", status: status === "risk" ? "risk" : "watch", action: "Use the matched case as an opinion layer, then verify it against current transactions, rent, site condition, and supply." });
    if (avoidCount) actionQueue.push({ label: "Avoid case conflict", status: "risk", action: "A matched owner case says avoid. Require new evidence before overriding the old view." });
    if (!publicCases.some((item) => item.managementView)) actionQueue.push({ label: "Management gap", status: "missing", action: "Add management/JMB and resident-culture notes to make the case more useful." });
  }
  return {
    version: "case-v1",
    status,
    score,
    matched: publicCases.length,
    summary: publicCases.length
      ? `${publicCases.length} owner development case${publicCases.length === 1 ? "" : "s"} matched. Strongest read: ${strongest.projectName} is ${strongest.verdictLabel.toLowerCase()} with ${strongest.confidence} confidence.`
      : "No matching owner development case has been recorded yet.",
    posture: status === "tracked" ? "Case-backed" : status === "risk" ? "Founder warning active" : publicCases.length ? "Case-informed, verify live" : "Build case library",
    cases: publicCases,
    actionQueue
  };
}

function developmentCaseSources(caseIntelligence) {
  return (caseIntelligence?.cases || []).slice(0, 6).map((item) => ({
    id: item.id,
    title: `${item.projectName} founder case`,
    type: "case",
    preview: conciseText(item.summary || item.ownerVerdict || item.strengths || "Owner development case", 180),
    score: item.score,
    verdict: item.verdict,
    confidence: item.confidence,
    observedAt: item.observedAt
  }));
}

function developmentCaseCoverage(cases = [], now = Date.now()) {
  const areas = new Set();
  const projects = new Set();
  let highConfidence = 0;
  let stale = 0;
  let incomplete = 0;
  let missingManagement = 0;
  let missingSupply = 0;
  let missingRental = 0;
  let missingResale = 0;
  for (const item of cases) {
    if (item.projectName) projects.add(item.projectName.toLowerCase());
    if (item.area) areas.add(item.area.toLowerCase());
    if (item.confidence === "high") highConfidence += 1;
    const observedAt = Date.parse(item.observedAt || "");
    if (Number.isFinite(observedAt) && Math.floor((now - observedAt) / 86400000) > 365) stale += 1;
    const gaps = [
      item.managementView,
      item.residentProfile,
      item.supplyThreat,
      item.rentalOutlook,
      item.resaleOutlook,
      item.sourceBasis
    ].filter((value) => !String(value || "").trim());
    if (gaps.length) incomplete += 1;
    if (!String(item.managementView || "").trim()) missingManagement += 1;
    if (!String(item.supplyThreat || "").trim()) missingSupply += 1;
    if (!String(item.rentalOutlook || "").trim()) missingRental += 1;
    if (!String(item.resaleOutlook || "").trim()) missingResale += 1;
  }
  return {
    projects: projects.size,
    areas: areas.size,
    highConfidence,
    stale,
    incomplete,
    missingManagement,
    missingSupply,
    missingRental,
    missingResale
  };
}

function developmentCaseIntelligenceForPrompt(caseIntelligence) {
  if (!caseIntelligence?.cases?.length) return "No matching owner development case.";
  return [
    `Summary: ${caseIntelligence.summary}`,
    ...caseIntelligence.cases.slice(0, 4).map((item) => `- ${item.projectName} / ${caseVerdictLabel(item.verdict)} / ${item.confidence} confidence: ${item.summary || item.ownerVerdict || "Case recorded."}`)
  ].join("\n");
}

function developmentIntelligenceStatus(score, missingCount, riskCount, observationCount) {
  if (riskCount >= 2) return "risk";
  if (score >= 78 && observationCount) return "tracked";
  if (score >= 62) return missingCount ? "partial" : "tracked";
  if (score >= 42) return "thin";
  return "risk";
}

function laneStatusScore(status) {
  return {
    proven: 92,
    clear: 90,
    tracked: 88,
    usable: 76,
    partial: 66,
    watch: 58,
    thin: 42,
    missing: 24,
    risk: 12,
    action: 46
  }[status] ?? 50;
}

function evidenceStatusToDevelopmentStatus(status) {
  if (["strong", "ready", "proven", "clear", "usable"].includes(status)) return "clear";
  if (["thin", "conditional", "review", "watch", "partial", "unknown"].includes(status)) return "watch";
  if (["unsafe", "blocked", "fail", "risk"].includes(status)) return "risk";
  return "missing";
}

function observationMetricCount(observations = [], metricType) {
  return observations.filter((item) => item.metricType === metricType).length;
}

function observationTextForMetrics(observations = [], metricTypes = []) {
  return observations
    .filter((item) => metricTypes.includes(item.metricType))
    .map((item) => `${item.title}: ${item.notes || item.body || "Observation recorded"}`)
    .join(" ")
    .toLowerCase();
}

function trendDirectionFor(trends = [], metricTypes = []) {
  const matched = trends.filter((trend) => metricTypes.includes(trend.metricType));
  if (matched.some((trend) => trend.direction === "down")) return "down";
  if (matched.some((trend) => trend.direction === "up")) return "up";
  if (matched.some((trend) => trend.direction === "stable")) return "stable";
  return "";
}

function buildDevelopmentIntelligence(analysis = {}) {
  const deal = analysis.context?.dealCard || {};
  const market = analysis.marketIntelligence || {};
  const observations = Array.isArray(market.observations) ? market.observations : [];
  const trends = Array.isArray(market.trends) ? market.trends : [];
  const summary = market.summary || {};
  const subject = deal.projectName || deal.area || "this development";
  const fieldText = signalText(
    deal.projectName,
    deal.area,
    deal.propertyType,
    deal.tenure,
    deal.legalTitleType,
    deal.supplyRadius,
    deal.substituteCount,
    deal.substituteThreat,
    deal.futureSupplyTiming,
    deal.absorptionEvidence,
    deal.unsoldStockSignal,
    deal.densityLiftStress,
    deal.supplyNotes,
    deal.nearbySupply,
    deal.managementQuality,
    deal.managementResponseSignal,
    deal.arrearsJmbSignal,
    deal.residentBehaviourSignal,
    deal.siteManagementNotes,
    deal.comparableTransactions,
    deal.comparableSource,
    deal.comparableRecency,
    deal.rentEvidence,
    deal.rentalSource,
    deal.tenantUrgency,
    deal.vacancySignal,
    deal.rentalSustainability,
    deal.exitBuyerPool,
    deal.ownStayAppeal,
    deal.resalePreparation,
    deal.investmentThesis,
    deal.mainConcern
  );
  const supplyText = `${fieldText} ${observationTextForMetrics(observations, ["supply", "unsold_stock", "launch_sales"])}`;
  const rentText = `${fieldText} ${observationTextForMetrics(observations, ["rent", "rental_enquiry", "occupancy"])}`;
  const liquidityText = `${fieldText} ${observationTextForMetrics(observations, ["transaction", "auction", "buyer_sentiment", "financing"])}`;
  const managementText = `${fieldText} ${observationTextForMetrics(observations, ["management"])}`;
  const catalystText = `${fieldText} ${observationTextForMetrics(observations, ["catalyst", "launch_sales", "buyer_sentiment"])}`;
  const supplyRisk = hasSignal(supplyText, [/high threat/, /oversupply/, /many/, /5 or more/, /unsold/, /vp/, /vacant possession/, /similar layout/, /lift.*wait/, /dense/, /1\.5k/]);
  const rentRisk = hasSignal(rentText, [/rent.*drop/, /rental.*drop/, /no enquiry/, /no inquiry/, /vacancy/, /slow enquiry/, /incentive/, /temporary/, /weak/]) || trendDirectionFor(trends, ["rent", "rental_enquiry", "occupancy"]) === "down";
  const liquidityRisk = hasSignal(liquidityText, [/hard to sell/, /weak resale/, /auction/, /distress/, /financing concern/, /low transaction/, /thin liquidity/, /buyer.*unable/]);
  const managementRisk = hasSignal(managementText, [/weak/, /poor/, /no reply/, /arrears/, /dispute/, /complaint/, /leak/, /defect/, /irresponsible/, /bad/]);
  const catalystRisk = hasSignal(catalystText, [/delayed/, /slow sales/, /weak absorption/, /discount/, /bulk purchase/, /clear inventory/, /speculative/]);
  const hasCoreIdentity = Boolean(deal.projectName && deal.area && deal.propertyType);
  const hasPriceValue = Boolean(deal.askingPrice && (deal.conservativeFairValue || analysis.transactionComparableEvidence?.status === "strong"));
  const ownerObservationStatus = observations.length >= 3 && !summary.stale
    ? "clear"
    : observations.length
      ? summary.stale ? "watch" : "partial"
      : "missing";
  const lanes = [
    {
      version: "V7.1",
      label: "Project identity spine",
      status: hasCoreIdentity && hasPriceValue ? "clear" : hasCoreIdentity ? "watch" : "missing",
      reading: hasCoreIdentity
        ? `${subject} has enough identity to be tracked as a development profile.`
        : "Project, area, and product segment are not complete enough for project-level memory.",
      action: "Record project name, area, product type, tenure/title, asking price, and conservative value before comparing developments."
    },
    {
      version: "V7.2",
      label: "Substitute supply radar",
      status: supplyRisk ? "risk" : evidenceStatusToDevelopmentStatus(analysis.supplyAbsorptionEvidence?.status),
      reading: supplyRisk
        ? "Nearby supply, unsold stock, VP timing, density, or similar-layout competition may pressure this project."
        : analysis.supplyAbsorptionEvidence?.competitionPosition || "Supply evidence is not yet deep enough for a confident radar.",
      action: "Track direct substitutes within 2.5km, layout overlap, pricing, VP batches, unsold stock, occupancy, and lift-density pressure."
    },
    {
      version: "V7.3",
      label: "Rental direction watch",
      status: rentRisk ? "risk" : evidenceStatusToDevelopmentStatus(analysis.achievedRentalEvidence?.status),
      reading: rentRisk
        ? "Rental direction has pressure signals from enquiries, vacancy, incentives, or matched rent trends."
        : analysis.achievedRentalEvidence?.coveragePosition || "Rental direction needs achieved rent, enquiry urgency, vacancy, and sustainability proof.",
      action: "Monitor achieved rent, agent enquiry volume, tenant urgency, occupancy, vacancy speed, and new supply impact before relying on yield."
    },
    {
      version: "V7.4",
      label: "Liquidity and auction watch",
      status: liquidityRisk ? "risk" : evidenceStatusToDevelopmentStatus(analysis.transactionComparableEvidence?.status),
      reading: liquidityRisk
        ? "Liquidity, auction, buyer-financing, or resale weakness needs attention before exit confidence."
        : analysis.transactionComparableEvidence?.valuePosition || "Liquidity proof needs completed transactions and auction context.",
      action: "Track completed subsale, successful auction bids, failed auctions, buyer financing friction, and time-to-sell signals by project."
    },
    {
      version: "V7.5",
      label: "Absorption and launch-sales pulse",
      status: catalystRisk ? "watch" : observationMetricCount(observations, "launch_sales") || observationMetricCount(observations, "buyer_sentiment") ? "partial" : "missing",
      reading: catalystRisk
        ? "Launch-sales or developer behaviour may be showing slower absorption, discounting, or inventory pressure."
        : observationMetricCount(observations, "launch_sales") ? "Launch-sales observations exist, but conversion quality still matters." : "No launch-sales or absorption observation is matched yet.",
      action: "Record sales rate, unsold units, discount behaviour, bulk-buyer activity, and whether crowds convert into loan-approved transactions."
    },
    {
      version: "V7.6",
      label: "Management and resident culture",
      status: managementRisk ? "risk" : evidenceStatusToDevelopmentStatus(analysis.siteManagementEvidence?.status),
      reading: managementRisk
        ? "Management, arrears, resident behaviour, defects, or complaint culture may weaken long-term project value."
        : analysis.siteManagementEvidence?.livedQualityPosition || "Management culture needs site and JMB evidence.",
      action: "Track JMB response, arrears list, sinking fund, defect handling, lift/security/cleanliness, resident complaints, and AGM culture."
    },
    {
      version: "V7.7",
      label: "Scarcity and moat score",
      status: hasSignal(fieldText, [/freehold/, /prime/, /land scarcity/, /rare view/, /low density/, /master developer/]) && !supplyRisk ? "clear" : supplyRisk ? "risk" : "watch",
      reading: supplyRisk
        ? "Scarcity is not proven while similar future supply can dilute the project."
        : "Scarcity must come from land, title, layout, view, density, access, or masterplan advantage, not marketing language alone.",
      action: "Separate real scarcity from branding: land scarcity, freehold relevance, unique layout/view, low-density advantage, school/transport access, or master-developer control."
    },
    {
      version: "V7.8",
      label: "Micro-area cycle fit",
      status: analysis.marketPulse?.status === "risk" ? "risk" : analysis.marketPulse?.status === "opportunity" ? "clear" : "watch",
      reading: analysis.marketPulse?.summary || "Market cycle evidence is not decisive yet.",
      action: "Classify the micro-area as early growth, mature, weak sentiment, saturation, or hype before treating price movement as appreciation potential."
    },
    {
      version: "V7.9",
      label: "Owner observation health",
      status: ownerObservationStatus,
      reading: observations.length
        ? `${observations.length} owner observation${observations.length === 1 ? "" : "s"} matched: ${summary.warning || "freshness not stated."}`
        : "No owner market observation matched this project or area.",
      action: "Keep project memory dated. Refresh stale rent, transaction, auction, supply, management, and buyer-sentiment observations before strong recommendations."
    },
    {
      version: "V7.10",
      label: "Market intelligence seal",
      status: "watch",
      reading: "Apex can screen the development, but the seal depends on the weakest V7 lane and live evidence freshness.",
      action: "Use the weakest lane as the next research task before negotiation, booking, refinancing, or exit planning."
    }
  ].map((lane) => ({
    ...lane,
    score: laneStatusScore(lane.status)
  }));
  const missingCount = lanes.filter((lane) => lane.status === "missing").length;
  const riskCount = lanes.filter((lane) => lane.status === "risk").length;
  let score = clampScore(lanes.reduce((sum, lane) => sum + lane.score, 0) / lanes.length);
  let status = developmentIntelligenceStatus(score, missingCount, riskCount, observations.length);
  const weakest = lanes.slice().sort((left, right) => left.score - right.score)[0];
  const actionQueue = lanes
    .filter((lane) => lane.status !== "clear" && lane.version !== "V7.10")
    .sort((left, right) => laneStatusScore(left.status) - laneStatusScore(right.status))
    .slice(0, 5)
    .map((lane) => ({ version: lane.version, label: lane.label, status: lane.status, action: lane.action }));
  lanes[lanes.length - 1] = {
    ...lanes[lanes.length - 1],
    status: riskCount ? "risk" : missingCount >= 3 ? "thin" : status === "tracked" ? "clear" : "watch",
    score: riskCount ? 25 : missingCount >= 3 ? 42 : status === "tracked" ? 90 : 62,
    reading: riskCount
      ? "The V7 seal is not ready because at least one market-development lane is risk-level."
      : missingCount >= 3
        ? "The V7 seal is thin because too many project-intelligence lanes are missing."
        : status === "tracked"
          ? "The V7 seal is usable for project-level comparison, subject to live professional and evidence checks."
          : "The V7 seal is conditional; clear the weakest lane before relying on development-level confidence."
  };
  score = clampScore(lanes.reduce((sum, lane) => sum + lane.score, 0) / lanes.length);
  status = developmentIntelligenceStatus(score, missingCount, riskCount, observations.length);
  return {
    version: "v7",
    status,
    score,
    summary: riskCount
      ? `${subject} has project-intelligence risk. Weakest lane: ${weakest.label}.`
      : missingCount
        ? `${subject} has a partial market read. Build the missing V7 lanes before treating the project as known.`
        : `${subject} has a usable development intelligence profile, subject to live evidence refresh.`,
    posture: status === "tracked" ? "Track and compare" : status === "risk" ? "Watchlist before commitment" : "Build evidence first",
    observationHealth: {
      matched: observations.length,
      fresh: Number(summary.fresh || 0),
      aging: Number(summary.aging || 0),
      stale: Number(summary.stale || 0),
      latestObservedAt: summary.latestObservedAt || ""
    },
    lanes,
    actionQueue
  };
}

function documentEvidenceText(document = {}, chunk = {}) {
  return signalText(
    document.title,
    document.filename,
    document.sourceUrl,
    ...(document.tags || []),
    chunk.content
  );
}

function documentEvidenceMatches(knowledge = emptyKnowledge(), evidenceResult = {}) {
  const documents = new Map((knowledge.documents || []).map((document) => [document.id, document]));
  const seenDocuments = new Set();
  return (evidenceResult.matches || []).map((chunk) => {
    const document = documents.get(chunk.documentId) || {};
    const documentKey = document.id || chunk.documentId || chunk.id;
    const duplicate = seenDocuments.has(documentKey);
    seenDocuments.add(documentKey);
    return {
      id: chunk.id,
      documentId: chunk.documentId,
      title: document.title || "Owner evidence",
      score: Math.round(Math.max(0, Number(chunk.score || 0)) * 100),
      preview: conciseText(chunk.content, duplicate ? 180 : 300),
      tags: document.tags || [],
      status: document.status || "stored",
      updatedAt: document.updatedAt || document.createdAt || "",
      sourceUrl: document.sourceUrl || "",
      content: chunk.content || "",
      duplicateDocument: duplicate
    };
  });
}

function matchedDocumentCount(matches = []) {
  return new Set(matches.map((item) => item.documentId || item.id).filter(Boolean)).size;
}

function evidenceMatchesFor(matches = [], patterns = []) {
  return matches.filter((match) => hasSignal(documentEvidenceText(match, match), patterns));
}

function documentLane(version, label, status, reading, action) {
  return {
    version,
    label,
    status,
    score: laneStatusScore(status),
    reading,
    action
  };
}

function documentStatusFromEvidence(sectionStatus, matches, patterns) {
  const categoryMatches = evidenceMatchesFor(matches, patterns);
  if (categoryMatches.length && ["strong", "proven", "ready", "clear"].includes(sectionStatus)) return "clear";
  if (categoryMatches.length) return "partial";
  if (["strong", "proven", "ready", "clear"].includes(sectionStatus)) return "watch";
  if (["unsafe", "blocked", "risk"].includes(sectionStatus)) return "risk";
  if (["usable", "conditional", "watch", "thin", "unknown"].includes(sectionStatus)) return "watch";
  return "missing";
}

function buildDocumentIntelligence(analysis = {}, knowledge = emptyKnowledge(), evidenceResult = {}) {
  const documents = Array.isArray(knowledge.documents) ? knowledge.documents : [];
  const indexedDocuments = documents.filter((document) => document.status === "indexed");
  const chunks = Array.isArray(knowledge.chunks) ? knowledge.chunks : [];
  const matches = documentEvidenceMatches(knowledge, evidenceResult);
  const matchedDocs = matchedDocumentCount(matches);
  const subject = analysis.context?.dealCard?.projectName || analysis.context?.dealCard?.area || "this deal";
  const latestUpdatedAt = documents.map((document) => document.updatedAt || document.createdAt || "").filter(Boolean).sort().at(-1) || "";
  const freshCutoff = Date.now() - (180 * 24 * 60 * 60 * 1000);
  const freshDocuments = documents.filter((document) => {
    const timestamp = Date.parse(document.updatedAt || document.createdAt || "");
    return Number.isFinite(timestamp) && timestamp >= freshCutoff;
  });
  const documentsWithSource = documents.filter((document) => document.sourceUrl || (document.tags || []).length);
  const transactionPatterns = [/transaction/, /transacted/, /subsale/, /auction/, /successful bid/, /brickz/, /valuation/, /comparable/];
  const rentalPatterns = [/rent/, /rental/, /tenant/, /tenancy/, /occupancy/, /vacancy/, /enquiry/, /inquiry/, /yield/];
  const financingPatterns = [/bank/, /loan/, /financing/, /valuation/, /dsr/, /ccris/, /ctos/, /legal/, /lawyer/, /title/, /caveat/, /consent/];
  const sitePatterns = [/site/, /visit/, /management/, /jmb/, /resident/, /lobby/, /lift/, /security/, /maintenance/, /defect/, /leak/];
  const legalStatus = analysis.legalTransactionEvidence?.status || "";
  const financingLegalStatus = ["unsafe", "blocked", "risk"].includes(legalStatus) ? legalStatus : analysis.financingValuationEvidence?.status;
  const lanes = [
    documentLane(
      "V8.1",
      "Evidence vault coverage",
      documents.length >= 8 && indexedDocuments.length >= 6 ? "clear" : documents.length >= 3 ? "partial" : documents.length ? "thin" : "missing",
      documents.length
        ? `${documents.length} owner evidence document${documents.length === 1 ? "" : "s"} exist, with ${indexedDocuments.length} indexed for retrieval.`
        : "No owner evidence documents are available for deal proof yet.",
      "Upload transaction, achieved rent, financing/legal, site-management, and supply evidence as dated documents before expecting strong document-backed reports."
    ),
    documentLane(
      "V8.2",
      "Retrieval match quality",
      matchedDocs >= 4 ? "clear" : matchedDocs >= 2 ? "partial" : matchedDocs === 1 ? "thin" : "missing",
      matchedDocs
        ? `${matchedDocs} evidence document${matchedDocs === 1 ? "" : "s"} matched ${subject} through ${evidenceResult.mode || "lexical"} retrieval.`
        : `No uploaded evidence document matched ${subject}.`,
      "Use project name, area, developer, rent, transaction, and legal keywords in evidence titles/tags so retrieval can find the right files."
    ),
    documentLane(
      "V8.3",
      "Transaction proof file",
      documentStatusFromEvidence(analysis.transactionComparableEvidence?.status, matches, transactionPatterns),
      analysis.transactionComparableEvidence?.summary || "Completed value proof still depends on uploaded transaction or auction evidence.",
      "Attach completed subsale, successful auction, valuation support, and comparable adjustment notes instead of relying on asking-price listings."
    ),
    documentLane(
      "V8.4",
      "Rental proof file",
      documentStatusFromEvidence(analysis.achievedRentalEvidence?.status, matches, rentalPatterns),
      analysis.achievedRentalEvidence?.summary || "Achieved rental proof still needs signed rent, agent feedback, or occupancy/enquiry evidence.",
      "Attach achieved rent, tenancy, agent rent feedback, occupancy, vacancy, and tenant-demand proof before treating yield as real."
    ),
    documentLane(
      "V8.5",
      "Financing and legal proof file",
      documentStatusFromEvidence(financingLegalStatus, matches, financingPatterns),
      analysis.financingValuationEvidence?.summary || analysis.legalTransactionEvidence?.summary || "Financing, valuation, and title proof are not yet document-backed.",
      "Attach banker valuation support, loan precheck, DSR assumptions, title status, restriction, caveat, consent, and lawyer review evidence."
    ),
    documentLane(
      "V8.6",
      "Site and management proof file",
      documentStatusFromEvidence(analysis.siteManagementEvidence?.status, matches, sitePatterns),
      analysis.siteManagementEvidence?.summary || "Site visit, JMB, maintenance, resident, and building-quality proof are not yet document-backed.",
      "Attach site-visit photos/notes, management office feedback, arrears/JMB evidence, defect records, lift/security observations, and resident-culture notes."
    ),
    documentLane(
      "V8.7",
      "Freshness and version control",
      !documents.length ? "missing" : freshDocuments.length / documents.length >= 0.65 ? "clear" : freshDocuments.length ? "watch" : "risk",
      documents.length
        ? `${freshDocuments.length} of ${documents.length} evidence document${documents.length === 1 ? "" : "s"} were updated within roughly six months.`
        : "Freshness cannot be checked without documents.",
      "Refresh stale rental, transaction, supply, and management files before using them for pricing, offer, refinancing, or exit decisions."
    ),
    documentLane(
      "V8.8",
      "Source reliability tags",
      documents.length && documentsWithSource.length / documents.length >= 0.7 ? "clear" : documentsWithSource.length ? "watch" : "missing",
      documentsWithSource.length
        ? `${documentsWithSource.length} document${documentsWithSource.length === 1 ? " has" : "s have"} source URLs or tags for auditability.`
        : "Evidence documents are not yet tagged or source-linked enough for auditability.",
      "Tag every evidence file by project, area, evidence type, date, source quality, and whether it is owner observation, agent input, transaction proof, or professional review."
    ),
    documentLane(
      "V8.9",
      "Evidence gap queue",
      (analysis.missingEvidence || []).length >= 4 ? "action" : (analysis.missingEvidence || []).length ? "watch" : "clear",
      (analysis.missingEvidence || []).length
        ? `${analysis.missingEvidence.length} missing evidence item${analysis.missingEvidence.length === 1 ? "" : "s"} still need document proof.`
        : "No major evidence gap is listed by the current report.",
      "Convert every missing evidence item into a file request: what document, who should provide it, and what decision it can change."
    ),
    documentLane(
      "V8.10",
      "Evidence confidence seal",
      "watch",
      "The V8 seal depends on the weakest document lane, not the most impressive uploaded file.",
      "Treat document-backed confidence as conditional until the weakest transaction, rent, financing/legal, site, or freshness lane is cleared."
    )
  ];
  const riskCount = lanes.filter((lane) => lane.status === "risk").length;
  const missingCount = lanes.filter((lane) => lane.status === "missing").length;
  const thinCount = lanes.filter((lane) => lane.status === "thin").length;
  const scoreWithoutSeal = clampScore(lanes.slice(0, -1).reduce((sum, lane) => sum + lane.score, 0) / Math.max(1, lanes.length - 1));
  const sealStatus = riskCount ? "risk" : missingCount >= 3 ? "thin" : scoreWithoutSeal >= 78 && matchedDocs >= 3 ? "proven" : scoreWithoutSeal >= 58 ? "partial" : "thin";
  lanes[lanes.length - 1] = {
    ...lanes[lanes.length - 1],
    status: sealStatus,
    score: laneStatusScore(sealStatus),
    reading: sealStatus === "proven"
      ? "The V8 seal is document-backed enough to explain what evidence supported the report."
      : sealStatus === "risk"
        ? "The V8 seal is blocked by a risk-level document lane."
        : sealStatus === "thin"
          ? "The V8 seal is thin because too many document lanes are missing or weak."
          : "The V8 seal is partial; useful evidence exists, but the weakest lane still controls confidence."
  };
  const score = clampScore(lanes.reduce((sum, lane) => sum + lane.score, 0) / lanes.length);
  const status = riskCount ? "risk" : score >= 78 && matchedDocs >= 3 ? "proven" : score >= 58 ? "partial" : thinCount || missingCount ? "thin" : "partial";
  const actionQueue = lanes
    .filter((lane) => !["clear", "proven"].includes(lane.status) && lane.version !== "V8.10")
    .sort((left, right) => laneStatusScore(left.status) - laneStatusScore(right.status))
    .slice(0, 5)
    .map((lane) => ({ version: lane.version, label: lane.label, status: lane.status, action: lane.action }));
  return {
    version: "v8",
    status,
    score,
    summary: status === "proven"
      ? `${subject} has usable document-backed evidence in the owner vault.`
      : status === "risk"
        ? `${subject} has evidence-vault risk. Clear the weakest document lane before relying on the report.`
        : `${subject} has only partial document backing. The report can reason, but proof still needs to be uploaded or refreshed.`,
    posture: status === "proven" ? "Document-backed" : status === "risk" ? "Do not rely until verified" : "Evidence-building mode",
    vaultHealth: {
      documents: documents.length,
      indexed: indexedDocuments.length,
      chunks: chunks.length,
      matched: matchedDocs,
      mode: evidenceResult.mode || "none",
      latestUpdatedAt
    },
    lanes,
    matchedEvidence: matches.slice(0, 8),
    actionQueue
  };
}

function documentEvidenceSources(documentIntelligence = {}) {
  return (documentIntelligence.matchedEvidence || []).slice(0, 6).map((item) => ({
    id: item.id,
    title: item.title,
    type: "evidence",
    preview: item.preview,
    score: item.score,
    documentId: item.documentId,
    tags: item.tags || [],
    status: item.status
  }));
}

function portfolioLane(version, label, status, reading, action) {
  return {
    version,
    label,
    status,
    score: laneStatusScore(status),
    reading,
    action
  };
}

function buildPortfolioCommand(analysis = {}) {
  const deal = analysis.context?.dealCard || {};
  const profile = analysis.context?.financialProfile || {};
  const price = parseAmount(deal.askingPrice);
  const rent = parseAmount(deal.expectedRent);
  const maintenance = parseAmount(deal.maintenance);
  const installment = parseAmount(deal.estimatedInstallment);
  const cashOutlay = parseAmount(deal.cashOutlay);
  const cashAvailable = parseAmount(profile.cashAvailable);
  const income = parseAmount(profile.monthlyIncome);
  const currentDebt = parseAmount(profile.currentDebt);
  const reserveMonths = parsePlainNumber(profile.cashReserveMonths);
  const existingProperties = parsePlainNumber(profile.existingProperties);
  const cashAfterPurchase = cashAvailable && cashOutlay ? cashAvailable - cashOutlay : null;
  const postDealDsr = income && installment ? ((currentDebt + installment) / income) * 100 : null;
  const holdingCashFlow = rent && installment ? rent - installment - maintenance : null;
  const stressedHolding = analysis.stressEnvelope?.stressedTrueHolding ? parsePlainNumber(analysis.stressEnvelope.stressedTrueHolding) : null;
  const reserveSurvivalMonths = analysis.stressEnvelope?.reserveSurvivalMonths ?? null;
  const portfolioRole = profile.portfolioRole || profile.investmentGoal || "Not stated";
  const concentrationText = signalText(profile.concentrationRisk, profile.existingPortfolioHealth, deal.area, deal.propertyType);
  const reasonText = signalText(profile.nextPurchaseReason, profile.nearTermCommitment, profile.financialConcern);
  const fomoSignal = hasSignal(reasonText, [/fomo/, /afraid.*miss/, /everyone.*buy/, /hot deal/, /agent.*push/, /limited time/, /rush/, /quick profit/]);
  const nearTermCommitment = hasStatedRisk(profile.nearTermCommitment);
  const evidenceStrong = ["proven", "strong"].includes(analysis.evidenceEngine?.status);
  const documentBacked = ["proven", "partial"].includes(analysis.documentIntelligence?.status);
  const marketRisk = analysis.marketPulse?.status === "risk" || analysis.developmentIntelligence?.status === "risk";
  const stressRisk = ["fragile", "unknown"].includes(analysis.stressEnvelope?.status);
  const portfolioBlocked = analysis.portfolioGate?.status === "block";
  const lanes = [
    portfolioLane(
      "V9.1",
      "Capital base map",
      !cashAvailable && !cashOutlay ? "missing" : cashAfterPurchase !== null && cashAfterPurchase < 0 ? "risk" : reserveMonths >= 6 ? "clear" : "watch",
      cashAfterPurchase === null
        ? "Cash available and total cash outlay are not both stated, so capital deployment cannot be mapped cleanly."
        : `After stated outlay, declared cash would be ${formatRinggit(cashAfterPurchase)} with ${reserveMonths || 0} months reserve stated.`,
      "Map cash available, all-in cash outlay, emergency reserve, renovation/furnishing, and repair allowance before treating loan approval as readiness."
    ),
    portfolioLane(
      "V9.2",
      "Reserve runway",
      reserveMonths >= 6 && (reserveSurvivalMonths === null || reserveSurvivalMonths >= 12) ? "clear" : reserveMonths && reserveMonths < 6 ? "risk" : reserveSurvivalMonths !== null && reserveSurvivalMonths < 6 ? "risk" : "watch",
      reserveSurvivalMonths === null
        ? `Reserve month input is ${reserveMonths || 0}. Stress reserve survival is not applicable or not calculated.`
        : `Stress reserve survival is about ${reserveSurvivalMonths} month${reserveSurvivalMonths === 1 ? "" : "s"}.`,
      "Keep at least six months of emergency reserve after purchase and enough stress runway to survive vacancy, repair, lower rent, and higher instalment."
    ),
    portfolioLane(
      "V9.3",
      "Debt service capacity",
      postDealDsr === null ? "missing" : postDealDsr >= 80 ? "risk" : postDealDsr >= 65 ? "watch" : "clear",
      postDealDsr === null
        ? "Post-deal DSR cannot be calculated without income and instalment."
        : `Post-deal DSR is about ${money(postDealDsr)}% before banks apply their own policy filters.`,
      "Use DSR as a stress signal, not a permission slip. Avoid forcing financing just to reduce upfront cash."
    ),
    portfolioLane(
      "V9.4",
      "Holding power floor",
      holdingCashFlow === null ? "missing" : holdingCashFlow >= 0 && !stressRisk ? "clear" : holdingCashFlow >= -300 ? "watch" : "risk",
      holdingCashFlow === null
        ? "Rent, instalment, or maintenance is missing, so holding power is not proven."
        : `Base monthly holding is ${formatRinggit(holdingCashFlow)}; stressed holding is ${analysis.stressEnvelope?.stressedTrueHolding || "not calculated"}.`,
      "For normal retail investors, rental should cover instalment and recurring charges unless the user has cash-rich appreciation strategy capacity."
    ),
    portfolioLane(
      "V9.5",
      "Concentration risk",
      existingProperties > 5 ? "risk" : hasSignal(concentrationText, [/same/, /unclear/, /concentrat/, /one area/, /same tenant/, /same township/]) ? "watch" : existingProperties || profile.concentrationRisk ? "clear" : "missing",
      existingProperties
        ? `User states ${existingProperties} existing propert${existingProperties === 1 ? "y" : "ies"}. Concentration note: ${profile.concentrationRisk || "not stated"}.`
        : "Existing property count or concentration risk is not clearly stated.",
      "Check whether the portfolio is relying on the same state, township, tenant pool, supply cycle, price segment, title type, or refinancing window."
    ),
    portfolioLane(
      "V9.6",
      "Acquisition sequence",
      fomoSignal ? "risk" : portfolioBlocked ? "risk" : analysis.portfolioGate?.status === "allow" ? "clear" : analysis.portfolioGate?.status === "review" ? "watch" : "missing",
      fomoSignal
        ? "The stated next-purchase reason contains FOMO or pressure language."
        : analysis.portfolioGate?.summary || "Portfolio expansion gate is not available.",
      "Sequence matters: prove the current asset, preserve reserve, and define the job of this property before moving from first deal to next deal."
    ),
    portfolioLane(
      "V9.7",
      "Refinance and cash-out discipline",
      analysis.holdExitPlan?.action === "refinance" && holdingCashFlow !== null && holdingCashFlow >= 0 ? "clear" : analysis.holdExitPlan?.action === "pause" || stressRisk ? "risk" : "watch",
      analysis.holdExitPlan?.summary || "Refinancing logic is not yet explicit.",
      "Cash-out is healthy only when equity is real, rental still covers the new instalment, and the property remains competitive against substitutes."
    ),
    portfolioLane(
      "V9.8",
      "Opportunity cost and liquidity",
      nearTermCommitment || marketRisk ? "risk" : analysis.marketPulse?.status === "opportunity" ? "clear" : "watch",
      nearTermCommitment
        ? `Near-term commitment stated: ${profile.nearTermCommitment}.`
        : analysis.marketPulse?.summary || "Liquidity and opportunity cost need clearer market-cycle evidence.",
      "Do not trap cash in a property if life planning, business needs, weak resale liquidity, or market saturation may need ready capital."
    ),
    portfolioLane(
      "V9.9",
      "Scale readiness gate",
      portfolioBlocked ? "risk" : evidenceStrong && documentBacked && analysis.portfolioGate?.status === "allow" ? "clear" : evidenceStrong && analysis.portfolioGate?.status !== "block" ? "watch" : "action",
      documentBacked
        ? "Evidence and document backing are strong enough to discuss portfolio fit, subject to the weakest V9 lane."
        : "Portfolio scaling should not rely on framework judgement alone while document backing is thin.",
      "Before scaling, require evidence quality, document backing, stress survival, clean legal/financing path, and a defined portfolio role."
    ),
    portfolioLane(
      "V9.10",
      "Portfolio command seal",
      "watch",
      "The V9 command seal depends on the weakest capital, debt, holding, concentration, and sequence lane.",
      "Use the weakest V9 lane as the capital-allocation task before booking, refinancing, or buying the next property."
    )
  ];
  const riskCount = lanes.filter((lane) => lane.status === "risk").length;
  const missingCount = lanes.filter((lane) => lane.status === "missing").length;
  const actionCount = lanes.filter((lane) => lane.status === "action").length;
  const scoreWithoutSeal = clampScore(lanes.slice(0, -1).reduce((sum, lane) => sum + lane.score, 0) / Math.max(1, lanes.length - 1));
  const sealStatus = riskCount >= 2 || portfolioBlocked || postDealDsr >= 80 || cashAfterPurchase !== null && cashAfterPurchase < 0
    ? "risk"
    : missingCount >= 3 || actionCount
      ? "action"
      : scoreWithoutSeal >= 78
        ? "clear"
        : "watch";
  lanes[lanes.length - 1] = {
    ...lanes[lanes.length - 1],
    status: sealStatus,
    score: laneStatusScore(sealStatus),
    reading: sealStatus === "clear"
      ? "The V9 seal allows controlled portfolio advancement, subject to professional checks and live evidence."
      : sealStatus === "risk"
        ? "The V9 seal says pause; portfolio stress, debt, cash, concentration, or sequencing risk is too high."
        : sealStatus === "action"
          ? "The V9 seal needs action because too many portfolio inputs or scaling proof points are missing."
          : "The V9 seal says hold and verify; the deal may be interesting, but capital allocation is not fully proven."
  };
  const score = clampScore(lanes.reduce((sum, lane) => sum + lane.score, 0) / lanes.length);
  const status = sealStatus === "risk"
    ? "pause"
    : sealStatus === "action"
      ? "repair"
      : score >= 78 && analysis.portfolioGate?.status === "allow"
        ? "advance"
        : "hold";
  const nextMove = status === "advance"
    ? "Proceed only with controlled negotiation and preserve the defined reserve after purchase."
    : status === "pause"
      ? "Pause capital deployment until the risk-level portfolio lane is cleared."
      : status === "repair"
        ? "Complete the missing portfolio inputs and proof before treating this as a scalable move."
        : "Keep the deal under review, but do not treat it as a next-property green light yet.";
  return {
    version: "v9",
    status,
    score,
    summary: status === "advance"
      ? "The deal can fit the portfolio command path if execution remains disciplined."
      : status === "pause"
        ? "The deal may still be attractive, but portfolio readiness is not safe enough for capital deployment."
        : status === "repair"
          ? "Portfolio command is incomplete; Apex needs more capital, debt, concentration, or proof inputs."
          : "Portfolio command is conditional. Hold the decision until the weakest V9 lane improves.",
    posture: status === "advance" ? "Controlled allocation" : status === "pause" ? "Pause capital" : status === "repair" ? "Repair inputs" : "Hold and verify",
    nextMove,
    capitalMap: {
      cashAvailable: cashAvailable ? formatRinggit(cashAvailable) : "Not stated",
      cashOutlay: cashOutlay ? formatRinggit(cashOutlay) : "Not stated",
      cashAfterPurchase: cashAfterPurchase === null ? "Not calculated" : formatRinggit(cashAfterPurchase),
      reserveMonths: profile.cashReserveMonths || "Not stated",
      reserveSurvivalMonths,
      postDealDsr: postDealDsr === null ? "Not calculated" : `${money(postDealDsr)}%`,
      holdingCashFlow: holdingCashFlow === null ? "Not calculated" : formatRinggit(holdingCashFlow),
      stressedHolding: analysis.stressEnvelope?.stressedTrueHolding || "Not calculated",
      existingProperties,
      portfolioRole
    },
    lanes,
    actionQueue: lanes
      .filter((lane) => !["clear"].includes(lane.status) && lane.version !== "V9.10")
      .sort((left, right) => laneStatusScore(left.status) - laneStatusScore(right.status))
      .slice(0, 5)
      .map((lane) => ({ version: lane.version, label: lane.label, status: lane.status, action: lane.action }))
  };
}

function finalCommandLane(version, label, status, reading, action) {
  return {
    version,
    label,
    status,
    score: laneStatusScore(status),
    reading,
    action
  };
}

function buildFinalCommand(analysis = {}) {
  const hardStops = Array.isArray(analysis.hardStops) ? analysis.hardStops.filter(Boolean) : [];
  const blockers = Array.isArray(analysis.recommendationBlockers) ? analysis.recommendationBlockers.filter(Boolean) : [];
  const missingEvidence = Array.isArray(analysis.missingEvidence) ? analysis.missingEvidence.filter(Boolean) : [];
  const nextActions = Array.isArray(analysis.nextActions) ? analysis.nextActions.filter(Boolean) : [];
  const evidenceStatus = analysis.evidenceEngine?.status || "unknown";
  const documentStatus = analysis.documentIntelligence?.status || "thin";
  const developmentStatus = analysis.developmentIntelligence?.status || "thin";
  const caseStatus = analysis.caseIntelligence?.status || "thin";
  const portfolioStatus = analysis.portfolioCommand?.status || "hold";
  const sealStatus = analysis.decisionSeal?.status || "conditional";
  const sourceMode = analysis.sourceTransparency?.mode || analysis.reasoningMode || "Framework only";
  const contradictions = [];

  if (analysis.verdict === "SHORTLIST" && hardStops.length) {
    contradictions.push("The headline verdict is shortlist-level, but hard stops still exist.");
  }
  if (analysis.verdict === "SHORTLIST" && ["pause", "repair"].includes(portfolioStatus)) {
    contradictions.push(`The property may be shortlisted, but V9 portfolio command says ${portfolioStatus}.`);
  }
  if ((analysis.averageScore || 0) >= 75 && blockers.length) {
    contradictions.push("The score is healthy, but unresolved decision blockers remain.");
  }
  if (["proven", "strong"].includes(evidenceStatus) && documentStatus === "thin") {
    contradictions.push("Framework evidence is strong, but owner document backing is still thin.");
  }
  if (analysis.confidence >= 80 && missingEvidence.length >= 4) {
    contradictions.push("Confidence is high while several proof items are still missing.");
  }
  if (analysis.portfolioCommand?.status === "advance" && sealStatus === "blocked") {
    contradictions.push("Portfolio command permits advancement, but the decision seal is blocked.");
  }

  const contradictionStatus = contradictions.length >= 3 ? "risk" : contradictions.length ? "watch" : "clear";
  const hardStopStatus = hardStops.length ? "risk" : blockers.length ? "action" : "clear";
  const evidenceLadderStatus = ["blocked", "weak"].includes(evidenceStatus) || ["risk", "thin"].includes(documentStatus)
    ? "risk"
    : missingEvidence.length >= 4
      ? "action"
      : ["proven", "strong"].includes(evidenceStatus) && ["proven", "partial"].includes(documentStatus)
        ? "clear"
        : "watch";
  const marketProjectStatus = ["risk"].includes(developmentStatus) || caseStatus === "risk" || analysis.marketPulse?.status === "risk"
    ? "risk"
    : ["tracked", "proven", "opportunity"].includes(developmentStatus) || caseStatus === "tracked" || analysis.marketPulse?.status === "opportunity"
      ? "clear"
      : "watch";
  const portfolioLaneStatus = portfolioStatus === "pause"
    ? "risk"
    : portfolioStatus === "repair"
      ? "action"
      : portfolioStatus === "advance"
        ? "clear"
        : "watch";
  const challengeStatus = ["hard"].includes(analysis.challengeMode?.level) || analysis.personalizedChallenge?.status === "hard"
    ? "risk"
    : ["challenge", "reminder"].includes(analysis.personalizedChallenge?.status) || analysis.challengeMode?.level === "missing"
      ? "watch"
      : "clear";
  const handoffTasks = [
    ...(analysis.dueDiligencePlan?.tasks || []),
    ...(analysis.executionPlan?.actions || [])
  ];
  const professionalStatus = handoffTasks.some((item) => ["stop", "required"].includes(item?.status) || item?.priority === "high")
    ? "action"
    : handoffTasks.length
      ? "watch"
      : "missing";
  const actionStatus = nextActions.length || (analysis.portfolioCommand?.actionQueue || []).length
    ? "action"
    : "clear";

  const lanes = [
    finalCommandLane(
      "V10.1",
      "Thesis integrity",
      analysis.counterThesis && analysis.summary ? "clear" : "missing",
      analysis.counterThesis
        ? `Main thesis has a counter-thesis: ${analysis.counterThesis}`
        : "The report needs a clear counter-thesis before Apex can act like an investment committee.",
      "State the purchase thesis, exit buyer, holding period, rent assumption, and walk-away reason in one sentence before booking."
    ),
    finalCommandLane(
      "V10.2",
      "Cross-layer contradiction scan",
      contradictionStatus,
      contradictions.length
        ? `${contradictions.length} contradiction${contradictions.length === 1 ? "" : "s"} found across verdict, evidence, document, and portfolio layers.`
        : "No major contradiction was detected across the main Apex layers.",
      "Resolve contradictions before treating the headline verdict as executable."
    ),
    finalCommandLane(
      "V10.3",
      "Hard-stop hierarchy",
      hardStopStatus,
      hardStops.length
        ? `Hard stop count: ${hardStops.length}. The first hard stop is: ${hardStops[0]}`
        : blockers.length
          ? `No hard stop, but ${blockers.length} decision blocker${blockers.length === 1 ? "" : "s"} remain.`
          : "No hard stop or decision blocker is currently active.",
      "Hard stops override price, yield, confidence, and user excitement."
    ),
    finalCommandLane(
      "V10.4",
      "Evidence ladder",
      evidenceLadderStatus,
      `Framework evidence is ${evidenceStatus}; document intelligence is ${documentStatus}; missing proof count is ${missingEvidence.length}.`,
      "Move from story to proof: completed transactions, achieved rent, bankability, legal/title, site/JMB, and owner documents."
    ),
    finalCommandLane(
      "V10.5",
      "Market and project confidence",
      marketProjectStatus,
      analysis.caseIntelligence?.matched ? `${analysis.caseIntelligence.summary} ${analysis.developmentIntelligence?.summary || ""}` : analysis.developmentIntelligence?.summary || analysis.marketPulse?.summary || "Market/project confidence is not fully tracked.",
      "Confirm the project still has scarcity, management quality, buyer depth, and defense against newer substitutes."
    ),
    finalCommandLane(
      "V10.6",
      "Portfolio command fit",
      portfolioLaneStatus,
      analysis.portfolioCommand?.summary || "Portfolio command is not available.",
      "Do not allocate capital unless reserve, DSR, holding power, concentration, and sequence are acceptable."
    ),
    finalCommandLane(
      "V10.7",
      "Human challenge mode",
      challengeStatus,
      analysis.personalizedChallenge?.message || analysis.challengeMode?.message || "No personalized emotional-risk challenge is active.",
      "Challenge FOMO, greed, overconfidence, and the desire to prove a deal right after liking it."
    ),
    finalCommandLane(
      "V10.8",
      "Professional handoff",
      professionalStatus,
      handoffTasks.length
        ? `${handoffTasks.length} professional or due-diligence task${handoffTasks.length === 1 ? "" : "s"} remain in the execution pack.`
        : "Professional handoff tasks are not clearly mapped.",
      "Assign the next evidence task to the right party: agent, banker, lawyer, management office, valuer, or owner."
    ),
    finalCommandLane(
      "V10.9",
      "Action compression",
      actionStatus,
      nextActions.length
        ? `Apex has ${nextActions.length} next action${nextActions.length === 1 ? "" : "s"}; the first is: ${nextActions[0]}`
        : "No extra next action is listed, so the final command becomes the main instruction.",
      "Compress the report into one next move so the user does not drown in analysis."
    ),
    finalCommandLane(
      "V10.10",
      "Final command seal",
      "watch",
      "The final command seal follows the weakest V10 lane and cannot override hard stops.",
      "Use this final seal as Apex's single investment-committee answer."
    )
  ];

  const riskCount = lanes.filter((lane) => lane.status === "risk").length;
  const actionCount = lanes.filter((lane) => lane.status === "action").length;
  const missingCount = lanes.filter((lane) => lane.status === "missing").length;
  const scoreWithoutSeal = clampScore(lanes.slice(0, -1).reduce((sum, lane) => sum + lane.score, 0) / Math.max(1, lanes.length - 1));
  const finalStatus = hardStops.length || analysis.verdict === "REJECT"
    ? "reject"
    : riskCount >= 2 || portfolioStatus === "pause" || sealStatus === "blocked"
      ? "pause"
      : actionCount || missingCount >= 2 || blockers.length || evidenceLadderStatus === "risk"
        ? "investigate"
        : analysis.verdict === "SHORTLIST" && scoreWithoutSeal >= 78 && portfolioStatus === "advance" && contradictions.length === 0
          ? "approve"
          : analysis.verdict === "SHORTLIST"
            ? "shortlist"
            : "investigate";
  const finalLaneStatus = {
    approve: "clear",
    shortlist: "watch",
    investigate: "action",
    pause: "risk",
    reject: "risk"
  }[finalStatus];
  lanes[lanes.length - 1] = {
    ...lanes[lanes.length - 1],
    status: finalLaneStatus,
    score: laneStatusScore(finalLaneStatus),
    reading: finalStatus === "approve"
      ? "The final seal allows controlled advancement, but only after professional execution and live proof stay consistent."
      : finalStatus === "shortlist"
        ? "The final seal supports shortlist status, not blind purchase. Clear the named proof items before booking."
        : finalStatus === "investigate"
          ? "The final seal requires investigation because one or more important lanes still need proof or repair."
          : finalStatus === "pause"
            ? "The final seal says pause. Capital, evidence, or contradiction risk is too high to proceed now."
            : "The final seal rejects the deal because hard-stop or serious boundary risk is active."
  };
  const score = clampScore(lanes.reduce((sum, lane) => sum + lane.score, 0) / lanes.length);
  const command = {
    approve: "APPROVE WITH CONDITIONS",
    shortlist: "SHORTLIST ONLY",
    investigate: "INVESTIGATE FIRST",
    pause: "PAUSE",
    reject: "REJECT"
  }[finalStatus];
  const nextMove = finalStatus === "approve"
    ? "Proceed only if live pricing, financing, legal status, site condition, and reserve runway remain unchanged."
    : finalStatus === "shortlist"
      ? "Keep it on the shortlist and clear the weakest proof item before any booking or offer."
      : finalStatus === "investigate"
        ? "Investigate the highest-risk V10 lane first; do not negotiate from excitement."
        : finalStatus === "pause"
          ? "Pause the deal until the risk-level V10 lane is fixed with evidence."
          : "Walk away unless the hard-stop condition disappears and the deal is re-underwritten from zero.";
  const headline = `${command}: ${analysis.context?.dealCard?.projectName || analysis.context?.dealCard?.area || "this deal"}`;
  const summary = finalStatus === "approve"
    ? "Apex v10 sees a controlled path forward, but this is still conditional on final professional checks."
    : finalStatus === "shortlist"
      ? "Apex v10 keeps the deal alive, but the answer is not buy yet; it is verify the weakest proof lane."
      : finalStatus === "investigate"
        ? "Apex v10 cannot give a clean go signal because the report still has proof, action, or contradiction work."
        : finalStatus === "pause"
          ? "Apex v10 tells the user to stop momentum because the risk stack is not investment-ready."
          : "Apex v10 rejects the deal until the hard-stop issue is removed and the full framework is rerun.";
  const actionQueue = lanes
    .filter((lane) => lane.status !== "clear" && lane.version !== "V10.10")
    .sort((left, right) => laneStatusScore(left.status) - laneStatusScore(right.status))
    .slice(0, 5)
    .map((lane) => ({ version: lane.version, label: lane.label, status: lane.status, action: lane.action }));
  return {
    version: "v10",
    status: finalStatus,
    score,
    command,
    headline,
    summary,
    finalAnswer: `${summary} ${nextMove}`,
    nextMove,
    contradictionCount: contradictions.length,
    contradictions: contradictions.slice(0, 8),
    sourceMode,
    lanes,
    actionQueue
  };
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

function developmentCaseFromInput(body = {}, knowledge, existing = null) {
  const merged = { ...(existing || {}), ...body };
  let project = null;
  if (merged.projectId) {
    project = findMarketProject(knowledge, { id: String(merged.projectId) });
    if (!project) throw marketInputError("The linked market project does not exist.");
  } else if (merged.projectName) {
    project = findMarketProject(knowledge, { name: merged.projectName, area: merged.area });
  }
  const now = new Date().toISOString();
  const projectIds = new Set(knowledge.projects.map((item) => item.id));
  const item = normalizeDevelopmentCase({
    ...merged,
    id: existing?.id || randomUUID(),
    projectId: project?.id || merged.projectId || "",
    projectName: merged.projectName || project?.name || "",
    area: merged.area || project?.area || "",
    state: merged.state || project?.state || "",
    propertyType: merged.propertyType || project?.propertyType || "",
    developer: merged.developer || project?.developer || "",
    createdAt: existing?.createdAt || now,
    updatedAt: now
  }, projectIds);
  if (!item) throw marketInputError("Project name is required for a development case.");
  return item;
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

function responsePersonaFromProfile(financialProfile = {}) {
  const level = String(financialProfile.experienceLevel || "").toLowerCase();
  const mode = String(financialProfile.guidanceMode || "").toLowerCase();
  const output = String(financialProfile.preferredOutput || "").toLowerCase();
  const comfort = String(financialProfile.confidenceComfort || "").toLowerCase();
  const notes = String(financialProfile.onboardingNotes || "").trim();
  const responseFeedback = reportText(financialProfile.responseFeedback, 700);
  const feedbackText = responseFeedback.toLowerCase();
  const guided = mode.includes("guided") || level.includes("beginner");
  const professional = mode.includes("professional") || level.includes("professional");
  const checklist = output.includes("checklist");
  const voice = output.includes("voice");
  const concise = mode.includes("concise") || output.includes("short") || voice;
  const feedbackPrefersShort = feedbackText.includes("shorter") || feedbackText.includes("lead with the decision");
  const feedbackPrefersWarmer = feedbackText.includes("less formal") || feedbackText.includes("mentor-like") || feedbackText.includes("natural");
  const feedbackPrefersEvidence = feedbackText.includes("more proof") || feedbackText.includes("verification") || feedbackText.includes("evidence");
  const kind = feedbackPrefersShort
    ? "concise"
    : guided
      ? "guided"
      : professional
        ? "professional"
        : checklist
          ? "checklist"
          : concise
            ? "concise"
            : "balanced";
  const label = {
    guided: "Guided beginner mode",
    professional: "Professional due-diligence mode",
    checklist: "Checklist mode",
    concise: voice ? "Voice-summary mode" : "Concise mode",
    balanced: "Balanced mode"
  }[kind];
  const instruction = {
    guided: "Use plain language, explain the why, name the beginner trap, and end with one next action.",
    professional: "Use a tighter due-diligence tone: verdict, evidence, blocker, and action without extra teaching.",
    checklist: "Turn the response into an action checklist with clear pass, verify, and stop items.",
    concise: "Give the verdict first, then only the strongest reason, main risk, and next action.",
    balanced: "Balance judgment, evidence, risk, and next action in a natural conversational answer."
  }[kind];
  const feedbackInstructions = [
    feedbackPrefersWarmer ? "Recent feedback asks for less formal, more mentor-like wording." : "",
    feedbackPrefersEvidence ? "Recent feedback asks for clearer proof, missing evidence, and verification steps." : "",
    feedbackPrefersShort ? "Recent feedback asks for shorter answers that lead with the decision." : ""
  ].filter(Boolean).join(" ");
  return {
    kind,
    label,
    instruction: [instruction, feedbackInstructions].filter(Boolean).join(" "),
    level: financialProfile.experienceLevel || "Not stated",
    mode: financialProfile.guidanceMode || "Not stated",
    output: financialProfile.preferredOutput || "Not stated",
    comfort: financialProfile.confidenceComfort || "Not stated",
    conservative: comfort.includes("conservative"),
    notes,
    responseFeedback
  };
}

function responsePersonaForPrompt(persona = {}) {
  return [
    `Mode: ${persona.label || "Balanced mode"}.`,
    `Instruction: ${persona.instruction || "Balance judgment, evidence, risk, and next action."}`,
    `Experience level: ${persona.level || "Not stated"}.`,
    `Preferred output: ${persona.output || "Not stated"}.`,
    `Confidence comfort: ${persona.comfort || "Not stated"}.`,
    persona.notes ? `User notes: ${persona.notes}` : "",
    persona.responseFeedback ? `Recent answer feedback: ${persona.responseFeedback}` : ""
  ].filter(Boolean).join("\n");
}

function firstMeaningful(items = [], fallback = "") {
  return (items || []).map((item) => String(item || "").trim()).find(Boolean) || fallback;
}

function adaptFrameworkAnswerToPersona(answer, persona = {}, context = {}) {
  if (!answer || persona.kind === "balanced") return answer;
  const reason = firstMeaningful(context.reasoning, "The decision still depends on evidence, not the headline price or yield.");
  const risk = firstMeaningful(context.risks, persona.conservative ? "If evidence is incomplete, treat the answer as provisional." : "");
  const next = firstMeaningful(context.evidenceChecks, "Get the cheapest evidence that can change the decision.");
  const challenge = firstMeaningful(context.challenge, "What evidence would make you walk away?");
  const evidence = firstMeaningful(context.ownerEvidenceLines, firstMeaningful(context.marketLines, ""));
  const profile = firstMeaningful(context.profileFit, "");
  const deal = firstMeaningful(context.dealRead, "");

  if (persona.kind === "concise") {
    return [
      `Quick read: ${String(context.verdict || answer).replace(/^My take:\s*/i, "")}`,
      reason ? `Why: ${reason}` : "",
      evidence ? `Evidence: ${evidence}` : "",
      risk ? `Risk: ${risk}` : "",
      profile ? `Profile fit: ${profile}` : "",
      `Next: ${next}`
    ].filter(Boolean).join("\n");
  }

  if (persona.kind === "guided") {
    return [
      `Plain-English read: ${String(context.verdict || answer).replace(/^My take:\s*/i, "")}`,
      "",
      `Why this matters: ${reason}`,
      deal ? `What the deal is telling us: ${deal}` : "",
      risk ? `Beginner trap to avoid: ${risk}` : "Beginner trap to avoid: do not let a cheap-looking entry price replace evidence.",
      `Check next: ${next}`,
      `My challenge back: ${challenge}`
    ].filter(Boolean).join("\n");
  }

  if (persona.kind === "checklist") {
    const checks = [
      reason ? `PASS/VERIFY - Thesis: ${reason}` : "",
      evidence ? `VERIFY - Evidence: ${evidence}` : "",
      deal ? `VERIFY - Deal context: ${deal}` : "",
      profile ? `VERIFY - Profile fit: ${profile}` : "",
      risk ? `STOP/CAUTION - Risk: ${risk}` : "",
      `NEXT - ${next}`,
      `CHALLENGE - ${challenge}`
    ].filter(Boolean);
    return [`Checklist read: ${String(context.verdict || answer).replace(/^My take:\s*/i, "")}`, "", ...checks.map((item) => `- ${item}`)].join("\n");
  }

  if (persona.kind === "professional") {
    return [
      `Professional read: ${String(context.verdict || answer).replace(/^My take:\s*/i, "")}`,
      `Evidence position: ${evidence || reason}`,
      risk ? `Primary blocker: ${risk}` : "",
      profile ? `Investor fit: ${profile}` : "",
      `Action: ${next}`,
      `Challenge: ${challenge}`
    ].filter(Boolean).join("\n");
  }

  return answer;
}

function buildContextCoach({ query = "", dealCard = {}, financialProfile = {}, responsePersona = responsePersonaFromProfile(), sources = [] } = {}) {
  const missing = [];
  const prompts = [];
  const queryText = String(query || "").toLowerCase();
  const addMissing = (label) => {
    if (label && !missing.includes(label)) missing.push(label);
  };
  const addPrompt = (label, text, kind = "question") => {
    if (!label || !text || prompts.some((item) => item.text === text)) return;
    prompts.push({ label, text, kind });
  };

  if (!dealCard.area && !dealCard.projectName) {
    addMissing("area or project name");
    addPrompt("Name the deal", "I am looking at [project/area]. Help me screen the area, buyer pool, and main risks.", "deal-context");
  }
  if (!dealCard.askingPrice) {
    addMissing("asking price");
    addPrompt("Add entry price", "The asking price is RM[amount]. Is this within the right price segment for the area?", "deal-context");
  }
  if (!dealCard.expectedRent) {
    addMissing("expected or achieved rent");
    addPrompt("Test rent", "Expected rent is RM[amount]. Does this rent prove real demand or just advertised hope?", "rental-proof");
  }
  if (!dealCard.estimatedInstallment && !financialProfile.monthlyIncome) {
    addMissing("installment or income profile");
    addPrompt("Check affordability", "My income is RM[amount] and estimated installment is RM[amount]. Stress-test whether I can hold this.", "profile-fit");
  }
  if (!dealCard.comparableTransactions && !dealCard.comparableSource) {
    addMissing("completed transaction comparables");
    addPrompt("Prove value", "Comparable transactions show [range/source]. Does this prove I am buying below the right segment?", "value-proof");
  }
  if (!dealCard.siteVisitEvidence && /buy|purchase|deal|condo|apartment|property/.test(queryText)) {
    addMissing("site visit or lived-quality proof");
    addPrompt("Site visit lens", "I visited the project. Help me judge lobby, guardhouse, lifts, car park, residents, and management.", "site-visit");
  }
  if (!dealCard.legalTitleType && /buy|purchase|deal|title|legal/.test(queryText)) {
    addMissing("title and transaction status");
    addPrompt("Legal filter", "Title and transaction status is [status]. What legal or financing issue should stop the deal?", "legal");
  }
  if (!financialProfile.experienceLevel || !financialProfile.guidanceMode) {
    addMissing("guidance preference");
    addPrompt("Set guidance", "Use guided mode. Explain this like I am a beginner but keep the evidence standard strict.", "guidance");
  }
  if (responsePersona.kind === "checklist") {
    addPrompt("Convert to checklist", "Turn this deal into a pass, verify, stop checklist.", "format");
  } else if (responsePersona.kind === "professional") {
    addPrompt("Professional review", "Give me the due-diligence version: evidence position, primary blocker, investor fit, and action.", "format");
  } else if (responsePersona.kind === "concise") {
    addPrompt("Short answer", "Give me the shortest useful answer: verdict, reason, risk, next action.", "format");
  } else if (responsePersona.kind === "guided") {
    addPrompt("Explain simply", "Explain the beginner trap in this deal and the one evidence item I should get next.", "format");
  }

  const hasEvidenceSource = sources.some((source) => ["evidence", "market", "memory", "journal"].includes(source.type));
  if (!hasEvidenceSource) {
    addPrompt("Bring proof", "What exact proof should I collect first so Apex can move from opinion to evidence?", "evidence");
  }

  const title = responsePersona.kind === "concise" ? "NEXT" : "NEXT MOVES";
  const summary = missing.length
    ? `Apex still needs ${missing.slice(0, 3).join(", ")} before the answer can become stronger.`
    : "The basics are present. The next move is to sharpen proof, stress, or negotiation posture.";

  return {
    title,
    summary,
    missing: missing.slice(0, 6),
    prompts: prompts.slice(0, 4)
  };
}

function companionAnswer(kind, persona = responsePersonaFromProfile()) {
  const compact = persona.kind === "concise" || persona.output === "Voice summary";
  if (kind === "greeting") {
    if (compact) return "Hey. Send me the deal, area, price, rent, or concern.";
    return "Hey, I am here. Give me a property, area, price, rent, or concern, and we will pressure-test it together.";
  }
  if (kind === "how_are_you") {
    if (compact) return "I am good. Bring me the next deal or doubt.";
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
  annualAssessmentQuitRent: "Annual assessment and quit rent",
  annualInsuranceTax: "Annual insurance and tax",
  monthlyRepairReserve: "Monthly repair reserve",
  furnishingBudget: "Furnishing and renovation budget",
  vacancyStressMonths: "Vacancy stress months",
  tenure: "Tenure",
  unitPosition: "Unit position",
  ownStayAppeal: "Own-stay appeal",
  managementQuality: "Management and build quality",
  exitBuyerPool: "Exit buyer pool",
  evidenceConfidence: "Evidence confidence",
  comparableTransactions: "Completed comparable transactions",
  comparableSource: "Comparable source",
  comparableRecency: "Comparable recency",
  comparableMatchQuality: "Comparable match quality",
  comparablePriceRange: "Comparable price range",
  comparableAdjustmentNotes: "Comparable adjustment notes",
  rentEvidence: "Rental evidence",
  rentalSource: "Rental source",
  rentalRecency: "Rental recency",
  tenantUrgency: "Tenant urgency",
  vacancySignal: "Vacancy signal",
  rentalSustainability: "Rental sustainability",
  rentalAdjustmentNotes: "Rental adjustment notes",
  bankValuationSupport: "Bank valuation support",
  loanPrecheckStatus: "Loan precheck status",
  loanMarginPlan: "Loan margin plan",
  instalmentStress: "Instalment stress test",
  cashBufferAfterPurchase: "Cash buffer after purchase",
  financingDocumentReadiness: "Financing document readiness",
  financingNotes: "Financing notes",
  supplyRadius: "Supply check radius",
  substituteCount: "Substitute count",
  substituteThreat: "Substitute threat",
  futureSupplyTiming: "Future supply timing",
  absorptionEvidence: "Absorption evidence",
  unsoldStockSignal: "Unsold stock signal",
  densityLiftStress: "Density and lift stress",
  supplyNotes: "Supply notes",
  siteVisitEvidence: "Site visit evidence",
  lobbyGuardhouseSignal: "Lobby and guardhouse signal",
  liftCarparkCorridorSignal: "Lift, car park, and corridor signal",
  commonAreaCondition: "Common area condition",
  residentBehaviourSignal: "Resident behaviour signal",
  managementResponseSignal: "Management response signal",
  defectLeakageSignal: "Defect and leakage signal",
  arrearsJmbSignal: "Arrears and JMB signal",
  siteManagementNotes: "Site and management notes",
  siteVisit: "Site visit",
  legalCheck: "Title and legal check",
  legalTitleType: "Legal title type",
  titleTransferStatus: "Title transfer status",
  caveatRestrictionStatus: "Caveat and restriction status",
  sellerAuthorityStatus: "Seller authority status",
  arrearsUtilitiesStatus: "Arrears and utilities status",
  stakeholderFlowStatus: "Stakeholder and fund flow",
  lawyerCoordinationStatus: "Lawyer coordination status",
  legalTransactionNotes: "Legal transaction notes",
  dealSource: "Deal source",
  agentBehavior: "Agent behavior",
  sellerMotivation: "Seller motivation",
  professionalConcern: "Professional concern",
  siteVisitNotes: "Site visit notes",
  inspectionConcern: "Inspection concern",
  targetTenant: "Target tenant",
  tenantScreening: "Tenant screening",
  furnishingStrategy: "Furnishing strategy",
  exitStrategyPlan: "Exit strategy plan",
  resalePreparation: "Resale preparation",
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
  portfolioRole: "Portfolio role",
  existingPortfolioHealth: "Existing portfolio health",
  concentrationRisk: "Concentration risk",
  nextPurchaseReason: "Next purchase reason",
  nearTermCommitment: "Near-term commitment",
  financialConcern: "Financial concern",
  experienceLevel: "Experience level",
  guidanceMode: "Guidance mode",
  decisionIntent: "Decision intent",
  preferredOutput: "Preferred output",
  confidenceComfort: "Confidence comfort",
  onboardingNotes: "Guidance notes"
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

function signalText(...values) {
  return values.flat().map((value) => String(value || "").toLowerCase()).join(" ");
}

function hasSignal(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function pushUnique(list, value) {
  const clean = String(value || "").trim();
  if (clean && !list.includes(clean)) list.push(clean);
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
  const annualAssessmentQuitRent = parseAmount(dealCard.annualAssessmentQuitRent);
  const annualInsuranceTax = parseAmount(dealCard.annualInsuranceTax);
  const monthlyRepairReserveInput = parseAmount(dealCard.monthlyRepairReserve);
  const furnishingBudget = parseAmount(dealCard.furnishingBudget);
  const vacancyStressMonthsInput = parsePlainNumber(dealCard.vacancyStressMonths);
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
  const portfolioRole = String(financialProfile.portfolioRole || "").toLowerCase();
  const existingPortfolioHealth = String(financialProfile.existingPortfolioHealth || "").toLowerCase();
  const concentrationRiskInput = String(financialProfile.concentrationRisk || "").toLowerCase();
  const nextPurchaseReason = String(financialProfile.nextPurchaseReason || "").toLowerCase();
  const experienceLevel = String(financialProfile.experienceLevel || "").toLowerCase();
  const guidanceMode = String(financialProfile.guidanceMode || "").toLowerCase();
  const decisionIntent = String(financialProfile.decisionIntent || "").toLowerCase();
  const preferredOutput = String(financialProfile.preferredOutput || "").toLowerCase();
  const confidenceComfort = String(financialProfile.confidenceComfort || "").toLowerCase();
  const onboardingNotes = String(financialProfile.onboardingNotes || "");
  const tenure = String(dealCard.tenure || "").toLowerCase();
  const comparableSource = String(dealCard.comparableSource || "").toLowerCase();
  const comparableRecency = String(dealCard.comparableRecency || "").toLowerCase();
  const comparableMatchQuality = String(dealCard.comparableMatchQuality || "").toLowerCase();
  const comparablePriceRangeText = String(dealCard.comparablePriceRange || "");
  const comparableAdjustmentNotes = String(dealCard.comparableAdjustmentNotes || "");
  const rentalSource = String(dealCard.rentalSource || "").toLowerCase();
  const rentalRecency = String(dealCard.rentalRecency || "").toLowerCase();
  const tenantUrgency = String(dealCard.tenantUrgency || "").toLowerCase();
  const vacancySignal = String(dealCard.vacancySignal || "").toLowerCase();
  const rentalSustainability = String(dealCard.rentalSustainability || "").toLowerCase();
  const rentalAdjustmentNotes = String(dealCard.rentalAdjustmentNotes || "");
  const bankValuationSupport = String(dealCard.bankValuationSupport || "").toLowerCase();
  const loanPrecheckStatus = String(dealCard.loanPrecheckStatus || "").toLowerCase();
  const loanMarginPlan = String(dealCard.loanMarginPlan || "").toLowerCase();
  const instalmentStress = String(dealCard.instalmentStress || "").toLowerCase();
  const cashBufferAfterPurchase = String(dealCard.cashBufferAfterPurchase || "").toLowerCase();
  const financingDocumentReadiness = String(dealCard.financingDocumentReadiness || "").toLowerCase();
  const financingNotes = String(dealCard.financingNotes || "");
  const supplyRadius = String(dealCard.supplyRadius || "").toLowerCase();
  const substituteCount = String(dealCard.substituteCount || "").toLowerCase();
  const substituteThreat = String(dealCard.substituteThreat || "").toLowerCase();
  const futureSupplyTiming = String(dealCard.futureSupplyTiming || "").toLowerCase();
  const absorptionEvidence = String(dealCard.absorptionEvidence || "").toLowerCase();
  const unsoldStockSignal = String(dealCard.unsoldStockSignal || "").toLowerCase();
  const densityLiftStress = String(dealCard.densityLiftStress || "").toLowerCase();
  const supplyNotes = String(dealCard.supplyNotes || "");
  const siteVisitEvidence = String(dealCard.siteVisitEvidence || "").toLowerCase();
  const lobbyGuardhouseSignal = String(dealCard.lobbyGuardhouseSignal || "").toLowerCase();
  const liftCarparkCorridorSignal = String(dealCard.liftCarparkCorridorSignal || "").toLowerCase();
  const commonAreaCondition = String(dealCard.commonAreaCondition || "").toLowerCase();
  const residentBehaviourSignal = String(dealCard.residentBehaviourSignal || "").toLowerCase();
  const managementResponseSignal = String(dealCard.managementResponseSignal || "").toLowerCase();
  const defectLeakageSignal = String(dealCard.defectLeakageSignal || "").toLowerCase();
  const arrearsJmbSignal = String(dealCard.arrearsJmbSignal || "").toLowerCase();
  const siteManagementNotes = String(dealCard.siteManagementNotes || "");
  const legalTitleType = String(dealCard.legalTitleType || "").toLowerCase();
  const titleTransferStatus = String(dealCard.titleTransferStatus || "").toLowerCase();
  const caveatRestrictionStatus = String(dealCard.caveatRestrictionStatus || "").toLowerCase();
  const sellerAuthorityStatus = String(dealCard.sellerAuthorityStatus || "").toLowerCase();
  const arrearsUtilitiesStatus = String(dealCard.arrearsUtilitiesStatus || "").toLowerCase();
  const stakeholderFlowStatus = String(dealCard.stakeholderFlowStatus || "").toLowerCase();
  const lawyerCoordinationStatus = String(dealCard.lawyerCoordinationStatus || "").toLowerCase();
  const legalTransactionNotes = String(dealCard.legalTransactionNotes || "");
  const dealNarrative = signalText(
    dealCard.mainConcern,
    dealCard.investmentThesis,
    dealCard.nearbySupply,
    dealCard.killCriterion,
    dealCard.dealSource,
    dealCard.agentBehavior,
    dealCard.sellerMotivation,
    dealCard.professionalConcern,
    dealCard.siteVisitNotes,
    dealCard.inspectionConcern,
    dealCard.targetTenant,
    dealCard.tenantScreening,
    dealCard.furnishingStrategy,
    dealCard.rentalAdjustmentNotes,
    dealCard.bankValuationSupport,
    dealCard.loanPrecheckStatus,
    dealCard.loanMarginPlan,
    dealCard.instalmentStress,
    dealCard.cashBufferAfterPurchase,
    dealCard.financingDocumentReadiness,
    dealCard.financingNotes,
    dealCard.supplyRadius,
    dealCard.substituteCount,
    dealCard.substituteThreat,
    dealCard.futureSupplyTiming,
    dealCard.absorptionEvidence,
    dealCard.unsoldStockSignal,
    dealCard.densityLiftStress,
    dealCard.supplyNotes,
    dealCard.siteVisitEvidence,
    dealCard.lobbyGuardhouseSignal,
    dealCard.liftCarparkCorridorSignal,
    dealCard.commonAreaCondition,
    dealCard.residentBehaviourSignal,
    dealCard.managementResponseSignal,
    dealCard.defectLeakageSignal,
    dealCard.arrearsJmbSignal,
    dealCard.siteManagementNotes,
    dealCard.legalTitleType,
    dealCard.titleTransferStatus,
    dealCard.caveatRestrictionStatus,
    dealCard.sellerAuthorityStatus,
    dealCard.arrearsUtilitiesStatus,
    dealCard.stakeholderFlowStatus,
    dealCard.lawyerCoordinationStatus,
    dealCard.legalTransactionNotes,
    dealCard.exitStrategyPlan,
    dealCard.resalePreparation
  );
  const profileNarrative = signalText(
    financialProfile.financialConcern,
    financialProfile.nearTermCommitment,
    financialProfile.experienceLevel,
    financialProfile.guidanceMode,
    financialProfile.decisionIntent,
    financialProfile.preferredOutput,
    financialProfile.confidenceComfort,
    financialProfile.onboardingNotes
  );
  const allNarrative = signalText(dealNarrative, profileNarrative, tenure, dealCard.legalCheck);
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
  const recommendationBlockers = [];
  const missingEvidence = [];

  const addHardStop = (stage, message, action = "reject") => {
    if (!hardStops.some((item) => item.message === message)) hardStops.push({ stage, message, action });
  };
  const addWatchout = (message) => pushUnique(watchouts, message);
  const addBlocker = (message) => pushUnique(recommendationBlockers, message);

  if (!fairValue) missingEvidence.push("Recent completed subsale or auction evidence for conservative value");
  if (!rent) missingEvidence.push("Achieved rent and tenant-demand evidence from active local agents");
  if (!installment) missingEvidence.push("A lender-backed monthly instalment estimate");
  if (!dealCard.managementQuality) missingEvidence.push("Management, maintenance, and build-quality checks");
  if (!dealCard.nearbySupply) missingEvidence.push("Direct competing supply within roughly 2.5km");
  if (!dealCard.comparableTransactions || dealCard.comparableTransactions === "None") missingEvidence.push("Recent completed comparable transactions");
  if (dealCard.comparableTransactions && dealCard.comparableTransactions !== "None" && (!dealCard.comparableSource || !dealCard.comparableRecency || !dealCard.comparableMatchQuality || !dealCard.comparablePriceRange)) {
    missingEvidence.push("V4.1 comparable source, recency, match quality, and completed price range");
  }
  if (!dealCard.rentEvidence || dealCard.rentEvidence === "None" || dealCard.rentEvidence === "Listing only") missingEvidence.push("Achieved-rent proof beyond advertised listings");
  if (dealCard.rentEvidence && dealCard.rentEvidence !== "None" && dealCard.rentEvidence !== "Listing only" && (!dealCard.rentalSource || !dealCard.rentalRecency || !dealCard.tenantUrgency || !dealCard.vacancySignal)) {
    missingEvidence.push("V4.2 rental source, recency, tenant urgency, and vacancy signal");
  }
  if (installment && (!dealCard.bankValuationSupport || !dealCard.loanPrecheckStatus || !dealCard.loanMarginPlan || !dealCard.instalmentStress || !dealCard.cashBufferAfterPurchase)) {
    missingEvidence.push("V4.3 bank valuation, loan precheck, margin plan, instalment stress, and post-purchase cash buffer");
  }
  if (!dealCard.supplyRadius || !dealCard.substituteCount || !dealCard.substituteThreat || !dealCard.futureSupplyTiming || !dealCard.absorptionEvidence) {
    missingEvidence.push("V4.4 supply radius, substitute count, threat, VP timing, and absorption evidence");
  }
  if (!dealCard.siteVisitEvidence || !dealCard.lobbyGuardhouseSignal || !dealCard.liftCarparkCorridorSignal || !dealCard.commonAreaCondition || !dealCard.managementResponseSignal) {
    missingEvidence.push("V4.5 site visit proof, lobby/guardhouse, lift/car park/corridor, common-area, and management-response evidence");
  }
  if (!dealCard.legalTitleType || !dealCard.titleTransferStatus || !dealCard.caveatRestrictionStatus || !dealCard.sellerAuthorityStatus || !dealCard.stakeholderFlowStatus || !dealCard.lawyerCoordinationStatus) {
    missingEvidence.push("V4.6 legal title, transfer, caveat/restriction, seller-authority, stakeholder-flow, and lawyer-coordination evidence");
  }
  if (dealCard.siteVisit !== "Completed") missingEvidence.push("A completed site visit");
  if (dealCard.legalCheck !== "Clear") missingEvidence.push("Clear title, caveat, restriction, and legal checks");
  if (!dealCard.investmentThesis) missingEvidence.push("A written causal investment thesis");
  if (!dealCard.killCriterion) missingEvidence.push("An observable walk-away criterion");

  if (!dealCard.projectName && !dealCard.area) addBlocker("Exact project or micro-area is missing.");
  if (!fairValue) addBlocker("Conservative value is not supported by completed transaction or auction evidence.");
  if (!installment) addBlocker("Loan instalment is missing, so holding power cannot be tested.");
  if (!dealCard.comparableTransactions || dealCard.comparableTransactions === "None") addBlocker("Completed comparable transactions are missing.");
  if (dealCard.rentEvidence === "None" || dealCard.rentEvidence === "Listing only" || !dealCard.rentEvidence) addBlocker("Rental evidence is not strong enough for a rental-led recommendation.");
  if (dealCard.siteVisit !== "Completed") addBlocker("Site visit is not completed; Apex can only give a provisional view.");
  if (dealCard.legalCheck !== "Clear") addBlocker("Title, caveat, restriction, consent, and seller-authority checks are not clear.");
  if (!income || !financialProfile.cashReserveMonths) addBlocker("Financial profile is incomplete, so investor suitability cannot be trusted.");
  if (!dealCard.exitBuyerPool || dealCard.exitBuyerPool === "Unclear") addBlocker("Exit buyer pool is unclear.");

  const transactionBoundaryNarrative = signalText(
    dealCard.mainConcern,
    dealCard.investmentThesis,
    dealCard.killCriterion,
    dealCard.dealSource,
    dealCard.agentBehavior,
    dealCard.sellerMotivation,
    dealCard.professionalConcern,
    dealCard.bankValuationSupport,
    dealCard.loanPrecheckStatus,
    dealCard.loanMarginPlan,
    dealCard.financingNotes,
    dealCard.legalTitleType,
    dealCard.titleTransferStatus,
    dealCard.caveatRestrictionStatus,
    dealCard.sellerAuthorityStatus,
    dealCard.arrearsUtilitiesStatus,
    dealCard.stakeholderFlowStatus,
    dealCard.lawyerCoordinationStatus,
    dealCard.legalTransactionNotes,
    profileNarrative,
    tenure,
    dealCard.legalCheck
  );
  const markedUpRisk = hasSignal(transactionBoundaryNarrative, [
    /marked[-\s]?up/,
    /mark[-\s]?up/,
    /cash\s*back/,
    /artificial consideration/,
    /undisclosed side/,
    /mislead(ing)?\s+(the\s+)?lender/,
    /fake document/,
    /side letter/
  ]);
  const bulkRisk = hasSignal(transactionBoundaryNarrative, [/bulk purchase/, /bulk deal/, /bulk buyer/, /bulk group/]);
  const documentRiskNarrative = allNarrative
    .replace(/no caveat or blocking restriction/g, "")
    .replace(/no caveat/g, "")
    .replace(/seller authority and documents verified/g, "")
    .replace(/all payments through lawyer stakeholder \/ bank channels/g, "");
  const documentRisk = hasSignal(documentRiskNarrative, [
    /caveat\s*\//,
    /existing caveat/,
    /lodged caveat/,
    /caveat.*(?:found|issue|risk|unresolved|blocking|not clear)/,
    /title dispute/,
    /court order/,
    /prohibitory order/,
    /not registered proprietor/,
    /seller authority.*(?:unclear|risk|issue|not verified|refuse)/,
    /unclear seller authority/,
    /probate/,
    /bankrupt/,
    /bankruptcy/,
    /winding[-\s]?up/,
    /forged/,
    /direct payment/,
    /outside stakeholder/,
    /bypass.*stakeholder/,
    /pay.*seller/,
    /side payment/
  ]);
  const loanRejectionRisk = hasSignal(profileNarrative, [/loan reject/, /rejected by.*bank/, /many banks/, /bank.*reject/, /ccris/, /ctos/]);
  const crowdWithoutConversion = hasSignal(dealNarrative, [/sales gallery/, /crowd/, /many viewer/, /many viewing/])
    && !hasSignal(dealNarrative, [/spa/, /signed/, /loan approval/, /absorption/, /converted/]);
  const fakeListingSignal = hasSignal(dealNarrative, [/fake listing/, /different price/, /portal.*price/]);
  const developerDiscountSignal = hasSignal(dealNarrative, [/developer.*discount/, /public discount/, /clear inventory/, /rebate/]);

  if (markedUpRisk) addHardStop(3, "Marked-up consideration, cash-back, or lender-misleading structure is outside Apex-approved deal boundaries.");
  if (bulkRisk) addHardStop(3, "Opaque bulk purchase structure should not be validated for a normal retail investor.");
  if (documentRisk) addHardStop(1, "Document, title, caveat, seller-authority, or fund-flow risk must be cleared by the lawyer before commitment.");
  if (loanRejectionRisk) addHardStop(2, "Repeated loan rejection or weak credit documentation suggests the buyer is forcing the deal.", "pause");
  if (crowdWithoutConversion) addWatchout("Sales-gallery crowd or viewing interest is not proof of real absorption.");
  if (fakeListingSignal) addWatchout("Fake or inconsistent portal listings suggest agent desperation or weak information quality.");
  if (developerDiscountSignal) addWatchout("Public developer discount may signal inventory pressure; verify net effective price and unsold stock.");

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
    addWatchout("The unit position may create a permanent rental and resale discount.");
  }
  if (dealCard.exitBuyerPool === "Own-stay and investor") propertyScore += 10;
  if (dealCard.exitBuyerPool === "Investor mainly" || dealCard.exitBuyerPool === "Unclear") {
    propertyScore -= 12;
    addWatchout("The exit buyer pool may be too narrow or investor-dependent.");
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
    addWatchout("The asking price is above the stated conservative fair value.");
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
      addWatchout("Post-deal debt service would consume a large share of declared income.");
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
    addWatchout("A near-term life commitment may compete with the capital required for this property.");
  }
  suitabilityScore = clampScore(suitabilityScore);

  let financingScore = 50;
  if (installment) financingScore += 10;
  if (postDealDsr !== null) financingScore += postDealDsr < 50 ? 20 : postDealDsr >= 80 ? -30 : -5;
  if (discountToFairValue !== null) financingScore += discountToFairValue >= 0 ? 10 : -20;
  if (holdingCashFlow !== null) financingScore += holdingCashFlow >= 0 ? 15 : -15;
  if (!installment) financingScore -= 20;
  financingScore = clampScore(financingScore);

  const parseComparableRange = (value) => {
    const matches = String(value || "").match(/(?:rm\s*)?\d+(?:[.,]\d+)?\s*(?:k|m|mil|million)?/gi) || [];
    const amounts = matches.map((item) => {
      const clean = String(item || "").toLowerCase().replace(/,/g, "").replace(/rm/g, "").trim();
      const match = clean.match(/(\d+(\.\d+)?)\s*(k|m|mil|million)?/);
      if (!match) return 0;
      const base = Number(match[1]);
      if (!Number.isFinite(base)) return 0;
      if (["m", "mil", "million"].includes(match[3])) return base * 1_000_000;
      if (match[3] === "k") return base * 1_000;
      return base;
    }).filter((amount) => Number.isFinite(amount) && amount > 0);
    if (!amounts.length) return { low: 0, high: 0 };
    return { low: Math.min(...amounts), high: Math.max(...amounts) };
  };
  const compStatusScore = { strong: 100, usable: 72, thin: 42, unsafe: 8, missing: 0 };
  const compCheck = (label, status, proof, gap, action) => ({
    label,
    status,
    proof,
    gap,
    action
  });
  const comparableRange = parseComparableRange(comparablePriceRangeText);
  const comparableCountStatus = dealCard.comparableTransactions === "3 or more"
    ? "strong"
    : dealCard.comparableTransactions === "1 to 2"
      ? "usable"
      : "missing";
  const comparableSourceStatus = /brickz|official|transaction|auction|valuation/.test(comparableSource)
    ? "strong"
    : /agent/.test(comparableSource)
      ? "usable"
      : /listing|portal|social|unknown/.test(comparableSource)
        ? "unsafe"
        : "missing";
  const comparableRecencyStatus = /0-6|6-12/.test(comparableRecency)
    ? "strong"
    : /12-24/.test(comparableRecency)
      ? "usable"
      : /older/.test(comparableRecency)
        ? "thin"
        : "missing";
  const comparableMatchStatus = /same project/.test(comparableMatchQuality)
    ? "strong"
    : /closest substitute/.test(comparableMatchQuality)
      ? "usable"
      : /same township/.test(comparableMatchQuality)
        ? "thin"
        : /weak substitute|unknown/.test(comparableMatchQuality)
          ? "unsafe"
          : "missing";
  const comparableRangeStatus = comparableRange.low && comparableRange.high && price
    ? price <= comparableRange.high ? "strong" : price <= comparableRange.high * 1.1 ? "thin" : "unsafe"
    : fairValue && price
      ? price <= fairValue ? "usable" : "thin"
      : "missing";
  const comparableAdjustmentStatus = comparableAdjustmentNotes
    ? "strong"
    : fairValue && comparableCountStatus !== "missing"
      ? "usable"
      : "missing";
  const comparableValuePosition = comparableRange.low && comparableRange.high && price
    ? price < comparableRange.low
      ? `Asking price is below the stated comparable range (${formatRinggit(comparableRange.low)} - ${formatRinggit(comparableRange.high)}).`
      : price <= comparableRange.high
        ? `Asking price sits inside the stated comparable range (${formatRinggit(comparableRange.low)} - ${formatRinggit(comparableRange.high)}).`
        : `Asking price is above the stated comparable range (${formatRinggit(comparableRange.low)} - ${formatRinggit(comparableRange.high)}).`
    : fairValue && price && discountToFairValue !== null
      ? discountToFairValue >= 0
        ? `Asking price is ${money(discountToFairValue)}% below conservative value.`
        : `Asking price is ${money(Math.abs(discountToFairValue))}% above conservative value.`
      : "Comparable range or conservative value is not enough to judge price position.";
  const comparableChecks = [
    compCheck(
      "Comparable count",
      comparableCountStatus,
      comparableCountStatus === "strong" ? "Three or more completed comparables are stated." : comparableCountStatus === "usable" ? "Only one to two completed comparables are stated." : "",
      comparableCountStatus === "missing" ? "Comparable transaction count is missing." : "",
      "Collect enough completed subsale or successful auction records to avoid relying on one isolated datapoint."
    ),
    compCheck(
      "Source quality",
      comparableSourceStatus,
      comparableSourceStatus === "strong" ? "Source is official transaction data, successful auction evidence, or bank valuation support." : comparableSourceStatus === "usable" ? "Agent-supplied completed comps can help, but need cross-checking." : "",
      comparableSourceStatus === "unsafe" ? "Listing-only or unknown source is not completed transaction proof." : comparableSourceStatus === "missing" ? "Comparable source is not recorded." : "",
      "Prefer Brickz, official transaction evidence, successful auction results, or banker-supported valuation references over listing prices."
    ),
    compCheck(
      "Recency",
      comparableRecencyStatus,
      comparableRecencyStatus === "strong" ? "Comparable evidence is within the recent 12-month window." : comparableRecencyStatus === "usable" ? "Comparable evidence is within 12 to 24 months." : "",
      comparableRecencyStatus === "thin" ? "Older comparables may not reflect current stagnant or shifting market liquidity." : comparableRecencyStatus === "missing" ? "Comparable recency is not recorded." : "",
      "Use the freshest completed evidence available, especially in projects affected by new supply, rate changes, or weak buyer liquidity."
    ),
    compCheck(
      "Match quality",
      comparableMatchStatus,
      comparableMatchStatus === "strong" ? "Comparable evidence comes from the same project." : comparableMatchStatus === "usable" ? "Closest substitute projects are used." : "",
      comparableMatchStatus === "thin" ? "Same township only is not enough unless the substitute package is genuinely similar." : comparableMatchStatus === "unsafe" ? "Weak substitutes can produce a false market value." : comparableMatchStatus === "missing" ? "Comparable match quality is not recorded." : "",
      "Compare against the same project first, then closest substitutes with similar location package, layout, age, tenure, facilities, and buyer pool."
    ),
    compCheck(
      "Price range fit",
      comparableRangeStatus,
      comparableRangeStatus === "strong" || comparableRangeStatus === "usable" ? comparableValuePosition : "",
      comparableRangeStatus === "unsafe" ? comparableValuePosition : comparableRangeStatus === "missing" ? "Comparable range or conservative value is not recorded." : "",
      "State the comparable range and explain whether the subject price is below, inside, or above the completed evidence band."
    ),
    compCheck(
      "Adjustment discipline",
      comparableAdjustmentStatus,
      comparableAdjustmentStatus === "strong" ? "Adjustments are recorded for physical and market differences." : comparableAdjustmentStatus === "usable" ? "Conservative value is supplied, but adjustment notes are still light." : "",
      comparableAdjustmentStatus === "missing" ? "No adjustment notes are recorded for floor, view, size, layout, renovation, parking, facing, or project reputation." : "",
      "Record the adjustment logic so the user does not mistake a different unit or weaker substitute for true value proof."
    )
  ];
  const transactionComparableScore = clampScore(
    compStatusScore[comparableCountStatus] * 0.2 +
    compStatusScore[comparableSourceStatus] * 0.25 +
    compStatusScore[comparableRecencyStatus] * 0.15 +
    compStatusScore[comparableMatchStatus] * 0.2 +
    compStatusScore[comparableRangeStatus] * 0.1 +
    compStatusScore[comparableAdjustmentStatus] * 0.1
  );
  const comparableUnsafe = [comparableSourceStatus, comparableMatchStatus, comparableRangeStatus].includes("unsafe");
  const comparableHasAnyProof = comparableCountStatus !== "missing" || comparableSourceStatus !== "missing" || fairValue || comparableRange.low;
  const transactionComparableStatus = comparableUnsafe
    ? "unsafe"
    : transactionComparableScore >= 85
      ? "strong"
      : transactionComparableScore >= 65
        ? "usable"
        : transactionComparableScore >= 40 || comparableHasAnyProof
          ? "thin"
          : "missing";
  const transactionComparableEvidence = {
    status: transactionComparableStatus,
    score: transactionComparableScore,
    summary: transactionComparableStatus === "strong"
      ? "Completed value proof is strong: source, recency, match quality, range, and adjustment discipline support the value."
      : transactionComparableStatus === "usable"
        ? "Completed value proof is usable, but Apex still wants one or two gaps tightened before full confidence."
        : transactionComparableStatus === "thin"
          ? "Completed value proof is thin. The price may be interesting, but the comparable basis is not yet dependable."
          : transactionComparableStatus === "unsafe"
            ? "Completed value proof is unsafe because the source, substitute match, or price range can mislead the decision."
            : "Completed value proof is missing.",
    valuePosition: comparableValuePosition,
    checks: comparableChecks
  };
  if (["unsafe", "missing"].includes(transactionComparableStatus)) {
    addBlocker("V4.1 transaction comparable evidence is not reliable enough to validate conservative value.");
  } else if (transactionComparableStatus === "thin") {
    addBlocker("V4.1 transaction comparable evidence is still thin; clear source, recency, match, range, and adjustment gaps before shortlist.");
  }

  const rentStatusScore = { strong: 100, usable: 72, thin: 42, unsafe: 8, missing: 0 };
  const rentCheck = (label, status, proof, gap, action) => ({
    label,
    status,
    proof,
    gap,
    action
  });
  const rentalBaseStatus = dealCard.rentEvidence === "Signed tenancy or achieved rent"
    ? "strong"
    : dealCard.rentEvidence === "Agent-confirmed"
      ? "usable"
      : dealCard.rentEvidence === "Listing only"
        ? "unsafe"
        : "missing";
  const rentalSourceStatus = /signed|tenancy|achieved|actual|manager|property manager/.test(rentalSource)
    ? "strong"
    : /active rental agent|agent/.test(rentalSource)
      ? "usable"
      : /listing|portal|unknown/.test(rentalSource)
        ? "unsafe"
        : "missing";
  const rentalRecencyStatus = /0-3|3-6/.test(rentalRecency)
    ? "strong"
    : /6-12/.test(rentalRecency)
      ? "usable"
      : /older/.test(rentalRecency)
        ? "thin"
        : "missing";
  const tenantUrgencyStatus = /high/.test(tenantUrgency)
    ? "strong"
    : /normal/.test(tenantUrgency)
      ? "usable"
      : /slow/.test(tenantUrgency)
        ? "thin"
        : /no enquiry|no inquiry|none/.test(tenantUrgency)
          ? "unsafe"
          : "missing";
  const vacancyStatus = /0-1|within 1|one month/.test(vacancySignal)
    ? "strong"
    : /1-2/.test(vacancySignal)
      ? "usable"
      : /more than 2|over 2|above 2/.test(vacancySignal)
        ? "thin"
        : "missing";
  const sustainabilityStatus = /stable|year-round|year round|consistent/.test(rentalSustainability)
    ? "strong"
    : /seasonal/.test(rentalSustainability)
      ? "usable"
      : /incentive|new supply|pressure|temporary/.test(rentalSustainability)
        ? "unsafe"
        : rentalSustainability
          ? "thin"
          : "missing";
  const coverageStatus = rent && installment
    ? holdingCashFlow !== null && holdingCashFlow >= 0
      ? "strong"
      : rent >= installment
        ? "usable"
        : "unsafe"
    : "missing";
  const rentalCoveragePosition = rent && installment
    ? holdingCashFlow !== null
      ? holdingCashFlow >= 0
        ? `Rent covers instalment and maintenance by ${formatRinggit(holdingCashFlow)} per month.`
        : `Rent is short of instalment and maintenance by ${formatRinggit(Math.abs(holdingCashFlow))} per month.`
      : rent >= installment
        ? "Rent covers the stated loan instalment before maintenance."
        : "Rent does not cover the stated loan instalment."
    : "Expected rent and instalment are not enough to judge rental coverage.";
  const rentalChecks = [
    rentCheck(
      "Rent evidence type",
      rentalBaseStatus,
      rentalBaseStatus === "strong" ? "Signed tenancy or achieved rent is supplied." : rentalBaseStatus === "usable" ? "Agent-confirmed rent is supplied." : "",
      rentalBaseStatus === "unsafe" ? "Listing-only rent can overstate real tenant demand." : rentalBaseStatus === "missing" ? "Rental evidence type is missing." : "",
      "Prefer signed tenancy or achieved rent. Agent feedback is useful only when it includes urgency, vacancy, and tenant profile."
    ),
    rentCheck(
      "Source quality",
      rentalSourceStatus,
      rentalSourceStatus === "strong" ? "Source indicates actual achieved rent or signed tenancy." : rentalSourceStatus === "usable" ? "Active rental agent input is useful but needs cross-checking." : "",
      rentalSourceStatus === "unsafe" ? "Listing-only or unknown source is not proof of real demand." : rentalSourceStatus === "missing" ? "Rental source is not recorded." : "",
      "Ask active rental agents or managers for achieved rent, not just advertised rent."
    ),
    rentCheck(
      "Recency",
      rentalRecencyStatus,
      rentalRecencyStatus === "strong" ? "Rental evidence is within the recent six-month window." : rentalRecencyStatus === "usable" ? "Rental evidence is within 6 to 12 months." : "",
      rentalRecencyStatus === "thin" ? "Older rental evidence may not capture new supply or tenant sentiment." : rentalRecencyStatus === "missing" ? "Rental recency is not recorded." : "",
      "Use fresh rental evidence, especially near VP batches, new competing supply, or seasonal university/job-cycle periods."
    ),
    rentCheck(
      "Tenant urgency",
      tenantUrgencyStatus,
      tenantUrgencyStatus === "strong" ? "Tenant enquiry urgency is high." : tenantUrgencyStatus === "usable" ? "Tenant enquiry urgency appears normal." : "",
      tenantUrgencyStatus === "thin" ? "Slow enquiries can still rent, but pricing and furnishing must be checked." : tenantUrgencyStatus === "unsafe" ? "No enquiry signal means rent is not proven." : tenantUrgencyStatus === "missing" ? "Tenant urgency is not recorded." : "",
      "Ask agents how quickly real tenants are calling, viewing, and committing at the target rent."
    ),
    rentCheck(
      "Vacancy friction",
      vacancyStatus,
      vacancyStatus === "strong" ? "Expected vacancy is within the one-month founder baseline." : vacancyStatus === "usable" ? "Vacancy is moderate and needs owner holding buffer." : "",
      vacancyStatus === "thin" ? "More than two months of vacancy pressure can damage cash-flow assumptions." : vacancyStatus === "missing" ? "Vacancy signal is not recorded." : "",
      "Judge rent together with vacancy period. A high rent that takes too long to secure is not the same as stable rent."
    ),
    rentCheck(
      "Sustainability",
      sustainabilityStatus,
      sustainabilityStatus === "strong" ? "Demand is stated as stable, not just seasonal or incentive-supported." : sustainabilityStatus === "usable" ? "Seasonal demand is explainable, but timing risk remains." : "",
      sustainabilityStatus === "unsafe" ? "Incentives, temporary demand, or new supply pressure may make the rent unreliable." : sustainabilityStatus === "missing" ? "Rental sustainability is not recorded." : "",
      "Separate stable demand from admission season, job-change season, incentives, and temporary shortages."
    ),
    rentCheck(
      "Coverage fit",
      coverageStatus,
      coverageStatus === "strong" || coverageStatus === "usable" ? rentalCoveragePosition : "",
      coverageStatus === "unsafe" ? rentalCoveragePosition : coverageStatus === "missing" ? "Expected rent or instalment is missing." : "",
      "For normal retail investors, rent should at least cover the loan instalment, with maintenance and vacancy stress reviewed separately."
    )
  ];
  const achievedRentalScore = clampScore(
    rentStatusScore[rentalBaseStatus] * 0.18 +
    rentStatusScore[rentalSourceStatus] * 0.18 +
    rentStatusScore[rentalRecencyStatus] * 0.14 +
    rentStatusScore[tenantUrgencyStatus] * 0.15 +
    rentStatusScore[vacancyStatus] * 0.12 +
    rentStatusScore[sustainabilityStatus] * 0.11 +
    rentStatusScore[coverageStatus] * 0.12
  );
  const rentalUnsafe = [rentalBaseStatus, rentalSourceStatus, tenantUrgencyStatus, sustainabilityStatus, coverageStatus].includes("unsafe");
  const rentalHasAnyProof = rentalBaseStatus !== "missing" || rentalSourceStatus !== "missing" || rent;
  const achievedRentalStatus = rentalUnsafe
    ? "unsafe"
    : achievedRentalScore >= 85
      ? "strong"
      : achievedRentalScore >= 65
        ? "usable"
        : achievedRentalScore >= 40 || rentalHasAnyProof
          ? "thin"
          : "missing";
  const achievedRentalEvidence = {
    status: achievedRentalStatus,
    score: achievedRentalScore,
    summary: achievedRentalStatus === "strong"
      ? "Rental proof is strong: achieved rent, source quality, recency, tenant urgency, vacancy, sustainability, and coverage support the holding case."
      : achievedRentalStatus === "usable"
        ? "Rental proof is usable, but Apex still wants stronger details before treating rent as fully dependable."
        : achievedRentalStatus === "thin"
          ? "Rental proof is thin. The rent may be possible, but the demand and vacancy assumptions are not yet dependable."
          : achievedRentalStatus === "unsafe"
            ? "Rental proof is unsafe because listing-only rent, weak urgency, unstable demand, or poor coverage can mislead the holding decision."
            : "Rental proof is missing.",
    coveragePosition: rentalCoveragePosition,
    checks: rentalChecks
  };
  if (["unsafe", "missing"].includes(achievedRentalStatus)) {
    addBlocker("V4.2 achieved rental evidence is not reliable enough to validate holding power.");
  } else if (achievedRentalStatus === "thin") {
    addBlocker("V4.2 achieved rental evidence is still thin; clear source, recency, urgency, vacancy, sustainability, and coverage gaps before shortlist.");
  }

  const financeStatusScore = { strong: 100, usable: 72, thin: 42, unsafe: 8, missing: 0 };
  const financeCheck = (label, status, proof, gap, action) => ({
    label,
    status,
    proof,
    gap,
    action
  });
  const valuationSupportStatus = /multiple|bank valuation|banker support|indicative/.test(bankValuationSupport)
    ? /multiple|bank valuation/.test(bankValuationSupport) ? "strong" : "usable"
    : /agent|verbal/.test(bankValuationSupport)
      ? "thin"
      : /below price|shortfall|valuation below/.test(bankValuationSupport)
        ? "unsafe"
        : bankValuationSupport
          ? "missing"
          : "missing";
  const valuationFitStatus = price && fairValue
    ? price <= fairValue
      ? "strong"
      : price <= fairValue * 1.05
        ? "usable"
        : price <= fairValue * 1.1
          ? "thin"
          : "unsafe"
    : "missing";
  const loanPrecheckEvidenceStatus = /pre.?approved|eligibility checked|approved/.test(loanPrecheckStatus)
    ? "strong"
    : /likely|banker says|banker/.test(loanPrecheckStatus)
      ? "usable"
      : /not checked|pending/.test(loanPrecheckStatus)
        ? "thin"
        : /reject|weak/.test(loanPrecheckStatus)
          ? "unsafe"
          : "missing";
  const loanMarginStatus = /80|lower|conservative/.test(loanMarginPlan)
    ? "strong"
    : /90|standard/.test(loanMarginPlan)
      ? "strong"
      : /above|cash.?out|cash out|max/.test(loanMarginPlan)
        ? holdingCashFlow !== null && holdingCashFlow > 300 ? "thin" : "unsafe"
        : "missing";
  const dsrEvidenceStatus = postDealDsr !== null
    ? postDealDsr < 50
      ? "strong"
      : postDealDsr < 70
        ? "usable"
        : postDealDsr < 80
          ? "thin"
          : "unsafe"
    : "missing";
  const instalmentStressStatus = /not tested/.test(instalmentStress)
    ? "missing"
    : /base only|base/.test(instalmentStress)
      ? "thin"
      : /10|higher|stress tested|tested/.test(instalmentStress)
        ? "strong"
        : "missing";
  const cashBufferStatus = /6\+|six|6 months|above 6|more than 6/.test(cashBufferAfterPurchase)
    ? "strong"
    : /3-6|3 to 6|three/.test(cashBufferAfterPurchase)
      ? "usable"
      : /below 3|less than 3|under 3/.test(cashBufferAfterPurchase)
        ? "unsafe"
        : cashAfterPurchase !== null && reserveMonths >= 6
          ? "usable"
          : "missing";
  const documentReadinessStatus = /complete|ctos|ccris|income/.test(financingDocumentReadiness)
    ? "strong"
    : /partial/.test(financingDocumentReadiness)
      ? "usable"
      : /weak|reject|rejected|low score/.test(financingDocumentReadiness)
        ? "unsafe"
        : "missing";
  const affordabilityPosition = [
    postDealDsr === null ? "Post-deal DSR is not calculated." : `Post-deal DSR is about ${money(postDealDsr)}%.`,
    cashAfterPurchase === null ? "Cash after purchase is not calculated." : `Cash after stated outlay is ${formatRinggit(cashAfterPurchase)}.`,
    holdingCashFlow === null ? "Rental coverage is not calculated." : holdingCashFlow >= 0 ? `Monthly holding shows ${formatRinggit(holdingCashFlow)} surplus before deeper stress.` : `Monthly holding shows ${formatRinggit(Math.abs(holdingCashFlow))} shortfall.`
  ].join(" ");
  const financingChecks = [
    financeCheck(
      "Bank valuation support",
      valuationSupportStatus,
      valuationSupportStatus === "strong" ? "Bank valuation support is stated clearly." : valuationSupportStatus === "usable" ? "Banker indicative support is useful but should be confirmed." : "",
      valuationSupportStatus === "thin" ? "Agent-only valuation claim can overstate bankability." : valuationSupportStatus === "unsafe" ? "Valuation support appears below price or has shortfall risk." : valuationSupportStatus === "missing" ? "Bank valuation support is not recorded." : "",
      "Ask banker for valuation basis, supported amount, margin, likely shortfall, and whether comparable evidence aligns with the bank view."
    ),
    financeCheck(
      "Price versus value",
      valuationFitStatus,
      valuationFitStatus === "strong" || valuationFitStatus === "usable" ? "Asking price is inside or close to conservative fair value." : "",
      valuationFitStatus === "thin" ? "Asking price is above conservative value and needs stronger justification." : valuationFitStatus === "unsafe" ? "Asking price is materially above conservative value." : valuationFitStatus === "missing" ? "Price or conservative value is missing." : "",
      "Do not rely on bank approval alone if the purchase price is above conservative completed-value evidence."
    ),
    financeCheck(
      "Loan precheck",
      loanPrecheckEvidenceStatus,
      loanPrecheckEvidenceStatus === "strong" ? "Loan eligibility or pre-approval is checked." : loanPrecheckEvidenceStatus === "usable" ? "Banker indicates likely approval." : "",
      loanPrecheckEvidenceStatus === "thin" ? "Loan has not been properly checked yet." : loanPrecheckEvidenceStatus === "unsafe" ? "Loan rejection or weak profile signal means the buyer may be forcing the deal." : loanPrecheckEvidenceStatus === "missing" ? "Loan precheck status is not recorded." : "",
      "Check eligibility with the right bank before offer pressure starts, including DSR, income documents, CTOS/CCRIS, and property type restrictions."
    ),
    financeCheck(
      "Loan margin discipline",
      loanMarginStatus,
      loanMarginStatus === "strong" ? "Loan margin is standard or conservative." : loanMarginStatus === "thin" ? "Cash-out or high leverage only looks tolerable because rent coverage has a buffer." : "",
      loanMarginStatus === "unsafe" ? "High leverage or cash-out is unsafe without strong rent coverage and cash reserve." : loanMarginStatus === "missing" ? "Loan margin plan is not recorded." : "",
      "Do not maximise loan margin just to avoid upfront cash outlay. Match loan amount to repayment comfort under downturn."
    ),
    financeCheck(
      "DSR fit",
      dsrEvidenceStatus,
      dsrEvidenceStatus === "strong" ? affordabilityPosition : dsrEvidenceStatus === "usable" ? affordabilityPosition : "",
      dsrEvidenceStatus === "thin" ? `${affordabilityPosition} DSR is elevated.` : dsrEvidenceStatus === "unsafe" ? `${affordabilityPosition} DSR is in the danger zone.` : dsrEvidenceStatus === "missing" ? "Income, debt, or instalment is missing." : "",
      "Use post-deal DSR, not just current income, to decide whether the investor is ready."
    ),
    financeCheck(
      "Instalment stress",
      instalmentStressStatus,
      instalmentStressStatus === "strong" ? "Higher instalment stress is recorded as tested." : "",
      instalmentStressStatus === "thin" ? "Only base instalment is considered." : instalmentStressStatus === "missing" ? "Instalment increase stress is not recorded." : "",
      "Stress-test at least a 10% instalment increase and confirm rent/cash reserve can absorb it."
    ),
    financeCheck(
      "Cash buffer",
      cashBufferStatus,
      cashBufferStatus === "strong" ? "Post-purchase cash buffer meets the six-month baseline." : cashBufferStatus === "usable" ? "Cash buffer is usable but should be protected." : "",
      cashBufferStatus === "unsafe" ? "Cash buffer after purchase is below the safe baseline." : cashBufferStatus === "missing" ? "Post-purchase cash buffer is not recorded." : "",
      "Keep at least six months of salary or living reserve after down payment, fees, renovation, furnishing, and deposits."
    ),
    financeCheck(
      "Document readiness",
      documentReadinessStatus,
      documentReadinessStatus === "strong" ? "Income, CTOS/CCRIS, or loan documents are stated as complete." : documentReadinessStatus === "usable" ? "Some documents are ready, but approval confidence is not final." : "",
      documentReadinessStatus === "unsafe" ? "Weak credit or rejected documents signal approval risk." : documentReadinessStatus === "missing" ? "Financing document readiness is not recorded." : "",
      "Prepare income proof, bank statements, CTOS/CCRIS, tax documents, and property documents before treating approval as safe."
    )
  ];
  const financingValuationScore = clampScore(
    financeStatusScore[valuationSupportStatus] * 0.16 +
    financeStatusScore[valuationFitStatus] * 0.16 +
    financeStatusScore[loanPrecheckEvidenceStatus] * 0.14 +
    financeStatusScore[loanMarginStatus] * 0.1 +
    financeStatusScore[dsrEvidenceStatus] * 0.16 +
    financeStatusScore[instalmentStressStatus] * 0.1 +
    financeStatusScore[cashBufferStatus] * 0.1 +
    financeStatusScore[documentReadinessStatus] * 0.08
  );
  const financingUnsafe = [valuationSupportStatus, valuationFitStatus, loanPrecheckEvidenceStatus, loanMarginStatus, dsrEvidenceStatus, cashBufferStatus, documentReadinessStatus].includes("unsafe");
  const financingHasAnyProof = installment || fairValue || bankValuationSupport || loanPrecheckStatus || loanMarginPlan || financingDocumentReadiness;
  const financingValuationStatus = financingUnsafe
    ? "unsafe"
    : financingValuationScore >= 85
      ? "strong"
      : financingValuationScore >= 65
        ? "usable"
        : financingValuationScore >= 40 || financingHasAnyProof
          ? "thin"
          : "missing";
  const financingValuationEvidence = {
    status: financingValuationStatus,
    score: financingValuationScore,
    summary: financingValuationStatus === "strong"
      ? "Financing and valuation proof is strong: bankability, price-value fit, DSR, stress, cash buffer, and documents support the structure."
      : financingValuationStatus === "usable"
        ? "Financing and valuation proof is usable, but Apex still wants stronger checks before treating the structure as safe."
        : financingValuationStatus === "thin"
          ? "Financing and valuation proof is thin. The deal may qualify, but repayment comfort and bankability are not proven enough."
          : financingValuationStatus === "unsafe"
            ? "Financing and valuation proof is unsafe because valuation, approval, leverage, DSR, cash buffer, or documents can break the deal."
            : "Financing and valuation proof is missing.",
    affordabilityPosition,
    checks: financingChecks
  };
  if (["unsafe", "missing"].includes(financingValuationStatus)) {
    addBlocker("V4.3 financing and valuation evidence is not reliable enough to validate the deal structure.");
  } else if (financingValuationStatus === "thin") {
    addBlocker("V4.3 financing and valuation evidence is still thin; clear valuation, DSR, margin, stress, cash buffer, and document gaps before shortlist.");
  }
  financingScore = clampScore(financingScore + (financingValuationStatus === "strong" ? 8 : financingValuationStatus === "usable" ? 4 : financingValuationStatus === "thin" ? -5 : financingValuationStatus === "unsafe" ? -18 : -10));

  const supplyStatusScore = { strong: 100, usable: 72, thin: 42, unsafe: 8, missing: 0 };
  const supplyCheck = (label, status, proof, gap, action) => ({
    label,
    status,
    proof,
    gap,
    action
  });
  const oldSupplyRiskSignal = dealCard.nearbySupply && hasStatedRisk(dealCard.nearbySupply);
  const supplyRadiusStatus = /2\.?5|within/.test(supplyRadius)
    ? "strong"
    : /same road|same township|same district/.test(supplyRadius)
      ? "thin"
      : /not checked|unknown/.test(supplyRadius)
        ? "missing"
        : supplyRadius
          ? "usable"
          : "missing";
  const substituteCountStatus = /less than 5|below 5|under 5|0-4|none|no direct/.test(substituteCount)
    ? "strong"
    : /5 or more|above 5|many/.test(substituteCount)
      ? "unsafe"
      : /unknown/.test(substituteCount)
        ? "missing"
        : substituteCount
          ? "usable"
          : "missing";
  const substituteThreatStatus = /no direct|different segment|not comparable/.test(substituteThreat)
    ? "strong"
    : /complement|masterplan|master developer/.test(substituteThreat)
      ? "usable"
      : /newer similar|similar layout|lower price|comparable price|same tenant|same buyer/.test(substituteThreat)
        ? "unsafe"
        : /unknown/.test(substituteThreat)
          ? "missing"
          : substituteThreat
            ? "thin"
            : "missing";
  const supplyTimingStatus = /no material|no vp|no near/.test(futureSupplyTiming)
    ? "strong"
    : /announcement|launch only/.test(futureSupplyTiming)
      ? "usable"
      : /under construction/.test(futureSupplyTiming)
        ? "thin"
        : /vp|vacant possession|newly completed|completion|within 12/.test(futureSupplyTiming)
          ? "unsafe"
          : /unknown/.test(futureSupplyTiming)
            ? "missing"
            : futureSupplyTiming
              ? "thin"
              : "missing";
  const absorptionStatus = /occupancy.*rent|rent.*holding|strong occupancy|strong rent/.test(absorptionEvidence)
    ? "strong"
    : /sales rate|unsold.*healthy|agent confirms|healthy/.test(absorptionEvidence)
      ? "usable"
      : /weak|no enquiry|rental drop|occupancy drop|unsold high|slow/.test(absorptionEvidence)
        ? "unsafe"
        : /unknown/.test(absorptionEvidence)
          ? "missing"
          : absorptionEvidence
            ? "thin"
            : "missing";
  const unsoldStockStatus = /less than 1|below 1|minimal|healthy/.test(unsoldStockSignal)
    ? "strong"
    : /elevated|many unsold|high unsold|discount/.test(unsoldStockSignal)
      ? "thin"
      : /bulk purchase|bulk group|clear inventory|developer desperate/.test(unsoldStockSignal)
        ? "unsafe"
        : /unknown/.test(unsoldStockSignal)
          ? "missing"
          : unsoldStockSignal
            ? "usable"
            : "missing";
  const densityLiftStatus = /below 1\.?5|under 1\.?5|lift wait acceptable|acceptable lift/.test(densityLiftStress)
    ? "strong"
    : /high density but prime|prime pricing|acceptable in prime/.test(densityLiftStress)
      ? "usable"
      : /1\.?5k|1500|lift wait|waiting time|too dense|too high/.test(densityLiftStress)
        ? "unsafe"
        : /unknown/.test(densityLiftStress)
          ? "missing"
          : densityLiftStress
            ? "thin"
            : "missing";
  const supplyNotesStatus = dealCard.nearbySupply || supplyNotes
    ? oldSupplyRiskSignal
      ? "thin"
      : "strong"
    : "missing";
  const competitionPosition = substituteThreatStatus === "strong" && absorptionStatus === "strong"
    ? "Closest substitutes do not currently threaten the tenant or buyer pool."
    : substituteThreatStatus === "unsafe"
      ? "A newer, similar, or cheaper substitute can steal the same tenant or future buyer."
      : absorptionStatus === "unsafe"
        ? "Absorption evidence is weak; supply may already be pressuring rent or liquidity."
        : densityLiftStatus === "unsafe"
          ? "Density or lift waiting time can become a permanent competitiveness problem."
          : "Supply position is not proven enough; check substitutes, timing, absorption, unsold stock, and density.";
  const supplyChecks = [
    supplyCheck(
      "Supply radius",
      supplyRadiusStatus,
      supplyRadiusStatus === "strong" ? "Supply check uses the founder's 2.5km substitute radius." : supplyRadiusStatus === "usable" ? "Supply radius is stated, but confirm the exact substitute catchment." : "",
      supplyRadiusStatus === "thin" ? "A narrower supply check can miss nearby projects competing for the same tenant or buyer." : supplyRadiusStatus === "missing" ? "Supply check radius is not recorded." : "",
      "Check direct substitutes within roughly 2.5km, then narrow by same road, township, access, and tenant/buyer pool."
    ),
    supplyCheck(
      "Substitute count",
      substituteCountStatus,
      substituteCountStatus === "strong" ? "Competing substitute count is within the founder's comfort range." : substituteCountStatus === "usable" ? "Competing substitute count is stated." : "",
      substituteCountStatus === "unsafe" ? "Five or more close substitutes creates choice pressure for tenants and buyers." : substituteCountStatus === "missing" ? "Competing substitute count is not recorded." : "",
      "List the closest substitute projects and compare them by package, not just distance."
    ),
    supplyCheck(
      "Substitute threat",
      substituteThreatStatus,
      substituteThreatStatus === "strong" ? "No direct newer similar substitute is stated." : substituteThreatStatus === "usable" ? "Supply may be complementary under a stronger masterplan." : "",
      substituteThreatStatus === "unsafe" ? "Newer similar layout or comparable/lower pricing is a direct threat." : substituteThreatStatus === "missing" ? "Substitute threat is not recorded." : "",
      "Treat newer similar high-rises with similar layout and pricing as serious threats until rent and absorption prove otherwise."
    ),
    supplyCheck(
      "Future supply timing",
      supplyTimingStatus,
      supplyTimingStatus === "strong" ? "No material VP or completion pressure is stated." : supplyTimingStatus === "usable" ? "Supply is still announcement or launch-stage, so timing risk is lower." : "",
      supplyTimingStatus === "thin" ? "Under-construction supply can become real soon." : supplyTimingStatus === "unsafe" ? "Vacant possession or newly completed supply is the point where rental pressure usually appears." : supplyTimingStatus === "missing" ? "Future supply timing is not recorded." : "",
      "Map future supply by announcement, launch, construction, VP, and first rental wave. VP is the serious pressure point."
    ),
    supplyCheck(
      "Absorption proof",
      absorptionStatus,
      absorptionStatus === "strong" ? "Occupancy and rent are holding against nearby supply." : absorptionStatus === "usable" ? "Sales rate, unsold stock, or agent feedback supports partial absorption." : "",
      absorptionStatus === "unsafe" ? "Weak enquiries, slow sales, rising vacancy, or rental reduction suggests demand is not absorbing supply." : absorptionStatus === "missing" ? "Absorption evidence is not recorded." : "",
      "Verify existing occupancy, achieved rent, tenant enquiries, sales rate, unsold units, and whether new supply is reducing rent."
    ),
    supplyCheck(
      "Unsold stock",
      unsoldStockStatus,
      unsoldStockStatus === "strong" ? "Unsold developer stock is within the founder's low-risk range." : unsoldStockStatus === "usable" ? "Unsold stock signal is recorded." : "",
      unsoldStockStatus === "thin" ? "Elevated unsold stock can signal ambitious pricing or weak demand." : unsoldStockStatus === "unsafe" ? "Bulk purchase or desperate inventory clearing is a project-level warning." : unsoldStockStatus === "missing" ? "Unsold stock signal is not recorded." : "",
      "Check unsold stock, public discounts, bulk-purchase activity, and whether remaining units are only weak layouts."
    ),
    supplyCheck(
      "Density and lift stress",
      densityLiftStatus,
      densityLiftStatus === "strong" ? "Density and lift waiting time are stated as acceptable." : densityLiftStatus === "usable" ? "High density may be acceptable because the location and pricing compensate." : "",
      densityLiftStatus === "unsafe" ? "Very high density or lift waiting time can damage own-stay emotion and resale resilience." : densityLiftStatus === "missing" ? "Density and lift stress are not recorded." : "",
      "For high-rise, check total units, plot ratio, number of lifts, waiting time, facility load, security traffic, and maintenance sustainability."
    ),
    supplyCheck(
      "Ground notes",
      supplyNotesStatus,
      supplyNotesStatus === "strong" ? "Supply notes or nearby supply comment is recorded without flagging direct risk." : "",
      supplyNotesStatus === "thin" ? "The free-text supply note flags risk but does not yet prove absorption." : supplyNotesStatus === "missing" ? "Supply notes are not recorded." : "",
      "Record the actual substitute names, rental pressure, VP batch, occupancy, and why this subject still defends demand."
    )
  ];
  const supplyAbsorptionScore = clampScore(
    supplyStatusScore[supplyRadiusStatus] * 0.1 +
    supplyStatusScore[substituteCountStatus] * 0.12 +
    supplyStatusScore[substituteThreatStatus] * 0.18 +
    supplyStatusScore[supplyTimingStatus] * 0.15 +
    supplyStatusScore[absorptionStatus] * 0.18 +
    supplyStatusScore[unsoldStockStatus] * 0.12 +
    supplyStatusScore[densityLiftStatus] * 0.1 +
    supplyStatusScore[supplyNotesStatus] * 0.05
  );
  const supplyUnsafe = [substituteCountStatus, substituteThreatStatus, supplyTimingStatus, absorptionStatus, unsoldStockStatus, densityLiftStatus].includes("unsafe");
  const supplyKnown = Boolean(dealCard.nearbySupply || supplyRadius || substituteCount || substituteThreat || futureSupplyTiming || absorptionEvidence || unsoldStockSignal || densityLiftStress || supplyNotes);
  const supplyRisk = supplyUnsafe || (oldSupplyRiskSignal && !/no direct|no similar|none/.test(String(dealCard.nearbySupply || "").toLowerCase()));
  const supplyAbsorptionStatus = supplyUnsafe
    ? "unsafe"
    : supplyAbsorptionScore >= 85
      ? "strong"
      : supplyAbsorptionScore >= 65
        ? "usable"
        : supplyAbsorptionScore >= 40 || supplyKnown
          ? "thin"
          : "missing";
  const supplyAbsorptionEvidence = {
    status: supplyAbsorptionStatus,
    score: supplyAbsorptionScore,
    summary: supplyAbsorptionStatus === "strong"
      ? "Supply and competition evidence is strong: substitutes, timing, absorption, stock, density, and lift stress are controlled."
      : supplyAbsorptionStatus === "usable"
        ? "Supply evidence is usable, but Apex still wants stronger absorption proof before treating the market as protected."
        : supplyAbsorptionStatus === "thin"
          ? "Supply evidence is thin. The market may still absorb the deal, but substitute and VP risk are not proven enough."
          : supplyAbsorptionStatus === "unsafe"
            ? "Supply evidence is unsafe because nearby substitute, timing, absorption, unsold stock, density, or lift pressure can weaken rent or resale."
            : "Supply and absorption evidence is missing.",
    competitionPosition,
    checks: supplyChecks
  };
  if (["unsafe", "missing"].includes(supplyAbsorptionStatus)) {
    addBlocker("V4.4 supply and absorption evidence is not reliable enough to validate market demand.");
  } else if (supplyAbsorptionStatus === "thin") {
    addBlocker("V4.4 supply and absorption evidence is still thin; clear substitute count, threat, VP timing, absorption, unsold stock, and lift-density gaps before shortlist.");
  }

  const siteStatusScore = { strong: 100, usable: 72, thin: 42, unsafe: 8, missing: 0 };
  const siteCheck = (label, status, proof, gap, action) => ({
    label,
    status,
    proof,
    gap,
    action
  });
  const siteVisitProofStatus = dealCard.siteVisit !== "Completed"
    ? "missing"
    : /photo|notes|physical|management office|guardhouse|lobby|facility|completed with evidence/.test(siteVisitEvidence)
      ? "strong"
      : siteVisitEvidence || dealCard.siteVisitNotes
        ? "usable"
        : "thin";
  const lobbyStatus = /good|grand|welcoming|comfortable|peaceful|secure|good service|professional|friendly/.test(lobbyGuardhouseSignal)
    ? "strong"
    : /poor|dirty|weak|rude|unwelcoming|security weak|bad attitude|not secure/.test(lobbyGuardhouseSignal)
      ? "unsafe"
      : /unknown/.test(lobbyGuardhouseSignal)
        ? "missing"
        : lobbyGuardhouseSignal
          ? "thin"
          : "missing";
  const liftCarparkStatus = /fast|bright|wide|dry|acceptable|good|well lit|enough lift/.test(liftCarparkCorridorSignal)
    ? "strong"
    : /slow|long wait|waiting time concern|dark|narrow|rain splash|refuse|noise|unsafe|bad/.test(liftCarparkCorridorSignal)
      ? "unsafe"
      : /unknown/.test(liftCarparkCorridorSignal)
        ? "missing"
        : liftCarparkCorridorSignal
          ? "thin"
          : "missing";
  const commonAreaStatus = /clean|well maintained|maintained|good facility|family|orderly|functional/.test(commonAreaCondition)
    ? "strong"
    : /dirty|broken|poor|decay|short.?stay|airbnb|high traffic|neglected|damaged/.test(commonAreaCondition)
      ? "unsafe"
      : /unknown/.test(commonAreaCondition)
        ? "missing"
        : commonAreaCondition
          ? "thin"
          : "missing";
  const residentStatus = /family|respectful|responsible|owner|professional|student|orderly|considerate/.test(residentBehaviourSignal)
    ? "strong"
    : /complaint|misuse|overcrowd|short.?stay|arrogant|inconsiderate|problem|nuisance|unsafe/.test(residentBehaviourSignal)
      ? "unsafe"
      : /unknown/.test(residentBehaviourSignal)
        ? "missing"
        : residentBehaviourSignal
          ? "thin"
          : "missing";
  const managementResponseStatus = /fast|responsive|solution|efficient|good|helpful|clear answer/.test(managementResponseSignal)
    ? "strong"
    : /mixed|average|slow but reply|partial/.test(managementResponseSignal)
      ? "usable"
      : /no reply|late|irresponsible|dispute|lawsuit|self interest|misuse|poor|rude/.test(managementResponseSignal)
        ? "unsafe"
        : /unknown/.test(managementResponseSignal)
          ? "missing"
          : managementResponseSignal
            ? "thin"
            : "missing";
  const defectStatus = /no (?:major )?(?:defect|leak)|no .*leak|checked clear|clear|minor only|normal wear/.test(defectLeakageSignal)
    ? "strong"
    : /minor|wear and tear|normal/.test(defectLeakageSignal)
      ? "usable"
      : /leak|water mark|structural|major|defect|poor material|mould|mold|crack/.test(defectLeakageSignal)
        ? "unsafe"
        : /unknown/.test(defectLeakageSignal)
          ? "missing"
          : defectLeakageSignal
            ? "thin"
            : "missing";
  const arrearsJmbStatus = /healthy|low arrears|agm active|good jmb|collection healthy|sinking fund healthy/.test(arrearsJmbSignal)
    ? "strong"
    : /underfunded but improving|some arrears|monitor/.test(arrearsJmbSignal)
      ? "usable"
      : /high arrears|lawsuit|dispute|misuse|poor collection|no agm|fund issue|self interest/.test(arrearsJmbSignal)
        ? "unsafe"
        : /unknown/.test(arrearsJmbSignal)
          ? "missing"
          : arrearsJmbSignal
            ? "thin"
            : "missing";
  const siteNotesStatus = siteManagementNotes || dealCard.siteVisitNotes || dealCard.inspectionConcern
    ? "strong"
    : "missing";
  const livedQualityPosition = managementResponseStatus === "strong" && lobbyStatus === "strong" && commonAreaStatus === "strong" && residentStatus === "strong"
    ? "The development has defensible lived-quality evidence: arrival feel, common areas, residents, and management response are aligned."
    : managementResponseStatus === "unsafe"
      ? "Management response is a structural risk; good rent or cheap entry should not override it."
      : defectStatus === "unsafe"
        ? "Defect or leakage evidence can become a permanent negotiation and holding-cost problem."
        : residentStatus === "unsafe"
          ? "Resident behaviour or project culture can weaken own-stay emotion and future saleability."
          : "Lived quality is not proven enough; Apex needs specific site, resident, defect, and management evidence.";
  const siteManagementChecks = [
    siteCheck(
      "Site visit proof",
      siteVisitProofStatus,
      siteVisitProofStatus === "strong" ? "Physical visit evidence is recorded beyond a checkbox." : siteVisitProofStatus === "usable" ? "Site visit is completed, but evidence detail can be sharper." : "",
      siteVisitProofStatus === "thin" ? "Site visit is marked completed but proof detail is thin." : siteVisitProofStatus === "missing" ? "Site visit is not completed or not evidenced." : "",
      "Capture site photos or notes on arrival, lobby, guardhouse, lift, car park, corridor, refuse room, facilities, residents, defects, and management office."
    ),
    siteCheck(
      "Lobby and guardhouse",
      lobbyStatus,
      lobbyStatus === "strong" ? "Arrival experience and security signal are positive." : "",
      lobbyStatus === "unsafe" ? "Poor lobby or guardhouse signal weakens own-stay emotion." : lobbyStatus === "missing" ? "Lobby and guardhouse signal is not recorded." : "",
      "Check whether the lobby feels like coming home and whether guardhouse service feels professional, secure, and respectful."
    ),
    siteCheck(
      "Lift, car park, corridor",
      liftCarparkStatus,
      liftCarparkStatus === "strong" ? "Lift, car park, or corridor condition is stated as acceptable." : "",
      liftCarparkStatus === "unsafe" ? "Lift wait, dark car park, narrow access, rain splash, or refuse-room exposure can become daily friction." : liftCarparkStatus === "missing" ? "Lift, car park, and corridor signal is not recorded." : "",
      "Observe lift speed, waiting time, car-park brightness, ramp and bay usability, corridor width, rain splash, and refuse-room ventilation."
    ),
    siteCheck(
      "Common areas and facilities",
      commonAreaStatus,
      commonAreaStatus === "strong" ? "Common areas and facilities appear clean and maintained." : "",
      commonAreaStatus === "unsafe" ? "Dirty, broken, neglected, or short-stay-heavy common areas can accelerate project decay." : commonAreaStatus === "missing" ? "Common-area condition is not recorded." : "",
      "Check facility cleanliness, maintenance condition, security traffic, short-stay load, and whether the common areas still support the project's image."
    ),
    siteCheck(
      "Resident behaviour",
      residentStatus,
      residentStatus === "strong" ? "Resident behaviour or project culture is stated as healthy." : "",
      residentStatus === "unsafe" ? "Observable behaviour, overcrowding, nuisance, or short-stay traffic can damage long-term image." : residentStatus === "missing" ? "Resident behaviour signal is not recorded." : "",
      "Judge project culture by observable conduct, complaints, use of facilities, security traffic, and whether families or long-stay residents are comfortable there."
    ),
    siteCheck(
      "Management response",
      managementResponseStatus,
      managementResponseStatus === "strong" ? "Management response is fast and solution-oriented." : managementResponseStatus === "usable" ? "Management response is usable but should be monitored." : "",
      managementResponseStatus === "unsafe" ? "Poor management response is a structural value risk." : managementResponseStatus === "missing" ? "Management response is not recorded." : "",
      "Ask management about arrears, complaints, lift issues, unresolved defects, sinking fund, and response time. Their attitude matters."
    ),
    siteCheck(
      "Defect and leakage",
      defectStatus,
      defectStatus === "strong" ? "No major defect or leakage concern is stated." : defectStatus === "usable" ? "Only normal wear or minor issues are stated." : "",
      defectStatus === "unsafe" ? "Leakage, structural defect, poor materials, or mould can hurt holding cost and resale negotiation." : defectStatus === "missing" ? "Defect and leakage check is not recorded." : "",
      "Inspect ceiling, wet areas, walls, windows, fixtures, water marks, material quality, and recurring defect complaints."
    ),
    siteCheck(
      "Arrears and JMB culture",
      arrearsJmbStatus,
      arrearsJmbStatus === "strong" ? "Maintenance collection, sinking fund, or JMB culture is stated as healthy." : arrearsJmbStatus === "usable" ? "JMB or arrears signal is usable but needs monitoring." : "",
      arrearsJmbStatus === "unsafe" ? "High arrears, disputes, lawsuits, or self-interest in JMB can damage long-term value." : arrearsJmbStatus === "missing" ? "Arrears and JMB signal is not recorded." : "",
      "Check outstanding fees, sinking fund, AGM culture, disputes, lawsuits, and whether the management team improves the property or drains it."
    ),
    siteCheck(
      "Evidence notes",
      siteNotesStatus,
      siteNotesStatus === "strong" ? "Site or management notes are recorded." : "",
      siteNotesStatus === "missing" ? "Site and management observations are not written down." : "",
      "Write the lived-quality observation so Apex can challenge the decision later instead of relying on memory."
    )
  ];
  const siteManagementScore = clampScore(
    siteStatusScore[siteVisitProofStatus] * 0.16 +
    siteStatusScore[lobbyStatus] * 0.1 +
    siteStatusScore[liftCarparkStatus] * 0.12 +
    siteStatusScore[commonAreaStatus] * 0.12 +
    siteStatusScore[residentStatus] * 0.12 +
    siteStatusScore[managementResponseStatus] * 0.18 +
    siteStatusScore[defectStatus] * 0.1 +
    siteStatusScore[arrearsJmbStatus] * 0.07 +
    siteStatusScore[siteNotesStatus] * 0.03
  );
  const siteManagementUnsafe = [lobbyStatus, liftCarparkStatus, commonAreaStatus, residentStatus, managementResponseStatus, defectStatus, arrearsJmbStatus].includes("unsafe");
  const siteManagementKnown = Boolean(dealCard.siteVisit === "Completed" || siteVisitEvidence || lobbyGuardhouseSignal || liftCarparkCorridorSignal || commonAreaCondition || residentBehaviourSignal || managementResponseSignal || defectLeakageSignal || arrearsJmbSignal || siteManagementNotes || dealCard.siteVisitNotes);
  const siteManagementStatus = siteVisitProofStatus === "missing"
    ? "missing"
    : siteManagementUnsafe
      ? "unsafe"
      : siteManagementScore >= 85
      ? "strong"
      : siteManagementScore >= 65
        ? "usable"
        : siteManagementScore >= 40 || siteManagementKnown
          ? "thin"
          : "missing";
  const siteManagementEvidence = {
    status: siteManagementStatus,
    score: siteManagementScore,
    summary: siteManagementStatus === "strong"
      ? "Site and management evidence is strong: physical visit, arrival quality, operations, residents, management response, defects, and JMB signals support the project."
      : siteManagementStatus === "usable"
        ? "Site and management evidence is usable, but Apex still wants sharper proof before treating lived quality as fully defended."
        : siteManagementStatus === "thin"
          ? "Site and management evidence is thin. The property may look workable, but lived quality and management durability are not proven enough."
          : siteManagementStatus === "unsafe"
            ? "Site and management evidence is unsafe because project culture, defects, operations, management, arrears, or JMB reality can damage holding and exit."
            : "Site and management evidence is missing.",
    livedQualityPosition,
    checks: siteManagementChecks
  };
  if (["unsafe", "missing"].includes(siteManagementStatus)) {
    addBlocker("V4.5 site and management evidence is not reliable enough to validate lived quality.");
  } else if (siteManagementStatus === "thin") {
    addBlocker("V4.5 site and management evidence is still thin; clear physical visit, lobby, lift, common-area, resident, management, defect, arrears, and JMB gaps before shortlist.");
  }

  const legalStatusScore = { strong: 100, usable: 72, thin: 42, unsafe: 8, missing: 0 };
  const legalCheckStatus = dealCard.legalCheck === "Clear"
    ? "strong"
    : dealCard.legalCheck === "Pending"
      ? "usable"
      : dealCard.legalCheck === "Issue found"
        ? "unsafe"
        : "missing";
  const legalCheck = (label, status, proof, gap, action) => ({
    label,
    status,
    proof,
    gap,
    action
  });
  const titleTypeStatus = /residential|hda|strata|individual|freehold|leasehold/.test(legalTitleType)
    ? "strong"
    : /commercial.*residential|serviced.*hda|mixed.*hda/.test(legalTitleType)
      ? "usable"
      : /fully office|office commercial|pure commercial|not hda/.test(legalTitleType)
        ? "unsafe"
        : /unknown/.test(legalTitleType)
          ? "missing"
          : legalTitleType
            ? "thin"
            : "missing";
  const titleTransferPathStatus = /issued|transfer path clear|strata issued|individual title|mot clear|perfection clear|developer solvent/.test(titleTransferStatus)
    ? "strong"
    : /master title.*solvent|perfection pending|transfer pending|timeline known|developer consent/.test(titleTransferStatus)
      ? "usable"
      : /bankrupt|winding|transfer blocked|title problem|developer insolvent|unclear/.test(titleTransferStatus)
        ? "unsafe"
        : /unknown/.test(titleTransferStatus)
          ? "missing"
          : titleTransferStatus
            ? "thin"
            : "missing";
  const caveatRestrictionCheckStatus = /no caveat|no blocking|clear|clean|no restriction/.test(caveatRestrictionStatus)
    ? "strong"
    : /state consent|affordable.*understood|restriction understood|consent timeline known/.test(caveatRestrictionStatus)
      ? "usable"
      : /caveat|malay reserve|bumi|bumiputera|prohibitory|court order|blocking|dispute|encumbrance/.test(caveatRestrictionStatus)
        ? "unsafe"
        : /unknown/.test(caveatRestrictionStatus)
          ? "missing"
          : caveatRestrictionStatus
            ? "thin"
            : "missing";
  const sellerAuthorityCheckStatus = /verified|land search|documents verified|authority clear|seller clean|id checked/.test(sellerAuthorityStatus)
    ? "strong"
    : /partial|agent supplied|pending document|to confirm/.test(sellerAuthorityStatus)
      ? "usable"
      : /refuse|unclear|not owner|probate|bankrupt|bankruptcy|estate|divorce|litigation|company wound/.test(sellerAuthorityStatus)
        ? "unsafe"
        : /unknown/.test(sellerAuthorityStatus)
          ? "missing"
          : sellerAuthorityStatus
            ? "thin"
            : "missing";
  const arrearsUtilitiesCheckStatus = /clear|no arrears|paid up|utilities clear|quit rent clear|assessment clear/.test(arrearsUtilitiesStatus)
    ? "strong"
    : /outstanding.*known|settled on completion|apportion|retention/.test(arrearsUtilitiesStatus)
      ? "usable"
      : /disputed|unknown arrears|high arrears|unpaid|not disclosed/.test(arrearsUtilitiesStatus)
        ? "unsafe"
        : /unknown/.test(arrearsUtilitiesStatus)
          ? "missing"
          : arrearsUtilitiesStatus
            ? "thin"
            : "missing";
  const stakeholderFlowCheckStatus = /lawyer stakeholder|proper stakeholder|bank channel|spa stakeholder|all payments.*lawyer|loan redemption/.test(stakeholderFlowStatus)
    ? "strong"
    : /to be confirmed|pending lawyer|flow pending|confirm stakeholder/.test(stakeholderFlowStatus)
      ? "usable"
      : /direct payment|side agreement|side payment|pay seller|cash back|cashback|outside stakeholder|bypass/.test(stakeholderFlowStatus)
        ? "unsafe"
        : /unknown/.test(stakeholderFlowStatus)
          ? "missing"
          : stakeholderFlowStatus
            ? "thin"
            : "missing";
  const lawyerCoordinationCheckStatus = /reviewed|responsive|milestone|clear checklist|reports progress|fast reply/.test(lawyerCoordinationStatus)
    ? "strong"
    : /pending but responsive|not yet reviewed|to review|average/.test(lawyerCoordinationStatus)
      ? "usable"
      : /no lawyer|late|no update|no reply|unresponsive|cannot explain|overcharge|delay/.test(lawyerCoordinationStatus)
        ? "unsafe"
        : /unknown/.test(lawyerCoordinationStatus)
          ? "missing"
          : lawyerCoordinationStatus
            ? "thin"
            : "missing";
  const legalNotesStatus = legalTransactionNotes
    ? "strong"
    : "missing";
  const legalTransactionPosition = ["unsafe", "missing"].includes(caveatRestrictionCheckStatus) || ["unsafe", "missing"].includes(sellerAuthorityCheckStatus) || ["unsafe", "missing"].includes(stakeholderFlowCheckStatus)
    ? "The transaction path is not safe enough yet; title, seller authority, restriction, or fund-flow proof can still break completion."
    : legalCheckStatus === "strong" && titleTypeStatus === "strong" && titleTransferPathStatus === "strong" && lawyerCoordinationCheckStatus === "strong"
      ? "Legal and transaction evidence supports a clean commitment path, subject to final lawyer confirmation."
      : "Legal path is workable but still needs sharper lawyer-backed confirmation before commitment.";
  const legalTransactionChecks = [
    legalCheck(
      "Headline legal check",
      legalCheckStatus,
      legalCheckStatus === "strong" ? "Title and legal check is recorded as clear." : legalCheckStatus === "usable" ? "Legal check is pending but not yet an issue." : "",
      legalCheckStatus === "unsafe" ? "A legal issue has already been found." : legalCheckStatus === "missing" ? "Headline legal status is not recorded." : "",
      "Use the simple legal check only as a headline; still verify title, caveat, restrictions, seller authority, arrears, and fund flow."
    ),
    legalCheck(
      "Title type and use",
      titleTypeStatus,
      titleTypeStatus === "strong" ? "Title type is consistent with the residential mandate or bankable HDA-serviced residence path." : titleTypeStatus === "usable" ? "Commercial title may be workable because residential use or HDA protection is clarified." : "",
      titleTypeStatus === "unsafe" ? "Fully office-commercial or non-HDA commercial title can shrink financing and exit buyer pool." : titleTypeStatus === "missing" ? "Title type is not recorded." : "",
      "Confirm whether the title/use is residential, HDA serviced residence, fully commercial, strata, individual, freehold, leasehold, or master title."
    ),
    legalCheck(
      "Transfer path",
      titleTransferPathStatus,
      titleTransferPathStatus === "strong" ? "Transfer, title, MOT, perfection, or developer-solvency path is stated as clear." : titleTransferPathStatus === "usable" ? "Transfer path is possible but still needs timeline and cost monitoring." : "",
      titleTransferPathStatus === "unsafe" ? "Transfer, perfection, developer solvency, or title path may block completion or future exit." : titleTransferPathStatus === "missing" ? "Transfer path is not recorded." : "",
      "Ask the lawyer to confirm strata or individual title, master-title risk, MOT, perfection of transfer/charge, developer consent, and expected timeline."
    ),
    legalCheck(
      "Caveat and restrictions",
      caveatRestrictionCheckStatus,
      caveatRestrictionCheckStatus === "strong" ? "No caveat, blocking encumbrance, or unresolved restriction is stated." : caveatRestrictionCheckStatus === "usable" ? "Restriction or consent risk is known and bounded." : "",
      caveatRestrictionCheckStatus === "unsafe" ? "Caveat, reserve/restricted status, court order, dispute, or blocking encumbrance is a stop sign." : caveatRestrictionCheckStatus === "missing" ? "Caveat and restriction status is not recorded." : "",
      "Confirm current land search, caveat, encumbrance, Malay reserve, Bumiputera lot, state consent, affordable housing restriction, and whether the buyer can receive title."
    ),
    legalCheck(
      "Seller authority",
      sellerAuthorityCheckStatus,
      sellerAuthorityCheckStatus === "strong" ? "Seller authority and documents are verified." : sellerAuthorityCheckStatus === "usable" ? "Seller documents are partly supplied but still need lawyer confirmation." : "",
      sellerAuthorityCheckStatus === "unsafe" ? "Seller authority, ownership, bankruptcy, probate, company, litigation, or document refusal can stop the transaction." : sellerAuthorityCheckStatus === "missing" ? "Seller authority is not recorded." : "",
      "Verify seller identity, registered ownership, company authority, bankruptcy/winding-up risk, estate/probate issues, and authority to sign."
    ),
    legalCheck(
      "Arrears and utilities",
      arrearsUtilitiesCheckStatus,
      arrearsUtilitiesCheckStatus === "strong" ? "Maintenance, quit rent, assessment, or utilities are stated as clear." : arrearsUtilitiesCheckStatus === "usable" ? "Outstanding amounts are known and can be settled or retained at completion." : "",
      arrearsUtilitiesCheckStatus === "unsafe" ? "Unknown, disputed, or high arrears can create completion friction or post-purchase cost." : arrearsUtilitiesCheckStatus === "missing" ? "Arrears and utility status is not recorded." : "",
      "Ask management and lawyer for maintenance, sinking fund, quit rent, assessment, utilities, late interest, and completion settlement mechanics."
    ),
    legalCheck(
      "Stakeholder and fund flow",
      stakeholderFlowCheckStatus,
      stakeholderFlowCheckStatus === "strong" ? "Payment path uses lawyer stakeholder, SPA, bank, and redemption channels." : stakeholderFlowCheckStatus === "usable" ? "Fund flow is pending but should be confirmed by the lawyer before payment." : "",
      stakeholderFlowCheckStatus === "unsafe" ? "Direct payment, side agreement, cashback, or bypassing stakeholder channels is outside Apex boundaries." : stakeholderFlowCheckStatus === "missing" ? "Fund-flow path is not recorded." : "",
      "Do not pay outside proper lawyer stakeholder or bank-controlled channels. Clarify deposits, redemption sum, retention, and release conditions."
    ),
    legalCheck(
      "Lawyer coordination",
      lawyerCoordinationCheckStatus,
      lawyerCoordinationCheckStatus === "strong" ? "Lawyer has reviewed or is responsive with clear progress reporting." : lawyerCoordinationCheckStatus === "usable" ? "Lawyer review is pending but communication is still workable." : "",
      lawyerCoordinationCheckStatus === "unsafe" ? "No lawyer, late reply, no progress reporting, or poor explanation increases execution risk." : lawyerCoordinationCheckStatus === "missing" ? "Lawyer coordination status is not recorded." : "",
      "Use a lawyer who reports milestones, explains risks, checks documents early, and controls completion funds properly."
    ),
    legalCheck(
      "Legal transaction notes",
      legalNotesStatus,
      legalNotesStatus === "strong" ? "Legal transaction notes are recorded." : "",
      legalNotesStatus === "missing" ? "No legal transaction notes are written down." : "",
      "Record what the lawyer, agent, land search, management office, and seller documents actually prove."
    )
  ];
  const legalTransactionScore = clampScore(
    legalStatusScore[legalCheckStatus] * 0.16 +
    legalStatusScore[titleTypeStatus] * 0.12 +
    legalStatusScore[titleTransferPathStatus] * 0.14 +
    legalStatusScore[caveatRestrictionCheckStatus] * 0.18 +
    legalStatusScore[sellerAuthorityCheckStatus] * 0.15 +
    legalStatusScore[arrearsUtilitiesCheckStatus] * 0.1 +
    legalStatusScore[stakeholderFlowCheckStatus] * 0.12 +
    legalStatusScore[lawyerCoordinationCheckStatus] * 0.1 +
    legalStatusScore[legalNotesStatus] * 0.03
  );
  const legalHardUnsafe = [legalCheckStatus, titleTypeStatus, titleTransferPathStatus, caveatRestrictionCheckStatus, sellerAuthorityCheckStatus, stakeholderFlowCheckStatus].includes("unsafe");
  const legalAnyUnsafe = legalHardUnsafe || [arrearsUtilitiesCheckStatus, lawyerCoordinationCheckStatus].includes("unsafe");
  const legalKnown = Boolean(dealCard.legalCheck || legalTitleType || titleTransferStatus || caveatRestrictionStatus || sellerAuthorityStatus || arrearsUtilitiesStatus || stakeholderFlowStatus || lawyerCoordinationStatus || legalTransactionNotes);
  const legalTransactionStatus = legalHardUnsafe
    ? "unsafe"
    : legalCheckStatus === "missing"
      ? "missing"
      : legalAnyUnsafe
        ? "unsafe"
        : legalTransactionScore >= 85
          ? "strong"
          : legalTransactionScore >= 65
            ? "usable"
            : legalTransactionScore >= 40 || legalKnown
              ? "thin"
              : "missing";
  const legalTransactionEvidence = {
    status: legalTransactionStatus,
    score: legalTransactionScore,
    summary: legalTransactionStatus === "strong"
      ? "Legal and transaction evidence is strong: title, transfer path, caveat/restriction, seller authority, arrears, fund flow, and lawyer coordination are controlled."
      : legalTransactionStatus === "usable"
        ? "Legal and transaction path looks workable, but one or more proof points still needs lawyer confirmation."
        : legalTransactionStatus === "thin"
          ? "Legal evidence is thin. Apex cannot rely on a clean transaction path without sharper title, seller, restriction, arrears, and fund-flow proof."
          : legalTransactionStatus === "unsafe"
            ? "Legal or transaction evidence contains an unsafe stop sign that can break completion, financing, or future exit."
            : "Legal and transaction evidence is missing.",
    transactionPosition: legalTransactionPosition,
    checks: legalTransactionChecks
  };
  if (legalHardUnsafe) {
    addHardStop(1, "V4.6 legal, title, seller-authority, restriction, or fund-flow evidence contains an unresolved stop sign.");
  }
  if (["unsafe", "missing"].includes(legalTransactionStatus)) {
    addBlocker("V4.6 legal and transaction evidence is not reliable enough to validate commitment safety.");
  } else if (legalTransactionStatus === "thin") {
    addBlocker("V4.6 legal and transaction evidence is still thin; clear title type, transfer path, caveat/restriction, seller authority, arrears, stakeholder flow, and lawyer coordination.");
  }

  let holdingScore = 50;
  if (holdingCashFlow !== null) {
    if (holdingCashFlow >= 0) holdingScore += 30;
    else if (isLanded && isAppreciationGoal && Math.abs(holdingCashFlow) <= 450) {
      holdingScore += 5;
      addWatchout("The landed appreciation case has tolerable negative carry only if the user can hold it safely.");
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
    addWatchout("More than five existing properties requires a concentration and correlated-risk review.");
  } else if (financialProfile.existingProperties) {
    portfolioScore += 5;
  }
  if (reserveMonths >= 6) portfolioScore += 15;
  if (hasStatedRisk(financialProfile.nearTermCommitment)) portfolioScore -= 20;
  if (holdingCashFlow !== null && holdingCashFlow < 0) portfolioScore -= 15;
  portfolioScore = clampScore(portfolioScore);

  let marketScore = 45;
  if (supplyAbsorptionStatus === "strong") marketScore += 18;
  else if (supplyAbsorptionStatus === "usable") marketScore += 10;
  else if (supplyAbsorptionStatus === "thin") marketScore -= 6;
  if (supplyRisk) {
    marketScore -= 15;
    addWatchout("Nearby supply may compete for the same tenant and future buyer pool.");
    if (hasSignal(dealNarrative, [/new launch/, /newer/, /similar layout/, /same layout/, /same price/, /within 2\.?5/])) {
      addBlocker("Nearby similar new supply needs absorption proof before shortlist.");
    }
  }
  if (transactionComparableStatus === "strong") marketScore += 10;
  else if (transactionComparableStatus === "usable") marketScore += 5;
  if (achievedRentalStatus === "strong") marketScore += 10;
  else if (achievedRentalStatus === "usable") marketScore += 5;
  marketScore = clampScore(marketScore);

  let evidenceScore = 10;
  if (transactionComparableStatus === "strong") evidenceScore += 25;
  else if (transactionComparableStatus === "usable") evidenceScore += 19;
  else if (transactionComparableStatus === "thin") evidenceScore += 9;
  else if (transactionComparableStatus === "unsafe") evidenceScore -= 5;
  if (achievedRentalStatus === "strong") evidenceScore += 25;
  else if (achievedRentalStatus === "usable") evidenceScore += 19;
  else if (achievedRentalStatus === "thin") evidenceScore += 9;
  else if (achievedRentalStatus === "unsafe") evidenceScore -= 5;
  if (financingValuationStatus === "strong") evidenceScore += 10;
  else if (financingValuationStatus === "usable") evidenceScore += 7;
  else if (financingValuationStatus === "thin") evidenceScore += 2;
  else if (financingValuationStatus === "unsafe") evidenceScore -= 5;
  if (supplyAbsorptionStatus === "strong") evidenceScore += 10;
  else if (supplyAbsorptionStatus === "usable") evidenceScore += 7;
  else if (supplyAbsorptionStatus === "thin") evidenceScore += 2;
  else if (supplyAbsorptionStatus === "unsafe") evidenceScore -= 5;
  if (siteManagementStatus === "strong") evidenceScore += 20;
  else if (siteManagementStatus === "usable") evidenceScore += 14;
  else if (siteManagementStatus === "thin") evidenceScore += 6;
  else if (siteManagementStatus === "unsafe") evidenceScore -= 10;
  if (legalTransactionStatus === "strong") evidenceScore += 15;
  else if (legalTransactionStatus === "usable") evidenceScore += 10;
  else if (legalTransactionStatus === "thin") evidenceScore += 4;
  else if (legalTransactionStatus === "unsafe") evidenceScore -= 15;
  evidenceScore = clampScore(evidenceScore);

  const evidenceGate = (label, status, weight, score, proof, gap, action) => ({
    label,
    status,
    weight,
    score: clampScore(score),
    proof,
    gap,
    action
  });
  const valueGateStatus = transactionComparableStatus === "strong"
    ? "proven"
    : transactionComparableStatus === "usable" || transactionComparableStatus === "thin"
      ? "partial"
      : transactionComparableStatus === "unsafe"
        ? "blocked"
        : "missing";
  const rentGateStatus = achievedRentalStatus === "strong"
    ? "proven"
    : achievedRentalStatus === "usable" || achievedRentalStatus === "thin"
      ? "partial"
      : achievedRentalStatus === "unsafe"
        ? "blocked"
        : "missing";
  const financingGateStatus = financingValuationStatus === "strong"
    ? "proven"
    : financingValuationStatus === "usable" || financingValuationStatus === "thin"
      ? "partial"
      : financingValuationStatus === "unsafe"
        ? "blocked"
        : "missing";
  const supplyGateStatus = supplyAbsorptionStatus === "strong"
    ? "proven"
    : supplyAbsorptionStatus === "usable" || supplyAbsorptionStatus === "thin"
      ? "partial"
      : supplyAbsorptionStatus === "unsafe"
        ? "blocked"
        : "missing";
  const siteManagementGateStatus = siteManagementStatus === "strong"
    ? "proven"
    : siteManagementStatus === "usable" || siteManagementStatus === "thin"
      ? "partial"
      : siteManagementStatus === "unsafe"
        ? "blocked"
        : "missing";
  const legalGateStatus = legalTransactionStatus === "strong"
    ? "proven"
    : legalTransactionStatus === "usable" || legalTransactionStatus === "thin"
      ? "partial"
      : legalTransactionStatus === "unsafe"
        ? "blocked"
        : "missing";
  const thesisGateStatus = dealCard.investmentThesis && dealCard.killCriterion
    ? "proven"
    : dealCard.investmentThesis || dealCard.killCriterion
      ? "partial"
      : "missing";
  const gateScore = (status, partialScore = 55) => status === "proven" ? 100 : status === "partial" ? partialScore : 0;
  const evidenceGates = [
    evidenceGate(
      "Completed value proof",
      valueGateStatus,
      20,
      transactionComparableScore,
      valueGateStatus === "proven" ? transactionComparableEvidence.summary : valueGateStatus === "partial" ? transactionComparableEvidence.summary : "",
      valueGateStatus === "blocked" || valueGateStatus === "missing" ? transactionComparableEvidence.summary : valueGateStatus === "partial" ? "Comparable source, recency, match, range, or adjustment detail is not yet strong enough." : "",
      "Use V4.1 comparable detail: source, recency, match quality, completed price range, and adjustment logic."
    ),
    evidenceGate(
      "Achieved rent proof",
      rentGateStatus,
      20,
      achievedRentalScore,
      rentGateStatus === "proven" ? achievedRentalEvidence.summary : rentGateStatus === "partial" ? achievedRentalEvidence.summary : "",
      rentGateStatus === "blocked" || rentGateStatus === "missing" ? achievedRentalEvidence.summary : rentGateStatus === "partial" ? "Rental source, recency, urgency, vacancy, sustainability, or coverage is not yet strong enough." : "",
      "Use V4.2 rental detail: achieved source, recency, tenant urgency, vacancy signal, sustainability, and coverage fit."
    ),
    evidenceGate(
      "Financing and valuation fit",
      financingGateStatus,
      15,
      financingValuationScore,
      financingGateStatus === "proven" ? financingValuationEvidence.summary : financingGateStatus === "partial" ? financingValuationEvidence.summary : "",
      financingGateStatus === "blocked" || financingGateStatus === "missing" ? financingValuationEvidence.summary : financingGateStatus === "partial" ? "Valuation support, approval path, DSR, margin, stress, cash buffer, or documents are not yet strong enough." : "",
      "Use V4.3 financing detail: bank valuation support, loan precheck, margin plan, DSR, instalment stress, cash buffer, and document readiness."
    ),
    evidenceGate(
      "Supply absorption proof",
      supplyGateStatus,
      15,
      supplyAbsorptionScore,
      supplyGateStatus === "proven" ? supplyAbsorptionEvidence.summary : supplyGateStatus === "partial" ? supplyAbsorptionEvidence.summary : "",
      supplyGateStatus === "blocked" || supplyGateStatus === "missing" ? supplyAbsorptionEvidence.summary : supplyGateStatus === "partial" ? "Substitute count, threat, timing, absorption, unsold stock, density, or lift stress is not yet strong enough." : "",
      "Use V4.4 supply detail: 2.5km radius, substitute count, direct threat, VP timing, absorption, unsold stock, density, and lift stress."
    ),
    evidenceGate(
      "Site and management reality",
      siteManagementGateStatus,
      15,
      siteManagementScore,
      siteManagementGateStatus === "proven" ? siteManagementEvidence.summary : siteManagementGateStatus === "partial" ? siteManagementEvidence.summary : "",
      siteManagementGateStatus === "blocked" || siteManagementGateStatus === "missing" ? siteManagementEvidence.summary : siteManagementGateStatus === "partial" ? "Physical visit, arrival quality, operations, resident behaviour, defects, management response, arrears, or JMB evidence is not yet strong enough." : "",
      "Use V4.5 site detail: physical visit proof, lobby, guardhouse, lift, car park, corridor, facilities, residents, management response, defects, arrears, and JMB culture."
    ),
    evidenceGate(
      "Legal and title safety",
      legalGateStatus,
      10,
      legalTransactionScore,
      legalGateStatus === "proven" ? legalTransactionEvidence.summary : legalGateStatus === "partial" ? legalTransactionEvidence.summary : "",
      legalGateStatus === "blocked" || legalGateStatus === "missing" ? legalTransactionEvidence.summary : legalGateStatus === "partial" ? "Title type, transfer path, caveat/restriction, seller authority, arrears, fund flow, or lawyer coordination is not yet strong enough." : "",
      "Use V4.6 legal detail: title type, transfer path, caveat/restriction, seller authority, arrears/utilities, stakeholder fund flow, and lawyer coordination."
    ),
    evidenceGate(
      "Decision thesis and kill rule",
      thesisGateStatus,
      5,
      gateScore(thesisGateStatus, 50),
      thesisGateStatus === "proven" ? "Investment thesis and walk-away criterion are recorded." : thesisGateStatus === "partial" ? "Only one of thesis or kill criterion is recorded." : "",
      thesisGateStatus === "missing" ? "The user has not recorded why this should work and what discovery means walk away." : "",
      "Write the causal thesis, counter-thesis, target hold, exit buyer, and exact kill criterion before booking."
    )
  ];
  const evidenceEngineScore = clampScore(evidenceGates.reduce((total, gate) => total + (gate.score * gate.weight / 100), 0));
  const evidenceCriticalGaps = evidenceGates
    .filter((gate) => gate.status === "blocked" || (gate.status === "missing" && gate.weight >= 10))
    .map((gate) => `${gate.label}: ${gate.gap || gate.action}`);
  const evidenceEngineStatus = evidenceGates.some((gate) => gate.status === "blocked") || hardStops.length
    ? "blocked"
    : evidenceCriticalGaps.length
      ? evidenceEngineScore >= 70 ? "conditional" : "weak"
    : evidenceEngineScore >= 85
      ? "proven"
      : evidenceEngineScore >= 70
        ? "conditional"
        : evidenceEngineScore >= 50
          ? "weak"
          : "blocked";
  const evidenceEngine = {
    status: evidenceEngineStatus,
    score: evidenceEngineScore,
    summary: evidenceEngineStatus === "proven"
      ? "Evidence is strong enough for shortlist-level confidence, while final professional verification is still required."
      : evidenceEngineStatus === "conditional"
        ? "Evidence is usable for investigation, but at least one important gate still needs stronger proof before shortlist confidence."
        : evidenceEngineStatus === "weak"
          ? "Evidence is too thin for a strong recommendation. Apex should keep the deal in investigation mode."
          : "Evidence blocks validation until the missing or unsafe proof is cleared.",
    recommendationGate: evidenceEngineScore >= 80 && evidenceEngineStatus !== "blocked" && !evidenceCriticalGaps.length
      ? "Shortlist-level confidence allowed if the rest of the framework also passes."
      : "Shortlist-level confidence blocked until V4 evidence strength reaches 80/100, no critical evidence gap remains, and no evidence gate is blocked.",
    criticalGaps: uniqueText(evidenceCriticalGaps, 8),
    gates: evidenceGates
  };
  if (evidenceEngineScore < 80 || evidenceEngineStatus === "blocked") {
    addBlocker(evidenceEngine.recommendationGate);
  }

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
  let confidence = Math.min(95, Math.round(evidenceScore * 0.82 + completeness * 0.13));
  if (recommendationBlockers.length) confidence = Math.min(confidence, 64);
  const rejectStops = hardStops.filter((item) => item.action === "reject");
  const pauseStops = hardStops.filter((item) => item.action === "pause");
  let verdict = "INVESTIGATE";
  if (rejectStops.length) verdict = "REJECT";
  else if (pauseStops.length) verdict = "PAUSE";
  else if (averageScore >= 74 && confidence >= 65 && !recommendationBlockers.length && !stages.some((item) => item.status === "risk")) verdict = "SHORTLIST";

  let counterThesis = "The property may look affordable or rentable but still fail to attract a broad future buyer pool in a stagnant resale market.";
  if (supplyRisk) counterThesis = "Newer substitute supply may reduce both achieved rent and future resale pricing before this thesis matures.";
  if (dealCard.managementQuality === "Weak") counterThesis = "Strong location and cheap entry may not overcome management deterioration, repair burden, and buyer resistance.";
  if (dealCard.unitPosition === "Unfavourable") counterThesis = "A permanent unit-position defect may make the cheaper entry difficult to recover at resale.";

  const hardStopText = hardStops.map((item) => `Stage ${item.stage}: ${item.message}`);
  const missing = uniqueText(missingEvidence, 7);
  const blockers = uniqueText(recommendationBlockers, 8);
  const actions = [];
  if (hardStops.length) actions.push("Resolve every hard stop before paying or committing further capital.");
  if (blockers.length) actions.push(`Clear decision blocker: ${blockers[0]}.`);
  actions.push(...missing.slice(0, 3).map((item) => `Obtain: ${item}.`));
  if (dealCard.unitPosition !== "Good" || !dealCard.managementQuality) actions.push("Complete a site visit focused on unit position, management, residents, noise, and common areas.");

  const verdictSummary = verdict === "REJECT"
    ? "The property has an unresolved structural or transaction-level problem."
    : verdict === "PAUSE"
      ? "The property may be workable, but the investor or holding structure is not ready."
      : verdict === "SHORTLIST"
        ? "The deal is strong enough for deeper verification, not automatic purchase."
        : blockers.length
          ? "The deal is not blocked forever, but missing proof could still change the verdict."
          : "There is not enough verified evidence for a confident decision yet.";
  const primaryRisk = hardStopText[0] || blockers[0] || watchouts[0] || missing[0] || counterThesis;
  let challengeMode = {
    level: "soft",
    label: "Mentor challenge",
    message: "Before this becomes a decision, prove why a future tenant or buyer would choose this property over the closest substitute."
  };
  if (rejectStops.length) {
    challengeMode = {
      level: "hard",
      label: "Refuse validation",
      message: "I cannot support this deal as structured. If you proceed, treat it as your own override and get independent legal or financing advice before paying, signing, or committing further."
    };
  } else if (pauseStops.length) {
    challengeMode = {
      level: "hard",
      label: "Profile or holding pause",
      message: "The property may still be interesting, but your financing, reserve, or holding power is not ready enough for Apex to support moving ahead."
    };
  } else if (blockers.length) {
    challengeMode = {
      level: "missing",
      label: "Evidence blocker",
      message: `I will not shortlist this yet. Clear this first: ${blockers[0]}`
    };
  } else if (holdingCashFlow !== null && holdingCashFlow < 0 && !isAppreciationGoal) {
    challengeMode = {
      level: "hard",
      label: "Emotional chase warning",
      message: "The return is not carrying the debt. If you still like it, separate your emotion from the investment case and show the missing upside evidence."
    };
  } else if (supplyRisk) {
    challengeMode = {
      level: "soft",
      label: "Can afford, but challenge supply",
      message: "You may be able to buy this, but nearby substitute supply can still make it a poor purchase. Prove why this unit defends rent and resale against newer options."
    };
  } else if (dealCard.siteVisit !== "Completed") {
    challengeMode = {
      level: "missing",
      label: "Quality not verified",
      message: "The numbers may look fine, but property quality is still only assumed until site visit or post-VP evidence proves the lived experience."
    };
  }
  const readinessFlags = [];
  if (!income) readinessFlags.push("Monthly income is missing.");
  if (!reserveProvided) readinessFlags.push("Cash reserve is missing.");
  else if (reserveMonths < 6) readinessFlags.push("Cash reserve is below the six-month baseline.");
  if (postDealDsr !== null && postDealDsr >= 80) readinessFlags.push("Estimated post-deal DSR is in the danger zone.");
  else if (postDealDsr !== null && postDealDsr >= 50) readinessFlags.push("Post-deal DSR is elevated.");
  if (cashAfterPurchase !== null && cashAfterPurchase < 0) readinessFlags.push("Declared cash available does not cover the stated outlay.");
  if (holdingCashFlow !== null && holdingCashFlow < 0) readinessFlags.push("Rental does not fully cover instalment and maintenance.");
  if (hasStatedRisk(financialProfile.nearTermCommitment)) readinessFlags.push("Near-term life commitment may compete with capital.");
  if (existingProperties > 5) readinessFlags.push("Portfolio concentration needs review before scaling further.");

  const readinessLabel = pauseStops.length || (reserveProvided && reserveMonths < 6) || (postDealDsr !== null && postDealDsr >= 80) || (cashAfterPurchase !== null && cashAfterPurchase < 0)
    ? "Not ready"
    : postDealDsr !== null && postDealDsr >= 70
      ? "Overextended"
      : investorSuitabilityScore >= 78 && reserveMonths >= 6 && (!holdingCashFlow || holdingCashFlow >= 0)
        ? "Ready"
        : investorSuitabilityScore >= 62 && reserveMonths >= 6
          ? "Balanced"
          : "Cautious";
  const investorReadiness = {
    label: readinessLabel,
    score: investorSuitabilityScore,
    summary: readinessLabel === "Ready"
      ? "The declared profile can support deeper verification if the deal evidence holds."
      : readinessLabel === "Balanced"
        ? "The profile is usable, but Apex should still protect cash reserve and downside holding power."
        : readinessLabel === "Overextended"
          ? "The profile may qualify for financing but leaves too little room for stress."
          : readinessLabel === "Not ready"
            ? "Apex should pause until affordability, reserve, or holding pressure improves."
            : "The profile needs more proof before Apex can judge readiness confidently.",
    flags: uniqueText(readinessFlags, 6)
  };

  const evidenceChecklist = [
    {
      label: "Completed value evidence",
      status: transactionComparableStatus === "strong" ? "done" : transactionComparableStatus === "unsafe" ? "danger" : transactionComparableStatus === "missing" ? "missing" : "warning",
      action: transactionComparableStatus === "strong"
        ? "Conservative value is supported by V4.1 comparable source, recency, match, range, and adjustment detail."
        : "Verify conservative value with V4.1 comparable detail: source, recency, match quality, completed price range, and adjustment notes."
    },
    {
      label: "Rental demand proof",
      status: achievedRentalStatus === "strong" ? "done" : achievedRentalStatus === "unsafe" ? "danger" : achievedRentalStatus === "missing" ? "missing" : "warning",
      action: achievedRentalStatus === "strong"
        ? "Rental demand is supported by V4.2 source, recency, urgency, vacancy, sustainability, and coverage detail."
        : "Ask active rental agents for achieved rent, source quality, recency, tenant urgency, vacancy signal, and sustainability."
    },
    {
      label: "Loan and holding test",
      status: financingValuationStatus === "strong" ? "done" : financingValuationStatus === "unsafe" ? "danger" : financingValuationStatus === "missing" ? "missing" : "warning",
      action: financingValuationStatus === "strong"
        ? "Financing is supported by V4.3 valuation, precheck, margin, DSR, stress, cash buffer, and document evidence."
        : "Verify bank valuation support, loan precheck, margin plan, post-deal DSR, instalment stress, cash buffer, and document readiness."
    },
    {
      label: "Site visit and project feel",
      status: siteManagementStatus === "strong" ? "done" : siteManagementStatus === "unsafe" ? "danger" : siteManagementStatus === "missing" ? "missing" : "warning",
      action: siteManagementStatus === "strong"
        ? "Lived quality is supported by V4.5 physical visit, operations, resident, management, defect, arrears, and JMB evidence."
        : "Verify V4.5 site detail: physical visit proof, lobby, guardhouse, lift, car park, corridor, facilities, residents, management response, defects, arrears, and JMB culture."
    },
    {
      label: "Legal and title check",
      status: legalTransactionStatus === "strong" ? "done" : legalTransactionStatus === "unsafe" ? "danger" : legalTransactionStatus === "missing" ? "missing" : "warning",
      action: legalTransactionStatus === "strong"
        ? "Legal safety is supported by V4.6 title, transfer, caveat/restriction, seller-authority, arrears, stakeholder-flow, and lawyer-coordination evidence."
        : "Verify V4.6 legal detail: title type, transfer path, caveat/restriction, seller authority, arrears/utilities, stakeholder flow, and lawyer coordination."
    },
    {
      label: "Substitute supply",
      status: supplyAbsorptionStatus === "strong" ? "done" : supplyAbsorptionStatus === "unsafe" ? "danger" : supplyAbsorptionStatus === "missing" ? "missing" : "warning",
      action: supplyAbsorptionStatus === "strong"
        ? "Supply is supported by V4.4 substitute, timing, absorption, unsold stock, and density evidence."
        : "Verify V4.4 supply detail: 2.5km substitutes, VP timing, occupancy, rent pressure, unsold stock, and lift-density stress."
    },
    {
      label: "Exit buyer pool",
      status: dealCard.exitBuyerPool === "Own-stay and investor" ? "done" : dealCard.exitBuyerPool && dealCard.exitBuyerPool !== "Unclear" ? "warning" : "missing",
      action: "Confirm the unit appeals beyond one buyer segment, especially own-stay buyers and investor buyers."
    },
    {
      label: "Decision thesis and kill rule",
      status: dealCard.investmentThesis && dealCard.killCriterion ? "done" : "missing",
      action: "Write the thesis and the exact walk-away discovery before committing."
    }
  ];

  const decisionFocus = rejectStops.length
    ? { label: "Do not validate", tone: "danger", body: hardStopText[0] || "A hard rejection rule has been triggered." }
    : pauseStops.length
      ? { label: "Pause first", tone: "danger", body: hardStopText[0] || "The investor profile or holding structure is not ready." }
      : blockers.length
        ? { label: "Clear before shortlist", tone: "warning", body: blockers[0] }
        : verdict === "SHORTLIST"
          ? { label: "Shortlist, not buy yet", tone: "ready", body: "The deal is strong enough for deeper verification, but final commitment still needs live evidence and professional checks." }
          : { label: "Investigate further", tone: "neutral", body: watchouts[0] || missing[0] || counterThesis };
  const taskStatus = (condition) => condition ? "done" : "required";
  const taskPriority = (status, risk = false) => status === "done" ? "low" : risk ? "high" : "medium";
  const task = (owner, label, status, action, risk = false) => ({
    owner,
    label,
    status,
    priority: taskPriority(status, risk),
    action
  });
  const dueDiligenceTasks = [
    task(
      "Agent",
      "Completed value proof",
      taskStatus(transactionComparableStatus === "strong"),
      "Send recent completed subsale or successful auction evidence, with source, recency, match quality, completed price range, and adjustment notes.",
      transactionComparableStatus === "unsafe" || transactionComparableStatus === "missing" || transactionComparableStatus === "thin"
    ),
    task(
      "Rental Agent",
      "Achieved rent and tenant urgency",
      taskStatus(achievedRentalStatus === "strong"),
      "Confirm achieved rent, source, recency, enquiry urgency, vacancy period, tenant profile, and whether rent is seasonal, incentive-supported, or pressured by new supply.",
      achievedRentalStatus === "unsafe" || achievedRentalStatus === "missing" || achievedRentalStatus === "thin"
    ),
    task(
      "Banker",
      "Loan instalment and stress test",
      taskStatus(financingValuationStatus === "strong"),
      "Provide bank-supported valuation, estimated instalment, margin, DSR after purchase, approval path, document readiness, and stress case if instalment rises by 10%.",
      financingValuationStatus === "unsafe" || financingValuationStatus === "missing" || financingValuationStatus === "thin"
    ),
    task(
      "Lawyer",
      "Title, caveat, consent, seller authority",
      taskStatus(legalTransactionStatus === "strong"),
      "Check V4.6 legal safety: title type, transfer path, caveat/restriction, seller authority, arrears/utilities, stakeholder fund flow, and lawyer milestone reporting.",
      legalTransactionStatus === "unsafe" || legalTransactionStatus === "missing" || legalTransactionStatus === "thin" || documentRisk
    ),
    task(
      "Management Office",
      "Management quality and arrears",
      taskStatus(siteManagementStatus === "strong"),
      "Ask for outstanding maintenance/arrears status, sinking fund health, response time, unresolved defects, lift issues, security, resident complaints, AGM/JMB culture, and management-office attitude.",
      siteManagementStatus === "unsafe" || siteManagementStatus === "missing" || siteManagementStatus === "thin"
    ),
    task(
      "Site Visit",
      "Own-stay vibe and unit defects",
      taskStatus(siteManagementStatus === "strong"),
      "Inspect lobby, guardhouse, lift speed, corridor, refuse room, car park, facilities, noise, view, water leakage, ventilation, resident behaviour, unit placement, and evidence notes.",
      siteManagementStatus === "unsafe" || siteManagementStatus === "missing" || siteManagementStatus === "thin"
    ),
    task(
      "Market Check",
      "Future supply and substitute threat",
      taskStatus(supplyAbsorptionStatus === "strong"),
      "List nearby newer similar projects within 2.5km; compare layout, pricing, VP timing, occupancy, absorption, unsold stock, density, lift stress, and rent pressure.",
      supplyAbsorptionStatus === "unsafe" || supplyAbsorptionStatus === "missing" || supplyAbsorptionStatus === "thin"
    ),
    task(
      "Buyer Pool",
      "Exit buyer proof",
      taskStatus(dealCard.exitBuyerPool === "Own-stay and investor"),
      "Identify why own-stay buyers and investor buyers would both consider this unit, and what objection could force a discount later.",
      !dealCard.exitBuyerPool || dealCard.exitBuyerPool === "Unclear" || dealCard.exitBuyerPool === "Investor mainly"
    ),
    task(
      "Investor",
      "Personal holding readiness",
      taskStatus(investorReadiness.label === "Ready" || investorReadiness.label === "Balanced"),
      "Confirm six-month cash reserve remains after outlay, no major near-term commitment is ignored, and vacancy/repair costs can be carried.",
      investorReadiness.label === "Not ready" || investorReadiness.label === "Overextended"
    ),
    task(
      "Investor",
      "Thesis and walk-away rule",
      taskStatus(dealCard.investmentThesis && dealCard.killCriterion),
      "Write the purchase thesis, strongest counter-thesis, planned holding period, exit route, and exact discovery that means walk away.",
      !dealCard.investmentThesis || !dealCard.killCriterion
    )
  ];
  const requiredTasks = dueDiligenceTasks.filter((item) => item.status !== "done");
  const dueDiligencePlan = {
    summary: requiredTasks.length
      ? `${requiredTasks.length} due-diligence tasks must be cleared before this moves beyond ${verdict.toLowerCase()}.`
      : "Core due-diligence tasks are marked done; preserve evidence before committing.",
    tasks: dueDiligenceTasks
  };
  const breakEvenOffer = price && installment && rent && rent > maintenance
    ? ((rent - maintenance) / installment) * price
    : 0;
  const offerCandidates = [
    price,
    fairValue,
    !isAppreciationGoal ? breakEvenOffer : 0
  ].filter((value) => Number.isFinite(value) && value > 0);
  const offerEvidenceReady = Boolean(fairValue && (isAppreciationGoal || breakEvenOffer));
  const maximumOfferAmount = offerEvidenceReady && offerCandidates.length ? Math.min(...offerCandidates) : 0;
  const openingAnchorAmount = fairValue
    ? Math.min(price || fairValue, fairValue * 0.8)
    : price
      ? price * 0.9
      : 0;
  const publicDealSignal = hasSignal(dealNarrative, [/heavily advertised/, /advertis(ed|ement)/, /property portal/, /social media/, /fake listing/]);
  const agentPressureSignal = hasSignal(dealNarrative, [/hard sell/, /keep follow/, /keeps follow/, /desperate/, /push(ing)? inventory/, /urgent booking/]);
  const motivatedSellerSignal = hasSignal(dealNarrative, [/motivated seller/, /urgent sale/, /need cash/, /cash urgent/, /debt/, /family issue/, /open to negotiation/]);
  const demandProofStrong = transactionComparableStatus === "strong" && ["strong", "usable"].includes(achievedRentalStatus);
  const executionStatus = (stop, caution, clear) => stop ? "stop" : caution ? "caution" : clear ? "clear" : "verify";
  const executionAction = (lane, label, status, action) => ({ lane, label, status, action });
  const offerPosture = rejectStops.length
    ? "No offer"
    : pauseStops.length
      ? "Pause before offer"
      : blockers.length
        ? "Verify before offer"
        : verdict === "SHORTLIST"
          ? "Controlled negotiation"
          : "Evidence-first negotiation";
  const offerBasis = [
    fairValue ? `Conservative value supplied: ${formatRinggit(fairValue)}.` : "Conservative value proof is missing.",
    breakEvenOffer ? `Rent break-even ceiling from supplied instalment: ${formatRinggit(breakEvenOffer)}.` : "Rent-to-instalment ceiling cannot be calculated yet.",
    discountToFairValue !== null ? `Input discount to conservative value: ${money(discountToFairValue)}%.` : "",
    holdingCashFlow !== null ? `Current holding cash flow: ${formatRinggit(holdingCashFlow)} per month.` : ""
  ].filter(Boolean);
  const executionActions = [
    executionAction(
      "Sourcing",
      "Source credibility",
      executionStatus(false, publicDealSignal || agentPressureSignal || fakeListingSignal, demandProofStrong),
      publicDealSignal || agentPressureSignal || fakeListingSignal
        ? "Treat the source as weak until completed transactions, achieved rent, and direct project checks support the claim. A good public deal can exist, but advertisement pressure is not proof."
        : "Still verify whether the opportunity reached you through a credible source or only after better-connected buyers passed on it."
    ),
    executionAction(
      "Offer",
      "Offer discipline",
      executionStatus(rejectStops.length, pauseStops.length || blockers.length || !maximumOfferAmount, maximumOfferAmount && verdict === "SHORTLIST"),
      maximumOfferAmount
        ? `Use ${formatRinggit(openingAnchorAmount)} as a disciplined opening anchor and do not exceed ${formatRinggit(maximumOfferAmount)} unless new evidence changes value, rent, or holding safety.`
        : "Do not set a final offer until conservative value, achieved rent, and instalment are known."
    ),
    executionAction(
      "Negotiation",
      "Seller motivation",
      executionStatus(false, !motivatedSellerSignal && verdict !== "SHORTLIST", motivatedSellerSignal),
      motivatedSellerSignal
        ? "Seller motivation appears possible; negotiate firmly but do not let urgency replace legal, financing, and site evidence."
        : "Ask why the seller is selling, how flexible the price is, and whether they can complete cleanly before deciding how hard to negotiate."
    ),
    executionAction(
      "Agent",
      "Agent filter",
      executionStatus(false, agentPressureSignal, demandProofStrong),
      "Ask the agent questions beyond this listing: nearest substitutes, recent completed prices, rental urgency, owner profile, title path, and why this deal is not already taken."
    ),
    executionAction(
      "Banker",
      "Banker filter",
      executionStatus(postDealDsr !== null && postDealDsr >= 80, !installment || !postDealDsr, installment && postDealDsr !== null && postDealDsr < 80),
      "Require comparison across loan package, margin, lock-in, tenure, DSR impact, valuation basis, and approval route instead of focusing only on interest rate."
    ),
    executionAction(
      "Lawyer",
      "Lawyer filter",
      executionStatus(dealCard.legalCheck === "Issue found" || documentRisk, dealCard.legalCheck !== "Clear", dealCard.legalCheck === "Clear"),
      "Ask for expected milestones, title and consent risks, seller authority, arrears, stakeholder fund flow, document list, and update frequency before paying more."
    ),
    executionAction(
      "Site",
      "Physical inspection",
      executionStatus(false, dealCard.siteVisit !== "Completed", dealCard.siteVisit === "Completed"),
      "The site visit must test lobby feeling, guardhouse attitude, lift speed, car park brightness, corridor, refuse room, facilities, resident behaviour, unit placement, leakage, noise, and view."
    ),
    executionAction(
      "Management",
      "JMB and building reality",
      executionStatus(dealCard.managementQuality === "Weak", !dealCard.managementQuality || dealCard.managementQuality === "Mixed", dealCard.managementQuality === "Strong"),
      "Ask management about arrears, sinking fund health, complaints, unresolved defects, response speed, lift issues, and whether residents are improving or weakening the building culture."
    ),
    executionAction(
      "Renovation",
      "Budget discipline",
      executionStatus(false, !price, price && dealCard.ownStayAppeal === "Strong"),
      price
        ? `Keep investment renovation disciplined around a ${formatRinggit(price * 0.05)} ceiling unless a specific tenant or buyer segment justifies more. Spend on durable fixtures before emotional furniture.`
        : "Set a renovation ceiling before viewing design ideas; do not let emotional furnishing consume the investment margin."
    ),
    executionAction(
      "Tenant",
      "Tenant screening",
      executionStatus(false, !rent, Boolean(rent)),
      "Before accepting a tenant, verify identity, work or study status, intended use, occupant count, affordability, references where possible, deposit structure, and any unusual request that feels fishy."
    ),
    executionAction(
      "Exit",
      "Resale preparation",
      executionStatus(false, dealCard.exitBuyerPool !== "Own-stay and investor", dealCard.exitBuyerPool === "Own-stay and investor"),
      "Define the intended exit buyer, expected selling condition, staging or renovation need, minimum acceptable price, likely buyer objection, and trigger for selling before purchase."
    )
  ];
  const stopExecution = executionActions.filter((item) => item.status === "stop").length;
  const cautionExecution = executionActions.filter((item) => item.status === "caution").length;
  const executionPlan = {
    summary: stopExecution
      ? "Execution should not move into offer mode while stop-level legal, financing, or deal-boundary risks remain."
      : cautionExecution
        ? `${cautionExecution} execution guardrail${cautionExecution === 1 ? "" : "s"} need proof before offer discipline is trusted.`
        : "Execution guardrails are clean enough for controlled negotiation, subject to live professional checks.",
    posture: offerPosture,
    openingAnchor: openingAnchorAmount ? formatRinggit(openingAnchorAmount) : "Need value proof",
    maximumOffer: maximumOfferAmount ? formatRinggit(maximumOfferAmount) : "Need value/rent proof",
    walkAway: rejectStops.length
      ? "Walk away unless the deal is restructured into a clean, legally supportable transaction."
      : maximumOfferAmount
        ? `Walk away if the seller requires more than ${formatRinggit(maximumOfferAmount)} or if legal, title, management, site-visit, rent, or financing proof weakens.`
        : "Walk away from pressure to book before value, rent, legal status, and financing are proven.",
    actions: executionActions,
    basis: uniqueText(offerBasis, 6)
  };
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
  const assessmentMonthly = annualAssessmentQuitRent ? annualAssessmentQuitRent / 12 : 0;
  const insuranceTaxMonthly = annualInsuranceTax ? annualInsuranceTax / 12 : 0;
  const defaultRepairReserve = rent ? Math.max(150, rent * 0.05) : 150;
  const monthlyRepairReserve = monthlyRepairReserveInput || defaultRepairReserve;
  const vacancyStressMonths = vacancyStressMonthsInput || 2;
  const trueMonthlyCost = installment + maintenance + assessmentMonthly + insuranceTaxMonthly + monthlyRepairReserve;
  const baseTrueHolding = rent ? rent - trueMonthlyCost : null;
  const stressedTrueHolding = rent && installment
    ? (((rent * 0.9) * Math.max(0, 12 - vacancyStressMonths)) - ((installment * 1.1) * 12) - ((maintenance + assessmentMonthly + insuranceTaxMonthly + monthlyRepairReserve) * 12)) / 12
    : null;
  const cashAfterStressReserves = cashAfterPurchase === null ? null : cashAfterPurchase - furnishingBudget;
  const reserveSurvivalMonths = cashAfterStressReserves !== null && stressedTrueHolding !== null && stressedTrueHolding < 0
    ? Math.max(0, Math.floor(cashAfterStressReserves / Math.abs(stressedTrueHolding)))
    : stressedTrueHolding !== null && stressedTrueHolding >= 0
      ? null
      : null;
  const stressStatusLabel = stressedTrueHolding === null
    ? "unknown"
    : stressedTrueHolding >= 0
      ? "resilient"
      : reserveSurvivalMonths !== null && reserveSurvivalMonths < 6
        ? "fragile"
        : stressedTrueHolding >= -500 || (reserveSurvivalMonths !== null && reserveSurvivalMonths >= 12)
          ? "pressure"
          : "fragile";
  const stressEnvelope = {
    summary: stressedTrueHolding === null
      ? "Stress envelope needs rent and instalment before Apex can judge true holding survival."
      : stressStatusLabel === "resilient"
        ? "The deal still holds above breakeven under rent, vacancy, operating-cost, and instalment stress."
        : stressStatusLabel === "pressure"
          ? "The deal survives only with manageable monthly pressure; keep reserve intact and verify all recurring costs."
          : "The stressed case can drain cash reserve too quickly; do not treat base-case rent coverage as enough.",
    status: stressStatusLabel,
    baseTrueHolding: baseTrueHolding === null ? "Need rent proof" : formatRinggit(baseTrueHolding),
    stressedTrueHolding: stressedTrueHolding === null ? "Need rent and instalment" : formatRinggit(stressedTrueHolding),
    cashAfterStressReserves: cashAfterStressReserves === null ? "Need cash and outlay" : formatRinggit(cashAfterStressReserves),
    reserveSurvivalMonths,
    assumptions: [
      {
        label: "Assessment and quit rent",
        value: formatRinggit(assessmentMonthly),
        source: annualAssessmentQuitRent ? "provided" : "default"
      },
      {
        label: "Insurance and tax",
        value: formatRinggit(insuranceTaxMonthly),
        source: annualInsuranceTax ? "provided" : "default"
      },
      {
        label: "Repair reserve",
        value: `${formatRinggit(monthlyRepairReserve)}/mo`,
        source: monthlyRepairReserveInput ? "provided" : "default"
      },
      {
        label: "Furnishing and renovation reserve",
        value: furnishingBudget ? formatRinggit(furnishingBudget) : "Not provided",
        source: furnishingBudget ? "provided" : "default"
      },
      {
        label: "Vacancy stress",
        value: `${money(vacancyStressMonths)} month${vacancyStressMonths === 1 ? "" : "s"}/year`,
        source: vacancyStressMonthsInput ? "provided" : "default"
      },
      {
        label: "Rent stress",
        value: "Rent -10%",
        source: "default"
      },
      {
        label: "Instalment stress",
        value: "Instalment +10%",
        source: "default"
      }
    ]
  };
  const hasExistingPropertiesInput = financialProfile.existingProperties !== undefined && financialProfile.existingProperties !== "";
  const portfolioCheck = (label, status, action) => ({ label, status, action });
  const fomoSignal = hasSignal(nextPurchaseReason, [/fomo/, /afraid.*miss/, /everyone.*buy/, /hot deal/, /agent.*push/, /limited time/, /rush/, /quick profit/]);
  const portfolioChecks = [
    portfolioCheck(
      "Existing portfolio proof",
      !hasExistingPropertiesInput
        ? "caution"
        : existingProperties === 0 || existingPortfolioHealth.includes("no existing") || existingPortfolioHealth.includes("stable")
          ? "clear"
          : existingPortfolioHealth.includes("weak") || existingPortfolioHealth.includes("vacancy")
            ? "block"
            : "caution",
      existingProperties === 0 || existingPortfolioHealth.includes("no existing")
        ? "Treat this as the first investment asset; the next purchase should wait until this property has operating proof."
        : existingPortfolioHealth.includes("stable")
          ? "Existing property performance is stated as stable; verify achieved rent, vacancy, arrears, repairs, and renewal status before scaling."
          : "Do not add another property until current rent, vacancy, maintenance, repairs, and tenant quality are reviewed."
    ),
    portfolioCheck(
      "Post-purchase reserve",
      reserveProvided && reserveMonths >= 6 && (cashAfterStressReserves === null || cashAfterStressReserves >= 0)
        ? "clear"
        : reserveProvided && reserveMonths < 6 || cashAfterStressReserves !== null && cashAfterStressReserves < 0
          ? "block"
          : "caution",
      "Keep at least six months of reserve after purchase, furnishing, repair allowance, and stress reserves. Loan approval is not portfolio readiness."
    ),
    portfolioCheck(
      "Combined stress survival",
      stressEnvelope.status === "fragile"
        ? "block"
        : stressEnvelope.status === "pressure" || stressEnvelope.status === "unknown"
          ? "caution"
          : "clear",
      "The portfolio should survive lower rent, vacancy, repair cost, and instalment stress without forced refinancing or sale."
    ),
    portfolioCheck(
      "Concentration",
      existingProperties > 5 && !concentrationRiskInput.includes("low")
        ? "block"
        : concentrationRiskInput.includes("same") || concentrationRiskInput.includes("unclear") || (!concentrationRiskInput && existingProperties > 0)
          ? "caution"
          : "clear",
      "Check whether this property relies on the same area, tenant pool, supply cycle, price segment, project quality, or refinancing window as existing holdings."
    ),
    portfolioCheck(
      "Portfolio role",
      portfolioRole ? "clear" : "caution",
      portfolioRole
        ? `This deal is positioned as ${financialProfile.portfolioRole}; make sure the rent, exit, and holding assumptions match that job.`
        : "Define the job of this property before purchase: cash-flow base, appreciation play, own stay, refinancing capital, or another explicit role."
    ),
    portfolioCheck(
      "Expansion discipline",
      fomoSignal || verdict === "REJECT" || verdict === "PAUSE"
        ? "block"
        : nextPurchaseReason || verdict === "SHORTLIST"
          ? "clear"
          : "caution",
      fomoSignal
        ? "Do not scale from fear of missing out. Compare substitutes and make the deal pass independently."
        : "Apex should support the next purchase only when the current deal passes independently and the reason to add it is written before emotion takes over."
    )
  ];
  const portfolioBlockCount = portfolioChecks.filter((item) => item.status === "block").length;
  const portfolioCautionCount = portfolioChecks.filter((item) => item.status === "caution").length;
  const portfolioGateStatus = portfolioBlockCount
    ? "block"
    : portfolioCautionCount || blockers.length || verdict !== "SHORTLIST"
      ? "review"
      : "allow";
  const portfolioGateScore = clampScore(100 - (portfolioBlockCount * 24) - (portfolioCautionCount * 9) - (verdict === "SHORTLIST" ? 0 : 8));
  const portfolioGate = {
    status: portfolioGateStatus,
    score: portfolioGateScore,
    summary: portfolioGateStatus === "allow"
      ? "The portfolio gate is clean enough to consider this deal as part of a controlled portfolio plan."
      : portfolioGateStatus === "review"
        ? "This deal may still fit, but portfolio proof is incomplete. Resolve the caution items before treating it as scalable."
        : "The portfolio gate blocks expansion. Fix existing portfolio, reserve, stress, concentration, or FOMO risk before adding this property.",
    nextPropertyRule: existingProperties === 0
      ? "After this first investment asset, do not proceed to the next property until rent, tenant quality, vacancy, repairs, and true holding cost are verified through at least one operating cycle."
      : "Before adding another property, existing assets must show stable operating evidence, reserve must remain intact, and the combined downside must not require forced refinancing or sale.",
    checks: portfolioChecks
  };
  const marketWeaknessSignal = hasSignal(dealNarrative, [
    /market downturn/,
    /weak sentiment/,
    /slow sales/,
    /low absorption/,
    /developer.*discount/,
    /clear inventory/,
    /auction/,
    /no enquiry/,
    /no inquiry/,
    /buyer.*slow/,
    /economic crisis/
  ]);
  const marketHypeSignal = hasSignal(dealNarrative, [
    /market hype/,
    /hype/,
    /sold out/,
    /crowded sales gallery/,
    /hot market/,
    /fomo/,
    /catalyst.*realized/,
    /booster.*realized/
  ]);
  const rentalDirectionRisk = hasSignal(dealNarrative, [/rent.*drop/, /rental.*drop/, /no tenant/, /vacancy/, /reduce rent/, /weak rent/]);
  const liquidityRisk = hasSignal(dealNarrative, [/hard to sell/, /weak resale/, /buyer.*unable/, /financing concern/, /low transaction/, /thin liquidity/])
    || dealCard.exitBuyerPool === "Investor mainly"
    || dealCard.exitBuyerPool === "Unclear";
  const auctionRisk = hasSignal(dealNarrative, [/many auction/, /auction case/, /auction volume/, /distress sale/, /pressure sell/]);
  const marketChecks = [
    {
      label: "Cycle position",
      status: marketHypeSignal && !discountToFairValue ? "risk" : marketWeaknessSignal || discountToFairValue >= 20 ? "clear" : "caution",
      action: marketHypeSignal
        ? "Do not pay today for a catalyst that the market has already priced in; require completed resale evidence, not crowd energy."
        : marketWeaknessSignal || discountToFairValue >= 20
          ? "Weak sentiment or discount may be useful only if property quality, rent, bankability, and holding power remain intact."
          : "Cycle signal is not strong enough; verify whether this is mature, early growth, saturation, or temporary weakness."
    },
    {
      label: "Rental direction",
      status: rentalDirectionRisk ? "risk" : rent && ["strong", "usable"].includes(achievedRentalStatus) ? "clear" : "caution",
      action: rentalDirectionRisk
        ? "Check whether weaker rent is temporary seasonality, pricing, furnishing, tenant segment mismatch, or structural oversupply."
        : "Keep rent evidence current with multiple agents, achieved rent, tenant urgency, and vacancy speed."
    },
    {
      label: "Buyer liquidity",
      status: liquidityRisk ? "risk" : dealCard.exitBuyerPool === "Own-stay and investor" ? "clear" : "caution",
      action: liquidityRisk
        ? "Estimate the liquidity discount needed to sell within the planned timeframe and whether normal buyers can finance the unit."
        : "Maintain both own-stay and investor exit logic; do not depend on one buyer pool."
    },
    {
      label: "Supply absorption",
      status: supplyRisk ? "risk" : supplyKnown ? "clear" : "caution",
      action: supplyRisk
        ? "Nearby newer similar supply needs absorption, occupancy, rent, and pricing proof before this property can rely on scarcity."
        : "Continue monitoring VP batches, unsold stock, developer discounting, and whether new supply complements or cannibalizes this product."
    },
    {
      label: "Auction and distress",
      status: auctionRisk || bulkRisk ? "risk" : "caution",
      action: auctionRisk || bulkRisk
        ? "Many auction or bulk-purchase signals may indicate project-level investor concentration, weak holding power, or pressure selling."
        : "Track auction volume by project, not isolated owner distress alone."
    }
  ];
  const marketRiskCount = marketChecks.filter((item) => item.status === "risk").length;
  const marketPulse = {
    status: marketRiskCount >= 2
      ? "risk"
      : marketWeaknessSignal || discountToFairValue >= 20
        ? "opportunity"
        : "watch",
    cycle: marketHypeSignal ? "Hype or late-cycle risk" : marketWeaknessSignal ? "Weak sentiment or crisis window" : "Cycle unclear",
    liquidity: liquidityRisk ? "Liquidity must be proven" : dealCard.exitBuyerPool === "Own-stay and investor" ? "Buyer pool has breadth" : "Buyer pool needs proof",
    summary: marketRiskCount >= 2
      ? "Market and liquidity signals are risky; require stronger proof before relying on timing or exit."
      : marketWeaknessSignal || discountToFairValue >= 20
        ? "There may be a timing opportunity, but only if the weakness is temporary and the asset remains durable."
        : "Market timing is not decisive yet; treat the deal as property-led, not hype-led.",
    checks: marketChecks
  };
  const exitSaturationSignal = hasSignal(dealNarrative, [/saturation/, /new project.*struggl/, /below median/, /oversupply/, /too many supply/]);
  const catalystSignal = hasSignal(dealNarrative, [/catalyst/, /booster/, /infrastructure/, /masterplan/, /growth corridor/]);
  const refinanceReady = fairValue && price && fairValue > price * 1.12 && stressedTrueHolding !== null && stressedTrueHolding >= 0 && dealCard.managementQuality !== "Weak";
  const holdAction = rejectStops.length || pauseStops.length
    ? "pause"
    : exitSaturationSignal || dealCard.managementQuality === "Weak"
      ? "sell"
      : refinanceReady && goal.includes("refinanc")
        ? "refinance"
        : catalystSignal || stressEnvelope.status === "resilient"
          ? "hold"
          : "monitor";
  const holdExitTriggers = [
    {
      label: "Annual tenancy review",
      status: rent && installment ? "normal" : "watch",
      action: "Review rent, vacancy, tenant quality, repair cost, true holding cash flow, and renewal terms every tenancy cycle."
    },
    {
      label: "Rental weakness",
      status: rentalDirectionRisk ? "action" : "watch",
      action: rentalDirectionRisk
        ? "First compare proposed rent against actual market rent, furnishing, tenant segment, and agent enquiry volume."
        : "If rent weakens for more than three months, decide whether the issue is pricing, product, tenant segment, competition, or structural decline."
    },
    {
      label: "Saleability weakness",
      status: liquidityRisk ? "action" : "watch",
      action: "If sale becomes harder, first test proposed selling price against completed transactions, active competition, bank value, and buyer financing."
    },
    {
      label: "Management or JMB change",
      status: dealCard.managementQuality === "Weak" ? "action" : "normal",
      action: "Escalate review if JMB response, arrears, lift reliability, cleanliness, security, or facility upkeep deteriorates."
    },
    {
      label: "Refinance review",
      status: refinanceReady ? "action" : "watch",
      action: refinanceReady
        ? "Refinancing can be reviewed, but only if higher debt is still covered by rent and market demand remains strong."
        : "Do not refinance just because time has passed; require real equity margin, stable rent, and defensible market value."
    },
    {
      label: "Exit trigger",
      status: exitSaturationSignal ? "action" : "watch",
      action: exitSaturationSignal
        ? "Consider exit when the area reaches saturation and new projects struggle to sell at market or below median price."
        : "Predefine minimum selling price, target buyer, likely objection, and market trigger before the holding period begins."
    }
  ];
  const holdExitPlan = {
    action: holdAction,
    reviewCadence: holdingYears ? `Formal review annually during a planned ${money(holdingYears)}-year hold, plus any trigger event.` : "Formal review annually and whenever a trigger event appears.",
    summary: holdAction === "pause"
      ? "Do not enter a hold/refinance/exit plan until the purchase itself is safe enough to proceed."
      : holdAction === "sell"
        ? "The plan should include an exit review because management, saturation, or liquidity risk can overwhelm holding patience."
        : holdAction === "refinance"
          ? "Refinancing may be reviewed only after rent, value, and building competitiveness are proven under stress."
          : holdAction === "hold"
            ? "The current thesis supports holding, with annual reviews and trigger-based reassessment."
            : "Hold versus exit is not proven yet; monitor rent, value, competition, management, and liquidity before relying on the thesis.",
    triggers: holdExitTriggers
  };
  const sealConditions = [
    {
      label: "No hard stop",
      status: hardStops.length ? "fail" : "pass",
      action: hardStops.length ? "Resolve or walk away from hard stops before committing." : "No hard-stop rule is currently triggered."
    },
    {
      label: "No decision blocker",
      status: blockers.length ? "review" : "pass",
      action: blockers.length ? `Clear blocker: ${blockers[0]}.` : "No blocker is preventing shortlist."
    },
    {
      label: "Evidence confidence",
      status: evidenceScore >= 75 ? "pass" : evidenceScore >= 55 ? "review" : "fail",
      action: "Completed value proof, achieved-rent proof, site visit, and legal checks must support the recommendation."
    },
    {
      label: "Stress survival",
      status: stressEnvelope.status === "fragile" ? "fail" : stressEnvelope.status === "pressure" || stressEnvelope.status === "unknown" ? "review" : "pass",
      action: "Base rent coverage is not enough; true holding cost and stressed shortfall must be survivable."
    },
    {
      label: "Portfolio expansion",
      status: portfolioGate.status === "block" ? "fail" : portfolioGate.status === "review" ? "review" : "pass",
      action: "The next property must not weaken reserve, concentration, or existing portfolio stability."
    },
    {
      label: "Execution readiness",
      status: executionActions.some((item) => item.status === "stop") ? "fail" : executionActions.some((item) => item.status === "caution") ? "review" : "pass",
      action: "Offer, professional checks, site visit, management, tenant, renovation, and exit actions must be controlled."
    },
    {
      label: "Market and liquidity",
      status: marketPulse.status === "risk" ? "fail" : marketPulse.status === "watch" ? "review" : "pass",
      action: "Timing advantage must be backed by buyer liquidity, rental direction, and supply absorption."
    }
  ];
  const sealFailCount = sealConditions.filter((item) => item.status === "fail").length;
  const sealReviewCount = sealConditions.filter((item) => item.status === "review").length;
  const decisionSealStatus = sealFailCount
    ? "blocked"
    : sealReviewCount
      ? "conditional"
      : "sealed";
  const decisionSeal = {
    status: decisionSealStatus,
    label: decisionSealStatus === "sealed" ? "V1 Clear To Negotiate" : decisionSealStatus === "conditional" ? "V1 Conditional Only" : "V1 Blocked",
    summary: decisionSealStatus === "sealed"
      ? "The v1 decision path is clean enough for controlled negotiation and final professional verification."
      : decisionSealStatus === "conditional"
        ? "The v1 decision path is not rejected, but review items must be cleared before commitment."
        : "The v1 decision path blocks commitment until failed conditions are fixed or the deal is abandoned.",
    conditions: sealConditions
  };
  const siteRiskNarrative = dealNarrative
    .replace(/lift wait acceptable|acceptable lift|lift waiting time acceptable/g, "")
    .replace(/no major defect or leakage|no major defects or leakages|no defect|no defects|no leak|no leakage|no leakages/g, "");
  const siteRiskSignal = hasSignal(siteRiskNarrative, [
    /leak/,
    /water mark/,
    /lift.*slow/,
    /lift.*wait/,
    /security.*weak/,
    /dirty/,
    /smell/,
    /refuse/,
    /noise/,
    /airbnb/,
    /short.?stay/,
    /complaint/,
    /poor maintenance/,
    /bad vibe/
  ]);
  const sitePositiveSignal = hasSignal(dealNarrative, [
    /good vibe/,
    /clean/,
    /family/,
    /peaceful/,
    /comfortable lobby/,
    /respectful/,
    /bright car park/,
    /fast lift/,
    /well maintained/
  ]);
  const siteVisitChecks = [
    {
      label: "Physical visit status",
      status: dealCard.siteVisit === "Completed" ? "clear" : "check",
      action: dealCard.siteVisit === "Completed"
        ? "Preserve site photos, lift waiting notes, lobby and car-park observations, and management-office responses."
        : "Do not give a strong recommendation until the guardhouse, lobby, lift, corridor, refuse room, car park, facilities, and surrounding vibe are physically checked."
    },
    {
      label: "Own-stay vibe",
      status: dealCard.ownStayAppeal === "Strong" || sitePositiveSignal ? "clear" : dealCard.ownStayAppeal === "Weak" || siteRiskSignal ? "risk" : "check",
      action: "Look for whether a real owner-occupier can imagine living there, not just whether the rent calculation works."
    },
    {
      label: "Building operations",
      status: dealCard.managementQuality === "Weak" || siteRiskSignal ? "risk" : dealCard.managementQuality === "Strong" ? "clear" : "check",
      action: "Test management response speed, lift reliability, security attitude, cleanliness, rain splash, refuse-room ventilation, and common-area upkeep."
    },
    {
      label: "Unit placement",
      status: dealCard.unitPosition === "Unfavourable" ? "risk" : dealCard.unitPosition === "Good" ? "clear" : "check",
      action: "Confirm the unit is not punished by refuse room, lift noise, awkward corridor exposure, poor view, bad sunlight, or weak ventilation."
    },
    {
      label: "Evidence capture",
      status: dealCard.siteVisitNotes ? "clear" : "check",
      action: "Record the lived impression in words. The vibe test should come after data, but it still matters because data cannot show everything."
    }
  ];
  const siteVisitRiskCount = siteVisitChecks.filter((item) => item.status === "risk").length;
  const siteVisitAssistant = {
    status: siteVisitRiskCount ? "risk" : dealCard.siteVisit === "Completed" ? "ready" : "required",
    focus: dealCard.siteVisitNotes || dealCard.inspectionConcern || "Site visit must test lived quality, not just visible beauty.",
    summary: siteVisitRiskCount
      ? "Site-level risk is visible; the numbers should not override physical quality, management, or unit-placement concerns."
      : dealCard.siteVisit === "Completed"
        ? "Site visit evidence is present; keep it tied to specific observations so the recommendation is not just a feeling."
        : "Apex needs physical inspection before moving from desk analysis to a strong recommendation.",
    checks: siteVisitChecks
  };
  const sourceText = String(dealCard.dealSource || "").toLowerCase();
  const agentText = String(dealCard.agentBehavior || "").toLowerCase();
  const sellerText = String(dealCard.sellerMotivation || "").toLowerCase();
  const professionalText = String(dealCard.professionalConcern || "").toLowerCase();
  const pushedInventorySignal = hasSignal(`${sourceText} ${agentText} ${dealNarrative}`, [/hard sell/, /keep follow/, /repeated follow/, /push inventory/, /heavily advertised/, /social media/, /fake listing/]);
  const scarceDealSignal = hasSignal(`${sourceText} ${agentText}`, [/auction/, /agency/, /in.?house/, /referral/, /owner direct/, /one.?time/, /first hand/]);
  const v2MotivatedSellerSignal = hasSignal(`${sellerText} ${dealNarrative}`, [/urgent/, /cash/, /debt/, /divorce/, /family/, /open to negotiation/, /motivated/, /market downturn/]);
  const professionalRiskSignal = hasSignal(`${professionalText} ${dealNarrative}`, [/late reply/, /hard sell/, /no solution/, /overcharge/, /no comparison/, /desperate/, /too flexible/, /fishy/]);
  const sourcingChecks = [
    {
      label: "Deal source quality",
      status: pushedInventorySignal ? "caution" : scarceDealSignal ? "clear" : "verify",
      action: pushedInventorySignal
        ? "Treat public hype, social-media claims, fake listings, or repeated follow-up as inventory pressure until transaction proof says otherwise."
        : scarceDealSignal
          ? "A scarce source is useful, but still verify the price against completed transactions and closest substitutes."
          : "Record where this deal came from and why it reached you instead of being taken earlier."
    },
    {
      label: "Agent behaviour",
      status: /hard sell|keep follow|repeated|desperate/.test(agentText) ? "risk" : /one.?time|genuine|first hand/.test(agentText) ? "clear" : "verify",
      action: "Ask the agent beyond the listing: nearest substitutes, owner motivation, recent subsale, tenant urgency, title path, and why the deal is still available."
    },
    {
      label: "Seller motivation",
      status: v2MotivatedSellerSignal ? "clear" : sellerText ? "verify" : "verify",
      action: v2MotivatedSellerSignal
        ? "Use seller urgency to negotiate, but do not let urgency replace legal, financing, and site evidence."
        : "Determine whether the seller is truly motivated or simply testing an ambitious price."
    },
    {
      label: "Professional network",
      status: professionalRiskSignal ? "risk" : professionalText ? "verify" : "verify",
      action: "Agent, banker, and lawyer advice should be challenged with adjacent questions, not accepted only because they can close a deal."
    },
    {
      label: "Offer discipline",
      status: executionPlan.posture === "No offer" ? "risk" : executionPlan.posture === "Controlled negotiation" ? "clear" : "verify",
      action: "Set the minimum and maximum offer before pressure starts. Do not negotiate only for cheapness if the property itself is weak."
    }
  ];
  const sourcingRiskCount = sourcingChecks.filter((item) => item.status === "risk").length;
  const sourcingCautionCount = sourcingChecks.filter((item) => item.status === "caution").length;
  const sourcingProfessional = {
    status: sourcingRiskCount ? "risk" : sourcingCautionCount ? "pressure" : scarceDealSignal || v2MotivatedSellerSignal ? "clean" : "verify",
    posture: pushedInventorySignal ? "Slow down and verify source quality" : v2MotivatedSellerSignal ? "Negotiate with discipline" : "Evidence-first sourcing",
    summary: sourcingRiskCount
      ? "The sourcing or professional layer shows red flags; do not let commission-driven urgency shape the decision."
      : pushedInventorySignal
        ? "The deal may be pushed inventory; require independent evidence before treating it as an opportunity."
        : "The sourcing layer is workable if the agent, seller, banker, and lawyer claims are tested against evidence.",
    checks: sourcingChecks
  };
  const tenantText = String(dealCard.targetTenant || "").toLowerCase();
  const tenantScreenText = String(dealCard.tenantScreening || "").toLowerCase();
  const furnishingText = String(dealCard.furnishingStrategy || "").toLowerCase();
  const tenantRiskSignal = hasSignal(`${tenantText} ${tenantScreenText} ${dealNarrative}`, [/illegal/, /no document/, /late payment/, /destroy/, /damage/, /factory worker/, /fishy/, /sublet/, /short.?stay/]);
  const tenantStableSignal = hasSignal(`${tenantText} ${tenantScreenText}`, [/student/, /professional/, /white collar/, /family/, /employment proof/, /student proof/]);
  const furnishingReadySignal = furnishingText.includes("fully") || hasSignal(`${furnishingText} ${dealNarrative}`, [/muji/, /minimal/, /table/, /chair/, /move.?in/]);
  const tenantChecks = [
    {
      label: "Rent coverage",
      status: holdingCashFlow !== null && holdingCashFlow >= 0 ? "clear" : holdingCashFlow !== null ? "risk" : "watch",
      action: holdingCashFlow !== null && holdingCashFlow >= 0
        ? "Rent covers the stated instalment and maintenance before deeper true-cost checks."
        : "Do not treat the rental plan as safe until rent can cover instalment, maintenance, and recurring cost under conservative assumptions."
    },
    {
      label: "Target tenant",
      status: tenantRiskSignal ? "risk" : tenantStableSignal || dealCard.targetTenant ? "clear" : "watch",
      action: "Define the tenant by actual demand drivers such as workplace, university, family use, documentation, payment behaviour, and unit-care risk."
    },
    {
      label: "Furnishing strategy",
      status: furnishingReadySignal || dealCard.furnishingStrategy ? "clear" : "watch",
      action: "For rental property, furnish for rentability and durability, not personal taste. Keep the budget disciplined."
    },
    {
      label: "Screening discipline",
      status: tenantRiskSignal ? "risk" : tenantScreenText ? "clear" : "watch",
      action: "Check identity, work or study status, payment source, intended occupants, and any request that sounds like illegal use or uncontrolled subletting."
    },
    {
      label: "Rental evidence",
      status: ["strong", "usable"].includes(achievedRentalStatus) ? "clear" : "watch",
      action: "Use active rental agents and achieved rent where possible; listings alone do not prove tenant urgency."
    }
  ];
  const tenantRiskCount = tenantChecks.filter((item) => item.status === "risk").length;
  const tenantRentalPlan = {
    status: tenantRiskCount ? "risk" : tenantChecks.some((item) => item.status === "watch") ? "watch" : "ready",
    target: dealCard.targetTenant || "Target tenant not stated",
    summary: tenantRiskCount
      ? "Rental execution has risk; a good headline yield can still become a headache if tenant quality and screening are weak."
      : "Rental execution is workable if rent evidence, furnishing, tenant fit, and screening stay disciplined.",
    checks: tenantChecks
  };
  const exitText = String(dealCard.exitStrategyPlan || "").toLowerCase();
  const resaleText = String(dealCard.resalePreparation || "").toLowerCase();
  const exitRiskSignal = liquidityRisk || supplyRisk || dealCard.unitPosition === "Unfavourable" || dealCard.managementQuality === "Weak";
  const exitPreparationSignal = hasSignal(`${exitText} ${resaleText}`, [/renovat/, /staging/, /vacant/, /bank value/, /owner.?stay/, /photo/, /viewing/]);
  const exitChecks = [
    {
      label: "Buyer pool breadth",
      status: dealCard.exitBuyerPool === "Own-stay and investor" ? "clear" : dealCard.exitBuyerPool === "Investor mainly" || dealCard.exitBuyerPool === "Unclear" ? "risk" : "prepare",
      action: "Do not rely on only bargain-hunting investors. Preserve both owner-occupier emotion and investor return logic."
    },
    {
      label: "Resale emotion",
      status: dealCard.ownStayAppeal === "Strong" || exitPreparationSignal ? "clear" : dealCard.ownStayAppeal === "Weak" ? "risk" : "prepare",
      action: "Renovation, staging, view, layout, smell, lighting, and vacant viewing condition shape whether an own-stay buyer pays above market."
    },
    {
      label: "Liquidity obstacle",
      status: exitRiskSignal ? "risk" : exitPreparationSignal ? "clear" : "prepare",
      action: exitRiskSignal
        ? "Weak liquidity, substitute supply, management, or unit placement may require a lower exit price or longer selling period."
        : "Predefine bank value, target buyer, asking strategy, and likely objections before the holding period begins."
    },
    {
      label: "Sale mode",
      status: exitText || resaleText ? "clear" : "prepare",
      action: "Decide whether to sell vacant after renovation, sell tenanted to an investor, hold for rent, or refinance before the market forces that choice."
    },
    {
      label: "Objection handling",
      status: dealCard.unitPosition === "Unfavourable" || dealCard.managementQuality === "Weak" ? "risk" : resaleText ? "clear" : "prepare",
      action: "Prepare answers for buyer objections around unit placement, maintenance, access, supply, defects, and realistic bank value."
    }
  ];
  const exitRiskCount = exitChecks.filter((item) => item.status === "risk").length;
  const exitStrategy = {
    status: exitRiskCount ? "risk" : exitChecks.some((item) => item.status === "prepare") ? "prepare" : "clear",
    buyerPsychology: dealCard.exitBuyerPool === "Own-stay and investor"
      ? "Future exit can speak to both emotion and return."
      : "Future exit psychology needs sharper proof; the buyer pool may be narrow.",
    summary: exitRiskCount
      ? "Exit is the weak side of the thesis; saleability must be planned before purchase, not discovered after holding."
      : "Exit can be planned, but the resale story must be prepared around buyer emotion, evidence, and objections.",
    checks: exitChecks
  };
  const guidanceChecks = [
    {
      label: "Experience level",
      value: financialProfile.experienceLevel,
      action: financialProfile.experienceLevel
        ? `Use ${financialProfile.experienceLevel} pacing.`
        : "State whether the user is beginner, intermediate, seasoned, or professional."
    },
    {
      label: "Guidance mode",
      value: financialProfile.guidanceMode,
      action: financialProfile.guidanceMode
        ? `Answer in ${financialProfile.guidanceMode} mode.`
        : "Choose guided, balanced, concise, or professional mode."
    },
    {
      label: "Decision intent",
      value: financialProfile.decisionIntent,
      action: financialProfile.decisionIntent
        ? `Focus on: ${financialProfile.decisionIntent}.`
        : "Clarify whether Apex is teaching, screening, preparing an offer, comparing deals, or reviewing a portfolio."
    },
    {
      label: "Preferred output",
      value: financialProfile.preferredOutput,
      action: financialProfile.preferredOutput
        ? `Format as: ${financialProfile.preferredOutput}.`
        : "Choose short answer, full report, checklist, or voice summary."
    },
    {
      label: "Confidence comfort",
      value: financialProfile.confidenceComfort,
      action: financialProfile.confidenceComfort
        ? `Challenge with ${financialProfile.confidenceComfort} confidence tolerance.`
        : "Tell Apex how conservative to be when evidence is incomplete."
    },
    {
      label: "Guidance notes",
      value: onboardingNotes,
      action: onboardingNotes
        ? "Apply the user's extra explanation preference."
        : "Optional: add any personal preference about tone, detail, or directness."
    }
  ].map((item) => ({
    label: item.label,
    status: item.value ? "clear" : item.label === "Guidance notes" ? "watch" : "missing",
    action: item.action
  }));
  const completedGuidanceChecks = guidanceChecks.filter((item) => item.status === "clear").length;
  const onboardingCompleteness = clampScore((completedGuidanceChecks / guidanceChecks.length) * 100);
  const guidedMode = guidanceMode.includes("guided") || experienceLevel.includes("beginner");
  const professionalMode = guidanceMode.includes("professional") || experienceLevel.includes("professional");
  const conciseMode = guidanceMode.includes("concise") || preferredOutput.includes("short") || preferredOutput.includes("voice");
  const checklistMode = preferredOutput.includes("checklist");
  const productMode = guidedMode
    ? "Guided beginner review"
    : professionalMode
      ? "Professional due-diligence review"
      : conciseMode
        ? "Concise decision review"
        : checklistMode
          ? "Checklist-led review"
          : "Balanced investor review";
  const explanationStyle = guidedMode
    ? "Plain-language mentor mode with reasons, missing proof, and next action."
    : professionalMode
      ? "Due-diligence format with concise evidence gates and decision blockers."
      : conciseMode
        ? "Short executive answer with only the strongest reason, blocker, and next step."
        : checklistMode
          ? "Checklist format that converts the report into tasks."
          : "Balanced explanation that keeps judgment, evidence, and action together.";
  const guidanceSummary = guidedMode
    ? "Apex should slow down, explain the why, and challenge beginner mistakes without weakening the evidence standard."
    : professionalMode
      ? "Apex can be sharper and more compact, but every conclusion still needs transaction, rental, financing, site, and legal support."
      : conciseMode
        ? "Apex should answer tighter, with the main verdict first and supporting detail only where it changes the decision."
        : "Apex should balance teaching, decision discipline, and action steps for this user.";
  const productNextAction = guidanceChecks.some((item) => item.status === "missing")
    ? "Complete the missing guidance fields so Apex can match the explanation style to the user."
    : hardStops.length
      ? "Use the selected guidance mode to explain the hard stop without making the user rationalize it away."
      : blockers.length
        ? "Use the selected guidance mode to clear the strongest blocker before discussing upside."
        : verdict === "SHORTLIST"
          ? "Convert the report into a due-diligence checklist before any booking or offer."
          : "Keep the next response focused on the cheapest evidence that can change the decision.";
  const productExperience = {
    mode: productMode,
    level: financialProfile.experienceLevel || "Not stated",
    intent: financialProfile.decisionIntent || "Not stated",
    preferredOutput: financialProfile.preferredOutput || "Not stated",
    confidenceComfort: financialProfile.confidenceComfort || "Not stated",
    summary: guidanceSummary,
    explanationStyle,
    nextBestAction: productNextAction,
    onboardingCompleteness,
    checks: guidanceChecks
  };

  return {
    engineVersion: "Apex v10.10",
    reasoningMode: "Framework only",
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
    stressEnvelope,
    portfolioGate,
    marketPulse,
    holdExitPlan,
    decisionSeal,
    siteVisitAssistant,
    sourcingProfessional,
    tenantRentalPlan,
    exitStrategy,
    productExperience,
    challengeMode,
    decisionFocus,
    investorReadiness,
    evidenceChecklist,
    evidenceEngine,
    transactionComparableEvidence,
    achievedRentalEvidence,
    financingValuationEvidence,
    supplyAbsorptionEvidence,
    siteManagementEvidence,
    legalTransactionEvidence,
    dueDiligencePlan,
    executionPlan,
    hardStops: hardStopText,
    recommendationBlockers: blockers,
    watchouts: uniqueText(watchouts, 8),
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
  if (analysis.decisionFocus?.body) {
    lines.push("", `Decision focus: ${analysis.decisionFocus.label || "Decision focus"}`, `- ${analysis.decisionFocus.body}`);
  }
  if (analysis.investorReadiness?.label) {
    lines.push("", "Investor readiness", `- ${analysis.investorReadiness.label}: ${analysis.investorReadiness.summary || ""}`);
    if (analysis.investorReadiness.flags?.length) lines.push(...analysis.investorReadiness.flags.map((item) => `- ${item}`));
  }
  if (analysis.productExperience?.summary) {
    lines.push(
      "",
      "V5 product experience",
      `- ${analysis.productExperience.mode || "Balanced investor review"}: ${analysis.productExperience.summary}`,
      `- Style: ${analysis.productExperience.explanationStyle || "Balanced explanation"}`,
      `- Next: ${analysis.productExperience.nextBestAction || "Complete the guidance fields before relying on report format."}`
    );
  }
  if (analysis.dimensions?.length) {
    lines.push("", "Four-part decision read", ...analysis.dimensions.map((item) => `- ${item.label}: ${item.score}/100 (${item.status}).`));
  }
  if (analysis.evidenceChecklist?.length) {
    lines.push("", "Evidence checklist", ...analysis.evidenceChecklist.map((item) => `- ${item.label}: ${item.status}. ${item.action}`));
  }
  if (analysis.evidenceEngine?.summary) {
    lines.push(
      "",
      "V4.0 evidence engine",
      `- ${analysis.evidenceEngine.status || "unknown"} (${analysis.evidenceEngine.score || 0}/100): ${analysis.evidenceEngine.summary}`,
      `- Gate: ${analysis.evidenceEngine.recommendationGate || "Evidence gate not calculated."}`
    );
    if (analysis.evidenceEngine.criticalGaps?.length) lines.push(...analysis.evidenceEngine.criticalGaps.map((item) => `- Critical gap: ${item}`));
    lines.push(...(analysis.evidenceEngine.gates || []).map((item) => `- ${item.label}: ${item.status}, ${item.score}/100. ${item.action}`));
  }
  if (analysis.transactionComparableEvidence?.summary) {
    lines.push(
      "",
      "V4.1 transaction comparable evidence",
      `- ${analysis.transactionComparableEvidence.status || "unknown"} (${analysis.transactionComparableEvidence.score || 0}/100): ${analysis.transactionComparableEvidence.summary}`,
      `- Value position: ${analysis.transactionComparableEvidence.valuePosition || "Not calculated."}`
    );
    lines.push(...(analysis.transactionComparableEvidence.checks || []).map((item) => `- ${item.label}: ${item.status}. ${item.action}`));
  }
  if (analysis.achievedRentalEvidence?.summary) {
    lines.push(
      "",
      "V4.2 achieved rental evidence",
      `- ${analysis.achievedRentalEvidence.status || "unknown"} (${analysis.achievedRentalEvidence.score || 0}/100): ${analysis.achievedRentalEvidence.summary}`,
      `- Coverage: ${analysis.achievedRentalEvidence.coveragePosition || "Not calculated."}`
    );
    lines.push(...(analysis.achievedRentalEvidence.checks || []).map((item) => `- ${item.label}: ${item.status}. ${item.action}`));
  }
  if (analysis.financingValuationEvidence?.summary) {
    lines.push(
      "",
      "V4.3 financing and valuation evidence",
      `- ${analysis.financingValuationEvidence.status || "unknown"} (${analysis.financingValuationEvidence.score || 0}/100): ${analysis.financingValuationEvidence.summary}`,
      `- Affordability: ${analysis.financingValuationEvidence.affordabilityPosition || "Not calculated."}`
    );
    lines.push(...(analysis.financingValuationEvidence.checks || []).map((item) => `- ${item.label}: ${item.status}. ${item.action}`));
  }
  if (analysis.supplyAbsorptionEvidence?.summary) {
    lines.push(
      "",
      "V4.4 supply and absorption evidence",
      `- ${analysis.supplyAbsorptionEvidence.status || "unknown"} (${analysis.supplyAbsorptionEvidence.score || 0}/100): ${analysis.supplyAbsorptionEvidence.summary}`,
      `- Competition: ${analysis.supplyAbsorptionEvidence.competitionPosition || "Not calculated."}`
    );
    lines.push(...(analysis.supplyAbsorptionEvidence.checks || []).map((item) => `- ${item.label}: ${item.status}. ${item.action}`));
  }
  if (analysis.siteManagementEvidence?.summary) {
    lines.push(
      "",
      "V4.5 site and management evidence",
      `- ${analysis.siteManagementEvidence.status || "unknown"} (${analysis.siteManagementEvidence.score || 0}/100): ${analysis.siteManagementEvidence.summary}`,
      `- Lived quality: ${analysis.siteManagementEvidence.livedQualityPosition || "Not calculated."}`
    );
    lines.push(...(analysis.siteManagementEvidence.checks || []).map((item) => `- ${item.label}: ${item.status}. ${item.action}`));
  }
  if (analysis.legalTransactionEvidence?.summary) {
    lines.push(
      "",
      "V4.6 legal and transaction evidence",
      `- ${analysis.legalTransactionEvidence.status || "unknown"} (${analysis.legalTransactionEvidence.score || 0}/100): ${analysis.legalTransactionEvidence.summary}`,
      `- Transaction path: ${analysis.legalTransactionEvidence.transactionPosition || "Not calculated."}`
    );
    lines.push(...(analysis.legalTransactionEvidence.checks || []).map((item) => `- ${item.label}: ${item.status}. ${item.action}`));
  }
  if (analysis.dueDiligencePlan?.tasks?.length) {
    lines.push("", "Due diligence pack", `- ${analysis.dueDiligencePlan.summary}`);
    lines.push(...analysis.dueDiligencePlan.tasks.map((item) => `- ${item.owner} / ${item.priority} / ${item.status}: ${item.label}. ${item.action}`));
  }
  if (analysis.stressEnvelope?.summary) {
    lines.push(
      "",
      "Stress envelope",
      `- ${analysis.stressEnvelope.summary}`,
      `- Base true holding: ${analysis.stressEnvelope.baseTrueHolding}.`,
      `- Stressed true holding: ${analysis.stressEnvelope.stressedTrueHolding}.`,
      `- Cash after stress reserves: ${analysis.stressEnvelope.cashAfterStressReserves}.`,
      `- Reserve survival: ${analysis.stressEnvelope.reserveSurvivalMonths === null ? "Not applicable" : `${analysis.stressEnvelope.reserveSurvivalMonths} months`}.`
    );
    if (analysis.stressEnvelope.assumptions?.length) {
      lines.push(...analysis.stressEnvelope.assumptions.map((item) => `- ${item.label}: ${item.value} (${item.source}).`));
    }
  }
  if (analysis.portfolioGate?.summary) {
    lines.push(
      "",
      "Portfolio expansion gate",
      `- ${analysis.portfolioGate.status || "review"} (${analysis.portfolioGate.score || 0}/100): ${analysis.portfolioGate.summary}`,
      `- Next-property rule: ${analysis.portfolioGate.nextPropertyRule || "Do not scale until the current property is proven."}`
    );
    if (analysis.portfolioGate.checks?.length) {
      lines.push(...analysis.portfolioGate.checks.map((item) => `- ${item.label}: ${item.status}. ${item.action}`));
    }
  }
  if (analysis.marketPulse?.summary) {
    lines.push(
      "",
      "Market cycle and liquidity pulse",
      `- ${analysis.marketPulse.status || "watch"}: ${analysis.marketPulse.summary}`,
      `- Cycle: ${analysis.marketPulse.cycle || "Cycle unclear"}.`,
      `- Liquidity: ${analysis.marketPulse.liquidity || "Liquidity must be proven"}.`
    );
    if (analysis.marketPulse.checks?.length) {
      lines.push(...analysis.marketPulse.checks.map((item) => `- ${item.label}: ${item.status}. ${item.action}`));
    }
  }
  if (analysis.developmentIntelligence?.summary) {
    lines.push(
      "",
      "V7 development intelligence stack",
      `- ${analysis.developmentIntelligence.status || "thin"} (${analysis.developmentIntelligence.score || 0}/100): ${analysis.developmentIntelligence.summary}`,
      `- Posture: ${analysis.developmentIntelligence.posture || "Build evidence first"}.`
    );
    lines.push(...(analysis.developmentIntelligence.lanes || []).map((item) => `- ${item.version} ${item.label}: ${item.status}, ${item.score}/100. ${item.reading} Action: ${item.action}`));
    if (analysis.developmentIntelligence.actionQueue?.length) {
      lines.push("V7 action queue", ...analysis.developmentIntelligence.actionQueue.map((item) => `- ${item.version} ${item.label}: ${item.action}`));
    }
  }
  if (analysis.caseIntelligence?.summary) {
    lines.push(
      "",
      "Development case library",
      `- ${analysis.caseIntelligence.status || "thin"} (${analysis.caseIntelligence.score || 0}/100): ${analysis.caseIntelligence.summary}`,
      `- Posture: ${analysis.caseIntelligence.posture || "Case-informed, verify live"}.`
    );
    lines.push(...(analysis.caseIntelligence.cases || []).map((item) => `- ${item.projectName}: ${item.verdictLabel || item.verdict}, ${item.confidence} confidence, ${item.rating || 0}/100. ${item.summary || item.ownerVerdict || ""}`));
    if (analysis.caseIntelligence.actionQueue?.length) {
      lines.push("Case action queue", ...analysis.caseIntelligence.actionQueue.map((item) => `- ${item.label}: ${item.action}`));
    }
  }
  if (analysis.documentIntelligence?.summary) {
    lines.push(
      "",
      "V8 document intelligence stack",
      `- ${analysis.documentIntelligence.status || "thin"} (${analysis.documentIntelligence.score || 0}/100): ${analysis.documentIntelligence.summary}`,
      `- Posture: ${analysis.documentIntelligence.posture || "Evidence-building mode"}.`,
      `- Vault: ${analysis.documentIntelligence.vaultHealth?.documents || 0} documents, ${analysis.documentIntelligence.vaultHealth?.indexed || 0} indexed, ${analysis.documentIntelligence.vaultHealth?.matched || 0} matched.`
    );
    lines.push(...(analysis.documentIntelligence.lanes || []).map((item) => `- ${item.version} ${item.label}: ${item.status}, ${item.score}/100. ${item.reading} Action: ${item.action}`));
    if (analysis.documentIntelligence.matchedEvidence?.length) {
      lines.push("Matched owner evidence", ...analysis.documentIntelligence.matchedEvidence.map((item) => `- ${item.title}: ${item.preview}`));
    }
    if (analysis.documentIntelligence.actionQueue?.length) {
      lines.push("V8 action queue", ...analysis.documentIntelligence.actionQueue.map((item) => `- ${item.version} ${item.label}: ${item.action}`));
    }
  }
  if (analysis.portfolioCommand?.summary) {
    lines.push(
      "",
      "V9 portfolio command stack",
      `- ${analysis.portfolioCommand.status || "hold"} (${analysis.portfolioCommand.score || 0}/100): ${analysis.portfolioCommand.summary}`,
      `- Posture: ${analysis.portfolioCommand.posture || "Hold and verify"}.`,
      `- Next move: ${analysis.portfolioCommand.nextMove || "Clear the weakest portfolio lane."}`
    );
    const map = analysis.portfolioCommand.capitalMap || {};
    lines.push(`- Capital map: cash ${map.cashAvailable || "n/a"}, outlay ${map.cashOutlay || "n/a"}, after purchase ${map.cashAfterPurchase || "n/a"}, DSR ${map.postDealDsr || "n/a"}, holding ${map.holdingCashFlow || "n/a"}.`);
    lines.push(...(analysis.portfolioCommand.lanes || []).map((item) => `- ${item.version} ${item.label}: ${item.status}, ${item.score}/100. ${item.reading} Action: ${item.action}`));
    if (analysis.portfolioCommand.actionQueue?.length) {
      lines.push("V9 action queue", ...analysis.portfolioCommand.actionQueue.map((item) => `- ${item.version} ${item.label}: ${item.action}`));
    }
  }
  if (analysis.finalCommand?.summary) {
    lines.push(
      "",
      "V10 final command stack",
      `- ${analysis.finalCommand.command || "INVESTIGATE FIRST"} (${analysis.finalCommand.score || 0}/100): ${analysis.finalCommand.summary}`,
      `- Next move: ${analysis.finalCommand.nextMove || "Clear the weakest V10 lane."}`,
      `- Contradictions: ${analysis.finalCommand.contradictionCount || 0}`
    );
    if (analysis.finalCommand.contradictions?.length) {
      lines.push(...analysis.finalCommand.contradictions.map((item) => `- Contradiction: ${item}`));
    }
    lines.push(...(analysis.finalCommand.lanes || []).map((item) => `- ${item.version} ${item.label}: ${item.status}, ${item.score}/100. ${item.reading} Action: ${item.action}`));
    if (analysis.finalCommand.actionQueue?.length) {
      lines.push("V10 action queue", ...analysis.finalCommand.actionQueue.map((item) => `- ${item.version} ${item.label}: ${item.action}`));
    }
  }
  if (analysis.holdExitPlan?.summary) {
    lines.push(
      "",
      "Hold, refinance, exit plan",
      `- ${analysis.holdExitPlan.action || "monitor"}: ${analysis.holdExitPlan.summary}`,
      `- Review cadence: ${analysis.holdExitPlan.reviewCadence || "Review annually and on trigger events."}`
    );
    if (analysis.holdExitPlan.triggers?.length) {
      lines.push(...analysis.holdExitPlan.triggers.map((item) => `- ${item.label}: ${item.status}. ${item.action}`));
    }
  }
  if (analysis.decisionSeal?.summary) {
    lines.push(
      "",
      "V1 decision seal",
      `- ${analysis.decisionSeal.label || "V1 Conditional Only"}: ${analysis.decisionSeal.summary}`
    );
    if (analysis.decisionSeal.conditions?.length) {
      lines.push(...analysis.decisionSeal.conditions.map((item) => `- ${item.label}: ${item.status}. ${item.action}`));
    }
  }
  if (analysis.siteVisitAssistant?.summary) {
    lines.push(
      "",
      "V2.1 site visit assistant",
      `- ${analysis.siteVisitAssistant.status || "required"}: ${analysis.siteVisitAssistant.summary}`,
      `- Focus: ${analysis.siteVisitAssistant.focus || "Check lived quality on site."}`
    );
    if (analysis.siteVisitAssistant.checks?.length) {
      lines.push(...analysis.siteVisitAssistant.checks.map((item) => `- ${item.label}: ${item.status}. ${item.action}`));
    }
  }
  if (analysis.sourcingProfessional?.summary) {
    lines.push(
      "",
      "V2.2 sourcing and professional filter",
      `- ${analysis.sourcingProfessional.status || "verify"}: ${analysis.sourcingProfessional.summary}`,
      `- Posture: ${analysis.sourcingProfessional.posture || "Evidence-first sourcing"}`
    );
    if (analysis.sourcingProfessional.checks?.length) {
      lines.push(...analysis.sourcingProfessional.checks.map((item) => `- ${item.label}: ${item.status}. ${item.action}`));
    }
  }
  if (analysis.tenantRentalPlan?.summary) {
    lines.push(
      "",
      "V2.3 tenant and rental plan",
      `- ${analysis.tenantRentalPlan.status || "watch"}: ${analysis.tenantRentalPlan.summary}`,
      `- Target: ${analysis.tenantRentalPlan.target || "Target tenant not stated"}`
    );
    if (analysis.tenantRentalPlan.checks?.length) {
      lines.push(...analysis.tenantRentalPlan.checks.map((item) => `- ${item.label}: ${item.status}. ${item.action}`));
    }
  }
  if (analysis.exitStrategy?.summary) {
    lines.push(
      "",
      "V2.4 exit strategy and buyer psychology",
      `- ${analysis.exitStrategy.status || "prepare"}: ${analysis.exitStrategy.summary}`,
      `- Buyer psychology: ${analysis.exitStrategy.buyerPsychology || "Buyer objections must be prepared."}`
    );
    if (analysis.exitStrategy.checks?.length) {
      lines.push(...analysis.exitStrategy.checks.map((item) => `- ${item.label}: ${item.status}. ${item.action}`));
    }
  }
  if (analysis.executionPlan?.actions?.length) {
    lines.push(
      "",
      "Execution calibration",
      `- Posture: ${analysis.executionPlan.posture || "Verify before offer"}.`,
      `- Opening anchor: ${analysis.executionPlan.openingAnchor || "Need value proof"}.`,
      `- Maximum offer: ${analysis.executionPlan.maximumOffer || "Need value/rent proof"}.`,
      `- Walk-away rule: ${analysis.executionPlan.walkAway || "Do not proceed under pressure."}`
    );
    lines.push(...analysis.executionPlan.actions.map((item) => `- ${item.lane} / ${item.status}: ${item.label}. ${item.action}`));
  }
  if (analysis.learningLoop?.signals?.length) {
    lines.push("", "Learning loop", `- ${analysis.learningLoop.summary}`);
    if (analysis.learningLoop.profile?.approvedCount) {
      lines.push(
        `- Memory profile: ${analysis.learningLoop.profile.investorType}; ${analysis.learningLoop.profile.riskStyle}.`,
        `- Profile completeness: ${analysis.learningLoop.profile.completeness || 0}%.`
      );
    }
    lines.push(...analysis.learningLoop.signals.map((item) => `- ${item.label}: ${item.body} ${item.action}`));
  }
  if (analysis.personalizedChallenge?.message) {
    lines.push("", `V3.3 personalized challenge: ${analysis.personalizedChallenge.label || "Personalized challenge"}`, `- ${analysis.personalizedChallenge.message}`);
    lines.push(...(analysis.personalizedChallenge.checks || []).map((item) => `- ${item.label}: ${item.status}. ${item.action}`));
  }
  if (analysis.dealMemoryComparison?.summary) {
    lines.push("", "V3.4 deal memory comparison", `- ${analysis.dealMemoryComparison.summary}`);
    lines.push(...(analysis.dealMemoryComparison.matches || []).map((item) => `- ${item.subject}: ${item.similarity}% similar, ${item.verdict}. ${item.reason} ${item.action}`));
  }
  if (analysis.beliefTracker?.summary) {
    lines.push("", "V3.5 belief tracker", `- ${analysis.beliefTracker.summary}`);
    lines.push(...(analysis.beliefTracker.beliefs || []).map((item) => `- ${item.label}: ${item.status}. ${item.action}`));
  }
  if (analysis.sourceTransparency?.summary) {
    lines.push("", "V3.6 source transparency", `- ${analysis.sourceTransparency.summary}`);
    lines.push(...(analysis.sourceTransparency.sources || []).map((item) => `- ${item.label}: ${item.status}. ${item.detail}`));
  }
  if (analysis.memoryConflicts?.summary) {
    lines.push("", "V3.7 memory conflicts", `- ${analysis.memoryConflicts.summary}`);
    lines.push(...(analysis.memoryConflicts.conflicts || []).map((item) => `- ${item.label}: ${item.status}. ${item.action}`));
  }
  if (analysis.personalOperatingRules?.summary) {
    lines.push("", "V3.8 personal operating rules", `- ${analysis.personalOperatingRules.summary}`);
    lines.push(...(analysis.personalOperatingRules.rules || []).map((item) => `- ${item.label}: ${item.status}. ${item.action}`));
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
  if (analysis.challengeMode?.message) lines.push("", `Challenge mode: ${analysis.challengeMode.label || "Mentor challenge"}`, `- ${analysis.challengeMode.message}`);
  if (analysis.hardStops.length) lines.push("", "Hard stops", ...analysis.hardStops.map((item) => `- ${item}`));
  if (analysis.recommendationBlockers?.length) lines.push("", "Decision blockers", ...analysis.recommendationBlockers.map((item) => `- ${item}`));
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
    "journal-process-outcome-luck",
    "execution-compliance-markup-bulk-boundary",
    "execution-document-stop-title-risk",
    "execution-ground-sentiment-absorption",
    "execution-challenge-mode-hard-warning",
    "execution-challenge-mode-missing-info-memory"
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
    score: termScore(terms, `${memory.category} ${memoryCategoryLabel(memory.category)} ${memory.content}`)
  }));
  const relevant = scored
    .filter((memory) => memory.score > 0)
    .sort((a, b) => b.score - a.score || String(b.updatedAt).localeCompare(String(a.updatedAt)));
  const anchors = scored
    .filter((memory) => ["preference", "goal", "constraint", "investment_rule", "personal_warning"].includes(memory.category) && !relevant.some((item) => item.id === memory.id))
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .slice(0, 2);
  return [...relevant, ...anchors].slice(0, limit);
}

function memoriesForPrompt(memories = []) {
  if (!memories.length) return "No approved long-term user memory is relevant.";
  return memories.map((memory) => `- ${memoryCategoryLabel(memory.category)}: ${memory.content}`).join("\n");
}

function memoryProfileForPrompt(profile = {}) {
  if (!profile?.approvedCount) return "No approved user memory profile is available.";
  return [
    `Investor type: ${profile.investorType}`,
    `Risk style: ${profile.riskStyle}`,
    `Preferred assets: ${profile.preferredAssets?.length ? profile.preferredAssets.join("; ") : "Not enough approved memory yet."}`,
    `Avoided risks: ${profile.avoidedRisks?.length ? profile.avoidedRisks.join("; ") : "Not enough approved memory yet."}`,
    `Cash-flow rule: ${profile.cashFlowRule}`,
    `Holding period: ${profile.holdingPeriod}`,
    `Personal warnings: ${profile.personalWarnings?.length ? profile.personalWarnings.join("; ") : "Not enough approved memory yet."}`
  ].map((line) => `- ${line}`).join("\n");
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

function buildDealLearningLoop(memories = [], journal = []) {
  const profile = buildInvestorMemoryProfile({ items: memories });
  const memorySignals = memories.slice(0, 4).map((memory) => ({
    type: "memory",
    id: memory.id,
    label: `Memory: ${memoryCategoryLabel(memory.category)}`,
    body: memory.content,
    action: memoryProfileImpact(memory)
  }));
  const journalSignals = journal.slice(0, 4).map((decision) => {
    const reviewed = Boolean(decision.outcome?.reviewedAt);
    const lesson = reviewed && decision.outcome.lesson ? decision.outcome.lesson : decision.prePurchase.counterThesis || decision.prePurchase.killCriterion || decision.prePurchase.thesis;
    return {
      type: "journal",
      id: decision.id,
      label: reviewed ? `Reviewed lesson: ${decision.subject}` : `Locked thesis: ${decision.subject}`,
      body: lesson,
      action: reviewed
        ? `Skill signal: ${journalSkillSignal(decision)}. Compare this deal against that lesson.`
        : "Outcome is not reviewed yet; treat this as a prior thesis, not proven skill."
    };
  });
  const signals = [...memorySignals, ...journalSignals].slice(0, 8);
  return {
    summary: signals.length
      ? `${memorySignals.length} approved memor${memorySignals.length === 1 ? "y" : "ies"} and ${journalSignals.length} decision-journal ${journalSignals.length === 1 ? "lesson" : "lessons"} matched this report.`
      : "No approved memory or locked decision-journal lesson matched this report.",
    memoryCount: memorySignals.length,
    journalCount: journalSignals.length,
    profile,
    signals
  };
}

function containsAnyText(values = [], patterns = []) {
  const text = Array.isArray(values) ? values.join(" ").toLowerCase() : String(values || "").toLowerCase();
  return patterns.some((pattern) => pattern.test(text));
}

function buildPersonalizedChallenge(analysis, learningLoop) {
  const profile = learningLoop?.profile || {};
  if (!profile.approvedCount) {
    return {
      status: "inactive",
      label: "No personal challenge",
      message: "",
      profileBasis: "",
      checks: []
    };
  }
  const hardStop = analysis.hardStops?.[0] || "";
  const blocker = analysis.recommendationBlockers?.[0] || "";
  const watchout = analysis.watchouts?.[0] || "";
  const missing = analysis.missingEvidence?.[0] || "";
  const usableCashFlowRule = profile.cashFlowRule && !/^not enough/i.test(profile.cashFlowRule) ? profile.cashFlowRule : "";
  const usableHoldingPeriod = profile.holdingPeriod && !/^not enough/i.test(profile.holdingPeriod) ? profile.holdingPeriod : "";
  const profileBasis = profile.personalWarnings?.[0]
    || profile.investmentRules?.[0]
    || profile.avoidedRisks?.[0]
    || profile.preferredAssets?.[0]
    || profile.lessons?.[0]
    || usableCashFlowRule
    || usableHoldingPeriod
    || "";
  const missingText = [blocker, watchout, missing, ...(analysis.missingEvidence || []), ...(analysis.recommendationBlockers || [])].join(" ");
  const preferredAssetMismatch = profile.preferredAssets?.length
    && !containsAnyText([JSON.stringify(analysis.context?.dealCard || {})], profile.preferredAssets.map((item) => new RegExp(item.split(/\s+/).slice(0, 3).map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "i")));
  const cashFlowSensitive = containsAnyText([usableCashFlowRule, ...(profile.investmentRules || []), ...(profile.personalWarnings || [])], [/cash.?flow/i, /rent/i, /installment/i, /instalment/i, /yield/i])
    && containsAnyText([missingText, analysis.counterThesis], [/rent/i, /rental/i, /installment/i, /instalment/i, /cash.?flow/i, /holding/i]);
  const managementSensitive = containsAnyText([profileBasis, ...(profile.avoidedRisks || []), ...(profile.lessons || [])], [/management/i, /jmb/i, /maintenance/i, /resident/i])
    && containsAnyText([missingText, JSON.stringify(analysis.context?.dealCard || {})], [/management/i, /site visit/i, /maintenance/i, /resident/i]);
  const supplySensitive = containsAnyText([profileBasis, ...(profile.marketBeliefs || []), ...(profile.personalWarnings || [])], [/supply/i, /competition/i, /newer/i])
    && containsAnyText([missingText, analysis.counterThesis], [/supply/i, /competition/i, /newer/i, /substitute/i]);
  const checks = [];
  if (profileBasis) {
    checks.push({
      label: "Profile memory",
      status: hardStop ? "hard" : "check",
      action: `Your approved memory says: ${profileBasis}`
    });
  }
  if (cashFlowSensitive) {
    checks.push({
      label: "Cash-flow consistency",
      status: blocker || hardStop ? "warning" : "check",
      action: "Do not rationalize the deal if rent, instalment, vacancy, or recurring charges conflict with your own holding rule."
    });
  }
  if (managementSensitive) {
    checks.push({
      label: "Management consistency",
      status: blocker || hardStop ? "warning" : "check",
      action: "You have made management quality part of your personal filter, so management evidence must be proven before confidence rises."
    });
  }
  if (supplySensitive) {
    checks.push({
      label: "Supply consistency",
      status: blocker || hardStop ? "warning" : "check",
      action: "Your profile is sensitive to supply risk; compare this unit against newer substitutes before treating the entry price as cheap."
    });
  }
  if (preferredAssetMismatch && profile.preferredAssets?.[0]) {
    checks.push({
      label: "Asset-fit consistency",
      status: "check",
      action: `This deal may not obviously match your remembered preference: ${profile.preferredAssets[0]}`
    });
  }
  if (!checks.length) {
    checks.push({
      label: "Profile consistency",
      status: "check",
      action: "Compare this deal against your approved memory profile before letting the current numbers dominate the decision."
    });
  }
  const status = hardStop
    ? "hard"
    : blocker || checks.some((item) => item.status === "warning")
      ? "challenge"
      : "reminder";
  const issue = hardStop || blocker || watchout || missing || analysis.counterThesis || "the current deal still needs proof";
  return {
    status,
    label: status === "hard" ? "Personal hard challenge" : status === "challenge" ? "Personalized challenge" : "Personal reminder",
    profileBasis: profileBasis || `${profile.investorType}; ${profile.riskStyle}`,
    message: `Your memory profile says ${profileBasis || `${profile.investorType} / ${profile.riskStyle}`}. Current issue: ${issue}. Before proceeding, explain why this deal does not violate your own rule, preference, or past lesson.`,
    checks: checks.slice(0, 6)
  };
}

function applyLearningLoopToAnalysis(analysis, learningLoop) {
  analysis.learningLoop = learningLoop;
  analysis.personalizedChallenge = buildPersonalizedChallenge(analysis, learningLoop);
  if (!learningLoop.signals.length) return analysis;
  const first = learningLoop.signals[0];
  const existing = analysis.nextActions || [];
  analysis.nextActions = uniqueText([
    ...(analysis.personalizedChallenge?.message ? [`Answer personalized challenge: ${analysis.personalizedChallenge.message}`] : []),
    `Check remembered lesson: ${first.body}`,
    ...existing
  ], 5);
  if (analysis.challengeMode?.message) {
    analysis.challengeMode = {
      ...analysis.challengeMode,
      message: `${analysis.challengeMode.message} Also compare this against your recorded learning: ${first.body}`
    };
  }
  return analysis;
}

function textTokenSet(value) {
  return new Set(String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 4 && !["with", "that", "this", "from", "have", "will", "need", "needs", "property", "project", "deal"].includes(word)));
}

function tokenOverlapScore(a, b) {
  const left = textTokenSet(a);
  const right = textTokenSet(b);
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  for (const token of left) {
    if (right.has(token)) overlap += 1;
  }
  return overlap / Math.min(left.size, right.size);
}

function analysisWeakSignalText(analysis = {}) {
  const weakDimensions = (analysis.dimensions || [])
    .filter((item) => item.status === "weak" || Number(item.score || 0) < 60)
    .map((item) => item.label);
  const weakStages = (analysis.stages || [])
    .filter((item) => item.status === "risk" || item.status === "incomplete" || Number(item.score || 0) < 60)
    .map((item) => `${item.name} ${item.summary}`);
  return [
    analysis.verdict,
    analysis.summary,
    analysis.counterThesis,
    ...(analysis.hardStops || []),
    ...(analysis.recommendationBlockers || []),
    ...(analysis.watchouts || []),
    ...(analysis.missingEvidence || []),
    ...weakDimensions,
    ...weakStages,
    JSON.stringify(analysis.context?.dealCard || {})
  ].join(" ");
}

function reportSimilarityScore(currentAnalysis = {}, savedReport = {}) {
  const savedAnalysis = savedReport.analysis || {};
  const currentDeal = currentAnalysis.context?.dealCard || {};
  const savedDeal = savedAnalysis.context?.dealCard || {};
  let score = tokenOverlapScore(
    `${currentDeal.projectName || ""} ${currentDeal.area || ""} ${currentDeal.propertyType || ""} ${currentDeal.nearbySupply || ""} ${currentDeal.substituteThreat || ""} ${currentDeal.futureSupplyTiming || ""} ${currentDeal.absorptionEvidence || ""}`,
    `${savedReport.subject || ""} ${savedDeal.projectName || ""} ${savedDeal.area || ""} ${savedDeal.propertyType || ""} ${savedDeal.nearbySupply || ""} ${savedDeal.substituteThreat || ""} ${savedDeal.futureSupplyTiming || ""} ${savedDeal.absorptionEvidence || ""}`
  ) * 45;
  score += tokenOverlapScore(analysisWeakSignalText(currentAnalysis), analysisWeakSignalText(savedAnalysis)) * 45;
  if (currentAnalysis.verdict && savedAnalysis.verdict && currentAnalysis.verdict === savedAnalysis.verdict) score += 10;
  return Math.round(Math.max(0, Math.min(100, score)));
}

function buildDealComparisonReason(currentAnalysis = {}, savedAnalysis = {}) {
  const currentText = analysisWeakSignalText(currentAnalysis).toLowerCase();
  const savedText = analysisWeakSignalText(savedAnalysis).toLowerCase();
  const reasons = [];
  const checks = [
    ["management", /management|jmb|resident|maintenance/],
    ["cash-flow", /cash.?flow|rent|rental|installment|instalment|yield/],
    ["supply", /supply|competition|newer|substitute|density/],
    ["saleability", /saleability|exit|buyer|resale|liquidity/],
    ["legal or financing", /legal|title|caveat|loan|valuation|financing/],
    ["site-visit", /site visit|vibe|guard|lobby|lift|corridor/]
  ];
  for (const [label, pattern] of checks) {
    if (pattern.test(currentText) && pattern.test(savedText)) reasons.push(label);
  }
  if (!reasons.length) return "Similar deal shape, score profile, or unresolved evidence pattern.";
  return `Similar ${reasons.slice(0, 3).join(", ")} pattern.`;
}

function buildDealMemoryComparison(analysis, user) {
  const reports = normalizeUserReports(user?.reports).items
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 30);
  if (!reports.length) {
    return {
      status: "none",
      summary: "No prior saved deal report is available for comparison.",
      matches: []
    };
  }
  const matches = reports
    .map((report) => {
      const similarity = reportSimilarityScore(analysis, report);
      return {
        id: report.id,
        subject: report.subject,
        verdict: report.analysis.verdict,
        savedAt: report.createdAt,
        similarity,
        reason: buildDealComparisonReason(analysis, report.analysis),
        action: report.analysis.verdict === "REJECT"
          ? "Re-check why the earlier deal was rejected before treating this one as different."
          : report.analysis.verdict === "PAUSE" || report.analysis.verdict === "INVESTIGATE"
            ? "Clear the same missing proof before confidence rises."
            : "Use the earlier shortlisted report as a benchmark, not automatic approval."
      };
    })
    .filter((item) => item.similarity >= 18)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);
  return {
    status: matches.length ? "matched" : "none",
    summary: matches.length
      ? `${matches.length} prior saved deal${matches.length === 1 ? "" : "s"} look comparable enough to challenge this report.`
      : "Prior saved reports exist, but none are close enough to influence this deal.",
    matches
  };
}

function beliefStatusForDeal(belief, analysis = {}) {
  const text = String(belief || "").toLowerCase();
  const issueText = analysisWeakSignalText(analysis).toLowerCase();
  if (analysis.hardStops?.length) return "challenged";
  if (/saleability|sell|exit|buyer|liquidity/.test(text)) {
    return /saleability|exit|buyer|liquidity|resale/.test(issueText) ? "uncertain" : "confirmed";
  }
  if (/management|jmb|resident|maintenance/.test(text)) {
    return /management|jmb|resident|maintenance|site visit/.test(issueText) ? "uncertain" : "confirmed";
  }
  if (/rent|rental|cash.?flow|installment|instalment|yield/.test(text)) {
    return /rent|rental|cash.?flow|installment|instalment|yield/.test(issueText) ? "uncertain" : "confirmed";
  }
  if (/supply|competition|newer|substitute/.test(text)) {
    return /supply|competition|newer|substitute/.test(issueText) ? "uncertain" : "confirmed";
  }
  return "uncertain";
}

function buildBeliefTracker(analysis, profile = {}) {
  const sourceBeliefs = uniqueText([
    ...(profile.marketBeliefs || []),
    ...(profile.investmentRules || []),
    ...(profile.lessons || []),
    ...((analysis.learningLoop?.signals || []).map((signal) => signal.body))
  ], 8);
  if (!sourceBeliefs.length) {
    return {
      status: "inactive",
      summary: "No approved belief or lesson is available yet. Apex will track beliefs only after the user approves memory.",
      beliefs: []
    };
  }
  const beliefs = sourceBeliefs.map((belief) => {
    const status = beliefStatusForDeal(belief, analysis);
    return {
      label: conciseText(belief, 150),
      status,
      basis: status === "confirmed"
        ? "The current report does not expose a direct contradiction, but live evidence is still required."
        : status === "challenged"
          ? "A hard stop or serious contradiction means this belief cannot support the current deal."
          : "The current report touches this belief, but proof is still thin or mixed.",
      action: status === "confirmed"
        ? "Keep the belief, but do not treat it as property-specific proof."
        : "Ask for transaction, rent, management, site, or supply evidence before using this belief in the decision."
    };
  });
  return {
    status: beliefs.some((item) => item.status === "challenged" || item.status === "uncertain") ? "review" : "tracking",
    summary: `${beliefs.length} approved belief${beliefs.length === 1 ? "" : "s"} or lesson${beliefs.length === 1 ? "" : "s"} checked against this deal.`,
    beliefs
  };
}

function buildMemoryConflicts(profile = {}) {
  const items = [
    profile.cashFlowRule,
    ...(profile.preferredAssets || []),
    ...(profile.avoidedRisks || []),
    ...(profile.personalWarnings || []),
    ...(profile.investmentRules || []),
    ...(profile.marketBeliefs || []),
    ...(profile.lessons || [])
  ].filter(Boolean);
  if (!items.length) {
    return {
      status: "inactive",
      summary: "No approved memory is available to prune or compare yet.",
      conflicts: []
    };
  }
  const joined = items.join(" ").toLowerCase();
  const conflicts = [];
  const addConflict = (label, leftPattern, rightPattern, action) => {
    const left = items.find((item) => leftPattern.test(String(item).toLowerCase()));
    const right = items.find((item) => rightPattern.test(String(item).toLowerCase()) && item !== left);
    if (left && right) {
      conflicts.push({
        label,
        status: "review",
        memoryA: left,
        memoryB: right,
        action
      });
    }
  };
  addConflict(
    "Cash-flow tolerance conflict",
    /must|always|cover|breakeven|installment|instalment/,
    /negative cash flow|shortfall|tolerate|landed appreciation/,
    "Clarify whether this is a hard rental-property rule or only an exception for landed appreciation plays."
  );
  addConflict(
    "Tenure preference conflict",
    /freehold.*must|must.*freehold|avoid leasehold|reject leasehold/,
    /leasehold.*acceptable|freehold.*does not matter|freehold.*not matter/,
    "Separate high-rise tenure tolerance from landed freehold requirements."
  );
  addConflict(
    "Site-visit confidence conflict",
    /site visit.*must|must.*site visit|vibe|trust your instinct/,
    /no site visit|cannot visit|virtual|new project/,
    "Keep site visit as compulsory for completed projects, and label new launches as evidence-incomplete."
  );
  if (/old|older/.test(joined) && /newer|new supply/.test(joined) && /still defend|acceptable/.test(joined)) {
    conflicts.push({
      label: "Older-project rule needs dating",
      status: "stale",
      memoryA: items.find((item) => /old|older/i.test(item)) || "",
      memoryB: items.find((item) => /newer|new supply|still defend/i.test(item)) || "",
      action: "Revalidate this belief when nearby VP supply changes the rent and resale comparison."
    });
  }
  return {
    status: conflicts.length ? "review" : "clear",
    summary: conflicts.length
      ? `${conflicts.length} approved memor${conflicts.length === 1 ? "y needs" : "ies need"} clarification before being treated as a hard rule.`
      : "No obvious conflict was detected in the approved memory used for this report.",
    conflicts: conflicts.slice(0, 6)
  };
}

function buildPersonalOperatingRules(analysis, profile = {}) {
  const issueText = analysisWeakSignalText(analysis).toLowerCase();
  const hasHardStop = Boolean(analysis.hardStops?.length);
  const rules = [
    {
      label: "Cash-flow floor",
      status: /rent|rental|cash.?flow|installment|instalment|yield|negative/.test(issueText) ? "warning" : "clear",
      basis: profile.cashFlowRule && !/^not enough/i.test(profile.cashFlowRule) ? profile.cashFlowRule : "Default Apex rule: prove holding power before treating a deal as investable.",
      action: "If this is a normal rental property, rent must support instalment and recurring charges before shortlist confidence rises."
    },
    {
      label: "Site-visit gate",
      status: /site visit|vibe|management|resident|guard|lobby|lift/.test(issueText) ? "warning" : "clear",
      basis: "Site feeling, management response, resident behaviour, and building condition cannot be fully proven by numbers.",
      action: "Do not move from investigate to strong recommendation until physical site evidence is recorded, except for new launches where uncertainty must remain visible."
    },
    {
      label: "Cheap is not enough",
      status: /cheap|discount|below market|poor|weak|management|quality|layout/.test(issueText) ? "warning" : "check",
      basis: "Apex should protect users from buying cheap property instead of valuable property.",
      action: "Treat price as only the transaction medium. Quality, exit buyer pool, management, layout, and supply defense must still pass."
    },
    {
      label: "Clean transaction boundary",
      status: hasHardStop || /marked.?up|bulk purchase|caveat|legal|title|loan rejection|unsafe/.test(issueText) ? "hard" : "clear",
      basis: "Apex does not validate serious legal, title, financing, or compliance shortcuts.",
      action: hasHardStop ? "Stop validation until the hard stop is removed or independently cleared." : "Keep legal, title, seller, banker, and lawyer checks explicit."
    }
  ];
  if (profile.approvedCount) {
    rules.push({
      label: "Respect approved personal memory",
      status: analysis.personalizedChallenge?.status === "hard" ? "hard" : analysis.personalizedChallenge?.status === "challenge" ? "warning" : "check",
      basis: `${profile.investorType || "Profile building"} / ${profile.riskStyle || "Needs more approved memory"}`,
      action: "If the current deal conflicts with approved personal memory, the user must explain why this is a justified exception."
    });
  }
  const status = rules.some((item) => item.status === "hard") ? "hard" : rules.some((item) => item.status === "warning") ? "warning" : rules.some((item) => item.status === "check") ? "check" : "clear";
  return {
    status,
    summary: status === "hard"
      ? "A personal operating rule blocks approval until cleared."
      : status === "warning"
        ? "Personal operating rules allow investigation, but they are not clean enough for blind confidence."
        : "Personal operating rules are not blocking this report.",
    rules
  };
}

function buildSourceTransparency({ mode = "framework", sources = [], analysis = {} } = {}) {
  const sourceList = [
    {
      type: "framework",
      label: "Apex framework",
      status: "used",
      detail: "The deterministic scorecard, blockers, stress tests, and operating rules were applied."
    },
    {
      type: "ai",
      label: "External reasoning model",
      status: mode === "llm" ? "used" : "not_used",
      detail: mode === "llm" ? "AI generated the commentary layer; framework rules still control the verdict." : "No external model generated this report."
    },
    {
      type: "memory",
      label: "Approved user memory",
      status: analysis.learningLoop?.memoryCount ? "used" : "not_used",
      detail: analysis.learningLoop?.memoryCount ? `${analysis.learningLoop.memoryCount} approved memor${analysis.learningLoop.memoryCount === 1 ? "y" : "ies"} influenced challenge mode.` : "No approved memory matched or memory reasoning was off."
    },
    {
      type: "journal",
      label: "Decision journal",
      status: analysis.learningLoop?.journalCount ? "used" : "not_used",
      detail: analysis.learningLoop?.journalCount ? `${analysis.learningLoop.journalCount} locked journal entr${analysis.learningLoop.journalCount === 1 ? "y" : "ies"} matched this report.` : "No locked journal lesson matched this report."
    },
    {
      type: "saved_deal",
      label: "Saved deal history",
      status: analysis.dealMemoryComparison?.matches?.length ? "used" : "not_used",
      detail: analysis.dealMemoryComparison?.matches?.length ? `${analysis.dealMemoryComparison.matches.length} prior saved deal${analysis.dealMemoryComparison.matches.length === 1 ? "" : "s"} compared.` : "No comparable saved deal was found."
    },
    {
      type: "market",
      label: "Owner market observations",
      status: analysis.marketIntelligence?.summary?.matched ? "used" : "not_used",
      detail: analysis.marketIntelligence?.summary?.matched ? `${analysis.marketIntelligence.summary.matched} dated owner observation${analysis.marketIntelligence.summary.matched === 1 ? "" : "s"} matched.` : "No dated owner market observation matched this report."
    },
    {
      type: "case",
      label: "Owner development cases",
      status: analysis.caseIntelligence?.matched ? "used" : "not_used",
      detail: analysis.caseIntelligence?.matched ? `${analysis.caseIntelligence.matched} founder case note${analysis.caseIntelligence.matched === 1 ? "" : "s"} matched.` : "No founder case note matched this report."
    }
  ];
  const used = sourceList.filter((source) => source.status === "used").map((source) => source.label);
  return {
    mode: mode === "llm" ? "Framework + AI" : "Framework only",
    summary: used.length ? `Used: ${used.join(", ")}.` : "Used framework rules only.",
    sources: sourceList
  };
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
  memoryProfile,
  journal,
  marketIntelligence = null,
  caseIntelligence = null,
  responsePersona = responsePersonaFromProfile(financialProfile),
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

RESPONSE PERSONA
${responsePersonaForPrompt(responsePersona)}

RELEVANT APEX ANALYTIC REFERENCES
${referencesForPrompt(references)}

RELEVANT RECORDED BELIEFS
${beliefsForPrompt(beliefs)}

RELEVANT PRIOR DECISIONS
${decisionContext}

APPROVED PRIVATE USER MEMORY
${memoriesForPrompt(memories)}

PRIVATE USER MEMORY PROFILE
${memoryProfileForPrompt(memoryProfile)}

LOCKED PRIVATE DECISION JOURNAL
${journalForPrompt(journal)}

OWNER-CONTROLLED MARKET INTELLIGENCE
${marketIntelligenceForPrompt(marketIntelligence)}

OWNER DEVELOPMENT CASE LIBRARY
${developmentCaseIntelligenceForPrompt(caseIntelligence)}

DETERMINISTIC FALLBACK ANALYSIS
${fallbackAnswer}

Respond to the current user message. Use the deterministic analysis as a safety floor, follow the response persona, and focus only on what matters most.`;
  return requestLlmText({ instructions: jarvisLlmInstructions, input, maxOutputTokens: 1200 });
}

async function generateDealLlmCommentary(analysis, dealCard, financialProfile, memories = []) {
  const memoryProfile = buildInvestorMemoryProfile({ items: memories });
  const input = `A deterministic seven-stage Apex Analytic engine produced this result:
${dealAnalysisText(analysis)}

Deal context:
${contextText(dealCard, dealContextLabels, "Deal card") || "Not supplied"}

Investor context:
${contextText(financialProfile, profileContextLabels, "Financial profile") || "Not supplied"}

Approved private user memory:
${memoriesForPrompt(memories)}

Private user memory profile:
${memoryProfileForPrompt(memoryProfile)}

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
  const caseIntelligence = selectDevelopmentCaseIntelligence(`${query} ${property ? JSON.stringify(property) : ""}`, knowledge, 4);

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
  if (caseIntelligence.cases.length) sections.push(`Relevant owner development cases:\n${developmentCaseIntelligenceForPrompt(caseIntelligence)}`);
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
      ...developmentCaseSources(caseIntelligence),
      ...marketSources(marketIntelligence),
      ...beliefHits.map(({ id, claim }) => ({ id, title: claim, type: "belief" })),
      ...decisionHits.map(({ id, subject }) => ({ id, title: subject, type: "decision" }))
    ]
  };
}

async function retrieveJarvisAnswer(query, brain, session, context = {}, knowledge = emptyKnowledge(), userMemories = [], userJournal = []) {
  const dealCard = cleanContextRecord(context.dealCard, dealContextLabels);
  const financialProfile = cleanContextRecord(context.financialProfile, profileContextLabels);
  const responseFeedback = reportText(context.responseFeedback, 700);
  if (responseFeedback) financialProfile.responseFeedback = responseFeedback;
  const responsePersona = responsePersonaFromProfile(financialProfile);
  const hasStructuredContext = hasContextData({ dealCard, financialProfile });
  const contextForSearch = [
    contextText(dealCard, dealContextLabels, "Deal card"),
    contextText(financialProfile, profileContextLabels, "Financial profile")
  ].filter(Boolean).join(" ");
  const relevantMemories = selectRelevantUserMemories(userMemories, `${query} ${contextForSearch}`);
  const relevantMemoryProfile = buildInvestorMemoryProfile({ items: relevantMemories });
  const relevantJournal = selectRelevantUserJournal(userJournal, `${query} ${contextForSearch}`);
  const companionIntent = detectCompanionIntent(query);
  if (companionIntent && (companionIntent !== "need_context" || !hasStructuredContext)) {
    const fallbackAnswer = companionAnswer(companionIntent, responsePersona);
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
          memoryProfile: relevantMemoryProfile,
          journal: [],
          responsePersona,
          fallbackAnswer
        });
        const contextCoach = buildContextCoach({ query, dealCard, financialProfile, responsePersona, sources: [] });
        return { answer: completion.text, sources: [], mode: "llm", provider: completion.provider, model: completion.model, retrievalMode: "none", contextCoach };
      } catch (error) {
        console.warn(`Apex Analytic LLM fallback: ${error.message}`);
      }
    }
    const contextCoach = buildContextCoach({ query, dealCard, financialProfile, responsePersona, sources: [] });
    return { answer: fallbackAnswer, sources: [], mode: "framework", retrievalMode: "none", contextCoach };
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
  const caseIntelligence = selectDevelopmentCaseIntelligence(`${recentSessionContext} ${query} ${contextForSearch}`, knowledge, 4);
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
  if (relevantMemoryProfile.approvedCount) {
    const basis = relevantMemoryProfile.personalWarnings?.[0]
      || relevantMemoryProfile.investmentRules?.[0]
      || relevantMemoryProfile.avoidedRisks?.[0]
      || relevantMemoryProfile.cashFlowRule
      || relevantMemoryProfile.preferredAssets?.[0];
    if (basis) challenge.unshift(`Personal challenge: you previously recorded "${basis}". Does this current view still obey that?`);
  }

  const ownerEvidenceLines = ownerEvidence.slice(0, 2).map((reference) => `${reference.title}: ${shortSentence(reference.content, 180)}`);
  const caseLines = caseIntelligence.cases.slice(0, 3).map((item) => `${item.projectName}: ${item.verdictLabel || caseVerdictLabel(item.verdict)} / ${item.confidence} confidence. ${shortSentence(item.summary || item.ownerVerdict, 180)}`);
  const marketLines = marketIntelligence.observations.slice(0, 3).map((observation) => observation.body);
  const memoryProfileLines = relevantMemoryProfile.approvedCount ? [
    `${relevantMemoryProfile.investorType}; ${relevantMemoryProfile.riskStyle}.`,
    relevantMemoryProfile.preferredAssets.length ? `Preferred: ${relevantMemoryProfile.preferredAssets.join("; ")}` : "",
    relevantMemoryProfile.avoidedRisks.length ? `Watch: ${relevantMemoryProfile.avoidedRisks.join("; ")}` : ""
  ].filter(Boolean) : [];
  const memoryLines = relevantMemories.map((memory) => memory.content);
  const journalLines = relevantJournal.map((decision) => {
    const lesson = decision.outcome.reviewedAt ? ` Lesson: ${decision.outcome.lesson}` : "";
    return `${decision.subject}: ${decision.prePurchase.decision}. ${decision.prePurchase.thesis}${lesson}`;
  });
  const sections = [
    verdict,
    bulletSection("Owner evidence", ownerEvidenceLines, 2),
    bulletSection("Owner case library", caseLines, 3),
    bulletSection("Market intelligence", marketLines, 3),
    marketIntelligence.observations.length ? bulletSection("Market freshness", [marketIntelligence.summary.warning], 1) : "",
    bulletSection("Deal read", dealRead, 3),
    bulletSection("Memory profile", memoryProfileLines, 3),
    bulletSection("Your memory", memoryLines, 3),
    bulletSection("Your decision journal", journalLines, 2),
    bulletSection("Why", reasoning, 3),
    bulletSection("Watch-outs", risks, 2),
    bulletSection("Profile fit", profileFit, 3),
    bulletSection("Check next", evidenceChecks, 3),
    bulletSection("My challenge back", challenge, 1)
  ].filter(Boolean);

  const fallbackAnswer = adaptFrameworkAnswerToPersona(sections.join("\n\n"), responsePersona, {
    verdict,
    reasoning,
    risks,
    evidenceChecks,
    challenge,
    ownerEvidenceLines,
    caseLines,
    marketLines,
    dealRead,
    profileFit,
    memoryProfileLines,
    memoryLines,
    journalLines
  });
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
      ...developmentCaseSources(caseIntelligence),
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
        memoryProfile: relevantMemoryProfile,
        journal: relevantJournal,
        marketIntelligence,
        caseIntelligence,
        responsePersona,
        fallbackAnswer
      });
      const contextCoach = buildContextCoach({ query, dealCard, financialProfile, responsePersona, sources });
      return { answer: completion.text, sources, mode: "llm", provider: completion.provider, model: completion.model, retrievalMode: evidenceResult.mode, contextCoach };
    } catch (error) {
      console.warn(`Apex Analytic LLM fallback: ${error.message}`);
    }
  }

  const contextCoach = buildContextCoach({ query, dealCard, financialProfile, responsePersona, sources });
  return { answer: fallbackAnswer, sources, mode: "framework", retrievalMode: evidenceResult.mode, contextCoach };
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
  res.writeHead(status, { ...SECURITY_HEADERS, ...headers });
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
    || (method === "POST" && pathname === "/api/memory/answer-style")
    || (method === "PATCH" && pathname === "/api/memory/settings")
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

function constantTimeEqual(a, b) {
  const left = Buffer.from(String(a ?? ""));
  const right = Buffer.from(String(b ?? ""));
  return left.length === right.length && timingSafeEqual(left, right);
}

function isOwnerRequest(req) {
  const tokenHeader = req.headers["x-estatelab-owner-token"];
  const token = Array.isArray(tokenHeader) ? tokenHeader[0] : tokenHeader;
  return Boolean(OWNER_TOKEN && token && constantTimeEqual(token, OWNER_TOKEN));
}

async function serveStatic(req, res) {
  const rawPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const safePath = rawPath === "/" ? "/index.html" : rawPath;
  const filePath = path.normalize(path.join(PUBLIC_DIR, safePath));
  if (filePath !== PUBLIC_DIR && !filePath.startsWith(PUBLIC_DIR + path.sep)) return send(res, 403, "Forbidden", { "Content-Type": "text/plain" });
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
        : "Owner API is disabled until the owner token is set on the server."
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
    return send(res, 200, {
      items,
      profile: buildInvestorMemoryProfile(actor.user.memory),
      settings: publicMemorySettings(actor.user.memory),
      summary: memorySummary(actor.user.memory)
    });
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
      category: normalizeMemoryCategory(body.category, content),
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
    return send(res, 201, {
      item: publicMemoryItem(item),
      profile: buildInvestorMemoryProfile(actor.user.memory),
      settings: publicMemorySettings(actor.user.memory),
      summary: memorySummary(actor.user.memory)
    });
  }

  if (req.method === "POST" && url.pathname === "/api/memory/answer-style") {
    if (!actor.user) return send(res, 401, { error: "Sign in to sync answer style." });
    const body = await readBody(req);
    actor.user.memory = normalizeUserMemory(actor.user.memory);
    const feedback = normalizeAnswerStyleFeedback(body);
    if (!feedback) return send(res, 400, { error: "Answer feedback must be useful, shorter, warmer, or evidence." });
    if (!actor.user.memory.settings.captureEnabled) {
      return send(res, 202, {
        stored: false,
        reason: "memory_capture_disabled",
        answerStyle: publicAnswerStyle(actor.user.memory.answerStyle),
        settings: publicMemorySettings(actor.user.memory)
      });
    }
    const existing = actor.user.memory.answerStyle.feedback.filter((item) => item.messageId !== feedback.messageId || !feedback.messageId);
    actor.user.memory.answerStyle = normalizeAnswerStyle({
      feedback: [feedback, ...existing],
      updatedAt: feedback.createdAt
    });
    await writeDb(db);
    return send(res, 200, {
      stored: true,
      answerStyle: publicAnswerStyle(actor.user.memory.answerStyle),
      settings: publicMemorySettings(actor.user.memory),
      summary: memorySummary(actor.user.memory)
    });
  }

  if (req.method === "PATCH" && url.pathname === "/api/memory/settings") {
    if (!actor.user) return send(res, 401, { error: "Sign in to configure long-term memory." });
    const body = await readBody(req);
    actor.user.memory = normalizeUserMemory(actor.user.memory);
    const nextSettings = {
      ...actor.user.memory.settings,
      ...(typeof body.captureEnabled === "boolean" ? { captureEnabled: body.captureEnabled } : {}),
      ...(typeof body.reasoningEnabled === "boolean" ? { reasoningEnabled: body.reasoningEnabled } : {}),
      updatedAt: new Date().toISOString()
    };
    actor.user.memory.settings = normalizeMemorySettings(nextSettings);
    await writeDb(db);
    return send(res, 200, {
      profile: buildInvestorMemoryProfile(actor.user.memory),
      settings: publicMemorySettings(actor.user.memory),
      summary: memorySummary(actor.user.memory)
    });
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
    return send(res, 200, {
      item: publicMemoryItem(item),
      profile: buildInvestorMemoryProfile(actor.user.memory),
      settings: publicMemorySettings(actor.user.memory),
      summary: memorySummary(actor.user.memory)
    });
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
        developmentCases: db.knowledge.developmentCases.length,
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
      ownerMarket: {
        enabled: Boolean(OWNER_TOKEN),
        trackedProjects: db.knowledge.projects.length,
        marketObservations: db.knowledge.observations.length,
        developmentCases: db.knowledge.developmentCases.length
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
    const learningQuery = `${subject} ${JSON.stringify(dealCard)} ${JSON.stringify(financialProfile)} ${analysis.counterThesis} ${analysis.challengeMode?.message || ""}`;
    const dealMemories = selectRelevantUserMemories(approvedUserMemories(actor.user), learningQuery);
    const dealJournal = selectRelevantUserJournal(lockedUserJournal(actor.user), learningQuery);
    applyLearningLoopToAnalysis(analysis, buildDealLearningLoop(dealMemories, dealJournal));
    analysis.dealMemoryComparison = buildDealMemoryComparison(analysis, actor.user);
    analysis.beliefTracker = buildBeliefTracker(analysis, analysis.learningLoop?.profile || {});
    analysis.memoryConflicts = buildMemoryConflicts(analysis.learningLoop?.profile || {});
    analysis.personalOperatingRules = buildPersonalOperatingRules(analysis, analysis.learningLoop?.profile || {});
    analysis.marketIntelligence = selectMarketIntelligence(`${subject} ${JSON.stringify(dealCard)}`, db.knowledge, 8);
    analysis.caseIntelligence = selectDevelopmentCaseIntelligence(`${subject} ${JSON.stringify(dealCard)}`, db.knowledge, 6);
    const marketStage = analysis.stages.find((stage) => stage.number === 6);
    if (marketStage && analysis.marketIntelligence.observations.length) {
      marketStage.summary = `${analysis.marketIntelligence.summary.matched} owner market observation${analysis.marketIntelligence.summary.matched === 1 ? " matches" : "s match"} this deal. ${analysis.marketIntelligence.summary.warning}`;
    }
    if (marketStage && analysis.caseIntelligence.matched) {
      marketStage.summary = `${analysis.caseIntelligence.matched} founder development case${analysis.caseIntelligence.matched === 1 ? " matches" : "s match"} this deal. ${analysis.caseIntelligence.summary}`;
    }
    analysis.developmentIntelligence = buildDevelopmentIntelligence(analysis);
    const documentEvidenceResult = await knowledgeService.retrieve(learningQuery, db.knowledge.chunks, 8);
    analysis.documentIntelligence = buildDocumentIntelligence(analysis, db.knowledge, documentEvidenceResult);
    analysis.portfolioCommand = buildPortfolioCommand(analysis);
    const sources = [
      ...documentEvidenceSources(analysis.documentIntelligence),
      ...developmentCaseSources(analysis.caseIntelligence),
      ...marketSources(analysis.marketIntelligence),
      ...dealMemories.map((memory) => ({
        id: memory.id,
        title: memory.content,
        type: "memory",
        preview: memory.category,
        score: memory.score
      })),
      ...dealJournal.map((decision) => ({
        id: decision.id,
        title: decision.subject,
        type: "journal",
        preview: conciseText(decision.outcome.lesson || decision.prePurchase.thesis, 160),
        score: decision.score
      })),
      ...(analysis.dealMemoryComparison?.matches || []).map((match) => ({
        id: match.id,
        title: match.subject,
        type: "saved_report",
        preview: match.reason,
        score: match.similarity
      })),
      ...await dealAnalysisSources()
    ].slice(0, 12);
    let mode = "framework";
    let completion = null;
    if (llmEnabled()) {
      try {
        completion = await generateDealLlmCommentary(analysis, dealCard, financialProfile, dealMemories);
        analysis.aiCommentary = completion.text;
        analysis.voiceSummary = analysis.aiCommentary;
        mode = "llm";
      } catch (error) {
        console.warn(`Deal analysis LLM fallback: ${error.message}`);
      }
    }
    analysis.reasoningMode = mode === "llm" ? "Framework + AI" : "Framework only";
    analysis.sourceTransparency = buildSourceTransparency({ mode, sources, analysis });
    analysis.finalCommand = buildFinalCommand(analysis);
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

  if (req.method === "GET" && url.pathname === "/api/owner/development-cases") {
    const query = String(url.searchParams.get("q") || "").trim().toLowerCase();
    const area = String(url.searchParams.get("area") || "").trim().toLowerCase();
    const verdict = String(url.searchParams.get("verdict") || "").trim().toLowerCase();
    const limit = Math.max(1, Math.min(500, Number(url.searchParams.get("limit") || 200)));
    const cases = db.knowledge.developmentCases
      .map((item) => {
        const project = item.projectId ? db.knowledge.projects.find((projectItem) => projectItem.id === item.projectId) : null;
        return { ...item, linkedProject: project ? { id: project.id, name: project.name, area: project.area } : null };
      })
      .filter((item) => !query || [
        item.projectName, item.area, item.state, item.propertyType, item.developer, item.priceSegment,
        item.targetBuyer, item.targetTenant, item.strengths, item.weaknesses, item.ownerVerdict, item.tags.join(" ")
      ].join(" ").toLowerCase().includes(query))
      .filter((item) => !area || `${item.area} ${item.linkedProject?.area || ""}`.toLowerCase().includes(area))
      .filter((item) => !verdict || item.verdict === verdict)
      .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
    const counts = cases.reduce((summary, item) => {
      summary[item.verdict] = (summary[item.verdict] || 0) + 1;
      return summary;
    }, {});
    return send(res, 200, {
      cases: cases.slice(0, limit),
      summary: {
        matched: cases.length,
        returned: Math.min(cases.length, limit),
        total: db.knowledge.developmentCases.length,
        coverage: developmentCaseCoverage(cases),
        ...counts
      }
    });
  }

  if (req.method === "POST" && url.pathname === "/api/owner/development-cases") {
    const item = developmentCaseFromInput(await readBody(req), db.knowledge);
    const duplicate = db.knowledge.developmentCases.find((existing) => existing.projectName.toLowerCase() === item.projectName.toLowerCase() && existing.area.toLowerCase() === item.area.toLowerCase());
    if (duplicate) return send(res, 409, { error: "A development case with this project and area already exists." });
    db.knowledge.developmentCases.push(item);
    db.knowledge = normalizeKnowledge(db.knowledge);
    await writeDb(db);
    return send(res, 201, { case: item });
  }

  if (req.method === "PATCH" && url.pathname.startsWith("/api/owner/development-cases/")) {
    const id = decodeURIComponent(url.pathname.split("/").pop());
    const index = db.knowledge.developmentCases.findIndex((item) => item.id === id);
    if (index === -1) return send(res, 404, { error: "Development case not found." });
    const item = developmentCaseFromInput(await readBody(req), db.knowledge, db.knowledge.developmentCases[index]);
    const duplicate = db.knowledge.developmentCases.find((existing) => existing.id !== id && existing.projectName.toLowerCase() === item.projectName.toLowerCase() && existing.area.toLowerCase() === item.area.toLowerCase());
    if (duplicate) return send(res, 409, { error: "A development case with this project and area already exists." });
    db.knowledge.developmentCases[index] = item;
    db.knowledge = normalizeKnowledge(db.knowledge);
    await writeDb(db);
    return send(res, 200, { case: item });
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/owner/development-cases/")) {
    const id = decodeURIComponent(url.pathname.split("/").pop());
    if (!db.knowledge.developmentCases.some((item) => item.id === id)) return send(res, 404, { error: "Development case not found." });
    db.knowledge.developmentCases = db.knowledge.developmentCases.filter((item) => item.id !== id);
    await writeDb(db);
    return send(res, 204, "");
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
      if (actor.user.memory.settings.captureEnabled) {
        memoryCandidate = proposeLongTermMemory(query, actor.user.memory, userMessage.id);
        if (memoryCandidate) {
          actor.user.memory.items.unshift(memoryCandidate);
          actor.user.memory = normalizeUserMemory(actor.user.memory);
        }
      }
    }

    const retrievalStartedAt = Date.now();
    const storedResponseFeedback = approvedAnswerStyleFeedback(actor.user);
    const result = await retrieveJarvisAnswer(query, db.brain, session, {
      dealCard: body.dealCard,
      financialProfile: body.financialProfile,
      responseFeedback: [body.responseFeedback, storedResponseFeedback].filter(Boolean).join(" ")
    }, db.knowledge, approvedUserMemories(actor.user), lockedUserJournal(actor.user));
    const jarvisMessage = {
      id: randomUUID(),
      role: "jarvis",
      content: result.answer,
      createdAt: new Date().toISOString(),
      mode: result.mode,
      provider: result.provider || "",
      model: result.model || "",
      sources: result.sources,
      contextCoach: result.contextCoach || null
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
