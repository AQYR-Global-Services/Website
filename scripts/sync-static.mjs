import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadPageSource } from "../lib/content-source.mjs";

// The deployed source is content/*.html. Root HTML files are local static previews.
const root = resolve(import.meta.dirname, "..");
const files = ["index", "about", "employers", "visa-services", "employer-sponsorship", "sponsored-visas", "labour-agreements", "approach",
  "case-studies", "team", "contact", "privacy", "terms", "points-calculator"];
for (const slug of files) {
  let source = loadPageSource(slug + ".html", root);
  source = source.replace(/href="\/(about|employers|visa-services|employer-sponsorship|sponsored-visas|labour-agreements|approach|case-studies|team|contact|privacy|terms|points-calculator)([?#][^"]*)?"/g,
    (_, page, suffix = "") => `href="${page}.html${suffix}"`);
  source = source.replace(/href="\/"/g, 'href="index.html"')
    .replace(/href="\/style.css"/g, 'href="style.css"')
    .replace(/href="\/aqyr-favicon.webp"/g, 'href="public/aqyr-favicon.webp"')
    .replace(/src="\/script.js"/g, 'src="script.js"')
    .replace(/src="\/(?!script.js)([^"]+)"/g, 'src="public/$1"');
  source = source.replace(/srcset="([^"]+)"/g, (_, candidates) =>
    `srcset="${candidates.replace(/(^|,\s*)\//g, '$1public/')}"`);
  await writeFile(resolve(root, slug + ".html"), source);
}
await writeFile(resolve(root, "script.js"), await readFile(resolve(root, "public", "script.js")));
console.log(`Updated ${files.length} static preview pages and their shared script.`);
