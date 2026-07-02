const jarvisOrb = document.querySelector("#jarvisOrb");
const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const inputModeHint = document.querySelector("#inputModeHint");
const transcript = document.querySelector("#transcript");
const assistantPrompt = document.querySelector("#assistantPrompt");
const systemStatus = document.querySelector("#systemStatus");
const sessionStatus = document.querySelector("#sessionStatus");
const soundToggle = document.querySelector("#soundToggle");
const stopVoiceBtn = document.querySelector("#stopVoiceBtn");
const resetChatBtn = document.querySelector("#resetChatBtn");
const sessionBriefBtn = document.querySelector("#sessionBriefBtn");
const analyzeDealBtn = document.querySelector("#analyzeDealBtn");
const screenDealBtn = document.querySelector("#screenDealBtn");
const aiDisclosure = document.querySelector("#aiDisclosure");
const contextReadiness = document.querySelector("#contextReadiness");
const dealJourney = document.querySelector("#dealJourney");
const experienceLock = document.querySelector("#experienceLock");
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
const memoryCaptureEnabled = document.querySelector("#memoryCaptureEnabled");
const memoryReasoningEnabled = document.querySelector("#memoryReasoningEnabled");
const memoryModeNotice = document.querySelector("#memoryModeNotice");
const memoryProfileTitle = document.querySelector("#memoryProfileTitle");
const memoryProfileCompleteness = document.querySelector("#memoryProfileCompleteness");
const memoryProfileSummary = document.querySelector("#memoryProfileSummary");
const memoryProfileDetails = document.querySelector("#memoryProfileDetails");
const billingSummary = document.querySelector("#billingSummary");
const billingPlanName = document.querySelector("#billingPlanName");
const billingUsage = document.querySelector("#billingUsage");
const billingActions = document.querySelector("#billingActions");
const billingGuardrail = document.querySelector("#billingGuardrail");
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
const ownerIntelToggle = document.querySelector("#ownerIntelToggle");
const ownerIntelPanel = document.querySelector("#ownerIntelPanel");
const ownerIntelClose = document.querySelector("#ownerIntelClose");
const ownerIntelAccess = document.querySelector("#ownerIntelAccess");
const ownerIntelToken = document.querySelector("#ownerIntelToken");
const ownerIntelClearToken = document.querySelector("#ownerIntelClearToken");
const ownerIntelSummary = document.querySelector("#ownerIntelSummary");
const ownerIntelControls = document.querySelector("#ownerIntelControls");
const ownerIntelCopyBrief = document.querySelector("#ownerIntelCopyBrief");
const ownerIntelLanes = document.querySelector("#ownerIntelLanes");
const ownerIntelCoverage = document.querySelector("#ownerIntelCoverage");
const ownerIntelNextTitle = document.querySelector("#ownerIntelNextTitle");
const ownerIntelNextDetail = document.querySelector("#ownerIntelNextDetail");
const ownerIntelActions = document.querySelector("#ownerIntelActions");
const ownerIntelMessage = document.querySelector("#ownerIntelMessage");
const ownerMarketToggle = document.querySelector("#ownerMarketToggle");
const ownerMarketPanel = document.querySelector("#ownerMarketPanel");
const ownerMarketClose = document.querySelector("#ownerMarketClose");
const ownerCaseToggle = document.querySelector("#ownerCaseToggle");
const ownerCasePanel = document.querySelector("#ownerCasePanel");
const ownerCaseClose = document.querySelector("#ownerCaseClose");
const ownerEvidenceToggle = document.querySelector("#ownerEvidenceToggle");
const ownerEvidencePanel = document.querySelector("#ownerEvidencePanel");
const ownerEvidenceClose = document.querySelector("#ownerEvidenceClose");
const trustToggle = document.querySelector("#trustToggle");
const trustPanel = document.querySelector("#trustPanel");
const trustClose = document.querySelector("#trustClose");
const trustAcceptance = document.querySelector("#trustAcceptance");
const trustAcceptanceTitle = document.querySelector("#trustAcceptanceTitle");
const trustAcceptanceDetail = document.querySelector("#trustAcceptanceDetail");
const trustAccept = document.querySelector("#trustAccept");
const ownerMarketAccess = document.querySelector("#ownerMarketAccess");
const ownerMarketToken = document.querySelector("#ownerMarketToken");
const ownerMarketClearToken = document.querySelector("#ownerMarketClearToken");
const ownerMarketSummary = document.querySelector("#ownerMarketSummary");
const ownerCaseAccess = document.querySelector("#ownerCaseAccess");
const ownerCaseToken = document.querySelector("#ownerCaseToken");
const ownerCaseClearToken = document.querySelector("#ownerCaseClearToken");
const ownerCaseSummary = document.querySelector("#ownerCaseSummary");
const ownerCaseForm = document.querySelector("#ownerCaseForm");
const ownerCaseProject = document.querySelector("#ownerCaseProject");
const ownerCaseProjectName = document.querySelector("#ownerCaseProjectName");
const ownerCaseArea = document.querySelector("#ownerCaseArea");
const ownerCaseState = document.querySelector("#ownerCaseState");
const ownerCaseType = document.querySelector("#ownerCaseType");
const ownerCaseDeveloper = document.querySelector("#ownerCaseDeveloper");
const ownerCasePriceSegment = document.querySelector("#ownerCasePriceSegment");
const ownerCaseVerdict = document.querySelector("#ownerCaseVerdict");
const ownerCaseConfidence = document.querySelector("#ownerCaseConfidence");
const ownerCaseRating = document.querySelector("#ownerCaseRating");
const ownerCaseObservedAt = document.querySelector("#ownerCaseObservedAt");
const ownerCaseTags = document.querySelector("#ownerCaseTags");
const ownerCaseTargetBuyer = document.querySelector("#ownerCaseTargetBuyer");
const ownerCaseTargetTenant = document.querySelector("#ownerCaseTargetTenant");
const ownerCaseStrengths = document.querySelector("#ownerCaseStrengths");
const ownerCaseWeaknesses = document.querySelector("#ownerCaseWeaknesses");
const ownerCaseManagement = document.querySelector("#ownerCaseManagement");
const ownerCaseResident = document.querySelector("#ownerCaseResident");
const ownerCaseSupply = document.querySelector("#ownerCaseSupply");
const ownerCaseRental = document.querySelector("#ownerCaseRental");
const ownerCaseResale = document.querySelector("#ownerCaseResale");
const ownerCaseOwnerVerdict = document.querySelector("#ownerCaseOwnerVerdict");
const ownerCaseSourceBasis = document.querySelector("#ownerCaseSourceBasis");
const ownerCaseRefresh = document.querySelector("#ownerCaseRefresh");
const ownerCaseFilter = document.querySelector("#ownerCaseFilter");
const ownerCaseVerdictFilter = document.querySelector("#ownerCaseVerdictFilter");
const ownerCaseList = document.querySelector("#ownerCaseList");
const ownerCaseMetrics = document.querySelector("#ownerCaseMetrics");
const ownerCaseMessage = document.querySelector("#ownerCaseMessage");
const ownerCaseFormTitle = document.querySelector("#ownerCaseFormTitle");
const ownerCaseSubmit = document.querySelector("#ownerCaseSubmit");
const ownerCaseCancelEdit = document.querySelector("#ownerCaseCancelEdit");
const ownerEvidenceAccess = document.querySelector("#ownerEvidenceAccess");
const ownerEvidenceToken = document.querySelector("#ownerEvidenceToken");
const ownerEvidenceClearToken = document.querySelector("#ownerEvidenceClearToken");
const ownerEvidenceSummary = document.querySelector("#ownerEvidenceSummary");
const ownerEvidenceForm = document.querySelector("#ownerEvidenceForm");
const ownerEvidenceTitle = document.querySelector("#ownerEvidenceTitle");
const ownerEvidenceFilename = document.querySelector("#ownerEvidenceFilename");
const ownerEvidenceSourceUrl = document.querySelector("#ownerEvidenceSourceUrl");
const ownerEvidenceTags = document.querySelector("#ownerEvidenceTags");
const ownerEvidenceText = document.querySelector("#ownerEvidenceText");
const ownerEvidenceRefresh = document.querySelector("#ownerEvidenceRefresh");
const ownerEvidenceList = document.querySelector("#ownerEvidenceList");
const ownerEvidenceMetrics = document.querySelector("#ownerEvidenceMetrics");
const ownerEvidenceMessage = document.querySelector("#ownerEvidenceMessage");
const ownerProjectForm = document.querySelector("#ownerProjectForm");
const ownerProjectName = document.querySelector("#ownerProjectName");
const ownerProjectArea = document.querySelector("#ownerProjectArea");
const ownerProjectState = document.querySelector("#ownerProjectState");
const ownerProjectType = document.querySelector("#ownerProjectType");
const ownerProjectDeveloper = document.querySelector("#ownerProjectDeveloper");
const ownerProjectTenure = document.querySelector("#ownerProjectTenure");
const ownerProjectCompletionYear = document.querySelector("#ownerProjectCompletionYear");
const ownerProjectStatus = document.querySelector("#ownerProjectStatus");
const ownerProjectAliases = document.querySelector("#ownerProjectAliases");
const ownerObservationForm = document.querySelector("#ownerObservationForm");
const ownerObservationProject = document.querySelector("#ownerObservationProject");
const ownerObservationMetric = document.querySelector("#ownerObservationMetric");
const ownerObservationArea = document.querySelector("#ownerObservationArea");
const ownerObservationValue = document.querySelector("#ownerObservationValue");
const ownerObservationUnit = document.querySelector("#ownerObservationUnit");
const ownerObservationDate = document.querySelector("#ownerObservationDate");
const ownerObservationSourceType = document.querySelector("#ownerObservationSourceType");
const ownerObservationConfidence = document.querySelector("#ownerObservationConfidence");
const ownerObservationNotes = document.querySelector("#ownerObservationNotes");
const ownerMarketAreaFilter = document.querySelector("#ownerMarketAreaFilter");
const ownerMarketMetricFilter = document.querySelector("#ownerMarketMetricFilter");
const ownerMarketFreshnessFilter = document.querySelector("#ownerMarketFreshnessFilter");
const ownerMarketRefresh = document.querySelector("#ownerMarketRefresh");
const ownerProjectCount = document.querySelector("#ownerProjectCount");
const ownerObservationCount = document.querySelector("#ownerObservationCount");
const ownerProjectList = document.querySelector("#ownerProjectList");
const ownerObservationList = document.querySelector("#ownerObservationList");
const ownerMarketMessage = document.querySelector("#ownerMarketMessage");
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
const contextFieldModeKey = "apex.contextFieldMode.v1";
const shortlistKey = "apex.shortlist.v1";
const responseFeedbackKey = "apex.responseFeedback.v1";
const ownerMarketTokenKey = "apex.ownerMarket.token";
const trustBoundaryKey = "apex.trustBoundary.accepted.v1";
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
let ownerMarketEnabled = false;
let ownerMarketProjects = [];
let ownerIntelProjects = [];
let ownerIntelFilter = "all";
let ownerIntelSnapshot = null;
let ownerCaseItems = [];
let ownerCaseEditingId = "";
let memorySettingsLoading = false;
let pendingTrustAction = "";
let latestAnalysisId = "";

const contextCoreFieldKeys = {
  deal: new Set([
    "area", "projectName", "propertyType", "askingPrice", "conservativeFairValue",
    "expectedRent", "estimatedInstallment", "maintenance", "ownStayAppeal",
    "managementQuality", "exitBuyerPool", "nearbySupply", "mainConcern"
  ]),
  profile: new Set([
    "monthlyIncome", "cashReserveMonths", "cashAvailable", "currentDebt",
    "investmentGoal", "holdingPeriod", "financialConcern"
  ]),
  guidance: new Set([
    "experienceLevel", "guidanceMode", "decisionIntent", "preferredOutput",
    "confidenceComfort", "onboardingNotes"
  ])
};

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

const inputModes = {
  chat: {
    label: "CHAT",
    placeholder: "Ask Apex Analytic...",
    prompt: "Ask naturally. Apex will route the response style."
  },
  screen: {
    label: "SCREEN",
    placeholder: "Ask if this deal should be shortlisted...",
    prompt: "Screening mode: include area, price, rent, and concern if you have them."
  },
  compare: {
    label: "COMPARE",
    placeholder: "Compare two projects, areas, or deals...",
    prompt: "Comparison mode: name both options and the decision you need."
  },
  offer: {
    label: "OFFER",
    placeholder: "Prepare offer, negotiation, or walk-away price...",
    prompt: "Offer mode: Apex will focus on price proof, leverage, and walk-away rule."
  },
  checklist: {
    label: "CHECKLIST",
    placeholder: "Ask for a checklist or next action list...",
    prompt: "Checklist mode: Apex will convert the answer into action items."
  },
  voice: {
    label: "VOICE",
    placeholder: "Ask for a short voice-safe answer...",
    prompt: "Voice mode: Apex will keep the spoken answer compact."
  }
};

function detectInputMode(value) {
  const text = String(value || "").toLowerCase();
  if (!text.trim()) return { id: "chat", ...inputModes.chat };
  if (/\b(compare|comparison|versus| vs |which one|option a|option b|better between)\b/.test(` ${text} `)) return { id: "compare", ...inputModes.compare };
  if (/\b(offer|negotiate|negotiation|booking|walk.?away|counter.?offer|asking price|max price)\b/.test(text)) return { id: "offer", ...inputModes.offer };
  if (/\b(checklist|check list|steps|to.?do|action list|what next|next actions)\b/.test(text)) return { id: "checklist", ...inputModes.checklist };
  if (/\b(voice|read|earphone|summary|short answer|brief)\b/.test(text)) return { id: "voice", ...inputModes.voice };
  if (/\b(buy|purchase|deal|invest|shortlist|screen|condo|apartment|property|rent|rental|yield|price)\b/.test(text)) return { id: "screen", ...inputModes.screen };
  return { id: "chat", ...inputModes.chat };
}

function updateInputModeHint(value = chatInput.value) {
  const mode = detectInputMode(value);
  if (inputModeHint) {
    inputModeHint.textContent = mode.label;
    inputModeHint.title = mode.prompt;
  }
  chatForm.dataset.inputMode = mode.id;
  chatForm.setAttribute("aria-label", mode.prompt);
  chatInput.placeholder = mode.placeholder;
  renderExperienceLock();
  return mode;
}

function voiceSafeText(value) {
  const text = brandVisibleText(value).replace(/\s+/g, " ").trim();
  if (text.length <= 520) return text;
  const sentences = text.match(/[^.!?]+[.!?]?/g) || [text];
  let spoken = "";
  for (const sentence of sentences) {
    const next = `${spoken} ${sentence}`.trim();
    if (next.length > 420) break;
    spoken = next;
  }
  return `${spoken || text.slice(0, 420)} Full answer is on screen.`;
}

const responseFeedbackOptions = [
  { id: "useful", label: "Useful", note: "Keep this answer shape." },
  { id: "shorter", label: "Shorter", note: "Make future answers shorter and lead with the decision." },
  { id: "warmer", label: "Less formal", note: "Make future answers more natural and mentor-like." },
  { id: "evidence", label: "More proof", note: "Add clearer missing evidence and verification steps." }
];

function readResponseFeedback() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(responseFeedbackKey) || "[]");
    return Array.isArray(parsed) ? parsed.slice(0, 12) : [];
  } catch {
    return [];
  }
}

function writeResponseFeedback(items = []) {
  window.localStorage.setItem(responseFeedbackKey, JSON.stringify(items.slice(0, 12)));
}

function responseFeedbackSummary() {
  const items = readResponseFeedback();
  if (!items.length) return "";
  const latest = items[0];
  const counts = responseFeedbackOptions
    .map((option) => {
      const count = items.filter((item) => item.value === option.id).length;
      return count ? `${option.label}: ${count}` : "";
    })
    .filter(Boolean)
    .join(", ");
  return [
    latest?.note ? `Latest feedback: ${latest.note}` : "",
    counts ? `Recent feedback pattern: ${counts}.` : ""
  ].filter(Boolean).join(" ");
}

function responseFeedbackMarkup(messageId) {
  if (!messageId) return "";
  const selected = readResponseFeedback().find((item) => item.messageId === messageId)?.value || "";
  return `
    <section class="responseFeedback" data-feedback-message="${escapeHtml(messageId)}" aria-label="Answer feedback">
      <span>Answer feel</span>
      ${responseFeedbackOptions.map((option) => `
        <button type="button" data-response-feedback="${escapeHtml(option.id)}" class="${selected === option.id ? "active" : ""}">
          ${escapeHtml(option.label)}
        </button>
      `).join("")}
      <button type="button" data-response-refine hidden>REFINE NOW</button>
    </section>
  `;
}

function responseRefinementPrompt(feedback = {}) {
  const answer = brandVisibleText(feedback.refinementSource || feedback.answer || "").replace(/\s+/g, " ").trim();
  if (!answer || feedback.value === "useful") return "";
  if (feedback.value === "shorter") {
    return `Rewrite your previous answer into a short Apex answer: verdict, strongest reason, main risk, and next action only. Keep the same investment judgment unless new evidence is provided. Previous answer: ${answer}`;
  }
  if (feedback.value === "warmer") {
    return `Rewrite your previous answer in a more natural mentor-like tone. Keep it human, direct, and calm. Do not weaken the evidence standard or change the verdict. Previous answer: ${answer}`;
  }
  if (feedback.value === "evidence") {
    return `For your previous answer, give me the missing-proof checklist only. Separate hard stop, verify next, and optional evidence. Do not change the verdict without new evidence. Previous answer: ${answer}`;
  }
  return "";
}

function setResponseRefinement(panel, feedback) {
  const refineButton = panel?.querySelector("[data-response-refine]");
  if (!refineButton) return;
  const prompt = responseRefinementPrompt(feedback);
  refineButton.hidden = !prompt;
  refineButton.disabled = false;
  refineButton.setAttribute("data-refinement-prompt", prompt);
  refineButton.textContent = feedback?.value === "evidence" ? "PROOF CHECK" : "REFINE NOW";
}

function hydrateResponseFeedback(message) {
  message.querySelectorAll("[data-feedback-message]").forEach((panel) => {
    const messageId = panel.getAttribute("data-feedback-message") || "";
    const feedback = readResponseFeedback().find((item) => item.messageId === messageId);
    if (feedback) setResponseRefinement(panel, feedback);
  });
}

async function syncResponseFeedback(feedback) {
  if (!authenticatedUser) return;
  try {
    const payload = await requestJson("/api/memory/answer-style", {
      method: "POST",
      body: JSON.stringify(feedback)
    });
    if (payload?.stored && !memoryPanel.hidden) {
      renderMemorySettings(payload.settings || {});
    }
  } catch {
    // Local response feedback still works if account memory is unavailable.
  }
}

function handleResponseFeedback(button) {
  const panel = button.closest("[data-feedback-message]");
  if (!panel) return;
  const messageId = panel.getAttribute("data-feedback-message") || "";
  const value = button.getAttribute("data-response-feedback") || "";
  const option = responseFeedbackOptions.find((item) => item.id === value);
  if (!messageId || !option) return;
  const answer = brandVisibleText(panel.closest(".message")?.querySelector(".messageText")?.textContent || "").replace(/\s+/g, " ").trim();
  const feedback = {
    messageId,
    value,
    label: option.label,
    note: option.note,
    answer: answer.slice(0, 180),
    refinementSource: answer.slice(0, 900),
    createdAt: new Date().toISOString()
  };
  const nextItems = [
    feedback,
    ...readResponseFeedback().filter((item) => item.messageId !== messageId)
  ];
  writeResponseFeedback(nextItems);
  panel.querySelectorAll("[data-response-feedback]").forEach((item) => {
    item.classList.toggle("active", item === button);
  });
  setResponseRefinement(panel, feedback);
  renderExperienceLock();
  setSystemState("System ready", `Feedback saved. ${option.note}`);
  void syncResponseFeedback(feedback);
}

