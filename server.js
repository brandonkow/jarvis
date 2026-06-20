import http from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUNDLED_DATA_DIR = path.join(__dirname, "data");
const DEFAULT_DATA_DIR = BUNDLED_DATA_DIR;
const DATA_DIR = path.resolve(globalThis.process?.env?.ESTATELAB_DATA_DIR || DEFAULT_DATA_DIR);
const DB_PATH = path.join(DATA_DIR, "db.json");
const BUNDLED_DB_PATH = path.join(BUNDLED_DATA_DIR, "db.json");
const RAG_PATH = path.resolve(globalThis.process?.env?.ESTATELAB_RAG_PATH || path.join(__dirname, "rag", "corpus.json"));
const PUBLIC_DIR = path.join(__dirname, "public");
const PORT = Number(globalThis.process?.env?.PORT || 3000);

const jsonHeaders = { "Content-Type": "application/json; charset=utf-8" };
const OWNER_TOKEN = String(globalThis.process?.env?.ESTATELAB_OWNER_TOKEN || "");
const OPENAI_API_KEY = String(globalThis.process?.env?.OPENAI_API_KEY || "").trim();
const OPENAI_MODEL = String(globalThis.process?.env?.OPENAI_MODEL || "gpt-4.1-mini").trim();
const OPENAI_TIMEOUT_MS = Math.max(5000, Number(globalThis.process?.env?.OPENAI_TIMEOUT_MS || 25000));
const AUTH_COOKIE = "estatelab_session";
const AUTH_SESSION_DAYS = Math.max(1, Number(globalThis.process?.env?.ESTATELAB_AUTH_SESSION_DAYS || 30));
const AUTH_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const AUTH_ATTEMPT_LIMIT = 10;
const MAX_JSON_BODY_BYTES = 1024 * 1024;
const scrypt = promisify(scryptCallback);
const authAttempts = new Map();
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

