# Apex Analytic

Apex Analytic is a minimal full-stack app for a Malaysia-focused real estate investment second brain.

The public user experience is intentionally simple: users interact with one Apex Analytic interface. The knowledge base stays controlled by the owner; public users can query guidance and create chat sessions, but they cannot add to or change the underlying knowledge base.

## What Is Included

- Apex Analytic browser UI with browser voice plus server speech fallback.
- Optional member accounts with private, resumable chat sessions; guests remain device-scoped.
- Reviewed long-term memory for signed-in users, with pending suggestions, explicit approval, and cross-session recall.
- Email verification, password recovery, and owner-only account administration.
- PostgreSQL production storage with automatic JSON fallback for local development.
- Owner-controlled evidence uploads, private original-file storage, chunking, optional embeddings, hybrid retrieval, and retrieval monitoring.
- Public request limits for chat, voice, and account endpoints.
- Seven-stage Deal Analysis using the Deal Card and Financial Profile, with structured verdicts, hard stops, stress metrics, counter-thesis, and missing evidence.
- Node.js backend with a single production database driver dependency (`pg`).
- Public assistant endpoints for chat, session creation, and knowledge status.
- Owner-protected APIs for property analysis, RAG querying, beliefs, decisions, and comparable data.
- Seeded Apex Analytic knowledge base in `data/db.json` and `rag/corpus.json`.
- Deployment-ready health check at `/api/health`.

## Run Locally

```bash
npm install
npm start
```

Then open:

```text
http://localhost:3000
```

## Environment Variables

```text
PORT=3000
ESTATELAB_OWNER_TOKEN=change-this-before-using-owner-apis
ESTATELAB_DATA_DIR=./data
ESTATELAB_RAG_PATH=./rag/corpus.json
ESTATELAB_OBJECT_DIR=./data/objects
OPENAI_API_KEY=your-server-side-api-key
OPENAI_MODEL=gpt-4.1-mini
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_FREE_ROUTING=true
OPENAI_SERVICES_API_KEY=optional-separate-openai-key
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe
OPENAI_SPEECH_MODEL=gpt-4o-mini-tts
OPENAI_SPEECH_VOICE=marin
OPENAI_TIMEOUT_MS=25000
ESTATELAB_AUTH_SESSION_DAYS=30
ESTATELAB_REQUIRE_EMAIL_VERIFICATION=false
ESTATELAB_EMAIL_WEBHOOK_URL=https://your-email-automation.example/hook
ESTATELAB_EMAIL_WEBHOOK_SECRET=your-webhook-bearer-secret
ESTATELAB_AUTH_DEBUG_TOKENS=false
DATABASE_URL=postgresql://user:password@host:5432/database
ESTATELAB_PG_POOL_MAX=5
```

`ESTATELAB_OWNER_TOKEN` protects the owner-only APIs. Public chat endpoints remain accessible without this token. Legacy environment-variable and API-route names remain unchanged to preserve deployment compatibility.

`ESTATELAB_DATA_DIR` controls the JSON fallback and PostgreSQL migration source. If the folder is empty on first start, Apex Analytic seeds it from the bundled `data/db.json`.

Apex Analytic supports OpenAI and OpenRouter for conversational reasoning. Set `OPENROUTER_API_KEY` to select OpenRouter automatically. OpenRouter uses `openrouter/free` by default so it can choose an available free model for each request. Set `OPENROUTER_FREE_ROUTING=false` with an exact `LLM_MODEL` only when a fixed model is required. The frontend identifies AI-assisted responses without exposing the selected model. `OPENAI_API_KEY` remains compatible with direct OpenAI reasoning. The keys are never sent to the browser.

Advanced provider overrides are `LLM_PROVIDER`, `LLM_API_KEY`, and `LLM_BASE_URL`. An OpenRouter key accidentally stored in `OPENAI_API_KEY` is detected by its `sk-or-` prefix and routed correctly.

Embeddings and server voice use OpenAI-specific endpoints. When OpenRouter handles reasoning, set a separate `OPENAI_SERVICES_API_KEY` only if those services are needed. Evidence retrieval otherwise falls back to lexical matching, browser speech remains the first voice path where available, and written chat continues if audio generation fails.

