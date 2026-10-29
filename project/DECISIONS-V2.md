# AnCard  -  Decision Addendum 2026-10-27

### ADR-006  -  Expand domain without expanding visitor data

Use a type-discriminated versioned record model for cards, checking and savings, plus a standalone relationship program record. Preserve v1 until audited migration. No bank account connection, score pull or profile.

### ADR-007  -  Tier and invite-only truthfulness

Track access category and documented thresholds with an explicit evidence state. Brand-level or secondary-source speculation is not eligibility fact. Wealth-qualified bonus modifiers belong to separately sourced relationship tiers; do not attach them as unconditional rewards to a card.

### ADR-008  -  Secondary dashboard, not a recommendation engine (superseded by ADR-011)

A static, browser-only comparison workspace extends the homepage. Release existing-field filters first; gate advanced controls on verified v2 data. Keep the low-glare dark UI and zero runtime frameworks.

### ADR-009  -  Date-sensitive interest and offers

APR/APY and welcome promotions can expire and differ by account holder. Store exact condition, source and checked date. Unknown stays null and can never pass “fee-free” or minimum return filters.

### ADR-010  -  Curated 10-institution research cohort

Research the ten user-specified financial institutions, with an issuer link index and an individual product audit queue. This is a coverage cohort, not an externally verified top-10 ranking. The current discovery pass must not be represented as a finished audit.

### ADR-011  -  Explore is the sole visitor-facing interface (2026-10-29)

Retire the standalone `/dashboard/` route, dashboard script and navigation entry. Maintain one card-discovery flow at `docs/index.html` with its in-memory 2-4 card comparison workbench, editorial verification gates, issuer references and current fact-only filters. Future filtering improvements belong inside Explore, not on a duplicate page. This supersedes ADR-008; the reasons for the original prototype remain visible in Git history.
