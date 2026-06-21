import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import http from "node:http";
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

async function jsonRequest(baseUrl, pathname, { method = "GET", body } = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      "content-type": "application/json",
      "x-estatelab-client-id": "provider-routing-test"
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { response, payload: await response.json() };
}

test("OpenRouter reports the model that actually answered", async (t) => {
  let captured = null;
  const providerPort = await freePort();
  const provider = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    captured = {
      url: req.url,
      authorization: req.headers.authorization,
      title: req.headers["x-title"],
      body: JSON.parse(Buffer.concat(chunks).toString("utf8"))
    };
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({
      model: "anthropic/claude-test-resolved",
      choices: [{ message: { role: "assistant", content: "Hello. What property are we thinking about today?" } }]
    }));
  });
  await new Promise((resolve, reject) => {
    provider.once("error", reject);
    provider.listen(providerPort, "127.0.0.1", resolve);
  });

  const dataDir = await mkdtemp(path.join(os.tmpdir(), "estatelab-openrouter-"));
  const appPort = await freePort();
  const baseUrl = `http://127.0.0.1:${appPort}`;
  const child = spawn(process.execPath, [path.join(repoDir, "server.js")], {
    cwd: repoDir,
    env: {
      ...process.env,
      PORT: String(appPort),
      ESTATELAB_DATA_DIR: dataDir,
      OPENAI_API_KEY: "",
      OPENROUTER_API_KEY: "test-openrouter-key",
      LLM_MODEL: "LLM_MODEL=deepseek/deepseek-v4-flash",
      LLM_BASE_URL: `http://127.0.0.1:${providerPort}`
    },
    stdio: "ignore"
  });

  t.after(async () => {
    if (child.exitCode === null) {
      child.kill();
      await new Promise((resolve) => child.once("exit", resolve));
    }
    await new Promise((resolve) => provider.close(resolve));
    await rm(dataDir, { recursive: true, force: true });
  });

  await waitForHealth(baseUrl, child);
  const before = await jsonRequest(baseUrl, "/api/jarvis/status");
  assert.equal(before.payload.llm.provider, "openrouter");
  assert.equal(before.payload.llm.configuredModel, "deepseek/deepseek-v4-flash");
  assert.equal(before.payload.llm.resolvedModel, null);

  const session = await jsonRequest(baseUrl, "/api/jarvis/sessions", { method: "POST", body: {} });
  const answer = await jsonRequest(baseUrl, "/api/jarvis/query", {
    method: "POST",
    body: { sessionId: session.payload.session.id, query: "Hello Apex Analytic" }
  });
  assert.equal(answer.response.status, 200);
  assert.equal(answer.payload.mode, "llm");
  assert.equal(answer.payload.provider, "openrouter");
  assert.equal(answer.payload.model, "anthropic/claude-test-resolved");
  assert.equal(answer.payload.message.mode, "llm");
  assert.equal(answer.payload.message.provider, "openrouter");
  assert.equal(answer.payload.message.model, "anthropic/claude-test-resolved");
  assert.equal(captured.url, "/chat/completions");
  assert.equal(captured.authorization, "Bearer test-openrouter-key");
  assert.equal(captured.title, "Apex Analytic");
  assert.equal(captured.body.model, "deepseek/deepseek-v4-flash");
  assert.equal(captured.body.messages[0].role, "system");

  const after = await jsonRequest(baseUrl, "/api/jarvis/status");
  assert.equal(after.payload.llm.resolvedModel, "anthropic/claude-test-resolved");
  assert.ok(after.payload.llm.lastUsedAt);
});
