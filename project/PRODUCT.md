# AnCard Product Brief  -  October 27, 2026

## Vision

AnCard is an independent, privacy-first credit-card literacy and navigation platform, turning financial fine print into readable facts so that consumers can make their own decisions.

## Customer promise

"Know more. Choose for yourself." AnCard is an educational compass, not a transaction marketplace, credit-score service, lead generation funnel or suitability recommendation engine.

## Current MVP scope

1. Disclosure-first entry acknowledgment. No personal-data consent implied by acknowledgment.
2. Curated credit-card catalog; current release-candidate catalog contains 41 identified consumer cards across 10 issuers (including 13 airline co-branded products), all awaiting explicit human approval; selected facts are not a complete card-agreement audit.
3. User-controlled, combinable reward, spending, card-type and fee filters; neutral sort options.
4. Plain-English financial term explainers and detailed caveats per card.
5. Side-by-side factual comparison, maximum three cards, no ranking or winner.
6. Transparency and methodology, privacy and important legal notices.
7. Editorial governance for card creation, review, publication, correction and archiving.

## Not in MVP

Account/login, stored visitor state, personalized quizzes or suggestions, card approval prediction, credit score pulls, card applications, affiliate referrals, analytics scripts, third-party ad tracking, public reviews, community and bank integrations.

## Privacy constraints and limitations

Filter inputs and comparison selections remain in JavaScript memory within the browser and are not saved. The initial site does not use cookies, localStorage or sessionStorage. Publishing is static. Hosting infrastructure can collect network/security logs, including IP addresses. Any future contextual advertising must be re-evaluated for tracking risks and conspicuously disclosed. No unconditional "zero data collection" claim may be made.

## Navigation journey

Disclosure acknowledgment → Explore category/filter controls → Inspect card terms and caveats → Compare selected cards side by side → Follow issuer sources once verified real cards become available. Supporting sections are accessible throughout: Decoder, Methodology, Privacy and Important Notices.

## Technical foundation

HTML/CSS and native JavaScript; no runtime frameworks; card JSON files in Git; dependency-free Node compilation + validation; generated single-file public catalog; GitHub Pages static hosting of `docs/`. A server-side API and database are intentionally deferred until justified by real product needs.

## Launch requirements

- Perform independent complete card-agreement audits for the 28 current issuer-sourced records and recheck all reward/fee disclosures, including unknown fields.
- Establish a regular content review calendar and a correction process.
- Test keyboard usability, screen readers, browser compatibility, mobile presentation and filtering accuracy.
- Review disclosures with appropriately qualified legal/compliance counsel before publicly representing the site as definitive financial information.
- Decide whether repository can become public for GitHub Free Pages, or use a qualifying plan/other host; GitHub Pages sites are public even if repository remains private under an eligible plan.

## 2026-10-27  -  Real issuer snapshot and visual opt-in

The public JSON feed now contains 28 real cards and omits six earlier fictional demo records, which are retained in the Git history. Source-check dates reflect confirmation of **selected** issuer and issuer-network facts, not independent verification of every card fee, APR, welcome offer, or protection. Undefined fields remain unknown. Nine confirmed card-art URLs from Chase, Capital One and U.S. Bank are optional and default off; loading them exposes the visitor's network request metadata to those institutions/CDNs. User choice exists only in page memory. All source and art details remain subject to review before merging the release candidate.

## v0.3.0  -  Human approval controls the public facts

The static site publishes real-card **identities only** until the owner approves the corresponding proposal in `catalog/HUMAN-QC.json`. Pending cards show no fees, earning rates, APRs, bonuses, or unapproved benefits. A card's pre-existing `published` editorial status does not imply that a human has checked the terms. Human QC records can be located by Ctrl+F on card name; changed financial data invalidate prior approval until reviewed again.

## Research expansion (v0.4.0)

The catalog consists of an unranked editorial research inventory. New candidate cards remain backend-only until owner QC. No ranking, match score, or top-card claims are generated. The homepage displays a circular QC completion percentage, calculated from reviewed count divided by total research records. Human-reviewed cards can expose structured reward models, activation/spend limits, and quantified perks in the terms decoder and side-by-side comparisons. This must not imply all missing perks are absent.

## v0.5.0 directory coverage

The 100 researched products now appear in the public directory **without rankings** and **without unapproved card costs or benefits**. Their back-office records carry proposed source-backed facts for human QC. Every approved card may publish its documented fee, earning rates, caps and quantified benefits; unapproved cards remain identity-only placeholders. The directory total is a coverage inventory count, not a "top 100" or approval-likelihood ranking.
