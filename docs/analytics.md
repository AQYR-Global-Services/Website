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
  This includes the corresponding `/zh` public routes, so Chinese visits keep
  their language path. Unknown paths are still replaced with `/`.
  Referrer is origin-only. No enquiry fields, score, salary, occupation or breakdown
  is included. This intentionally sacrifices campaign/query-level attribution.
- `generate_lead` is sent only after `/api/enquiries` returns HTTP success,
  `ok: true` and an opaque 64-character receipt following Resend acceptance.
  A click, invalid form, failed challenge, rate limit, transport failure or
  uncertain response never counts. This measures provider acceptance, not
  inbox placement, a staff reply, eligibility or a signed client.
- The event is sent through the existing consent-loaded Google tag to
  `G-DNQXKBP0ZC`, with only `form_id: website_enquiry` and the existing safe
  page location/referrer. Do not add a GTM event tag for this event: it would
  duplicate the direct gtag event. No extra Google tag/config is installed.
- The server signs the provider message ID with HMAC; the provider ID and
  submitted values are not returned. The receipt stays local to the tab and
  is never included in the analytics event. It prevents repeat events for
  provider-idempotent retries and tab reloads for 24 hours, capped at 100
  receipts. Blocked session storage falls back to in-memory deduplication;
  separate tabs/devices are not guaranteed to deduplicate.
- Consent must already be granted when the success is handled. Earlier
  successes are not queued or replayed after acceptance. Local/preview hosts
  never send events, and analytics loading/errors never block submission.
- Consent preference storage is independent of the URL-selected language.
  Offline HTML previews alone remember a language preference. Calculator language
  navigation uses a single-use, five-minute tab-storage handoff for scoring
  controls only; it never enters page-view payloads or contains free-text searches.
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

## Successful-enquiry verification and baseline (WEB-2)

Run `node scripts/check-analytics.mjs`, `node scripts/check-enquiry-api.mjs`
and `node scripts/check-enquiry.mjs`. These use fixtures and send no real mail.
After explicit production synchronization, verify a clearly identified internal
form submission with consent, one `generate_lead` in the correct GA4 property,
and no second event on an identical retry. Repeat with declined consent and
an invalid/blocked request and verify no success event. Keep automatic form
measurement off and mark `generate_lead` as a GA4 key event (once per event).
Do not call a button click a conversion or fabricate a backdated conversion baseline.

Capture GSC search clicks, impressions, CTR and average position, plus GA4 active
users, sessions, views and key events, for the same fixed completed 28-day period
and prior period. Record property/stream identity, timezone, extraction date,
filters, consent/ad-blocker limits and GSC latency. Separate internal tests from
business enquiries and avoid collecting personal enquiry contents. An unavailable
report is pending, never zero. Historical successful-enquiry figures are unavailable
before this release; begin the conversion baseline at verified live activation.

12 November 2026: implementation checks passed locally. Production receipt,
GA4 key-event configuration and dated real GSC/GA4 baseline remain unverified.