async function handleResponseRefine(button) {
  const prompt = button.getAttribute("data-refinement-prompt") || "";
  if (!prompt) return;
  button.disabled = true;
  try {
    await submitQuestion(prompt);
  } finally {
    button.disabled = false;
  }
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
  billingGuardrail.hidden = !signedIn;
  authTitle.textContent = signedIn ? "ACCOUNT" : authMode === "register" ? "CREATE ACCOUNT" : "SIGN IN";
  if (!signedIn) {
    closeMemoryPanel();
    closeReportsPanel();
    closeJournalPanel();
    closeOwnerIntelligencePanel();
    closeOwnerMarketPanel();
    closeOwnerCasePanel();
    closeOwnerEvidencePanel();
    closeTrustPanel();
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
  renderDealJourney();
}

function openAuthPanel() {
  closeMemoryPanel();
  closeReportsPanel();
  closeJournalPanel();
  closeOwnerIntelligencePanel();
  closeOwnerMarketPanel();
  closeOwnerCasePanel();
  closeOwnerEvidencePanel();
  closeTrustPanel();
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

function closeTrustPanel() {
  trustPanel.hidden = true;
  trustToggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("trustOpen");
  pendingTrustAction = "";
  renderTrustAcceptance();
}

function openTrustPanel(action = "") {
  pendingTrustAction = action;
  closeAuthPanel();
  closeMemoryPanel();
  closeReportsPanel();
  closeJournalPanel();
  closeOwnerIntelligencePanel();
  closeOwnerMarketPanel();
  closeOwnerCasePanel();
  closeOwnerEvidencePanel();
  closeShortlistPanel();
  collapseContextPanels();
  trustPanel.hidden = false;
  trustToggle.setAttribute("aria-expanded", "true");
  document.body.classList.add("trustOpen");
  renderTrustAcceptance();
}

function readTrustBoundary() {
  try {
    return JSON.parse(window.localStorage.getItem(trustBoundaryKey) || "null") || null;
  } catch {
    window.localStorage.removeItem(trustBoundaryKey);
    return null;
  }
}

function hasAcceptedTrustBoundary() {
  return readTrustBoundary()?.version === "v6.1";
}

function renderTrustAcceptance() {
  const accepted = hasAcceptedTrustBoundary();
  trustAcceptance.dataset.state = accepted ? "accepted" : "pending";
  trustAcceptanceTitle.textContent = accepted ? "Boundary acknowledged" : "Acknowledgement required";
  trustAcceptanceDetail.textContent = accepted
    ? "Formal deal reports can run on this device. Professional review and live evidence still apply."
    : pendingTrustAction === "deal-analysis"
      ? "Accept this boundary to continue with the formal deal report."
      : "You can chat freely. Deal reports require this boundary to be accepted first.";
  trustAccept.textContent = accepted
    ? "ACKNOWLEDGED"
    : pendingTrustAction === "deal-analysis" ? "ACCEPT & ANALYSE" : "I UNDERSTAND";
  trustAccept.disabled = accepted && !pendingTrustAction;
}

function acceptTrustBoundary() {
  window.localStorage.setItem(trustBoundaryKey, JSON.stringify({
    version: "v6.1",
    acceptedAt: new Date().toISOString(),
    scope: "formal-deal-reports"
  }));
  const action = pendingTrustAction;
  pendingTrustAction = "";
  renderTrustAcceptance();
  renderExperienceLock();
  setSystemState("System ready", "Trust boundary acknowledged.");
  if (action === "deal-analysis") {
    closeTrustPanel();
    void runDealAnalysis();
  }
}

function requireTrustBoundary(action) {
  if (hasAcceptedTrustBoundary()) return true;
  openTrustPanel(action);
  setSystemState("Trust boundary", "Acknowledge Apex's role before generating a formal report.");
  return false;
}

function trustBoundaryDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-MY", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function trustBoundaryStamp() {
  const accepted = readTrustBoundary();
  const isAccepted = accepted?.version === "v6.1";
  const acceptedAt = trustBoundaryDate(accepted?.acceptedAt);
  return {
    status: isAccepted ? "accepted" : "pending",
    label: isAccepted ? "BOUNDARY ACCEPTED" : "BOUNDARY PENDING",
    detail: isAccepted
      ? `Accepted ${acceptedAt || "on this device"}. Apex is decision support only; live proof and professional review still apply.`
      : "Apex is decision support only. Acknowledge the trust boundary before generating new formal reports.",
    checks: [
      "Not legal, valuation, tax, banking, or financial-planning advice",
      "Verify completed transactions, achieved rent, financing, title/legal, site, and supply evidence",
      "No validation of false documents, hidden cashback, misleading prices, or lender deception"
    ]
  };
}

function trustStampMarkup() {
  const stamp = trustBoundaryStamp();
  return `
    <section class="analysisTrustStamp ${escapeHtml(stamp.status)}" aria-label="Report trust boundary">
      <header><small>V6.2 REPORT TRUST STAMP</small><b>${escapeHtml(stamp.label)}</b></header>
      <p>${escapeHtml(stamp.detail)}</p>
      <div>${stamp.checks.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
    </section>
  `;
}

function trustStampText() {
  const stamp = trustBoundaryStamp();
  return [
    "Report trust boundary:",
    `- ${stamp.label}: ${stamp.detail}`,
    ...stamp.checks.map((item) => `- ${item}`)
  ];
}

function reviewLaneStatus(section = {}, riskText = "", keywords = []) {
  const score = Number(section.score || 0);
  const status = String(section.status || "").toLowerCase();
  const hasRisk = keywords.some((keyword) => riskText.includes(keyword));
  if (hasRisk || !score || score < 55 || /missing|weak|danger|fail|reject/.test(status)) return "required";
  if (score < 75 || /watch|review|partial|unknown/.test(status)) return "verify";
  return "ready";
}

function professionalReviewPack(analysis = {}) {
  const list = (value) => Array.isArray(value) ? value : value ? [value] : [];
  const riskText = [
    ...list(analysis.hardStops),
    ...list(analysis.recommendationBlockers),
    ...list(analysis.missingEvidence),
    analysis.counterThesis || ""
  ].join(" ").toLowerCase();
  const readinessScore = Number(analysis.investorReadiness?.score || 0);
  const items = [
    {
      role: "Lawyer",
      label: "Title and transaction",
      status: reviewLaneStatus(analysis.legalTransactionEvidence, riskText, ["title", "caveat", "consent", "restriction", "spa", "mot", "legal"]),
      action: "Check title, caveat, restrictions, consent timeline, SPA conditions, outstanding charges, and transaction authority."
    },
    {
      role: "Banker",
      label: "Financing and valuation",
      status: reviewLaneStatus(analysis.financingValuationEvidence, riskText, ["loan", "valuation", "financing", "dsr", "bank", "cashback", "cash out"]),
      action: "Confirm valuation support, loan margin, DSR, disbursement timing, and that the structure does not mislead the lender."
    },
    {
      role: "Valuer / comparable proof",
      label: "Entry price evidence",
      status: reviewLaneStatus(analysis.transactionComparableEvidence, riskText, ["transaction", "comparable", "auction", "price", "value"]),
      action: "Verify completed subsale and successful auction comparables. Listing prices should not be treated as proof."
    },
    {
      role: "Management / JMB",
      label: "Site and building quality",
      status: reviewLaneStatus(analysis.siteManagementEvidence, riskText, ["management", "jmb", "lift", "leak", "defect", "resident", "site"]),
      action: "Check arrears, lift waiting time, cleanliness, defect pattern, management response, resident behaviour, and site feel."
    },
    {
      role: "Rental agent / property manager",
      label: "Achieved rent and tenant demand",
      status: reviewLaneStatus(analysis.achievedRentalEvidence, riskText, ["rent", "tenant", "vacancy", "furnishing", "rental"]),
      action: "Verify achieved rent, tenant profile, vacancy pressure, furnishing scope, and whether rent can cover recurring holding cost."
    },
    {
      role: "Owner / licensed adviser",
      label: "Personal affordability",
      status: readinessScore >= 75 ? "ready" : readinessScore >= 55 ? "verify" : "required",
      action: "Stress-test cash reserve, instalment comfort, life commitments, tax and transaction costs, renovation budget, and holding period."
    }
  ];
  const required = items.filter((item) => item.status === "required").length;
  const verify = items.filter((item) => item.status === "verify").length;
  return {
    status: required ? "required" : verify ? "verify" : "ready",
    summary: required
      ? `${required} professional review lane${required === 1 ? "" : "s"} need attention before commitment.`
      : verify ? `${verify} review lane${verify === 1 ? "" : "s"} should be verified before money moves.`
        : "Core professional review lanes look ready, subject to live evidence.",
    items
  };
}

function professionalReviewMarkup(analysis = {}) {
  const pack = professionalReviewPack(analysis);
  return `
    <section class="analysisProfessionalReview ${escapeHtml(pack.status)}" aria-label="Professional review checklist">
      <header><span><small>V6.3 PROFESSIONAL REVIEW</small><b>${escapeHtml(pack.summary)}</b></span></header>
      <div>
        ${pack.items.map((item) => `
          <article class="professionalReviewItem ${escapeHtml(item.status)}">
            <i>${escapeHtml(item.status)}</i>
            <span><b>${escapeHtml(item.role)} / ${escapeHtml(item.label)}</b><small>${escapeHtml(item.action)}</small></span>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function professionalReviewText(analysis = {}) {
  const pack = professionalReviewPack(analysis);
  return [
    "Professional review checklist:",
    `- ${pack.summary}`,
    ...pack.items.map((item) => `- ${item.role} / ${item.label} / ${item.status}: ${item.action}`)
  ];
}

function textArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
}

function analysisRiskText(analysis = {}) {
  return [
    ...textArray(analysis.hardStops),
    ...textArray(analysis.recommendationBlockers),
    ...textArray(analysis.watchouts),
    ...textArray(analysis.missingEvidence),
    analysis.counterThesis,
    analysis.challengeMode?.message,
    analysis.legalTransactionEvidence?.summary,
    analysis.legalTransactionEvidence?.transactionPosition,
    analysis.financingValuationEvidence?.summary,
    analysis.financingValuationEvidence?.affordabilityPosition,
    analysis.siteManagementEvidence?.summary
  ].filter(Boolean).join(" ").toLowerCase();
}

function unsafeEvidenceStatus(section = {}) {
  const status = String(section.status || "").toLowerCase();
  const score = Number(section.score || 0);
  return /unsafe|danger|blocked|fail|reject/.test(status) || (score > 0 && score < 25);
}

function complianceRefusalMode(analysis = {}) {
  const text = analysisRiskText(analysis);
  const flags = [];
  const add = (level, label, action) => {
    if (!flags.some((item) => item.label === label)) flags.push({ level, label, action });
  };

  if (/marked.?up|mark.?up|hidden cashback|cashback|cash back|false document|fake document|mislead|lender deception|side agreement|side payment|direct payment|outside stakeholder|bypass/.test(text)) {
    add("refuse", "Misleading financing or fund-flow risk", "Apex will not validate artificial pricing, hidden cashback, false documents, side agreements, or lender deception.");
  }
  if (unsafeEvidenceStatus(analysis.legalTransactionEvidence) || /caveat|title risk|seller authority|probate|bankrupt|litigation|restriction|consent|stakeholder/.test(text)) {
    add("refuse", "Legal, title, or seller-authority stop", "Pause until the lawyer clears title, caveat, restrictions, seller authority, stakeholder flow, arrears, and completion path.");
  }
  if (unsafeEvidenceStatus(analysis.financingValuationEvidence) || /valuation mismatch|loan rejection|dsr|overleverage|bankability|loan margin/.test(text)) {
    add("block", "Bankability or affordability risk", "Do not force the financing. Confirm valuation support, DSR, cash buffer, instalment stress, and clean document readiness.");
  }
  if (/bulk purchase|bulk-purchase|many auction|auction cases|investor concentration|airbnb|short.?stay/.test(text)) {
    add("block", "Bulk-purchase or investor-concentration risk", "Treat the project as exit-sensitive until ownership mix, auction pressure, resident quality, and rental sustainability are proven.");
  }
  if (unsafeEvidenceStatus(analysis.siteManagementEvidence) || /management dispute|jmb|self interest|leak|defect|resident behaviour|poor management/.test(text)) {
    add("block", "Project quality or management risk", "Do not let cheap entry override poor management, defects, resident issues, or weak site evidence.");
  }
  if (String(analysis.verdict || "").toUpperCase() === "REJECT" || textArray(analysis.hardStops).length) {
    add("refuse", "Hard stop triggered", "Resolve or walk away from hard stops before paying, signing, or committing further capital.");
  }

  const refusalCount = flags.filter((item) => item.level === "refuse").length;
  const status = refusalCount ? "refuse" : flags.length ? "block" : "clear";
  return {
    status,
    label: status === "refuse" ? "APEX REFUSES VALIDATION" : status === "block" ? "VALIDATION BLOCKED" : "NO UNSAFE STRUCTURE DETECTED",
    summary: status === "refuse"
      ? "Apex will not validate this deal as structured. Independent legal, financing, and transaction review must clear the issue first."
      : status === "block"
        ? "Apex cannot support commitment yet. Clear the blocked compliance or evidence lane before treating the deal as investable."
        : "No compliance-refusal pattern is detected from the supplied inputs. This is not legal clearance.",
    flags: flags.length ? flags : [{
      level: "clear",
      label: "Boundary still applies",
      action: "Continue to verify live evidence, professional review, and clean financing or legal structure before committing."
    }]
  };
}

function complianceRefusalMarkup(analysis = {}) {
  const mode = complianceRefusalMode(analysis);
  return `
    <section class="analysisComplianceRefusal ${escapeHtml(mode.status)}" aria-label="Unsafe deal and compliance boundary">
      <header><span><small>V6.4 UNSAFE DEAL BOUNDARY</small><b>${escapeHtml(mode.label)}</b></span></header>
      <p>${escapeHtml(mode.summary)}</p>
      <div>
        ${mode.flags.map((item) => `
          <article class="complianceFlag ${escapeHtml(item.level)}">
            <i>${escapeHtml(item.level)}</i>
            <span><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.action)}</small></span>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function complianceRefusalText(analysis = {}) {
  const mode = complianceRefusalMode(analysis);
  return [
    "Unsafe deal boundary:",
    `- ${mode.label}: ${mode.summary}`,
    ...mode.flags.map((item) => `- ${item.level}: ${item.label}. ${item.action}`)
  ];
}

function commercialGuardrail(analysis = {}) {
  const compliance = complianceRefusalMode(analysis);
  const confidence = Number(analysis.confidence || 0);
  const score = Number(analysis.averageScore || 0);
  const paidPlan = Boolean(authenticatedUser && billingState?.plan?.id && billingState.plan.id !== "free");
  const planName = authenticatedUser ? billingState?.plan?.name || "Signed-in plan" : "Guest / public";
  const status = compliance.status === "refuse"
    ? "blocked"
    : compliance.status === "block" || confidence < 50 || score < 55
      ? "conditional"
      : confidence >= 75 && score >= 70
        ? "higher"
        : "moderate";
  return {
    status,
    label: status === "blocked" ? "Do Not Market As Investable" : status === "conditional" ? "Conditional Public Confidence" : status === "higher" ? "Higher Confidence, Still Conditional" : "Moderate Public Confidence",
    planName,
    summary: status === "blocked"
      ? "This report should be treated as a refusal or unresolved-risk record, not a sales or investment endorsement."
      : "Public confidence is limited by evidence quality, hard-stop status, and professional review. Payment status never upgrades a verdict.",
    items: [
      {
        label: "Payment boundary",
        body: `${paidPlan ? `${planName} unlocks more workflow capacity.` : `${planName} access may be limited.`} Plans affect report access, saved history, and usage limits only; they never improve scores or remove hard stops.`
      },
      {
        label: "Confidence source",
        body: `Confidence is ${confidence || 0}% and decision score is ${score || 0}/100 because of supplied evidence, not because of account status or payment.`
      },
      {
        label: "Public use",
        body: "Do not present this report as guaranteed return, valuation, legal clearance, loan approval, or personalized licensed financial advice."
      }
    ]
  };
}

function commercialGuardrailMarkup(analysis = {}) {
  const guardrail = commercialGuardrail(analysis);
  return `
    <section class="analysisCommercialGuardrail ${escapeHtml(guardrail.status)}" aria-label="Public confidence and monetization guardrails">
      <header><span><small>V6.5 PUBLIC CONFIDENCE</small><b>${escapeHtml(guardrail.label)}</b></span><em>${escapeHtml(guardrail.planName)}</em></header>
      <p>${escapeHtml(guardrail.summary)}</p>
      <div>
        ${guardrail.items.map((item) => `
          <article class="commercialGuardrailItem">
            <b>${escapeHtml(item.label)}</b>
            <small>${escapeHtml(item.body)}</small>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function commercialGuardrailText(analysis = {}) {
  const guardrail = commercialGuardrail(analysis);
  return [
    "Public confidence and monetization guardrails:",
    `- ${guardrail.label} / ${guardrail.planName}: ${guardrail.summary}`,
    ...guardrail.items.map((item) => `- ${item.label}: ${item.body}`)
  ];
}

function developmentEvidenceStatus(values = [], riskPattern = /reject|weak|poor|high threat|serious|many|stale|delay|dispute|bad|none|not done|not supplied/i) {
  const supplied = values.filter((value) => String(value || "").trim());
  if (!supplied.length) return "missing";
  return supplied.some((value) => riskPattern.test(String(value))) ? "watch" : "ready";
}

function compactValueList(values = [], fallback = "Not supplied") {
  const supplied = values.filter((value) => String(value || "").trim());
  return supplied.length ? supplied.join(" / ") : fallback;
}

function developmentProfile(analysis = {}) {
  const deal = analysis.context?.dealCard || {};
  const market = analysis.marketIntelligence || {};
  const observations = Array.isArray(market.observations) ? market.observations : [];
  const trends = Array.isArray(market.trends) ? market.trends : [];
  const summary = market.summary || {};
  const identity = {
    project: deal.projectName || "Project not specified",
    area: deal.area || "Area not specified",
    segment: compactValueList([deal.propertyType, deal.propertyAge ? `${deal.propertyAge} years` : ""], "Segment not supplied"),
    tenure: compactValueList([deal.tenure, deal.legalTitleType], "Tenure/title not supplied"),
    price: compactValueList([deal.askingPrice, deal.conservativeFairValue ? `value ${deal.conservativeFairValue}` : ""], "Price/value not supplied")
  };
  const evidence = [
    {
      label: "Owner observations",
      value: observations.length ? `${observations.length} matched, ${trends.length} trend${trends.length === 1 ? "" : "s"}` : "No matched project memory",
      status: observations.length ? "ready" : "missing",
      action: observations.length
        ? "Use the observations as project memory, but check dates and source confidence."
        : "Add dated owner observations for rent, transaction, occupancy, management, supply, auction, or buyer enquiry."
    },
    {
      label: "Supply moat",
      value: compactValueList([deal.supplyRadius, deal.substituteCount, deal.substituteThreat, deal.futureSupplyTiming, deal.unsoldStockSignal, deal.densityLiftStress, deal.nearbySupply]),
      status: developmentEvidenceStatus([deal.substituteThreat, deal.futureSupplyTiming, deal.unsoldStockSignal, deal.densityLiftStress, deal.nearbySupply], /high|serious|many|oversupply|vp|unsold|lift|wait|dense|1\.5k/i),
      action: "Track closest substitutes within 2.5km, VP timing, unsold stock, layout overlap, and lift/density pressure."
    },
    {
      label: "Management culture",
      value: compactValueList([deal.managementQuality, deal.managementResponseSignal, deal.arrearsJmbSignal, deal.residentBehaviourSignal, deal.siteManagementNotes]),
      status: developmentEvidenceStatus([deal.managementQuality, deal.managementResponseSignal, deal.arrearsJmbSignal, deal.residentBehaviourSignal, deal.siteManagementNotes], /poor|slow|no reply|arrears|dispute|complaint|bad|leak|defect|arrogant|irresponsible/i),
      action: "Verify JMB response speed, arrears, resident behaviour, common-area upkeep, defects, and complaint culture."
    },
    {
      label: "Buyer depth",
      value: compactValueList([deal.exitBuyerPool, deal.ownStayAppeal, deal.resalePreparation]),
      status: developmentEvidenceStatus([deal.exitBuyerPool, deal.ownStayAppeal, deal.resalePreparation], /investor only|weak|poor|narrow|airbnb|short.?stay|none/i),
      action: "Confirm the project can appeal to own-stay buyers and investors instead of one narrow exit pool."
    },
    {
      label: "Liquidity proof",
      value: compactValueList([deal.comparableTransactions, deal.comparableSource, deal.comparableRecency, deal.bankValuationSupport]),
      status: developmentEvidenceStatus([deal.comparableTransactions, deal.comparableSource, deal.comparableRecency, deal.bankValuationSupport], /none|old|stale|listing|weak|mismatch|not done/i),
      action: "Use completed subsale transactions, successful auction bids, bankability, and matched comparable adjustments before trusting value."
    },
    {
      label: "Rental defence",
      value: compactValueList([deal.expectedRent, deal.rentEvidence, deal.rentalSource, deal.rentalSustainability, deal.vacancySignal]),
      status: developmentEvidenceStatus([deal.expectedRent, deal.rentEvidence, deal.rentalSource, deal.rentalSustainability, deal.vacancySignal], /none|weak|stale|vacancy|incentive|seasonal|drop|poor/i),
      action: "Confirm achieved rent, tenant urgency, furnishing gap, vacancy pressure, and whether rent can defend the instalment."
    }
  ];
  const missingCount = evidence.filter((item) => item.status === "missing").length;
  const watchCount = evidence.filter((item) => item.status === "watch").length;
  const status = watchCount ? "watch" : missingCount >= 3 ? "thin" : missingCount ? "partial" : "tracked";
  const title = deal.projectName || deal.area || "Development profile";
  return {
    status,
    title,
    identity,
    evidence,
    observationCount: observations.length,
    trendCount: trends.length,
    freshness: summary.warning || (observations.length ? "Owner observations matched. Verify freshness before relying on them." : "No dated owner observation matched this project or area yet."),
    summary: status === "watch"
      ? "Development intelligence has live warning signals. Treat the project profile as a watchlist item until the weak lane is cleared."
      : status === "tracked"
        ? "Development intelligence is well formed enough for project-level comparison, subject to live verification."
        : status === "partial"
          ? `Development intelligence is partial. Fill the missing lane${missingCount === 1 ? "" : "s"} before treating the project view as mature.`
          : "Development intelligence is still thin. Apex can screen the deal, but it should not behave like it knows the project deeply yet."
  };
}

function developmentProfileMarkup(analysis = {}) {
  const profile = developmentProfile(analysis);
  const identityEntries = [
    ["Project", profile.identity.project],
    ["Area", profile.identity.area],
    ["Segment", profile.identity.segment],
    ["Tenure/title", profile.identity.tenure],
    ["Price/value", profile.identity.price]
  ];
  return `
    <section class="analysisDevelopmentProfile ${escapeHtml(profile.status)}" aria-label="Development intelligence profile">
      <header>
        <span><small>V7.0 DEVELOPMENT PROFILE</small><b>${escapeHtml(profile.title)}</b></span>
        <em>${escapeHtml(profile.status)}</em>
      </header>
      <p>${escapeHtml(profile.summary)}</p>
      <div class="developmentIdentity">
        ${identityEntries.map(([label, value]) => `
          <span><small>${escapeHtml(label)}</small><b>${escapeHtml(value)}</b></span>
        `).join("")}
      </div>
      <div class="developmentProfileSignals">
        ${profile.evidence.map((item) => `
          <article class="developmentProfileSignal ${escapeHtml(item.status)}">
            <i>${escapeHtml(item.status)}</i>
            <span><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.value)}</small><em>${escapeHtml(item.action)}</em></span>
          </article>
        `).join("")}
      </div>
      <p class="developmentFreshness">${escapeHtml(profile.freshness)}</p>
    </section>
  `;
}

function developmentProfileText(analysis = {}) {
  const profile = developmentProfile(analysis);
  return [
    "Development intelligence profile:",
    `- V7.0 ${profile.title} / ${profile.status}: ${profile.summary}`,
    `- Identity: ${profile.identity.project}; ${profile.identity.area}; ${profile.identity.segment}; ${profile.identity.tenure}; ${profile.identity.price}.`,
    `- Freshness: ${profile.freshness}`,
    ...profile.evidence.map((item) => `- ${item.label} / ${item.status}: ${item.value}. ${item.action}`)
  ];
}

function developmentIntelligenceMarkup(section = {}) {
  if (!section.summary) return "";
  const lanes = Array.isArray(section.lanes) ? section.lanes : [];
  const actions = Array.isArray(section.actionQueue) ? section.actionQueue : [];
  const health = section.observationHealth || {};
  return `
    <section class="analysisDevelopmentStack ${escapeHtml(section.status || "thin")}" aria-label="V7 development intelligence stack">
      <header>
        <span><small>V7.1 - V7.10 DEVELOPMENT INTELLIGENCE</small><b>${escapeHtml(section.summary)}</b></span>
        <em>${escapeHtml(section.score || 0)}/100</em>
      </header>
      <div class="developmentStackMeta">
        <span><small>POSTURE</small><b>${escapeHtml(section.posture || "Build evidence first")}</b></span>
        <span><small>OWNER OBSERVATIONS</small><b>${escapeHtml(health.matched || 0)} matched / ${escapeHtml(health.fresh || 0)} fresh</b></span>
        <span><small>STALE</small><b>${escapeHtml(health.stale || 0)} stale</b></span>
      </div>
      ${lanes.length ? `
        <div class="developmentStackLanes">
          ${lanes.map((item) => `
            <article class="developmentStackLane ${escapeHtml(item.status || "watch")}">
              <i>${escapeHtml(item.version || "V7")}</i>
              <span>
                <b>${escapeHtml(item.label)} <small>${escapeHtml(item.score || 0)}/100</small></b>
                <small>${escapeHtml(item.reading)}</small>
                <em>${escapeHtml(item.action)}</em>
              </span>
            </article>
          `).join("")}
        </div>
      ` : ""}
      ${actions.length ? `
        <div class="developmentActionQueue">
          <h3>V7 ACTION QUEUE</h3>
          ${actions.map((item) => `
            <p><b>${escapeHtml(item.version)} ${escapeHtml(item.label)}</b><span>${escapeHtml(item.action)}</span></p>
          `).join("")}
        </div>
      ` : ""}
    </section>
  `;
}

function developmentIntelligenceText(section = {}) {
  if (!section.summary) return [];
  const lines = [
    "V7 development intelligence stack:",
    `- ${section.status || "thin"} (${section.score || 0}/100): ${section.summary}`,
    `- Posture: ${section.posture || "Build evidence first"}.`,
    `- Owner observations: ${section.observationHealth?.matched || 0} matched, ${section.observationHealth?.fresh || 0} fresh, ${section.observationHealth?.aging || 0} aging, ${section.observationHealth?.stale || 0} stale.`
  ];
  for (const item of section.lanes || []) {
    lines.push(`- ${item.version} ${item.label}: ${item.status}, ${item.score}/100. ${item.reading} Action: ${item.action}`);
  }
  if (section.actionQueue?.length) {
    lines.push("V7 action queue:");
    for (const item of section.actionQueue) lines.push(`- ${item.version} ${item.label}: ${item.action}`);
  }
  return lines;
}

