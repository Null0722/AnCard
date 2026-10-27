# AnCard — Secondary Discovery Dashboard

Status: Phase 1 prototype. Intended URL after merging and deploying: `/AnCard/dashboard/`.

## Purpose

Provide a separate client-side workspace for deliberate exploration and factual comparison, without automatically ranking or recommending products. Maintain the existing homepage and brand voice.

## Present capabilities (v1 catalog adapter)

- Load `docs/data/cards.json` locally from GitHub Pages; display fictional demonstration records visibly labeled.
- Filters: reward type, spending category, annual fee upper bound, and existing secured/student descriptors. Factual alphabetical and cost sorting.
- No persistent state, server queries with user choices, cookie, login, analytics or recommendations.
- Do not show invented foreign fees, APRs, bonus valuations or access thresholds for the example records.

## Filter roadmap when verified v2 fields ship

Cost: annual fee, foreign fee, 0% balance-transfer duration, transfer fee, maintenance/overdraft (banking section).
Rewards: dining, grocery, gas, travel, online, lifestyle; rate unit, spend caps, category activation.
Welcome offers: max required spend, time window, illustrative net value with disclosed assumptions.
Credit/access: voluntarily selected broad credit bracket, without sending/storing it, plus access type (public/relationship/invitation/unknown); don't predict approval.
Perks: car-rental CDW, travel insurance, cell phone coverage, restrictions.
Checking/savings: distinct product tabs and differing fee/interest controls; never equate checking APY with card rewards.

## Acceptance rules

- Filters only use populated, verified fields. Unknown means unknown, not zero. Factual sorts only, no best-match.
- Clear count, clear-all affordance, keyboard-accessible controls, no horizontal clipping on mobile.
- If launched as an independent page, show the same informational disclosure before allowing browsing; do not persist acknowledgment.
- No sensitive balances or scores sent to server.
- Support URLs relative to the GitHub Pages project subpath.
- Update docs and changelog for every frontend or schema update.
