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
const authMessage = document.querySelector("#authMessage");
const authUserPanel = document.querySelector("#authUser");
const authUserName = document.querySelector("#authUserName");
const authUserEmail = document.querySelector("#authUserEmail");
const logoutButton = document.querySelector("#logoutButton");
const dealFields = Array.from(document.querySelectorAll("[data-deal-field]"));
const profileFields = Array.from(document.querySelectorAll("[data-profile-field]"));
const contextToggles = Array.from(document.querySelectorAll("[data-context-toggle]"));

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
const sessionKey = "estatelab.jarvis.sessionId";
const clientKey = "estatelab.jarvis.clientId";
const dealContextKey = "estatelab.jarvis.dealCard";
const profileContextKey = "estatelab.jarvis.financialProfile";
const contextPanelKey = "estatelab.jarvis.contextPanels";
let voiceResponsesEnabled = true;
let listening = false;
let speaking = false;
let voiceStopRequested = false;
let sessionId = window.localStorage.getItem(sessionKey);
let authMode = "login";
let authenticatedUser = null;

function clientId() {
  const existing = window.localStorage.getItem(clientKey);
  if (existing) return existing;
  const next = crypto.randomUUID();
  window.localStorage.setItem(clientKey, next);
  return next;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
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
  authMessage.textContent = "";
}

function renderAuthState(user) {
  authenticatedUser = user || null;
  const signedIn = Boolean(authenticatedUser);
  const firstName = String(authenticatedUser?.displayName || "GUEST").trim().split(/\s+/)[0];
  accountLabel.textContent = firstName.slice(0, 16).toUpperCase();
  authForm.hidden = signedIn;
  authUserPanel.hidden = !signedIn;
  authTitle.textContent = signedIn ? "ACCOUNT" : authMode === "register" ? "CREATE ACCOUNT" : "SIGN IN";
  if (signedIn) {
    authUserName.textContent = authenticatedUser.displayName;
    authUserEmail.textContent = authenticatedUser.email;
  }
}

function openAuthPanel() {
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
  if (type === "belief") return "BELIEF";
  if (type === "decision") return "DECISION";
  return "REFERENCE";
}

