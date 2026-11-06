import type { Metadata } from "next";
import { LegacyPage } from "@/components/LegacyPage";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
  "Australian Visa & Workforce Services",
  "Australian visa and workforce support for businesses and individuals, including 482 and 186 Direct Entry sponsorship, recruitment and other visa services.",
  "/",
);

export default function HomePage() {
  return <LegacyPage fileName="index.html" />;
}
