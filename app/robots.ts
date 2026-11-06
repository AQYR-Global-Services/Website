import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Preserve the site's existing automated-crawler restrictions, except Baidu's
// search crawler. Cloudflare Bot Preference Sync must stay off: its managed
// preamble previously disallowed Baiduspider despite Search being set to Allow.
// These preferences apply to the public website, not the separate CRM host.
const restrictedCrawlers = [
  "Amazonbot", "Applebot-Extended", "Bytespider", "CCBot", "ClaudeBot",
  "Diffbot", "Google-Extended", "GPTBot", "omgili", "anthropic-ai",
  "Claude-Web", "cohere-ai", "MistralAI-Training", "meta-externalagent",
  "GoogleOther", "PetalBot", "AwarioSmartBot", "AwarioRssBot",
  "Google-CloudVertexBot", "QualifiedBot", "Cotoyogi", "ICC-Crawler",
  "atlassian-bot", "FishBot", "BorderxBot", "NavuBot", "SemrushBot-SWA",
  "WARDBot", "magpie-crawler", "KimiBot", "CitibotSiteCrawler",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        other: { "Content-Signal": "search=yes,ai-train=no,use=reference" },
      },
      { userAgent: restrictedCrawlers, disallow: "/" },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
