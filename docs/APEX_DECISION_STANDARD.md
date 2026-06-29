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

- **Memory is built before it collects**. New accounts start with memory capture off and memory reasoning off.
- **Capture suggestions** must be explicitly enabled before Apex can propose pending memories from chat.
- **Approved memory** may appear in a report only when the user has also enabled memory reasoning. Pending or dismissed memory is ignored.
- **Locked decision-journal entries** may appear when the thesis, counter-thesis, kill rule, result, or lesson matches the current deal.
- **Reviewed journal lessons** are treated as stronger learning signals than unreviewed locked theses.
- **Learning signals** may add a next action or sharpen the challenge mode, but they do not change deterministic scores, hard stops, legal boundaries, or required evidence.
- **Owner knowledge base** remains separate from user memory. Normal users cannot write to the shared Apex framework or owner evidence store.

## v3.0 Passive Memory Foundation

V3 starts as a consent-first memory engine, not automatic training:

- The data model stores memory settings separately from memory items.
- Manual memory entry remains possible because it is a deliberate user action.
- Chat-based memory suggestions are disabled until the user enables capture.
- Approved memory is not sent into chat or deal-report reasoning until the user enables memory reasoning.
- Turning memory reasoning off does not delete memories; it only stops them from influencing answers and reports.
- The shared Apex framework and owner evidence store remain unaffected by user memory.

## v3.1 Memory Profile Builder

The memory profile is a derived private profile built from approved user memory. It is not a separate public knowledge source and it is not market proof.

- Apex summarizes approved memories into investor type, risk style, preferred assets, avoided risks, cash-flow rule, holding period, personal warnings, investment rules, market beliefs, and lessons.
- The profile is visible in the memory panel so the user can inspect how Apex currently understands them.
- The profile may enter chat or report reasoning only when memory reasoning is enabled.
- The profile should improve personalization and challenge mode, but it must not override hard stops, missing evidence, legal/title risk, or poor deal quality.

## v3.2 Memory Review Queue Upgrade

Pending and approved memories are classified into clearer review types:

- Preference
- Constraint
- Lesson
- Mistake
- Investment rule
- Market belief
- Personal warning
- Goal, decision, experience, or general context when the memory does not fit the stronger buckets

Each memory item should show its review priority and profile impact before approval. High-priority memories include warnings, mistakes, constraints, and hard rules because they may later affect challenge mode.

## v3.3 Personalized Challenge Mode

Personalized challenge mode uses the approved memory profile to test the current deal against the user's own remembered standards.

- Apex keeps the generic framework challenge and the personalized challenge separate.
- The personalized challenge may reference personal warnings, investment rules, avoided risks, cash-flow rules, preferred assets, or lessons.
- It may add next actions and report checks, but it must not change deterministic scores by itself.
- It must not soften hard stops. If a legal, financing, title, management, or holding-power hard stop exists, the personalized challenge becomes stricter, not more permissive.
- It should ask: "Does this deal still obey your own rule, preference, or past lesson?"
- If memory reasoning is off, no personalized challenge should be generated from user memory.

## v3.4 Deal Memory Comparison

Deal memory comparison checks the current report against the user's own saved deal reports.

- Compare project, area, property type, verdict, weak dimensions, blockers, watch-outs, missing evidence, and counter-thesis language.
- Show only reasonably similar prior deals, with a short explanation of the overlap.
- A prior saved report is a benchmark, not proof. It can challenge consistency but cannot approve the new deal by itself.
- If a prior deal was rejected or paused for the same reason, Apex should force that reason back into the current decision.

## v3.5 Belief Tracker

The belief tracker separates durable user beliefs from one-off chat context.

- Track approved market beliefs, investment rules, and lessons as confirmed, uncertain, challenged, or retired.
- Treat beliefs as hypotheses until transaction, rental, management, site, legal, and supply evidence supports them.
- When a deal exposes a weak point in a belief, label the belief uncertain instead of silently applying it.
- A belief may inform challenge mode, but it must not replace evidence or override hard stops.

## v3.6 Source Transparency

Every report should show what actually influenced the answer.

- Framework only means deterministic Apex rules generated the report without external AI commentary.
- Framework + AI means the report used the framework plus an external reasoning model for commentary.
- Approved memory, decision journal, saved deal history, and owner market observations must be listed separately when used.
- Pending memory, dismissed memory, and normal user chat should not be shown as decision sources.

