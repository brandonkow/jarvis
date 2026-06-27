const jarvisOrb = document.querySelector("#jarvisOrb");
const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const transcript = document.querySelector("#transcript");
const assistantPrompt = document.querySelector("#assistantPrompt");
const systemStatus = document.querySelector("#systemStatus");
const sessionStatus = document.querySelector("#sessionStatus");
const soundToggle = document.querySelector("#soundToggle");
const stopVoiceBtn = document.querySelector("#stopVoiceBtn");
const resetChatBtn = document.querySelector("#resetChatBtn");
const analyzeDealBtn = document.querySelector("#analyzeDealBtn");
const aiDisclosure = document.querySelector("#aiDisclosure");
const accountToggle = document.querySelector("#accountToggle");
const accountLabel = document.querySelector("#accountLabel");
const authPanel = document.querySelector("#authPanel");
const authClose = document.querySelector("#authClose");
const authTitle = document.querySelector("#authTitle");
const authForm = document.querySelector("#authForm");
const authNameField = document.querySelector("#authNameField");
const authName = document.querySelector("#authName");
const authEmail = document.querySelector("#authEmail");
const authPassword = document.querySelector("#authPassword");
const authSubmit = document.querySelector("#authSubmit");
const authModeToggle = document.querySelector("#authModeToggle");
const authRecoveryToggle = document.querySelector("#authRecoveryToggle");
const authMessage = document.querySelector("#authMessage");
const authRecovery = document.querySelector("#authRecovery");
const recoveryEmail = document.querySelector("#recoveryEmail");
const recoveryRequest = document.querySelector("#recoveryRequest");
const recoveryToken = document.querySelector("#recoveryToken");
const recoveryPassword = document.querySelector("#recoveryPassword");
const recoverySubmit = document.querySelector("#recoverySubmit");
const recoveryCancel = document.querySelector("#recoveryCancel");
const recoveryMessage = document.querySelector("#recoveryMessage");
const authUserPanel = document.querySelector("#authUser");
const authUserName = document.querySelector("#authUserName");
const authUserEmail = document.querySelector("#authUserEmail");
const authVerificationState = document.querySelector("#authVerificationState");
const verificationToken = document.querySelector("#verificationToken");
const verificationRequest = document.querySelector("#verificationRequest");
const verificationSubmit = document.querySelector("#verificationSubmit");
const logoutButton = document.querySelector("#logoutButton");
const memoryToggle = document.querySelector("#memoryToggle");
const memoryPanel = document.querySelector("#memoryPanel");
const memoryClose = document.querySelector("#memoryClose");
const memoryForm = document.querySelector("#memoryForm");
const memoryInput = document.querySelector("#memoryInput");
const memoryList = document.querySelector("#memoryList");
const memoryApprovedCount = document.querySelector("#memoryApprovedCount");
const memoryPendingCount = document.querySelector("#memoryPendingCount");
const billingSummary = document.querySelector("#billingSummary");
const billingPlanName = document.querySelector("#billingPlanName");
const billingUsage = document.querySelector("#billingUsage");
const billingActions = document.querySelector("#billingActions");
const reportsToggle = document.querySelector("#reportsToggle");
const reportsPanel = document.querySelector("#reportsPanel");
const reportsClose = document.querySelector("#reportsClose");
const reportsSavedCount = document.querySelector("#reportsSavedCount");
const reportsUsageLabel = document.querySelector("#reportsUsageLabel");
const reportsList = document.querySelector("#reportsList");
const journalToggle = document.querySelector("#journalToggle");
const journalPanel = document.querySelector("#journalPanel");
const journalClose = document.querySelector("#journalClose");
const journalSummary = document.querySelector("#journalSummary");
const journalTotalCount = document.querySelector("#journalTotalCount");
const journalReviewedCount = document.querySelector("#journalReviewedCount");
const journalList = document.querySelector("#journalList");
const journalEditor = document.querySelector("#journalEditor");
const journalBack = document.querySelector("#journalBack");
const journalDecisionId = document.querySelector("#journalDecisionId");
const journalSubject = document.querySelector("#journalSubject");
const journalDecision = document.querySelector("#journalDecision");
const journalConfidence = document.querySelector("#journalConfidence");
const journalHoldingPeriod = document.querySelector("#journalHoldingPeriod");
const journalThesis = document.querySelector("#journalThesis");
const journalCounterThesis = document.querySelector("#journalCounterThesis");
const journalKillCriterion = document.querySelector("#journalKillCriterion");
const journalNotes = document.querySelector("#journalNotes");
const journalDraftActions = document.querySelector("#journalDraftActions");
const journalSaveDraft = document.querySelector("#journalSaveDraft");
const journalLock = document.querySelector("#journalLock");
const journalDelete = document.querySelector("#journalDelete");
const journalLockNotice = document.querySelector("#journalLockNotice");
const journalOutcome = document.querySelector("#journalOutcome");
const journalOutcomeStatus = document.querySelector("#journalOutcomeStatus");
const journalActualRent = document.querySelector("#journalActualRent");
const journalCurrentValue = document.querySelector("#journalCurrentValue");
const journalProcessScore = document.querySelector("#journalProcessScore");
const journalExecutionScore = document.querySelector("#journalExecutionScore");
const journalOutcomeScore = document.querySelector("#journalOutcomeScore");
const journalLuckScore = document.querySelector("#journalLuckScore");
const journalResult = document.querySelector("#journalResult");
const journalLesson = document.querySelector("#journalLesson");
const journalSaveReview = document.querySelector("#journalSaveReview");
const journalMessage = document.querySelector("#journalMessage");
const shortlistToggle = document.querySelector("#shortlistToggle");
const shortlistPanel = document.querySelector("#shortlistPanel");
const shortlistClose = document.querySelector("#shortlistClose");
const shortlistSummary = document.querySelector("#shortlistSummary");
const shortlistList = document.querySelector("#shortlistList");
const shortlistClear = document.querySelector("#shortlistClear");
const dealFields = Array.from(document.querySelectorAll("[data-deal-field]"));
const profileFields = Array.from(document.querySelectorAll("[data-profile-field]"));
const contextToggles = Array.from(document.querySelectorAll("[data-context-toggle]"));
const contextResetButtons = Array.from(document.querySelectorAll("[data-context-reset]"));

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
const sessionKey = "estatelab.jarvis.sessionId";
const clientKey = "estatelab.jarvis.clientId";
const dealContextKey = "estatelab.jarvis.dealCard";
const profileContextKey = "estatelab.jarvis.financialProfile";
const contextPanelKey = "estatelab.jarvis.contextPanels";
const shortlistKey = "apex.shortlist.v1";
const analysisRegistry = new Map();
let voiceResponsesEnabled = true;
let listening = false;
let speaking = false;
let voiceStopRequested = false;
let voiceRequestId = 0;
let sessionId = window.localStorage.getItem(sessionKey);
let authMode = "login";
let authenticatedUser = null;
let serverSttEnabled = false;
let serverTtsEnabled = false;
let emailDeliveryEnabled = false;
let emailVerificationRequired = false;
let mediaRecorder = null;
let mediaStream = null;
let recordedAudio = [];
let activeServerAudio = null;
let activeAudioUrl = "";
let printTarget = null;
let billingState = null;
let billingPlans = [];

function clientId() {
  const existing = window.localStorage.getItem(clientKey);
  if (existing) return existing;
  const next = crypto.randomUUID();
  window.localStorage.setItem(clientKey, next);
  return next;
}

function brandVisibleText(value) {
  return String(value ?? "")
    .replace(/EstateLab/gi, "Apex Analytic")
    .replace(/Jarvis/gi, "Apex");
}

