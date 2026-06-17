import http from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
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
      ? await readJson(BUNDLED_DB_PATH, { properties: [], comps: [], brain: emptyBrain(), jarvis: emptyJarvis() })
      : { properties: [], comps: [], brain: emptyBrain(), jarvis: emptyJarvis() };
    await writeFile(DB_PATH, JSON.stringify({
      properties: seed.properties || [],
      comps: seed.comps || [],
      brain: normalizeBrain(seed.brain),
      jarvis: emptyJarvis()
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
    jarvis: normalizeJarvis(db.jarvis)
  }, null, 2));
}

function emptyBrain() {
  return { answers: [], beliefs: [], decisions: [] };
}

function emptyJarvis() {
  return { sessions: [] };
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

function createJarvisSession(body = {}) {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    title: String(body.title || "New Jarvis Session").trim(),
    clientId: String(body.clientId || "browser").trim(),
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

async function retrieveJarvisAnswer(query, brain, session) {
  const companionIntent = detectCompanionIntent(query);
  if (companionIntent) {
    return {
      answer: companionAnswer(companionIntent),
      sources: []
    };
  }

  const corpus = await readJson(RAG_PATH, []);
  const recentSessionContext = Array.isArray(session?.messages)
    ? session.messages.slice(-6).map((message) => message.content).join(" ")
    : "";
  const queryTerms = tokenize(`${recentSessionContext} ${query}`);
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
  const hasYieldMention = /\b\d+(\.\d+)?\s*%/.test(query);

  let verdict = "My take: I would investigate further before deciding.";
  if (isBuyQuestion && isRentalQuestion && isSupplyQuestion) {
    verdict = "My take: not a yes yet. I would only shortlist it if the rent is real and the future supply risk is defendable.";
  } else if (isBuyQuestion && isRentalQuestion) {
    verdict = "My take: possible shortlist, but only if rent can cover the installment and recurring charges under a conservative case.";
  } else if (isBuyQuestion) {
    verdict = "My take: judge the property quality first, not whether it looks cheap.";
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
    bulletSection("Why", reasoning, 3),
    bulletSection("Watch-outs", risks, 2),
    bulletSection("Check next", evidenceChecks, 3),
    bulletSection("My challenge back", challenge, 1)
  ].filter(Boolean);

  return {
    answer: sections.join("\n\n"),
    sources: [
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
    ]
  };
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
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
    || (method === "GET" && pathname === "/api/jarvis/status")
    || (method === "POST" && pathname === "/api/jarvis/sessions")
    || (method === "GET" && pathname.startsWith("/api/jarvis/sessions/"))
    || (method === "DELETE" && pathname.startsWith("/api/jarvis/sessions/"))
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
  db.properties ||= [];
  db.comps ||= [];
  db.brain = normalizeBrain(db.brain);
  db.jarvis = normalizeJarvis(db.jarvis);

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
      boundary: "Public chats are stored as Jarvis sessions only. They do not update the owner knowledge base."
    });
  }

  if (req.method === "POST" && url.pathname === "/api/jarvis/sessions") {
    const body = await readBody(req);
    const session = createJarvisSession(body);
    db.jarvis = upsertJarvisSession(db.jarvis, session);
    await writeDb(db);
    return send(res, 201, { session: publicJarvisSession(session) });
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/jarvis/sessions/")) {
    const id = url.pathname.split("/").pop();
    const session = db.jarvis.sessions.find((item) => item.id === id);
    if (!session) return send(res, 404, { error: "Jarvis session not found." });
    return send(res, 200, { session: publicJarvisSession(session) });
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/jarvis/sessions/")) {
    const id = url.pathname.split("/").pop();
    db.jarvis.sessions = db.jarvis.sessions.filter((item) => item.id !== id);
    await writeDb(db);
    return send(res, 204, "");
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
    let session = db.jarvis.sessions.find((item) => item.id === String(body.sessionId || ""));
    if (!session) session = createJarvisSession({ clientId: body.clientId });
    if (!session.messages.length || session.title === "New Jarvis Session") session.title = titleFromQuery(query);

    const userMessage = {
      id: randomUUID(),
      role: "user",
      content: query,
      createdAt: new Date().toISOString(),
      sources: []
    };
    session.messages.push(userMessage);

    const result = await retrieveJarvisAnswer(query, db.brain, session);
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

export { handler, server };