function sourceName(source) {
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

function addMessage(role, text, sources = []) {
  document.body.classList.add("conversationActive");
  const message = document.createElement("article");
  message.className = `message ${role}`;
  message.innerHTML = `
    <strong>${role === "jarvis" ? "JARVIS" : "YOU"}</strong>
    <div class="messageText">${escapeHtml(text).replace(/\n/g, "<br>")}</div>
    ${role === "jarvis" ? sourcesMarkup(sources) : ""}
  `;
  transcript.append(message);
  transcript.scrollTop = transcript.scrollHeight;
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

function addDealAnalysis(analysis, sources = []) {
  document.body.classList.add("conversationActive");
  const message = document.createElement("article");
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

  message.className = "message jarvis analysisMessage";
  message.innerHTML = `
    <div class="analysisHeader">
      <span><small>SEVEN-STAGE VERDICT</small><b>${escapeHtml(analysis.verdict)}</b></span>
      <i class="analysisVerdict ${escapeHtml(verdictClass)}">${escapeHtml(analysis.confidence)}% CONFIDENCE</i>
    </div>
    <p class="analysisSummary">${escapeHtml(analysis.summary)}</p>
    ${analysis.aiCommentary ? `
      <section class="analysisJarvisTake">
        <h3>JARVIS TAKE</h3>
        <p>${escapeHtml(analysis.aiCommentary)}</p>
      </section>
    ` : ""}
    <div class="analysisMeta">
      <span>FRAMEWORK SCORE <b>${escapeHtml(analysis.averageScore)}/100</b></span>
      <span>INPUT COMPLETE <b>${escapeHtml(analysis.completeness)}%</b></span>
    </div>
    ${metricMarkup ? `<div class="analysisMetrics">${metricMarkup}</div>` : ""}
    <ol class="analysisStages">${stageMarkup}</ol>
    <div class="analysisDetails">
      ${analysisSection("Hard stops", analysis.hardStops, "danger")}
      ${analysisSection("Watch-outs", analysis.watchouts, "warning")}
      ${analysisSection("Missing evidence", analysis.missingEvidence)}
      ${analysisSection("Check next", analysis.nextActions, "actions")}
    </div>
    <section class="analysisCounter">
      <h3>STRONGEST COUNTER-THESIS</h3>
      <p>${escapeHtml(analysis.counterThesis)}</p>
    </section>
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
    addMessage(message.role, message.content, message.sources || []);
  }
}

function setSpeakingState(active) {
  speaking = active;
  jarvisOrb.classList.toggle("speaking", active);
  jarvisOrb.setAttribute("aria-label", active ? "Stop Jarvis voice" : "Talk to Jarvis");
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
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  voiceStopRequested = true;
  setSpeakingState(false);
  if (!listening) setSystemState("System ready", prompt);
}

function speak(text) {
  if (!voiceResponsesEnabled || !("speechSynthesis" in window)) return;
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
    throw new Error(payload.error || "Jarvis backend is unavailable.");
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
    setSystemState("System ready", `Welcome back, ${result.user.displayName}.`);
  } catch (error) {
    authMessage.textContent = error.message || "Account access is unavailable.";
  } finally {
    authSubmit.disabled = false;
  }
}

async function logout() {
  logoutButton.disabled = true;
  try {
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
    setSystemState("Connection issue", "Jarvis backend is unavailable.");
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
      // A new private session is safer than blocking Jarvis startup.
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
    addMessage("jarvis", result.answer, result.sources);
    speak(result.answer);
    if (!voiceResponsesEnabled) setSystemState("System ready", "Ready when you are.");
  } catch (error) {
    const message = error.message || "The Jarvis backend is unavailable.";
    addMessage("jarvis", message);
    speak(message);
    setSystemState("Connection issue", "Start EstateLab and try again.");
    setSessionState("OFFLINE");
  } finally {
    if (!window.speechSynthesis?.speaking) jarvisOrb.classList.remove("speaking");
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
  addMessage("user", "Run the seven-stage EstateLab analysis for this deal.");
  analyzeDealBtn.disabled = true;
  analyzeDealBtn.textContent = "ANALYSING...";
  setSystemState("Analyzing", "Running all seven EstateLab stages.");
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
    addDealAnalysis(result.analysis, result.sources);
    speak(result.analysis.voiceSummary);
    if (!voiceResponsesEnabled) setSystemState("System ready", "Analysis complete.");
  } catch (error) {
    const message = error.message || "The deal analysis is unavailable.";
    addMessage("jarvis", message);
    setSystemState("Connection issue", "Deal analysis could not be completed.");
  } finally {
    analyzeDealBtn.disabled = false;
    analyzeDealBtn.textContent = "ANALYSE";
    if (!window.speechSynthesis?.speaking) jarvisOrb.classList.remove("speaking");
  }
}

function startListening() {
  if (speaking || window.speechSynthesis?.speaking) {
    stopSpeaking("Voice stopped.");
    return;
  }
  if (!recognition) {
    setSystemState("Voice unavailable", "Use the command bar on this browser.");
    chatInput.focus();
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
authClose.addEventListener("click", closeAuthPanel);
authModeToggle.addEventListener("click", () => setAuthMode(authMode === "login" ? "register" : "login"));
authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitAuth();
});
logoutButton.addEventListener("click", logout);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !authPanel.hidden) closeAuthPanel();
});

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
  bootContextPanels();
  setAuthMode("login");
  try {
    const status = await requestJson("/api/jarvis/status");
    const intelligenceMode = status.llm?.enabled ? "AI" : "FRAMEWORK";
    aiDisclosure.hidden = !status.llm?.enabled;
    await loadAuthState();
    await ensureSession();
    setSessionState(`${intelligenceMode} READY`);
    setSystemState("System ready", "Ready when you are.");
  } catch {
    setSystemState("Connection issue", "Jarvis backend is unavailable.");
    setSessionState("OFFLINE");
  }
}

bootJarvis();
