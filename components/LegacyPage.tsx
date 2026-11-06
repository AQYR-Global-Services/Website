import { loadPageSource } from "@/lib/content-source.mjs";
import { localizeMarkup } from "@/lib/localized-content.mjs";
import { pageStructuredData } from "@/lib/structured-data";
import type { PageSlug } from "@/lib/site";

type LegacyPageName =
  | "index.html"
  | "about.html"
  | "employers.html"
  | "visa-services.html"
  | "points-calculator.html"
  | "employer-sponsorship.html"
  | "sponsored-visas.html"
  | "labour-agreements.html"
  | "approach.html"
  | "case-studies.html"
  | "team.html"
  | "contact.html"
  | "privacy.html"
  | "terms.html";

export function LegacyPage({ fileName, language = "en" }: { fileName: LegacyPageName; language?: "en" | "zh" }) {
  const source = loadPageSource(fileName);
  const body = source.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1];

  if (!body) {
    throw new Error(`Could not find the page body in ${fileName}`);
  }

  const markup = body.replace(
    /<script\s+src=["']\/?script\.js["'][^>]*><\/script>/gi,
    "",
  );

  const pathname = fileName === "index.html" ? "/" : "/" + fileName.replace(/\.html$/, "");
  const slug = fileName.replace(/\.html$/, '') as PageSlug | 'index';
  return <>
    <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: localizeMarkup(markup, language, pathname) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{
      __html: JSON.stringify(pageStructuredData(slug, language)).replace(/</g, "\\u003c"),
    }} />
  </>;
}