function escapeHtml(value) {
  return brandVisibleText(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

function setSystemState(state, prompt) {
  const compactState = {
    "System ready": "Ready",
    "Connection issue": "Offline",
    "Voice interrupted": "Voice issue",
    "Resetting": "Starting"
  }[state] || state;
  systemStatus.innerHTML = `<i></i> ${escapeHtml(compactState).toUpperCase()}`;
  assistantPrompt.textContent = prompt;
}

function setSessionState(text) {
  sessionStatus.textContent = text;
}

function setAuthMode(mode) {
  authMode = mode === "register" ? "register" : "login";
  const registering = authMode === "register";
  authTitle.textContent = registering ? "CREATE ACCOUNT" : "SIGN IN";
  authNameField.hidden = !registering;
  authName.required = registering;
  authPassword.autocomplete = registering ? "new-password" : "current-password";
  authSubmit.textContent = registering ? "CREATE ACCOUNT" : "SIGN IN";
  authModeToggle.textContent = registering ? "SIGN IN" : "CREATE ACCOUNT";
  authRecoveryToggle.hidden = registering || !emailDeliveryEnabled;
  authMessage.textContent = "";
}

function showAuthRecovery(show) {
  authRecovery.hidden = !show;
  authForm.hidden = show || Boolean(authenticatedUser);
  authTitle.textContent = show ? "RESET PASSWORD" : authMode === "register" ? "CREATE ACCOUNT" : "SIGN IN";
  recoveryMessage.textContent = "";
  if (show) {
    recoveryEmail.value = authEmail.value.trim();
    recoveryEmail.focus();
  }
}

function renderAuthState(user) {
  authenticatedUser = user || null;
  const signedIn = Boolean(authenticatedUser);
  const firstName = String(authenticatedUser?.displayName || "GUEST").trim().split(/\s+/)[0];
  accountLabel.textContent = firstName.slice(0, 16).toUpperCase();
  authForm.hidden = signedIn;
  authRecovery.hidden = true;
  authUserPanel.hidden = !signedIn;
  memoryToggle.hidden = !signedIn;
  reportsToggle.hidden = !signedIn;
  journalToggle.hidden = !signedIn;
  billingSummary.hidden = !signedIn;
  authTitle.textContent = signedIn ? "ACCOUNT" : authMode === "register" ? "CREATE ACCOUNT" : "SIGN IN";
  if (!signedIn) {
    closeMemoryPanel();
    closeReportsPanel();
    closeJournalPanel();
    billingState = null;
  }
  if (signedIn) {
    authUserName.textContent = authenticatedUser.displayName;
    authUserEmail.textContent = authenticatedUser.email;
    const canVerify = emailDeliveryEnabled || emailVerificationRequired;
    authVerificationState.textContent = authenticatedUser.emailVerified ? "VERIFIED" : canVerify ? "UNVERIFIED" : "VERIFICATION OPTIONAL";
    authVerificationState.classList.toggle("verified", Boolean(authenticatedUser.emailVerified));
    verificationToken.hidden = Boolean(authenticatedUser.emailVerified) || !emailDeliveryEnabled;
    verificationRequest.hidden = Boolean(authenticatedUser.emailVerified) || !emailDeliveryEnabled;
    verificationSubmit.hidden = Boolean(authenticatedUser.emailVerified) || !emailDeliveryEnabled;
    void loadBillingStatus();
  }
}

function openAuthPanel() {
  closeMemoryPanel();
  closeReportsPanel();
  closeJournalPanel();
  closeShortlistPanel();
  collapseContextPanels();
  authPanel.hidden = false;
  accountToggle.setAttribute("aria-expanded", "true");
  document.body.classList.add("accountOpen");
  renderAuthState(authenticatedUser);
  if (!authenticatedUser) authEmail.focus();
}

function closeAuthPanel() {
  authPanel.hidden = true;
  accountToggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("accountOpen");
  authMessage.textContent = "";
}

function sourceLabel(type) {
  if (type === "memory") return "MEMORY";
  if (type === "journal") return "JOURNAL";
  if (type === "market") return "MARKET";
  if (type === "belief") return "BELIEF";
  if (type === "decision") return "DECISION";
  if (type === "evidence") return "EVIDENCE";
  return "REFERENCE";
}

function sourceName(source) {
  if (source?.type === "memory") return "your approved memory";
  if (source?.type === "journal") return "your decision journal";
  if (source?.type === "market") return "dated market observation";
  if (source?.type === "evidence") return "owner evidence";
  const title = String(source?.title || "").toLowerCase();
  if (title.includes("rental") || title.includes("installment") || title.includes("tenant")) return "rental rule";
  if (title.includes("future supply") || title.includes("substitute") || title.includes("competition")) return "supply rule";
  if (title.includes("buyer") || title.includes("own-stay") || title.includes("exit")) return "buyer-pool rule";
  if (title.includes("transaction") || title.includes("auction") || title.includes("evidence")) return "evidence rule";
  if (title.includes("density") || title.includes("lift")) return "density rule";
  if (title.includes("financing") || title.includes("loan")) return "financing rule";
  return sourceLabel(source?.type).toLowerCase();
}

function sourceConfidence(sources = []) {
  const marketSources = sources.filter((source) => source.type === "market");
  if (marketSources.some((source) => source.freshness === "stale")) return "Medium - includes owner observations that need refreshing";
  if (marketSources.some((source) => source.freshness === "fresh")) return "Medium-high - dated owner evidence matched, still verify the deal";
  const hasBelief = sources.some((source) => source.type === "belief");
  if (sources.length >= 4 || hasBelief) return "Medium - framework-backed, still needs live market proof";
  if (sources.length >= 2) return "Low-medium - useful framework match, evidence still thin";
  return "Low - ask with more deal details";
}

function missingEvidence(sources = []) {
  const text = sources.map((source) => `${source.title} ${source.preview || ""}`.toLowerCase()).join(" ");
  const missing = [];
  if (text.includes("rental") || text.includes("tenant") || text.includes("installment")) missing.push("actual signed rent");
  if (text.includes("supply") || text.includes("competition") || text.includes("substitute")) missing.push("nearby supply comparison");
  if (text.includes("transaction") || text.includes("auction") || text.includes("evidence")) missing.push("recent transaction proof");
  if (!missing.length) missing.push("property-specific evidence");
  return missing.slice(0, 3).join(", ");
}

function sourcesMarkup(sources = []) {
  if (!sources.length) return "";
  const basedOn = [...new Set(sources.map(sourceName))].slice(0, 4).join(", ");
  return `
    <div class="sourceSummary">
      <p><b>Based on</b><span>${escapeHtml(basedOn)}</span></p>
      <p><b>Confidence</b><span>${escapeHtml(sourceConfidence(sources))}</span></p>
      <p><b>Missing</b><span>${escapeHtml(missingEvidence(sources))}</span></p>
    </div>
  `;
}

function intelligenceMarkup({ mode = "", provider = "", model = "" } = {}) {
  if (mode === "framework") {
    return '<span class="intelligenceBadge framework" title="No external reasoning model generated this response"><i></i>FRAMEWORK ONLY</span>';
  }
  if (mode !== "llm") return "";
  return '<span class="intelligenceBadge reasoning" title="External AI reasoning was used for this response"><i></i>FRAMEWORK + AI</span>';
}

function addMessage(role, text, sources = [], intelligence = {}) {
  document.body.classList.add("conversationActive");
  const message = document.createElement("article");
  message.className = `message ${role}`;
  message.innerHTML = `
    <strong>${role === "jarvis" ? "APEX" : "YOU"}</strong>
    ${role === "jarvis" ? intelligenceMarkup(intelligence) : ""}
    <div class="messageText">${escapeHtml(text).replace(/\n/g, "<br>")}</div>
    ${role === "jarvis" ? sourcesMarkup(sources) : ""}
  `;
  transcript.append(message);
  transcript.scrollTop = transcript.scrollHeight;
}

function memoryItemMarkup(item) {
  const pending = item.status === "pending";
  return `
    <article class="memoryItem ${pending ? "pending" : "approved"}" data-memory-item="${escapeHtml(item.id)}">
      <span><small>${escapeHtml(item.category)}</small><i>${pending ? "REVIEW" : "APPROVED"}</i></span>
      <p>${escapeHtml(item.content)}</p>
      <div class="memoryActions">
        ${pending ? `
          <button type="button" data-memory-action="approve" data-memory-id="${escapeHtml(item.id)}">KEEP</button>
          <button type="button" data-memory-action="dismiss" data-memory-id="${escapeHtml(item.id)}">SKIP</button>
        ` : `<button type="button" data-memory-action="delete" data-memory-id="${escapeHtml(item.id)}">FORGET</button>`}
      </div>
    </article>
  `;
}

function renderMemory(payload = {}) {
  const items = Array.isArray(payload.items) ? payload.items : [];
  memoryApprovedCount.textContent = String(payload.summary?.approved || 0);
  memoryPendingCount.textContent = String(payload.summary?.pending || 0);
  memoryList.innerHTML = items.length
    ? items.slice().sort((a, b) => {
      const statusOrder = { pending: 0, approved: 1 };
      return statusOrder[a.status] - statusOrder[b.status]
        || String(b.updatedAt).localeCompare(String(a.updatedAt));
    }).map(memoryItemMarkup).join("")
    : '<p class="memoryEmpty">No long-term memories yet. Tell Apex “Remember that...” or add one above.</p>';
}

async function loadMemory() {
  const payload = await requestJson("/api/memory");
  renderMemory(payload);
  return payload;
}

function closeMemoryPanel() {
  memoryPanel.hidden = true;
  memoryToggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("memoryOpen");
}

async function openMemoryPanel() {
  if (!authenticatedUser) return openAuthPanel();
  closeAuthPanel();
  closeReportsPanel();
  closeJournalPanel();
  closeShortlistPanel();
  collapseContextPanels();
  memoryPanel.hidden = false;
  memoryToggle.setAttribute("aria-expanded", "true");
  document.body.classList.add("memoryOpen");
  memoryList.innerHTML = '<p class="memoryEmpty">Loading private memory...</p>';
  try {
    await loadMemory();
  } catch (error) {
    memoryList.innerHTML = `<p class="memoryEmpty">${escapeHtml(error.message)}</p>`;
  }
}

async function reviewMemory(id, action) {
  if (action === "delete") {
    await requestJson(`/api/memory/${encodeURIComponent(id)}`, { method: "DELETE" });
    return null;
  }
  return requestJson(`/api/memory/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action })
  });
}

async function handleMemoryAction(button) {
  const id = button.getAttribute("data-memory-id");
  const action = button.getAttribute("data-memory-action");
  if (!id || !action) return;
  button.disabled = true;
  try {
    await reviewMemory(id, action);
    document.querySelectorAll(`[data-memory-item="${CSS.escape(id)}"]`).forEach((item) => item.remove());
    if (!memoryPanel.hidden) await loadMemory();
    setSystemState("System ready", action === "approve" ? "Memory approved." : action === "delete" ? "Memory forgotten." : "Memory skipped.");
  } catch (error) {
    setSystemState("Connection issue", error.message || "Memory could not be updated.");
    button.disabled = false;
  }
}

function addMemorySuggestion(item) {
  if (!item?.id) return;
  const suggestion = document.createElement("article");
  suggestion.className = "memorySuggestion";
  suggestion.setAttribute("data-memory-item", item.id);
  suggestion.innerHTML = `
    <span><small>LONG-TERM MEMORY</small><b>Remember this?</b></span>
    <p>${escapeHtml(item.content)}</p>
    <div class="memoryActions">
      <button type="button" data-memory-action="approve" data-memory-id="${escapeHtml(item.id)}">KEEP</button>
      <button type="button" data-memory-action="dismiss" data-memory-id="${escapeHtml(item.id)}">SKIP</button>
    </div>
  `;
  transcript.append(suggestion);
  transcript.scrollTop = transcript.scrollHeight;
}

function renderBillingStatus(status) {
  if (!status) return;
  billingState = status;
  billingPlanName.textContent = status.plan.name.toUpperCase();
  billingUsage.textContent = `${status.usage.remaining} reports remaining this month`;
  const upgradePlans = billingPlans.filter((plan) => plan.id !== "free" && plan.id !== status.plan.id);
  const available = upgradePlans.filter((plan) => plan.checkoutAvailable);
  billingActions.innerHTML = available.length
    ? available.map((plan) => `<button type="button" data-checkout-plan="${escapeHtml(plan.id)}">${escapeHtml(plan.name.toUpperCase())} / RM${escapeHtml(plan.priceRm)}</button>`).join("")
    : '<small>UPGRADES READY AFTER CHECKOUT CONFIGURATION</small>';
  reportsUsageLabel.textContent = `${status.plan.name.toUpperCase()} / ${status.usage.remaining} LEFT`;
}

async function loadBillingStatus() {
  if (!authenticatedUser) return null;
  try {
    const [plansResult, status] = await Promise.all([
      requestJson("/api/billing/plans"),
      requestJson("/api/billing/status")
    ]);
    billingPlans = plansResult.plans || [];
    renderBillingStatus(status);
    return status;
  } catch {
    billingActions.innerHTML = '<small>PLAN STATUS UNAVAILABLE</small>';
    return null;
  }
}

async function startCheckout(plan) {
  const button = billingActions.querySelector(`[data-checkout-plan="${CSS.escape(plan)}"]`);
  if (button) button.disabled = true;
  try {
    const result = await requestJson("/api/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ plan })
    });
    window.location.assign(result.checkoutUrl);
  } catch (error) {
    setSystemState("Connection issue", error.message || "Checkout is not available yet.");
    if (button) button.disabled = false;
  }
}

function reportHistoryItemMarkup(report) {
  const weakest = report.weakestDimension;
  const date = new Intl.DateTimeFormat("en-MY", { dateStyle: "medium" }).format(new Date(report.createdAt));
  return `
    <article class="reportHistoryItem" data-report-item="${escapeHtml(report.id)}">
      <header><span><small>${escapeHtml(report.verdict)} / ${escapeHtml(date)}</small><b>${escapeHtml(report.subject)}</b></span><em>${escapeHtml(report.averageScore)}/100</em></header>
      <p>${weakest ? `Weak link: ${escapeHtml(weakest.label)} (${escapeHtml(weakest.score)}/100)` : "Evidence details unavailable"}</p>
      <div class="reportHistoryActions">
        <button type="button" data-report-action="view" data-report-id="${escapeHtml(report.id)}">VIEW</button>
        <button type="button" data-report-action="delete" data-report-id="${escapeHtml(report.id)}">DELETE</button>
      </div>
    </article>
  `;
}

function renderReportHistory(payload = {}) {
  const reports = Array.isArray(payload.reports) ? payload.reports : [];
  reportsSavedCount.textContent = String(reports.length);
  reportsList.innerHTML = reports.length
    ? reports.map(reportHistoryItemMarkup).join("")
    : '<p class="reportsEmpty">No saved deal reports yet. Signed-in analyses will appear here automatically.</p>';
  if (payload.billing) renderBillingStatus(payload.billing);
}

function closeReportsPanel() {
  reportsPanel.hidden = true;
  reportsToggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("reportsOpen");
}

async function openReportsPanel() {
  if (!authenticatedUser) return openAuthPanel();
  closeAuthPanel();
  closeMemoryPanel();
  closeJournalPanel();
  closeShortlistPanel();
  collapseContextPanels();
  reportsPanel.hidden = false;
  reportsToggle.setAttribute("aria-expanded", "true");
  document.body.classList.add("reportsOpen");
  reportsList.innerHTML = '<p class="reportsEmpty">Loading private reports...</p>';
  try {
    renderReportHistory(await requestJson("/api/reports"));
  } catch (error) {
    reportsList.innerHTML = `<p class="reportsEmpty">${escapeHtml(error.message)}</p>`;
  }
}

async function handleReportAction(button) {
  const id = button.getAttribute("data-report-id");
  const action = button.getAttribute("data-report-action");
  if (!id || !action) return;
  button.disabled = true;
  try {
    if (action === "delete") {
      await requestJson(`/api/reports/${encodeURIComponent(id)}`, { method: "DELETE" });
      renderReportHistory(await requestJson("/api/reports"));
      return;
    }
    const result = await requestJson(`/api/reports/${encodeURIComponent(id)}`);
    closeReportsPanel();
    transcript.innerHTML = "";
    result.report.analysis.savedReportId = result.report.id;
    addDealAnalysis(result.report.analysis);
    renderBillingStatus(result.billing);
    setSystemState("System ready", `${result.report.subject} report loaded.`);
  } catch (error) {
    setSystemState("Connection issue", error.message || "The saved report is unavailable.");
    button.disabled = false;
  }
}

function journalItemMarkup(item) {
  const state = item.reviewed ? "REVIEWED" : item.locked ? "LOCKED" : "DRAFT";
  const date = new Intl.DateTimeFormat("en-MY", { dateStyle: "medium" }).format(new Date(item.createdAt));
  return `
    <article class="journalItem ${escapeHtml(state.toLowerCase())}" data-journal-item="${escapeHtml(item.id)}">
      <header><span><small>${escapeHtml(state)} / ${escapeHtml(date)}</small><b>${escapeHtml(item.subject)}</b></span><em>${escapeHtml(item.decision)}</em></header>
      <p>${escapeHtml(item.skillSignal)}</p>
      <div class="journalItemMeta"><span>REPORT ${escapeHtml(item.snapshotScore)}/100</span><span>CONFIDENCE ${escapeHtml(item.confidence)}%</span></div>
      <button type="button" data-journal-action="open" data-journal-id="${escapeHtml(item.id)}">${item.locked ? "REVIEW" : "EDIT DRAFT"}</button>
    </article>
  `;
}

function renderJournalCollection(payload = {}) {
  const decisions = Array.isArray(payload.decisions) ? payload.decisions : [];
  journalTotalCount.textContent = String(payload.summary?.total || 0);
  journalReviewedCount.textContent = String(payload.summary?.reviewed || 0);
  journalList.innerHTML = decisions.length
    ? decisions.map(journalItemMarkup).join("")
    : '<p class="journalEmpty">No decisions recorded yet. Open a saved Deal Report and choose RECORD DECISION.</p>';
  journalSummary.hidden = false;
  journalList.hidden = false;
  journalEditor.hidden = true;
}

function closeJournalPanel() {
  journalPanel.hidden = true;
  journalToggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("journalOpen");
}

async function loadJournalCollection() {
  const payload = await requestJson("/api/journal");
  renderJournalCollection(payload);
  return payload;
}

async function openJournalPanel(decisionId = "") {
  if (!authenticatedUser) return openAuthPanel();
  closeAuthPanel();
  closeMemoryPanel();
  closeReportsPanel();
  closeShortlistPanel();
  collapseContextPanels();
  journalPanel.hidden = false;
  journalToggle.setAttribute("aria-expanded", "true");
  document.body.classList.add("journalOpen");
  journalList.innerHTML = '<p class="journalEmpty">Loading private decisions...</p>';
  try {
    await loadJournalCollection();
    if (decisionId) await loadJournalDecision(decisionId);
  } catch (error) {
    journalList.innerHTML = `<p class="journalEmpty">${escapeHtml(error.message)}</p>`;
  }
}

function setJournalDraftDisabled(disabled) {
  for (const field of [journalDecision, journalConfidence, journalHoldingPeriod, journalThesis, journalCounterThesis, journalKillCriterion, journalNotes]) {
    field.disabled = disabled;
  }
}

function showJournalEditor(item) {
  const locked = Boolean(item.lockedAt);
  journalDecisionId.value = item.id;
  journalSubject.textContent = item.subject;
  journalDecision.value = item.prePurchase.decision;
  journalConfidence.value = item.prePurchase.confidence;
  journalHoldingPeriod.value = item.prePurchase.holdingPeriod;
  journalThesis.value = item.prePurchase.thesis;
  journalCounterThesis.value = item.prePurchase.counterThesis;
  journalKillCriterion.value = item.prePurchase.killCriterion;
  journalNotes.value = item.prePurchase.notes;
  journalOutcomeStatus.value = item.outcome.status === "not_reviewed" ? "holding" : item.outcome.status;
  journalActualRent.value = item.outcome.actualRent;
  journalCurrentValue.value = item.outcome.currentValue;
  journalProcessScore.value = item.outcome.processScore;
  journalExecutionScore.value = item.outcome.executionScore;
  journalOutcomeScore.value = item.outcome.outcomeScore;
  journalLuckScore.value = item.outcome.luckScore;
  journalResult.value = item.outcome.result;
  journalLesson.value = item.outcome.lesson;
  setJournalDraftDisabled(locked);
  journalDraftActions.hidden = locked;
  journalLock.dataset.confirming = "false";
  journalLock.textContent = "LOCK THESIS";
  journalLockNotice.hidden = !locked;
  journalOutcome.hidden = !locked;
  journalMessage.textContent = item.outcome.reviewedAt ? `Review saved. ${item.outcome.reviewedAt.slice(0, 10)}.` : "";
  journalSummary.hidden = true;
  journalList.hidden = true;
  journalEditor.hidden = false;
  journalEditor.scrollTop = 0;
}

async function loadJournalDecision(id) {
  const result = await requestJson(`/api/journal/${encodeURIComponent(id)}`);
  showJournalEditor(result.decision);
  return result.decision;
}

function journalDraftPayload() {
  return {
    action: "update",
    decision: journalDecision.value,
    confidence: journalConfidence.value,
    holdingPeriod: journalHoldingPeriod.value,
    thesis: journalThesis.value,
    counterThesis: journalCounterThesis.value,
    killCriterion: journalKillCriterion.value,
    notes: journalNotes.value
  };
}

async function saveJournalDraft() {
  const id = journalDecisionId.value;
  journalMessage.textContent = "Saving draft...";
  try {
    const result = await requestJson(`/api/journal/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(journalDraftPayload())
    });
    showJournalEditor(result.decision);
    journalMessage.textContent = "Draft saved.";
  } catch (error) {
    journalMessage.textContent = error.message;
    journalLock.textContent = "LOCK THESIS";
  }
}

