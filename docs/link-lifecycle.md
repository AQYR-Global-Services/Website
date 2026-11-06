# Current links and retired URLs

Reviewed 6 November 2026 against the current 28 public English/Chinese URLs and the Search Console historical 404 examples. Historical report counts are not a live crawl of this release; some examples are old WordPress date/author archives or wildcard patterns rather than current content pages.

## Confirmed replacement

`/about-us` permanently redirects to `/about` (Next.js 308). Both identify the company introduction. The existing trailing-slash and canonical-host normalization still applies. Do not generalize this mapping to child paths.

## Retired content

Old news articles, date archives, author archives and WordPress assets have no established like-for-like replacement in the current site. They retain a real 404 response. The pre-launch `/talent`, `/stories` and `/sponsorship` routes and offline `.html` preview aliases also remain 404.

The standalone global 404 provides English and Chinese home/service/calculator/contact links. It contains no unknown-URL echo, analytics runtime, automatic redirect or homepage canonical. Its metadata is `noindex, follow`. The global convention is enabled because the site has multiple language root layouts.

New permanent mappings should require an identified old page and a genuinely equivalent current destination. A current topic hub or calculator is not automatically a replacement for an old dated policy announcement.

## Verification

Run `node scripts/check-links.mjs <base-url>` against a built server or production. It checks all sitemap pages, current internal link/fragment destinations, case-image links, the exact permanent mapping, genuine bilingual 404 responses and their recovery links. Cloudflare's email-decoder URLs are recognized separately as runtime mail links, not content pages.

Manual browser checks cover keyboard navigation, a 320px layout, a recovery link into the Chinese service page and the old company-introduction redirect. Existing site/locale checks continue to validate the 28-page sitemap and retired route behavior.

Reference: [Google Search Central: crawling errors and custom 404 pages](https://developers.google.com/search/docs/crawling-indexing/troubleshoot-crawling-errors).