## v3.7 Memory Pruning And Conflict Handling

Apex should not let long-term memory become a pile of unchallenged assumptions.

- Detect obvious conflicts such as cash-flow hard rules versus negative-cash-flow exceptions, high-rise leasehold tolerance versus landed freehold requirements, or site-visit rules versus new-launch limitations.
- Flag stale beliefs when supply, rent, management, or area conditions may have changed.
- Ask the user to clarify the rule instead of guessing which memory is correct.
- Conflicts should reduce confidence in personalization, not in the underlying framework score.

## v3.8 Personal Operating Rules

Personal operating rules turn the user's standards into repeatable guardrails.

- Default rules include proving holding power, requiring site evidence before strong confidence, refusing to buy cheap property without real quality, and respecting clean legal or financing boundaries.
- Approved personal memory can add user-specific rules, but it should not lower the framework standard.
- A hard operating-rule breach blocks validation until cleared.
- A warning operating-rule breach allows investigation, but Apex should challenge the user before any shortlist language.

## v4.0 Evidence Engine

The evidence engine separates proof strength from story quality. A deal can sound attractive, match the user's memory, and still fail V4.0 if the evidence is thin.

V4.0 scores seven gates:

- **Completed value proof**: completed subsale transactions and successful auction evidence, not asking prices.
- **Achieved rent proof**: signed tenancy, achieved rent, agent-confirmed urgency, vacancy, and tenant profile.
- **Financing and valuation fit**: instalment, bank valuation basis, DSR impact, and whether price sits inside conservative value.
- **Supply absorption proof**: nearby newer substitutes, VP timing, occupancy, rent pressure, and absorption.
- **Site and management reality**: physical site visit, lobby, guard, lifts, car park, corridor, resident behaviour, defects, and management response.
- **Legal and title safety**: title, caveat, restrictions, consent, seller authority, arrears, and stakeholder fund flow.
- **Decision thesis and kill rule**: written causal thesis, counter-thesis, holding period, exit buyer, and exact walk-away discovery.

V4.0 should block shortlist-level confidence unless:

- Evidence strength is at least 80/100.
- No critical evidence gap remains.
- No evidence gate is blocked.
- The rest of the framework also passes.

The evidence engine does not replace due diligence. It decides whether Apex is allowed to speak with strong confidence before due diligence is completed.

## v4.1 Transaction Comparable Evidence

V4.1 deepens the completed value proof gate. Apex should not treat "three or more comparables" as automatically strong. The comparable evidence must also show:

- **Source quality**: Brickz, official transaction data, successful auction result, bank valuation support, or clearly cross-checked agent-supplied completed comps.
- **Recency**: preferably within 12 months; older than 24 months is thin unless the market is very stable.
- **Match quality**: same project first, then closest substitutes with similar location package, layout, age, tenure, facilities, and buyer pool.
- **Completed price range**: the subject asking price must be positioned against a stated completed evidence band.
- **Adjustment discipline**: floor, view, size, layout, renovation, parking, facing, and project reputation differences must be explained.

If source, match, or range is unsafe, Apex should block shortlist-level confidence even when the headline asking price appears below market.

## v4.2 Achieved Rental Evidence

V4.2 deepens the achieved rent proof gate. Apex should not treat advertised rent or vague agent confidence as real demand. Rental evidence must also show:

- **Source quality**: signed tenancy, achieved rent record, property manager/owner actual rent, or active rental agent achieved-rent feedback.
- **Recency**: preferably within six months; older rent can miss new supply, vacancy, or tenant-sentiment changes.
- **Tenant urgency**: enquiry, viewing, and commitment speed at the target rent.
- **Vacancy friction**: whether the unit can realistically rent within the founder's one-month baseline or needs a longer holding buffer.
- **Sustainability**: whether rent is stable, seasonal, incentive-supported, or pressured by nearby new supply.
- **Coverage fit**: whether rent covers the loan instalment, and preferably instalment plus maintenance for normal retail investors.

If rent is listing-only, enquiry is weak, demand is incentive-supported, or rent cannot cover the loan instalment, Apex should block shortlist-level confidence for rental-led deals.

## v4.3 Financing And Valuation Evidence

V4.3 deepens the financing and valuation fit gate. Apex should not treat bank approval, headline interest rate, or high loan margin as proof that a deal is safe. Financing evidence must also show:

