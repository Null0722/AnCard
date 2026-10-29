# Sign-up offer research and comparison workbench

**Research date:** 2026-10-29 (U.S. offers). **Status:** research, not independent human offer approval. All seven cards are already approved at the card level, but sign-up offers can expire, vary by channel or depend on applicant history.

## How the workbench handles an offer

- **Card QC** approves a card's reviewed facts. **Offer QC** independently approves sign-up promotions and records their separate date/source. Approval of one does not imply approval of the other.
- Existing published card snapshots for Gold and Platinum retain their old `welcomeOffer` data, labeled as dated, possibly personalized issuer-source snapshots. Those legacy records do not count as independently approved offers.
- New promotional research lives in `catalog/OFFER-QC.json` and is never published as an approved sign-up benefit until a human records reviewer and review date and sets `approved: true`.
- Only approved candidates appear as `signUpBenefit` in `docs/data/cards.json` after rebuilding; pending research never appears as a public offer.
- No affiliate URLs, conversion tracking, account registration or inferred reward-dollar values.

## Seven-card source review

| Card | Research finding (not yet independently human-approved) | Official issuer source | Reviewer questions |
| --- | --- | --- | --- |
| Aer Lingus Visa Signature | 75,000 Avios after $5,000 eligible purchases in first 3 months | [Chase Aer Lingus Avios cards](https://creditcards.chase.com/avios/cards) | 24-month bonus restrictions, eligible purchase definitions, current application channel |
| Aeroplan Credit Card | Up to 115,000 points: 75,000 after $4,000 in 3 months, plus 40,000 after $20,000 total in 12 months | [Chase Air Canada Aeroplan](https://creditcards.chase.com/travel-credit-cards/aircanada/aeroplan) | Chase page contains conflicting old and new bonus figures; recheck actual application terms, current annual fee, and prior-card restrictions |
| Amazon Visa (not Prime Visa) | $50 Amazon gift card on eligible card approval; no qualifying purchase threshold advertised | [Chase Amazon cards](https://creditcards.chase.com/cash-back-credit-cards/amazon) | Distinguish $50 Amazon Visa from $150 Prime Visa, eligibility and Amazon-account delivery |
| American Express Gold | As high as 100,000 Membership Rewards points after $8,000 purchases in first 6 months | [Amex consumer card page](https://www.americanexpress.com/us/credit-cards/) | Personalized offer amount and previous-cardholder restrictions; do not call the maximum guaranteed |
| American Express Platinum | As high as 175,000 Membership Rewards points after $12,000 purchases in first 6 months | [Amex consumer card page](https://www.americanexpress.com/us/credit-cards/) | Personalized maximum and applicant-specific eligibility; avoid confusing with Business Platinum |
| American Express Green / Classic Green | No new-card offer can safely be claimed; issuer documents cardmember benefits, while independent sources report that new applications stopped July 23, 2026 | [Amex existing Green card benefits](https://global.americanexpress.com/card-benefits/view-all/amex-green) | Confirm availability directly with Amex before approving a "not available" status; historical 40,000-point bonus must never be shown as current |
| Atmos Rewards Ascent Visa Signature | Bank of America main card listing shows 50,000 points plus $99 Companion Fare after $1,500 in 90 days. Another Bank of America channel shows 70,000 points plus companion fare after $2,500 in 90 days | [Bank of America main card listing](https://www.bankofamerica.com/credit-cards/), [BofA Preferred Rewards listing](https://www.bankofamerica.com/credit-cards/preferred-rewards-credit-cards/) | These are **alternative channel-specific offers, not additive milestones**. Human reviewer must confirm exact URL, channel, thresholds, expiry and companion fare conditions |

## Approval checklist

1. Open the current issuer page, and verify the product identity, application availability and channel, bonus currency, amount, deadline and spending requirement.
2. Check prior-cardholder eligibility, exclusions (including cash-like purchases and fees), offers limited to a particular membership or card upgrade, required activation, fulfillment timeline and any companion-fare conditions.
3. For multi-step offers, confirm whether thresholds are cumulative totals or **additional** amounts. For channel-dependent alternatives, approve only a precise applicable version, not two simultaneous options.
4. Verify issuer pricing and full cardholder terms separately. The amount of a points bonus is not equivalent to a fixed cash value.
5. Record the reviewer identity and current date in `catalog/OFFER-QC.json`, set `approved: true` only when complete, and run `npm run build && npm test`. An approval-only PR can trigger safe automatic publication on main; non-approval changes require committed regenerated artifacts.
6. After publication, inspect the Explore comparison workbench at mobile and desktop widths, plus issuer source links and the timestamped bonus caveat.

**Limitation:** Offer pages may be targeted, expired, cached or rendered with overlapping old and new figures. This research packet is not an assertion that any individual applicant is eligible or that any source offer remains available after the research date.
