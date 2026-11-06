import type { Metadata } from "next";
import { localizedPath } from "../public/site-language.mjs";

// Set this to the final public domain when the domain is connected.
export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.hiremiiglobal.com",
).origin;
export const brandName = "AQYR Global Services";
export const organizationDescription =
  "AQYR Global Services is a subsidiary of AQYR Ltd (ASX:AQ1), providing Australian visa, employer sponsorship and workforce support for businesses and individuals.";
export const shareImage = {
  url: `${siteUrl}/share-cover.png`,
  width: 1200,
  height: 630,
  alt: "AQYR Global Services company logo",
  type: "image/png",
};
export const pages = {
  "points-calculator": { fileName: "points-calculator.html", title: "189 / 190 / 491 Points Calculator · All States & Territories", description: "Estimate 189, 190 or state-nominated 491 points across Australia, with regional requirements, separate 190 nomination guidance, Victorian VPT and English test standards." },
  about: { fileName: "about.html", title: "About Our Visa & Workforce Advisory Company", description: "Meet AQYR Global Services, a subsidiary of AQYR Ltd (ASX:AQ1), with service roots in Prince Migration and Hiremii Global Services." },
  employers: { fileName: "employers.html", title: "Global Talent Mobility & Employer Compliance", description: "Australian talent mobility, employer sponsorship compliance and policy-informed workforce planning, including 482, 186 and local HR coordination." },
  "visa-services": { fileName: "visa-services.html", title: "Australian Visa Services for Individuals", description: "Visitor, student, skilled migration and partner visa support, with practical preparation guidance, skills assessments and education-to-career planning." },
  "employer-sponsorship": { fileName: "employer-sponsorship.html", title: "Employer Sponsorship & Nomination Support for Businesses", description: "482 and 186 sponsorship support for Australian employers. Review business and role evidence, coordinate nominations and applicant preparation, and plan ongoing sponsorship responsibilities." },
  "sponsored-visas": { fileName: "sponsored-visas.html", title: "482 & 186 Employer-Sponsored Visa Support for Individuals", description: "Employer-sponsored visa support for individuals, with or without an identified employer. Review work history, skills assessments, English evidence and 482 or 186 pathway preparation." },
  "labour-agreements": { fileName: "labour-agreements.html", title: "Labour Agreement Support for Employers", description: "Labour agreement assessment, request preparation and ongoing support for employers. Explore company-specific, industry and DAMA arrangements, with 482, 186 and 494 pathways." },
  approach: { fileName: "approach.html", title: "Our Visa & Sponsorship Support Process", description: "How we support visa and employer sponsorship matters: initial assessment, an agreed service scope, document preparation and ongoing communication." },
  "case-studies": { fileName: "case-studies.html", title: "Visa Case Experience · 482, 186, 858 & 600", description: "Selected employer-sponsored, National Innovation and visitor visa cases, with redacted approval documents. Explore 482, 186, 858 and 600 case experience." },
  team: { fileName: "team.html", title: "Visa & Workforce Advisory Team", description: "Meet the migration, legal support and client service team at AQYR Global Services, a subsidiary of AQYR Ltd (ASX:AQ1)." },
  contact: { fileName: "contact.html", title: "Contact Our Visa & Workforce Team", description: "Contact our Melbourne, Perth or Shanghai team about Australian visas, 482 and 186 employer sponsorship, recruitment and complex visa matters." },
  privacy: { fileName: "privacy.html", title: "Privacy Policy", description: "How AQYR Global Services handles information when you visit our website or contact our team." },
  terms: { fileName: "terms.html", title: "Terms of Use", description: "Terms for using the AQYR Global Services website, including information, enquiries and professional services." },
} as const;
export type PageSlug = keyof typeof pages;
export const chinesePages: Record<PageSlug, { title: string; description: string }> = {
  "points-calculator": { title: "189／190／491 技术移民打分计算器 · 各州与领地", description: "自评澳洲 189、190 和 491 技术移民分数，查看各州与领地的提名路径、维州 VPT、英语标准及偏远地区要求。" },
  about: { title: "公司介绍与注册信息", description: "了解 AQYR Global Services 的团队、服务背景及公司注册信息。我们隶属于 AQYR Ltd（ASX:AQ1），服务承接 Prince Migration 与 Hiremii Global Services 的经验。" },
  employers: { title: "企业人才流动与用工支持", description: "为企业提供涉及澳洲的人才流动、雇主担保及用工规划支持，涵盖 482、186、岗位评估与本地人力资源协调。" },
  "visa-services": { title: "澳洲个人签证与职业支持", description: "提供旅游、学生、技术移民及配偶签证支持，以及职业评估、材料准备和学习至职业发展的路径规划。" },
  "employer-sponsorship": { title: "企业雇主担保与岗位提名支持", description: "协助澳洲雇主准备 482、186 担保与提名，核对企业和岗位材料、协调申请人准备，并规划持续的担保责任。" },
  "sponsored-visas": { title: "482 与 186 个人雇主担保签证支持", description: "为已有或尚未确定雇主的个人提供雇主担保签证支持，核对工作经历、职业评估、英语证明及 482、186 路径准备。" },
  "labour-agreements": { title: "企业劳工协议与 DAMA 支持", description: "协助企业评估和准备劳工协议，了解企业专属、行业及 DAMA 安排，以及相关 482、186、494 签证路径。" },
  approach: { title: "签证与雇主担保服务流程", description: "了解初步评估、确认服务范围、材料准备和持续沟通的服务流程，以及 AQYR Global Services 如何协助处理签证和雇主担保事宜。" },
  "case-studies": { title: "签证案例经验 · 482、186、858 与 600", description: "查看雇主担保、国家创新及访客签证的案例经验和已脱敏的批准文件，涵盖 482、186、858 和 600。" },
  team: { title: "移民与用工服务团队", description: "认识 AQYR Global Services 的移民、法律支持及客户服务团队。我们是 AQYR Ltd（ASX:AQ1）旗下企业。" },
  contact: { title: "联系签证与企业用工团队", description: "联系墨尔本、珀斯或上海团队，咨询澳洲签证、482 和 186 雇主担保、招聘及复杂签证事宜。" },
  privacy: { title: "隐私政策", description: "了解 AQYR Global Services 在您访问网站或联系团队时如何处理信息，以及访问统计的选择方式。" },
  terms: { title: "网站使用条款", description: "AQYR Global Services 网站的使用条款，涵盖网站信息、咨询及专业服务。" },
};
export function pageMetadata(title: string, description: string, pathname: string, language: "en" | "zh" = "en"): Metadata {
  const fullTitle = `${brandName} — ${title}`;
  const englishUrl = `${siteUrl}${localizedPath(pathname, "en")}`;
  const chineseUrl = `${siteUrl}${localizedPath(pathname, "zh")}`;
  const canonical = language === "zh" ? chineseUrl : englishUrl;
  return {
    title: { absolute: fullTitle }, description,
    alternates: { canonical, languages: { en: englishUrl, "zh-Hans": chineseUrl, "x-default": englishUrl } },
    openGraph: { type: "website", siteName: brandName, title: fullTitle, description,
      url: canonical, locale: language === "zh" ? "zh_CN" : "en_AU", alternateLocale: [language === "zh" ? "en_AU" : "zh_CN"], images: [shareImage] },
    twitter: { card: "summary_large_image", title: fullTitle, description,
      images: [{ url: shareImage.url, alt: shareImage.alt }] },
  };
}
