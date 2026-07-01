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
  const { port } = probe.address();
  await new Promise((resolve) => probe.close(resolve));
  return port;
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

test("responses carry hardening security headers on both API and static routes", async (t) => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), "apex-security-headers-"));
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [path.join(repoDir, "server.js")], {
    cwd: repoDir,
    env: { ...process.env, PORT: String(port), ESTATELAB_DATA_DIR: dataDir, OPENAI_API_KEY: "", OPENROUTER_API_KEY: "" },
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

  for (const route of ["/api/health", "/"]) {
    const response = await fetch(`${baseUrl}${route}`);
    await response.arrayBuffer().catch(() => {});
    assert.equal(response.headers.get("x-content-type-options"), "nosniff", `${route} must send X-Content-Type-Options: nosniff.`);
    assert.equal(response.headers.get("x-frame-options"), "DENY", `${route} must deny framing to block clickjacking.`);
    assert.match(response.headers.get("content-security-policy") || "", /default-src 'self'/, `${route} must send a restrictive Content-Security-Policy.`);
    assert.match(response.headers.get("referrer-policy") || "", /strict-origin/, `${route} must send a Referrer-Policy.`);
  }
});
