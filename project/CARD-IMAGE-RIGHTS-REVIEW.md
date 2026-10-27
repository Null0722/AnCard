# Bank card-art terms review

*Reviewed October 27, 2026. This review summarizes published terms; it is not a legal opinion or a grant of rights.*

## Conclusion

I did not find a general license permitting AnCard to display or hotlink authentic card-front art across the ten issuer banks. Copyright, trademark and website terms differ. Visitor opt-in to loading a third-party image controls a network disclosure, but **does not grant reproduction or display rights**. Therefore, AnCard is not enabling the existing nine issuer-hosted image URLs. The working illustration toggle is separate from the external-art consent gate. Issuer source links provide access to authentic photos on the banks' own websites.

## Official sources reviewed

| Issuer | Published terms or official source | Assessment for AnCard |
| --- | --- | --- |
| Chase | https://www.chase.com/digital/resources/terms-of-use | Website images generally require prior written consent for copying and public display. |
| Bank of America | https://bettermoneyhabits.bankofamerica.com/en/terms | Graphics and artwork are protected; general public/commercial reuse is not granted. Media assets at https://newsroom.bankofamerica.com/content/newsroom/journalist-resources/media-content-library/credit-card-media-assets.html are limited to qualified journalism, not a blanket catalog license. |
| Wells Fargo | https://www.wellsfargo.com/privacy-security/terms/ | Public/commercial display or reproduction requires written permission unless an exception applies. |
| Citi | https://alumni.citi.com/alumni/anon/faq/terms | Citi-published terms for this property restrict public and commercial reuse. This is not proof that all Citi properties have identical terms; no permission for consumer card fronts was identified. |
| U.S. Bank | https://www.usbank.com/caas/digital-services-agreement.html | Proprietary images and service marks are protected; personal-use access does not confer catalog display rights. |
| PNC | https://www.pnc.com/en/terms-and-conditions.html | Explicitly restricts reproduction and public display of images without prior written consent. |
| Truist | https://www.truist.com/terms-and-conditions | Restricts reproduction and redistribution without prior written consent. |
| Capital One | https://www.capitalone.com/digital/terms-conditions/ | Copyright and trademarks protected; use for commercial/public purposes requires prior written consent. |
| TD Bank | https://www.td.com/us/en/personal-banking/terms-of-use | Terms reference usage limitations and intellectual-property controls; no transferable license for AnCard's card-front imagery was found. |
| American Express | https://www.americanexpress.com/us/legal-disclosures/website-rules-and-regulations.html | Restricts public display and reproduction of protected images and branded card designs without permission. |

## Requirements before displaying actual cards

1. Obtain rights from the card-art copyright or trademark owner for AnCard's intended publication and, if relevant, commercial/contextual-ad use. Record covered images, permitted transformations, duration, territory, required attribution, and hotlinking allowance.
2. Link the documented rights evidence per asset (stored in a non-sensitive repository record). The code requires `imageFront.usageAuthorization = "written-permission"` and a valid HTTPS `imageFront.rightsEvidenceUrl` before the optional bank image can load.
3. Separately let the visitor opt in to an external image request. A browser request may disclose their IP address, user agent and other connection information. Use no-referrer where available and an original AnCard image on failure.
4. Do not imply endorsement or affiliation by the bank. Recheck permissions if assets or hosting terms change.

No automatically extracted images were uploaded by this change. Fair use and nominative trademark use can be fact-dependent; seek specialized legal review if attempting to rely on an exception rather than permission.
