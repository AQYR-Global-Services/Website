# Public website crawl policy

## Scope and source of truth

`app/robots.ts` controls the public website's crawling preferences. The public
sitemap contains the existing 14 routes. This is a crawl preference, not an
authentication or firewall rule, and it does not guarantee indexing or AI citation.

On 6 November 2026, Cloudflare AI Crawl Control showed Search and Agents set to
Allow, with the individual block switches off for Googlebot, BingBot, Baidu,
OAI-SearchBot, Claude-SearchBot and PerplexityBot. Training was Disallow and Bot
Preference Sync was enabled. However, its generated robots preamble contained
`User-agent: Baiduspider / Disallow: /`, contradicting the intended search access.

The source-managed policy preserves the previous crawler-specific exclusions
except Baiduspider and retains the existing Content Signal. The retained list is
a compatibility baseline, not a claim that every listed bot is training-only.
Review individual crawler purposes before making further changes. Search bots
such as OAI-SearchBot must not be confused with separately named training bots.

## Cloudflare configuration

After deploying and checking the source-managed policy:

- Turn off **Enable Bot Preference Sync** for hiremiiglobal.com so Cloudflare does
  not prepend a conflicting policy. Do not change Search, Agents or Training.
- Preserve WAF, DDoS protection, TLS, authentication, rate limits and individual
  crawler block settings. Do not add a user-agent-only security bypass.
- Check the custom domain response, not just the origin or local server. A future
  Cloudflare toggle can change the live robots file without a Git commit.
- If reverting to managed robots, review its generated crawler list first.

The separate `crm.hiremiiglobal.com/robots.txt` returned `User-agent: *` and
`Disallow: /` before the change. Verify this remains intact afterwards. Never add
CRM, case data, uploaded documents or authenticated URLs to the public sitemap.

## Verification and limitations

- Run the production build and `node scripts/check-site.mjs <base-url>`.
- Inspect the edge-served robots file: no managed preamble, public search access,
  retained exclusions and the production sitemap URL.
- Check the public sitemap and a public service page after the switch.
- Verify the CRM's independent disallow rule. Changing robots does not change
  its access controls.
- Cloudflare's seven-day overview had both allowed and unsuccessful requests
  for search crawlers. This alone does not identify the failing URLs or causes,
  prove crawler identities on the Free plan, or establish Google index coverage.
- Use Search Console URL Inspection and request-level logs for actual indexing
  diagnosis. Do not label an ordinary tool's 403 as a confirmed Googlebot failure.

References:

- https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/
- https://developers.cloudflare.com/ai-crawl-control/configuration/ai-crawl-control-with-waf/
- https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec
