# AnCard

**Know more. Choose for yourself.**

**AnCard is an independent, privacy-first credit card education and discovery project.** We translate confusing credit card terms into plain English and let people explore products using their own criteria - without quizzes designed to pick a winner for them.

> **Our mission:** Help everyday consumers understand what a credit card offers, what it costs, and what to watch out for *before* they make a decision.

## Why AnCard exists

Credit card offers can look straightforward until you reach the fine print: introductory rates that expire, rewards with spending caps, penalty APRs, annual fees, exclusions, and redemption rules. Comparing those terms takes time and financial knowledge that shouldn't be a prerequisite for making an informed choice.

AnCard is being built as an **educational compass, not a credit card marketplace**. We want to make complex financial information easier to inspect and compare, while giving visitors the freedom to decide what matters to them.

We are working toward a different model from conversion-focused comparison experiences: transparent sourcing and methodology, clear limitations, and no hidden pressure to choose a particular product.

## What the site is designed to do

- **Explore cards on your own terms.** Browse a curated catalog using self-selected filters for cash back, points, travel, groceries, online spending, lifestyle, card type, fees and other disclosed attributes.
- **Decode the fine print.** Read plain-English explanations of APRs, welcome offers, reward restrictions, fees, redemption conditions and other important clauses.
- **Compare facts side by side.** View up to three cards together without a secret suitability score, a sponsored winner or a personalized recommendation.
- **Show where information comes from.** Published real-card records are intended to include official issuer sources, verification dates, and editorial review.
- **Explain how AnCard works.** Make the methodology, limitations, corrections process and privacy practices accessible to visitors.

## Our principles

| Principle | What it means for AnCard |
| --- | --- |
| **Consumer choice** | We provide understandable information and user-controlled filters - not a quiz that chooses a card for you. |
| **Radical transparency** | We explain the methodology, important conditions, information sources, and what we do **not** know. |
| **Privacy by design** | No visitor accounts, credit-score pulls, stored search profiles, or behavioral analytics in the MVP. Filters and comparisons operate in browser memory. |
| **Editorial independence** | No affiliate tracking or card-application funnels in the MVP. We do not sell visitor profiles or arrange undisclosed paid rankings. |
| **Accuracy over volume** | A small, reviewed catalog is more valuable than hundreds of unverified listings. |
| **Accessible and lightweight** | Clear language, readable low-glare design, responsive layouts and minimal production dependencies. |

**A note on privacy:** The MVP does not intentionally store visitor preferences or use cookies, analytics scripts, or browser storage. The hosting provider may nevertheless process request and security logs, including IP addresses. We will not describe the platform as collecting *zero* data when that cannot be guaranteed.

**A note on funding:** The long-term goal is to explore transparent, non-tracking contextual advertising and potentially donations. This is a future business-model direction, **not** a claim that donations or ad funding is live today. Any changes affecting independence or privacy must be documented and disclosed.

## Current status  -  v0.3.0 owner-QC release candidate

The repository includes an early, working **static-site prototype** with:

- A disclosure-first entry flow and our soft-dark “Clear Atlas” visual direction.
- Client-side category filters and neutral sorting.
- A plain-language decoder, card detail views and side-by-side comparison.
- 41 real credit card identities across ten issuers, including 13 airline co-branded cards. All proposed financial details are currently hidden pending human verification.
- A Git-versioned card catalog and a build-time validation script.

**Important:** All 41 cards start as identity-only placeholders. Proposed fees, rewards, restrictions and sources are available for your review in `catalog/HUMAN-QC.json`, but no unapproved financial claims are published.

AnCard provides general educational information, not personalized financial, legal or credit advice. Card terms can change. Before applying for any card, read its current official issuer disclosures and agreement.

## Approve a card using one searchable file

**[Open the central HUMAN-QC.json review queue](catalog/HUMAN-QC.json)**. Press **Ctrl+F**, enter a card name, and read its `candidate` fields for annual fees, benefits, restrictions and official source URL.

