# GA4 via Google Tag Manager

Measurement ID: `G-DNQXKBP0ZC`. This is a public identifier, not a secret.
GTM web container: `GTM-WZ9XZFHL` (AQYR Global Services / www.hiremiiglobal.com).
The site loads only GTM, not a second direct gtag.js integration.

## Required before publishing

In GA4 Admin → Data streams → AQYR Website, turn **Enhanced measurement OFF**.
In GTM, add ONE native **Google tag** with tag ID `G-DNQXKBP0ZC` and trigger
**Initialization - All Pages**. Do not use Custom HTML for this tag. Preview,
verify, then publish the container. The site cannot create/publish tags through
the public container ID; an empty container does not send GA4 visits.

The Google tag sends one automatic page_view per full page load. Automatic form, outbound
link, site-search and browser-history measurements are intentionally not used;
do not enable them without a separate privacy review. The site code cannot change
that account-level switch. Do not add another direct GA4 snippet, a separate
page_view event tag, or an extra Google tag for the same measurement ID.

## Site behaviour

- GTM is loaded only after acceptance and only on HTTPS hiremiiglobal.com
  or www.hiremiiglobal.com. Local/preview visits do not send production analytics.
- Initial refusal causes no GA requests, cookies or consent-mode pings.
- Analytics consent expires after 180 days. Advertising consent always stays denied.
- Footer Analytics preferences allows withdrawal; it disables collection,
  removes first-party GA cookies and reloads to unload the tag.
- Page location is an allowlisted route, with no query string or fragment.
  Referrer is origin-only. No enquiry fields, score, salary, occupation or breakdown
  is included. This intentionally sacrifices campaign/query-level attribution.
- This is basic traffic measurement, not a successful enquiry/conversion tracker.
- Consent preference storage and language preference storage are independent.
- Before container bootstrap, the site queues consent defaults (all denied),
  analytics-only acceptance, and global Google tag settings for sanitised
  page_location, origin-only page_referrer, static page_title and disabled
  Google signals/advertising personalisation. Do not override these in GTM.
- No unconditional noscript iframe is installed: it would load GTM without a
  visitor's explicit analytics acceptance. With JavaScript disabled there is no
  analytics collection. This deliberate basic-consent setup loads later than
  the standard unconditional head/body snippet.
- GTM is a code execution system. Future tags must be reviewed separately for
  consent, data collection and third-party destinations; the banner is not blanket
  consent to advertising or session recording.

## Verification

Run `node scripts/check-analytics.mjs`. After deployment: accept on the production
site, check one page_view in browser network and GA4 Realtime, navigate to another
page, then withdraw and verify no further analytics requests. Confirm Enhanced
measurement is off before performing this live check. A local test does not prove
that Google has received production data. Ad blockers may prevent collection.
