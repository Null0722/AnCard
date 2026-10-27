# AnCard — Show Card Art Privacy Pattern

Decision: **OFF by default** on both the directory and dashboard. The text badge and terms render without loading issuer-hosted imagery. In the version-controlled catalog, `imageFront` may include `url`, `sourcePage`, and `alt`. If null, no card image is sourced and the badge persists.

The opt-in checkbox clearly discloses: "Turning this on loads card images from external issuing banks or their CDN. Your IP address and browser request details may be sent to those servers." It creates image elements and assigns their `src` only after explicit user interaction. `referrerPolicy='no-referrer'` reduces referrer leakage; it does **not** hide the IP address or promise anonymity. When disabled, future image elements are removed from the page, but already-completed network requests cannot be undone. The choice is held **only in page memory**, never cookies, storage, URLs or analytics. Navigating or reloading resets it to Off. Turning it on does not modify financial filters or card ordering.

Initial direct issuer/CDN-hosted assets exist for three Capital One cards and three U.S. Bank cards; other issuers use text badges until exact, rights-reviewed image URLs are available. Broken or blocked URLs fall back to the badge. No third-party proxy or analytics service is used.

Before merging: test with browser network tab to confirm **zero issuer image requests before opt-in**, confirm network requests after opt-in, keyboard and screen-reader labeling, slow-network failure behavior, mobile layout, referrer suppression, and zero persistence. Also review reuse and hotlink policies and ensure issuer artwork is not presented as endorsement.