- **Bank valuation support**: banker-supported value, supported amount, likely shortfall, and whether value agrees with completed evidence.
- **Price versus conservative value**: whether the purchase price is inside, near, or above the defensible value band.
- **Loan precheck**: whether eligibility, DSR, property type, income documents, and credit profile have been checked before offer pressure starts.
- **Loan margin discipline**: whether the user is using standard leverage or forcing cash-out/high leverage to reduce upfront cash.
- **DSR fit**: post-deal debt-service level, not just current income.
- **Instalment stress**: at least a 10% higher instalment test.
- **Cash buffer**: six-month reserve after down payment, legal fees, stamp duty, renovation, furnishing, deposits, and other costs.
- **Document readiness**: income proof, bank statements, CTOS/CCRIS, tax records, and property documents.

If valuation is below price, loan approval is being forced, post-deal DSR is near the danger zone, high leverage is unsupported, or cash buffer is weak, Apex should block shortlist-level confidence.

## v4.4 Supply And Absorption Evidence

V4.4 deepens the supply absorption proof gate. Apex should not treat "high demand area" or "nearby supply checked" as enough. Supply evidence must also show:

- **Supply radius**: direct substitute projects within roughly 2.5km, not only the same road or the most obvious project.
- **Substitute count**: whether the number of closest alternatives remains within the founder's comfort range of fewer than five serious substitutes.
- **Substitute threat**: whether nearby projects have similar layout, similar or lower pricing, newer appeal, and the same tenant or future buyer pool.
- **Future supply timing**: announcement, launch, construction, VP, and first rental wave. Vacant possession is the serious pressure point.
- **Absorption proof**: occupancy, achieved rent, tenant enquiries, sales rate, and unsold units showing demand is actually absorbing supply.
- **Unsold stock**: whether developer inventory is minimal, elevated, discounted publicly, or being pushed through bulk-purchase channels.
- **Density and lift stress**: total units, plot ratio, lift count, waiting time, facility load, security traffic, and whether high density is compensated by prime pricing.
- **Ground notes**: actual substitute names, VP batches, rental pressure, occupancy, and why the subject property still defends demand.

If newer similar supply is priced competitively, VP pressure is near, absorption is weak, unsold stock is high, or density/lift waiting time creates daily friction, Apex should block shortlist-level confidence until supply risk is proven manageable.

## v4.5 Site And Management Evidence

V4.5 deepens the site and management reality gate. Apex should not treat "site visited" or "management is strong" as enough. Lived-quality evidence must also show:

- **Site visit proof**: physical visit evidence, not only a checkbox.
- **Lobby and guardhouse**: whether arrival feel and security service support owner-occupier emotion.
- **Lift, car park, and corridor**: lift waiting time, car-park brightness, ramp and bay usability, corridor width, rain splash, and refuse-room ventilation.
- **Common areas and facilities**: cleanliness, maintenance condition, facility load, short-stay traffic, and whether common areas still support project image.
- **Resident behaviour**: observable conduct, complaints, use of facilities, security traffic, and whether long-stay residents or families are comfortable there.
- **Management response**: response speed, attitude, solution quality, and ability to explain arrears, complaints, lift issues, defects, and sinking fund.
- **Defect and leakage**: water marks, ceiling and wet-area issues, wall cracks, fixture quality, mould, recurring complaints, and material quality.
- **Arrears and JMB culture**: outstanding fees, sinking fund health, AGM culture, disputes, lawsuits, and whether management improves or drains the project.
- **Evidence notes**: written site and management observations so future decisions can be challenged instead of relying on memory.

If management is unresponsive, defects are structural, resident behaviour weakens project culture, arrears or JMB disputes are serious, or daily friction is visible, Apex should block shortlist-level confidence even when rent and price look attractive.

## v4.6 Legal And Transaction Evidence

V4.6 deepens the legal and title safety gate. Apex should not treat "legal check clear" as enough unless the transaction path itself is supported. Legal and transaction evidence must also show:

- **Title type and use**: residential title, HDA serviced residence, commercial title with residential use clarified, or fully office-commercial title.
- **Transfer path**: issued strata or individual title, master-title risk, MOT, perfection of transfer or charge, developer consent, developer solvency, and expected timeline.
- **Caveat and restrictions**: current land search, caveat, encumbrance, court order, Malay reserve, Bumiputera lot, state consent, affordable-housing restriction, or other blocking condition.
- **Seller authority**: seller identity, registered ownership, company authority, bankruptcy or winding-up risk, probate or estate issue, litigation, and authority to sign.
- **Arrears and utilities**: maintenance, sinking fund, quit rent, assessment, utilities, late interest, and whether settlement or retention at completion is clear.
- **Stakeholder and fund flow**: deposits, redemption, retention, release conditions, and whether all payments move through proper lawyer stakeholder or bank-controlled channels.
- **Lawyer coordination**: early document review, risk explanation, progress milestones, responsiveness, and proper completion fund control.
- **Legal transaction notes**: written proof from land search, lawyer, management office, seller documents, and agent coordination.

