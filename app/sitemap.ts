import type { MetadataRoute } from "next";
import { pages, siteUrl } from "@/lib/site";
import { localizedPath } from "../public/site-language.mjs";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", ...Object.keys(pages)].flatMap((slug) => {
    const en = `${siteUrl}/${slug}`;
    const zh = `${siteUrl}${localizedPath(`/${slug}`, "zh")}`;
    return [en, zh].map((url) => ({ url, alternates: { languages: { en, "zh-Hans": zh } } }));
  });
}
