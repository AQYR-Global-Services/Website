import { SiteDocument } from "@/components/SiteDocument";
export { metadata } from "@/components/SiteDocument";

export default function ChineseLayout({ children }: { children: React.ReactNode }) {
  return <SiteDocument language="zh">{children}</SiteDocument>;
}
