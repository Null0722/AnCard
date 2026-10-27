# AnCard Git Notepad / Change Log

All meaningful website changes are documented here and in Git history. Entries should state **what changed**, **why**, **files/components affected**, **verification**, and **what is next**. Most recent changes first. Do not silently rewrite prior decisions; add a new dated entry instead.

## 2026-10-27 — Public repository README refresh

- **Changed:** Rewrote the README as a visitor- and contributor-friendly explanation of AnCard's mission, motivation, user-controlled discovery, plain-English financial literacy, independence, and privacy commitments.
- **Why:** With the repository public, newcomers should immediately understand what AnCard aims to achieve before reading developer setup instructions.
- **Clarity:** Distinguished future non-tracking advertising/donations from implemented funding; explained hosting log limitations, fictional example cards, non-advisory nature of content, and editorial work needed before publishing verified offers.
- **Affected:** `README.md`, `CHANGELOG.md`. No runtime site or card records changed.
- **Verified:** Confirmed repository is public and README content aligns with `project/PRODUCT.md`, `project/DECISIONS.md` and `project/EDITORIAL.md`.
- **Next:** Check GitHub Pages publishing configuration, run mobile/browser accessibility tests, and verify a starter collection of actual issuer cards.

## 2026-10-27 — MVP website foundation (0.1.0)

- **Changed:** Implemented the dark "Clear Atlas" direction: soft blue highlights, muted mint trust markers, charcoal surfaces, responsive filter sidebar and card directory.
- **Why:** The product prioritizes clear comparison and educational tone, rather than promotional recommendations.
- **Catalog:** Added an individual-record JSON card catalog with a dependency-free Node compiler and publishing validation. Six conspicuously fictional demo entries power the UI. Status lifecycle: `draft` → `review` → `published` → `archived`; `demo` reserved for illustrations.
- **Visitor experience:** Added mandatory in-memory trust acknowledgment; filter chips and sidebar checkboxes; neutral sort options; plain-language decoder; modal card details; comparison of up to three selections; static methodology, privacy and important notices.
- **Privacy:** No cookies, local/session storage, tracking scripts, login, quiz or submissions. Explicitly disclosed that GitHub Pages logs IP addresses for security purposes. No third-party images or fonts.
- **Hosting:** Placed public output in `docs/` for GitHub Pages branch-folder hosting. Production deployment requires repository visibility/Pages configuration and a reviewed merge.
- **Affected:** `docs/`, `catalog/cards/`, `scripts/catalog.mjs`, `package.json`, `README.md`, `project/`.
- **Verified:** `npm run build` and `npm test`. Browser regression tests and public Pages activation to be recorded once completed.
- **Next:** Verify real issuer products and replace demo records, expand term disclosures, and complete accessibility / browser QA before declaring the site production-ready.

## 2026-10-27 — Product direction clarified (1.1 requirements)

- **Changed:** Removed quiz/recommendation engine in favor of self-directed category filters: cash back, points, travel, groceries, online spending, lifestyle, secured, student, and annual fees.
- **Why:** Preserve consumer agency; avoid implied suitability advice and undisclosed recommendation pressure.
- **Decision:** No user profiles, saved search histories, card affiliate application tracking or hidden match scores.

## 2026-10-27 — Product vision baseline (1.0 requirements)

- **Defined:** Independent credit-card literacy, radical transparency, factual sourcing, readable terms, and privacy-first operation.
- **MVP:** Trust gate, curated cards, plain-English decoder, filter-first catalog and governance pages. No accounts, bureau pulls, community forum or user reviews.
