# AnCard  -  Secondary Discovery Dashboard

Status: Phase 1 prototype. Intended URL after merging and deploying: `/AnCard/dashboard/`.

## Purpose

Provide a separate client-side workspace for deliberate exploration and factual comparison, without automatically ranking or recommending products. Maintain the existing homepage and brand voice.

## Present capabilities (v1 catalog adapter)

- Load `docs/data/cards.json` locally from GitHub Pages; display 28 real issuer-sourced records with explicitly limited source verification.
- Filters: reward type, spending category, annual fee upper bound, and secured descriptors where documented. Factual alphabetical and cost sorting.
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

## External card art opt-in (v0.2.0)

Global Show Card Art checkbox defaults off on every page load and navigation. No third-party image requests until the visitor intentionally enables it. The explanatory label states that third-party issuer or CDN servers receive IP address and browser request metadata. The app sets referrerPolicy=no-referrer. Unknown artwork remains a text-first badge. No cookies or persistent browser storage is used.

## v0.3.0  -  Airline cards and pending review

The dashboard accepts `pending_review` and `published` records. Unapproved card rows show identity and source only. Added `airline` identity facet, allowing exploration of 13 additional airline co-branded candidates without exposing proposed earning rates. Card art remains optional and disabled by default.

## v0.7.0 premium card interactions

The dashboard and directory share one original AnCard illustration helper. It creates all graphics locally with original gradients and geometry, not copied issuer art. Card front and reverse views have keyboard-accessible flip/return controls and hide inactive controls from assistive technology.

Filters can select issuer, card identity (airline, hotel, secured, student), and human-review status without assuming unapproved rewards or annual fees. Verified-terms filters still exclude cards with unknown values. The first 24 cards are rendered, with the user controlling how many additional records appear.

The dashboard also preserves its original factual comparison workflow. All issuer image URLs remain blocked unless written usage permissions are recorded, and later require an additional visitor opt-in.
