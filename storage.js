import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS estatelab_meta (
    singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
    revision BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS estatelab_core (
    singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
    properties JSONB NOT NULL DEFAULT '[]'::jsonb,
    comps JSONB NOT NULL DEFAULT '[]'::jsonb,
    brain JSONB NOT NULL DEFAULT '{}'::jsonb,
    knowledge JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  ALTER TABLE estatelab_core ADD COLUMN IF NOT EXISTS knowledge JSONB NOT NULL DEFAULT '{}'::jsonb;

  CREATE TABLE IF NOT EXISTS estatelab_users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    memory JSONB NOT NULL DEFAULT '{"version":4,"settings":{"captureEnabled":false,"reasoningEnabled":false},"items":[],"answerStyle":{"version":1,"feedback":[]}}'::jsonb,
    billing JSONB NOT NULL DEFAULT '{"version":1,"plan":"free","status":"active","reportCredits":0,"usage":{"period":"","count":0},"processedEvents":[]}'::jsonb,
    reports JSONB NOT NULL DEFAULT '{"version":1,"items":[]}'::jsonb,
    journal JSONB NOT NULL DEFAULT '{"version":1,"items":[]}'::jsonb,
    email_verified_at TIMESTAMPTZ,
    disabled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL
  );

  ALTER TABLE estatelab_users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';
  ALTER TABLE estatelab_users ADD COLUMN IF NOT EXISTS memory JSONB NOT NULL DEFAULT '{"version":4,"settings":{"captureEnabled":false,"reasoningEnabled":false},"items":[],"answerStyle":{"version":1,"feedback":[]}}'::jsonb;
  ALTER TABLE estatelab_users ADD COLUMN IF NOT EXISTS billing JSONB NOT NULL DEFAULT '{"version":1,"plan":"free","status":"active","reportCredits":0,"usage":{"period":"","count":0},"processedEvents":[]}'::jsonb;
  ALTER TABLE estatelab_users ADD COLUMN IF NOT EXISTS reports JSONB NOT NULL DEFAULT '{"version":1,"items":[]}'::jsonb;
  ALTER TABLE estatelab_users ADD COLUMN IF NOT EXISTS journal JSONB NOT NULL DEFAULT '{"version":1,"items":[]}'::jsonb;
  ALTER TABLE estatelab_users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
  ALTER TABLE estatelab_users ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ;

  CREATE UNIQUE INDEX IF NOT EXISTS estatelab_users_email_lower_idx
    ON estatelab_users (LOWER(email));

  CREATE TABLE IF NOT EXISTS estatelab_auth_sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES estatelab_users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
  );

  CREATE INDEX IF NOT EXISTS estatelab_auth_sessions_user_idx
    ON estatelab_auth_sessions (user_id);

  CREATE INDEX IF NOT EXISTS estatelab_auth_sessions_expiry_idx
    ON estatelab_auth_sessions (expires_at);

  CREATE TABLE IF NOT EXISTS estatelab_auth_tokens (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES estatelab_users(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
  );

  CREATE INDEX IF NOT EXISTS estatelab_auth_tokens_expiry_idx
    ON estatelab_auth_tokens (expires_at);

  CREATE TABLE IF NOT EXISTS estatelab_jarvis_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES estatelab_users(id) ON DELETE SET NULL,
    client_id TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  );

  CREATE INDEX IF NOT EXISTS estatelab_jarvis_sessions_user_updated_idx
    ON estatelab_jarvis_sessions (user_id, updated_at DESC);

  CREATE INDEX IF NOT EXISTS estatelab_jarvis_sessions_client_updated_idx
    ON estatelab_jarvis_sessions (client_id, updated_at DESC);

  CREATE TABLE IF NOT EXISTS estatelab_jarvis_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES estatelab_jarvis_sessions(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    mode TEXT NOT NULL DEFAULT '',
    provider TEXT NOT NULL DEFAULT '',
    model TEXT NOT NULL DEFAULT '',
    sources JSONB NOT NULL DEFAULT '[]'::jsonb
  );

  ALTER TABLE estatelab_jarvis_messages ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT '';
  ALTER TABLE estatelab_jarvis_messages ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT '';
  ALTER TABLE estatelab_jarvis_messages ADD COLUMN IF NOT EXISTS model TEXT NOT NULL DEFAULT '';

  CREATE UNIQUE INDEX IF NOT EXISTS estatelab_jarvis_messages_position_idx
    ON estatelab_jarvis_messages (session_id, position);

  INSERT INTO estatelab_meta (singleton, revision)
  VALUES (TRUE, 0)
  ON CONFLICT (singleton) DO NOTHING;
