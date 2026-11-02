# Local owner review dashboard

Run from a trusted local checkout with Node.js 20 or newer:

```sh
node scripts/review-dashboard.mjs
```

Open the complete private link printed in the terminal. The server binds only to 127.0.0.1, uses a fresh session token, and stops with Ctrl+C. Do not share the link or run it on a shared or untrusted computer. It is a local tool, not a login-protected hosted service; other users or processes with access to your computer may be able to access it. The public repository and its review data remain public.

Search the queue, select a card, inspect every proposed field and source, and check the confirmation only after reviewing the current issuer disclosures and agreements. Approve saves only that card's `humanVerified` flag locally. It does not publish or make an independent factual assessment. A changed queue or mismatch with the source record blocks approval; run `npm run qc:sync` as needed and review again. Corrections belong in the canonical `catalog/cards/<id>.json` file; sync resets changed candidates for review.

After approvals, run `npm run build && npm test`. Review the changes and commit the queue and generated `docs/data/cards.json` and `catalog/REVIEW-SHEET.md` files. Follow the existing PR and GitHub Pages workflow in [HUMAN-QC.md](HUMAN-QC.md). Verify the Actions run and Pages deployment before assuming the live site has updated. This dashboard does not automatically commit, push, or deploy.
