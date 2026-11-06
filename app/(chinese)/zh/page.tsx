import { LegacyPage } from "@/components/LegacyPage";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("澳洲签证与企业用工服务", "AQYR Global Services 为企业和个人提供澳洲签证、482 与 186 雇主担保、招聘及用工相关支持。", "/", "zh");

export default function ChineseHomePage() {
  return <LegacyPage fileName="index.html" language="zh" />;
}