function caseIntelligenceMarkup(section = {}) {
  if (!section.summary) return "";
  const cases = Array.isArray(section.cases) ? section.cases : [];
  const actions = Array.isArray(section.actionQueue) ? section.actionQueue : [];
  return `
    <section class="analysisCaseIntelligence ${escapeHtml(section.status || "thin")}" aria-label="Development case library intelligence">
      <header>
        <span><small>CASE LIBRARY V1</small><b>${escapeHtml(section.summary)}</b></span>
        <em>${escapeHtml(section.score || 0)}/100</em>
      </header>
      <p>${escapeHtml(section.posture || "Case-informed, verify live")}</p>
      ${cases.length ? `
        <div class="caseIntelligenceCards">
          ${cases.map((item) => `
            <article class="caseIntelligenceItem ${escapeHtml(item.verdict || "watch")}">
              <header><span><small>${escapeHtml([item.area, item.propertyType].filter(Boolean).join(" / ") || "Development case")}</small><b>${escapeHtml(item.projectName)}</b></span><em>${escapeHtml(ownerCaseVerdictText(item.verdict))} / ${escapeHtml(item.confidence || "medium")}</em></header>
              <p>${escapeHtml(item.ownerVerdict || item.summary || "No founder verdict recorded.")}</p>
              <div>
                <span><small>STRENGTH</small><b>${escapeHtml(item.strengths || "Not stated")}</b></span>
                <span><small>WEAKNESS</small><b>${escapeHtml(item.weaknesses || "Not stated")}</b></span>
                <span><small>SOURCE</small><b>${escapeHtml(item.sourceBasis || "Owner case note")}</b></span>
              </div>
            </article>
          `).join("")}
        </div>
      ` : ""}
      ${actions.length ? `
        <div class="caseActionQueue">
          <h3>CASE ACTION QUEUE</h3>
          ${actions.map((item) => `<p><b>${escapeHtml(item.label)}</b><span>${escapeHtml(item.action)}</span></p>`).join("")}
        </div>
      ` : ""}
    </section>
  `;
}

function caseIntelligenceText(section = {}) {
  if (!section.summary) return [];
  const lines = [
    "Development case library:",
    `- ${section.status || "thin"} (${section.score || 0}/100): ${section.summary}`,
    `- Posture: ${section.posture || "Case-informed, verify live"}.`
  ];
  for (const item of section.cases || []) {
    lines.push(`- ${item.projectName}: ${ownerCaseVerdictText(item.verdict)} / ${item.confidence || "medium"} confidence / ${item.rating || 0}/100. ${item.ownerVerdict || item.summary || ""}`);
  }
  if (section.actionQueue?.length) {
    lines.push("Case action queue:");
    for (const item of section.actionQueue) lines.push(`- ${item.label}: ${item.action}`);
  }
  return lines;
}

function documentIntelligenceMarkup(section = {}) {
  if (!section.summary) return "";
  const lanes = Array.isArray(section.lanes) ? section.lanes : [];
  const matches = Array.isArray(section.matchedEvidence) ? section.matchedEvidence : [];
  const actions = Array.isArray(section.actionQueue) ? section.actionQueue : [];
  const health = section.vaultHealth || {};
  return `
    <section class="analysisDocumentStack ${escapeHtml(section.status || "thin")}" aria-label="V8 document intelligence stack">
      <header>
        <span><small>V8.1 - V8.10 DOCUMENT INTELLIGENCE</small><b>${escapeHtml(section.summary)}</b></span>
        <em>${escapeHtml(section.score || 0)}/100</em>
      </header>
      <div class="documentStackMeta">
        <span><small>POSTURE</small><b>${escapeHtml(section.posture || "Evidence-building mode")}</b></span>
        <span><small>VAULT</small><b>${escapeHtml(health.documents || 0)} docs / ${escapeHtml(health.indexed || 0)} indexed</b></span>
        <span><small>MATCHED</small><b>${escapeHtml(health.matched || 0)} docs / ${escapeHtml(health.mode || "none")}</b></span>
      </div>
      ${lanes.length ? `
        <div class="documentStackLanes">
          ${lanes.map((item) => `
            <article class="documentStackLane ${escapeHtml(item.status || "watch")}">
              <i>${escapeHtml(item.version || "V8")}</i>
              <span>
                <b>${escapeHtml(item.label)} <small>${escapeHtml(item.score || 0)}/100</small></b>
                <small>${escapeHtml(item.reading)}</small>
                <em>${escapeHtml(item.action)}</em>
              </span>
            </article>
          `).join("")}
        </div>
      ` : ""}
      ${matches.length ? `
        <div class="documentMatchedEvidence">
          <h3>MATCHED OWNER EVIDENCE</h3>
          ${matches.map((item) => `
            <p><b>${escapeHtml(item.title)}</b><span>${escapeHtml(item.preview)}</span><em>${escapeHtml((item.tags || []).join(", ") || "untagged")}</em></p>
          `).join("")}
        </div>
      ` : ""}
      ${actions.length ? `
        <div class="documentActionQueue">
          <h3>V8 ACTION QUEUE</h3>
          ${actions.map((item) => `
            <p><b>${escapeHtml(item.version)} ${escapeHtml(item.label)}</b><span>${escapeHtml(item.action)}</span></p>
          `).join("")}
        </div>
      ` : ""}
    </section>
  `;
}

function documentIntelligenceText(section = {}) {
  if (!section.summary) return [];
  const lines = [
    "V8 document intelligence stack:",
    `- ${section.status || "thin"} (${section.score || 0}/100): ${section.summary}`,
    `- Posture: ${section.posture || "Evidence-building mode"}.`,
    `- Vault: ${section.vaultHealth?.documents || 0} documents, ${section.vaultHealth?.indexed || 0} indexed, ${section.vaultHealth?.matched || 0} matched, ${section.vaultHealth?.mode || "none"} retrieval.`
  ];
  for (const item of section.lanes || []) {
    lines.push(`- ${item.version} ${item.label}: ${item.status}, ${item.score}/100. ${item.reading} Action: ${item.action}`);
  }
  if (section.matchedEvidence?.length) {
    lines.push("Matched owner evidence:");
    for (const item of section.matchedEvidence) lines.push(`- ${item.title}: ${item.preview}`);
  }
  if (section.actionQueue?.length) {
    lines.push("V8 action queue:");
    for (const item of section.actionQueue) lines.push(`- ${item.version} ${item.label}: ${item.action}`);
  }
  return lines;
}

function portfolioCommandMarkup(section = {}) {
  if (!section.summary) return "";
  const lanes = Array.isArray(section.lanes) ? section.lanes : [];
  const actions = Array.isArray(section.actionQueue) ? section.actionQueue : [];
  const capital = section.capitalMap || {};
  return `
    <section class="analysisPortfolioCommand ${escapeHtml(section.status || "hold")}" aria-label="V9 portfolio command stack">
      <header>
        <span><small>V9.1 - V9.10 PORTFOLIO COMMAND</small><b>${escapeHtml(section.summary)}</b></span>
        <em>${escapeHtml(section.score || 0)}/100</em>
      </header>
      <div class="portfolioCommandMeta">
        <span><small>POSTURE</small><b>${escapeHtml(section.posture || "Hold and verify")}</b></span>
        <span><small>NEXT MOVE</small><b>${escapeHtml(section.nextMove || "Clear weakest lane")}</b></span>
        <span><small>ROLE</small><b>${escapeHtml(capital.portfolioRole || "Not stated")}</b></span>
      </div>
      <div class="portfolioCapitalMap">
        <span><small>CASH</small><b>${escapeHtml(capital.cashAvailable || "Not stated")}</b></span>
        <span><small>OUTLAY</small><b>${escapeHtml(capital.cashOutlay || "Not stated")}</b></span>
        <span><small>AFTER PURCHASE</small><b>${escapeHtml(capital.cashAfterPurchase || "Not calculated")}</b></span>
        <span><small>DSR</small><b>${escapeHtml(capital.postDealDsr || "Not calculated")}</b></span>
        <span><small>HOLDING</small><b>${escapeHtml(capital.holdingCashFlow || "Not calculated")}</b></span>
        <span><small>STRESS</small><b>${escapeHtml(capital.stressedHolding || "Not calculated")}</b></span>
      </div>
      ${lanes.length ? `
        <div class="portfolioCommandLanes">
          ${lanes.map((item) => `
            <article class="portfolioCommandLane ${escapeHtml(item.status || "watch")}">
              <i>${escapeHtml(item.version || "V9")}</i>
              <span>
                <b>${escapeHtml(item.label)} <small>${escapeHtml(item.score || 0)}/100</small></b>
                <small>${escapeHtml(item.reading)}</small>
                <em>${escapeHtml(item.action)}</em>
              </span>
            </article>
          `).join("")}
        </div>
      ` : ""}
      ${actions.length ? `
        <div class="portfolioCommandQueue">
          <h3>V9 ACTION QUEUE</h3>
          ${actions.map((item) => `
            <p><b>${escapeHtml(item.version)} ${escapeHtml(item.label)}</b><span>${escapeHtml(item.action)}</span></p>
          `).join("")}
        </div>
      ` : ""}
    </section>
  `;
}

function portfolioCommandText(section = {}) {
  if (!section.summary) return [];
  const capital = section.capitalMap || {};
  const lines = [
    "V9 portfolio command stack:",
    `- ${section.status || "hold"} (${section.score || 0}/100): ${section.summary}`,
    `- Posture: ${section.posture || "Hold and verify"}.`,
    `- Next move: ${section.nextMove || "Clear the weakest portfolio lane."}`,
    `- Capital map: cash ${capital.cashAvailable || "n/a"}, outlay ${capital.cashOutlay || "n/a"}, after purchase ${capital.cashAfterPurchase || "n/a"}, reserve ${capital.reserveMonths || "n/a"}, DSR ${capital.postDealDsr || "n/a"}, holding ${capital.holdingCashFlow || "n/a"}, stress ${capital.stressedHolding || "n/a"}.`
  ];
  for (const item of section.lanes || []) {
    lines.push(`- ${item.version} ${item.label}: ${item.status}, ${item.score}/100. ${item.reading} Action: ${item.action}`);
  }
  if (section.actionQueue?.length) {
    lines.push("V9 action queue:");
    for (const item of section.actionQueue) lines.push(`- ${item.version} ${item.label}: ${item.action}`);
  }
  return lines;
}

function finalCommandMarkup(section = {}) {
  if (!section.summary) return "";
  const lanes = Array.isArray(section.lanes) ? section.lanes : [];
  const actions = Array.isArray(section.actionQueue) ? section.actionQueue : [];
  const contradictions = Array.isArray(section.contradictions) ? section.contradictions : [];
  return `
    <section class="analysisFinalCommand ${escapeHtml(section.status || "investigate")}" aria-label="V10 final command stack">
      <header>
        <span><small>V10.1 - V10.10 FINAL COMMAND</small><b>${escapeHtml(section.headline || section.command || "Final command")}</b></span>
        <em>${escapeHtml(section.score || 0)}/100</em>
      </header>
      <div class="finalCommandDecision">
        <strong>${escapeHtml(section.command || "INVESTIGATE FIRST")}</strong>
        <p>${escapeHtml(section.finalAnswer || section.summary)}</p>
      </div>
      <div class="finalCommandMeta">
        <span><small>STATUS</small><b>${escapeHtml(section.status || "investigate")}</b></span>
        <span><small>NEXT MOVE</small><b>${escapeHtml(section.nextMove || "Clear weakest lane")}</b></span>
        <span><small>CONTRADICTIONS</small><b>${escapeHtml(section.contradictionCount || 0)}</b></span>
      </div>
      ${contradictions.length ? `
        <div class="finalCommandContradictions">
          <h3>CONTRADICTION SCAN</h3>
          ${contradictions.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}
        </div>
      ` : ""}
      ${lanes.length ? `
        <div class="finalCommandLanes">
          ${lanes.map((item) => `
            <article class="finalCommandLane ${escapeHtml(item.status || "watch")}">
              <i>${escapeHtml(item.version || "V10")}</i>
              <span>
                <b>${escapeHtml(item.label)} <small>${escapeHtml(item.score || 0)}/100</small></b>
                <small>${escapeHtml(item.reading)}</small>
                <em>${escapeHtml(item.action)}</em>
              </span>
            </article>
          `).join("")}
        </div>
      ` : ""}
      ${actions.length ? `
        <div class="finalCommandQueue">
          <h3>V10 ACTION QUEUE</h3>
          ${actions.map((item) => `
            <p><b>${escapeHtml(item.version)} ${escapeHtml(item.label)}</b><span>${escapeHtml(item.action)}</span></p>
          `).join("")}
        </div>
      ` : ""}
    </section>
  `;
}

function finalCommandText(section = {}) {
  if (!section.summary) return [];
  const lines = [
    "V10 final command stack:",
    `- ${section.command || "INVESTIGATE FIRST"} (${section.score || 0}/100): ${section.summary}`,
    `- Status: ${section.status || "investigate"}.`,
    `- Next move: ${section.nextMove || "Clear the weakest V10 lane."}`,
    `- Contradictions: ${section.contradictionCount || 0}.`
  ];
  for (const item of section.contradictions || []) lines.push(`- Contradiction: ${item}`);
  for (const item of section.lanes || []) {
    lines.push(`- ${item.version} ${item.label}: ${item.status}, ${item.score}/100. ${item.reading} Action: ${item.action}`);
  }
  if (section.actionQueue?.length) {
    lines.push("V10 action queue:");
    for (const item of section.actionQueue) lines.push(`- ${item.version} ${item.label}: ${item.action}`);
  }
  return lines;
}

function sourceLabel(type) {
  if (type === "memory") return "MEMORY";
  if (type === "journal") return "JOURNAL";
  if (type === "market") return "MARKET";
  if (type === "case") return "CASE";
  if (type === "saved_report") return "SAVED DEAL";
  if (type === "belief") return "BELIEF";
  if (type === "decision") return "DECISION";
  if (type === "evidence") return "EVIDENCE";
  return "REFERENCE";
}

