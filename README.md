# AnCard

**Know more. Choose for yourself.** AnCard is an independent, privacy-first credit-card literacy and navigation project. This repository contains a lightweight static website and its Git-versioned card catalog.

## MVP principles

- **User-directed discovery**: filters and factual sort controls, no matching quiz, ranking scores, or recommendations.
- **Plain-language terms**: explain card benefits, costs, restrictions and caveats without sales pressure.
- **No visitor profiles**: no accounts, analytics, cookies, browser storage, personal-data forms, or card application tracking. Filtering and comparisons run only in page memory.
- **Transparent source review**: real cards cannot publish without an official HTTPS issuer source and verification date.
- **Low overhead**: no JS framework, production server, package dependencies or database required.

**Current status:** functioning MVP preview with six clearly fictional sample cards. They are *not* real credit-card offers. Issuer-specific product entries will require editorial verification before publication.

## Run locally

Install Node.js 20 or later and Python 3, then:

```sh
npm run build
npm test
npm run preview
```

Open http://localhost:8080 in your browser. Use a local HTTP server because the catalog loads through `fetch()`; opening `index.html` using a `file://` URL is not supported.

## Update the card catalog

Each card is a separate file under `catalog/cards/<id>.json`.

1. Add, edit, or remove a file. Use a unique lowercase kebab-case `id` matching the filename.
2. Set `status` to `draft`, `review`, `demo`, `published`, or `archived`. Only `demo` and `published` entries are included in the generated public catalog.
3. Run `npm run build` to refresh `docs/data/cards.json`; commit both your card edit and the generated file.
4. Run `npm test`. Published records must have an official clean HTTPS issuer URL, actual non-fictional data, and a verification date.
5. Record the change in `CHANGELOG.md`, including any term verification or correction.

Do not use third-party referral or advertising query parameters in source URLs. See `project/EDITORIAL.md` for verification criteria and withdrawal procedures.

## GitHub Pages — no build server required

All public files are in `docs/`. To publish after reviewing and merging the PR:

1. If your account is on **GitHub Free**, the repository must be **public** for GitHub Pages. Inspect repository content for secrets or material you do not wish to make public *before* changing visibility. Alternatively, an eligible paid plan may support Pages on a private repository.
2. Go to **Settings → Pages → Build and deployment → Deploy from a branch**.
3. Select `main`, choose `/docs`, and save.
4. Once GitHub Pages completes deployment, the expected project site is `https://null0722.github.io/AnCard/`. This address is a target, not a confirmed live URL until deployment succeeds.

The `docs/.nojekyll` file disables Jekyll processing. No custom deployment Actions workflow is necessary. Note: GitHub Pages records visitors' IP addresses for security purposes; see the site's privacy statement.

## Project history

- `CHANGELOG.md` — human-readable Git notepad; every website change adds an entry.
- `project/PRODUCT.md` — vision, MVP boundaries, user journey and hosting assumptions.
- `project/DECISIONS.md` — architectural/product decisions with reasons and tradeoffs.
- `project/EDITORIAL.md` — data field rules, issuer verification, and publishing/archiving process.

For each change: update the log, run validation, include a focused commit message, and submit a PR before merging to `main`.
