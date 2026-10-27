# Architecture and Product Decision Log

## ADR-001 — Static-first GitHub Pages deployment — 2026-10-27

**Decision:** Use plain HTML, CSS, JavaScript and GitHub Pages with a `docs/` publishing folder. **Why:** Minimizes cost, maintenance and visitor-data exposure; no server requests for personal filter choices. **Tradeoff:** No built-in server-side admin portal or on-demand card database queries. **Future:** Consider a tiny API such as Hono only after a concrete server-side requirement emerges.

## ADR-002 — Card-as-file catalog — 2026-10-27

**Decision:** One JSON record per card under `catalog/cards/`; compile into `docs/data/cards.json` with a dependency-free Node script. **Why:** Addition, retirement and history are each simple Git operations. **Tradeoff:** Content editorial work uses PRs; future nontechnical editing may merit a CMS. **Safeguards:** Validate allowed categories, required text, no duplicates, verified published issuer source/verification date; demo cards cannot claim issuer verification.

## ADR-003 — Explicit user control, never hidden recommendation — 2026-10-27

**Decision:** Combined filters match any selected option within a facet group and every selected facet group across groups; sorts use clear fields such as name, issuer and annual fee. No suitability quiz, recommendation score or promoted ranking. **Why:** Agency and transparent behavior outweigh conversion optimization.

## ADR-004 — Soft-dark hybrid visual direction — 2026-10-27

**Decision:** Adapt the filter-first structure of "Clear Ledger" with the plain, friendly tone of "Card Atlas," using charcoal navy, restrained blue and muted mint. **Why:** Dense enough for comparison but accessible and non-salesy. **Guidelines:** responsive, generous spacing, readable text contrast, keyboard focus visible, no external web fonts.

## ADR-005 — Acknowledgment without tracking — 2026-10-27

**Decision:** Display a disclosure at every page load, store acknowledgment only in JavaScript page memory, and do not create a behavioral or consent profile. **Why:** Conforms to the approved mandatory trust gate without cookies. **Tradeoff:** Repeated acknowledgment can create friction; re-evaluate through privacy-preserving accessibility review.
