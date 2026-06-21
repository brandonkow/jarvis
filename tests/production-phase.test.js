import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
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

async function request(baseUrl, pathname, { method = "GET", body, cookie = "", owner = false } = {}) {
  const headers = { "x-estatelab-client-id": "production-phase-test" };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (cookie) headers.cookie = cookie;
  if (owner) headers["x-estatelab-owner-token"] = "owner-test-token";
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const payload = response.status === 204 ? null : await response.json();
  return { response, payload, cookie: String(response.headers.get("set-cookie") || "").split(";")[0] };
}

test("production phase keeps evidence owner-only and completes the account lifecycle", async (t) => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), "estatelab-production-"));
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [path.join(repoDir, "server.js")], {
    cwd: repoDir,
    env: {
      ...process.env,
      PORT: String(port),
      ESTATELAB_DATA_DIR: dataDir,
      ESTATELAB_OWNER_TOKEN: "owner-test-token",
      ESTATELAB_AUTH_DEBUG_TOKENS: "true",
      OPENAI_API_KEY: ""
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

  const deniedUpload = await request(baseUrl, "/api/owner/documents", {
    method: "POST",
    body: { title: "Private evidence", text: "Private" }
  });
  assert.equal(deniedUpload.response.status, 403);

  const upload = await request(baseUrl, "/api/owner/documents", {
    method: "POST",
    owner: true,
    body: {
      title: "Bayan Lepas tenant interview",
      filename: "tenant-interview.md",
      mimeType: "text/markdown",
      tags: ["Penang", "rental"],
      text: "Bayan Lepas semiconductor engineering hires created urgent rental enquiries for secure two-bedroom units near the industrial park."
    }
  });
  assert.equal(upload.response.status, 201);
  assert.equal(upload.payload.document.status, "indexed");
  assert.equal(upload.payload.document.indexMode, "lexical");

  const session = await request(baseUrl, "/api/jarvis/sessions", { method: "POST", body: {} });
  const query = await request(baseUrl, "/api/jarvis/query", {
    method: "POST",
    body: {
      sessionId: session.payload.session.id,
      query: "What does our evidence say about urgent semiconductor rental enquiries in Bayan Lepas?"
    }
  });
  assert.equal(query.response.status, 200);
  assert.equal(query.payload.mode, "framework");
  assert.equal(query.payload.message.mode, "framework");
  assert.equal(query.payload.message.model, "");
  assert.ok(query.payload.sources.some((source) => source.type === "evidence" && source.title === "Bayan Lepas tenant interview"));
  assert.match(query.payload.answer, /Owner evidence/i);

  const metrics = await request(baseUrl, "/api/owner/retrieval/metrics", { owner: true });
  assert.equal(metrics.response.status, 200);
  assert.equal(metrics.payload.totalQueries, 1);
  assert.equal(metrics.payload.recent[0].queryLength > 0, true);
  assert.ok(!JSON.stringify(metrics.payload).includes("semiconductor rental enquiries"));

  const registration = await request(baseUrl, "/api/auth/register", {
    method: "POST",
    body: { displayName: "Production Member", email: "production@example.com", password: "initial-password-123" }
  });
  assert.equal(registration.response.status, 201);
  assert.equal(registration.payload.user.emailVerified, false);
  const verificationToken = registration.payload.debug.token;

  const verification = await request(baseUrl, "/api/auth/verify-email", {
    method: "POST",
    body: { token: verificationToken }
  });
  assert.equal(verification.payload.user.emailVerified, true);

  const recovery = await request(baseUrl, "/api/auth/forgot-password", {
    method: "POST",
    body: { email: "production@example.com" }
  });
  assert.equal(recovery.response.status, 200);
  const reset = await request(baseUrl, "/api/auth/reset-password", {
    method: "POST",
    body: { token: recovery.payload.debug.token, password: "replacement-password-456" }
  });
  assert.equal(reset.payload.reset, true);

  const login = await request(baseUrl, "/api/auth/login", {
    method: "POST",
    body: { email: "production@example.com", password: "replacement-password-456" }
  });
  assert.equal(login.response.status, 200);

  const deniedMemory = await request(baseUrl, "/api/memory");
  assert.equal(deniedMemory.response.status, 401);

  const memberSession = await request(baseUrl, "/api/jarvis/sessions", {
    method: "POST",
    cookie: login.cookie,
    body: {}
  });
  const memoryQuery = await request(baseUrl, "/api/jarvis/query", {
    method: "POST",
    cookie: login.cookie,
    body: {
      sessionId: memberSession.payload.session.id,
      query: "Remember that I prefer freehold landed property for long-term appreciation."
    }
  });
  assert.equal(memoryQuery.response.status, 200);
  assert.equal(memoryQuery.payload.memoryCandidate.status, "pending");
  assert.equal(memoryQuery.payload.sources.some((source) => source.type === "memory"), false);

  const approvedMemory = await request(baseUrl, `/api/memory/${memoryQuery.payload.memoryCandidate.id}`, {
    method: "PATCH",
    cookie: login.cookie,
    body: { action: "approve" }
  });
  assert.equal(approvedMemory.payload.item.status, "approved");

  const nextSession = await request(baseUrl, "/api/jarvis/sessions", {
    method: "POST",
    cookie: login.cookie,
    body: {}
  });
  const recalled = await request(baseUrl, "/api/jarvis/query", {
    method: "POST",
    cookie: login.cookie,
    body: {
      sessionId: nextSession.payload.session.id,
      query: "What property do I prefer for appreciation?"
    }
  });
  assert.ok(recalled.payload.sources.some((source) => source.type === "memory"));
  assert.match(recalled.payload.answer, /freehold landed property/i);

  await request(baseUrl, `/api/jarvis/sessions/${nextSession.payload.session.id}`, {
    method: "DELETE",
    cookie: login.cookie
  });
  const memoryAfterNewChat = await request(baseUrl, "/api/memory", { cookie: login.cookie });
  assert.equal(memoryAfterNewChat.payload.summary.approved, 1);

  const users = await request(baseUrl, "/api/admin/users", { owner: true });
  const member = users.payload.users.find((user) => user.email === "production@example.com");
  assert.ok(member);
  assert.equal("memory" in member, false);
  assert.equal("reports" in member, false);
  assert.equal("billing" in member, false);
  assert.equal("journal" in member, false);
  const disabled = await request(baseUrl, `/api/admin/users/${member.id}`, {
    method: "PATCH",
    owner: true,
    body: { disabled: true }
  });
  assert.equal(disabled.payload.user.disabled, true);

  const db = JSON.parse(await readFile(path.join(dataDir, "db.json"), "utf8"));
  assert.equal(db.knowledge.documents.length, 1);
  assert.ok(!JSON.stringify(db.knowledge).includes("freehold landed property"));
  assert.equal(db.auth.users.find((user) => user.email === "production@example.com").memory.items[0].status, "approved");
  assert.equal(db.knowledge.retrievalEvents[0].queryHash.length, 24);
  assert.ok(!JSON.stringify(db).includes("replacement-password-456"));
});
