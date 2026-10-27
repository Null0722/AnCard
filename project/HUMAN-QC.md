# How to verify and publish a credit card in AnCard

## Start here

**[Open the full searchable review queue](../catalog/HUMAN-QC.json).** It is one JSON document ordered by credit card name. Press **Ctrl+F** (or Cmd+F on a Mac), find any exact card name, and inspect the nearby proposed details.

Each record contains `name`, `issuer`, the switch `"humanVerified": false`, and a readable `candidate` object: `annualFeeUsd`, `feeSummary`, `primaryLabel`, `plainEnglish`, `watchOut`, `limitations`, rewards/categories/features, `issuerSource`, source-check date and applicable airline program.

### Example: Delta SkyMiles Gold American Express

```json
{
  "name": "Delta SkyMiles Gold American Express",
  "humanVerified": false,
  "candidate": {
    "annualFeeUsd": 150,
    "feeSummary": "$150 annual fee after introductory first year",
    "primaryLabel": "2X Delta purchases, restaurants and U.S. supermarkets; eligible checked bag benefits.",
    "issuerSource": "https://www.americanexpress.com/us/credit-cards/card/delta-skymiles-gold-american-express-card/"
  }
}
```

*Abbreviated display of a proposed entry  -  open the full record for every condition and supporting source. No proposal is human-verified yet.*

## Your review checklist

1. **Find the card:** Open `catalog/HUMAN-QC.json` and Ctrl+F the name.
2. **Check the issuer:** Open `candidate.issuerSource`. Verify the product is currently available, and inspect its rates-and-fees schedule and benefits agreement (marketing pages alone may omit restrictions).
3. **Check the proposed fields:** Annual fee, first-year promotions, APR caveats where present, rewards/miles, categories and caps, redemption restrictions, purchase protections, travel perks, extra fees, and every warning. Do not infer a missing fee is $0.
4. **Correct if necessary:** Edit the matching canonical `catalog/cards/<id>.json` record; run `npm run qc:sync`. This updates proposed terms and resets that card's approval to `false`.
5. **Approve:** Once every proposed statement is supported, change just `"humanVerified": false` to `"humanVerified": true` in the central queue. Optionally fill `reviewedBy` and `reviewNotes` to record verification details.
6. **Rebuild:** Run `npm run build && npm test`. Commit your edited `catalog/HUMAN-QC.json` and generated `docs/data/cards.json` together, ideally through a pull request. GitHub Pages reflects changes only after the new static output is published.

## Public behavior

| QC value | What the website displays |
| --- | --- |
| `false` | Card name, issuer, official issuer link, airline identity (where applicable), and **Pending human review**. Financial facts are stripped out of public JSON. |
| `true`, facts match | Approved terms, fee and benefits can appear; disclosure text and date stay visible. |
| `true`, facts changed | Build **fails** until `npm run qc:sync` resets the candidate and you review it again. |

The card art switch is independent and defaults off. Turning it on may contact issuer/CDN servers; enabling images does **not** imply that financial terms have passed human QC.

**Important:** Do not approve cards in bulk. This is a factual editorial review checkpoint, not a statement that future APRs or offers cannot change. Only approve terms that you can confirm.
