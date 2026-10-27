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
- 100 searchable card identities across 10 institutions, with every financial claim subject to explicit human QC. Every financial benefit must pass human approval before appearing publicly.
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

## Local discovery improvements

The card directory and comparison dashboard provide a fast **search by issuer, card name, or airline program**, plus an editorial-status filter. Searches run entirely inside the loaded static catalog. No query or selection is transmitted to a server. The dashboard Clear Filters action keeps your side-by-side selections.

Catalog tests also verify that unapproved monetary and reward details are absent from public JSON and that em dashes have not been introduced into the repository.

## Easier card review

For a more readable view than raw JSON, open the [generated card review sheet](catalog/REVIEW-SHEET.md). Each card has a searchable heading with proposed annual fees, rewards, restrictions, and an issuer source link. The sheet is read-only and generated from the approval queue. **To change approval, edit [HUMAN-QC.json](catalog/HUMAN-QC.json)**, then run `npm run build && npm test` and commit both generated outputs.

## Extended unranked research inventory

AnCard does not rank cards or recommend "top" products. The growing inventory is a **research database**, not a ranked list. It contains **100 proposed consumer-card records** across the existing institution cohort, including 59 new research-only candidates. This number is an inventory count, not a ranking or promise of complete coverage.

- Open the [searchable human QC review sheet](catalog/REVIEW-SHEET.md) to inspect proposed annual and monthly fees, earning structures, category caps, statement credits, Global Entry / TSA PreCheck reimbursements, and other restrictions.
- Review the underlying official issuer documentation, then flip the card's `humanVerified` boolean in [HUMAN-QC.json](catalog/HUMAN-QC.json).
- The 59 additional research candidates now **appear in the public directory as identity-only, human-review-pending placeholders**. Fees, earning rates, bonuses and perks remain hidden until approval. All 100 directory identities are visible as privacy-safe placeholders without unapproved financial details.
- Each approved card may then display structured reward categories, rate multipliers, spending caps, travel credits and terms through the **Decode terms** view and neutral comparison table.
- The circular progress display counts human-approved research records against the full internal review queue. It does not score, rank or endorse any card.

The stack remains static HTML, CSS, JavaScript and JSON on GitHub Pages with no visitor profiles or persistence.

## Decoder v0.6.0: terms people actually compare

AnCard now decodes six areas on every card: product overview, welcome/targeted/invitation-only offers, borrowing costs, earning and redemption values, credit history/starting limits, and travel/lifestyle protections. General explanations work even while a card is pending human QC; specific offer amounts, APR details and redemption values are shown only once approved.

The first issuer-backed proposals cover seven welcome offers, four evidence-based redemption/credit guidance records and a small set of intro APR descriptions. This does **not** imply those values are guaranteed, and the remaining cards retain explicit unknowns. See [market review](project/MARKET-REVIEW.md), [decoder field model](project/DECODER-V2.md), [review sheet](catalog/REVIEW-SHEET.md) and [human approval queue](catalog/HUMAN-QC.json).

## Premium flipping card visuals (v0.7.0)

All directory cards display original AnCard illustrations rendered locally without issuer artwork or trademarks. These illustrations are not accurate reproductions of specific bank card fronts. Click/tap a card or use its keyboard-focusable Flip control to view a summary within the card border. Select Full Decode Terms from the reverse side for detailed explanations.

The directory and dashboard now offer issuer, card type and review-status filters, with reward and fee filters still restricted to human-reviewed financial facts. The first 24 results render initially, with a Show More control. No profile, cookie or browser storage is added.

Important: the nine previously sourced issuer image URLs remain in the card records for reference, but cannot load unless there is recorded written permission and explicit visitor opt-in. There is currently no documented permission for these URLs, so the external-art toggle is disabled. This protects visitor privacy and avoids assuming that an accessible online image is licensed for reuse.

See [card imagery rights policy](project/ART-OPTIN.md) and [dashboard design notes](project/DASHBOARD.md).

## Optional official card images

The site now shows original, locally generated illustrations for all cards. Reuse of official issuer artwork requires documentary written permission, followed by explicit visitor opt-in. All nine previously sourced image URLs are currently blocked from loading because that permission has not been recorded. No issuer-image requests occur. See [card imagery rights policy](project/ART-OPTIN.md).

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

## Source-backed review fields, October 27, 2026

The prefilled owner queue includes proposed annual and monthly fees, earn rates per eligible dollar, category conditions, quarterly or yearly spend caps, transfer-related caveats, rewards-model labels and quantified benefits where issuer sources support them. Unknown or changing values remain unverified, rather than being represented as zero. The 59 latest additions include 53 annual-fee values and 37 structured earning-rule records. These counts describe populated fields, **not 53 fully audited agreements**.

All 100 card names are now exposed as unranked, alphabetical directory identities. Every card is marked `Pending human review` until its specific `humanVerified` value is true and its proposal matches the underlying record. Corrected Aer Lingus data requires another human approval. Editing the JSON alone does not automatically regenerate GitHub Pages output; see the build instructions in the owner QC guide.

## Single-flag approval publishing

For cards whose proposed facts match the canonical record, an authorized editor can open [HUMAN-QC.json](catalog/HUMAN-QC.json) on **main** and change the exact card's `"humanVerified": false` to `true`. The **Publish reviewed card data** GitHub Actions workflow validates, regenerates `docs/data/cards.json` and the readable review sheet, commits their synchronized output, and requests a fresh GitHub Pages build. If a proposal and its source disagree, the build fails and **does not publish the unreviewed claim**.

The workflow does not certify terms automatically: the reviewer must read the official issuer disclosures before changing the flag. You can also run `npm run build && npm test` locally for advance checking. Read the Actions log if the automatic publishing job fails (for example, if GitHub repository workflow permissions or Pages API settings restrict automated commits).

## Approve-only pull requests without manual generated-file commits

A PR that changes **only** one or more `humanVerified` flags from `false` to `true` in `catalog/HUMAN-QC.json` is now allowed to pass the generated-artifact check after compiling and validating the proposal. The workflow verifies that no other JSON fields, file paths or card terms have changed. When that PR merges into `main`, the existing `Publish reviewed card data` action generates and commits both public artifacts and requests the GitHub Pages rebuild.

If you modify any candidate details, revoke an approval (`true` to `false`), change additional files, or correct a card source, you **must** run `npm run build && npm test` and commit `docs/data/cards.json` and `catalog/REVIEW-SHEET.md` in the PR. That prevents a revoked card's previously approved details from remaining in the committed public feed.

This fixes the common PR CI failure caused by a one-line approval change while keeping the editorial data-consistency checks. If GitHub Actions is disabled or cannot push, check `Publish reviewed card data` and the subsequent Pages deployment before assuming a new approval is visible.

## Image toggle and issuer links

The **Show illustrated card fronts** control works immediately and switches the original local AnCard illustrations to a typography-only display when turned off. It never sends an image request to an issuer. From the reverse of a directory card, click **View issuer source** to inspect the original issuing bank's card disclosures in a new tab; source links are untracked, with `noopener noreferrer` and `no-referrer`.

A **separate** external-art toggle becomes available only for an individually authorized asset with documentary evidence of reuse rights. Consumer consent for a network request is not a copyright or trademark license. The nine bank image URL references are not currently enabled. See the [bank terms review](project/CARD-IMAGE-RIGHTS-REVIEW.md).
