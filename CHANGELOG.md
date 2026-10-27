# AnCard Git Notepad / Change Log

All meaningful website changes are documented here and in Git history. Entries should state **what changed**, **why**, **files/components affected**, **verification**, and **what is next**. Most recent changes first. Do not silently rewrite prior decisions; add a new dated entry instead.

## 2026-10-27: Maintenance and usability pass

- Fixed the catalog build ordering bug caused by sorting .json filenames rather than canonical card IDs. The fix was committed to main and its GitHub Actions validation passed.
- Removed em dashes from the UI, markdown documentation, and review-source annotations. Added a test that rejects new em dashes.
- Added client-side search by card, bank and airline program and a human-reviewed-only filter to both directory and dashboard. No saved searches, accounts or third-party requests.
- Dashboard Clear Filters no longer destroys the three-card comparison selection.
- Expanded the human-QC candidate fingerprint to cover public summaries and optional art/access metadata, so changed display claims cannot inherit an earlier approval.
- Added a regression check that unreviewed public records have no fee amount, source-checked timestamp, reward earning arrays, or unexpected private fields.
- Changes prepared on a maintenance branch; new site features still require CI and deployment review.

## 2026-10-27  -  v0.3.0 centralized human review and airline expansion

- **Catalog:** Added 13 airline co-branded card records across United, Southwest, American Airlines, Delta and Atmos, bringing the prospective real-card cohort to **41** across ten issuers.
- **Human review:** Added `catalog/HUMAN-QC.json`, a single searchable alphabetical review queue with pre-filled proposed annual fees, benefits, warnings, links and a `humanVerified: false` toggle for every card. No card was automatically approved.
- **Safety:** Changed catalog compiler to publish **identity-only placeholders** until human approval. Sensitive financial values and unchecked claims are excluded from the generated public JSON. A mismatch between original card facts and the QC candidate prevents the build from passing.
- **Workflow:** Added `npm run qc:sync`, which keeps approvals only for unchanged card candidates; changed details reset to `false`. `npm run build && npm test` produces and checks the visitor-facing data.
- **Frontend:** Main directory and dashboard label pending cards clearly and include an airline category/filter, without adding visitor accounts or tracking.
- **Maintenance:** Linked documentation and updated Git notepad. Full per-card agreement verification, source freshness, artwork, mobile/browser testing and final deployment remain open.
- **Affected:** Card records, approval queue, catalog compiler, generated data, dashboard/directory, README and project documentation.

## 2026-10-27  -  Real-card source snapshot and opt-in visual assets

- **Changed:** Created 28 real card records spanning 10 banks; limited claims to selected current issuer-page and network-directory statements. Archived fictional entries from the compiled public feed without deleting their Git history.
- **New UI:** Text-only issuer badges by default in directory and dashboard. Opt-in global checkbox loads verified external card art only after user action, with explicit privacy warning. Nine issuer-sourced card-front URLs: three Chase, three Capital One and three U.S. Bank. No art URL is invented for other issuers.
- **Privacy:** Toggle is never stored; image elements are created only after opt-in, set `referrerPolicy=no-referrer`. Issuer/CDN can still learn requesting IP and browser details.
- **Data safeguards:** Unknown fee fields stay null; every listing identifies limited source-verification scope and last checked date. This is **not** a full issuer-agreement audit or a complete 28-image release.
- **Affected:** `catalog/cards`, `docs/data/cards.json`, `scripts/catalog.mjs`, `docs/assets`, `docs/index.html`, `docs/dashboard`, README, Editorial, and visual asset policy.
- **Verification:** Both frontend scripts parse; generated catalog contains 28 unique real cards across ten issuers and nine issuer art URLs. Compiler consistency and live browser network/keyboard tests remain release gates. Selected card terms need independent source review before declaring production ready.

## 2026-10-27  -  Extended banking product model and dashboard prototype

