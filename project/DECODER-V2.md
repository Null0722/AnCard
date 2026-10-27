# Decoder field extensions, v0.6.0

Fields on canonical `catalog/cards/<id>.json` are optional. They are mirrored into `catalog/HUMAN-QC.json` by `candidateFrom` and the review sync script. A card's public financial terms remain hidden while `humanVerified: false`.

| Field | Data | Interpretation |
| --- | --- | --- |
| `welcomeOffer` | `kind: fixed / up_to`, `amount`, `unit: usd/points/miles`, `minimumSpendUsd`, `monthsToEarn`, `description`, `source`, `observedAt` | A dated public offer, never a guaranteed benefit |
| `targetedOffers` | `status`, `description` | No invitation amount unless documented; a personalized link can differ from public offers |
| `inviteOnlyOffer` | `status`, `description` | Separate invitation-only product vs targeted new-account offer |
| `redemptionDetail` | `examples[]: method, centsPerPoint, notes`, `source` | Value *for that method*, not universal CPP |
| `approvalGuidance` | `issuerCreditLevel`, `noPresetSpendingLimit`, `creditScoreThreshold`, `typicalApprovalScore`, `startingLimitMinUsd`, `notes`, `source` | Requires issuer evidence. Null is unknown. Do not derive typical applicant scores or opening limits |
| `pricingDetail` | `introPurchaseAprPct`, `introPurchaseMonths`, `purchaseAprRangePct`, `foreignTransactionFeePct`, `notes`, `source` | Rates change. Distinguish promo from ongoing APR; leave unsourced values null |

**Review rule:** Approval confirms the full candidate snapshot. Updating a source card's offer, limit statement, pricing claim or point valuation invalidates its earlier approval until the human checks and syncs the edited record. General educational explanations are not issuer-specific benefit claims.

**Public UI rule:** Every card gets educational explanations, but unapproved card-specific numbers remain absent from `docs/data/cards.json`. Even on approved records, unpopulated items say "not documented" rather than "none".

**Source URLs:** Only clean official issuer or primary consumer-protection sources. No marketing tracking parameters, referrals or tracked application integrations.

The [market review](MARKET-REVIEW.md) details the consumer need and evidence.