`;

function iso(value) {
  if (value instanceof Date) return value.toISOString();
  return String(value || new Date().toISOString());
}

function serializableState(state) {
  return {
    properties: Array.isArray(state?.properties) ? state.properties : [],
    comps: Array.isArray(state?.comps) ? state.comps : [],
    brain: state?.brain && typeof state.brain === "object" ? state.brain : {},
    knowledge: state?.knowledge && typeof state.knowledge === "object" ? state.knowledge : { version: 3, documents: [], chunks: [], retrievalEvents: [], projects: [], observations: [], developmentCases: [] },
    jarvis: state?.jarvis && typeof state.jarvis === "object" ? state.jarvis : { sessions: [] },
    auth: state?.auth && typeof state.auth === "object" ? state.auth : { version: 5, users: [], sessions: [], tokens: [] }
  };
}

export class StorageConflictError extends Error {
  constructor() {
    super("EstateLab data changed during this request. Please retry.");
    this.name = "StorageConflictError";
    this.statusCode = 409;
  }
}

export class JsonStateStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.kind = "json";
    this.writeQueue = Promise.resolve();
  }

  async init(seedState) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    if (!existsSync(this.filePath)) await this.write(seedState);
  }

  async read() {
    const parsed = JSON.parse(await readFile(this.filePath, "utf8"));
    return { ...parsed, _storageRevision: Number(parsed._storageRevision || 0) };
  }

  async write(state) {
    this.writeQueue = this.writeQueue.catch(() => {}).then(async () => {
      let currentRevision = 0;
      try {
        const existing = JSON.parse(await readFile(this.filePath, "utf8"));
        currentRevision = Number(existing._storageRevision || 0);
      } catch {
        currentRevision = 0;
      }
      const expectedRevision = Number(state?._storageRevision ?? currentRevision);
      if (currentRevision !== expectedRevision) throw new StorageConflictError();
      const payload = `${JSON.stringify({ ...serializableState(state), _storageRevision: currentRevision + 1 }, null, 2)}\n`;
      await writeFile(this.filePath, payload);
    });
    return this.writeQueue;
  }

  async close() {}
}

export class PostgresStateStore {
  constructor(pool) {
    this.pool = pool;
    this.kind = "postgres";
  }

  async init(seedState) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(SCHEMA_SQL);
      const existing = await client.query("SELECT singleton FROM estatelab_core WHERE singleton = TRUE");
      if (!existing.rows.length) {
        await this.syncState(client, serializableState(seedState));
        await client.query("UPDATE estatelab_meta SET revision = 1, updated_at = NOW() WHERE singleton = TRUE");
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async read() {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
      const revisionResult = await client.query("SELECT revision FROM estatelab_meta WHERE singleton = TRUE");
      const coreResult = await client.query("SELECT properties, comps, brain, knowledge FROM estatelab_core WHERE singleton = TRUE");
      const usersResult = await client.query("SELECT id, email, display_name, password_hash, role, memory, billing, reports, journal, email_verified_at, disabled_at, created_at FROM estatelab_users ORDER BY created_at");
      const authResult = await client.query("SELECT token_hash, user_id, created_at, expires_at FROM estatelab_auth_sessions WHERE expires_at > NOW() ORDER BY created_at DESC");
      const authTokenResult = await client.query("SELECT token_hash, user_id, purpose, created_at, expires_at FROM estatelab_auth_tokens WHERE expires_at > NOW() ORDER BY created_at DESC");
      const sessionsResult = await client.query("SELECT id, user_id, client_id, title, created_at, updated_at FROM estatelab_jarvis_sessions ORDER BY updated_at DESC");
      const messagesResult = await client.query("SELECT id, session_id, position, role, content, created_at, mode, provider, model, sources FROM estatelab_jarvis_messages ORDER BY session_id, position");
      await client.query("COMMIT");

      const messagesBySession = new Map();
      for (const row of messagesResult.rows) {
        const messages = messagesBySession.get(row.session_id) || [];
        messages.push({
          id: row.id,
          role: row.role,
          content: row.content,
          createdAt: iso(row.created_at),
          mode: row.mode || "",
          provider: row.provider || "",
          model: row.model || "",
          sources: Array.isArray(row.sources) ? row.sources : []
        });
        messagesBySession.set(row.session_id, messages);
      }

      const core = coreResult.rows[0] || {};
      return {
        properties: Array.isArray(core.properties) ? core.properties : [],
        comps: Array.isArray(core.comps) ? core.comps : [],
        brain: core.brain && typeof core.brain === "object" ? core.brain : {},
        knowledge: core.knowledge && typeof core.knowledge === "object" ? core.knowledge : {},
        jarvis: {
          sessions: sessionsResult.rows.map((row) => ({
            id: row.id,
            userId: row.user_id || "",
            clientId: row.client_id,
            title: row.title,
            createdAt: iso(row.created_at),
            updatedAt: iso(row.updated_at),
            messages: messagesBySession.get(row.id) || []
          }))
        },
        auth: {
          version: 5,
          users: usersResult.rows.map((row) => ({
            id: row.id,
            email: row.email,
            displayName: row.display_name,
            passwordHash: row.password_hash,
            role: row.role || "member",
            memory: row.memory && typeof row.memory === "object" ? row.memory : { version: 1, items: [] },
            billing: row.billing && typeof row.billing === "object" ? row.billing : { version: 1, plan: "free", status: "active", reportCredits: 0, usage: { period: "", count: 0 }, processedEvents: [] },
            reports: row.reports && typeof row.reports === "object" ? row.reports : { version: 1, items: [] },
            journal: row.journal && typeof row.journal === "object" ? row.journal : { version: 1, items: [] },
            emailVerifiedAt: row.email_verified_at ? iso(row.email_verified_at) : "",
            disabledAt: row.disabled_at ? iso(row.disabled_at) : "",
            createdAt: iso(row.created_at)
          })),
          sessions: authResult.rows.map((row) => ({
            tokenHash: row.token_hash,
            userId: row.user_id,
            createdAt: iso(row.created_at),
            expiresAt: iso(row.expires_at)
          })),
          tokens: authTokenResult.rows.map((row) => ({
            tokenHash: row.token_hash,
            userId: row.user_id,
            purpose: row.purpose,
            createdAt: iso(row.created_at),
            expiresAt: iso(row.expires_at)
          }))
        },
        _storageRevision: Number(revisionResult.rows[0]?.revision || 0)
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async write(state) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const currentResult = await client.query("SELECT revision FROM estatelab_meta WHERE singleton = TRUE FOR UPDATE");
      const currentRevision = Number(currentResult.rows[0]?.revision || 0);
      const expectedRevision = Number(state?._storageRevision ?? currentRevision);
      if (currentRevision !== expectedRevision) throw new StorageConflictError();
      await this.syncState(client, serializableState(state));
      await client.query("UPDATE estatelab_meta SET revision = revision + 1, updated_at = NOW() WHERE singleton = TRUE");
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async syncState(client, state) {
    const users = Array.isArray(state.auth?.users) ? state.auth.users : [];
    const userIds = new Set(users.map((user) => String(user.id)));
    const authSessions = (Array.isArray(state.auth?.sessions) ? state.auth.sessions : [])
      .filter((session) => userIds.has(String(session.userId)));
    const authTokens = (Array.isArray(state.auth?.tokens) ? state.auth.tokens : [])
      .filter((token) => userIds.has(String(token.userId)));
    const jarvisSessions = Array.isArray(state.jarvis?.sessions) ? state.jarvis.sessions : [];
    const messages = jarvisSessions.flatMap((session) => (session.messages || []).map((message, position) => ({
      ...message,
      sessionId: session.id,
      position
    })));

    await client.query(`
      INSERT INTO estatelab_core (singleton, properties, comps, brain, knowledge, updated_at)
      VALUES (TRUE, $1::jsonb, $2::jsonb, $3::jsonb, $4::jsonb, NOW())
      ON CONFLICT (singleton) DO UPDATE SET
        properties = EXCLUDED.properties,
        comps = EXCLUDED.comps,
        brain = EXCLUDED.brain,
        knowledge = EXCLUDED.knowledge,
        updated_at = NOW()
    `, [JSON.stringify(state.properties), JSON.stringify(state.comps), JSON.stringify(state.brain), JSON.stringify(state.knowledge)]);

    for (const user of users) {
      await client.query(`
        INSERT INTO estatelab_users (id, email, display_name, password_hash, role, memory, billing, reports, journal, email_verified_at, disabled_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          display_name = EXCLUDED.display_name,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          memory = EXCLUDED.memory,
          billing = EXCLUDED.billing,
          reports = EXCLUDED.reports,
          journal = EXCLUDED.journal,
          email_verified_at = EXCLUDED.email_verified_at,
          disabled_at = EXCLUDED.disabled_at
      `, [
        user.id,
        user.email,
        user.displayName,
        user.passwordHash,
        user.role || "member",
        JSON.stringify(user.memory || { version: 1, items: [] }),
        JSON.stringify(user.billing || { version: 1, plan: "free", status: "active", reportCredits: 0, usage: { period: "", count: 0 }, processedEvents: [] }),
        JSON.stringify(user.reports || { version: 1, items: [] }),
        JSON.stringify(user.journal || { version: 1, items: [] }),
        user.emailVerifiedAt || null,
        user.disabledAt || null,
        user.createdAt
      ]);
    }

    for (const session of jarvisSessions) {
      const userId = userIds.has(String(session.userId || "")) ? session.userId : null;
      await client.query(`
        INSERT INTO estatelab_jarvis_sessions (id, user_id, client_id, title, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          client_id = EXCLUDED.client_id,
          title = EXCLUDED.title,
          updated_at = EXCLUDED.updated_at
      `, [session.id, userId, session.clientId, session.title, session.createdAt, session.updatedAt]);
    }

    for (const authSession of authSessions) {
      await client.query(`
        INSERT INTO estatelab_auth_sessions (token_hash, user_id, created_at, expires_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (token_hash) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          expires_at = EXCLUDED.expires_at
      `, [authSession.tokenHash, authSession.userId, authSession.createdAt, authSession.expiresAt]);
    }

    for (const token of authTokens) {
      await client.query(`
        INSERT INTO estatelab_auth_tokens (token_hash, user_id, purpose, created_at, expires_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (token_hash) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          purpose = EXCLUDED.purpose,
          expires_at = EXCLUDED.expires_at
      `, [token.tokenHash, token.userId, token.purpose, token.createdAt, token.expiresAt]);
    }

    await client.query("DELETE FROM estatelab_jarvis_messages");
    for (const message of messages) {
      await client.query(`
        INSERT INTO estatelab_jarvis_messages (id, session_id, position, role, content, created_at, mode, provider, model, sources)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
      `, [message.id, message.sessionId, message.position, message.role, message.content, message.createdAt, message.mode || "", message.provider || "", message.model || "", JSON.stringify(message.sources || [])]);
    }

    await client.query("DELETE FROM estatelab_auth_sessions WHERE NOT (token_hash = ANY($1::text[])) OR expires_at <= NOW()", [authSessions.map((session) => String(session.tokenHash))]);
    await client.query("DELETE FROM estatelab_auth_tokens WHERE NOT (token_hash = ANY($1::text[])) OR expires_at <= NOW()", [authTokens.map((token) => String(token.tokenHash))]);
    await client.query("DELETE FROM estatelab_jarvis_sessions WHERE NOT (id = ANY($1::text[]))", [jarvisSessions.map((session) => String(session.id))]);
    await client.query("DELETE FROM estatelab_users WHERE NOT (id = ANY($1::text[]))", [users.map((user) => String(user.id))]);
  }

  async close() {
    await this.pool.end();
  }
}

export async function createStateStore({ databaseUrl, filePath, seedState, pool = null }) {
  if (!databaseUrl && !pool) {
    const store = new JsonStateStore(filePath);
    await store.init(seedState);
    return store;
  }

  let activePool = pool;
  if (!activePool) {
    let Pool;
    try {
      ({ Pool } = await import("pg"));
    } catch {
      throw new Error("DATABASE_URL is configured but the pg package is unavailable. Run npm install before starting EstateLab.");
    }
    const configuredPoolMax = Number(globalThis.process?.env?.ESTATELAB_PG_POOL_MAX || 5);
    activePool = new Pool({
      connectionString: databaseUrl,
      max: Number.isFinite(configuredPoolMax) ? Math.max(1, configuredPoolMax) : 5,
      connectionTimeoutMillis: 8000,
      idleTimeoutMillis: 30000,
      application_name: "estatelab-jarvis"
    });
    activePool.on("error", (error) => console.error("EstateLab PostgreSQL pool error", error));
  }

  const store = new PostgresStateStore(activePool);
  await store.init(seedState);
  return store;
}
