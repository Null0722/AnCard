# Artwork rights, licensing and privacy

## Current visual design

Every card uses an original AnCard illustration created with local CSS and JavaScript. It is not a reproduction of the card front, logo, or issuer brand design. Different hues and geometric patterns are not card-quality indicators.

## Conditions for using official issuer imagery

A publicly viewable file is not automatically licensed for reproduction. Previous issuer-linked image URLs remain in version control as references, but none has documented written permission to use the artwork. External image loading is therefore paused.

To enable a specific official image later, a reviewer must record imageFront.usageAuthorization as written-permission and provide imageFront.rightsEvidenceUrl as an HTTPS record of the granted usage rights. The visitor must separately opt in. Without BOTH conditions, the browser must display only the local original artwork.

If an authorized asset is enabled, the browser will request it from the external issuer/CDN and may disclose IP address, user agent and related request metadata. referrerPolicy=no-referrer limits the referring page URL but not other metadata. A failed request returns to local AnCard artwork. The toggle choice is never stored.

No artwork is claimed to be risk-free as a legal conclusion. Trademarks, endorsements, copyright, image licensing and hotlink terms still require appropriate authorization review.

## Interaction and accessibility

Cards flip inside their own border by mouse click, touch or keyboard-accessible button. The hidden face is inert and has aria-hidden=true so that invisible controls cannot be focused. Reduced-motion preferences disable flip animation. A card never navigates to a third party merely because its body is clicked.

## Manual release checks

Test keyboard Tab / Shift+Tab, flip and return, Escape for full decoder, narrow screens, screen reader names, filtering pending cards, comparison selections, browser network requests, external link referrer policy, and zero persistence.
