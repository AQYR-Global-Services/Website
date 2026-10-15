import { loadPageSource } from "@/lib/content-source.mjs";

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

export function LegacyPage({ fileName }: { fileName: LegacyPageName }) {
  const source = loadPageSource(fileName);
  const body = source.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1];

  if (!body) {
    throw new Error(`Could not find the page body in ${fileName}`);
  }

  const markup = body.replace(
    /<script\s+src=["']\/?script\.js["'][^>]*><\/script>/gi,
    "",
  );

  return <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: markup }} />;
}