- **Changed:** Proposed versioned modular product model for credit cards, checking, savings and relationship programs; separately tracked public, relationship-gated and invite-only access types.
- **Why:** Expand research coverage without making unverifiable elite-access, rewards or fee claims; retain a lightweight statically hosted backend.
- **Frontend:** Added separate privacy-first client-side card dashboard, a link from the homepage, working legacy-data filters (rewards, categories, descriptors, annual-fee ceiling), neutral sorting and factual comparison. Advanced filters are visibly disabled until reviewed terms exist.
- **Research:** Added a ten-institution official-source register and preliminary verified examples for overdraft policies and wealth-tier rewards. This is **not** a completed bank-by-bank product audit.
- **Privacy and scope:** No visitor accounts, quizzes, stored preferences or banking data integrations. Six existing fictional demo records remain the only dashboard dataset.
- **Affected:** `docs/index.html`, `docs/dashboard/`, `project/CATALOG-V2.md`, `project/TOP10-RESEARCH.md`, `project/DASHBOARD.md`, `project/DECISIONS-V2.md`, `README.md`, `CHANGELOG.md`.
- **Verification:** Source links and product constraints reviewed; static dashboard still requires manual interactive/browser/keyboard testing before merge. No production or deployment settings changed.
- **Next:** Verify individual issuer agreements and add real records; complete browser QA and decide when to adopt schema v2.

## 2026-10-27  -  Public repository README refresh

- **Changed:** Rewrote the README as a visitor- and contributor-friendly explanation of AnCard's mission, motivation, user-controlled discovery, plain-English financial literacy, independence, and privacy commitments.
- **Why:** With the repository public, newcomers should immediately understand what AnCard aims to achieve before reading developer setup instructions.
- **Clarity:** Distinguished future non-tracking advertising/donations from implemented funding; explained hosting log limitations, fictional example cards, non-advisory nature of content, and editorial work needed before publishing verified offers.
- **Affected:** `README.md`, `CHANGELOG.md`. No runtime site or card records changed.
- **Verified:** Confirmed repository is public and README content aligns with `project/PRODUCT.md`, `project/DECISIONS.md` and `project/EDITORIAL.md`.
- **Next:** Check GitHub Pages publishing configuration, run mobile/browser accessibility tests, and verify a starter collection of actual issuer cards.

## 2026-10-27  -  MVP website foundation (0.1.0)

- **Changed:** Implemented the dark "Clear Atlas" direction: soft blue highlights, muted mint trust markers, charcoal surfaces, responsive filter sidebar and card directory.
- **Why:** The product prioritizes clear comparison and educational tone, rather than promotional recommendations.
- **Catalog:** Added an individual-record JSON card catalog with a dependency-free Node compiler and publishing validation. Six conspicuously fictional demo entries power the UI. Status lifecycle: `draft` → `review` → `published` → `archived`; `demo` reserved for illustrations.
- **Visitor experience:** Added mandatory in-memory trust acknowledgment; filter chips and sidebar checkboxes; neutral sort options; plain-language decoder; modal card details; comparison of up to three selections; static methodology, privacy and important notices.
- **Privacy:** No cookies, local/session storage, tracking scripts, login, quiz or submissions. Explicitly disclosed that GitHub Pages logs IP addresses for security purposes. No third-party images or fonts.
- **Hosting:** Placed public output in `docs/` for GitHub Pages branch-folder hosting. Production deployment requires repository visibility/Pages configuration and a reviewed merge.
- **Affected:** `docs/`, `catalog/cards/`, `scripts/catalog.mjs`, `package.json`, `README.md`, `project/`.
- **Verified:** `npm run build` and `npm test`. Browser regression tests and public Pages activation to be recorded once completed.
- **Next:** Verify real issuer products and replace demo records, expand term disclosures, and complete accessibility / browser QA before declaring the site production-ready.

## 2026-10-27  -  Product direction clarified (1.1 requirements)

- **Changed:** Removed quiz/recommendation engine in favor of self-directed category filters: cash back, points, travel, groceries, online spending, lifestyle, secured, student, and annual fees.
- **Why:** Preserve consumer agency; avoid implied suitability advice and undisclosed recommendation pressure.
- **Decision:** No user profiles, saved search histories, card affiliate application tracking or hidden match scores.

## 2026-10-27  -  Product vision baseline (1.0 requirements)

- **Defined:** Independent credit-card literacy, radical transparency, factual sourcing, readable terms, and privacy-first operation.
- **MVP:** Trust gate, curated cards, plain-English decoder, filter-first catalog and governance pages. No accounts, bureau pulls, community forum or user reviews.
