# Framework Gap Analysis — v1 Base Framework Review

This document reviews the questions and answers that make up the v1 base framework
(the 60+ beliefs in `data/db.json`, the 127 references in `rag/corpus.json`, and the
original eight owner thinking questions) and identifies what the framework does not
yet address. It ends with the practitioner questions that would close each gap.
The same questions are now built into the app as owner thinking questions, so they
can be answered directly through the Second Brain flow and become part of the
framework's knowledge base.

## 1. What the v1 framework already covers well

The existing belief set and corpus are strong across the full pre-purchase decision path:

- **Mandate and investor protection** — configurable user mandate, retail-investor
  defaults, the high-income/low-knowledge danger profile, six-month reserve gate,
  budget haircut, emotional-chasing triggers.
- **Area and product selection (Stage 1)** — hard demand engines, relevant human
  traffic, growth-corridor sponsor tests, price-segment liquidity, buyer-pool breadth,
  own-stay appeal, tenure culture, site-visit vibe test, management and resident
  quality, layout and view priority.
- **Evidence discipline** — transacted-over-listing hierarchy, bank-valuation caution,
  undervalued-versus-cheap standard, hard stops overriding scores, evidence-graded
  verdicts.
- **Rental economics** — installment coverage rule, negative-cash-flow tolerance bands,
  tenant urgency, furnishing fit, new-supply risk, density and lift thresholds.
- **Legal and financing transactionability** — caveats, consent, master title,
  bankability, HDA serviced residences, DSR stress, loan-margin discipline,
  financing-led deal boundaries.
- **Holding, scaling, and market timing (Stages 4-6)** — shortfall bands, rental-drop
  triage, refinance discipline, next-property gates, concentration tests, supply-before-VP
  pricing, crisis-buying discipline.
- **Learning loop (Stage 7)** — decision journal, thesis locking, process-versus-luck
  scoring, belief update thresholds, saleability pre-mortem.

## 2. Gaps the v1 framework does not address

### G1. Transaction cost and tax mathematics
The framework repeatedly says "all-in cost" and "margin of safety" but never computes
Malaysian entry costs (MOT stamp duty, loan stamp duty, SPA and loan legal fees,
disbursements) or exit taxes (RPGT bands by holding year). A 20% "discount" can lose
4-6 points to entry costs alone.
**Status: partially closed in this release** — the app now includes a deterministic
Malaysian deal-cost engine (`/api/tools/deal-costs` and the `acquisitionCostEstimate`
section of every Deal Report). Practitioner calibration is still needed.

### G2. Auction purchase mechanics
Auctions appear only as *market signals* (distress indicators). There is no buying
playbook: LACA versus non-LACA banks, deposit forfeiture risk, outstanding service
charges and utilities, eviction/vacant-possession risk, title condition sight-unseen.

### G3. New-launch / developer purchase pathway
The framework is subsale-oriented. It has no rules for judging developer deals:
rebates and "free" packages masking the net price, progressive-interest exposure,
LAD (liquidated damages) claims, VP-stage defect strategy, bulk-discount phases
that reprice the whole project.

### G4. Taxation of rental income
Nothing covers LHDN treatment of rental income, deductible expenses, or how tax
changes the hold/sell/refinance arithmetic. Net-after-tax yield is the number that
actually compounds.

### G5. Insurance and risk transfer
No beliefs cover fire policy versus contents cover, MRTA versus MLTA trade-offs, or
gaps that have actually cost money. One uninsured event can erase years of yield.

### G6. Ownership and loan structuring
Single name versus joint names versus family-member name changes loan margin
eligibility (third-property 70% rule), DSR headroom, RPGT positions, and estate
outcomes. The framework is silent.

### G7. Tenant failure and recovery reality
Screening and agreement protections exist, but there is no calibrated downside data:
how long recovery from a bad tenant takes, what it costs, and which clause or check
would have prevented it. Distress cases define real rental holding power.

### G8. Renovation contractor execution
Budget discipline and value-item rules exist, but contractor selection, payment
scheduling, abandonment protection, and supervision have no coverage — a common
capital sink for retail investors.

### G9. Refinance switching costs
The framework gates *when* refinancing is acceptable but never prices *what it costs*:
legal fees again, lock-in penalties, MRTA clawback, valuation fees, and the payback
period of a rate saving.

### G10. Named, ranked data sources
The evidence hierarchy ("completed transactions over listings") never names which
Malaysian sources to use in which order — NAPIC, bank valuers, auction lists,
portal data — or where each one has misled in practice. Without named sources other
users cannot replicate the discipline.

### G11. Threshold calibration with real cases
Key rules are founder heuristics: RM450 negative-cash-flow tolerance, 1,500-unit
density warning, 20% entry discount, RM400-500k band, six-month reserve. None has
recorded confirming *and* disconfirming cases. The belief-update protocol (three
independent cases trigger review) cannot run without case data.