`ESTATELAB_OBJECT_DIR` stores private originals uploaded through the owner evidence API. Text, Markdown, CSV, JSON, and HTML are indexed immediately. Other formats are retained but reported as stored rather than indexed. On Render, keep this directory on the persistent disk.

`ESTATELAB_EMAIL_WEBHOOK_URL` is an optional server-to-server delivery hook for verification and reset codes. The hook receives `type`, `to`, `displayName`, `token`, and `expiresAt`; set `ESTATELAB_EMAIL_WEBHOOK_SECRET` to add a bearer credential. Keep `ESTATELAB_AUTH_DEBUG_TOKENS=false` in production. Enable mandatory verification only after delivery is working.

When AI mode is enabled, chat messages, approved private memories, and any Deal Card or Financial Profile context submitted with the message are sent to the configured provider for response generation. Public input is never promoted into Apex Analytic's owner-controlled knowledge base. Long-term memories remain private to the signed-in account, and pending suggestions do not influence responses until the user approves them.

Member passwords are scrypt-hashed. Login cookies are opaque, `HttpOnly`, `SameSite=Strict`, and automatically marked `Secure` behind Render HTTPS. Only a hash of each login token is stored. Guest chat access is bound to the originating browser client ID.

When `DATABASE_URL` is set, Apex Analytic creates its PostgreSQL schema automatically and uses transactional PostgreSQL storage. If the database is empty, the first startup imports the current JSON database as its seed. Without `DATABASE_URL`, the app continues using `data/db.json`.

## Deploy On Render

Render is the recommended first deployment target because it can run the Node service, attach PostgreSQL, and retain the existing persistent disk during migration.

1. Create a new Web Service from this repository.
2. Use `npm install` as the build command.
3. Use `npm start` as the start command.
4. Set `ESTATELAB_OWNER_TOKEN` as a secret environment variable.
5. Set either `OPENROUTER_API_KEY` or `OPENAI_API_KEY` as a secret environment variable to enable conversational AI.
6. Create or attach a PostgreSQL database and set `DATABASE_URL` to its internal connection URL.
7. Keep the persistent disk and `ESTATELAB_DATA_DIR=/var/data` during the first migration so PostgreSQL can import the existing JSON state.
8. Keep `ESTATELAB_OBJECT_DIR=/var/data/objects` on the disk for uploaded source originals.
9. Optionally configure `ESTATELAB_EMAIL_WEBHOOK_URL`, test delivery, and then set `ESTATELAB_REQUIRE_EMAIL_VERIFICATION=true`.

A starter `render.yaml` blueprint is included. It defines a Node web service in Singapore, `/api/health` health check, and a 1 GB persistent disk mounted at `/var/data`.

Note: Render persistent disks require a paid web service plan. The blueprint keeps the existing disk as a migration source and JSON fallback. Once PostgreSQL has been verified, runtime account and chat persistence no longer depends on that disk.

The bundled Apex Analytic knowledge base ships with the repo. On first start, if the Render disk is empty, the app seeds the runtime database from `data/db.json`.

## API Boundary

Public:

- `GET /api/health`
- `GET /api/jarvis/status`
- `GET /api/auth/me`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/request-verification`
- `POST /api/auth/verify-email`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/memory` (signed-in account)
- `POST /api/memory` (signed-in account)
- `PATCH /api/memory/:id` (signed-in account)
- `DELETE /api/memory/:id` (signed-in account)
- `GET /api/jarvis/sessions`
- `POST /api/jarvis/sessions`
- `GET /api/jarvis/sessions/:id`
- `DELETE /api/jarvis/sessions/:id`
- `POST /api/jarvis/query`
- `POST /api/jarvis/analyze-deal`
- `POST /api/jarvis/transcribe`
- `POST /api/jarvis/speech`

Owner-only:

- Portfolio/property APIs
- Second brain answer, belief, and decision APIs
- Raw RAG guidance API
- Comparable transaction APIs
- Evidence document and retrieval-monitoring APIs
- User administration APIs

Owner-only calls require:

```text
x-estatelab-owner-token: your-token
```

## Product Direction

The original infrastructure roadmap is now implemented as one bounded production platform: authenticated conversations, PostgreSQL persistence, owner evidence ingestion, hybrid retrieval, monitoring, account lifecycle controls, abuse limits, and server voice fallback. Future work should be driven by measured usage rather than another automatic phase, especially retrieval quality, email-provider delivery, and storage scale.
