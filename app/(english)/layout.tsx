import { SiteDocument } from "@/components/SiteDocument";
export { metadata } from "@/components/SiteDocument";

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return <SiteDocument language="en">{children}</SiteDocument>;
}
