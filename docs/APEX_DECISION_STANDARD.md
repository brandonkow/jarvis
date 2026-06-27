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

## v1.4 Due Diligence Pack

The v1.4 due-diligence pack converts a report into tasks:

- Assign each task to an owner such as Agent, Rental Agent, Banker, Lawyer, Management Office, Site Visit, Market Check, Buyer Pool, or Investor.
- Prioritise tasks as high, medium, or low based on legal, financing, holding, evidence, and project-quality risk.
- Mark completed evidence as done, but still preserve the action so the user knows what proof supported the report.
- Include the pack in the UI report, copied text report, saved report history, and print view.
- Treat the pack as a decision workflow, not a substitute for professional legal, valuation, financing, or tax advice.

## v1.5 Execution Calibration

The v1.5 execution layer converts the report into practical action guardrails:

- State the negotiation posture: no offer, pause before offer, verify before offer, evidence-first negotiation, or controlled negotiation.
- Estimate an opening anchor and maximum-offer guardrail from supplied asking price, conservative value, rent, maintenance, and instalment.
- Make the walk-away rule explicit before the user negotiates, books, renovates, accepts a tenant, or prepares an exit.
- Flag sourcing and agent-pressure risk so advertised, heavily pushed, or inconsistent deals are not mistaken for genuine opportunities.
- Test agent, banker, lawyer, site visit, management, renovation, tenant-screening, and exit actions separately.
- Keep execution calibration subordinate to hard stops and blockers. A strong negotiation plan cannot rescue an unsafe legal, financing, title, management, or transaction structure.

## v1.6 Stress Envelope

The v1.6 stress layer makes holding survival more realistic:

- Separate base monthly holding from **true holding**, which includes instalment, maintenance, assessment, quit rent, insurance, tax, and repair reserve where supplied.
- Add optional Deal card fields for annual assessment or quit rent, annual insurance or tax, monthly repair reserve, furnishing or renovation budget, and vacancy stress months.
- Label each stress assumption as user-provided or default so the report does not pretend missing data is verified.
- Run a stressed case with rent down 10 percent, instalment up 10 percent, and vacancy stress across the year.
- Estimate cash after stress reserves and how many months the remaining cash can survive the stressed monthly shortfall.
- Treat the stress envelope as a survival check, not a forecast or guarantee.

## v1.7 Portfolio Expansion Gate

The v1.7 portfolio gate decides whether a user should add this property to a wider portfolio:

- Add optional Profile card fields for portfolio role, existing portfolio health, concentration risk, and reason for the next purchase.
- Test whether existing properties are stable before adding another asset.
- Require post-purchase reserve and stress survival before treating a deal as scalable.
- Flag concentration in the same area, property type, tenant pool, price segment, or refinancing window.
- Distinguish a written portfolio role from FOMO, loan availability, or excitement after a prior successful deal.
- Block expansion when the current deal is rejected or paused, existing assets are weak, reserve is insufficient, stress survival is fragile, or the reason for purchase is emotional rather than strategic.

## v1.8 Market Cycle And Liquidity Pulse

The v1.8 market pulse keeps the deal anchored to current cycle risk instead of looking only at property-level numbers:

- Classify the market reading as opportunity, watch, risk, or unknown based on discount, weak sentiment, hype, rental direction, buyer liquidity, supply absorption, and auction pressure.
- Treat weak sentiment as opportunity only when the asset quality, evidence, and holding survival are still intact.
- Treat market hype, realised catalysts, weak resale enquiry, financing concern, or many auction cases as caution even if the headline price looks attractive.
- Separate rental direction from buyer liquidity because a property can rent well but still be hard to dispose.
- Keep market pulse subordinate to hard stops and evidence blockers. A crisis price cannot rescue a weak property, unsafe deal structure, or unready investor profile.

## v1.9 Hold, Refinance, And Exit Plan

The v1.9 holding layer converts the report into a post-purchase operating plan:

- State whether the correct posture is hold, monitor, refinance, sell, or pause.
- Require annual review at tenancy renewal and immediate review when rent, saleability, management quality, or nearby supply changes.
- Recommend refinancing only when equity margin exists and the revised instalment can still be supported by rent and cash reserve.
- Recommend selling when the area appears saturated, new projects struggle to sell at market rate, resale liquidity weakens, or the project loses competitiveness.
- Recommend holding through temporary underperformance only when the catalyst is still credible and the property remains competitive against newer supply.
- Treat holding period as part of the purchase decision. Users should know the target disposal year before buying.

## v1.10 V1 Decision Seal

The v1.10 seal closes the complete v1 decision path:

- Combine hard stops, blockers, evidence confidence, stress survival, portfolio gate, execution readiness, and market pulse into one final status.
- Return **sealed** only when the deal has no hard stop, no blocker, strong evidence, survivable stress, acceptable portfolio expansion, clean execution posture, and no market-cycle warning.
- Return **conditional** when the deal is not blocked but still has review items such as stress pressure, portfolio caution, market-watch status, or missing live proof.
- Return **blocked** when any hard stop, pause, fragile stress result, portfolio block, execution stop, or market-risk failure appears.
- Keep the seal as a v1 checkpoint, not an investment guarantee. It tells the user whether the deal may proceed to negotiation, needs more proof, or should stop.

At this point, v1 is the complete foundation loop: select, evidence-check, stress-test, scale-check, market-check, plan holding and exit, then seal the decision. Later v2 work should deepen intelligence and workflow, not replace these boundaries.

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

These are decision tests rather than forecasts. The v1.6 stress envelope adds the more realistic survival view by including optional repair, assessment, quit rent, insurance, tax, furnishing, renovation, and vacancy reserve assumptions.

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
