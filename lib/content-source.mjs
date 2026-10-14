import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Expand trusted local content fragments for both server pages and offline previews. */
export function loadPageSource(fileName, rootDirectory = process.cwd()) {
  if (!/^[a-z-]+\.html$/.test(fileName)) throw new Error("Invalid content filename");
  const source = readFileSync(resolve(rootDirectory, "content", fileName), "utf8");
  return source.replace(/<!-- include:([a-z-]+):([a-z0-9-]+) -->/g, (_, name, fragment) => {
    const shared = readFileSync(resolve(rootDirectory, "content", "partials", name + ".html"), "utf8");
    const start = "<!-- fragment:" + fragment + " -->";
    const from = shared.indexOf(start);
    const to = shared.indexOf("<!-- /fragment -->", from + start.length);
    if (from < 0 || to < 0) throw new Error("Missing content fragment: " + name + ":" + fragment);
    return shared.slice(from + start.length, to).trim();
  });
}
