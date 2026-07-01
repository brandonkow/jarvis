# Development Case Library

Apex Analytic now supports an owner-controlled case library for project-by-project development opinions.

This is different from the framework:

- The framework explains how Apex thinks.
- Market observations record dated evidence.
- Evidence vault documents store supporting files.
- Development cases record the owner's judgment on specific projects or close substitutes.

Public users can receive matched case intelligence in chat and Deal Reports, but only the owner token can create, edit, or delete the shared case library.

## Case Fields

A useful case should include:

- Project name, area, state, property type, developer, and price segment.
- Target buyer and target tenant.
- Strengths and weaknesses.
- Management/JMB view and resident profile.
- Supply threat, rental outlook, and resale outlook.
- Owner verdict, system verdict, confidence, rating, source basis, observed date, and tags.

Use the case note to record real-world judgment that does not belong in the universal framework, such as "this project feels owner-stay friendly but newer similar layouts nearby can cap resale premium."

## Owner API

Every request below requires `x-estatelab-owner-token`.

- `GET /api/owner/development-cases`
- `POST /api/owner/development-cases`
- `PATCH /api/owner/development-cases/:id`
- `DELETE /api/owner/development-cases/:id`

Listing supports `q`, `area`, `verdict`, and `limit` query parameters.

## Frontend Use

1. Open the account panel.
2. Press **CASES**.
3. Enter the same owner token used for Market and Evidence.
4. Add a case directly, or link it to a tracked Market project.
5. Use filters to review the case library.

When a chat question or Deal Report matches a case, Apex adds a Case Library section and a `CASE` source label.

## Decision Discipline

Case intelligence is an opinion layer. It can challenge or support a deal, but it cannot replace current proof.

Apex should still require live evidence for:

- Completed transaction value.
- Achieved rent and tenant urgency.
- Bank valuation, DSR, and financing fit.
- Legal/title and seller authority.
- Site visit, management/JMB, resident culture, and defects.
- Nearby supply and substitute threat.

If an older case says **Avoid**, Apex should treat it as a founder warning and ask for new evidence before allowing the user to override it.