function sourceName(source) {
  if (source?.type === "memory") return "your approved memory";
  if (source?.type === "journal") return "your decision journal";
  if (source?.type === "market") return "dated market observation";
  if (source?.type === "case") return "owner development case";
  if (source?.type === "saved_report") return "saved deal history";
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

function contextCoachMarkup(coach = {}) {
  const prompts = Array.isArray(coach.prompts) ? coach.prompts.slice(0, 4) : [];
  const missing = Array.isArray(coach.missing) ? coach.missing.slice(0, 4) : [];
  if (!prompts.length && !missing.length) return "";
  return `
    <section class="contextCoach">
      <header>
        <span><small>${escapeHtml(coach.title || "NEXT MOVES")}</small><b>${escapeHtml(coach.summary || "Choose the next question to sharpen the decision.")}</b></span>
      </header>
      ${missing.length ? `<p><b>Missing</b><span>${escapeHtml(missing.join(", "))}</span></p>` : ""}
      ${prompts.length ? `
        <div>
          ${prompts.map((prompt) => `
            <button type="button" data-coach-prompt="${escapeHtml(prompt.text)}">
              <small>${escapeHtml(prompt.kind || "question")}</small>
              <span>${escapeHtml(prompt.label)}</span>
            </button>
          `).join("")}
        </div>
      ` : ""}
    </section>
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
  const messageId = role === "jarvis"
    ? (intelligence?.message?.id || intelligence?.id || `local-${Date.now()}-${Math.random().toString(16).slice(2)}`)
    : "";
  message.className = `message ${role}`;
  message.innerHTML = `
    <strong>${role === "jarvis" ? "APEX" : "YOU"}</strong>
    ${role === "jarvis" ? intelligenceMarkup(intelligence) : ""}
    <div class="messageText">${escapeHtml(text).replace(/\n/g, "<br>")}</div>
    ${role === "jarvis" ? sourcesMarkup(sources) : ""}
    ${role === "jarvis" ? contextCoachMarkup(intelligence.contextCoach) : ""}
    ${role === "jarvis" ? responseFeedbackMarkup(messageId) : ""}
  `;
  transcript.append(message);
  if (role === "jarvis") hydrateResponseFeedback(message);
  transcript.scrollTop = transcript.scrollHeight;
}

function memoryProfileValue(label, value) {
  if (!value) return "";
  const display = Array.isArray(value) ? value.filter(Boolean).slice(0, 2).join("; ") : value;
  if (!display) return "";
  return `<span><small>${escapeHtml(label)}</small><b>${escapeHtml(display)}</b></span>`;
}

function renderMemoryProfile(profile = {}) {
  const approvedCount = Number(profile.approvedCount || 0);
  memoryProfileTitle.textContent = approvedCount
    ? `${profile.investorType || "Profile building"} / ${profile.riskStyle || "Needs more memory"}`
    : "No approved memory yet";
  memoryProfileCompleteness.textContent = `${Math.max(0, Math.min(100, Number(profile.completeness || 0)))}%`;
  memoryProfileSummary.textContent = profile.summary || "Approve memories to build a private investor profile.";
  memoryProfileDetails.innerHTML = approvedCount ? [
    memoryProfileValue("Preferred", profile.preferredAssets),
    memoryProfileValue("Avoid", profile.avoidedRisks),
    memoryProfileValue("Cash flow", profile.cashFlowRule),
    memoryProfileValue("Holding", profile.holdingPeriod),
    memoryProfileValue("Rules", profile.investmentRules),
    memoryProfileValue("Warnings", profile.personalWarnings)
  ].filter(Boolean).join("") : "";
}

function memoryItemMarkup(item) {
  const pending = item.status === "pending";
  return `
    <article class="memoryItem ${pending ? "pending" : "approved"} priority-${escapeHtml(item.reviewPriority || "normal")}" data-memory-item="${escapeHtml(item.id)}">
      <span><small>${escapeHtml(item.categoryLabel || item.category)}</small><i>${pending ? "REVIEW" : "APPROVED"}</i></span>
      <p>${escapeHtml(item.content)}</p>
      <em>${escapeHtml(item.profileImpact || "Useful context, but review before using it.")}</em>
      <div class="memoryActions">
        ${pending ? `
          <button type="button" data-memory-action="approve" data-memory-id="${escapeHtml(item.id)}">KEEP</button>
          <button type="button" data-memory-action="dismiss" data-memory-id="${escapeHtml(item.id)}">SKIP</button>
        ` : `<button type="button" data-memory-action="delete" data-memory-id="${escapeHtml(item.id)}">FORGET</button>`}
      </div>
    </article>
  `;
}

function renderMemorySettings(settings = {}) {
  const captureEnabled = Boolean(settings.captureEnabled);
  const reasoningEnabled = Boolean(settings.reasoningEnabled);
  const answerStyle = settings.answerStyle || {};
  memorySettingsLoading = true;
  memoryCaptureEnabled.checked = captureEnabled;
  memoryReasoningEnabled.checked = reasoningEnabled;
  memorySettingsLoading = false;
  const baseNotice = captureEnabled || reasoningEnabled
    ? `Memory ${captureEnabled ? "can suggest items from chat" : "will not suggest from chat"}; approved memory ${reasoningEnabled ? "can guide replies and reports" : "will not guide reasoning"}.`
    : "Memory engine ready. Collection is off.";
  const styleNotice = answerStyle.feedbackCount
    ? ` Answer style memory: ${answerStyle.latestLabel || "Learning"} (${answerStyle.feedbackCount} saved).`
    : "";
  memoryModeNotice.textContent = `${baseNotice}${styleNotice}`;
  memoryModeNotice.classList.toggle("active", captureEnabled || reasoningEnabled);
}

function renderMemory(payload = {}) {
  const items = Array.isArray(payload.items) ? payload.items : [];
  renderMemorySettings(payload.settings || payload.summary || {});
  renderMemoryProfile(payload.profile || {});
  memoryApprovedCount.textContent = String(payload.summary?.approved || 0);
  memoryPendingCount.textContent = String(payload.summary?.pending || 0);
  memoryList.innerHTML = items.length
    ? items.slice().sort((a, b) => {
      const statusOrder = { pending: 0, approved: 1 };
      return statusOrder[a.status] - statusOrder[b.status]
        || String(b.updatedAt).localeCompare(String(a.updatedAt));
    }).map(memoryItemMarkup).join("")
    : '<p class="memoryEmpty">No long-term memories yet. Auto-capture is off until you enable it, or you can add one manually above.</p>';
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
  closeOwnerIntelligencePanel();
  closeOwnerMarketPanel();
  closeOwnerCasePanel();
  closeOwnerEvidencePanel();
  closeTrustPanel();
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

async function saveMemorySettings() {
  if (memorySettingsLoading) return;
  memoryCaptureEnabled.disabled = true;
  memoryReasoningEnabled.disabled = true;
  try {
    const payload = await requestJson("/api/memory/settings", {
      method: "PATCH",
      body: JSON.stringify({
        captureEnabled: memoryCaptureEnabled.checked,
        reasoningEnabled: memoryReasoningEnabled.checked
      })
    });
    renderMemorySettings(payload.settings || {});
    setSystemState("System ready", "Memory settings updated.");
  } catch (error) {
    setSystemState("Connection issue", error.message || "Memory settings could not be updated.");
    if (!memoryPanel.hidden) await loadMemory().catch(() => {});
  } finally {
    memoryCaptureEnabled.disabled = false;
    memoryReasoningEnabled.disabled = false;
  }
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
    <span><small>${escapeHtml(item.categoryLabel || "LONG-TERM MEMORY")}</small><b>Remember this?</b></span>
    <p>${escapeHtml(item.content)}</p>
    <em>${escapeHtml(item.profileImpact || "Review this before it becomes part of your private profile.")}</em>
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
  billingGuardrail.textContent = `${status.plan.name} controls report access, storage, and usage limits only. It never changes scores, hard stops, or recommendations.`;
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
  closeOwnerIntelligencePanel();
  closeOwnerMarketPanel();
  closeOwnerCasePanel();
  closeOwnerEvidencePanel();
  closeTrustPanel();
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
  closeOwnerIntelligencePanel();
  closeOwnerMarketPanel();
  closeOwnerCasePanel();
  closeOwnerEvidencePanel();
  closeTrustPanel();
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
  renderDealJourney();
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
  closeOwnerIntelligencePanel();
  closeOwnerMarketPanel();
  closeOwnerCasePanel();
  closeOwnerEvidencePanel();
  closeTrustPanel();
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
    siteVisitAssistant: analysis.siteVisitAssistant || null,
    sourcingProfessional: analysis.sourcingProfessional || null,
    tenantRentalPlan: analysis.tenantRentalPlan || null,
    exitStrategy: analysis.exitStrategy || null,
    hardStops: analysis.hardStops || [],
    recommendationBlockers: analysis.recommendationBlockers || [],
    decisionFocus: analysis.decisionFocus || null,
    personalizedChallenge: analysis.personalizedChallenge || null,
    dealMemoryComparison: analysis.dealMemoryComparison || null,
    beliefTracker: analysis.beliefTracker || null,
    sourceTransparency: analysis.sourceTransparency || null,
    memoryConflicts: analysis.memoryConflicts || null,
    personalOperatingRules: analysis.personalOperatingRules || null,
    investorReadiness: analysis.investorReadiness || null,
    productExperience: analysis.productExperience || null,
    learningLoop: analysis.learningLoop || null,
    evidenceEngine: analysis.evidenceEngine || null,
    transactionComparableEvidence: analysis.transactionComparableEvidence || null,
    achievedRentalEvidence: analysis.achievedRentalEvidence || null,
    financingValuationEvidence: analysis.financingValuationEvidence || null,
    supplyAbsorptionEvidence: analysis.supplyAbsorptionEvidence || null,
    siteManagementEvidence: analysis.siteManagementEvidence || null,
    legalTransactionEvidence: analysis.legalTransactionEvidence || null,
    developmentIntelligence: analysis.developmentIntelligence || null,
    caseIntelligence: analysis.caseIntelligence || null,
    documentIntelligence: analysis.documentIntelligence || null,
    portfolioCommand: analysis.portfolioCommand || null,
    finalCommand: analysis.finalCommand || null,
    marketIntelligence: analysis.marketIntelligence || null,
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
    ...trustStampText(),
    "",
    ...complianceRefusalText(analysis),
    "",
    ...professionalReviewText(analysis),
    "",
    ...commercialGuardrailText(analysis),
    "",
    ...developmentProfileText(analysis),
    "",
    ...developmentIntelligenceText(analysis.developmentIntelligence),
    "",
    ...caseIntelligenceText(analysis.caseIntelligence),
    "",
    ...documentIntelligenceText(analysis.documentIntelligence),
    "",
    ...portfolioCommandText(analysis.portfolioCommand),
    "",
    ...finalCommandText(analysis.finalCommand),
    "",
    `Summary: ${analysis.summary || ""}`
  ];
  if (analysis.decisionFocus?.body) lines.push("", `${analysis.decisionFocus.label || "Decision focus"}: ${analysis.decisionFocus.body}`);
  if (analysis.investorReadiness?.label) {
    lines.push("", `Investor readiness: ${analysis.investorReadiness.label} (${analysis.investorReadiness.score || 0}/100)`);
    if (analysis.investorReadiness.summary) lines.push(analysis.investorReadiness.summary);
    for (const flag of analysis.investorReadiness.flags || []) lines.push(`- ${flag}`);
  }
  if (analysis.productExperience?.summary) {
    lines.push(
      "",
      "V5 product experience",
      `${analysis.productExperience.mode || "Balanced investor review"} (${analysis.productExperience.onboardingCompleteness || 0}% guidance complete): ${analysis.productExperience.summary}`,
      `Style: ${analysis.productExperience.explanationStyle || "Balanced explanation"}`,
      `Next best action: ${analysis.productExperience.nextBestAction || "Complete the missing guidance fields before relying on the report format."}`
    );
    for (const item of analysis.productExperience.checks || []) lines.push(`- ${item.label}: ${item.status}. ${item.action}`);
  }
  if (analysis.dimensions?.length) {
    lines.push("", "Scorecard");
    for (const item of analysis.dimensions) lines.push(`- ${item.label}: ${item.score}/100 (${item.status})`);
  }
  if (analysis.evidenceChecklist?.length) {
    lines.push("", "Evidence checklist");
    for (const item of analysis.evidenceChecklist) lines.push(`- ${item.label}: ${item.status}. ${item.action}`);
  }
  if (analysis.evidenceEngine?.summary) {
    lines.push(
      "",
      "V4.0 evidence engine",
      `${analysis.evidenceEngine.status || "unknown"} (${analysis.evidenceEngine.score || 0}/100): ${analysis.evidenceEngine.summary}`,
      `Gate: ${analysis.evidenceEngine.recommendationGate || "Evidence gate not calculated."}`
    );
    for (const item of analysis.evidenceEngine.criticalGaps || []) lines.push(`- Critical gap: ${item}`);
    for (const item of analysis.evidenceEngine.gates || []) lines.push(`- ${item.label}: ${item.status}, ${item.score}/100. ${item.action}`);
  }
  if (analysis.transactionComparableEvidence?.summary) {
    lines.push(
      "",
      "V4.1 transaction comparable evidence",
      `${analysis.transactionComparableEvidence.status || "unknown"} (${analysis.transactionComparableEvidence.score || 0}/100): ${analysis.transactionComparableEvidence.summary}`,
      `Value position: ${analysis.transactionComparableEvidence.valuePosition || "Not calculated."}`
    );
    for (const item of analysis.transactionComparableEvidence.checks || []) lines.push(`- ${item.label}: ${item.status}. ${item.action}`);
  }
  if (analysis.achievedRentalEvidence?.summary) {
    lines.push(
      "",
      "V4.2 achieved rental evidence",
      `${analysis.achievedRentalEvidence.status || "unknown"} (${analysis.achievedRentalEvidence.score || 0}/100): ${analysis.achievedRentalEvidence.summary}`,
      `Coverage: ${analysis.achievedRentalEvidence.coveragePosition || "Not calculated."}`
    );
    for (const item of analysis.achievedRentalEvidence.checks || []) lines.push(`- ${item.label}: ${item.status}. ${item.action}`);
  }
  if (analysis.financingValuationEvidence?.summary) {
    lines.push(
      "",
      "V4.3 financing and valuation evidence",
      `${analysis.financingValuationEvidence.status || "unknown"} (${analysis.financingValuationEvidence.score || 0}/100): ${analysis.financingValuationEvidence.summary}`,
      `Affordability: ${analysis.financingValuationEvidence.affordabilityPosition || "Not calculated."}`
    );
    for (const item of analysis.financingValuationEvidence.checks || []) lines.push(`- ${item.label}: ${item.status}. ${item.action}`);
  }
  if (analysis.supplyAbsorptionEvidence?.summary) {
    lines.push(
      "",
      "V4.4 supply and absorption evidence",
      `${analysis.supplyAbsorptionEvidence.status || "unknown"} (${analysis.supplyAbsorptionEvidence.score || 0}/100): ${analysis.supplyAbsorptionEvidence.summary}`,
      `Competition: ${analysis.supplyAbsorptionEvidence.competitionPosition || "Not calculated."}`
    );
    for (const item of analysis.supplyAbsorptionEvidence.checks || []) lines.push(`- ${item.label}: ${item.status}. ${item.action}`);
  }
  if (analysis.siteManagementEvidence?.summary) {
    lines.push(
      "",
      "V4.5 site and management evidence",
      `${analysis.siteManagementEvidence.status || "unknown"} (${analysis.siteManagementEvidence.score || 0}/100): ${analysis.siteManagementEvidence.summary}`,
      `Lived quality: ${analysis.siteManagementEvidence.livedQualityPosition || "Not calculated."}`
    );
    for (const item of analysis.siteManagementEvidence.checks || []) lines.push(`- ${item.label}: ${item.status}. ${item.action}`);
  }
  if (analysis.legalTransactionEvidence?.summary) {
    lines.push(
      "",
      "V4.6 legal and transaction evidence",
      `${analysis.legalTransactionEvidence.status || "unknown"} (${analysis.legalTransactionEvidence.score || 0}/100): ${analysis.legalTransactionEvidence.summary}`,
      `Transaction path: ${analysis.legalTransactionEvidence.transactionPosition || "Not calculated."}`
    );
    for (const item of analysis.legalTransactionEvidence.checks || []) lines.push(`- ${item.label}: ${item.status}. ${item.action}`);
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
  if (analysis.siteVisitAssistant?.summary) {
    lines.push("", "V2.1 site visit assistant", `${analysis.siteVisitAssistant.status || "required"}: ${analysis.siteVisitAssistant.summary}`, `Focus: ${analysis.siteVisitAssistant.focus || "Check lived quality on site"}`);
    for (const item of analysis.siteVisitAssistant.checks || []) lines.push(`- ${item.label}: ${item.status}. ${item.action}`);
  }
  if (analysis.sourcingProfessional?.summary) {
    lines.push("", "V2.2 sourcing and professional filter", `${analysis.sourcingProfessional.status || "verify"}: ${analysis.sourcingProfessional.summary}`, `Posture: ${analysis.sourcingProfessional.posture || "Evidence-first sourcing"}`);
    for (const item of analysis.sourcingProfessional.checks || []) lines.push(`- ${item.label}: ${item.status}. ${item.action}`);
  }
  if (analysis.tenantRentalPlan?.summary) {
    lines.push("", "V2.3 tenant and rental plan", `${analysis.tenantRentalPlan.status || "watch"}: ${analysis.tenantRentalPlan.summary}`, `Target: ${analysis.tenantRentalPlan.target || "Target tenant not stated"}`);
    for (const item of analysis.tenantRentalPlan.checks || []) lines.push(`- ${item.label}: ${item.status}. ${item.action}`);
  }
  if (analysis.exitStrategy?.summary) {
    lines.push("", "V2.4 exit strategy and buyer psychology", `${analysis.exitStrategy.status || "prepare"}: ${analysis.exitStrategy.summary}`, `Buyer psychology: ${analysis.exitStrategy.buyerPsychology || "Buyer objections must be prepared"}`);
    for (const item of analysis.exitStrategy.checks || []) lines.push(`- ${item.label}: ${item.status}. ${item.action}`);
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
    if (analysis.learningLoop.profile?.approvedCount) {
      lines.push(
        `Memory profile: ${analysis.learningLoop.profile.investorType || "Profile building"}; ${analysis.learningLoop.profile.riskStyle || "Needs more approved memory"}.`,
        `Profile completeness: ${analysis.learningLoop.profile.completeness || 0}%.`
      );
    }
    for (const item of analysis.learningLoop.signals) lines.push(`- ${item.label}: ${item.body} ${item.action}`);
  }
  if (analysis.personalizedChallenge?.message) {
    lines.push("", `V3.3 personalized challenge: ${analysis.personalizedChallenge.label || "Personalized challenge"}`, `- ${analysis.personalizedChallenge.message}`);
    for (const item of analysis.personalizedChallenge.checks || []) lines.push(`- ${item.label}: ${item.status}. ${item.action}`);
  }
  if (analysis.dealMemoryComparison?.summary) {
    lines.push("", "V3.4 deal memory comparison", `${analysis.dealMemoryComparison.status || "none"}: ${analysis.dealMemoryComparison.summary}`);
    for (const item of analysis.dealMemoryComparison.matches || []) lines.push(`- ${item.subject}: ${item.similarity}% similar, ${item.verdict}. ${item.reason} ${item.action}`);
  }
  if (analysis.beliefTracker?.summary) {
    lines.push("", "V3.5 belief tracker", `${analysis.beliefTracker.status || "inactive"}: ${analysis.beliefTracker.summary}`);
    for (const item of analysis.beliefTracker.beliefs || []) lines.push(`- ${item.label}: ${item.status}. ${item.action}`);
  }
  if (analysis.sourceTransparency?.summary) {
    lines.push("", "V3.6 source transparency", `${analysis.sourceTransparency.mode || analysis.reasoningMode || "Framework only"}: ${analysis.sourceTransparency.summary}`);
    for (const item of analysis.sourceTransparency.sources || []) lines.push(`- ${item.label}: ${item.status}. ${item.detail}`);
  }
  if (analysis.memoryConflicts?.summary) {
    lines.push("", "V3.7 memory conflicts", `${analysis.memoryConflicts.status || "inactive"}: ${analysis.memoryConflicts.summary}`);
    for (const item of analysis.memoryConflicts.conflicts || []) lines.push(`- ${item.label}: ${item.status}. ${item.action}`);
  }
  if (analysis.personalOperatingRules?.summary) {
    lines.push("", "V3.8 personal operating rules", `${analysis.personalOperatingRules.status || "check"}: ${analysis.personalOperatingRules.summary}`);
    for (const item of analysis.personalOperatingRules.rules || []) lines.push(`- ${item.label}: ${item.status}. ${item.action}`);
  }
  if (analysis.hardStops?.length) lines.push("", "Hard stops", ...analysis.hardStops.map((item) => `- ${item}`));
  if (analysis.recommendationBlockers?.length) lines.push("", "Decision blockers", ...analysis.recommendationBlockers.map((item) => `- ${item}`));
  if (analysis.watchouts?.length) lines.push("", "Watch-outs", ...analysis.watchouts.map((item) => `- ${item}`));
  if (analysis.nextActions?.length) lines.push("", "Check next", ...analysis.nextActions.map((item) => `- ${item}`));
  if (analysis.counterThesis) lines.push("", `Strongest counter-thesis: ${analysis.counterThesis}`);
  return brandVisibleText(lines.join("\n"));
}

async function writeClipboardText(text) {
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
}

function titleCaseKey(key) {
  return String(key || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function contextBriefLines(title, context = {}, limit = 10) {
  const entries = Object.entries(context)
    .filter(([, value]) => String(value || "").trim())
    .slice(0, limit);
  if (!entries.length) return [`${title}: not supplied`];
  return [
    `${title}:`,
    ...entries.map(([key, value]) => `- ${titleCaseKey(key)}: ${String(value).trim()}`)
  ];
}

function readinessBriefLines() {
  return ["Readiness:", ...[
    { panelName: "deal", label: "Deal" },
    { panelName: "profile", label: "Profile" },
    { panelName: "guidance", label: "Guidance" }
  ].map((item) => {
    const readiness = contextPanelReadiness(item.panelName);
    return `- ${item.label}: ${readiness.percent}%${readiness.missing.length ? `, missing ${readiness.missing.slice(0, 3).join(", ")}` : ", ready enough"}`;
  })];
}

function latestTranscriptText(selector) {
  const item = Array.from(transcript.querySelectorAll(selector)).pop();
  return brandVisibleText(item?.textContent || "").replace(/\s+/g, " ").trim();
}

function latestApexBriefLines() {
  const analysisMessage = Array.from(transcript.querySelectorAll(".analysisMessage")).pop();
  const analysis = analysisRegistry.get(analysisMessage?.dataset.analysisId);
  if (analysis) {
    return [
      "Latest Apex direction:",
      `- Subject: ${analysisSubject(analysis)}`,
      `- Verdict: ${analysis.verdict || "INVESTIGATE"} (${analysis.confidence || 0}% confidence, ${analysis.averageScore || 0}/100 score)`,
      analysis.summary ? `- Summary: ${analysis.summary}` : "",
      analysis.counterThesis ? `- Counter-thesis: ${analysis.counterThesis}` : "",
      ...(analysis.nextActions || []).slice(0, 3).map((item) => `- Next: ${item}`)
    ].filter(Boolean);
  }
  const latest = latestTranscriptText(".message.jarvis .messageText");
  return latest
    ? ["Latest Apex direction:", `- ${latest.slice(0, 700)}`]
    : ["Latest Apex direction: no Apex answer yet"];
}

function sessionBriefText() {
  const deal = collectDealCard();
  const profile = collectFinancialProfile();
  const latestUser = latestTranscriptText(".message.user .messageText");
  const lines = [
    "APEX ANALYTIC SESSION BRIEF",
    new Intl.DateTimeFormat("en-MY", { dateStyle: "medium", timeStyle: "short" }).format(new Date()),
    "",
    latestUser ? `Latest user question: ${latestUser.slice(0, 500)}` : "Latest user question: not supplied",
    "",
    ...readinessBriefLines(),
    "",
    ...contextBriefLines("Deal context", deal, 12),
    "",
    ...contextBriefLines("Profile and guidance context", profile, 12),
    "",
    ...latestApexBriefLines(),
    "",
    "Use this brief as context only. Re-check live transaction, rental, financing, legal, supply, and site evidence before deciding."
  ];
  return brandVisibleText(lines.filter((line) => line !== undefined).join("\n"));
}

async function copySessionBrief(button = sessionBriefBtn) {
  const text = sessionBriefText();
  await writeClipboardText(text);
  if (button) {
    const original = button.textContent;
    button.textContent = "COPIED";
    window.setTimeout(() => {
      button.textContent = original || "BRIEF";
    }, 1200);
  }
  setSystemState("System ready", "Session brief copied.");
}

async function copyAnalysisReport(button, analysis) {
  const text = analysisExportText(analysis);
  await writeClipboardText(text);
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
    renderDealJourney();
    return;
  }
  if (action === "journal") void createJournalDecision(analysis);
}

function openJourneyPanel(panelName) {
  const toggle = contextToggles.find((item) => item.getAttribute("data-context-toggle") === panelName);
  if (toggle) setContextPanelState(toggle, true);
  focusFirstMissingContextField(panelName);
}

function handleJourneyAction(button) {
  const action = button?.getAttribute("data-journey-action");
  if (!action) return;
  if (action === "deal" || action === "profile" || action === "guidance") {
    openJourneyPanel(action);
    return;
  }
  if (action === "screen") {
    void runDealScreening();
    return;
  }
  if (action === "analyze") {
    void runDealAnalysis();
    return;
  }
  if (action === "save") {
    const analysis = latestAnalysis();
    if (!analysis) return void runDealAnalysis();
    saveAnalysisToShortlist(analysis);
    renderShortlist();
    setSystemState("System ready", `${analysisSubject(analysis)} saved to your shortlist.`);
    return;
  }
  if (action === "shortlist") {
    openShortlistPanel();
    return;
  }
  if (action === "journal") {
    const analysis = latestAnalysis();
    if (analysis) void createJournalDecision(analysis);
    else void openJournalPanel();
    return;
  }
  if (action === "reports") {
    void openReportsPanel();
    return;
  }
  if (action === "brief") void copySessionBrief();
}

function ownerMarketTokenValue() {
  return ownerMarketToken.value.trim() || window.localStorage.getItem(ownerMarketTokenKey) || "";
}

function ownerEvidenceTokenValue() {
  return ownerEvidenceToken.value.trim() || ownerMarketTokenValue();
}

function ownerCaseTokenValue() {
  return ownerCaseToken.value.trim() || ownerMarketTokenValue();
}

function setOwnerMarketMessage(message, tone = "") {
  ownerMarketMessage.textContent = message || "";
  ownerMarketMessage.dataset.tone = tone;
}

function setOwnerCaseMessage(message, tone = "") {
  ownerCaseMessage.textContent = message || "";
  ownerCaseMessage.dataset.tone = tone;
}

function setOwnerEvidenceMessage(message, tone = "") {
  ownerEvidenceMessage.textContent = message || "";
  ownerEvidenceMessage.dataset.tone = tone;
}

function setOwnerIntelMessage(message, tone = "") {
  ownerIntelMessage.textContent = message || "";
  ownerIntelMessage.dataset.tone = tone;
}

function syncOwnerTokens(token) {
  const clean = String(token || "").trim();
  ownerIntelToken.value = clean;
  ownerMarketToken.value = clean;
  ownerCaseToken.value = clean;
  ownerEvidenceToken.value = clean;
  if (clean) window.localStorage.setItem(ownerMarketTokenKey, clean);
  else window.localStorage.removeItem(ownerMarketTokenKey);
}

function ownerIntelTokenValue() {
  return ownerIntelToken.value.trim() || window.localStorage.getItem(ownerMarketTokenKey) || "";
}

async function ownerIntelRequest(pathname, options = {}) {
  const token = ownerIntelTokenValue();
  if (!token) throw new Error("Paste and save the owner token first.");
  return requestJson(pathname, {
    ...options,
    headers: {
      "x-estatelab-owner-token": token,
      ...(options.headers || {})
    }
  });
}

async function ownerMarketRequest(pathname, options = {}) {
  const token = ownerMarketTokenValue();
  if (!token) throw new Error("Paste and save the owner token first.");
  return requestJson(pathname, {
    ...options,
    headers: {
      "x-estatelab-owner-token": token,
      ...(options.headers || {})
    }
  });
}

function ownerIntelProjectKey(value = "") {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function ownerIntelMatchesProject(text = "", project = {}) {
  const haystack = ownerIntelProjectKey(text);
  if (!haystack) return false;
  return [project.name, project.area, ...(project.aliases || [])]
    .map(ownerIntelProjectKey)
    .filter(Boolean)
    .some((needle) => haystack.includes(needle) || needle.includes(haystack));
}

function ownerIntelProjectRows(projects = [], cases = [], observations = [], documents = []) {
  return projects.map((project) => {
    const linkedCases = cases.filter((item) => item.projectId === project.id || ownerIntelMatchesProject(`${item.projectName} ${item.area}`, project));
    const linkedObservations = observations.filter((item) => item.projectId === project.id || ownerIntelMatchesProject(`${item.projectName || item.project?.name || ""} ${item.area || item.project?.area || ""}`, project));
    const linkedEvidence = documents.filter((item) => ownerIntelMatchesProject(`${item.title} ${item.filename} ${(item.tags || []).join(" ")}`, project));
    const stale = linkedObservations.filter((item) => item.freshness?.status === "stale").length;
    const hasCase = Boolean(linkedCases.length);
    const hasFreshObservation = linkedObservations.some((item) => item.freshness?.status === "fresh");
    const hasEvidence = Boolean(linkedEvidence.length);
    const missing = [
      hasCase ? "" : "case",
      hasFreshObservation ? "" : "fresh signal",
      hasEvidence ? "" : "evidence"
    ].filter(Boolean);
    const status = !hasCase ? "missing" : stale ? "stale" : hasFreshObservation && hasEvidence ? "ready" : "partial";
    return { project, cases: linkedCases.length, observations: linkedObservations.length, evidence: linkedEvidence.length, stale, missing, status };
  });
}

function ownerIntelLane(label, value, status, action) {
  return `
    <article class="${escapeHtml(status)}">
      <small>${escapeHtml(label)}</small>
      <b>${escapeHtml(value)}</b>
      <p>${escapeHtml(action)}</p>
    </article>
  `;
}

function ownerIntelCoverageScore(rows = []) {
  if (!rows.length) return 0;
  const total = rows.reduce((sum, row) => {
    const rowScore = (row.cases ? 38 : 0)
      + (row.observations ? 18 : 0)
      + (row.observations && !row.stale ? 17 : 0)
      + (row.evidence ? 27 : 0);
    return sum + Math.max(0, Math.min(100, rowScore - (row.stale ? 12 : 0)));
  }, 0);
  return Math.round(total / rows.length);
}

function ownerIntelSortRows(rows = []) {
  const order = { missing: 0, stale: 1, partial: 2, ready: 3 };
  return [...rows].sort((left, right) => order[left.status] - order[right.status] || right.missing.length - left.missing.length);
}

function ownerIntelFilterRows(rows = []) {
  const sorted = ownerIntelSortRows(rows);
  if (ownerIntelFilter === "all") return sorted;
  return sorted.filter((row) => row.status === ownerIntelFilter);
}

function renderOwnerIntelCoverageRows(rows = []) {
  const filteredRows = ownerIntelFilterRows(rows);
  ownerIntelControls.querySelectorAll("[data-owner-intel-filter]").forEach((button) => {
    const active = button.getAttribute("data-owner-intel-filter") === ownerIntelFilter;
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
  ownerIntelCoverage.innerHTML = filteredRows.length
    ? filteredRows.slice(0, 10).map(ownerIntelCoverageMarkup).join("")
    : rows.length
      ? `<p class="ownerIntelEmpty">No ${escapeHtml(ownerIntelFilter)} projects in the current owner coverage view.</p>`
      : '<p class="ownerIntelEmpty">No projects loaded yet. Start by adding tracked projects in the Market console.</p>';
}

function ownerIntelCoverageMarkup(row) {
  const detail = [row.project.area, row.project.state, row.project.propertyType].filter(Boolean).join(" / ") || "No project detail";
  return `
    <article class="ownerIntelCoverageItem ${escapeHtml(row.status)}" data-owner-intel-project="${escapeHtml(row.project.id)}">
      <header><span><small>${escapeHtml(detail)}</small><b>${escapeHtml(row.project.name)}</b></span><em>${escapeHtml(row.status)}</em></header>
      <div>
        <span>${escapeHtml(row.cases)} case</span>
        <span>${escapeHtml(row.observations)} signal</span>
        <span>${escapeHtml(row.evidence)} proof</span>
        <span>${escapeHtml(row.stale)} stale</span>
      </div>
      <p>${escapeHtml(row.missing.length ? `Missing ${row.missing.join(", ")}.` : "Coverage is strong enough for project-aware Apex reasoning.")}</p>
      <div class="ownerIntelCoverageActions">
        <button type="button" data-owner-intel-action="case" data-owner-intel-project="${escapeHtml(row.project.id)}">CASE</button>
        <button type="button" data-owner-intel-action="signal" data-owner-intel-project="${escapeHtml(row.project.id)}">SIGNAL</button>
        <button type="button" data-owner-intel-action="proof" data-owner-intel-project="${escapeHtml(row.project.id)}">PROOF</button>
      </div>
    </article>
  `;
}

function ownerIntelBriefText() {
  const snapshot = ownerIntelSnapshot || {};
  const rows = ownerIntelSortRows(snapshot.rows || []);
  const score = snapshot.score || 0;
  const lines = [
    "APEX OWNER INTELLIGENCE BRIEF",
    new Intl.DateTimeFormat("en-MY", { dateStyle: "medium", timeStyle: "short" }).format(new Date()),
    "",
    `Coverage score: ${score}%`,
    `Projects: ${snapshot.projectCount || 0}`,
    `Cases: ${snapshot.caseCount || 0}`,
    `Observations: ${snapshot.observationCount || 0}`,
    `Evidence documents: ${snapshot.documentCount || 0}`,
    `Complete projects: ${snapshot.complete || 0}`,
    "",
    "Priority gaps:",
    ...(rows.length ? rows.slice(0, 10).map((row) => {
      const project = row.project?.name || "Unnamed project";
      const detail = [row.project?.area, row.project?.state, row.project?.propertyType].filter(Boolean).join(" / ") || "No detail";
      const missing = row.missing.length ? row.missing.join(", ") : "none";
      return `- ${project} (${detail}) / ${row.status}: ${missing}; ${row.cases} case, ${row.observations} signal, ${row.evidence} proof, ${row.stale} stale.`;
    }) : ["- No project coverage loaded yet."]),
    "",
    "Next operating rule: add founder case judgment, fresh dated market signal, and evidence proof for every tracked project before relying on project-aware reasoning."
  ];
  return brandVisibleText(lines.join("\n"));
}

async function copyOwnerIntelBrief() {
  await writeClipboardText(ownerIntelBriefText());
  const original = ownerIntelCopyBrief.textContent;
  ownerIntelCopyBrief.textContent = "COPIED";
  window.setTimeout(() => {
    ownerIntelCopyBrief.textContent = original || "COPY BRIEF";
  }, 1200);
  setOwnerIntelMessage("Owner intelligence brief copied.");
}

function renderOwnerIntelligence({ projects = {}, observations = {}, cases = {}, evidence = {} } = {}) {
  const projectItems = Array.isArray(projects.projects) ? projects.projects : [];
  const observationItems = Array.isArray(observations.observations) ? observations.observations : [];
  const caseItems = Array.isArray(cases.cases) ? cases.cases : [];
  const documents = Array.isArray(evidence.documents) ? evidence.documents : [];
  ownerIntelProjects = projectItems;
  ownerMarketProjects = projectItems;
  renderOwnerProjectOptions(projectItems);
  renderOwnerCaseProjectOptions(projectItems);
  const rows = ownerIntelProjectRows(projectItems, caseItems, observationItems, documents);
  const missingCase = rows.filter((row) => row.cases === 0).length;
  const staleObservation = observationItems.filter((item) => item.freshness?.status === "stale").length;
  const noEvidence = rows.filter((row) => row.evidence === 0).length;
  const complete = rows.filter((row) => row.status === "ready").length;
  const score = ownerIntelCoverageScore(rows);
  ownerIntelSnapshot = {
    rows,
    score,
    projectCount: projectItems.length,
    caseCount: cases.summary?.total ?? caseItems.length,
    observationCount: observations.summary?.matched ?? observationItems.length,
    documentCount: evidence.summary?.documents ?? documents.length,
    complete
  };
  ownerIntelSummary.innerHTML = `
    <span><b>${escapeHtml(score)}%</b> COVERAGE</span>
    <span><b>${escapeHtml(projectItems.length)}</b> PROJECTS</span>
    <span><b>${escapeHtml(cases.summary?.total ?? caseItems.length)}</b> CASES</span>
    <span><b>${escapeHtml(observations.summary?.matched ?? observationItems.length)}</b> OBSERVATIONS</span>
    <span><b>${escapeHtml(evidence.summary?.documents ?? documents.length)}</b> DOCUMENTS</span>
    <span><b>${escapeHtml(complete)}</b> COMPLETE</span>
  `;
  ownerIntelLanes.innerHTML = [
    ownerIntelLane("Project registry", `${projectItems.length} tracked`, projectItems.length ? "ready" : "missing", projectItems.length ? "Registry exists." : "Add projects before cases can be linked."),
    ownerIntelLane("Founder cases", `${missingCase} missing`, missingCase ? "warning" : "ready", missingCase ? "Write founder opinion for unmatched projects." : "Case coverage is broad."),
    ownerIntelLane("Market freshness", `${staleObservation} stale`, staleObservation ? "warning" : observationItems.length ? "ready" : "missing", staleObservation ? "Re-check old observations." : observationItems.length ? "Signals are current enough." : "Add dated ground signals."),
    ownerIntelLane("Evidence vault", `${noEvidence} unbacked`, noEvidence ? "warning" : documents.length ? "ready" : "missing", noEvidence ? "Attach proof to important projects." : documents.length ? "Evidence exists." : "Add source proof.")
  ].join("");
  renderOwnerIntelCoverageRows(rows);

  let next = { title: "Add project registry", detail: "Apex needs tracked projects before owner intelligence can become project-specific.", action: "market" };
  if (missingCase) next = { title: "Write missing case opinions", detail: `${missingCase} tracked project${missingCase === 1 ? "" : "s"} do not have founder case notes yet.`, action: "cases" };
  else if (staleObservation) next = { title: "Refresh stale market signals", detail: `${staleObservation} observation${staleObservation === 1 ? " is" : "s are"} stale and should be re-verified.`, action: "market" };
  else if (noEvidence) next = { title: "Attach evidence proof", detail: `${noEvidence} project${noEvidence === 1 ? "" : "s"} have no obvious evidence document match.`, action: "evidence" };
  else if (projectItems.length) next = { title: "Coverage looks healthy", detail: "Keep adding dated observations and update case notes when the market changes.", action: "refresh" };
  ownerIntelNextTitle.textContent = next.title;
  ownerIntelNextDetail.textContent = next.detail;
  ownerIntelActions.innerHTML = `
    <button type="button" data-owner-intel-action="${escapeHtml(next.action)}">DO NEXT</button>
    <button type="button" data-owner-intel-action="market">PROJECTS / SIGNALS</button>
    <button type="button" data-owner-intel-action="cases">CASES</button>
    <button type="button" data-owner-intel-action="evidence">EVIDENCE</button>
  `;
}

async function loadOwnerIntelligence() {
  if (!ownerIntelTokenValue()) {
    renderOwnerIntelligence();
    setOwnerIntelMessage(ownerMarketEnabled ? "Owner API is enabled. Token required." : "Owner API may be disabled. Set the owner token on Render if this fails.", "warning");
    return null;
  }
  setOwnerIntelMessage("Loading owner intelligence coverage...");
  const [projects, observations, cases, evidence] = await Promise.all([
    ownerIntelRequest("/api/owner/market/projects"),
    ownerIntelRequest("/api/owner/market/observations?limit=500"),
    ownerIntelRequest("/api/owner/development-cases?limit=500"),
    ownerIntelRequest("/api/owner/documents")
  ]);
  renderOwnerIntelligence({ projects, observations, cases, evidence });
  setOwnerIntelMessage("Owner intelligence coverage loaded.");
  return { projects, observations, cases, evidence };
}

async function ownerCaseRequest(pathname, options = {}) {
  const token = ownerCaseTokenValue();
  if (!token) throw new Error("Paste and save the owner token first.");
  return requestJson(pathname, {
    ...options,
    headers: {
      "x-estatelab-owner-token": token,
      ...(options.headers || {})
    }
  });
}

async function ownerEvidenceRequest(pathname, options = {}) {
  const token = ownerEvidenceTokenValue();
  if (!token) throw new Error("Paste and save the owner token first.");
  return requestJson(pathname, {
    ...options,
    headers: {
      "x-estatelab-owner-token": token,
      ...(options.headers || {})
    }
  });
}

function ownerEvidenceTagsText(tags = []) {
  return Array.isArray(tags) && tags.length ? tags.join(", ") : "untagged";
}

function ownerEvidenceMarkup(document) {
  return `
    <article class="ownerEvidenceItem ${escapeHtml(document.status || "stored")}" data-owner-evidence="${escapeHtml(document.id)}">
      <header>
        <span><small>${escapeHtml(ownerEvidenceTagsText(document.tags))}</small><b>${escapeHtml(document.title || "Owner evidence")}</b></span>
        <em>${escapeHtml(document.status || "stored")} / ${escapeHtml(document.chunkCount || 0)} chunks</em>
      </header>
      <p>${escapeHtml(document.filename || "Evidence file")}${document.sourceUrl ? ` / ${escapeHtml(document.sourceUrl)}` : ""}</p>
      <div class="ownerEvidenceMeta">
        <span>${escapeHtml(document.indexMode || "stored")} index</span>
        <span>${escapeHtml(document.updatedAt ? marketDateText(document.updatedAt) : "No date")}</span>
      </div>
      <button type="button" data-owner-evidence-action="delete" data-owner-evidence-id="${escapeHtml(document.id)}">DELETE</button>
    </article>
  `;
}

function renderOwnerEvidence(payload = {}) {
  const documents = Array.isArray(payload.documents) ? payload.documents : [];
  const summary = payload.summary || {};
  ownerEvidenceSummary.innerHTML = `
    <span><b>${escapeHtml(summary.documents || documents.length)}</b> DOCUMENTS</span>
    <span><b>${escapeHtml(summary.indexed || 0)}</b> INDEXED</span>
    <span><b>${escapeHtml(summary.chunks || 0)}</b> CHUNKS</span>
    <span>${escapeHtml(summary.embeddingProvider ? "EMBEDDINGS ON" : "LEXICAL SEARCH")}</span>
  `;
  ownerEvidenceMetrics.textContent = `${summary.chunks || 0} indexed chunks`;
  ownerEvidenceList.innerHTML = documents.length
    ? documents.map(ownerEvidenceMarkup).join("")
    : '<p class="ownerEvidenceEmpty">No evidence documents yet. Add the first transaction, rent, financing, legal, or site proof above.</p>';
}

async function loadOwnerEvidence() {
  if (!ownerEvidenceTokenValue()) {
    renderOwnerEvidence({});
    setOwnerEvidenceMessage(ownerMarketEnabled ? "Owner API is enabled. Token required." : "Owner API may be disabled. Set the owner token on Render if this fails.", "warning");
    return null;
  }
  setOwnerEvidenceMessage("Loading evidence vault...");
  const payload = await ownerEvidenceRequest("/api/owner/documents");
  renderOwnerEvidence(payload);
  setOwnerEvidenceMessage("Evidence vault loaded.");
  return payload;
}

async function createOwnerEvidence() {
  const title = ownerEvidenceTitle.value.trim();
  const text = ownerEvidenceText.value.trim();
  if (!title) return ownerEvidenceTitle.focus();
  if (!text) return ownerEvidenceText.focus();
  setOwnerEvidenceMessage("Indexing evidence...");
  await ownerEvidenceRequest("/api/owner/documents", {
    method: "POST",
    body: JSON.stringify({
      title,
      filename: ownerEvidenceFilename.value.trim() || `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "evidence"}.md`,
      mimeType: "text/markdown",
      sourceUrl: ownerEvidenceSourceUrl.value.trim(),
      tags: ownerEvidenceTags.value.split(",").map((item) => item.trim()).filter(Boolean),
      text
    })
  });
  ownerEvidenceForm.reset();
  await loadOwnerEvidence();
  setOwnerEvidenceMessage("Evidence added. V8 reports can now retrieve it when relevant.");
}

async function deleteOwnerEvidenceDocument(button) {
  const id = button.getAttribute("data-owner-evidence-id");
  if (!id) return;
  if (button.dataset.confirming !== "true") {
    button.dataset.confirming = "true";
    button.textContent = "CONFIRM";
    setOwnerEvidenceMessage("Press CONFIRM to delete this evidence document.");
    return;
  }
  button.disabled = true;
  try {
    await ownerEvidenceRequest(`/api/owner/documents/${encodeURIComponent(id)}`, { method: "DELETE" });
    await loadOwnerEvidence();
    setOwnerEvidenceMessage("Evidence deleted.");
  } catch (error) {
    button.disabled = false;
    setOwnerEvidenceMessage(error.message || "Evidence could not be deleted.", "danger");
  }
}

function ownerCaseVerdictText(value) {
  return {
    strong_buy: "Strong buy",
    shortlist: "Shortlist",
    watch: "Watch",
    avoid: "Avoid",
    unknown: "Unknown"
  }[value] || "Watch";
}

function renderOwnerCaseProjectOptions(projects = ownerMarketProjects) {
  ownerCaseProject.innerHTML = '<option value="">No linked market project</option>'
    + projects.map((project) => `<option value="${escapeHtml(project.id)}">${escapeHtml(project.name)}${project.area ? ` / ${escapeHtml(project.area)}` : ""}</option>`).join("");
}

function ownerCaseMarkup(item) {
  const detail = [item.area, item.state, item.propertyType, item.priceSegment].filter(Boolean).join(" / ") || "No project detail";
  const summary = item.ownerVerdict || item.strengths || item.weaknesses || "No founder verdict recorded.";
  const gapCount = [
    item.managementView,
    item.residentProfile,
    item.supplyThreat,
    item.rentalOutlook,
    item.resaleOutlook,
    item.sourceBasis
  ].filter((value) => !String(value || "").trim()).length;
  return `
    <article class="ownerCaseItem ${escapeHtml(item.verdict || "watch")}" data-owner-case="${escapeHtml(item.id)}">
      <header>
        <span><small>${escapeHtml(detail)}</small><b>${escapeHtml(item.projectName || "Development case")}</b></span>
        <em>${escapeHtml(ownerCaseVerdictText(item.verdict))} / ${escapeHtml(item.confidence || "medium")}</em>
      </header>
      <p>${escapeHtml(summary)}</p>
      <div class="ownerCaseMeta">
        <span>${escapeHtml(item.rating || 0)}/100</span>
        <span>${escapeHtml(item.sourceBasis || "No source basis")}</span>
        <span>${escapeHtml(item.observedAt ? marketDateText(item.observedAt) : "No date")}</span>
        ${gapCount ? `<span>${escapeHtml(gapCount)} gaps</span>` : "<span>complete</span>"}
      </div>
      <div class="ownerCaseItemActions">
        <button type="button" data-owner-case-action="edit" data-owner-case-id="${escapeHtml(item.id)}">EDIT</button>
        <button type="button" data-owner-case-action="delete" data-owner-case-id="${escapeHtml(item.id)}">DELETE</button>
      </div>
    </article>
  `;
}

function renderOwnerCases(payload = {}) {
  const cases = Array.isArray(payload.cases) ? payload.cases : [];
  ownerCaseItems = cases;
  const summary = payload.summary || {};
  const coverage = summary.coverage || {};
  ownerCaseSummary.innerHTML = `
    <span><b>${escapeHtml(summary.total ?? cases.length)}</b> CASES</span>
    <span><b>${escapeHtml(summary.shortlist || 0)}</b> SHORTLIST</span>
    <span><b>${escapeHtml(summary.strong_buy || 0)}</b> STRONG BUY</span>
    <span><b>${escapeHtml(summary.avoid || 0)}</b> AVOID</span>
    <span><b>${escapeHtml(coverage.areas || 0)}</b> AREAS</span>
    <span><b>${escapeHtml(coverage.incomplete || 0)}</b> GAPS</span>
  `;
  ownerCaseMetrics.textContent = `${summary.matched ?? cases.length} matched case note${(summary.matched ?? cases.length) === 1 ? "" : "s"}`;
  ownerCaseList.innerHTML = cases.length
    ? cases.map(ownerCaseMarkup).join("")
    : '<p class="ownerCaseEmpty">No development cases match this filter yet. Add the first project opinion above.</p>';
}

function ownerCaseQuery() {
  const params = new URLSearchParams();
  if (ownerCaseFilter.value.trim()) params.set("q", ownerCaseFilter.value.trim());
  if (ownerCaseVerdictFilter.value) params.set("verdict", ownerCaseVerdictFilter.value);
  params.set("limit", "120");
  return params.toString();
}

async function loadOwnerCases() {
  if (!ownerCaseTokenValue()) {
    renderOwnerCases({});
    setOwnerCaseMessage(ownerMarketEnabled ? "Owner API is enabled. Token required." : "Owner API may be disabled. Set the owner token on Render if this fails.", "warning");
    return null;
  }
  setOwnerCaseMessage("Loading development case library...");
  const [projects, cases] = await Promise.all([
    ownerCaseRequest("/api/owner/market/projects"),
    ownerCaseRequest(`/api/owner/development-cases?${ownerCaseQuery()}`)
  ]);
  ownerMarketProjects = Array.isArray(projects.projects) ? projects.projects : [];
  renderOwnerCaseProjectOptions(ownerMarketProjects);
  renderOwnerCases(cases);
  setOwnerCaseMessage("Development case library loaded.");
  return { projects, cases };
}

function selectedOwnerCaseProject() {
  return ownerMarketProjects.find((project) => project.id === ownerCaseProject.value);
}

function ownerCasePayload() {
  const linkedProject = selectedOwnerCaseProject();
  const projectName = ownerCaseProjectName.value.trim() || linkedProject?.name || "";
  return {
    projectId: ownerCaseProject.value,
    projectName,
    area: ownerCaseArea.value.trim() || linkedProject?.area || "",
    state: ownerCaseState.value.trim() || linkedProject?.state || "",
    propertyType: ownerCaseType.value.trim() || linkedProject?.propertyType || "",
    developer: ownerCaseDeveloper.value.trim() || linkedProject?.developer || "",
    priceSegment: ownerCasePriceSegment.value.trim(),
    targetBuyer: ownerCaseTargetBuyer.value.trim(),
    targetTenant: ownerCaseTargetTenant.value.trim(),
    strengths: ownerCaseStrengths.value.trim(),
    weaknesses: ownerCaseWeaknesses.value.trim(),
    managementView: ownerCaseManagement.value.trim(),
    residentProfile: ownerCaseResident.value.trim(),
    supplyThreat: ownerCaseSupply.value.trim(),
    rentalOutlook: ownerCaseRental.value.trim(),
    resaleOutlook: ownerCaseResale.value.trim(),
    ownerVerdict: ownerCaseOwnerVerdict.value.trim(),
    verdict: ownerCaseVerdict.value,
    confidence: ownerCaseConfidence.value,
    rating: ownerCaseRating.value.trim(),
    observedAt: ownerCaseObservedAt.value || new Date().toISOString(),
    sourceBasis: ownerCaseSourceBasis.value.trim(),
    tags: ownerCaseTags.value.split(",").map((item) => item.trim()).filter(Boolean)
  };
}

function clearOwnerCaseEditMode() {
  ownerCaseEditingId = "";
  ownerCaseForm.reset();
  ownerCaseObservedAt.value = new Date().toISOString().slice(0, 10);
  ownerCaseFormTitle.textContent = "Add Development Opinion";
  ownerCaseSubmit.textContent = "ADD CASE";
  ownerCaseCancelEdit.hidden = true;
}

function fillOwnerCaseForm(item) {
  ownerCaseEditingId = item.id || "";
  ownerCaseProject.value = item.projectId || "";
  ownerCaseProjectName.value = item.projectName || "";
  ownerCaseArea.value = item.area || "";
  ownerCaseState.value = item.state || "";
  ownerCaseType.value = item.propertyType || "";
  ownerCaseDeveloper.value = item.developer || "";
  ownerCasePriceSegment.value = item.priceSegment || "";
  ownerCaseVerdict.value = item.verdict || "watch";
  ownerCaseConfidence.value = item.confidence || "medium";
  ownerCaseRating.value = item.rating || "";
  ownerCaseObservedAt.value = item.observedAt ? String(item.observedAt).slice(0, 10) : new Date().toISOString().slice(0, 10);
  ownerCaseTags.value = Array.isArray(item.tags) ? item.tags.join(", ") : "";
  ownerCaseTargetBuyer.value = item.targetBuyer || "";
  ownerCaseTargetTenant.value = item.targetTenant || "";
  ownerCaseStrengths.value = item.strengths || "";
  ownerCaseWeaknesses.value = item.weaknesses || "";
  ownerCaseManagement.value = item.managementView || "";
  ownerCaseResident.value = item.residentProfile || "";
  ownerCaseSupply.value = item.supplyThreat || "";
  ownerCaseRental.value = item.rentalOutlook || "";
  ownerCaseResale.value = item.resaleOutlook || "";
  ownerCaseOwnerVerdict.value = item.ownerVerdict || "";
  ownerCaseSourceBasis.value = item.sourceBasis || "";
  ownerCaseFormTitle.textContent = `Edit ${item.projectName || "Development Case"}`;
  ownerCaseSubmit.textContent = "SAVE CASE";
  ownerCaseCancelEdit.hidden = false;
  ownerCaseForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
  setOwnerCaseMessage("Editing existing development case. Save to update, or cancel edit.");
}

function editOwnerCase(button) {
  const id = button.getAttribute("data-owner-case-id");
  const item = ownerCaseItems.find((caseItem) => caseItem.id === id);
  if (!item) return setOwnerCaseMessage("Case not found in the current filtered list. Refresh and try again.", "warning");
  fillOwnerCaseForm(item);
}

async function saveOwnerCase() {
  const payload = ownerCasePayload();
  if (!payload.projectName) return ownerCaseProjectName.focus();
  const editing = Boolean(ownerCaseEditingId);
  setOwnerCaseMessage(editing ? "Updating development case..." : "Adding development case...");
  const endpoint = editing
    ? `/api/owner/development-cases/${encodeURIComponent(ownerCaseEditingId)}`
    : "/api/owner/development-cases";
  await ownerCaseRequest(endpoint, {
    method: editing ? "PATCH" : "POST",
    body: JSON.stringify(payload)
  });
  clearOwnerCaseEditMode();
  await loadOwnerCases();
  setOwnerCaseMessage(editing ? "Development case updated." : "Development case added. Apex can now match it in answers and deal reports.");
}

async function deleteOwnerCase(button) {
  const id = button.getAttribute("data-owner-case-id");
  if (!id) return;
  if (button.dataset.confirming !== "true") {
    button.dataset.confirming = "true";
    button.textContent = "CONFIRM";
    setOwnerCaseMessage("Press CONFIRM to delete this development case.");
    return;
  }
  button.disabled = true;
  try {
    await ownerCaseRequest(`/api/owner/development-cases/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (ownerCaseEditingId === id) clearOwnerCaseEditMode();
    await loadOwnerCases();
    setOwnerCaseMessage("Development case deleted.");
  } catch (error) {
    button.disabled = false;
    setOwnerCaseMessage(error.message || "Development case could not be deleted.", "danger");
  }
}

