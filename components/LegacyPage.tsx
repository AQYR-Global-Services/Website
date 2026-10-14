import { readFileSync } from "node:fs";
import path from "node:path";

type LegacyPageName =
  | "index.html"
  | "about.html"
  | "employers.html"
  | "visa-services.html"
  | "employer-sponsorship.html"
  | "labour-agreements.html"
  | "approach.html"
  | "case-studies.html"
  | "team.html"
  | "contact.html"
  | "privacy.html"
  | "terms.html";

export function LegacyPage({ fileName }: { fileName: LegacyPageName }) {
  const filePath = path.join(process.cwd(), "content", fileName);
  const source = readFileSync(filePath, "utf8");
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
