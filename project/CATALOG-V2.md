# AnCard  -  Modular Financial Product Catalog v2 (design contract)

Status: proposed, development branch. This does not replace the currently published v1 credit-card JSON records until reviewed and migrated.

## Scope and principle

Represent credit cards, checking accounts, savings accounts and banking relationship tiers without needing a server or visitor profile. Keep **one JSON product per file** and compile verified, published records into separate public product feeds. All filtering, spend calculations and comparisons occur in browser memory, never on the server. Avoid collecting balances, credit scores, actual spending history or other PII.

## Canonical record

```text
catalog/
  institutions/<institution-id>.json
  products/cards/<product-id>.json
  products/checking/<product-id>.json
  products/savings/<product-id>.json
  relationships/<program-id>.json
  schema/product.v2.schema.json
```

Every product has:
- `schemaVersion: 2`, stable kebab-case `id`, `institutionId`, `type` (`card` | `checking` | `savings`), `name`, `status` (`draft` | `review` | `published` | `archived`), `availability` (`public` | `relationship` | `invitation` | `unknown`).
- `fees[]` each with kind, amount/currency and plain-language condition/waiver. Null = unknown, not waived.
- `sources[]` each with official URL, source type (`offer-page`, `agreement`, `schedule-of-fees`, `benefits-guide`), checkedAt YYYY-MM-DD, and note. Store independent review in editorial metadata. Official-source validation cannot guarantee factual correctness.
- `warnings[]`, `tags[]`, `plainEnglish`, `archivedReason` if applicable.

Card-specific: `apr` with purchase/intro/penalty/BT terms and triggers; `earnRules[]` with category, percent or points/miles per USD, cap, period, enrollment, exceptions; `welcomeOffer` with amount/unit, required spend and elapsed window, eligibility; `perks[]` with exclusions and conditions; `creditGuidance` with issuer-published or unknown status, never inferred approval odds; `relationshipProgramIds[]`.

Checking-specific: `maintenanceFee`, `waiverRules[]` with explicit OR/AND semantics, `overdraftPolicy` with paid/declined amounts, per-day cap, grace rules and transfer protection; `openingDeposit`, `apy` where applicable, `atm`, `accessConstraints`.

Savings-specific: `apy` (numeric, checkedAt, variable flag, minimum balance/cap, promotional expiry); `maintenanceFee`, `waiverRules[]`, `minimumBalance`, withdrawal and transfer constraints. APYs are time-sensitive: do not display as current if stale.

Relationship program: own record with tier-specific `qualification` (assets/balance thresholds, measurement window, scope, prerequisites), `rewardsModifiers[]` (target products, amount and basis), `feeWaivers[]`, dates and sources. Tiers link to cards/accounts by IDs, not duplicated prose.

## Validation & publication policy

- Unknown is represented as `null` and visible as **Not verified**, never silently inferred to be zero, free or public.
- Separate `confirmed-by-issuer`, `secondary-report`, `unverified`, `not-publicly-disclosed` evidence states. Only confirmed fields should drive numerical filters; secondary evidence can appear in a clearly distinguished educational note.
- A product cannot publish without verified official identity, product lifecycle, terms source and review date. Each claim-specific datum records source and checked date in the editorial record.
- Invite-only qualification may be unpublished. Do **not** present rumored Centurion or J.P. Morgan Reserve wealth/spend requirements as official thresholds.
- Benefits with coverage restrictions must show exclusions. Points/miles are not equivalent to cash without an explicit redemption model; do not use default dollar valuations.
- Do not combine monthly maintenance fees with annual card fees under one unlabeled 'fee' filter.
- With versioned catalog, retain v1 adapter until explicit migration. No runtime backend is required for GitHub Pages; adding APIs is deferred.

## Filter semantics and calculation

- OR among values within the same filter facet; AND between facets.
- Exclude unknown fields from restrictive numeric or true/false facets instead of treating unknown as no-fee.
- Cost: annual card fee ceiling, foreign transaction fee flag, transfer windows/fees, checking maintenance and overdraft separately.
- Rewards: merchant category, earn type and threshold with spend cap and conditions displayed.
- Offers: minimum spend ceiling, qualification window and illustrative net estimate (label assumptions and avoid speculative points-to-cash conversions).
- Access: public / relationship / invitation / unknown; issuer-described credit bands only, no eligibility guarantee or bureau calls.
- Perks: coverage type, enrollment requirement, issuer documentation. Unknown not equal to absent.
- Comparison must be factual and neutral. No personalized ranking, quiz, hidden score or tracked application link.

## Rollout

Phase 1: preserve legacy v1 card directory; introduce catalog v2 as an independently reviewed contract, add dashboard and research index.
Phase 2: verified first-party card records and publish-aware frontend filters.
Phase 3: manually vetted checking/savings and relationship records, only after review and clear separation by product type.