function marketMetricText(metricType) {
  return String(metricType || "other").replaceAll("_", " ");
}

function marketDateText(value) {
  if (!value) return "No date";
  try {
    return new Intl.DateTimeFormat("en-MY", { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return String(value).slice(0, 10);
  }
}

function renderOwnerProjectOptions(projects = []) {
  ownerObservationProject.innerHTML = '<option value="">Area-only observation</option>'
    + projects.map((project) => `<option value="${escapeHtml(project.id)}">${escapeHtml(project.name)}${project.area ? ` / ${escapeHtml(project.area)}` : ""}</option>`).join("");
}

function ownerProjectMarkup(project) {
  const detail = [project.area, project.state, project.propertyType, project.tenure].filter(Boolean).join(" / ") || "No project detail";
  return `
    <article class="ownerMarketItem">
      <header><span><small>${escapeHtml(detail)}</small><b>${escapeHtml(project.name)}</b></span><em>${escapeHtml(project.observationCount || 0)} obs</em></header>
      <p>${escapeHtml(project.developer || project.status || "Add observations to make this project useful.")}</p>
    </article>
  `;
}

function ownerObservationMarkup(observation) {
  const project = observation.project?.name || observation.projectName || observation.area || "Area observation";
  const freshness = observation.freshness?.status || "unknown";
  const age = Number.isFinite(Number(observation.freshness?.ageDays)) ? `${observation.freshness.ageDays}d` : "age n/a";
  const trend = observation.trend
    ? `${observation.trend.direction}${observation.trend.percentChange === null || observation.trend.percentChange === undefined ? "" : ` ${observation.trend.percentChange > 0 ? "+" : ""}${observation.trend.percentChange}%`}`
    : "no trend";
  const value = observation.value === null || observation.value === undefined ? "Qualitative" : `${observation.value}${observation.unit ? ` ${observation.unit}` : ""}`;
  return `
    <article class="ownerMarketItem ${escapeHtml(freshness)}" data-owner-observation="${escapeHtml(observation.id)}">
      <header>
        <span><small>${escapeHtml(marketMetricText(observation.metricType))} / ${escapeHtml(marketDateText(observation.observedAt))}</small><b>${escapeHtml(project)}</b></span>
        <em>${escapeHtml(freshness)} / ${escapeHtml(age)}</em>
      </header>
      <p>${escapeHtml(value)}. ${escapeHtml(observation.notes || "No notes recorded.")}</p>
      <div class="ownerMarketMeta">
        <span>${escapeHtml(observation.confidence || "medium")} confidence</span>
        <span>${escapeHtml(observation.sourceType || "owner observation")}</span>
        <span>${escapeHtml(trend)}</span>
      </div>
      <button type="button" data-owner-market-action="delete-observation" data-owner-market-id="${escapeHtml(observation.id)}">DELETE</button>
    </article>
  `;
}

function renderOwnerMarket(projectPayload = {}, observationPayload = {}) {
  const projects = Array.isArray(projectPayload.projects) ? projectPayload.projects : [];
  const observations = Array.isArray(observationPayload.observations) ? observationPayload.observations : [];
  ownerMarketProjects = projects;
  renderOwnerProjectOptions(projects);
  ownerProjectCount.textContent = String(projects.length);
  ownerObservationCount.textContent = String(observationPayload.summary?.matched || observations.length);
  ownerMarketSummary.innerHTML = `
    <span><b>${escapeHtml(projects.length)}</b> PROJECTS</span>
    <span><b>${escapeHtml(projectPayload.summary?.observations ?? observations.length)}</b> OBSERVATIONS</span>
    <span><b>${escapeHtml(observationPayload.summary?.fresh || 0)}</b> FRESH</span>
    <span><b>${escapeHtml(observationPayload.summary?.stale || 0)}</b> STALE</span>
  `;
  ownerProjectList.innerHTML = projects.length
    ? projects.map(ownerProjectMarkup).join("")
    : '<p class="ownerMarketEmpty">No market projects yet. Add one above, then attach observations.</p>';
  ownerObservationList.innerHTML = observations.length
    ? observations.map(ownerObservationMarkup).join("")
    : '<p class="ownerMarketEmpty">No observations match this filter yet.</p>';
}

function ownerObservationQuery() {
  const params = new URLSearchParams();
  if (ownerMarketAreaFilter.value.trim()) params.set("area", ownerMarketAreaFilter.value.trim());
  if (ownerMarketMetricFilter.value) params.set("metricType", ownerMarketMetricFilter.value);
  if (ownerMarketFreshnessFilter.value) params.set("freshness", ownerMarketFreshnessFilter.value);
  params.set("limit", "120");
  return params.toString();
}

async function loadOwnerMarket() {
  if (!ownerMarketTokenValue()) {
    ownerProjectList.innerHTML = '<p class="ownerMarketEmpty">Owner token required before loading market evidence.</p>';
    ownerObservationList.innerHTML = '<p class="ownerMarketEmpty">Paste your owner token above, then press SAVE.</p>';
    setOwnerMarketMessage(ownerMarketEnabled ? "Owner API is enabled. Token required." : "Owner API may be disabled. Set the owner token on Render if this fails.", "warning");
    return null;
  }
  setOwnerMarketMessage("Loading owner market intelligence...");
  const query = ownerObservationQuery();
  const [projects, observations] = await Promise.all([
    ownerMarketRequest("/api/owner/market/projects"),
    ownerMarketRequest(`/api/owner/market/observations?${query}`)
  ]);
  renderOwnerMarket(projects, observations);
  setOwnerMarketMessage("Market intelligence loaded.");
  return { projects, observations };
}

function closeOwnerMarketPanel() {
  ownerMarketPanel.hidden = true;
  ownerMarketToggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("ownerMarketOpen");
}

function closeOwnerCasePanel() {
  ownerCasePanel.hidden = true;
  ownerCaseToggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("ownerCaseOpen");
}

function closeOwnerEvidencePanel() {
  ownerEvidencePanel.hidden = true;
  ownerEvidenceToggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("ownerEvidenceOpen");
}

function closeOwnerIntelligencePanel() {
  ownerIntelPanel.hidden = true;
  ownerIntelToggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("ownerIntelOpen");
}

async function openOwnerIntelligencePanel() {
  closeAuthPanel();
  closeMemoryPanel();
  closeReportsPanel();
  closeJournalPanel();
  closeOwnerIntelligencePanel();
  closeOwnerMarketPanel();
  closeOwnerCasePanel();
  closeOwnerEvidencePanel();
  closeTrustPanel();
  closeShortlistPanel();
  collapseContextPanels();
  ownerIntelPanel.hidden = false;
  ownerIntelToggle.setAttribute("aria-expanded", "true");
  document.body.classList.add("ownerIntelOpen");
  syncOwnerTokens(window.localStorage.getItem(ownerMarketTokenKey) || ownerIntelToken.value);
  try {
    await loadOwnerIntelligence();
  } catch (error) {
    setOwnerIntelMessage(error.message || "Owner intelligence console is unavailable.", "danger");
  }
}

async function openOwnerCasePanel() {
  closeAuthPanel();
  closeMemoryPanel();
  closeReportsPanel();
  closeJournalPanel();
  closeOwnerIntelligencePanel();
  closeOwnerMarketPanel();
  closeOwnerEvidencePanel();
  closeTrustPanel();
  closeShortlistPanel();
  collapseContextPanels();
  ownerCasePanel.hidden = false;
  ownerCaseToggle.setAttribute("aria-expanded", "true");
  document.body.classList.add("ownerCaseOpen");
  syncOwnerTokens(window.localStorage.getItem(ownerMarketTokenKey) || ownerCaseToken.value);
  ownerCaseObservedAt.value ||= new Date().toISOString().slice(0, 10);
  try {
    await loadOwnerCases();
  } catch (error) {
    setOwnerCaseMessage(error.message || "Development case library is unavailable.", "danger");
  }
}

async function openOwnerEvidencePanel() {
  closeAuthPanel();
  closeMemoryPanel();
  closeReportsPanel();
  closeJournalPanel();
  closeOwnerIntelligencePanel();
  closeOwnerMarketPanel();
  closeOwnerCasePanel();
  closeTrustPanel();
  closeShortlistPanel();
  collapseContextPanels();
  ownerEvidencePanel.hidden = false;
  ownerEvidenceToggle.setAttribute("aria-expanded", "true");
  document.body.classList.add("ownerEvidenceOpen");
  syncOwnerTokens(window.localStorage.getItem(ownerMarketTokenKey) || ownerEvidenceToken.value);
  try {
    await loadOwnerEvidence();
  } catch (error) {
    setOwnerEvidenceMessage(error.message || "Evidence vault is unavailable.", "danger");
  }
}

async function openOwnerMarketPanel() {
  closeAuthPanel();
  closeMemoryPanel();
  closeReportsPanel();
  closeJournalPanel();
  closeOwnerIntelligencePanel();
  closeOwnerCasePanel();
  closeOwnerEvidencePanel();
  closeTrustPanel();
  closeShortlistPanel();
  collapseContextPanels();
  ownerMarketPanel.hidden = false;
  ownerMarketToggle.setAttribute("aria-expanded", "true");
  document.body.classList.add("ownerMarketOpen");
  syncOwnerTokens(window.localStorage.getItem(ownerMarketTokenKey) || ownerMarketToken.value);
  ownerObservationDate.value ||= new Date().toISOString().slice(0, 10);
  try {
    await loadOwnerMarket();
  } catch (error) {
    setOwnerMarketMessage(error.message || "Owner market console is unavailable.", "danger");
  }
}

function ownerIntelSlug(value = "") {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "project";
}

function ownerIntelProjectById(projectId = "") {
  const id = String(projectId || "");
  return ownerIntelProjects.find((project) => project.id === id)
    || ownerMarketProjects.find((project) => project.id === id)
    || null;
}

function fillIfBlank(element, value) {
  if (element && !element.value && value) element.value = value;
}

function selectProjectOption(select, projectId) {
  if (!select || !projectId) return;
  if (Array.from(select.options).some((option) => option.value === projectId)) select.value = projectId;
}

function ownerIntelProjectTagText(project) {
  return [project.name, project.area, project.state, project.propertyType].filter(Boolean).join(", ");
}

function prefillOwnerCaseFromProject(project) {
  selectProjectOption(ownerCaseProject, project.id);
  fillIfBlank(ownerCaseProjectName, project.name);
  fillIfBlank(ownerCaseArea, project.area);
  fillIfBlank(ownerCaseState, project.state);
  fillIfBlank(ownerCaseType, project.propertyType);
  fillIfBlank(ownerCaseDeveloper, project.developer);
  fillIfBlank(ownerCaseSourceBasis, "Owner console action queue");
  ownerCaseProjectName.scrollIntoView({ behavior: "smooth", block: "center" });
  ownerCaseOwnerVerdict.focus();
  setOwnerCaseMessage(`Case note prepared for ${project.name}. Add your founder judgment, then save.`);
}

function prefillOwnerObservationFromProject(project) {
  selectProjectOption(ownerObservationProject, project.id);
  fillIfBlank(ownerObservationArea, project.area);
  fillIfBlank(ownerObservationSourceType, "owner ground check");
  fillIfBlank(ownerObservationNotes, `${project.name}: update the latest rental, resale, supply, management, or site signal.`);
  ownerObservationDate.value ||= new Date().toISOString().slice(0, 10);
  ownerObservationProject.scrollIntoView({ behavior: "smooth", block: "center" });
  ownerObservationMetric.focus();
  setOwnerMarketMessage(`Market signal prepared for ${project.name}. Choose the metric and add the latest evidence.`);
}

function prefillOwnerEvidenceFromProject(project) {
  fillIfBlank(ownerEvidenceTitle, `${project.name} evidence proof`);
  fillIfBlank(ownerEvidenceFilename, `${ownerIntelSlug(project.name)}-evidence.md`);
  fillIfBlank(ownerEvidenceTags, ownerIntelProjectTagText(project));
  fillIfBlank(ownerEvidenceText, `Project: ${project.name}\nArea: ${project.area || "Not recorded"}\nEvidence type:\nSource/date:\nNotes:\n`);
  ownerEvidenceTitle.scrollIntoView({ behavior: "smooth", block: "center" });
  ownerEvidenceText.focus();
  setOwnerEvidenceMessage(`Evidence shell prepared for ${project.name}. Paste the proof, source, and date before saving.`);
}

async function handleOwnerIntelProjectAction(action, projectId) {
  const project = ownerIntelProjectById(projectId);
  if (!project) {
    setOwnerIntelMessage("Project could not be found. Refresh owner intelligence and try again.", "warning");
    return;
  }
  if (action === "case") {
    await openOwnerCasePanel();
    prefillOwnerCaseFromProject(project);
  }
  if (action === "signal") {
    await openOwnerMarketPanel();
    prefillOwnerObservationFromProject(project);
  }
  if (action === "proof") {
    await openOwnerEvidencePanel();
    prefillOwnerEvidenceFromProject(project);
  }
}

async function createOwnerProject() {
  setOwnerMarketMessage("Adding project...");
  const payload = {
    name: ownerProjectName.value.trim(),
    area: ownerProjectArea.value.trim(),
    state: ownerProjectState.value.trim(),
    propertyType: ownerProjectType.value.trim(),
    developer: ownerProjectDeveloper.value.trim(),
    tenure: ownerProjectTenure.value.trim(),
    completionYear: ownerProjectCompletionYear.value.trim(),
    status: ownerProjectStatus.value,
    aliases: ownerProjectAliases.value.split(",").map((item) => item.trim()).filter(Boolean)
  };
  await ownerMarketRequest("/api/owner/market/projects", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  ownerProjectForm.reset();
  await loadOwnerMarket();
  setOwnerMarketMessage("Project added.");
}

async function createOwnerObservation() {
  const selectedProject = ownerMarketProjects.find((project) => project.id === ownerObservationProject.value);
  if (!selectedProject && !ownerObservationArea.value.trim()) {
    ownerObservationArea.focus();
    throw new Error("Add an area or link the observation to a project.");
  }
  setOwnerMarketMessage("Adding observation...");
  const payload = {
    projectId: ownerObservationProject.value,
    area: ownerObservationArea.value.trim() || selectedProject?.area || "",
    state: selectedProject?.state || "",
    projectName: selectedProject?.name || "",
    metricType: ownerObservationMetric.value,
    value: ownerObservationValue.value.trim(),
    unit: ownerObservationUnit.value.trim(),
    observedAt: ownerObservationDate.value,
    sourceType: ownerObservationSourceType.value.trim() || "owner observation",
    confidence: ownerObservationConfidence.value,
    notes: ownerObservationNotes.value.trim()
  };
  await ownerMarketRequest("/api/owner/market/observations", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  ownerObservationForm.reset();
  ownerObservationDate.value = new Date().toISOString().slice(0, 10);
  await loadOwnerMarket();
  setOwnerMarketMessage("Observation added. Apex can now match it in chat and deal reports.");
}

async function deleteOwnerObservation(button) {
  const id = button.getAttribute("data-owner-market-id");
  if (!id) return;
  if (button.dataset.confirming !== "true") {
    button.dataset.confirming = "true";
    button.textContent = "CONFIRM";
    setOwnerMarketMessage("Press CONFIRM to delete this observation.");
    return;
  }
  button.disabled = true;
  try {
    await ownerMarketRequest(`/api/owner/market/observations/${encodeURIComponent(id)}`, { method: "DELETE" });
    await loadOwnerMarket();
    setOwnerMarketMessage("Observation deleted.");
  } catch (error) {
    button.disabled = false;
    setOwnerMarketMessage(error.message || "Observation could not be deleted.", "danger");
  }
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

function personalizedChallengeMarkup(challenge = {}) {
  if (!challenge.message || challenge.status === "inactive") return "";
  const checks = Array.isArray(challenge.checks) ? challenge.checks : [];
  return `
    <section class="analysisPersonalChallenge ${escapeHtml(challenge.status || "challenge")}">
      <header>
        <span><small>V3.3 PERSONALIZED CHALLENGE</small><b>${escapeHtml(challenge.label || "Personalized challenge")}</b></span>
        <em>${escapeHtml(challenge.status || "challenge")}</em>
      </header>
      <p>${escapeHtml(challenge.message)}</p>
      ${challenge.profileBasis ? `<blockquote>${escapeHtml(challenge.profileBasis)}</blockquote>` : ""}
      ${checks.length ? `
        <div>
          ${checks.map((item) => `
            <article class="personalChallengeCheck ${escapeHtml(item.status || "check")}">
              <i>${escapeHtml(item.status || "check")}</i>
              <span><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.action)}</small></span>
            </article>
          `).join("")}
        </div>
      ` : ""}
    </section>
  `;
}

function v3MemoryInsightMarkup(title, section = {}, itemKey = "items") {
  if (!section.summary) return "";
  const items = Array.isArray(section[itemKey]) ? section[itemKey] : [];
  const statusLabel = section.status || section.mode || "check";
  const status = String(statusLabel).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "check";
  return `
    <section class="analysisV3Insight ${escapeHtml(status)}">
      <header>
        <span><small>${escapeHtml(title)}</small><b>${escapeHtml(section.summary)}</b></span>
        <em>${escapeHtml(statusLabel)}</em>
      </header>
      ${items.length ? `
        <div>
          ${items.map((item) => {
            const titleText = item.subject || item.label || item.type || "Memory signal";
            const metaText = item.similarity ? `${item.similarity}% similar / ${item.verdict || "saved"}` : item.status || item.type || "";
            const detailText = item.reason || item.basis || item.detail || item.memoryA || "";
            const secondDetail = item.memoryB ? `Conflict: ${item.memoryB}` : "";
            return `
              <article class="v3InsightItem ${escapeHtml(item.status || section.status || "check")}">
                <i>${escapeHtml(metaText)}</i>
                <span>
                  <b>${escapeHtml(titleText)}</b>
                  ${detailText ? `<small>${escapeHtml(detailText)}</small>` : ""}
                  ${secondDetail ? `<small>${escapeHtml(secondDetail)}</small>` : ""}
                  ${item.action ? `<em>${escapeHtml(item.action)}</em>` : ""}
                </span>
              </article>
            `;
          }).join("")}
        </div>
      ` : ""}
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

function productExperienceMarkup(experience = {}) {
  if (!experience.summary) return "";
  const checks = Array.isArray(experience.checks) ? experience.checks : [];
  return `
    <section class="analysisProductExperience">
      <header>
        <span><small>V5 PRODUCT EXPERIENCE</small><b>${escapeHtml(experience.summary)}</b></span>
        <em>${escapeHtml(experience.onboardingCompleteness || 0)}%</em>
      </header>
      <div class="productExperienceMeta">
        <span><small>MODE</small><b>${escapeHtml(experience.mode || "Balanced investor review")}</b></span>
        <span><small>STYLE</small><b>${escapeHtml(experience.explanationStyle || "Balanced explanation")}</b></span>
        <span><small>NEXT</small><b>${escapeHtml(experience.nextBestAction || "Clarify the user job before relying on format.")}</b></span>
      </div>
      ${checks.length ? `
        <div class="productExperienceChecks">
          ${checks.map((item) => `
            <article class="productExperienceCheck ${escapeHtml(item.status || "missing")}">
              <i>${escapeHtml(item.status || "missing")}</i>
              <span><b>${escapeHtml(item.label)}</b><em>${escapeHtml(item.action)}</em></span>
            </article>
          `).join("")}
        </div>
      ` : ""}
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

function evidenceEngineMarkup(engine = {}) {
  if (!engine.summary) return "";
  const gates = Array.isArray(engine.gates) ? engine.gates : [];
  const criticalGaps = Array.isArray(engine.criticalGaps) ? engine.criticalGaps : [];
  return `
    <section class="analysisEvidenceEngine ${escapeHtml(engine.status || "unknown")}">
      <header>
        <span><small>V4.0 EVIDENCE ENGINE</small><b>${escapeHtml(engine.summary)}</b></span>
        <em>${escapeHtml(engine.score || 0)}/100</em>
      </header>
      <p>${escapeHtml(engine.recommendationGate || "Evidence gate not calculated.")}</p>
      ${criticalGaps.length ? `<ul>${criticalGaps.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
      ${gates.length ? `
        <div>
          ${gates.map((item) => `
            <article class="evidenceGate ${escapeHtml(item.status || "missing")}">
              <i>${escapeHtml(item.status || "missing")}</i>
              <span>
                <b>${escapeHtml(item.label)} <small>${escapeHtml(item.score || 0)}/100</small></b>
                ${item.proof ? `<small>${escapeHtml(item.proof)}</small>` : ""}
                ${item.gap ? `<small>${escapeHtml(item.gap)}</small>` : ""}
                <em>${escapeHtml(item.action)}</em>
              </span>
            </article>
          `).join("")}
        </div>
      ` : ""}
    </section>
  `;
}

function transactionComparableMarkup(section = {}) {
  if (!section.summary) return "";
  const checks = Array.isArray(section.checks) ? section.checks : [];
  return `
    <section class="analysisTransactionComps ${escapeHtml(section.status || "unknown")}">
      <header>
        <span><small>V4.1 TRANSACTION COMPARABLES</small><b>${escapeHtml(section.summary)}</b></span>
        <em>${escapeHtml(section.score || 0)}/100</em>
      </header>
      <p>${escapeHtml(section.valuePosition || "Comparable value position is not calculated yet.")}</p>
      ${checks.length ? `
        <div>
          ${checks.map((item) => `
            <article class="transactionCompCheck ${escapeHtml(item.status || "missing")}">
              <i>${escapeHtml(item.status || "missing")}</i>
              <span>
                <b>${escapeHtml(item.label)}</b>
                ${item.proof ? `<small>${escapeHtml(item.proof)}</small>` : ""}
                ${item.gap ? `<small>${escapeHtml(item.gap)}</small>` : ""}
                <em>${escapeHtml(item.action)}</em>
              </span>
            </article>
          `).join("")}
        </div>
      ` : ""}
    </section>
  `;
}

function achievedRentalMarkup(section = {}) {
  if (!section.summary) return "";
  const checks = Array.isArray(section.checks) ? section.checks : [];
  return `
    <section class="analysisTransactionComps analysisRentalEvidence ${escapeHtml(section.status || "unknown")}">
      <header>
        <span><small>V4.2 ACHIEVED RENTAL EVIDENCE</small><b>${escapeHtml(section.summary)}</b></span>
        <em>${escapeHtml(section.score || 0)}/100</em>
      </header>
      <p>${escapeHtml(section.coveragePosition || "Rental coverage is not calculated yet.")}</p>
      ${checks.length ? `
        <div>
          ${checks.map((item) => `
            <article class="transactionCompCheck rentalEvidenceCheck ${escapeHtml(item.status || "missing")}">
              <i>${escapeHtml(item.status || "missing")}</i>
              <span>
                <b>${escapeHtml(item.label)}</b>
                ${item.proof ? `<small>${escapeHtml(item.proof)}</small>` : ""}
                ${item.gap ? `<small>${escapeHtml(item.gap)}</small>` : ""}
                <em>${escapeHtml(item.action)}</em>
              </span>
            </article>
          `).join("")}
        </div>
      ` : ""}
    </section>
  `;
}

function financingValuationMarkup(section = {}) {
  if (!section.summary) return "";
  const checks = Array.isArray(section.checks) ? section.checks : [];
  return `
    <section class="analysisTransactionComps analysisFinancingEvidence ${escapeHtml(section.status || "unknown")}">
      <header>
        <span><small>V4.3 FINANCING + VALUATION</small><b>${escapeHtml(section.summary)}</b></span>
        <em>${escapeHtml(section.score || 0)}/100</em>
      </header>
      <p>${escapeHtml(section.affordabilityPosition || "Financing affordability is not calculated yet.")}</p>
      ${checks.length ? `
        <div>
          ${checks.map((item) => `
            <article class="transactionCompCheck financingEvidenceCheck ${escapeHtml(item.status || "missing")}">
              <i>${escapeHtml(item.status || "missing")}</i>
              <span>
                <b>${escapeHtml(item.label)}</b>
                ${item.proof ? `<small>${escapeHtml(item.proof)}</small>` : ""}
                ${item.gap ? `<small>${escapeHtml(item.gap)}</small>` : ""}
                <em>${escapeHtml(item.action)}</em>
              </span>
            </article>
          `).join("")}
        </div>
      ` : ""}
    </section>
  `;
}

function supplyAbsorptionMarkup(section = {}) {
  if (!section.summary) return "";
  const checks = Array.isArray(section.checks) ? section.checks : [];
  return `
    <section class="analysisTransactionComps analysisSupplyEvidence ${escapeHtml(section.status || "unknown")}">
      <header>
        <span><small>V4.4 SUPPLY + ABSORPTION</small><b>${escapeHtml(section.summary)}</b></span>
        <em>${escapeHtml(section.score || 0)}/100</em>
      </header>
      <p>${escapeHtml(section.competitionPosition || "Supply competition position is not calculated yet.")}</p>
      ${checks.length ? `
        <div>
          ${checks.map((item) => `
            <article class="transactionCompCheck supplyEvidenceCheck ${escapeHtml(item.status || "missing")}">
              <i>${escapeHtml(item.status || "missing")}</i>
              <span>
                <b>${escapeHtml(item.label)}</b>
                ${item.proof ? `<small>${escapeHtml(item.proof)}</small>` : ""}
                ${item.gap ? `<small>${escapeHtml(item.gap)}</small>` : ""}
                <em>${escapeHtml(item.action)}</em>
              </span>
            </article>
          `).join("")}
        </div>
      ` : ""}
    </section>
  `;
}

function siteManagementMarkup(section = {}) {
  if (!section.summary) return "";
  const checks = Array.isArray(section.checks) ? section.checks : [];
  return `
    <section class="analysisTransactionComps analysisSiteEvidence ${escapeHtml(section.status || "unknown")}">
      <header>
        <span><small>V4.5 SITE + MANAGEMENT</small><b>${escapeHtml(section.summary)}</b></span>
        <em>${escapeHtml(section.score || 0)}/100</em>
      </header>
      <p>${escapeHtml(section.livedQualityPosition || "Site and management position is not calculated yet.")}</p>
      ${checks.length ? `
        <div>
          ${checks.map((item) => `
            <article class="transactionCompCheck siteEvidenceCheck ${escapeHtml(item.status || "missing")}">
              <i>${escapeHtml(item.status || "missing")}</i>
              <span>
                <b>${escapeHtml(item.label)}</b>
                ${item.proof ? `<small>${escapeHtml(item.proof)}</small>` : ""}
                ${item.gap ? `<small>${escapeHtml(item.gap)}</small>` : ""}
                <em>${escapeHtml(item.action)}</em>
              </span>
            </article>
          `).join("")}
        </div>
      ` : ""}
    </section>
  `;
}

function legalTransactionMarkup(section = {}) {
  if (!section.summary) return "";
  const checks = Array.isArray(section.checks) ? section.checks : [];
  return `
    <section class="analysisTransactionComps analysisLegalEvidence ${escapeHtml(section.status || "unknown")}">
      <header>
        <span><small>V4.6 LEGAL + TRANSACTION</small><b>${escapeHtml(section.summary)}</b></span>
        <em>${escapeHtml(section.score || 0)}/100</em>
      </header>
      <p>${escapeHtml(section.transactionPosition || "Legal transaction position is not calculated yet.")}</p>
      ${checks.length ? `
        <div>
          ${checks.map((item) => `
            <article class="transactionCompCheck legalEvidenceCheck ${escapeHtml(item.status || "missing")}">
              <i>${escapeHtml(item.status || "missing")}</i>
              <span>
                <b>${escapeHtml(item.label)}</b>
                ${item.proof ? `<small>${escapeHtml(item.proof)}</small>` : ""}
                ${item.gap ? `<small>${escapeHtml(item.gap)}</small>` : ""}
                <em>${escapeHtml(item.action)}</em>
              </span>
            </article>
          `).join("")}
        </div>
      ` : ""}
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

function v2WorkflowMarkup(title, section = {}, detailLabel = "FOCUS", detailValue = "") {
  if (!section.summary) return "";
  const checks = Array.isArray(section.checks) ? section.checks : [];
  const status = section.status || "watch";
  return `
    <section class="analysisV2Workflow ${escapeHtml(status)}">
      <header>
        <span><small>${escapeHtml(title)}</small><b>${escapeHtml(section.summary)}</b></span>
        <em>${escapeHtml(status)}</em>
      </header>
      ${detailValue ? `<p><b>${escapeHtml(detailLabel)}</b> ${escapeHtml(detailValue)}</p>` : ""}
      ${checks.length ? `<div>${checks.map((item) => `
        <article class="v2WorkflowCheck ${escapeHtml(item.status)}">
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
  const profile = loop.profile || {};
  return `
    <section class="analysisLearning">
      <header><span><small>LEARNING LOOP</small><b>${escapeHtml(loop.summary || "Matched private learning for this report.")}</b></span></header>
      ${profile.approvedCount ? `
        <div class="learningProfile">
          <span><small>MEMORY PROFILE</small><b>${escapeHtml(profile.investorType || "Profile building")} / ${escapeHtml(profile.riskStyle || "Needs more memory")}</b></span>
          <span><small>COMPLETENESS</small><b>${escapeHtml(profile.completeness || 0)}%</b></span>
        </div>
      ` : ""}
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

function scoreTone(score) {
  const value = Number(score || 0);
  if (value >= 75) return "strong";
  if (value >= 55) return "watch";
  return "weak";
}

function scoreByKey(analysis = {}, key, fallback = 0) {
  const dimension = (analysis.dimensions || []).find((item) => item.key === key);
  return Number(dimension?.score ?? fallback ?? 0);
}

function stageScoreByName(analysis = {}, pattern, fallback = 0) {
  const stage = (analysis.stages || []).find((item) => pattern.test(String(item.name || "")));
  return Number(stage?.score ?? fallback ?? 0);
}

function dealSnapshot(analysis = {}) {
  const blockers = textArray(analysis.recommendationBlockers);
  const watchouts = textArray(analysis.watchouts);
  const missing = textArray(analysis.missingEvidence);
  const nextActions = textArray(analysis.nextActions);
  const risk = blockers[0] || watchouts[0] || analysis.counterThesis || "No single dominant risk is proven yet; keep checking the weak evidence lane.";
  const missingProof = missing[0] || "No urgent proof gap listed, but live transaction, rent, site, financing, and legal checks still matter.";
  const nextAction = nextActions[0] || missingProof;
  const propertyScore = scoreByKey(analysis, "property");
  const rentalScore = stageScoreByName(analysis, /holding/i, Number(analysis.achievedRentalEvidence?.score || analysis.investorReadiness?.score || 0));
  const exitScore = scoreByKey(analysis, "exit");
  const evidenceScore = scoreByKey(analysis, "evidence", analysis.confidence);
  return {
    verdict: analysis.verdict || "INVESTIGATE",
    score: Number(analysis.averageScore || 0),
    confidence: Number(analysis.confidence || 0),
    reason: analysis.decisionFocus?.body || analysis.summary || "Apex needs more proof before upgrading the decision.",
    risk,
    missingProof,
    nextAction,
    scores: [
      { label: "Property Quality", value: propertyScore, status: scoreTone(propertyScore) },
      { label: "Rental Safety", value: rentalScore, status: scoreTone(rentalScore) },
      { label: "Exit Liquidity", value: exitScore, status: scoreTone(exitScore) },
      { label: "Evidence Confidence", value: evidenceScore, status: scoreTone(evidenceScore) }
    ]
  };
}

function dealSnapshotMarkup(analysis = {}) {
  const snapshot = dealSnapshot(analysis);
  return `
    <section class="dealSnapshot ${escapeHtml(String(snapshot.verdict).toLowerCase())}" aria-label="Deal screening snapshot">
      <header>
        <span><small>DEAL SCREEN</small><b>${escapeHtml(snapshot.verdict)}</b></span>
        <em>${escapeHtml(snapshot.score)}/100 / ${escapeHtml(snapshot.confidence)}% confidence</em>
      </header>
      <p>${escapeHtml(snapshot.reason)}</p>
      <div class="dealSnapshotGrid">
        <article><small>Main risk</small><b>${escapeHtml(snapshot.risk)}</b></article>
        <article><small>Missing proof</small><b>${escapeHtml(snapshot.missingProof)}</b></article>
        <article><small>Next action</small><b>${escapeHtml(snapshot.nextAction)}</b></article>
      </div>
      <div class="dealSnapshotScores">
        ${snapshot.scores.map((item) => `
          <article class="${escapeHtml(item.status)}">
            <span><small>${escapeHtml(item.label)}</small><b>${escapeHtml(item.value)}/100</b></span>
            <i><em style="width:${Math.max(0, Math.min(100, Number(item.value) || 0))}%"></em></i>
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
  latestAnalysisId = analysisId;
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
  const complianceMode = complianceRefusalMode(analysis);
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
    ${dealSnapshotMarkup(analysis)}
    ${decisionFocusMarkup(analysis)}
    ${productExperienceMarkup(analysis.productExperience)}
    ${personalizedChallengeMarkup(analysis.personalizedChallenge)}
    ${analysis.aiCommentary ? `
      <section class="analysisJarvisTake">
        <h3>APEX ANALYSIS</h3>
        <p>${escapeHtml(analysis.aiCommentary)}</p>
      </section>
    ` : ""}
    <div class="analysisMeta">
      <span>ENGINE <b>${escapeHtml(analysis.engineVersion || "Apex v10.10")}</b></span>
      <span>REASONING <b>${escapeHtml(analysis.reasoningMode || (analysis.aiCommentary ? "Framework + AI" : "Framework only"))}</b></span>
      <span>DECISION SCORE <b>${escapeHtml(analysis.averageScore)}/100</b></span>
      <span>INPUT COMPLETE <b>${escapeHtml(analysis.completeness)}%</b></span>
    </div>
    ${trustStampMarkup()}
    ${complianceRefusalMarkup(analysis)}
    ${professionalReviewMarkup(analysis)}
    ${commercialGuardrailMarkup(analysis)}
    ${developmentProfileMarkup(analysis)}
    ${developmentIntelligenceMarkup(analysis.developmentIntelligence)}
    ${caseIntelligenceMarkup(analysis.caseIntelligence)}
    ${documentIntelligenceMarkup(analysis.documentIntelligence)}
    ${portfolioCommandMarkup(analysis.portfolioCommand)}
    ${finalCommandMarkup(analysis.finalCommand)}
    <div class="analysisOverview">
      ${readinessMarkup(analysis.investorReadiness)}
      ${dimensionMarkup ? `<section class="analysisDimensionSection"><h3>DEAL SCORECARD</h3><div class="analysisDimensions">${dimensionMarkup}</div></section>` : ""}
    </div>
    ${metricMarkup ? `<div class="analysisMetrics">${metricMarkup}</div>` : ""}
    ${evidenceChecklistMarkup(analysis.evidenceChecklist || [])}
    ${evidenceEngineMarkup(analysis.evidenceEngine)}
    ${transactionComparableMarkup(analysis.transactionComparableEvidence)}
    ${achievedRentalMarkup(analysis.achievedRentalEvidence)}
    ${financingValuationMarkup(analysis.financingValuationEvidence)}
    ${supplyAbsorptionMarkup(analysis.supplyAbsorptionEvidence)}
    ${siteManagementMarkup(analysis.siteManagementEvidence)}
    ${legalTransactionMarkup(analysis.legalTransactionEvidence)}
    ${dueDiligenceMarkup(analysis.dueDiligencePlan)}
    ${stressEnvelopeMarkup(analysis.stressEnvelope)}
    ${portfolioGateMarkup(analysis.portfolioGate)}
    ${marketPulseMarkup(analysis.marketPulse)}
    ${holdExitPlanMarkup(analysis.holdExitPlan)}
    ${decisionSealMarkup(analysis.decisionSeal)}
    ${v2WorkflowMarkup("V2.1 SITE VISIT ASSISTANT", analysis.siteVisitAssistant, "FOCUS", analysis.siteVisitAssistant?.focus)}
    ${v2WorkflowMarkup("V2.2 SOURCING / PROFESSIONAL FILTER", analysis.sourcingProfessional, "POSTURE", analysis.sourcingProfessional?.posture)}
    ${v2WorkflowMarkup("V2.3 TENANT / RENTAL PLAN", analysis.tenantRentalPlan, "TARGET", analysis.tenantRentalPlan?.target)}
    ${v2WorkflowMarkup("V2.4 EXIT STRATEGY", analysis.exitStrategy, "BUYER PSYCHOLOGY", analysis.exitStrategy?.buyerPsychology)}
    ${executionPlanMarkup(analysis.executionPlan)}
    ${learningLoopMarkup(analysis.learningLoop)}
    ${v3MemoryInsightMarkup("V3.4 DEAL MEMORY COMPARISON", analysis.dealMemoryComparison, "matches")}
    ${v3MemoryInsightMarkup("V3.5 BELIEF TRACKER", analysis.beliefTracker, "beliefs")}
    ${v3MemoryInsightMarkup("V3.6 SOURCE TRANSPARENCY", analysis.sourceTransparency, "sources")}
    ${v3MemoryInsightMarkup("V3.7 MEMORY CONFLICTS", analysis.memoryConflicts, "conflicts")}
    ${v3MemoryInsightMarkup("V3.8 PERSONAL OPERATING RULES", analysis.personalOperatingRules, "rules")}
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
      <button type="button" data-analysis-action="shortlist">${complianceMode.status === "refuse" ? "SAVE FOR REVIEW" : "SAVE TO SHORTLIST"}</button>
      ${authenticatedUser && analysis.savedReportId ? '<button type="button" data-analysis-action="journal">RECORD DECISION</button>' : ""}
      <button type="button" data-analysis-action="copy">COPY REPORT</button>
      <button type="button" data-analysis-action="report">PRINT REPORT</button>
    </div>
    ${sourcesMarkup(sources)}
  `;
  transcript.append(message);
  const messageTop = message.getBoundingClientRect().top - transcript.getBoundingClientRect().top + transcript.scrollTop;
  transcript.scrollTop = Math.max(0, messageTop - 6);
  renderDealJourney();
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

function contextFieldsForPanel(panelName) {
  return Array.from(document.querySelectorAll(`[data-context-body="${panelName}"] [data-deal-field], [data-context-body="${panelName}"] [data-profile-field]`));
}

function contextGroupValue(context, keys = []) {
  return keys.some((key) => String(context[key] || "").trim());
}

function contextReadinessGroups(panelName) {
  if (panelName === "deal") {
    return [
      { label: "Area/project", keys: ["area", "projectName"] },
      { label: "Price", keys: ["askingPrice"] },
      { label: "Rent", keys: ["expectedRent"] },
      { label: "Comps", keys: ["comparableTransactions", "comparableSource", "conservativeFairValue"] },
      { label: "Site proof", keys: ["siteVisitEvidence", "siteVisitNotes"] },
      { label: "Title/legal", keys: ["legalTitleType", "legalCheck"] }
    ];
  }
  if (panelName === "profile") {
    return [
      { label: "Income", keys: ["monthlyIncome"] },
      { label: "Reserve", keys: ["cashReserveMonths", "cashAvailable"] },
      { label: "Debt", keys: ["currentDebt"] },
      { label: "Goal", keys: ["investmentGoal", "portfolioRole"] },
      { label: "Holding", keys: ["holdingPeriod"] },
      { label: "Concern", keys: ["financialConcern", "nearTermCommitment"] }
    ];
  }
  return [
    { label: "Experience", keys: ["experienceLevel"] },
    { label: "Mode", keys: ["guidanceMode"] },
    { label: "Intent", keys: ["decisionIntent"] },
    { label: "Output", keys: ["preferredOutput"] },
    { label: "Confidence", keys: ["confidenceComfort"] }
  ];
}

function contextPanelReadiness(panelName) {
  const fields = contextFieldsForPanel(panelName);
  const attributeName = panelName === "deal" ? "data-deal-field" : "data-profile-field";
  const context = collectContext(fields, attributeName);
  const groups = contextReadinessGroups(panelName);
  const missing = groups.filter((item) => !contextGroupValue(context, item.keys)).map((item) => item.label);
  const complete = groups.length - missing.length;
  const percent = Math.round((complete / groups.length) * 100);
  const status = percent >= 80 ? "ready" : percent >= 40 ? "watch" : "missing";
  return { panelName, context, fields, groups, missing, percent, status };
}

function renderContextReadiness() {
  if (!contextReadiness) return;
  const panels = [
    { panelName: "deal", label: "Deal" },
    { panelName: "profile", label: "Profile" },
    { panelName: "guidance", label: "Guidance" }
  ].map((item) => ({ ...item, ...contextPanelReadiness(item.panelName) }));
  contextReadiness.innerHTML = panels.map((item) => {
    const summary = item.missing.length ? `Missing ${item.missing.slice(0, 2).join(", ")}` : "Ready enough";
    return `
      <button class="${escapeHtml(item.status)}" type="button" data-readiness-panel="${escapeHtml(item.panelName)}" aria-label="Open ${escapeHtml(item.label)} context card">
        <span><small>${escapeHtml(item.label)}</small><b>${escapeHtml(item.percent)}%</b></span>
        <em>${escapeHtml(summary)}</em>
      </button>
    `;
  }).join("");
  renderExperienceLock();
  renderDealJourney();
}

function latestAnalysis() {
  return latestAnalysisId ? analysisRegistry.get(latestAnalysisId) || null : null;
}

function journeyStepClass(step) {
  if (step.status === "done") return "done";
  if (step.status === "active") return "active";
  if (step.status === "blocked") return "blocked";
  return "pending";
}

function renderDealJourney() {
  if (!dealJourney) return;
  const deal = contextPanelReadiness("deal");
  const profile = contextPanelReadiness("profile");
  const guidance = contextPanelReadiness("guidance");
  const analysis = latestAnalysis();
  const shortlistCount = readShortlist().length;
  const hasAnalysis = Boolean(analysis);
  const hasSavedReport = Boolean(analysis?.savedReportId);
  const guidanceReady = guidance.percent >= 60;
  const steps = [
    {
      label: "Context",
      status: deal.percent >= 50 && profile.percent >= 34 ? "done" : "active",
      detail: `${deal.percent}% deal / ${profile.percent}% profile`
    },
    {
      label: "Screen",
      status: hasAnalysis ? "done" : deal.percent >= 34 ? "active" : "blocked",
      detail: deal.percent >= 34 ? "quick read ready" : "needs area or price"
    },
    {
      label: "Report",
      status: hasAnalysis ? "done" : deal.percent >= 50 ? "active" : "pending",
      detail: hasAnalysis ? `${analysis.verdict || "Analysed"} / ${analysis.averageScore || 0}` : "formal scorecard"
    },
    {
      label: "Decide",
      status: hasAnalysis && (shortlistCount || hasSavedReport) ? "active" : "pending",
      detail: shortlistCount ? `${shortlistCount} shortlisted` : hasSavedReport ? "journal ready" : "save or journal"
    }
  ];
  let action = { label: "ADD DEAL", type: "deal", detail: "Start with area/project, price, rent, and concern." };
  if (deal.percent < 50) action = { label: "ADD DEAL", type: "deal", detail: `Missing ${deal.missing.slice(0, 2).join(", ") || "deal context"}.` };
  else if (profile.percent < 34) action = { label: "ADD PROFILE", type: "profile", detail: `Missing ${profile.missing.slice(0, 2).join(", ") || "financial profile"}.` };
  else if (!guidanceReady) action = { label: "SET STYLE", type: "guidance", detail: "Tune how direct, short, or guided Apex should be." };
  else if (!hasAnalysis && deal.percent < 80) action = { label: "SCREEN", type: "screen", detail: "Do a fast mentor check before full report." };
  else if (!hasAnalysis) action = { label: "ANALYSE", type: "analyze", detail: "Run the full Apex scorecard." };
  else if (!shortlistCount) action = { label: "SAVE", type: "save", detail: "Keep this report for comparison." };
  else if (shortlistCount >= 2) action = { label: "COMPARE", type: "shortlist", detail: "Open the shortlist and compare weak links." };
  else if (authenticatedUser && hasSavedReport) action = { label: "JOURNAL", type: "journal", detail: "Lock the pre-purchase thesis." };
  else action = { label: "BRIEF", type: "brief", detail: "Copy the current context and Apex view." };

  dealJourney.innerHTML = `
    <div class="dealJourneyHeader">
      <span><small>APEX DEAL JOURNEY</small><b>${escapeHtml(action.detail)}</b></span>
      <button type="button" data-journey-action="${escapeHtml(action.type)}">${escapeHtml(action.label)}</button>
    </div>
    <div class="dealJourneySteps">
      ${steps.map((step, index) => `
        <button class="${escapeHtml(journeyStepClass(step))}" type="button" data-journey-action="${escapeHtml(index === 0 ? "deal" : index === 1 ? "screen" : index === 2 ? "analyze" : "shortlist")}">
          <i>${escapeHtml(String(index + 1))}</i>
          <span><b>${escapeHtml(step.label)}</b><small>${escapeHtml(step.detail)}</small></span>
        </button>
      `).join("")}
    </div>
  `;
}

function renderExperienceLock() {
  if (!experienceLock) return;
  const panels = [
    { panelName: "deal", label: "D" },
    { panelName: "profile", label: "P" },
    { panelName: "guidance", label: "G" }
  ].map((item) => ({ ...item, ...contextPanelReadiness(item.panelName) }));
  const average = Math.round(panels.reduce((sum, item) => sum + item.percent, 0) / Math.max(1, panels.length));
  const status = average >= 80 ? "ready" : average >= 45 ? "building" : "thin";
  const feedback = readResponseFeedback();
  const latestFeedback = feedback[0]?.label || "";
  const mode = detectInputMode(chatInput.value);
  experienceLock.className = `experienceLock ${status}`;
  experienceLock.innerHTML = `
    <span><b>V5 LOCK</b><small>${escapeHtml(status === "ready" ? "READY" : status === "building" ? "BUILDING" : "NEEDS CONTEXT")}</small></span>
    <span><b>MODE</b><small>${escapeHtml(mode.label)}</small></span>
    <span><b>CONTEXT</b><small>${escapeHtml(`${average}% / ${panels.map((item) => `${item.label}${item.percent}`).join(" ")}`)}</small></span>
    <span><b>VOICE</b><small>${voiceResponsesEnabled ? "ON" : "OFF"}</small></span>
    <span><b>STYLE</b><small>${escapeHtml(feedback.length ? `${latestFeedback || "TUNED"} ${feedback.length}` : "NEUTRAL")}</small></span>
    <span><b>TRUST</b><small>${hasAcceptedTrustBoundary() ? "ACCEPTED" : "PENDING"}</small></span>
  `;
}

function focusFirstMissingContextField(panelName) {
  const readiness = contextPanelReadiness(panelName);
  const firstMissing = readiness.missing[0];
  if (!firstMissing) {
    readiness.fields[0]?.focus();
    return;
  }
  const group = readiness.groups.find((item) => item.label === firstMissing);
  const selector = panelName === "deal" ? "data-deal-field" : "data-profile-field";
  const field = readiness.fields.find((item) => group?.keys.includes(item.getAttribute(selector)));
  field?.focus();
}

function contextFieldKey(field) {
  return field.getAttribute("data-deal-field") || field.getAttribute("data-profile-field") || "";
}

function readContextFieldModes() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(contextFieldModeKey) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    window.localStorage.removeItem(contextFieldModeKey);
    return {};
  }
}

function writeContextFieldMode(panelName, mode) {
  const modes = readContextFieldModes();
  modes[panelName] = mode;
  window.localStorage.setItem(contextFieldModeKey, JSON.stringify(modes));
}

function contextFieldMode(panelName) {
  return readContextFieldModes()[panelName] === "all" ? "all" : "core";
}

function contextPanelHint(panelName, mode) {
  if (panelName === "deal") {
    return mode === "all"
      ? "Advanced evidence fields are visible. Use them when you have proof, not guesses."
      : "Start with area/project, price, rent, own-stay quality, management, exit pool, supply, and your main concern.";
  }
  if (panelName === "profile") {
    return mode === "all"
      ? "Advanced portfolio context is visible. Add it when the deal is moving beyond first screen."
      : "Start with income, reserve, cash available, debt, goal, holding period, and financial concern.";
  }
  return "Set the answer style once. Apex will use it to sound more like the adviser you need.";
}

function fieldForContextKey(panelName, key) {
  const selector = panelName === "deal" ? "data-deal-field" : "data-profile-field";
  return contextFieldsForPanel(panelName).find((field) => field.getAttribute(selector) === key);
}

function renderContextAssist(panelName) {
  const body = document.querySelector(`[data-context-body="${panelName}"]`);
  if (!body) return;
  const mode = contextFieldMode(panelName);
  let assist = body.querySelector(`[data-context-assist="${panelName}"]`);
  if (!assist) {
    assist = document.createElement("section");
    assist.className = "contextAssist";
    assist.setAttribute("data-context-assist", panelName);
    body.prepend(assist);
  }
  const readiness = contextPanelReadiness(panelName);
  const missingGroups = readiness.groups
    .filter((item) => !contextGroupValue(readiness.context, item.keys))
    .filter((item) => mode === "all" || item.keys.some((key) => contextCoreFieldKeys[panelName]?.has(key)))
    .slice(0, 3);
  const missingChips = missingGroups.map((item) => {
    const key = item.keys.find((candidate) => fieldForContextKey(panelName, candidate));
    return key ? `<button type="button" data-context-focus-panel="${escapeHtml(panelName)}" data-context-focus-key="${escapeHtml(key)}">${escapeHtml(item.label)}</button>` : "";
  }).filter(Boolean).join("");
  const panelLabel = panelName === "deal" ? "Deal" : panelName === "profile" ? "Profile" : "Guidance";
  assist.innerHTML = `
    <header>
      <span><small>${escapeHtml(panelLabel)} guide</small><b>${escapeHtml(mode === "all" ? "All fields visible" : "Essentials first")}</b></span>
      <button type="button" data-context-field-mode="${escapeHtml(panelName)}">${escapeHtml(mode === "all" ? "CORE ONLY" : "SHOW ALL")}</button>
    </header>
    <p>${escapeHtml(contextPanelHint(panelName, mode))}</p>
    ${missingChips ? `<div>${missingChips}</div>` : `<em>Enough context for a first pass. Add advanced proof only when the deal deserves deeper work.</em>`}
  `;
}

function applyContextFieldMode(panelName) {
  const body = document.querySelector(`[data-context-body="${panelName}"]`);
  if (!body) return;
  const mode = contextFieldMode(panelName);
  body.classList.toggle("contextCoreMode", mode !== "all");
  body.classList.toggle("contextAllMode", mode === "all");
  renderContextAssist(panelName);
}

function setContextFieldMode(panelName, mode) {
  writeContextFieldMode(panelName, mode);
  applyContextFieldMode(panelName);
  setSystemState("System ready", mode === "all" ? "Advanced fields visible." : "Showing only core fields.");
}

function markContextFieldDepth() {
  for (const panelName of Object.keys(contextCoreFieldKeys)) {
    for (const field of contextFieldsForPanel(panelName)) {
      const key = contextFieldKey(field);
      const label = field.closest("label");
      if (!label) continue;
      const isCore = contextCoreFieldKeys[panelName].has(key);
      label.classList.toggle("contextCore", isCore);
      label.classList.toggle("contextAdvanced", !isCore);
      label.dataset.contextDepth = isCore ? "core" : "advanced";
    }
    applyContextFieldMode(panelName);
  }
}

function refreshContextGuides() {
  for (const panelName of Object.keys(contextCoreFieldKeys)) renderContextAssist(panelName);
}

function compactContextList(context = {}, entries = []) {
  return entries
    .map(([key, label]) => {
      const value = String(context[key] || "").trim();
      return value ? `${label}: ${value}` : "";
    })
    .filter(Boolean)
    .join("; ");
}

function hasScreenableDealContext(deal = {}) {
  return Boolean(
    deal.area
    || deal.projectName
    || deal.askingPrice
    || deal.expectedRent
    || deal.propertyType
    || deal.mainConcern
    || deal.investmentThesis
  );
}

function dealScreeningPrompt() {
  const deal = collectDealCard();
  const profile = collectFinancialProfile();
  const dealReadiness = contextPanelReadiness("deal");
  const profileReadiness = contextPanelReadiness("profile");
  const dealLine = compactContextList(deal, [
    ["area", "area"],
    ["projectName", "project"],
    ["propertyType", "type"],
    ["askingPrice", "price"],
    ["conservativeFairValue", "fair value"],
    ["expectedRent", "rent"],
    ["estimatedInstallment", "installment"],
    ["maintenance", "maintenance"],
    ["ownStayAppeal", "own-stay"],
    ["managementQuality", "management"],
    ["exitBuyerPool", "exit pool"],
    ["nearbySupply", "nearby supply"],
    ["mainConcern", "concern"]
  ]) || "not supplied";
  const profileLine = compactContextList(profile, [
    ["monthlyIncome", "income"],
    ["cashReserveMonths", "reserve"],
    ["cashAvailable", "cash available"],
    ["currentDebt", "debt"],
    ["riskStyle", "risk style"],
    ["investmentGoal", "goal"],
    ["holdingPeriod", "holding"]
  ]) || "not supplied";
  const missing = [
    ...dealReadiness.missing.map((item) => `Deal: ${item}`),
    ...profileReadiness.missing.map((item) => `Profile: ${item}`)
  ].slice(0, 6).join("; ") || "no major card gap from the current quick screen";
  return [
    "Run Apex Deal Screening Mode as a first-pass mentor check, not a full formal report.",
    "Use this exact structure: Verdict, Why, Main risk, Missing proof, Next questions.",
    "Keep it short, human, and direct. Ask at most 3 next questions. Do not create a long report.",
    `Deal card: ${dealLine}`,
    `Profile card: ${profileLine}`,
    `Known missing context: ${missing}`
  ].join("\n");
}

async function runDealScreening() {
  const deal = collectDealCard();
  if (!hasScreenableDealContext(deal)) {
    addMessage("jarvis", "Open the Deal card and give me at least the area/project, price, rent, or your main concern. Then I can screen it without turning the page into a full report.");
    const dealToggle = contextToggles.find((toggle) => toggle.getAttribute("data-context-toggle") === "deal");
    if (dealToggle) setContextPanelState(dealToggle, true);
    focusFirstMissingContextField("deal");
    return;
  }
  collapseContextPanels();
  stopSpeaking("Screening the deal.");
  if (screenDealBtn) {
    screenDealBtn.disabled = true;
    screenDealBtn.textContent = "SCREENING";
  }
  setSystemState("Screening", "Running a first-pass deal screen.");
  try {
    await submitQuestion(dealScreeningPrompt(), { displayText: "Screen this deal using my current Deal/Profile cards." });
  } finally {
    if (screenDealBtn) {
      screenDealBtn.disabled = false;
      screenDealBtn.textContent = "SCREEN";
    }
  }
}

function saveContext(fields, attributeName, storageKey) {
  const context = collectContext(fields, attributeName);
  window.localStorage.setItem(storageKey, JSON.stringify(context));
  renderContextReadiness();
  refreshContextGuides();
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
  const fields = Array.from(document.querySelectorAll(`[data-context-body="${panelName}"] [data-deal-field], [data-context-body="${panelName}"] [data-profile-field]`));
  const allFields = isDeal ? dealFields : profileFields;
  const attributeName = isDeal ? "data-deal-field" : "data-profile-field";
  const storageKey = isDeal ? dealContextKey : profileContextKey;
  for (const field of fields) field.value = "";
  const context = collectContext(allFields, attributeName);
  if (Object.keys(context).length) {
    window.localStorage.setItem(storageKey, JSON.stringify(context));
  } else {
    window.localStorage.removeItem(storageKey);
  }
  const label = panelName === "guidance" ? "Guidance" : isDeal ? "Deal" : "Profile";
  renderContextReadiness();
  refreshContextGuides();
  setSystemState("System ready", `${label} details cleared.`);
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
  if (expanded) renderContextAssist(panelName);

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
  const spokenText = voiceSafeText(text);
  if (!("speechSynthesis" in window)) {
    if (serverTtsEnabled) void speakWithServer(spokenText);
    return;
  }
  stopSpeaking("Ready when you are.");
  const utterance = new SpeechSynthesisUtterance(spokenText);
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
    closeOwnerIntelligencePanel();
    closeOwnerMarketPanel();
    closeOwnerCasePanel();
    closeOwnerEvidencePanel();
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
  latestAnalysisId = "";
  document.body.classList.remove("conversationActive");
  renderDealJourney();
  return result.session;
}

async function resetChat() {
  stopSpeaking("Chat reset.");
  setSystemState("Resetting", "Clearing the current conversation.");
  const currentSessionId = sessionId;
  transcript.innerHTML = "";
  latestAnalysisId = "";
  document.body.classList.remove("conversationActive");
  renderDealJourney();
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
  const inputMode = detectInputMode(question);
  const result = await requestJson("/api/jarvis/query", {
    method: "POST",
    body: JSON.stringify({
      query: question,
      inputMode: inputMode.id,
      sessionId,
      clientId: clientId(),
      dealCard: collectDealCard(),
      financialProfile: collectFinancialProfile(),
      responseFeedback: responseFeedbackSummary()
    })
  });
  sessionId = result.session.id;
  window.localStorage.setItem(sessionKey, sessionId);
  const responseMode = result.mode === "llm" ? "AI" : "FRAMEWORK";
  setSessionState(`${responseMode} / ${result.session.messages.length}`);
  return result;
}

async function submitQuestion(question, options = {}) {
  const cleanQuestion = String(question || "").trim();
  if (!cleanQuestion) return;
  const displayText = String(options.displayText || cleanQuestion).trim();
  addMessage("user", displayText);
  chatInput.value = "";
  updateInputModeHint("");
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
  if (!requireTrustBoundary("deal-analysis")) return;

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
sessionBriefBtn.addEventListener("click", () => void copySessionBrief(sessionBriefBtn));
analyzeDealBtn.addEventListener("click", runDealAnalysis);
screenDealBtn?.addEventListener("click", () => void runDealScreening());
accountToggle.addEventListener("click", () => {
  if (authPanel.hidden) openAuthPanel();
  else closeAuthPanel();
});
memoryToggle.addEventListener("click", () => {
  if (memoryPanel.hidden) void openMemoryPanel();
  else closeMemoryPanel();
});
memoryClose.addEventListener("click", closeMemoryPanel);
memoryCaptureEnabled.addEventListener("change", () => void saveMemorySettings());
memoryReasoningEnabled.addEventListener("change", () => void saveMemorySettings());
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
ownerMarketToggle.addEventListener("click", () => {
  if (ownerMarketPanel.hidden) void openOwnerMarketPanel();
  else closeOwnerMarketPanel();
});
ownerMarketClose.addEventListener("click", closeOwnerMarketPanel);
ownerIntelToggle.addEventListener("click", () => {
  if (ownerIntelPanel.hidden) void openOwnerIntelligencePanel();
  else closeOwnerIntelligencePanel();
});
ownerIntelClose.addEventListener("click", closeOwnerIntelligencePanel);
ownerIntelPanel.addEventListener("click", (event) => {
  const button = event.target.closest("[data-owner-intel-action]");
  if (!button || ownerIntelActions.contains(button) || ownerIntelCoverage.contains(button)) return;
  const action = button.getAttribute("data-owner-intel-action");
  if (action === "refresh") void loadOwnerIntelligence();
});
ownerCaseToggle.addEventListener("click", () => {
  if (ownerCasePanel.hidden) void openOwnerCasePanel();
  else closeOwnerCasePanel();
});
ownerCaseClose.addEventListener("click", closeOwnerCasePanel);
ownerEvidenceToggle.addEventListener("click", () => {
  if (ownerEvidencePanel.hidden) void openOwnerEvidencePanel();
  else closeOwnerEvidencePanel();
});
ownerEvidenceClose.addEventListener("click", closeOwnerEvidencePanel);
trustToggle.addEventListener("click", () => {
  if (trustPanel.hidden) openTrustPanel();
  else closeTrustPanel();
});
trustClose.addEventListener("click", closeTrustPanel);
trustAccept.addEventListener("click", acceptTrustBoundary);
ownerMarketAccess.addEventListener("submit", (event) => {
  event.preventDefault();
  const token = ownerMarketToken.value.trim();
  if (!token) return ownerMarketToken.focus();
  syncOwnerTokens(token);
  void loadOwnerMarket();
});
ownerMarketClearToken.addEventListener("click", () => {
  syncOwnerTokens("");
  renderOwnerMarket({}, {});
  setOwnerMarketMessage("Owner token cleared from this device.");
});
ownerIntelAccess.addEventListener("submit", (event) => {
  event.preventDefault();
  const token = ownerIntelToken.value.trim();
  if (!token) return ownerIntelToken.focus();
  syncOwnerTokens(token);
  void loadOwnerIntelligence();
});
ownerIntelClearToken.addEventListener("click", () => {
  syncOwnerTokens("");
  renderOwnerIntelligence();
  setOwnerIntelMessage("Owner token cleared from this device.");
});
ownerIntelControls.addEventListener("click", (event) => {
  const filter = event.target.closest("[data-owner-intel-filter]")?.getAttribute("data-owner-intel-filter");
  if (!filter) return;
  ownerIntelFilter = filter;
  renderOwnerIntelCoverageRows(ownerIntelSnapshot?.rows || []);
});
ownerIntelCopyBrief.addEventListener("click", () => void copyOwnerIntelBrief());
ownerIntelActions.addEventListener("click", (event) => {
  const action = event.target.closest("[data-owner-intel-action]")?.getAttribute("data-owner-intel-action");
  if (action === "refresh") void loadOwnerIntelligence();
  if (action === "market") void openOwnerMarketPanel();
  if (action === "cases") void openOwnerCasePanel();
  if (action === "evidence") void openOwnerEvidencePanel();
});
ownerIntelCoverage.addEventListener("click", (event) => {
  const button = event.target.closest("[data-owner-intel-action]");
  const action = button?.getAttribute("data-owner-intel-action");
  if (action === "refresh") void loadOwnerIntelligence();
  if (["case", "signal", "proof"].includes(action)) void handleOwnerIntelProjectAction(action, button.getAttribute("data-owner-intel-project"));
});
ownerCaseAccess.addEventListener("submit", (event) => {
  event.preventDefault();
  const token = ownerCaseToken.value.trim();
  if (!token) return ownerCaseToken.focus();
  syncOwnerTokens(token);
  void loadOwnerCases();
});
ownerCaseClearToken.addEventListener("click", () => {
  syncOwnerTokens("");
  renderOwnerCases({});
  setOwnerCaseMessage("Owner token cleared from this device.");
});
ownerEvidenceAccess.addEventListener("submit", (event) => {
  event.preventDefault();
  const token = ownerEvidenceToken.value.trim();
  if (!token) return ownerEvidenceToken.focus();
  syncOwnerTokens(token);
  void loadOwnerEvidence();
});
ownerEvidenceClearToken.addEventListener("click", () => {
  syncOwnerTokens("");
  renderOwnerEvidence({});
  setOwnerEvidenceMessage("Owner token cleared from this device.");
});
ownerCaseForm.addEventListener("submit", (event) => {
  event.preventDefault();
  ownerCaseSubmit.disabled = true;
  saveOwnerCase().catch((error) => setOwnerCaseMessage(error.message || "Development case could not be saved.", "danger")).finally(() => {
    ownerCaseSubmit.disabled = false;
  });
});
ownerCaseCancelEdit.addEventListener("click", () => {
  clearOwnerCaseEditMode();
  setOwnerCaseMessage("Edit cancelled.");
});
ownerCaseProject.addEventListener("change", () => {
  const project = selectedOwnerCaseProject();
  if (!project) return;
  if (!ownerCaseProjectName.value) ownerCaseProjectName.value = project.name || "";
  if (!ownerCaseArea.value) ownerCaseArea.value = project.area || "";
  if (!ownerCaseState.value) ownerCaseState.value = project.state || "";
  if (!ownerCaseType.value) ownerCaseType.value = project.propertyType || "";
  if (!ownerCaseDeveloper.value) ownerCaseDeveloper.value = project.developer || "";
});
ownerCaseRefresh.addEventListener("click", () => void loadOwnerCases().catch((error) => setOwnerCaseMessage(error.message || "Development case library could not be loaded.", "danger")));
ownerCaseFilter.addEventListener("input", () => void loadOwnerCases().catch(() => {}));
ownerCaseVerdictFilter.addEventListener("change", () => void loadOwnerCases().catch((error) => setOwnerCaseMessage(error.message || "Development case library could not be loaded.", "danger")));
ownerCaseList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-owner-case-action]");
  const action = button?.getAttribute("data-owner-case-action");
  if (action === "edit") editOwnerCase(button);
  if (action === "delete") void deleteOwnerCase(button);
});
ownerEvidenceForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const button = ownerEvidenceForm.querySelector("button[type='submit']");
  button.disabled = true;
  createOwnerEvidence().catch((error) => setOwnerEvidenceMessage(error.message || "Evidence could not be added.", "danger")).finally(() => {
    button.disabled = false;
  });
});
ownerEvidenceRefresh.addEventListener("click", () => void loadOwnerEvidence().catch((error) => setOwnerEvidenceMessage(error.message || "Evidence vault could not be loaded.", "danger")));
ownerEvidenceList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-owner-evidence-action='delete']");
  if (button) void deleteOwnerEvidenceDocument(button);
});
ownerProjectForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const button = ownerProjectForm.querySelector("button[type='submit']");
  button.disabled = true;
  createOwnerProject().catch((error) => setOwnerMarketMessage(error.message || "Project could not be added.", "danger")).finally(() => {
    button.disabled = false;
  });
});
ownerObservationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const button = ownerObservationForm.querySelector("button[type='submit']");
  button.disabled = true;
  createOwnerObservation().catch((error) => setOwnerMarketMessage(error.message || "Observation could not be added.", "danger")).finally(() => {
    button.disabled = false;
  });
});
ownerObservationProject.addEventListener("change", () => {
  const project = ownerMarketProjects.find((item) => item.id === ownerObservationProject.value);
  if (project && !ownerObservationArea.value) ownerObservationArea.value = project.area || "";
});
ownerMarketRefresh.addEventListener("click", () => void loadOwnerMarket().catch((error) => setOwnerMarketMessage(error.message || "Market evidence could not be loaded.", "danger")));
ownerMarketAreaFilter.addEventListener("input", () => void loadOwnerMarket().catch(() => {}));
ownerMarketMetricFilter.addEventListener("change", () => void loadOwnerMarket().catch((error) => setOwnerMarketMessage(error.message || "Market evidence could not be loaded.", "danger")));
ownerMarketFreshnessFilter.addEventListener("change", () => void loadOwnerMarket().catch((error) => setOwnerMarketMessage(error.message || "Market evidence could not be loaded.", "danger")));
ownerObservationList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-owner-market-action='delete-observation']");
  if (button) void deleteOwnerObservation(button);
});
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
    const feedbackButton = event.target.closest("[data-response-feedback]");
    if (feedbackButton) handleResponseFeedback(feedbackButton);
    const refineButton = event.target.closest("[data-response-refine]");
    if (refineButton) void handleResponseRefine(refineButton);
    const coachButton = event.target.closest("[data-coach-prompt]");
    if (coachButton) {
      chatInput.value = coachButton.getAttribute("data-coach-prompt") || "";
      chatInput.focus();
      setSystemState("System ready", "Prompt loaded. Edit or send when ready.");
    }
  });
}
shortlistList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-shortlist-action]");
  if (button) handleShortlistAction(button);
});
dealJourney?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-journey-action]");
  if (button) handleJourneyAction(button);
});
contextReadiness?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-readiness-panel]");
  if (!button) return;
  const panelName = button.getAttribute("data-readiness-panel");
  const toggle = contextToggles.find((item) => item.getAttribute("data-context-toggle") === panelName);
  if (toggle) setContextPanelState(toggle, true);
  focusFirstMissingContextField(panelName);
});
document.addEventListener("click", (event) => {
  const modeButton = event.target.closest("[data-context-field-mode]");
  if (modeButton) {
    const panelName = modeButton.getAttribute("data-context-field-mode");
    setContextFieldMode(panelName, contextFieldMode(panelName) === "all" ? "core" : "all");
    return;
  }
  const focusButton = event.target.closest("[data-context-focus-panel]");
  if (focusButton) {
    const panelName = focusButton.getAttribute("data-context-focus-panel");
    const key = focusButton.getAttribute("data-context-focus-key");
    const toggle = contextToggles.find((item) => item.getAttribute("data-context-toggle") === panelName);
    if (toggle) setContextPanelState(toggle, true);
    fieldForContextKey(panelName, key)?.focus();
  }
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
  if (event.key === "Escape" && !ownerIntelPanel.hidden) closeOwnerIntelligencePanel();
  if (event.key === "Escape" && !ownerMarketPanel.hidden) closeOwnerMarketPanel();
  if (event.key === "Escape" && !ownerCasePanel.hidden) closeOwnerCasePanel();
  if (event.key === "Escape" && !ownerEvidencePanel.hidden) closeOwnerEvidencePanel();
  if (event.key === "Escape" && !trustPanel.hidden) closeTrustPanel();
  if (event.key === "Escape" && !shortlistPanel.hidden) closeShortlistPanel();
});
window.addEventListener("afterprint", finishPrinting);

chatInput.addEventListener("input", () => updateInputModeHint());
chatInput.addEventListener("focus", () => {
  const mode = updateInputModeHint();
  setSystemState("System ready", mode.prompt);
});

soundToggle.addEventListener("click", () => {
  voiceResponsesEnabled = !voiceResponsesEnabled;
  soundToggle.textContent = voiceResponsesEnabled ? "VOICE ON" : "VOICE OFF";
  soundToggle.setAttribute("aria-pressed", String(voiceResponsesEnabled));
  document.body.classList.toggle("voiceMuted", !voiceResponsesEnabled);
  renderExperienceLock();
  if (!voiceResponsesEnabled) stopSpeaking("Voice response off.");
  else setSystemState("System ready", "Voice response on. Spoken replies stay compact.");
});

for (const field of dealFields) {
  field.addEventListener("input", () => saveContext(dealFields, "data-deal-field", dealContextKey));
  field.addEventListener("change", () => saveContext(dealFields, "data-deal-field", dealContextKey));
}

for (const field of profileFields) {
  field.addEventListener("input", () => saveContext(profileFields, "data-profile-field", profileContextKey));
  field.addEventListener("change", () => saveContext(profileFields, "data-profile-field", profileContextKey));
}

async function bootJarvis() {
  restoreContext(dealFields, "data-deal-field", dealContextKey);
  restoreContext(profileFields, "data-profile-field", profileContextKey);
  markContextFieldDepth();
  renderTrustAcceptance();
  updateInputModeHint();
  renderContextReadiness();
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
    ownerMarketEnabled = Boolean(status.ownerMarket?.enabled);
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
