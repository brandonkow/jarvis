# Apex Decision Standard

This document is the product-facing decision contract. It converts the founder framework into a repeatable analysis that can be used by different investor profiles without pretending every founder preference is universal.

## Apex v1.0 Engine

The v1.0 engine is the deterministic decision layer behind Apex Analytic. It converts the framework into executable gates, scores, warnings, and challenge prompts before any language model commentary is added.

Language-model output may humanize the explanation, but it must not change the verdict, score, hard stop, blocker, metric, or scenario produced by the engine. Every report should make the reasoning source visible as either **Framework only** or **Framework + AI**.

## Decision Order

Every deal is evaluated in this order:

1. Check legal, structural, transaction, and survival hard stops.
2. Grade the evidence used to support value, rent, project quality, and title status.
3. Score the property and the investor separately.
4. Run downside scenarios before considering upside.
5. State the strongest counter-thesis and missing proof.
6. Return a provisional verdict: reject, pause, investigate, or shortlist.

A hard stop cannot be averaged away by attractive features elsewhere.

## Hard Stops, Pauses, And Blockers

The v1.0 engine separates three types of negative findings:

- **Hard rejection**: Apex should not validate the deal structure. Examples include marked-up consideration, cash-back arrangements intended to mislead financing, opaque bulk-purchase structures, title/caveat/seller-authority risk, fully office-commercial title, weak management/build quality, or landed property that violates the freehold mandate.
- **Pause**: the property may still deserve investigation, but the user profile or holding structure is not ready. Examples include insufficient cash reserve, 80% danger-zone DSR, declared cash unable to cover acquisition outlay, repeated loan rejection, or rental that cannot cover instalment and recurring charges.
- **Decision blocker**: the deal is not rejected, but Apex cannot shortlist it yet. Examples include missing conservative value proof, missing loan instalment, weak rental evidence, no completed site visit, unclear legal checks, incomplete financial profile, unclear exit buyer pool, or nearby similar new supply without absorption proof.

If decision blockers exist, confidence is capped at 64% and the verdict cannot become **SHORTLIST**.

## Challenge Mode

Each report must challenge the user in a calm mentor-like tone:

- **Refuse validation** when the structure is outside Apex boundaries.
- **Profile or holding pause** when the investor is not ready.
- **Evidence blocker** when missing proof blocks a shortlist decision.
- **Emotional chase warning** when the user can afford the property but the return does not support the investment case.
- **Supply challenge** when nearby substitute projects could weaken future rent or resale.
- **Mentor challenge** when the deal is otherwise clean but still needs one strongest proof point.

## v1.1 Report Intelligence

The v1.1 report layer makes the engine output easier to act on:

- **Decision focus** states the single most important reason behind the verdict.
- **Investor readiness** classifies the supplied financial profile as Ready, Balanced, Cautious, Overextended, or Not ready.
- **Deal scorecard** keeps the four dimensions visible without forcing the user to read every stage first.
- **Evidence checklist** converts missing proof into action items.
- **Copy report** gives users a clean text export, while the printable report remains available for formal review.

These sections explain the engine. They do not soften hard stops or replace live evidence.

## v1.2 Learning Loop

The v1.2 learning loop lets Apex use private user learning without pretending the model trains itself automatically:

- **Approved memory** may appear in a report when it matches the current deal. Pending or dismissed memory is ignored.
- **Locked decision-journal entries** may appear when the thesis, counter-thesis, kill rule, result, or lesson matches the current deal.
- **Reviewed journal lessons** are treated as stronger learning signals than unreviewed locked theses.
- **Learning signals** may add a next action or sharpen the challenge mode, but they do not change deterministic scores, hard stops, legal boundaries, or required evidence.
- **Owner knowledge base** remains separate from user memory. Normal users cannot write to the shared Apex framework or owner evidence store.

## v1.3 Deal Comparison

The v1.3 comparison layer turns the device shortlist into a decision aid:

- Compare up to four analysed deals side by side.
- Rank by adjusted score, not just headline score.
- Penalise hard stops, decision blockers, reject/pause verdicts, and weak dimensions.
- Show the cleanest current pick only when a deal has no blockers.
- Keep the weakest dimension, investor readiness, decision focus, confidence, and learning-signal count visible on each card.

## Four Decision Dimensions

- **Property quality**: entry value, rentability, own-stay appeal, management, unit position, tenure, and buyer depth.
- **Investor suitability**: reserve, debt burden, financing, holding cash flow, life commitments, and portfolio concentration.
- **Evidence quality**: completed comparables, achieved-rent proof, site visit, legal checks, and source confidence.
- **Market and exit**: supply pressure, exit-buyer breadth, unit liquidity, and resilience against substitutes.

The decision score is a weighted summary, not a promise of investment performance. The weakest dimension should be discussed first.

## Evidence Grade

Evidence quality rises when:

- Three or more relevant completed transactions support value.
- Signed tenancy or achieved-rent evidence supports rent.
- A site visit tests management, building use, unit position, noise, security, and upkeep.
- Title, caveat, restriction, and legal checks are clear.

Listing prices, marketing claims, intuition, and a self-declared confidence level cannot substitute for completed evidence.

## Downside Scenarios

The report currently tests:

- Current rent, installment, and maintenance.
- Rent falling by 10 percent.
- Installment rising by 10 percent as a financing-cost proxy.
- Rent falling by 10 percent, installment rising by 10 percent, and one vacant month per year.

These are decision tests rather than forecasts. A later version should allow users to change the assumptions and add repair, assessment, quit rent, insurance, tax, and furnishing reserves.

## Resolved Founder Rules

- Do not buy anything merely because a crisis makes it cheap. Buy durable value that survives stress.
- Treat claims that intuition has never failed as untested until predictions are recorded before outcomes.
- Profit alone does not prove a good decision. Judge process, execution, outcome, and luck separately.
- Never use "6 percent return" without naming the formula. Gross yield, operating yield, net yield, and cash-on-cash return are different.
- Rental-led high-rise deals should normally cover installment and recurring charges. A small loan-only shortfall is not automatic approval.
- Hard stops override the weighted score.
- Judge resident and management risk using observable conduct and building operations, not demographic stereotypes.

## Report Use

The Apex Deal Report is a due-diligence aid, not a valuation, legal opinion, loan approval, or guarantee. Users should verify live market evidence and obtain appropriate professional advice before committing capital.