async function ensureDb() {
  await mkdir(DATA_DIR, { recursive: true });
  if (!existsSync(DB_PATH)) {
    const seed = DB_PATH !== BUNDLED_DB_PATH && existsSync(BUNDLED_DB_PATH)
      ? await readJson(BUNDLED_DB_PATH, { properties: [], comps: [], brain: emptyBrain(), jarvis: emptyJarvis(), auth: emptyAuth() })
      : { properties: [], comps: [], brain: emptyBrain(), jarvis: emptyJarvis(), auth: emptyAuth() };
    await writeFile(DB_PATH, JSON.stringify({
      properties: seed.properties || [],
      comps: seed.comps || [],
      brain: normalizeBrain(seed.brain),
      jarvis: emptyJarvis(),
      auth: emptyAuth()
    }, null, 2));
  }
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeDb(db) {
  await writeFile(DB_PATH, JSON.stringify({
    properties: db.properties || [],
    comps: db.comps || [],
    brain: normalizeBrain(db.brain),
    jarvis: normalizeJarvis(db.jarvis),
    auth: normalizeAuth(db.auth)
  }, null, 2));
}

function emptyBrain() {
  return { answers: [], beliefs: [], decisions: [] };
}

function emptyJarvis() {
  return { sessions: [] };
}

function emptyAuth() {
  return { version: 1, users: [], sessions: [] };
}

function normalizeAuth(auth) {
  const now = Date.now();
  return {
    version: 1,
    users: Array.isArray(auth?.users)
      ? auth.users.map((user) => ({
        id: String(user.id || ""),
        email: String(user.email || "").trim().toLowerCase(),
        displayName: String(user.displayName || "").trim(),
        passwordHash: String(user.passwordHash || ""),
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
      : []
  };
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
    title: String(session.title || "New Jarvis Session").trim(),
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
    sources: Array.isArray(message.sources) ? message.sources.slice(0, 8) : []
  };
}

function createJarvisSession(body = {}, user = null) {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    title: String(body.title || "New Jarvis Session").trim(),
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
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt
  };
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

function currentAuth(req, db) {
  const token = parseCookies(req)[AUTH_COOKIE];
  if (!token) return { user: null, session: null };
  const tokenHash = hashAuthToken(token);
  const session = db.auth.sessions.find((item) => item.tokenHash === tokenHash);
  if (!session) return { user: null, session: null };
  const user = db.auth.users.find((item) => item.id === session.userId);
  return user ? { user, session } : { user: null, session: null };
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

function titleFromQuery(query) {
  const clean = String(query || "").replace(/\s+/g, " ").trim();
  if (!clean) return "New Jarvis Session";
  return clean.length > 46 ? `${clean.slice(0, 43).trim()}...` : clean;
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
    return "Signal is good. Jarvis is awake.";
  }
  if (kind === "capability") {
    return "I can help you screen properties, challenge your assumptions, test rental and resale risk, and turn EstateLab's framework into a clearer decision. Start with any area, project, price, rent, or concern.";
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
    if (yieldPercent < 6) notes.push("That is below the founder's 6% rental-yield baseline, so holding power needs extra caution.");
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
  const discountToFairValue = price && fairValue ? ((fairValue - price) / fairValue) * 100 : null;
  const holdingCashFlow = rent && installment ? rent - installment - maintenance : null;
  const loanOnlyShortfall = rent && installment ? Math.max(0, installment - rent) : null;
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
  if (!dealCard.evidenceConfidence) missingEvidence.push("Source dates and confidence for the evidence packet");
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
    } else if (loanOnlyShortfall !== null && loanOnlyShortfall <= 300) {
      holdingScore -= 10;
      watchouts.push("The loan-only shortfall is within the founder tolerance, but true holding cost remains negative.");
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
  if (dealCard.evidenceConfidence === "High") marketScore += 20;
  else if (dealCard.evidenceConfidence === "Medium") marketScore += 10;
  else if (dealCard.evidenceConfidence === "Low") marketScore -= 15;
  marketScore = clampScore(marketScore);

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
      !supplyKnown || !dealCard.evidenceConfidence ? "incomplete" : marketScore >= 70 ? "pass" : marketScore < 45 ? "risk" : "watch",
      "This stage uses supplied evidence only; live market conditions still require verification."),
    stage(7, "Decision Journal", journalScore,
      !dealCard.investmentThesis || !dealCard.killCriterion ? "incomplete" : journalScore >= 70 ? "pass" : "watch",
      journalScore >= 70 ? "The thesis and walk-away condition are recorded." : "Record the thesis, exit logic, and kill criterion before committing.")
  ];

  const completedFields = [
    dealCard.area, dealCard.propertyType, price, fairValue, rent, installment,
    dealCard.ownStayAppeal, dealCard.managementQuality, dealCard.exitBuyerPool,
    dealCard.evidenceConfidence, income, reserveMonths, cashAvailable, currentDebt,
    financialProfile.existingProperties, dealCard.investmentThesis, dealCard.killCriterion
  ].filter((value) => value !== "" && value !== undefined && value !== null && value !== 0).length;
  const completeness = Math.round(completedFields / 17 * 100);
  const evidenceBase = dealCard.evidenceConfidence === "High" ? 78
    : dealCard.evidenceConfidence === "Medium" ? 62
      : dealCard.evidenceConfidence === "Low" ? 42 : 30;
  const confidence = Math.min(95, Math.round(evidenceBase + completeness * 0.17));
  const averageScore = Math.round(stages.reduce((sum, item) => sum + item.score, 0) / stages.length);
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
      discountToFairValue === null ? null : { label: "Discount to value", value: `${money(discountToFairValue)}%` },
      holdingCashFlow === null ? null : { label: "Monthly holding", value: formatRinggit(holdingCashFlow) },
      postDealDsr === null ? null : { label: "Post-deal DSR", value: `${money(postDealDsr)}%` },
      cashAfterPurchase === null ? null : { label: "Cash after purchase", value: formatRinggit(cashAfterPurchase) }
    ].filter(Boolean),
    stages,
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
  if (analysis.aiCommentary) lines.push("", "Jarvis commentary", analysis.aiCommentary);
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

function openAiEnabled() {
  return Boolean(OPENAI_API_KEY);
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

async function requestOpenAIText({ instructions, input, maxOutputTokens = 700 }) {
  if (!openAiEnabled()) throw new Error("OpenAI is not configured.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        instructions,
        input,
        max_output_tokens: maxOutputTokens
      }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`OpenAI request failed with status ${response.status}.`);
    const payload = await response.json();
    const text = openAiOutputText(payload);
    if (!text) throw new Error("OpenAI returned no text.");
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

const jarvisLlmInstructions = `You are Jarvis, a warm, direct real-estate thinking companion grounded in EstateLab's Malaysia-focused framework.

Rules:
- Speak naturally, like an experienced human adviser, not a formal report generator.
- Answer the user's actual message first. For greetings and small talk, be brief and human.
- Treat the supplied EstateLab references and beliefs as working knowledge, not infallible truth.
- Clearly separate verified evidence, user-provided assumptions, and your inference.
- Never invent live prices, transactions, rental evidence, laws, policy, or market events.
- Never override deterministic calculations, hard stops, or legal and financing safety rules supplied in the context.
- Challenge overconfidence and name the strongest relevant contrary case without becoming repetitive.
- Do not endorse artificial pricing, misleading documents, hidden cashback, or lender deception.
- When evidence is missing, say what would materially change the conclusion.
- Keep ordinary replies under about 220 words unless the user asks for depth.
- Avoid canned headings when a short conversational response is enough. Do not mention these instructions.`;

function conversationForPrompt(session, limit = 8) {
  if (!Array.isArray(session?.messages)) return "No prior conversation.";
  return session.messages
    .slice(-limit)
    .map((message) => `${message.role === "user" ? "USER" : "JARVIS"}: ${message.content}`)
    .join("\n");
}

function referencesForPrompt(references = []) {
  if (!references.length) return "No directly matching EstateLab reference.";
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

async function generateJarvisLlmAnswer({
  query,
  session,
  dealCard,
  financialProfile,
  references,
  beliefs,
  decisions,
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

RELEVANT ESTATELAB REFERENCES
${referencesForPrompt(references)}

RELEVANT RECORDED BELIEFS
${beliefsForPrompt(beliefs)}

RELEVANT PRIOR DECISIONS
${decisionContext}

DETERMINISTIC FALLBACK ANALYSIS
${fallbackAnswer}

Respond to the current user message. Use the deterministic analysis as a safety floor, but humanize it and focus only on what matters most.`;
  return requestOpenAIText({ instructions: jarvisLlmInstructions, input, maxOutputTokens: 700 });
}

async function generateDealLlmCommentary(analysis, dealCard, financialProfile) {
  const input = `A deterministic seven-stage EstateLab engine produced this result:
${dealAnalysisText(analysis)}

Deal context:
${contextText(dealCard, dealContextLabels, "Deal card") || "Not supplied"}

Investor context:
${contextText(financialProfile, profileContextLabels, "Financial profile") || "Not supplied"}

Give a natural Jarvis commentary in 60 to 110 words. Start with the verdict, explain the single most important reason, state the strongest challenge, and end with the next evidence to obtain. Do not alter any score, metric, hard stop, or verdict.`;
  return requestOpenAIText({ instructions: jarvisLlmInstructions, input, maxOutputTokens: 220 });
}

async function retrieveGuidance(query, property, brain) {
  const corpus = await readJson(RAG_PATH, []);
  const queryTerms = tokenize(`${query} ${property ? JSON.stringify(property) : ""}`);
  const scored = corpus
    .map((doc) => {
      return { ...doc, score: termScore(queryTerms, `${doc.title} ${doc.tags?.join(" ")} ${doc.body}`) };
    })
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

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
      ...beliefHits.map(({ id, claim }) => ({ id, title: claim, type: "belief" })),
      ...decisionHits.map(({ id, subject }) => ({ id, title: subject, type: "decision" }))
    ]
  };
}

async function retrieveJarvisAnswer(query, brain, session, context = {}) {
  const dealCard = cleanContextRecord(context.dealCard, dealContextLabels);
  const financialProfile = cleanContextRecord(context.financialProfile, profileContextLabels);
  const hasStructuredContext = hasContextData({ dealCard, financialProfile });
  const contextForSearch = [
    contextText(dealCard, dealContextLabels, "Deal card"),
    contextText(financialProfile, profileContextLabels, "Financial profile")
  ].filter(Boolean).join(" ");
  const companionIntent = detectCompanionIntent(query);
  if (companionIntent && (companionIntent !== "need_context" || !hasStructuredContext)) {
    const fallbackAnswer = companionAnswer(companionIntent);
    if (openAiEnabled()) {
      try {
        const answer = await generateJarvisLlmAnswer({
          query,
          session,
          dealCard,
          financialProfile,
          references: [],
          beliefs: [],
          decisions: [],
          fallbackAnswer
        });
        return { answer, sources: [], mode: "llm" };
      } catch (error) {
        console.warn(`Jarvis LLM fallback: ${error.message}`);
      }
    }
    return { answer: fallbackAnswer, sources: [], mode: "framework" };
  }

  const corpus = await readJson(RAG_PATH, []);
  const recentSessionContext = Array.isArray(session?.messages)
    ? session.messages.slice(-6).map((message) => message.content).join(" ")
    : "";
  const queryTerms = tokenize(`${recentSessionContext} ${query} ${contextForSearch}`);
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
    bulletSection("Deal read", dealRead, 3),
    bulletSection("Why", reasoning, 3),
    bulletSection("Watch-outs", risks, 2),
    bulletSection("Profile fit", profileFit, 3),
    bulletSection("Check next", evidenceChecks, 3),
    bulletSection("My challenge back", challenge, 1)
  ].filter(Boolean);

  const fallbackAnswer = sections.join("\n\n");
  const promptReferences = uniqueSources([
    ...topReferences,
    rentalReference,
    supplyReference,
    buyerPoolReference,
    evidenceReference
  ], 6);
  const sources = [
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
      }))
    ];

  if (openAiEnabled()) {
    try {
      const answer = await generateJarvisLlmAnswer({
        query,
        session,
        dealCard,
        financialProfile,
        references: promptReferences,
        beliefs: topBeliefs,
        decisions: topDecisions,
        fallbackAnswer
      });
      return { answer, sources, mode: "llm" };
    } catch (error) {
      console.warn(`Jarvis LLM fallback: ${error.message}`);
    }
  }

  return { answer: fallbackAnswer, sources, mode: "framework" };
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
    || (method === "GET" && pathname === "/api/jarvis/status")
    || (method === "GET" && pathname === "/api/jarvis/sessions")
    || (method === "POST" && pathname === "/api/jarvis/sessions")
    || (method === "GET" && pathname.startsWith("/api/jarvis/sessions/"))
    || (method === "DELETE" && pathname.startsWith("/api/jarvis/sessions/"))
    || (method === "POST" && pathname === "/api/jarvis/analyze-deal")
    || (method === "POST" && pathname === "/api/jarvis/query")
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

  if (req.method === "GET" && url.pathname === "/api/health") {
    return send(res, 200, {
      status: "ok",
      app: "estatelab-jarvis",
      time: new Date().toISOString()
    });
  }

  const db = await readJson(DB_PATH, { properties: [] });
  const requiresAuthMigration = Number(db.auth?.version || 0) < 1;
  db.properties ||= [];
  db.comps ||= [];
  db.brain = normalizeBrain(db.brain);
  db.jarvis = normalizeJarvis(db.jarvis);
  db.auth = normalizeAuth(db.auth);
  if (requiresAuthMigration) {
    db.jarvis = emptyJarvis();
    await writeDb(db);
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
      createdAt: new Date().toISOString()
    };
    const authSession = createAuthSession(user.id);
    db.auth.users.push(user);
    db.auth.sessions.unshift(authSession.record);
    await writeDb(db);
    clearAuthAttempts(req);
    return send(res, 201, {
      authenticated: true,
      user: publicUser(user)
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

  if (req.method === "GET" && url.pathname === "/api/jarvis/status") {
    const corpus = await readJson(RAG_PATH, []);
    return send(res, 200, {
      status: "online",
      mode: "public-jarvis",
      knowledge: {
        references: Array.isArray(corpus) ? corpus.length : 0,
        activeBeliefs: db.brain.beliefs.filter((belief) => belief.status !== "retired").length,
        decisions: db.brain.decisions.length
      },
      llm: {
        enabled: openAiEnabled(),
        provider: openAiEnabled() ? "openai" : null,
        model: openAiEnabled() ? OPENAI_MODEL : null
      },
      boundary: "Public chats are stored as Jarvis sessions only. They do not update the owner knowledge base."
    });
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
    if (!session) return send(res, 404, { error: "Jarvis session not found." });
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
    if (!session) return send(res, 404, { error: "Jarvis session not found." });
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

    const clientId = requestClientId(req, body);
    let session = accessibleJarvisSession(db, body.sessionId, actor, clientId);
    if (!session) session = createJarvisSession({ clientId }, actor.user);
    claimJarvisSession(session, actor, clientId);
    const subject = dealCard.projectName || dealCard.area || "property deal";
    if (!session.messages.length || session.title === "New Jarvis Session") session.title = `Deal analysis: ${subject}`;
    const analysis = analyzeSevenStageDeal(dealCard, financialProfile);
    const sources = await dealAnalysisSources();
    let mode = "framework";
    if (openAiEnabled()) {
      try {
        analysis.aiCommentary = await generateDealLlmCommentary(analysis, dealCard, financialProfile);
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
      content: `Run the seven-stage EstateLab analysis for ${subject}.`,
      createdAt: now,
      sources: []
    });
    const jarvisMessage = {
      id: randomUUID(),
      role: "jarvis",
      content: dealAnalysisText(analysis),
      createdAt: new Date().toISOString(),
      sources
    };
    session.messages.push(jarvisMessage);
    session.updatedAt = jarvisMessage.createdAt;
    session.messages = session.messages.slice(-80);
    db.jarvis = upsertJarvisSession(db.jarvis, session);
    await writeDb(db);
    return send(res, 200, {
      analysis,
      sources,
      mode,
      message: jarvisMessage,
      session: publicJarvisSession(session)
    });
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
    return send(res, 200, await retrieveGuidance(body.query, body.property, db.brain));
  }

  if (req.method === "POST" && url.pathname === "/api/jarvis/query") {
    const body = await readBody(req);
    const query = String(body.query || "").trim();
    if (!query) return send(res, 400, { error: "A Jarvis query is required." });
    const clientId = requestClientId(req, body);
    let session = accessibleJarvisSession(db, body.sessionId, actor, clientId);
    if (!session) session = createJarvisSession({ clientId }, actor.user);
    claimJarvisSession(session, actor, clientId);
    if (!session.messages.length || session.title === "New Jarvis Session") session.title = titleFromQuery(query);

    const userMessage = {
      id: randomUUID(),
      role: "user",
      content: query,
      createdAt: new Date().toISOString(),
      sources: []
    };
    session.messages.push(userMessage);

    const result = await retrieveJarvisAnswer(query, db.brain, session, {
      dealCard: body.dealCard,
      financialProfile: body.financialProfile
    });
    const jarvisMessage = {
      id: randomUUID(),
      role: "jarvis",
      content: result.answer,
      createdAt: new Date().toISOString(),
      sources: result.sources
    };
    session.messages.push(jarvisMessage);
    session.updatedAt = jarvisMessage.createdAt;
    session.messages = session.messages.slice(-80);
    db.jarvis = upsertJarvisSession(db.jarvis, session);
    await writeDb(db);
    return send(res, 200, {
      ...result,
      message: jarvisMessage,
      session: publicJarvisSession(session)
    });
  }

  send(res, 404, { error: "Route not found" });
}

let readyPromise;

function ready() {
  readyPromise ||= ensureDb();
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

  server.listen(PORT, () => {
    console.log(`Real estate investment tool running at http://localhost:${PORT}`);
  });
}

export {
  analyzeSevenStageDeal,
  dealAnalysisText,
  handler,
  requestOpenAIText,
  retrieveJarvisAnswer,
  server
};