async function lockJournalThesis() {
  const id = journalDecisionId.value;
  journalMessage.textContent = "Locking the pre-purchase record...";
  try {
    await requestJson(`/api/journal/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(journalDraftPayload())
    });
    const result = await requestJson(`/api/journal/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "lock" })
    });
    showJournalEditor(result.decision);
    journalMessage.textContent = "Thesis locked. Future reviews cannot rewrite it.";
  } catch (error) {
    journalMessage.textContent = error.message;
    journalLock.textContent = "LOCK THESIS";
  }
}

function requestJournalLock() {
  if (journalLock.dataset.confirming !== "true") {
    journalLock.dataset.confirming = "true";
    journalLock.textContent = "CONFIRM LOCK";
    journalMessage.textContent = "Locking is permanent. Press CONFIRM LOCK to preserve this thesis unchanged.";
    return;
  }
  journalLock.dataset.confirming = "false";
  journalLock.textContent = "LOCKING...";
  void lockJournalThesis();
}

async function saveJournalReview() {
  const id = journalDecisionId.value;
  journalMessage.textContent = "Saving outcome review...";
  try {
    const result = await requestJson(`/api/journal/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        action: "review",
        outcomeStatus: journalOutcomeStatus.value,
        actualRent: journalActualRent.value,
        currentValue: journalCurrentValue.value,
        processScore: journalProcessScore.value,
        executionScore: journalExecutionScore.value,
        outcomeScore: journalOutcomeScore.value,
        luckScore: journalLuckScore.value,
        result: journalResult.value,
        lesson: journalLesson.value
      })
    });
    showJournalEditor(result.decision);
    journalMessage.textContent = result.summary.skillSignal;
  } catch (error) {
    journalMessage.textContent = error.message;
  }
}

async function deleteJournalDraft() {
  const id = journalDecisionId.value;
  journalMessage.textContent = "Deleting draft...";
  try {
    await requestJson(`/api/journal/${encodeURIComponent(id)}`, { method: "DELETE" });
    await loadJournalCollection();
    setSystemState("System ready", "Decision draft deleted.");
  } catch (error) {
    journalMessage.textContent = error.message;
  }
}

async function createJournalDecision(analysis) {
  if (!authenticatedUser) {
    setSystemState("System ready", "Sign in to preserve a private decision record.");
    return openAuthPanel();
  }
  if (!analysis?.savedReportId) {
    setSystemState("System ready", "Open a saved Deal Report before recording the decision.");
    return;
  }
  try {
    const result = await requestJson("/api/journal", {
      method: "POST",
      body: JSON.stringify({ reportId: analysis.savedReportId })
    });
    await openJournalPanel(result.decision.id);
  } catch (error) {
    setSystemState("Connection issue", error.message || "The decision record could not be created.");
  }
}

function readShortlist() {
  try {
    const items = JSON.parse(window.localStorage.getItem(shortlistKey) || "[]");
    return Array.isArray(items) ? items.slice(0, 4) : [];
  } catch {
    window.localStorage.removeItem(shortlistKey);
    return [];
  }
}

function writeShortlist(items) {
  const next = items.slice(0, 4);
  window.localStorage.setItem(shortlistKey, JSON.stringify(next));
  shortlistToggle.textContent = next.length ? `SHORTLIST ${next.length}` : "SHORTLIST";
  return next;
}

function analysisSubject(analysis) {
  const deal = analysis?.context?.dealCard || {};
  return deal.projectName || deal.area || "Untitled deal";
}

function shortlistWeakestDimension(item) {
  return [...(item.dimensions || [])].sort((a, b) => Number(a.score || 0) - Number(b.score || 0))[0] || null;
}

function shortlistBlockers(item) {
  return [
    ...(item.hardStops || []),
    ...(item.recommendationBlockers || [])
  ].filter(Boolean);
}

function shortlistRankScore(item) {
  const blockerPenalty = shortlistBlockers(item).length * 18;
  const verdictPenalty = ["REJECT", "PAUSE"].includes(String(item.verdict || "").toUpperCase()) ? 24 : 0;
  const weakest = shortlistWeakestDimension(item);
  const weakPenalty = weakest && Number(weakest.score || 0) < 55 ? 10 : 0;
  return Math.max(0, Number(item.averageScore || 0) - blockerPenalty - verdictPenalty - weakPenalty);
}

function shortlistSummaryMarkup(items) {
  if (!items.length) return "";
  const ranked = items.slice().sort((a, b) => shortlistRankScore(b) - shortlistRankScore(a));
  const cleanItems = ranked.filter((item) => !shortlistBlockers(item).length && !["REJECT", "PAUSE"].includes(String(item.verdict || "").toUpperCase()));
  const pick = cleanItems[0] || ranked[0];
  const blockedCount = items.filter((item) => shortlistBlockers(item).length || ["REJECT", "PAUSE"].includes(String(item.verdict || "").toUpperCase())).length;
  const weakest = shortlistWeakestDimension(pick);
  return `
    <section class="shortlistCompare">
      <span><small>APEX COMPARISON</small><b>${escapeHtml(cleanItems.length ? "Cleanest current pick" : "No clean pick yet")}</b></span>
      <strong>${escapeHtml(pick.subject)}</strong>
      <div>
        <em>${escapeHtml(shortlistRankScore(pick))} adjusted</em>
        <em>${escapeHtml(blockedCount)} blocked</em>
        <em>${escapeHtml(weakest ? `${weakest.label}: ${weakest.score}` : "weak link: n/a")}</em>
      </div>
      <p>${escapeHtml(cleanItems.length ? "Compare the adjusted score, then check the weak link before choosing." : "Clear hard stops and decision blockers before treating any shortlisted deal as a contender.")}</p>
    </section>
  `;
}

function shortlistItemMarkup(item) {
  const dimensions = (item.dimensions || []).map((dimension) => `
    <span class="shortlistDimension ${escapeHtml(dimension.status)}">
      <small>${escapeHtml(dimension.label)}</small><b>${escapeHtml(dimension.score)}</b>
    </span>
  `).join("");
  const weakest = shortlistWeakestDimension(item);
  const blockers = shortlistBlockers(item);
  const readiness = item.investorReadiness?.label || "Readiness unknown";
  const focus = item.decisionFocus?.body || item.summary || "No decision focus recorded.";
  const learningCount = item.learningLoop?.signals?.length || 0;
  const blocked = blockers.length || ["REJECT", "PAUSE"].includes(String(item.verdict || "").toUpperCase());
  return `
    <article class="shortlistItem ${blocked ? "blocked" : "clean"}" data-shortlist-item="${escapeHtml(item.id)}">
      <header><span><small>${escapeHtml(item.verdict)} / ${escapeHtml(readiness)}</small><b>${escapeHtml(item.subject)}</b></span><em>${escapeHtml(shortlistRankScore(item))} adj</em></header>
      <div class="shortlistDimensions">${dimensions}</div>
      <p><b>Weak link</b> ${escapeHtml(weakest ? `${weakest.label} (${weakest.score}/100)` : "Evidence not available")}</p>
      <p><b>Decision focus</b> ${escapeHtml(focus)}</p>
      <div class="shortlistSignals">
        <span>${escapeHtml(blockers.length)} blocker${blockers.length === 1 ? "" : "s"}</span>
        <span>${escapeHtml(learningCount)} learning signal${learningCount === 1 ? "" : "s"}</span>
        <span>${escapeHtml(item.confidence || 0)}% confidence</span>
      </div>
      <div class="shortlistActions">
        <button type="button" data-shortlist-action="load" data-shortlist-id="${escapeHtml(item.id)}">LOAD DEAL</button>
        <button type="button" data-shortlist-action="remove" data-shortlist-id="${escapeHtml(item.id)}">REMOVE</button>
      </div>
    </article>
  `;
}

function renderShortlist() {
  const items = readShortlist();
  writeShortlist(items);
  shortlistSummary.innerHTML = shortlistSummaryMarkup(items);
  shortlistList.innerHTML = items.length
    ? items.map(shortlistItemMarkup).join("")
    : '<p class="shortlistEmpty">No analysed deals saved yet. Run an analysis, then choose SAVE TO SHORTLIST.</p>';
  shortlistClear.hidden = !items.length;
}

function closeShortlistPanel() {
  shortlistPanel.hidden = true;
  shortlistToggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("shortlistOpen");
}

function openShortlistPanel() {
  closeAuthPanel();
  closeMemoryPanel();
  closeReportsPanel();
  closeJournalPanel();
  collapseContextPanels();
  renderShortlist();
  shortlistPanel.hidden = false;
  shortlistToggle.setAttribute("aria-expanded", "true");
  document.body.classList.add("shortlistOpen");
}

function saveAnalysisToShortlist(analysis) {
  const deal = analysis?.context?.dealCard || {};
  const subject = analysisSubject(analysis);
  const id = `${subject}|${deal.askingPrice || ""}`.toLowerCase().replace(/[^a-z0-9|]+/g, "-");
  const item = {
    id,
    subject,
    savedAt: new Date().toISOString(),
    verdict: analysis.verdict,
    summary: analysis.summary,
    averageScore: analysis.averageScore,
    confidence: analysis.confidence,
    dimensions: analysis.dimensions || [],
    metrics: analysis.metrics || [],
    scenarios: analysis.scenarios || [],
    stressEnvelope: analysis.stressEnvelope || null,
    portfolioGate: analysis.portfolioGate || null,
    marketPulse: analysis.marketPulse || null,
    holdExitPlan: analysis.holdExitPlan || null,
    decisionSeal: analysis.decisionSeal || null,
    hardStops: analysis.hardStops || [],
    recommendationBlockers: analysis.recommendationBlockers || [],
    decisionFocus: analysis.decisionFocus || null,
    investorReadiness: analysis.investorReadiness || null,
    learningLoop: analysis.learningLoop || null,
    counterThesis: analysis.counterThesis,
    context: analysis.context || {}
  };
  const existing = readShortlist().filter((saved) => saved.id !== id);
  writeShortlist([item, ...existing]);
  return item;
}

function restoreSavedDeal(item) {
  const deal = item?.context?.dealCard || {};
  const profile = item?.context?.financialProfile || {};
  for (const field of dealFields) {
    const key = field.getAttribute("data-deal-field");
    field.value = deal[key] || "";
  }
  for (const field of profileFields) {
    const key = field.getAttribute("data-profile-field");
    field.value = profile[key] || "";
  }
  saveContext(dealFields, "data-deal-field", dealContextKey);
  saveContext(profileFields, "data-profile-field", profileContextKey);
  closeShortlistPanel();
  const dealToggle = contextToggles.find((toggle) => toggle.getAttribute("data-context-toggle") === "deal");
  if (dealToggle) setContextPanelState(dealToggle, true);
  setSystemState("System ready", `${item.subject} loaded for review.`);
}

function handleShortlistAction(button) {
  const id = button.getAttribute("data-shortlist-id");
  const action = button.getAttribute("data-shortlist-action");
  const items = readShortlist();
  if (action === "remove") {
    writeShortlist(items.filter((item) => item.id !== id));
    renderShortlist();
    return;
  }
  if (action === "load") {
    const item = items.find((saved) => saved.id === id);
    if (item) restoreSavedDeal(item);
  }
}

function printAnalysis(message) {
  if (!message) return;
  printTarget?.classList.remove("printTarget");
  printTarget = message;
  printTarget.classList.add("printTarget");
  document.body.classList.add("printMode");
  window.print();
}

function analysisExportText(analysis) {
  const lines = [
    "APEX ANALYTIC DEAL REPORT",
    analysisSubject(analysis),
    "",
    `Verdict: ${analysis.verdict || "INVESTIGATE"}`,
    `Confidence: ${analysis.confidence || 0}%`,
    `Score: ${analysis.averageScore || 0}/100`,
    `Reasoning: ${analysis.reasoningMode || "Framework only"}`,
    "",
    `Summary: ${analysis.summary || ""}`
  ];
  if (analysis.decisionFocus?.body) lines.push("", `${analysis.decisionFocus.label || "Decision focus"}: ${analysis.decisionFocus.body}`);
  if (analysis.investorReadiness?.label) {
    lines.push("", `Investor readiness: ${analysis.investorReadiness.label} (${analysis.investorReadiness.score || 0}/100)`);
    if (analysis.investorReadiness.summary) lines.push(analysis.investorReadiness.summary);
    for (const flag of analysis.investorReadiness.flags || []) lines.push(`- ${flag}`);
  }
  if (analysis.dimensions?.length) {
    lines.push("", "Scorecard");
    for (const item of analysis.dimensions) lines.push(`- ${item.label}: ${item.score}/100 (${item.status})`);
  }
  if (analysis.evidenceChecklist?.length) {
    lines.push("", "Evidence checklist");
    for (const item of analysis.evidenceChecklist) lines.push(`- ${item.label}: ${item.status}. ${item.action}`);
  }
  if (analysis.dueDiligencePlan?.tasks?.length) {
    lines.push("", "Due diligence pack", analysis.dueDiligencePlan.summary || "");
    for (const item of analysis.dueDiligencePlan.tasks) lines.push(`- ${item.owner} / ${item.priority} / ${item.status}: ${item.label}. ${item.action}`);
  }
  if (analysis.stressEnvelope?.summary) {
    lines.push(
      "",
      "Stress envelope",
      analysis.stressEnvelope.summary,
      `Base true holding: ${analysis.stressEnvelope.baseTrueHolding}`,
      `Stressed true holding: ${analysis.stressEnvelope.stressedTrueHolding}`,
      `Cash after stress reserves: ${analysis.stressEnvelope.cashAfterStressReserves}`,
      `Reserve survival: ${analysis.stressEnvelope.reserveSurvivalMonths === null ? "Not applicable" : `${analysis.stressEnvelope.reserveSurvivalMonths} months`}`
    );
    for (const item of analysis.stressEnvelope.assumptions || []) lines.push(`- ${item.label}: ${item.value} (${item.source})`);
  }
  if (analysis.portfolioGate?.summary) {
    lines.push(
      "",
      "Portfolio expansion gate",
      `${analysis.portfolioGate.status || "review"} (${analysis.portfolioGate.score || 0}/100): ${analysis.portfolioGate.summary}`,
      `Next-property rule: ${analysis.portfolioGate.nextPropertyRule || "Do not scale until the current property is proven."}`
    );
    for (const item of analysis.portfolioGate.checks || []) lines.push(`- ${item.label}: ${item.status}. ${item.action}`);
  }
  if (analysis.marketPulse?.summary) {
    lines.push(
      "",
      "Market cycle and liquidity pulse",
      `${analysis.marketPulse.status || "watch"}: ${analysis.marketPulse.summary}`,
      `Cycle: ${analysis.marketPulse.cycle || "Cycle unclear"}`,
      `Liquidity: ${analysis.marketPulse.liquidity || "Liquidity must be proven"}`
    );
    for (const item of analysis.marketPulse.checks || []) lines.push(`- ${item.label}: ${item.status}. ${item.action}`);
  }
  if (analysis.holdExitPlan?.summary) {
    lines.push(
      "",
      "Hold, refinance, exit plan",
      `${analysis.holdExitPlan.action || "monitor"}: ${analysis.holdExitPlan.summary}`,
      `Review cadence: ${analysis.holdExitPlan.reviewCadence || "Review annually and on trigger events."}`
    );
    for (const item of analysis.holdExitPlan.triggers || []) lines.push(`- ${item.label}: ${item.status}. ${item.action}`);
  }
  if (analysis.decisionSeal?.summary) {
    lines.push("", "V1 decision seal", `${analysis.decisionSeal.label || "V1 Conditional Only"}: ${analysis.decisionSeal.summary}`);
    for (const item of analysis.decisionSeal.conditions || []) lines.push(`- ${item.label}: ${item.status}. ${item.action}`);
  }
  if (analysis.executionPlan?.actions?.length) {
    lines.push(
      "",
      "Execution calibration",
      analysis.executionPlan.summary || "",
      `Posture: ${analysis.executionPlan.posture || "Verify before offer"}`,
      `Opening anchor: ${analysis.executionPlan.openingAnchor || "Need value proof"}`,
      `Maximum offer: ${analysis.executionPlan.maximumOffer || "Need value/rent proof"}`,
      `Walk-away rule: ${analysis.executionPlan.walkAway || "Do not proceed under pressure."}`
    );
    for (const item of analysis.executionPlan.actions) lines.push(`- ${item.lane} / ${item.status}: ${item.label}. ${item.action}`);
  }
  if (analysis.learningLoop?.signals?.length) {
    lines.push("", "Learning loop", analysis.learningLoop.summary || "");
    for (const item of analysis.learningLoop.signals) lines.push(`- ${item.label}: ${item.body} ${item.action}`);
  }
  if (analysis.hardStops?.length) lines.push("", "Hard stops", ...analysis.hardStops.map((item) => `- ${item}`));
  if (analysis.recommendationBlockers?.length) lines.push("", "Decision blockers", ...analysis.recommendationBlockers.map((item) => `- ${item}`));
  if (analysis.watchouts?.length) lines.push("", "Watch-outs", ...analysis.watchouts.map((item) => `- ${item}`));
  if (analysis.nextActions?.length) lines.push("", "Check next", ...analysis.nextActions.map((item) => `- ${item}`));
  if (analysis.counterThesis) lines.push("", `Strongest counter-thesis: ${analysis.counterThesis}`);
  return brandVisibleText(lines.join("\n"));
}

async function copyAnalysisReport(button, analysis) {
  const text = analysisExportText(analysis);
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.append(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }
  button.textContent = "COPIED";
  setSystemState("System ready", "Report copied.");
}

function finishPrinting() {
  printTarget?.classList.remove("printTarget");
  printTarget = null;
  document.body.classList.remove("printMode");
}

function handleAnalysisAction(button) {
  const message = button.closest(".analysisMessage");
  const analysis = analysisRegistry.get(message?.dataset.analysisId);
  if (!message || !analysis) return;
  const action = button.getAttribute("data-analysis-action");
  if (action === "report") {
    printAnalysis(message);
    return;
  }
  if (action === "copy") {
    void copyAnalysisReport(button, analysis);
    return;
  }
  if (action === "shortlist") {
    saveAnalysisToShortlist(analysis);
    button.textContent = "SAVED";
    setSystemState("System ready", `${analysisSubject(analysis)} saved to your shortlist.`);
    return;
  }
  if (action === "journal") void createJournalDecision(analysis);
}

function analysisSection(title, items = [], className = "") {
  if (!items.length) return "";
  return `
    <section class="analysisSection ${escapeHtml(className)}">
      <h3>${escapeHtml(title)}</h3>
      <ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </section>
  `;
}

function marketIntelligenceMarkup(market = {}) {
  const observations = Array.isArray(market.observations) ? market.observations : [];
  if (!observations.length) return "";
  const trends = Array.isArray(market.trends) ? market.trends : [];
  const summary = market.summary || {};
  const trendMarkup = trends.slice(0, 4).map((trend) => {
    const change = trend.percentChange === null || trend.percentChange === undefined ? "" : ` ${Number(trend.percentChange) > 0 ? "+" : ""}${trend.percentChange}%`;
    return `<span class="marketTrend ${escapeHtml(trend.direction)}"><small>${escapeHtml(String(trend.metricType || "").replaceAll("_", " "))}</small><b>${escapeHtml(trend.direction)}${escapeHtml(change)}</b></span>`;
  }).join("");
  const observationMarkup = observations.slice(0, 6).map((observation) => {
    const status = observation.freshness?.status || "stale";
    const age = Number(observation.freshness?.ageDays || 0);
    const fullDetail = observation.notes || (observation.value === null ? "Qualitative observation" : `${observation.value}${observation.unit ? ` ${observation.unit}` : ""}`);
    const detail = fullDetail.length > 420 ? `${fullDetail.slice(0, 417).trim()}...` : fullDetail;
    return `
      <li>
        <span><b>${escapeHtml(observation.title)}</b><small>${escapeHtml(detail)}</small></span>
        <em class="${escapeHtml(status)}">${escapeHtml(status)} / ${escapeHtml(age)}d</em>
      </li>
    `;
  }).join("");
  return `
    <section class="analysisMarketPulse">
      <header><h3>OWNER MARKET PULSE</h3><span>${escapeHtml(summary.matched || observations.length)} MATCHED</span></header>
      ${trendMarkup ? `<div class="marketTrends">${trendMarkup}</div>` : ""}
      <ul>${observationMarkup}</ul>
      <p>${escapeHtml(summary.warning || "Check the observation dates before relying on this market read.")}</p>
    </section>
  `;
}

function decisionFocusMarkup(analysis = {}) {
  const focus = analysis.decisionFocus || {};
  const challenge = analysis.challengeMode || {};
  if (!focus.body && !challenge.message) return "";
  return `
    <section class="analysisDecisionFocus ${escapeHtml(focus.tone || "neutral")}">
      <span><small>${escapeHtml(focus.label || "Decision focus")}</small><b>${escapeHtml(focus.body || analysis.summary || "")}</b></span>
      ${challenge.message ? `<p>${escapeHtml(challenge.message)}</p>` : ""}
    </section>
  `;
}

function readinessMarkup(readiness = {}) {
  if (!readiness.label) return "";
  const flags = Array.isArray(readiness.flags) ? readiness.flags.slice(0, 4) : [];
  return `
    <section class="analysisReadiness">
      <header>
        <span><small>INVESTOR READINESS</small><b>${escapeHtml(readiness.label)}</b></span>
        <em>${escapeHtml(readiness.score || 0)}/100</em>
      </header>
      ${readiness.summary ? `<p>${escapeHtml(readiness.summary)}</p>` : ""}
      ${flags.length ? `<ul>${flags.map((flag) => `<li>${escapeHtml(flag)}</li>`).join("")}</ul>` : ""}
    </section>
  `;
}

function evidenceChecklistMarkup(items = []) {
  if (!items.length) return "";
  return `
    <section class="analysisEvidence">
      <h3>EVIDENCE CHECKLIST</h3>
      <div>
        ${items.map((item) => `
          <article class="evidenceItem ${escapeHtml(item.status)}">
            <i>${escapeHtml(item.status)}</i>
            <span><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.action)}</small></span>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function dueDiligenceMarkup(plan = {}) {
  const tasks = Array.isArray(plan.tasks) ? plan.tasks : [];
  if (!tasks.length) return "";
  return `
    <section class="analysisDiligence">
      <header><span><small>DUE DILIGENCE PACK</small><b>${escapeHtml(plan.summary || "Clear these tasks before commitment.")}</b></span></header>
      <div>
        ${tasks.map((item) => `
          <article class="diligenceTask ${escapeHtml(item.status)} ${escapeHtml(item.priority)}">
            <i>${escapeHtml(item.priority)}</i>
            <span><b>${escapeHtml(item.owner)} / ${escapeHtml(item.label)}</b><small>${escapeHtml(item.action)}</small></span>
            <em>${escapeHtml(item.status)}</em>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function stressEnvelopeMarkup(envelope = {}) {
  if (!envelope.summary) return "";
  const assumptions = Array.isArray(envelope.assumptions) ? envelope.assumptions : [];
  return `
    <section class="analysisStress ${escapeHtml(envelope.status || "unknown")}">
      <header>
        <span><small>STRESS ENVELOPE</small><b>${escapeHtml(envelope.summary)}</b></span>
        <em>${escapeHtml(envelope.status || "unknown")}</em>
      </header>
      <div class="stressReadings">
        <span><small>BASE TRUE HOLDING</small><b>${escapeHtml(envelope.baseTrueHolding || "Need rent proof")}</b></span>
        <span><small>STRESSED HOLDING</small><b>${escapeHtml(envelope.stressedTrueHolding || "Need rent and instalment")}</b></span>
        <span><small>RESERVE SURVIVAL</small><b>${escapeHtml(envelope.reserveSurvivalMonths === null ? "Not applicable" : `${envelope.reserveSurvivalMonths} months`)}</b></span>
      </div>
      ${assumptions.length ? `
        <div class="stressAssumptions">
          ${assumptions.map((item) => `
            <span class="${escapeHtml(item.source)}"><small>${escapeHtml(item.source)}</small><b>${escapeHtml(item.label)}</b><em>${escapeHtml(item.value)}</em></span>
          `).join("")}
        </div>
      ` : ""}
    </section>
  `;
}

function portfolioGateMarkup(gate = {}) {
  if (!gate.summary) return "";
  const checks = Array.isArray(gate.checks) ? gate.checks : [];
  return `
    <section class="analysisPortfolioGate ${escapeHtml(gate.status || "unknown")}">
      <header>
        <span><small>PORTFOLIO EXPANSION GATE</small><b>${escapeHtml(gate.summary)}</b></span>
        <em>${escapeHtml(gate.score || 0)}/100</em>
      </header>
      <p>${escapeHtml(gate.nextPropertyRule || "Do not scale until the current property is proven.")}</p>
      ${checks.length ? `
        <div>
          ${checks.map((item) => `
            <article class="portfolioCheck ${escapeHtml(item.status)}">
              <i>${escapeHtml(item.status)}</i>
              <span><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.action)}</small></span>
            </article>
          `).join("")}
        </div>
      ` : ""}
    </section>
  `;
}

function marketPulseMarkup(pulse = {}) {
  if (!pulse.summary) return "";
  const checks = Array.isArray(pulse.checks) ? pulse.checks : [];
  return `
    <section class="analysisMarketCycle ${escapeHtml(pulse.status || "watch")}">
      <header>
        <span><small>MARKET CYCLE / LIQUIDITY</small><b>${escapeHtml(pulse.summary)}</b></span>
        <em>${escapeHtml(pulse.status || "watch")}</em>
      </header>
      <div class="marketCycleReadings">
        <span><small>CYCLE</small><b>${escapeHtml(pulse.cycle || "Cycle unclear")}</b></span>
        <span><small>LIQUIDITY</small><b>${escapeHtml(pulse.liquidity || "Liquidity must be proven")}</b></span>
      </div>
      ${checks.length ? `<div>${checks.map((item) => `
        <article class="marketCycleCheck ${escapeHtml(item.status)}">
          <i>${escapeHtml(item.status)}</i>
          <span><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.action)}</small></span>
        </article>
      `).join("")}</div>` : ""}
    </section>
  `;
}

function holdExitPlanMarkup(plan = {}) {
  if (!plan.summary) return "";
  const triggers = Array.isArray(plan.triggers) ? plan.triggers : [];
  return `
    <section class="analysisHoldExit ${escapeHtml(plan.action || "monitor")}">
      <header>
        <span><small>HOLD / REFINANCE / EXIT</small><b>${escapeHtml(plan.summary)}</b></span>
        <em>${escapeHtml(plan.action || "monitor")}</em>
      </header>
      <p>${escapeHtml(plan.reviewCadence || "Review annually and on trigger events.")}</p>
      ${triggers.length ? `<div>${triggers.map((item) => `
        <article class="holdExitTrigger ${escapeHtml(item.status)}">
          <i>${escapeHtml(item.status)}</i>
          <span><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.action)}</small></span>
        </article>
      `).join("")}</div>` : ""}
    </section>
  `;
}

function decisionSealMarkup(seal = {}) {
  if (!seal.summary) return "";
  const conditions = Array.isArray(seal.conditions) ? seal.conditions : [];
  return `
    <section class="analysisDecisionSeal ${escapeHtml(seal.status || "conditional")}">
      <header>
        <span><small>V1 DECISION SEAL</small><b>${escapeHtml(seal.label || "V1 Conditional Only")}</b></span>
        <em>${escapeHtml(seal.status || "conditional")}</em>
      </header>
      <p>${escapeHtml(seal.summary)}</p>
      ${conditions.length ? `<div>${conditions.map((item) => `
        <article class="sealCondition ${escapeHtml(item.status)}">
          <i>${escapeHtml(item.status)}</i>
          <span><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.action)}</small></span>
        </article>
      `).join("")}</div>` : ""}
    </section>
  `;
}

function executionPlanMarkup(plan = {}) {
  const actions = Array.isArray(plan.actions) ? plan.actions : [];
  if (!actions.length) return "";
  return `
    <section class="analysisExecution">
      <header>
        <span><small>EXECUTION CALIBRATION</small><b>${escapeHtml(plan.summary || "Use these guardrails before offer, booking, renovation, tenant approval, or exit.")}</b></span>
        <em>${escapeHtml(plan.posture || "Verify before offer")}</em>
      </header>
      <div class="executionOffer">
        <span><small>OPENING ANCHOR</small><b>${escapeHtml(plan.openingAnchor || "Need value proof")}</b></span>
        <span><small>MAXIMUM OFFER</small><b>${escapeHtml(plan.maximumOffer || "Need value/rent proof")}</b></span>
        <span><small>WALK-AWAY RULE</small><b>${escapeHtml(plan.walkAway || "Do not proceed under pressure.")}</b></span>
      </div>
      <div class="executionActions">
        ${actions.map((item) => `
          <article class="executionAction ${escapeHtml(item.status)}">
            <i>${escapeHtml(item.status)}</i>
            <span><b>${escapeHtml(item.lane)} / ${escapeHtml(item.label)}</b><small>${escapeHtml(item.action)}</small></span>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function learningLoopMarkup(loop = {}) {
  const signals = Array.isArray(loop.signals) ? loop.signals : [];
  if (!signals.length) return "";
  return `
    <section class="analysisLearning">
      <header><span><small>LEARNING LOOP</small><b>${escapeHtml(loop.summary || "Matched private learning for this report.")}</b></span></header>
      <div>
        ${signals.map((item) => `
          <article class="learningSignal ${escapeHtml(item.type)}">
            <i>${escapeHtml(item.type)}</i>
            <span><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.body)}</small><em>${escapeHtml(item.action)}</em></span>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function addDealAnalysis(analysis, sources = [], intelligence = {}) {
  document.body.classList.add("conversationActive");
  const message = document.createElement("article");
  const analysisId = crypto.randomUUID();
  analysisRegistry.set(analysisId, analysis);
  message.dataset.analysisId = analysisId;
  const verdictClass = String(analysis.verdict || "investigate").toLowerCase();
  const stageMarkup = (analysis.stages || []).map((stage) => `
    <li class="analysisStage">
      <span class="stageNumber">0${escapeHtml(stage.number)}</span>
      <span class="stageBody">
        <b>${escapeHtml(stage.name)}</b>
        <small>${escapeHtml(stage.summary)}</small>
      </span>
      <span class="stageReading">
        <i class="stageStatus ${escapeHtml(stage.status)}">${escapeHtml(stage.status)}</i>
        <em>${escapeHtml(stage.score)}/100</em>
      </span>
    </li>
  `).join("");
  const metricMarkup = (analysis.metrics || []).map((metric) => `
    <span class="analysisMetric"><small>${escapeHtml(metric.label)}</small><b>${escapeHtml(metric.value)}</b></span>
  `).join("");
  const dimensionMarkup = (analysis.dimensions || []).map((dimension) => `
    <article class="analysisDimension ${escapeHtml(dimension.status)}">
      <span><small>${escapeHtml(dimension.label)}</small><b>${escapeHtml(dimension.score)}/100</b><em>${escapeHtml(dimension.status)}</em></span>
      <i><em style="width:${Math.max(0, Math.min(100, Number(dimension.score) || 0))}%"></em></i>
    </article>
  `).join("");
  const scenarioMarkup = (analysis.scenarios || []).map((scenario) => `
    <article class="analysisScenario ${escapeHtml(scenario.status)}">
      <span><b>${escapeHtml(scenario.label)}</b><small>${escapeHtml(scenario.assumption)}</small></span>
      <em>${escapeHtml(scenario.value)}/mo</em>
    </article>
  `).join("");
  const reportDate = new Intl.DateTimeFormat("en-MY", { dateStyle: "medium" }).format(new Date());

  message.className = "message jarvis analysisMessage";
  message.innerHTML = `
    <header class="analysisReportTitle">
      <span>A</span><div><small>APEX ANALYTIC</small><h1>DEAL DECISION REPORT</h1><p>${escapeHtml(analysisSubject(analysis))} / ${escapeHtml(reportDate)}</p></div>
    </header>
    ${intelligenceMarkup(intelligence)}
    <div class="analysisHeader">
      <span><small>SEVEN-STAGE VERDICT</small><b>${escapeHtml(analysis.verdict)}</b></span>
      <i class="analysisVerdict ${escapeHtml(verdictClass)}">${escapeHtml(analysis.confidence)}% CONFIDENCE</i>
    </div>
    <p class="analysisSummary">${escapeHtml(analysis.summary)}</p>
    ${decisionFocusMarkup(analysis)}
    ${analysis.aiCommentary ? `
      <section class="analysisJarvisTake">
        <h3>APEX ANALYSIS</h3>
        <p>${escapeHtml(analysis.aiCommentary)}</p>
      </section>
    ` : ""}
    <div class="analysisMeta">
      <span>ENGINE <b>${escapeHtml(analysis.engineVersion || "Apex v1.10")}</b></span>
      <span>REASONING <b>${escapeHtml(analysis.reasoningMode || (analysis.aiCommentary ? "Framework + AI" : "Framework only"))}</b></span>
      <span>DECISION SCORE <b>${escapeHtml(analysis.averageScore)}/100</b></span>
      <span>INPUT COMPLETE <b>${escapeHtml(analysis.completeness)}%</b></span>
    </div>
    <div class="analysisOverview">
      ${readinessMarkup(analysis.investorReadiness)}
      ${dimensionMarkup ? `<section class="analysisDimensionSection"><h3>DEAL SCORECARD</h3><div class="analysisDimensions">${dimensionMarkup}</div></section>` : ""}
    </div>
    ${metricMarkup ? `<div class="analysisMetrics">${metricMarkup}</div>` : ""}
    ${evidenceChecklistMarkup(analysis.evidenceChecklist || [])}
    ${dueDiligenceMarkup(analysis.dueDiligencePlan)}
    ${stressEnvelopeMarkup(analysis.stressEnvelope)}
    ${portfolioGateMarkup(analysis.portfolioGate)}
    ${marketPulseMarkup(analysis.marketPulse)}
    ${holdExitPlanMarkup(analysis.holdExitPlan)}
    ${decisionSealMarkup(analysis.decisionSeal)}
    ${executionPlanMarkup(analysis.executionPlan)}
    ${learningLoopMarkup(analysis.learningLoop)}
    ${scenarioMarkup ? `<section class="analysisScenarioSection"><h3>DOWNSIDE SCENARIOS</h3><div class="analysisScenarios">${scenarioMarkup}</div><p>Stress assumptions are decision tests, not forecasts.</p></section>` : ""}
    ${marketIntelligenceMarkup(analysis.marketIntelligence)}
    <ol class="analysisStages">${stageMarkup}</ol>
    <div class="analysisDetails">
      ${analysisSection("Challenge mode", analysis.challengeMode?.message ? [analysis.challengeMode.message] : [], analysis.challengeMode?.level === "hard" ? "danger" : "warning")}
      ${analysisSection("Hard stops", analysis.hardStops, "danger")}
      ${analysisSection("Decision blockers", analysis.recommendationBlockers, "warning")}
      ${analysisSection("Watch-outs", analysis.watchouts, "warning")}
      ${analysisSection("Missing evidence", analysis.missingEvidence)}
      ${analysisSection("Check next", analysis.nextActions, "actions")}
    </div>
    <section class="analysisCounter">
      <h3>STRONGEST COUNTER-THESIS</h3>
      <p>${escapeHtml(analysis.counterThesis)}</p>
    </section>
    <div class="analysisActions">
      <button type="button" data-analysis-action="shortlist">SAVE TO SHORTLIST</button>
      ${authenticatedUser && analysis.savedReportId ? '<button type="button" data-analysis-action="journal">RECORD DECISION</button>' : ""}
      <button type="button" data-analysis-action="copy">COPY REPORT</button>
      <button type="button" data-analysis-action="report">PRINT REPORT</button>
    </div>
    ${sourcesMarkup(sources)}
  `;
  transcript.append(message);
  const messageTop = message.getBoundingClientRect().top - transcript.getBoundingClientRect().top + transcript.scrollTop;
  transcript.scrollTop = Math.max(0, messageTop - 6);
}

function renderSession(session) {
  transcript.innerHTML = "";
  if (!session?.messages?.length) return;
  for (const message of session.messages) {
    addMessage(message.role, message.content, message.sources || [], message);
  }
}

function setSpeakingState(active) {
  speaking = active;
  jarvisOrb.classList.toggle("speaking", active);
  jarvisOrb.setAttribute("aria-label", active ? "Stop Apex Analytic voice" : "Talk to Apex Analytic");
  stopVoiceBtn.hidden = !active;
}

function collectContext(fields, attributeName) {
  return fields.reduce((context, field) => {
    const key = field.getAttribute(attributeName);
    const value = String(field.value || "").trim();
    if (value) context[key] = value;
    return context;
  }, {});
}

function collectDealCard() {
  return collectContext(dealFields, "data-deal-field");
}

function collectFinancialProfile() {
  return collectContext(profileFields, "data-profile-field");
}

function saveContext(fields, attributeName, storageKey) {
  const context = collectContext(fields, attributeName);
  window.localStorage.setItem(storageKey, JSON.stringify(context));
}

function restoreContext(fields, attributeName, storageKey) {
  let saved = {};
  try {
    saved = JSON.parse(window.localStorage.getItem(storageKey) || "{}");
  } catch {
    window.localStorage.removeItem(storageKey);
  }
  for (const field of fields) {
    const key = field.getAttribute(attributeName);
    if (saved[key]) field.value = saved[key];
  }
}

function resetContextCard(panelName) {
  const isDeal = panelName === "deal";
  const fields = isDeal ? dealFields : profileFields;
  const storageKey = isDeal ? dealContextKey : profileContextKey;
  for (const field of fields) field.value = "";
  window.localStorage.removeItem(storageKey);
  setSystemState("System ready", `${isDeal ? "Deal" : "Profile"} details cleared.`);
}

function savedContextPanelState() {
  try {
    return JSON.parse(window.localStorage.getItem(contextPanelKey) || "{}");
  } catch {
    window.localStorage.removeItem(contextPanelKey);
    return {};
  }
}

function setContextPanelState(toggle, expanded, persist = true) {
  const panelName = toggle.getAttribute("data-context-toggle");
  const body = document.querySelector(`[data-context-body="${panelName}"]`);
  const action = toggle.querySelector(".contextAction");
  if (!body) return;

  if (expanded) {
    for (const otherToggle of contextToggles) {
      if (otherToggle === toggle) continue;
      setContextPanelState(otherToggle, false, false);
    }
  }

  toggle.setAttribute("aria-expanded", String(expanded));
  body.hidden = !expanded;
  toggle.closest(".contextPanel")?.classList.toggle("expanded", expanded);
  if (action) action.textContent = expanded ? "CLOSE" : "OPEN";

  if (persist) {
    const state = contextToggles.reduce((nextState, item) => {
      const name = item.getAttribute("data-context-toggle");
      nextState[name] = item === toggle ? expanded : false;
      return nextState;
    }, {});
    window.localStorage.setItem(contextPanelKey, JSON.stringify(state));
  }
}

function bootContextPanels() {
  const state = savedContextPanelState();
  const activePanel = Object.entries(state).find(([, expanded]) => expanded)?.[0];
  for (const toggle of contextToggles) {
    const panelName = toggle.getAttribute("data-context-toggle");
    setContextPanelState(toggle, panelName === activePanel, false);
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      setContextPanelState(toggle, !expanded);
    });
  }
  for (const button of contextResetButtons) {
    button.addEventListener("click", () => resetContextCard(button.getAttribute("data-context-reset")));
  }
}

function collapseContextPanels() {
  const state = {};
  for (const toggle of contextToggles) {
    setContextPanelState(toggle, false, false);
    state[toggle.getAttribute("data-context-toggle")] = false;
  }
  window.localStorage.setItem(contextPanelKey, JSON.stringify(state));
}

function stopSpeaking(prompt = "Voice stopped.") {
  voiceRequestId += 1;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  if (activeServerAudio) {
    activeServerAudio.pause();
    activeServerAudio.src = "";
    activeServerAudio = null;
  }
  if (activeAudioUrl) {
    URL.revokeObjectURL(activeAudioUrl);
    activeAudioUrl = "";
  }
  voiceStopRequested = true;
  setSpeakingState(false);
  if (!listening) setSystemState("System ready", prompt);
}

async function speakWithServer(text) {
  stopSpeaking("Ready when you are.");
  const requestId = ++voiceRequestId;
  try {
    setSpeakingState(true);
    setSystemState("Speaking", "Delivering analysis.");
    const response = await fetch("/api/jarvis/speech", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "x-estatelab-client-id": clientId()
      },
      body: JSON.stringify({ text })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Server voice is unavailable.");
    }
    if (requestId !== voiceRequestId) return;
    activeAudioUrl = URL.createObjectURL(await response.blob());
    activeServerAudio = new Audio(activeAudioUrl);
    activeServerAudio.onended = () => {
      setSpeakingState(false);
      setSystemState("System ready", voiceStopRequested ? "Voice stopped." : "Ready when you are.");
      stopSpeaking("Ready when you are.");
      voiceStopRequested = false;
    };
    activeServerAudio.onerror = () => {
      setSpeakingState(false);
      setSystemState("Voice interrupted", "The written answer is still available.");
    };
    await activeServerAudio.play();
  } catch {
    setSpeakingState(false);
    setSystemState("Voice interrupted", "The written answer is still available.");
  }
}

function speak(text) {
  if (!voiceResponsesEnabled) return;
  if (!("speechSynthesis" in window)) {
    if (serverTtsEnabled) void speakWithServer(text);
    return;
  }
  stopSpeaking("Ready when you are.");
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.96;
  utterance.pitch = 0.9;
  utterance.onstart = () => {
    voiceStopRequested = false;
    setSpeakingState(true);
    setSystemState("Speaking", "Delivering analysis.");
  };
  utterance.onend = () => {
    setSpeakingState(false);
    setSystemState("System ready", voiceStopRequested ? "Voice stopped." : "Ready when you are.");
    voiceStopRequested = false;
  };
  utterance.onerror = () => {
    setSpeakingState(false);
    voiceStopRequested = false;
  };
  window.speechSynthesis.speak(utterance);
}

function blobBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function startServerListening() {
  if (mediaRecorder?.state === "recording") {
    mediaRecorder.stop();
    return;
  }
  if (!serverSttEnabled || !window.MediaRecorder || !navigator.mediaDevices?.getUserMedia) {
    setSystemState("Voice unavailable", "Use the command bar on this browser.");
    chatInput.focus();
    return;
  }
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedAudio = [];
    const preferredType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]
      .find((type) => MediaRecorder.isTypeSupported(type));
    mediaRecorder = new MediaRecorder(mediaStream, preferredType ? { mimeType: preferredType } : undefined);
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size) recordedAudio.push(event.data);
    };
    mediaRecorder.onstop = async () => {
      listening = false;
      jarvisOrb.classList.remove("listening");
      mediaStream?.getTracks().forEach((track) => track.stop());
      const audio = new Blob(recordedAudio, { type: mediaRecorder.mimeType || "audio/webm" });
      if (!audio.size) return setSystemState("Voice interrupted", "No recording was captured.");
      setSystemState("Analyzing", "Transcribing your message.");
      try {
        const result = await requestJson("/api/jarvis/transcribe", {
          method: "POST",
          body: JSON.stringify({
            audioBase64: await blobBase64(audio),
            mimeType: audio.type,
            filename: audio.type.includes("mp4") ? "voice.mp4" : "voice.webm"
          })
        });
        chatInput.value = result.text;
        await submitQuestion(result.text);
      } catch (error) {
        setSystemState("Voice interrupted", error.message || "Voice transcription failed.");
      }
    };
    mediaRecorder.start();
    listening = true;
    jarvisOrb.classList.add("listening");
    setSystemState("Listening", "Speak naturally. Tap again when finished.");
  } catch {
    setSystemState("Voice interrupted", "Microphone access was not available.");
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "x-estatelab-client-id": clientId(),
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const error = new Error(payload.error || "Apex Analytic backend is unavailable.");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  if (response.status === 204) return null;
  return response.json();
}

async function loadAuthState() {
  const result = await requestJson("/api/auth/me");
  renderAuthState(result.authenticated ? result.user : null);
  return result;
}

async function submitAuth() {
  const endpoint = authMode === "register" ? "/api/auth/register" : "/api/auth/login";
  const payload = {
    email: authEmail.value.trim(),
    password: authPassword.value
  };
  if (authMode === "register") payload.displayName = authName.value.trim();

  authSubmit.disabled = true;
  authMessage.textContent = authMode === "register" ? "Creating your private account..." : "Signing in...";
  try {
    const result = await requestJson(endpoint, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    renderAuthState(result.user);
    authPassword.value = "";
    await ensureSession();
    setSystemState("System ready", result.verificationPending ? "Account ready. Verify your email when convenient." : `Welcome back, ${result.user.displayName}.`);
  } catch (error) {
    authMessage.textContent = error.message || "Account access is unavailable.";
  } finally {
    authSubmit.disabled = false;
  }
}

async function requestPasswordReset() {
  const email = recoveryEmail.value.trim();
  if (!email) return recoveryEmail.focus();
  recoveryRequest.disabled = true;
  recoveryMessage.textContent = "Sending reset instructions...";
  try {
    const result = await requestJson("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email })
    });
    recoveryMessage.textContent = result.message;
    if (result.debug?.token) recoveryToken.value = result.debug.token;
  } catch (error) {
    recoveryMessage.textContent = error.message || "Password recovery is unavailable.";
  } finally {
    recoveryRequest.disabled = false;
  }
}

async function resetPassword() {
  recoverySubmit.disabled = true;
  recoveryMessage.textContent = "Updating password...";
  try {
    await requestJson("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token: recoveryToken.value.trim(), password: recoveryPassword.value })
    });
    recoveryPassword.value = "";
    showAuthRecovery(false);
    setAuthMode("login");
    authMessage.textContent = "Password updated. Sign in with the new password.";
  } catch (error) {
    recoveryMessage.textContent = error.message || "Password could not be updated.";
  } finally {
    recoverySubmit.disabled = false;
  }
}

async function requestVerification() {
  verificationRequest.disabled = true;
  try {
    const result = await requestJson("/api/auth/request-verification", { method: "POST", body: "{}" });
    if (result.debug?.token) verificationToken.value = result.debug.token;
    setSystemState("System ready", result.sent ? "Verification code sent." : "Verification request created.");
  } catch (error) {
    setSystemState("Connection issue", error.message || "Verification is unavailable.");
  } finally {
    verificationRequest.disabled = false;
  }
}

async function verifyEmail() {
  const token = verificationToken.value.trim();
  if (!token) return verificationToken.focus();
  verificationSubmit.disabled = true;
  try {
    const result = await requestJson("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token })
    });
    renderAuthState(result.user);
    setSystemState("System ready", "Email verified.");
  } catch (error) {
    setSystemState("Connection issue", error.message || "Verification failed.");
  } finally {
    verificationSubmit.disabled = false;
  }
}

async function logout() {
  logoutButton.disabled = true;
  try {
    closeMemoryPanel();
    closeReportsPanel();
    closeJournalPanel();
    await requestJson("/api/auth/logout", { method: "POST", body: "{}" });
    renderAuthState(null);
    setAuthMode("login");
    window.localStorage.removeItem(sessionKey);
    sessionId = null;
    await createSession();
    setSystemState("System ready", "Signed out. Guest session ready.");
  } catch (error) {
    authMessage.textContent = error.message || "Sign out is unavailable.";
  } finally {
    logoutButton.disabled = false;
  }
}

async function createSession() {
  const result = await requestJson("/api/jarvis/sessions", {
    method: "POST",
    body: JSON.stringify({ clientId: clientId() })
  });
  sessionId = result.session.id;
  window.localStorage.setItem(sessionKey, sessionId);
  setSessionState("READY");
  transcript.innerHTML = "";
  document.body.classList.remove("conversationActive");
  return result.session;
}

async function resetChat() {
  stopSpeaking("Chat reset.");
  setSystemState("Resetting", "Clearing the current conversation.");
  const currentSessionId = sessionId;
  transcript.innerHTML = "";
  document.body.classList.remove("conversationActive");
  window.localStorage.removeItem(sessionKey);
  sessionId = null;

  try {
    if (currentSessionId) {
      await requestJson(`/api/jarvis/sessions/${currentSessionId}`, { method: "DELETE" });
    }
    await createSession();
    setSystemState("System ready", "Clean chat ready.");
  } catch {
    setSystemState("Connection issue", "Apex Analytic backend is unavailable.");
    setSessionState("OFFLINE");
  }
}

async function loadSession(id) {
  const result = await requestJson(`/api/jarvis/sessions/${id}`);
  sessionId = result.session.id;
  window.localStorage.setItem(sessionKey, sessionId);
  renderSession(result.session);
  setSessionState(`${result.session.messages.length} MSG`);
  return result.session;
}

async function ensureSession() {
  if (!sessionId && authenticatedUser) {
    try {
      const history = await requestJson("/api/jarvis/sessions");
      if (history.sessions?.length) return loadSession(history.sessions[0].id);
    } catch {
      // A new private session is safer than blocking assistant startup.
    }
  }
  if (!sessionId) return createSession();
  try {
    return await loadSession(sessionId);
  } catch {
    return createSession();
  }
}

async function askJarvis(question) {
  await ensureSession();
  const result = await requestJson("/api/jarvis/query", {
    method: "POST",
    body: JSON.stringify({
      query: question,
      sessionId,
      clientId: clientId(),
      dealCard: collectDealCard(),
      financialProfile: collectFinancialProfile()
    })
  });
  sessionId = result.session.id;
  window.localStorage.setItem(sessionKey, sessionId);
  const responseMode = result.mode === "llm" ? "AI" : "FRAMEWORK";
  setSessionState(`${responseMode} / ${result.session.messages.length}`);
  return result;
}

async function submitQuestion(question) {
  const cleanQuestion = String(question || "").trim();
  if (!cleanQuestion) return;
  addMessage("user", cleanQuestion);
  chatInput.value = "";
  setSystemState("Analyzing", "Reviewing your knowledge and prior decisions.");
  jarvisOrb.classList.add("speaking");
  try {
    const result = await askJarvis(cleanQuestion);
    addMessage("jarvis", result.answer, result.sources, result);
    addMemorySuggestion(result.memoryCandidate);
    speak(brandVisibleText(result.answer));
    if (!voiceResponsesEnabled) setSystemState("System ready", "Ready when you are.");
  } catch (error) {
    const message = error.message || "The Apex Analytic backend is unavailable.";
    addMessage("jarvis", message);
    speak(message);
    setSystemState("Connection issue", "Start Apex Analytic and try again.");
    setSessionState("OFFLINE");
  } finally {
    if (!speaking && !window.speechSynthesis?.speaking) jarvisOrb.classList.remove("speaking");
  }
}

async function runDealAnalysis() {
  const dealCard = collectDealCard();
  const financialProfile = collectFinancialProfile();
  if (!dealCard.askingPrice || (!dealCard.area && !dealCard.projectName)) {
    addMessage("jarvis", "Add an asking price and an area or project first. I can work with missing evidence after that, but I need a real deal to analyse.");
    const dealToggle = contextToggles.find((toggle) => toggle.getAttribute("data-context-toggle") === "deal");
    if (dealToggle) setContextPanelState(dealToggle, true);
    const firstMissing = dealFields.find((field) => {
      const key = field.getAttribute("data-deal-field");
      return (key === "askingPrice" && !dealCard.askingPrice)
        || (key === "area" && !dealCard.area && !dealCard.projectName);
    });
    firstMissing?.focus();
    return;
  }

  collapseContextPanels();
  await ensureSession();
  stopSpeaking("Running the full framework.");
  addMessage("user", "Run the seven-stage Apex Analytic assessment for this deal.");
  analyzeDealBtn.disabled = true;
  analyzeDealBtn.textContent = "ANALYSING...";
  setSystemState("Analyzing", "Running all seven Apex Analytic stages.");
  jarvisOrb.classList.add("speaking");
  try {
    const result = await requestJson("/api/jarvis/analyze-deal", {
      method: "POST",
      body: JSON.stringify({
        sessionId,
        clientId: clientId(),
        dealCard,
        financialProfile
      })
    });
    sessionId = result.session.id;
    window.localStorage.setItem(sessionKey, sessionId);
    const responseMode = result.mode === "llm" ? "AI" : "FRAMEWORK";
    setSessionState(`${responseMode} / ${result.session.messages.length}`);
    if (result.billing) renderBillingStatus(result.billing);
    if (result.savedReport) result.analysis.savedReportId = result.savedReport.id;
    addDealAnalysis(result.analysis, result.sources, result);
    speak(brandVisibleText(result.analysis.voiceSummary));
    if (!voiceResponsesEnabled) setSystemState("System ready", "Analysis complete.");
  } catch (error) {
    const message = error.message || "The deal analysis is unavailable.";
    addMessage("jarvis", message);
    setSystemState("Connection issue", "Deal analysis could not be completed.");
  } finally {
    analyzeDealBtn.disabled = false;
    analyzeDealBtn.textContent = "ANALYSE";
    if (!speaking && !window.speechSynthesis?.speaking) jarvisOrb.classList.remove("speaking");
  }
}

function startListening() {
  if (speaking || window.speechSynthesis?.speaking) {
    stopSpeaking("Voice stopped.");
    return;
  }
  if (!recognition) {
    void startServerListening();
    return;
  }
  if (listening) {
    recognition.stop();
    return;
  }
  recognition.start();
}

if (recognition) {
  recognition.lang = "en-MY";
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.onstart = () => {
    listening = true;
    jarvisOrb.classList.add("listening");
    setSystemState("Listening", "Speak naturally.");
  };

  recognition.onresult = (event) => {
    const result = Array.from(event.results).map((item) => item[0].transcript).join(" ");
    chatInput.value = result;
    if (event.results[event.results.length - 1].isFinal) submitQuestion(result);
  };

  recognition.onerror = () => {
    setSystemState("Voice interrupted", "Tap the orb to try again.");
  };

  recognition.onend = () => {
    listening = false;
    jarvisOrb.classList.remove("listening");
    if (!window.speechSynthesis?.speaking) setSystemState("System ready", "Ready when you are.");
  };

}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitQuestion(chatInput.value);
});

jarvisOrb.addEventListener("click", startListening);
stopVoiceBtn.addEventListener("click", () => stopSpeaking("Voice stopped."));
resetChatBtn.addEventListener("click", resetChat);
analyzeDealBtn.addEventListener("click", runDealAnalysis);
accountToggle.addEventListener("click", () => {
  if (authPanel.hidden) openAuthPanel();
  else closeAuthPanel();
});
memoryToggle.addEventListener("click", () => {
  if (memoryPanel.hidden) void openMemoryPanel();
  else closeMemoryPanel();
});
memoryClose.addEventListener("click", closeMemoryPanel);
reportsToggle.addEventListener("click", () => {
  if (reportsPanel.hidden) void openReportsPanel();
  else closeReportsPanel();
});
reportsClose.addEventListener("click", closeReportsPanel);
reportsList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-report-action]");
  if (button) void handleReportAction(button);
});
journalToggle.addEventListener("click", () => {
  if (journalPanel.hidden) void openJournalPanel();
  else closeJournalPanel();
});
journalClose.addEventListener("click", closeJournalPanel);
journalList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-journal-action]");
  if (button?.getAttribute("data-journal-action") === "open") void loadJournalDecision(button.getAttribute("data-journal-id"));
});
journalBack.addEventListener("click", () => void loadJournalCollection());
journalSaveDraft.addEventListener("click", () => void saveJournalDraft());
journalLock.addEventListener("click", requestJournalLock);
journalDelete.addEventListener("click", () => void deleteJournalDraft());
journalSaveReview.addEventListener("click", () => void saveJournalReview());
billingActions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-checkout-plan]");
  if (button) void startCheckout(button.getAttribute("data-checkout-plan"));
});
shortlistToggle.addEventListener("click", () => {
  if (shortlistPanel.hidden) openShortlistPanel();
  else closeShortlistPanel();
});
shortlistClose.addEventListener("click", closeShortlistPanel);
shortlistClear.addEventListener("click", () => {
  writeShortlist([]);
  renderShortlist();
  setSystemState("System ready", "Shortlist cleared.");
});
memoryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const content = memoryInput.value.trim();
  if (!content) return memoryInput.focus();
  const submitButton = memoryForm.querySelector("button");
  submitButton.disabled = true;
  try {
    await requestJson("/api/memory", {
      method: "POST",
      body: JSON.stringify({ content })
    });
    memoryInput.value = "";
    await loadMemory();
    setSystemState("System ready", "Memory added for review.");
  } catch (error) {
    setSystemState("Connection issue", error.message || "Memory could not be added.");
  } finally {
    submitButton.disabled = false;
  }
});
for (const container of [transcript, memoryList]) {
  container.addEventListener("click", (event) => {
    const memoryButton = event.target.closest("[data-memory-action]");
    if (memoryButton) void handleMemoryAction(memoryButton);
    const analysisButton = event.target.closest("[data-analysis-action]");
    if (analysisButton) handleAnalysisAction(analysisButton);
  });
}
shortlistList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-shortlist-action]");
  if (button) handleShortlistAction(button);
});
authClose.addEventListener("click", closeAuthPanel);
authModeToggle.addEventListener("click", () => setAuthMode(authMode === "login" ? "register" : "login"));
authRecoveryToggle.addEventListener("click", () => showAuthRecovery(true));
authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitAuth();
});
authRecovery.addEventListener("submit", (event) => {
  event.preventDefault();
  resetPassword();
});
recoveryRequest.addEventListener("click", requestPasswordReset);
recoveryCancel.addEventListener("click", () => showAuthRecovery(false));
verificationRequest.addEventListener("click", requestVerification);
verificationSubmit.addEventListener("click", verifyEmail);
logoutButton.addEventListener("click", logout);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !authPanel.hidden) closeAuthPanel();
  if (event.key === "Escape" && !memoryPanel.hidden) closeMemoryPanel();
  if (event.key === "Escape" && !reportsPanel.hidden) closeReportsPanel();
  if (event.key === "Escape" && !journalPanel.hidden) closeJournalPanel();
  if (event.key === "Escape" && !shortlistPanel.hidden) closeShortlistPanel();
});
window.addEventListener("afterprint", finishPrinting);

soundToggle.addEventListener("click", () => {
  voiceResponsesEnabled = !voiceResponsesEnabled;
  soundToggle.textContent = voiceResponsesEnabled ? "VOICE ON" : "VOICE OFF";
  soundToggle.setAttribute("aria-pressed", String(voiceResponsesEnabled));
  if (!voiceResponsesEnabled) stopSpeaking("Voice response off.");
});

for (const field of dealFields) {
  field.addEventListener("input", () => saveContext(dealFields, "data-deal-field", dealContextKey));
}

for (const field of profileFields) {
  field.addEventListener("input", () => saveContext(profileFields, "data-profile-field", profileContextKey));
}

async function bootJarvis() {
  restoreContext(dealFields, "data-deal-field", dealContextKey);
  restoreContext(profileFields, "data-profile-field", profileContextKey);
  renderShortlist();
  bootContextPanels();
  setAuthMode("login");
  try {
    const status = await requestJson("/api/jarvis/status");
    const intelligenceMode = status.llm?.enabled ? "AI" : "FRAMEWORK";
    serverSttEnabled = Boolean(status.audio?.serverStt);
    serverTtsEnabled = Boolean(status.audio?.serverTts);
    emailDeliveryEnabled = Boolean(status.accounts?.emailDelivery);
    emailVerificationRequired = Boolean(status.accounts?.verificationRequired);
    setAuthMode(authMode);
    aiDisclosure.hidden = !status.llm?.enabled;
    await loadAuthState();
    await ensureSession();
    setSessionState(`${intelligenceMode} READY`);
    setSystemState("System ready", "Ready when you are.");
  } catch {
    setSystemState("Connection issue", "Apex Analytic backend is unavailable.");
    setSessionState("OFFLINE");
  }
}

bootJarvis();