If caveat, title, seller authority, restriction, transfer path, or fund-flow evidence is unsafe, Apex should refuse validation until cleared by the lawyer. Direct payment, side agreements, cashback, or bypassing stakeholder channels remain outside Apex-approved deal boundaries.

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

## v2.0 Owner Market Intelligence Console

The v2.0 layer begins the living second-brain path by making changing market evidence owner-operable from the frontend:

- Owner market projects define tracked subjects such as a project, township, area, or substitute set.
- Owner observations record dated evidence such as rent, transaction, occupancy, rental enquiry, supply, auction, unsold stock, launch sales, management, catalyst, financing, or buyer sentiment.
- The frontend console is gated by the owner token and sends `x-estatelab-owner-token` on market-write requests.
- Normal users can benefit from matched observations in chat and Deal Reports, but they cannot create, edit, import, or delete owner market evidence.
- Observations are dated and freshness-labelled. Stale observations are not hidden; Apex should surface them and explain that they need re-verification.
- V2.0 deepens market context only. It must not override v1 hard stops, evidence blockers, stress survival, portfolio gate, execution readiness, or the v1 decision seal.

## v2.1 Site Visit Assistant

The v2.1 layer converts founder site-visit intuition into observable checks:

- Treat the physical visit as mandatory before a strong recommendation on a completed property.
- Check guardhouse, lobby, lifts, car park, corridor, refuse room, facilities, resident behaviour, and surrounding vibe.
- Separate positive site feeling from evidence. The visit can confirm or challenge the data, but it should not replace transaction, rent, legal, and financing proof.
- Flag permanent problems such as poor unit placement, lift waiting, water marks, weak security, poor maintenance, short-stay traffic, noise, and bad management response.

## v2.2 Deal Sourcing And Professional Filter

The v2.2 layer tests whether the deal and advice channel are credible:

- Score deal source quality separately from property quality.
- Treat heavily advertised, hard-sold, fake-listing, or repeated-follow-up deals as pushed inventory until proven otherwise.
- Treat scarce sources such as auction pages, agency in-house access, referrals, owner-direct leads, and motivated sellers as useful but still evidence-bound.
- Challenge agent, banker, and lawyer advice with adjacent questions instead of accepting claims only because they can close the transaction.
- Set offer discipline before negotiation begins.

## v2.3 Tenant And Rental Management Plan

The v2.3 layer turns rental demand into execution discipline:

- Require rent coverage, target tenant logic, furnishing strategy, tenant screening, and achieved-rent evidence.
- Treat tenant risk through observable behaviour and documentation, not stereotypes.
- Prefer durable, rentability-led furnishing over personal taste.
- Flag suspicious requests, weak documentation, illegal-use risk, uncontrolled subletting, and late-payment patterns.
- Treat tenant quality as part of investment performance because it affects cash flow, vacancy, repair cost, and owner stress.

## v2.4 Exit Strategy And Buyer Psychology

The v2.4 layer forces saleability planning before purchase:

- Preserve both own-stay emotion and investor return logic where possible.
- Prepare the exit around bank value, staging, renovation, viewing condition, tenant status, likely objections, and timing.
- Flag narrow buyer pools, weak own-stay appeal, poor management, bad unit placement, substitute supply, and liquidity risk.
- Decide the likely sale mode before holding: vacant after renovation, tenanted investor sale, long-term hold, or refinance and hold.
- Treat profit as insufficient proof of a good decision unless the process, execution, outcome, and luck review also make sense.

## v5.0 Product Experience Layer

The v5.0 layer makes Apex easier for normal users to operate without changing the decision standard:

- Add a Guidance card for experience level, guidance mode, decision intent, preferred output, confidence comfort, and optional tone notes.
- Treat guidance as presentation context, not investment evidence. Beginner mode gets clearer explanation; professional mode gets tighter reports; neither mode lowers hard stops or evidence gates.
- Show a V5 product-experience block in Deal Reports so users know whether the answer is guided, balanced, concise, checklist-led, or professional.
- Use onboarding completeness to show whether Apex has enough user-experience context to choose the right answer shape.
- Preserve the same transaction, rental, financing, supply, site, management, legal, stress, portfolio, and exit requirements regardless of user confidence or preferred format.

## v5.1 Response Persona Router

The v5.1 layer applies the Guidance card to normal chat replies, not only structured Deal Reports:

- Guided mode explains the conclusion in plain language, names beginner traps, and ends with one next action.
- Concise or voice-summary mode leads with the verdict, strongest reason, main risk, and next action.
- Checklist mode turns the framework read into pass, verify, stop, and next-action items.
- Professional mode uses a tighter due-diligence format around evidence position, primary blocker, investor fit, and action.
- The router must work in framework-only mode and must also pass the same persona instruction into any external reasoning prompt.

## v5.2 Next-Move Context Coach

The v5.2 layer makes Apex proactive after ordinary chat replies:

- Return a compact next-move coach with missing context and suggested follow-up prompts.
- Generate prompts from missing area/project, asking price, rent, installment/income, transaction comparables, site evidence, legal/title status, and guidance preferences.
- Render the prompts in the frontend as clickable chips that load into the input box for editing or sending.
- Persist the coach with chat messages so a refreshed session still shows the same next steps.
- Keep prompts as user assistance only. They must not alter evidence standards, scoring, legal boundaries, or investment conclusions.

## v5.3 Context Readiness Strip

The v5.3 layer gives users a quiet readiness signal before they ask or analyse:

- Show compact Deal, Profile, and Guidance readiness percentages near the input box.
- Calculate readiness from key fields rather than raw form completion. Deal readiness needs area/project, price, rent, comps, site proof, and title/legal context. Profile readiness needs income, reserves, debt, goal, holding period, and concern. Guidance readiness needs experience, mode, intent, output, and confidence comfort.
- Clicking a readiness chip opens the relevant card and focuses the first missing field.
- Keep the strip hidden when account, memory, report, journal, market, shortlist, or print views replace the chat workspace.
- Treat readiness as workflow guidance only. It must not approve a deal or weaken the evidence engine.

## v5.4 Smart Input Mode

The v5.4 layer lets Apex infer what job the user is trying to do before the message is sent:

- Detect chat, deal screening, comparison, offer preparation, checklist, and voice-summary intent from the input text.
- Show the detected mode as a compact command-bar chip and adjust the placeholder/action prompt.
- Send the detected mode with chat requests for future server-side routing.
- Keep this as UI guidance only. It must not override user wording, evidence gates, or deal analysis rules.

## v5.5 Mobile And Voice Polish

The v5.5 layer improves phone and earphone use:

- Spoken replies should be shortened automatically so Apex does not read long reports into the user's earphones.
- The full written answer remains on screen even when speech is compact.
- Voice on/off state should be visible and stop controls should remain easy to reach.
- Mobile command controls should stay compact without hiding the main send action.

## v5.6 Response Feedback Loop

The v5.6 layer lets users tune how Apex answers without changing the investment standard:

- Show compact feedback controls under Apex replies: useful, shorter, less formal, and more proof.
- Store recent feedback locally and summarize it into the next chat request.
- Use feedback only to adjust response shape, warmth, length, and evidence emphasis.
- Never let feedback change deterministic scores, hard stops, missing evidence, legal caution, or deal verdicts.

## v5.7 Account-Level Answer Style Memory

The v5.7 layer makes answer-style learning portable for signed-in users:

- Keep browser-local feedback working for guests and unsigned sessions.
- If a signed-in user has memory capture enabled, store compact answer-style feedback inside private account memory.
- If memory reasoning is enabled, include the stored answer-style pattern in future response-persona routing.
- Keep answer-style memory separate from investment memories. It may change tone, length, warmth, and evidence emphasis, but never property scoring, hard stops, legal warnings, or recommendations.

## v5.8 One-Tap Answer Refinement

The v5.8 layer turns feedback into immediate user control:

- After a user marks an answer as shorter, less formal, or needing more proof, show a compact refinement action on that answer.
- The refinement action should ask Apex to rewrite, humanize, or extract missing-proof checks from the exact answer the user reacted to.
- Refinement may change format, tone, and evidence organization only.
- It must preserve the previous investment judgment unless the user provides new facts or evidence.

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
