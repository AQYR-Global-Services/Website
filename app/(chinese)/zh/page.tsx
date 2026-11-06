import { LegacyPage } from "@/components/LegacyPage";
import { homePages, pageMetadata } from "@/lib/site";

export const metadata = pageMetadata(homePages.zh.title, homePages.zh.description, "/", "zh");

export default function ChineseHomePage() {
  return <LegacyPage fileName="index.html" language="zh" />;
}
