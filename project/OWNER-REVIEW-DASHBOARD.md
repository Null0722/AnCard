# AnCard editorial dashboard

The dashboard is a local application for reviewing, changing, and publishing card details without editing JSON by hand. It uses your GitHub checkout as the source of truth; it is not a hosted login system.

## First-time setup on Windows

1. Install [Node.js 20 or newer](https://nodejs.org/), [Git for Windows](https://git-scm.com/install/windows), and [GitHub Desktop](https://desktop.github.com/). Sign in to GitHub Desktop with the account that can push to `Null0722/AnCard`. Git for Windows provides the `git` command used by the dashboard; signing in to GitHub Desktop alone may not configure Git credentials for that command.
2. In GitHub Desktop, choose **File > Clone repository**, select `Null0722/AnCard`, and choose a folder on your computer. Use the `main` branch.
3. Open that folder in File Explorer and double-click **Open AnCard Dashboard.cmd**. Your browser should open automatically. If it does not, copy the complete address from the window into your browser.
4. Leave the dashboard window open while working. Close it or press Ctrl+C to stop the dashboard.

If you prefer PowerShell, navigate into the actual AnCard folder before running `node scripts/review-dashboard.mjs`. The message `Cannot find module ... scripts/review-dashboard.mjs` generally means PowerShell is in a different folder or the checkout has not received the dashboard files yet.

## Everyday workflow

1. Select a card from the library. Edit its details using the sections and watch the approximate public preview update as you type. Blank numeric values mean unknown, not zero. Open issuer sources and agreements to check every claim and condition.
2. Click **Save changes**. This validates the source record and saves the draft to your local checkout. If a previously approved card changes, approval is reset and generated public data is rebuilt to hide its unreviewed terms.
3. After checking all proposed details, tick the review confirmation and click **Approve this card**. The approval and regenerated public files remain local until publishing.
4. Click **Publish changes** and confirm. The dashboard checks that the local `main` branch matches GitHub, validates the project, commits only files changed by the dashboard, and pushes to `main`. Git Credential Manager may ask you to sign in on the first push. GitHub Pages and the existing publishing workflow may take a few minutes; check the [Actions page](https://github.com/Null0722/AnCard/actions) for the result. A successful Git push does not guarantee that Pages deployed successfully.

**Sync from GitHub** updates a clean local `main` branch. Restart the dashboard after syncing to load any application updates. If GitHub and your local branch have diverged or another tool has changed files, the dashboard stops and asks you to resolve the changes in GitHub Desktop. It never overwrites unrelated changes. If a push fails after a commit, sign in with GitHub Desktop and retry **Publish changes**; the dashboard retains the pending commit.

## Security and limitations

- The server listens only on `127.0.0.1` and uses a fresh private session link. Do not share the link, and use a trusted personal computer; other people or programs with access to that computer may be able to access the session.
- The **repository is public**. Draft card data and source records in GitHub are readable even when unapproved terms are hidden from the public website. Do not store secrets or private personal data in card records.
- The preview illustrates how approved details will appear; it is not a pixel-perfect copy of every page or a financial accuracy check. The owner must review issuer disclosures, restrictions, and dates before approval.
- The dashboard supports existing cards. Additions, deletions, complex schema changes and conflict resolution may still require GitHub Desktop or project maintenance.
- Publishing requires Git, a GitHub-authenticated `origin` remote pointing to this repository, a configured Git author, and permission to push to `main`. Branch protection and authentication can block a push; failures do not mean the live website was updated.
