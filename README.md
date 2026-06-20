# EstateLab Jarvis

EstateLab Jarvis is a minimal full-stack app for a Malaysia-focused real estate investment second brain.

The public user experience is intentionally simple: users interact with one Jarvis-style chat interface. The EstateLab knowledge base stays controlled by the owner; public users can query guidance and create chat sessions, but they cannot add to or change the underlying knowledge base.

## What Is Included

- Jarvis-style browser UI with voice input and voice response support.
- Seven-stage Deal Analysis using the Deal Card and Financial Profile, with structured verdicts, hard stops, stress metrics, counter-thesis, and missing evidence.
- Node.js backend with no external npm dependencies.
- Public Jarvis endpoints for chat, session creation, and knowledge status.
- Owner-protected APIs for property analysis, RAG querying, beliefs, decisions, and comparable data.
- Seeded EstateLab knowledge base in `data/db.json` and `rag/corpus.json`.
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
OPENAI_API_KEY=your-server-side-api-key
OPENAI_MODEL=gpt-4.1-mini
OPENAI_TIMEOUT_MS=25000
```

`ESTATELAB_OWNER_TOKEN` protects the owner-only APIs. Public Jarvis chat endpoints remain accessible without this token.

`ESTATELAB_DATA_DIR` is useful in production. If the folder is empty on first start, the app seeds the runtime database from the bundled `data/db.json`.

`OPENAI_API_KEY` enables conversational AI through the server-side OpenAI Responses API. The key is never sent to the browser. `OPENAI_MODEL` is configurable, and Jarvis automatically falls back to its deterministic EstateLab response engine if the API is unavailable.

When AI mode is enabled, chat messages and any Deal Card or Financial Profile context submitted with the message are sent to OpenAI for response generation. Public input remains conversation data and is not promoted into EstateLab's owner-controlled knowledge base.

## Deploy On Render

Render is the recommended first deployment target for this app because it can run a long-lived Node server and attach a persistent disk for the file-based EstateLab data store.

1. Create a new Web Service from this repository.
2. Use `npm install` as the build command.
3. Use `npm start` as the start command.
4. Set `ESTATELAB_OWNER_TOKEN` as a secret environment variable.
5. Set `OPENAI_API_KEY` as a secret environment variable to enable conversational AI.
6. Add a persistent disk and set `ESTATELAB_DATA_DIR` to the disk mount path, for example `/var/data`.

A starter `render.yaml` blueprint is included. It defines a Node web service in Singapore, `/api/health` health check, and a 1 GB persistent disk mounted at `/var/data`.

Note: Render persistent disks require a paid web service plan. The blueprint uses the `starter` plan so chat sessions and runtime data can survive deploys and restarts.

The bundled EstateLab knowledge base ships with the repo. On first start, if the Render disk is empty, the app seeds the runtime database from `data/db.json`.

## API Boundary

Public:

- `GET /api/health`
- `GET /api/jarvis/status`
- `POST /api/jarvis/sessions`
- `GET /api/jarvis/sessions/:id`
- `DELETE /api/jarvis/sessions/:id`
- `POST /api/jarvis/query`
- `POST /api/jarvis/analyze-deal`

Owner-only:

- Portfolio/property APIs
- Second brain answer, belief, and decision APIs
- Raw RAG guidance API
- Comparable transaction APIs

Owner-only calls require:

```text
x-estatelab-owner-token: your-token
```

## Product Direction

This is the first deployable app layer. The next serious upgrade should be authentication and a real database before opening it to normal users at scale.
