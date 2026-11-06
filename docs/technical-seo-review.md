# Technical SEO, performance and accessibility — 6 November 2026

Scope: the 14 English and 14 Chinese public pages. CRM is outside this review.

## Changes

- Serve the existing Albert Sans and Rethink Sans fonts from the website instead of a render-blocking Google Fonts CSS import. Keep variable weights 400–700, Latin/Latin Extended coverage, `font-display: swap` and native Chinese fallback fonts. Source URLs, SHA-256 checksums and licenses are retained in `assets/font-sources.json` and `public/fonts/`.
- Deliver smaller lossless WebP copies of nine existing PNG partner logos, preserving original dimensions and visible pixels. Keep every original file. Total image payload reduction is 553,739 bytes across those assets; this is not a measured page-load time improvement. `node scripts/prepare-partner-media.mjs` reproduces the copies and updates the shared partner fragment/manifest.
- Make each page's main content programmatically focusable with `tabindex="-1"`. The existing skip link now moves keyboard focus to the main content as well as scrolling there; it does not add a normal Tab stop.

## Checks and limits

`node scripts/check-technical.mjs [base-url]` checks headings, duplicate IDs, skip targets, image alternatives/dimensions and form labels. It also verifies font binaries/checksums/licenses, built same-origin font delivery when a URL is supplied, and decoded logo pixels on light and dark backgrounds. Existing site, locale and partner checks cover canonical URLs, language alternates, sitemap, robots policy and partner controls.

Manual browser checks cover the skip-link focus and phone navigation (including Escape), English/Chinese layouts and horizontal overflow. These checks are not a WCAG conformance certification or a Lighthouse score. Real-user Core Web Vitals and Search Console indexing require separate field data; no ranking, speed score or indexing outcome is guaranteed by this change.

References:

- [Web.dev: font best practices](https://web.dev/articles/font-best-practices)
- [MDN: font-display](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/font-display)
- [Albert Sans source and license](https://github.com/google/fonts/tree/main/ofl/albertsans)
- [Rethink Sans source and license](https://github.com/google/fonts/tree/main/ofl/rethinksans)