### G12. Deal funnel and effort economics
"Be patient and selective" has no operating metrics: listings reviewed per month,
viewings, offers, closes, and hours spent. Funnel conversion rates would let the
framework tell a user whether their sourcing effort is normal or broken.

### G13. Geographic coverage beyond three states
Market beliefs stop at Penang, Kuala Lumpur, and Selangor. Public users will ask
about Johor Bahru, Ipoh, Seremban, Kota Kinabalu, and Kuching. Even "avoid, because
I have no edge there" is a usable framework answer — but it must be recorded.

### G14. Back-testable track record
The development case library and decision journal exist as machinery, but the seed
data contains no completed historical case with full numbers (entry, all-in, achieved
rent, vacancy record, current value). One complete case file per past deal would let
the seven-stage engine be back-tested against reality.

### G15. Operational market-shock protocol
Stage 6 covers reading the cycle, but there is no owner playbook for a live shock
(OPR jump, flood event, factory closure): which observation metrics to re-check first,
and which portfolio triggers fire.

## 3. Practitioner questions (now built into the app)

These questions were added to the owner thinking-question rotation (`Second Brain →
next question`), so each answer is stored and becomes retrievable framework knowledge.

| # | Category | Question | Closes gap |
|---|----------|----------|------------|
| 1 | Costs | On your last completed purchase, what did the true all-in entry cost come to (stamp duty, legal fees, disbursements, renovation, furnishing, hidden extras), and which item surprised you most? | G1 |
| 2 | Auction | Have you bought or seriously attempted to buy at auction, and what rules do you now follow on deposit risk, outstanding charges, LACA versus non-LACA titles, and vacant possession? | G2 |
| 3 | New launch | When would you buy from a developer at launch instead of subsale, and how do you treat rebates, furnishing packages, and free legal fees when judging the true net price? | G3 |
| 4 | Taxation | How do you handle tax on rental income in practice: which expenses do you deduct, and has tax ever changed a hold, sell, or refinance decision? | G4 |
| 5 | Insurance | What insurance do you actually carry on each property (fire, contents, MRTA or MLTA), and when has a claim or a gap in cover cost you money? | G5 |
| 6 | Structuring | How do you decide between single name, joint names, or a family member's name on title and loan, and what worked or backfired? | G6 |
| 7 | Operations | Describe your worst tenant failure: how long did recovery take, what did it cost, and what screening or agreement clause would have prevented it? | G7 |
| 8 | Operations | How do you select and pay renovation contractors, and what payment schedule or supervision rule protects you from abandonment and overruns? | G8 |
| 9 | Refinance | On your last refinance or cash-out, what were the full switching costs (legal fees, lock-in penalty, MRTA clawback, valuation), and how long was the payback period? | G9 |
| 10 | Data | Which transaction, rental, and auction data sources do you actually trust in Malaysia, in what order, and where has each one misled you? | G10 |
| 11 | Calibration | For your own thresholds — RM450 negative cash flow, 1,500-unit density, 20% entry discount, six-month reserve — name one real deal where the threshold saved you and one where it cost you a good deal. | G11 |
| 12 | Execution | In a normal sourcing month, how many listings do you review, how many do you view, offer on, and close, and how many hours does that take? | G12 |
| 13 | Geography | Outside Penang, Kuala Lumpur, and Selangor, which Malaysian markets would you personally touch or avoid (Johor Bahru, Ipoh, Kota Kinabalu, Kuching, Seremban), and why? | G13 |
| 14 | Track record | Pick one past deal and give the full case file: entry price, all-in cost, achieved rent, vacancy record, current value, and what the framework would have scored it at purchase. | G14 |

Suggested deeper follow-ups once the first pass is answered:

- For each **auction** rule: which bank's auction terms were involved? Terms differ materially.
- For **taxation**: do you file rental income individually or through a company, and why?
- For **structuring**: has the 70% third-loan margin rule changed your sequencing?
- For **data sources**: what lag have you measured between market movement and NAPIC/portal data showing it?
- For **track record**: repeat the case file for your *worst* deal, not just a representative one — the framework learns most from the failure case.
- For **market shocks (G15)**: after answering the calibration questions, define your first-48-hour checklist when OPR moves or a local demand engine closes.

## 4. How answers feed back into the product

1. Answer each question in the Second Brain flow (`/api/brain/answers`); the rotation
   serves them in order after the original eight.
2. Convert stable answers into beliefs with falsifiers (`/api/brain/beliefs`) so they
   join retrieval and challenge mode.
3. Turn each named real deal (questions 11 and 14) into a development case
   (`/api/owner/development-cases`) so the case library stops being empty machinery.
4. Turn recurring numeric observations (costs, recovery times, funnel rates) into
   market observations with dates so freshness tracking applies to them.
