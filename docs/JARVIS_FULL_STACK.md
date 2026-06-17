# Jarvis Full-Stack Architecture

## Product Shape

EstateLab Jarvis is no longer only a static local page. It is a full-stack assistant with:

- A frontend voice/chat interface in `public/`.
- A Node backend in `server.js`.
- A curated owner knowledge base in `docs/`, `data/db.json`, and `rag/corpus.json`.
- Public Jarvis chat sessions persisted separately from the curated knowledge base.
- Owner-only APIs protected by `ESTATELAB_OWNER_TOKEN`.

## Boundary

Normal users can:

- Open the Jarvis frontend.
- Create a Jarvis session.
- Ask questions.
- Receive answers from curated references, beliefs, and decisions.
- Continue the same browser session with persisted chat history.

Normal users cannot:

- Add beliefs.
- Edit framework files.
- Add RAG references.
- Add property data.
- Edit decisions.
- Modify the owner knowledge base.

Public chat history is stored under `jarvis.sessions` in `data/db.json`. It is conversation memory, not curated knowledge.

## Public Jarvis APIs

- `GET /api/jarvis/status`
- `POST /api/jarvis/sessions`
- `GET /api/jarvis/sessions/:id`
- `DELETE /api/jarvis/sessions/:id`
- `POST /api/jarvis/query`

`POST /api/jarvis/query` accepts:

```json
{
  "query": "Should I buy this property?",
  "sessionId": "optional-existing-session-id",
  "clientId": "browser-client-id"
}
```

It returns:

```json
{
  "answer": "Jarvis response",
  "sources": [],
  "message": {},
  "session": {}
}
```

## Owner APIs

Existing non-Jarvis APIs remain owner-only unless explicitly marked public by `isPublicApiRoute()` in `server.js`.

Owner APIs require:

```http
x-estatelab-owner-token: <ESTATELAB_OWNER_TOKEN>
```

If no owner token is configured, owner APIs are disabled.

## Current Storage

The current version uses file-backed JSON storage:

- `data/db.json`: properties, comps, brain, Jarvis sessions.
- `rag/corpus.json`: retrieval snippets.
- `docs/`: long-form framework and operating rules.

This is suitable for a private prototype and local development.

## Production Upgrade Path

For a public launch, replace file-backed JSON storage with:

- PostgreSQL or Supabase for users, sessions, decisions, properties, and audit records.
- Object storage for uploaded documents.
- A vector database or embedding index for retrieval.
- Auth for owner/admin access.
- Rate limits and abuse protection for public Jarvis chat.
- Server-side speech-to-text and text-to-speech if browser voice APIs are not enough.

The current route design is intentionally close to that future shape, so the frontend does not need to be rebuilt from scratch.