1. Check every proposed term against the issuer's current official disclosures.
2. If the values are correct, change `"humanVerified": false` to `"humanVerified": true` for that card. You may add initials or review notes.
3. Run `npm run build && npm test`. Commit both `catalog/HUMAN-QC.json` and the regenerated `docs/data/cards.json` file before merging.

A GitHub edit of the flag **alone** does not rebuild the static site. If an underlying card detail changes, run `npm run qc:sync` to refresh the review queue. The changed card resets to `false` and must be checked again.

**False means visitors see only a named placeholder and official issuer link, with no fees, benefits or earning rates.** True means the reviewed card terms can be published. The source record and central review queue must match or the build fails.

See the [human QC instructions](project/HUMAN-QC.md) for the complete process.

## Optional official card images

Card imagery is **off by default**. The directory and dashboard render a typography-based badge without third-party image requests. If a visitor explicitly enables “Show official card art,” the browser then requests verified front-card image URLs from the issuer or its CDN. This can disclose an IP address and browser metadata to that issuer; AnCard sets `referrerPolicy=no-referrer` and does not save the toggle. Images not yet sourced retain a badge, even when enabled. Nine records currently have issuer-sourced image URLs. Images and hotlink permissions still require live-browser verification before release. See [image opt-in policy](project/ART-OPTIN.md).

## How it works technically

To keep GitHub Pages hosting affordable and the site easy to maintain, the MVP uses **HTML, CSS, vanilla JavaScript and a Git-managed JSON card catalog** - no runtime database, account backend, third-party UI framework or production server required.

```text
catalog/cards/          One JSON file per card
scripts/catalog.mjs     Validate and compile card records
docs/                   Static website published by GitHub Pages
docs/data/cards.json    Generated, read-only public catalog
project/                Product, architecture and editorial decisions
CHANGELOG.md            Git notepad for website changes
```

Card records can move through `draft`, `review`, `published` and `archived` states; `demo` is reserved for fictional examples. Only publish verified real card data after a human source review.

### Run locally

Requires **Node.js 20+** and **Python 3**:

```sh
npm run build
npm test
npm run preview
```

Then open **http://localhost:8080**. A local HTTP server is needed because the catalog loads with `fetch()`; directly opening an HTML file from disk will not work as intended.

### Update the card directory

1. Add or modify an individual file in `catalog/cards/`.
2. Follow the schema and editorial checks in [project/EDITORIAL.md](project/EDITORIAL.md).
3. Run `npm run build` and `npm test`; commit the updated `docs/data/cards.json` alongside the original record.
4. Document the reason, source verification and affected pages in [CHANGELOG.md](CHANGELOG.md).
5. Review and merge the change before publishing.

The validator checks file structure and required publication metadata; it cannot replace independent human verification of financial terms.

## Discovery dashboard and banking research

A separate, privacy-first [discovery dashboard](docs/dashboard/) is being developed to support explicit card filtering and factual comparisons. Current records are fictional examples. Planned checking, savings, relationship-tier and invite-only research is documented in [the ten-institution source register](project/TOP10-RESEARCH.md) and [modular catalog model](project/CATALOG-V2.md); it is not yet a verified public banking directory.

## Where we're going

Our immediate priorities are to **verify a small set of real credit cards against official issuer terms**, improve term-by-term explanations, complete accessibility and browser QA, and strengthen the editorial review process. Future features should preserve the same principles: no unnecessary data collection, no opaque recommendation logic, and no incentives hidden from visitors.

## Project documentation

- [Product vision and MVP boundaries](project/PRODUCT.md)
- [Architecture and design decisions](project/DECISIONS.md)
- [Editorial verification and correction process](project/EDITORIAL.md)
- [Website change log](CHANGELOG.md)

The static website is designed to be served from `main` → `/docs` using **GitHub Pages**. Publishing settings and deployment status are managed separately from this README.

---

**AnCard's goal isn't to choose a card for you. It's to give you the clarity to choose for yourself.**
