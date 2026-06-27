# Owner Market Observation Operations

Apex Analytic separates permanent framework knowledge from changing market evidence.

- The framework explains how to judge a property.
- Market observations record what was seen, when it was seen, where it applies, and how reliable the source is.
- Public users can benefit from matched observations through chat and Deal Reports, but only the owner can create, edit, import, or delete them.
- Observations inform the analysis. They do not silently change deterministic scores or remove the need for transaction, rental, legal, and site verification.

## Data Model

A project is the stable identity used to group observations:

```json
{
  "name": "Example Residence",
  "area": "Bayan Lepas",
  "state": "Penang",
  "propertyType": "Condo",
  "developer": "Example Development",
  "tenure": "Freehold",
  "completionYear": 2024,
  "status": "completed",
  "aliases": ["Example Resi"]
}
```

An observation is a dated piece of evidence:

```json
{
  "projectId": "PROJECT_ID",
  "metricType": "rent",
  "value": 2800,
  "unit": "RM/month",
  "observedAt": "2026-06-21",
  "sourceType": "rental agent",
  "sourceReference": "Agent name or source URL",
  "confidence": "high",
  "notes": "Achieved two-bedroom rent from a signed tenancy."
}
```

Supported metrics are `transaction`, `rent`, `occupancy`, `rental_enquiry`, `supply`, `auction`, `unsold_stock`, `launch_sales`, `management`, `catalyst`, `financing`, `buyer_sentiment`, and `other`.

## Freshness Rules

Apex labels each matched observation as `fresh`, `aging`, or `stale`. Aging begins after the normal useful window; stale begins after twice that window.

| Observation | Fresh window |
| --- | ---: |
| Rental enquiry | 60 days |
| Rent, occupancy, launch sales, unsold stock, buyer sentiment | 90 days |
| Transaction, auction, supply, financing | 180 days |
| Management and catalyst | 365 days |

These windows are warning rules, not claims that older evidence is false. A stale observation remains visible so Apex can explain what must be rechecked.

## Trend Rules

When at least two numeric observations share the same project and metric, Apex compares the latest point with the prior point. A change within 2% is shown as stable; otherwise it is shown as up or down. The direction is descriptive and is not automatically good or bad. Rising rent and rising auction cases have different meanings.

## Owner API

Every request below requires `x-estatelab-owner-token`.

- `GET|POST /api/owner/market/projects`
- `PATCH|DELETE /api/owner/market/projects/:id`
- `GET|POST /api/owner/market/observations`
- `PATCH|DELETE /api/owner/market/observations/:id`
- `POST /api/owner/market/import`

Project deletion is blocked while observations remain. Add `?cascade=true` only when the project and all its linked observations should be removed.

Observation listing supports `projectId`, `metricType`, `area`, `freshness`, and `limit` query parameters.

## V2.0 Frontend Console

The production site includes an owner Market Console:

1. Open the account panel.
2. Press **MARKET**.
3. Paste the owner token once on your device.
4. Add a tracked project or area.
5. Add dated observations against the project or area.
6. Use the area, metric, and freshness filters to review current evidence.

The token is stored only in that browser's local storage. If Render does not have `ESTATELAB_OWNER_TOKEN` configured, the console will remain unable to write owner evidence even if a token is entered.

## Batch Import

The batch endpoint accepts up to 200 combined records. A temporary project `id` can be used to link observations inside the same payload:

```json
{
  "projects": [
    { "id": "batch-1", "name": "Example Residence", "area": "Bayan Lepas", "state": "Penang" }
  ],
  "observations": [
    { "projectId": "batch-1", "metricType": "occupancy", "value": 91, "unit": "%", "observedAt": "2026-06-21", "notes": "Agent estimate." }
  ]
}
```

The response reports imported and skipped records. Review skipped errors rather than assuming a partially valid batch was fully accepted.

## Operating Discipline

1. Record achieved or transacted evidence rather than advertised claims whenever possible.
2. State whether the source is an agent, signed tenancy, successful auction, developer material, site observation, or other source.
3. Use `high` confidence only when the evidence is directly verifiable.
4. Add a new dated observation instead of overwriting history when a metric changes.
5. Correct genuine input errors with `PATCH`; do not rewrite an old observation merely because the market later moved.
6. Refresh stale rental and supply observations before relying on them in a purchase decision.
