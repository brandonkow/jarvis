# Real Estate RAG Draft

## Purpose

The app includes a local retrieval layer that answers investment questions from a small, editable knowledge base. It is intentionally simple for v1: no external vector database, no cloud API, and no private data leaving the machine.

Retrieval is only one part of the EstateLab second brain. Retrieved material is evidence or prior guidance, not the final judgment. The thinking-partner records in `data/db.json` capture the investor's answers, testable beliefs, and decisions so later discussions can challenge and improve them.

The public Jarvis frontend is read-only. User prompts query the curated backend knowledge but are not stored as source knowledge, beliefs, decisions, properties, or comparable data. Backend knowledge curation is owner-only.

## Current Flow

1. Store source guidance in `rag/corpus.json`.
2. Send a question and optional property assumptions to `POST /api/rag/query`.
3. Tokenize the question and property context.
4. Score corpus entries by term overlap across title, tags, and body.
5. Return the top matching excerpts as sourced underwriting guidance.

## Recommended Production RAG

For a more robust version, replace term overlap with embeddings:

1. Ingest PDFs, notes, inspection reports, lender terms, rent comps, and local market research.
2. Chunk documents by semantic section with source metadata.
3. Generate embeddings for each chunk.
4. Store vectors plus metadata in a vector store.
5. Retrieve top chunks using property assumptions and the user's question.
6. Ask the model to answer only from retrieved context, with citations and uncertainty flags.
7. Log questions with user feedback so the corpus can be improved.
8. Retrieve relevant beliefs and past decisions alongside source documents.
9. Highlight contradictions, stale beliefs, and outcomes that should update a principle.

## Suggested Corpus Sources

- Personal buy box and target markets
- Rent comparables and lease notes
- Lender term sheets
- Insurance quotes
- Inspection summaries
- Rehab scopes and contractor bids
- Local property tax rules
- Investor decision rules and risk limits
- Decision journals and post-mortems
- Beliefs with confidence, scope, contrary evidence, and falsifiers
- Geographic context modules, including Malaysia-specific due-diligence categories

## Guardrails

- Treat outputs as decision support, not financial, legal, or tax advice.
- Cite source chunks in every answer.
- Flag missing assumptions instead of inventing them.
- Separate factual retrieval from model-generated recommendations.
- Keep personally identifying tenant or seller information out of the corpus unless storage is encrypted and access-controlled.
- Do not allow public users to mutate the knowledge base. Owner API access requires the configured owner token.
