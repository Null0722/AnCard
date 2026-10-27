# Catalog Editorial and Publishing Process

## Card records

Each `catalog/cards/<card-id>.json` file is the canonical record. The compiler in `scripts/catalog.mjs` creates the only public JSON consumed by the frontend (`docs/data/cards.json`). Allowed `status` values: `draft`, `review`, `demo`, `published`, `archived`. Only demo and published entries reach the public catalog. Demo records must be fictional, lack verification claims and be conspicuously labeled in the UI.

Required fields: `id`, `name`, `issuer`, `status`, `fictional`, `tone`, `summary`, `primaryLabel`, `feeSummary`, `annualFeeUsd` (integer or null), `rewards`, `categories`, `features`, `plainEnglish`, `watchOut`, `limitations`, `verifiedAt`, `issuerSource`.

## Publishing an actual credit card

1. Read the official current issuer product page and card agreement. Do not copy marketing text or depend on an aggregator as the sole source.
2. Write plain-English descriptions of APR rules, fees, reward caps, restrictions, and marketing disclosures. Verify each required fact and record any data not supplied as unknown—not zero.
3. Set `fictional` to `false`, `status` to `review`, fill in the clean HTTPS issuer source link and verification date. The published URL cannot contain query parameters or fragments.
4. Have an independent reviewer check the source and copy against the terms. Only then change `status` to `published`.
5. Run `npm run build && npm test`. Commit changes including generated catalog and a dated `CHANGELOG.md` entry. Merge after PR review.
6. Re-check published details on a scheduled cadence and when issuer changes are reported. If terms are uncertain or obsolete, set `status` to `archived` (or `review`) pending investigation, rebuild and redeploy.

**Important:** The build script validates structural publication conditions. It cannot prove that a human verified factual issuer claims; editorial review is still required. Since this is an educational site, avoid claims of exhaustive listing, unbiased mathematical valuations or personalized financial advice.

## Removal, corrections and privacy

Archiving preserves the card's source record and Git history while removing it from the public catalog. Corrections should state the affected record and source date in the change log. Do not add third-party analytics, pixels, affiliate URLs or browser storage without a new documented privacy review.
