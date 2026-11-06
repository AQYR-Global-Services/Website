import type { Metadata } from "next";
import { LegacyPage } from "@/components/LegacyPage";
import { homePages, pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
  homePages.en.title,
  homePages.en.description,
  "/",
);

export default function HomePage() {
  return <LegacyPage fileName="index.html" />;
}
