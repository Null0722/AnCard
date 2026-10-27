# AnCard  -  Ten-institution research register

Date opened: 2026-10-27. **In progress, NOT a completed comprehensive audit.** Institutions here are the ten requested coverage targets, not a verified rank by assets or number of customers. American Express participates as a card issuer and consumer banking provider.

## Official starting points (source inventory)

| Institution | Official first-party credit-card/reference starting point | Research status |
| --- | --- | --- |
| Chase | https://creditcards.chase.com/ | Source located; per-product audit pending |
| Bank of America | https://www.bankofamerica.com/credit-cards/ | Source located; per-product audit pending |
| Wells Fargo | https://www.wellsfargo.com/credit-cards/agreements/ | Agreement index located; per-product audit pending |
| Citi | https://www.citi.com/credit-cards/savings-and-cash-back-credit-cards | Source located; per-product audit pending |
| U.S. Bank | https://www.usbank.com/credit-cards.html | Source located; per-product audit pending |
| PNC | https://www.pnc.com/en/personal-banking/banking/credit-cards.html | Source located; per-product audit pending |
| Truist | https://www.truist.com/credit-cards | Source located; per-product audit pending |
| Capital One | https://www.capitalone.com/credit-cards/compare/ | Source located; per-product audit pending |
| TD Bank | https://www.td.com/us/en/personal-banking/credit-cards | Source located; per-product audit pending |
| American Express | https://www.americanexpress.com/us/credit-cards/ | Source located; per-product audit pending |

## Verified examples for data-model design (NOT blanket claims about each institution)

- **Bank of America checking:** Standard overdraft setting may charge **$10** when a covered item is paid and overdraws an eligible account; the Decline All setting operates differently. Official source: https://www.bankofamerica.com/deposits/checking/checking-accounts/
- **TD Bank checking:** Its stated overdraft fee is **$35** where applicable, up to three daily; no fee when overdrawn by $50 or less, and a next-business-day grace process can refund qualifying charges. TD Essential Banking is an exception (no overdraft fees). Official source: https://www.td.com/us/en/personal-banking/overdraft-services
- **Chase Private Client Checking:** $35 monthly service fee generally waived by linked qualifying $150,000+ average beginning day balances or another eligible linked account. This is a waiver condition, not a requirement to be an existing client. Official source: https://www.chase.com/personal/checking/private-client
- **Bank of America relationship rewards:** In the 2026 **BofA Rewards** program, eligible cards can receive a **10%-75% bonus depending on tier**; Premier is described as $1M+ average 3-month combined qualifying balances with up to 75% bonus on eligible cards. It does not apply to every card or every kind of reward. Official sources: https://newsroom.bankofamerica.com/content/newsroom/press-releases/2026/02/new-bofa-rewards--program-to-reach-millions-more-clients-with-ex.html and https://info.bankofamerica.com/en/rewards/bofa-rewards
- **American Express Centurion:** The issuer publicly lists a Centurion Card agreement in its cardmember-agreement index. Invitation mechanics and public fee/annual spend thresholds require individual first-party confirmation before any publication. Source: https://www.americanexpress.com/en-us/company/legal/cardmember-agreements/
- **J.P. Morgan Reserve:** Privately reported $10M asset barriers are **not confirmed by an issuer source in this initial review**. Keep eligibility threshold `null` and publication status `review` until documented.
- **Current-variable APY:** Store `checkedAt` and rate as separate fields. A rate snapshot is not a guaranteed future yield.

## Full audit template to execute for each bank

1. Product inventory: currently available consumer credit cards, checking and savings; distinguish closed/legacy cards.
2. Card terms: reward unit, base/category earning, caps, triggers, redemption, expiration, annual fee, foreign fee, normal/intro/punitive APR and disclosed conditions.
3. Welcome offers: offer eligibility, spending threshold, deadline, reward value type, and valid offer date. Don't invent cash values for points.
4. Deposit terms: monthly maintenance, fee waiver rule with AND/OR semantics, overdraft fees/triggers, linked overdraft-transfer details, opening/minimum balances, and APY as-of date.
5. Access: general availability, public relationship tier, invitation only; issuer-confirmed threshold vs reported but unverified.
6. Perks: travel coverage, collision damage waiver, cell protection, exclusions, enrollment.
7. Primary citations: product page, agreements, rewards/benefits documents, fee schedules. Record each term's checked date and reviewer.

## Quality gates

No publication solely on an index page. Full card/account terms, agreement and an independent review are required. Do not use an unverified celebrity/elite spend amount, stale offer/APY or uncited fee as product data. All records must make unknown fields explicit. This research register is a discovery starting point, not a claim that ten portfolios have been audited in detail.
