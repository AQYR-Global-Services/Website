import type { Metadata } from "next";
import { localizedPath } from "../public/site-language.mjs";

// Set this to the final public domain when the domain is connected.
export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.hiremiiglobal.com",
).origin;
export const brandName = "AQYR Global Services";
export const homePages = {
  en: { title: "Australian Visa & Workforce Services", description: "Australian visa and workforce support for businesses and individuals, including 482 and 186 Direct Entry sponsorship, recruitment and other visa services." },
  zh: { title: "澳洲签证与企业用工服务", description: "AQYR Global Services 为企业和个人提供澳洲签证、482 与 186 雇主担保、招聘及用工相关支持。" },
};
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
  "points-calculator": { fileName: "points-calculator.html", title: "189, 190 & 491 Points Calculator", description: "Estimate 189, 190 or state-nominated 491 points across Australia, with regional requirements, separate 190 nomination guidance, Victorian VPT and English test standards." },
  about: { fileName: "about.html", title: "About Our Company", description: "Meet AQYR Global Services, a subsidiary of AQYR Ltd (ASX:AQ1), with service roots in Prince Migration and Hiremii Global Services." },
  employers: { fileName: "employers.html", title: "Overseas Hiring & Workforce Support", description: "Support for Australian employers hiring overseas talent or transferring staff: role planning, visa coordination, sponsorship responsibilities and local HR preparation." },
  "visa-services": { fileName: "visa-services.html", title: "Australian Visas & Skills Assessments", description: "Advice and preparation for Australian visitor, student, skilled and partner visas, with skills assessment and 482/186 employer-sponsored pathway support." },
  "employer-sponsorship": { fileName: "employer-sponsorship.html", title: "482 & 186 Employer Sponsorship", description: "482 and 186 employer sponsorship support: business and role evidence, nomination preparation, applicant coordination and ongoing sponsor responsibilities." },
  "sponsored-visas": { fileName: "sponsored-visas.html", title: "482 & 186 Visas for Individuals", description: "482 and 186 visa support for individual applicants: review your employer situation, work history, skills assessment and English evidence, then plan your application." },
  "labour-agreements": { fileName: "labour-agreements.html", title: "Labour Agreements & DAMA", description: "Labour agreement and DAMA support for employers: assess company-specific, industry and regional options, prepare requests and coordinate nomination and visa stages." },
  approach: { fileName: "approach.html", title: "Visa & Sponsorship Support Process", description: "How we support visa and employer sponsorship matters: initial assessment, an agreed service scope, document preparation and ongoing communication." },
  "case-studies": { fileName: "case-studies.html", title: "482, 186, 858 & 600 Case Studies", description: "Selected employer-sponsored, National Innovation and visitor visa cases, with redacted approval documents. Explore 482, 186, 858 and 600 case experience." },
  team: { fileName: "team.html", title: "Migration & Workforce Team", description: "Meet the migration, legal support and client service team at AQYR Global Services, a subsidiary of AQYR Ltd (ASX:AQ1)." },
  contact: { fileName: "contact.html", title: "Contact Our Visa & Workforce Team", description: "Contact our Melbourne, Perth or Shanghai team about Australian visas, 482 and 186 employer sponsorship, recruitment and complex visa matters." },
  privacy: { fileName: "privacy.html", title: "Privacy Policy", description: "How AQYR Global Services handles information when you visit our website or contact our team." },
  terms: { fileName: "terms.html", title: "Terms of Use", description: "Terms for using the AQYR Global Services website, including information, enquiries and professional services." },
} as const;
export type PageSlug = keyof typeof pages;
export const chinesePages: Record<PageSlug, { title: string; description: string }> = {
  "points-calculator": { title: "189／190／491 技术移民打分计算器", description: "自评澳洲 189、190 和 491 技术移民分数，查看各州与领地的提名路径、维州 VPT、英语标准及偏远地区要求。" },
  about: { title: "公司介绍与注册信息", description: "了解 AQYR Global Services 的团队、服务背景及公司注册信息。我们隶属于 AQYR Ltd（ASX:AQ1），服务承接 Prince Migration 与 Hiremii Global Services 的经验。" },
  employers: { title: "企业海外招聘与澳洲用工支持", description: "协助企业从海外招聘人才或安排员工赴澳，梳理岗位需求、签证路径、雇主担保责任及澳洲本地人力资源准备。" },
  "visa-services": { title: "澳洲个人签证与职业评估支持", description: "提供澳洲旅游、学生、技术移民及配偶签证咨询与材料准备，协助职业评估和个人 482、186 雇主担保路径规划。" },
  "employer-sponsorship": { title: "482／186 企业雇主担保与提名支持", description: "为澳洲企业提供 482、186 雇主担保支持，核对企业经营与岗位材料、准备提名、协调申请人资料，并梳理持续担保责任。" },
  "sponsored-visas": { title: "482／186 个人雇主担保签证支持", description: "面向个人申请人的 482、186 雇主担保签证支持，结合雇主情况、工作经历、职业评估及英语证明，梳理路径与申请准备。" },
  "labour-agreements": { title: "企业劳工协议与 DAMA 支持", description: "协助企业评估企业专属、行业及 DAMA 劳工协议方向，准备协议申请，衔接相关提名、签证及持续义务。" },
  approach: { title: "签证与雇主担保服务流程", description: "了解初步评估、确认服务范围、材料准备和持续沟通的服务流程，以及 AQYR Global Services 如何协助处理签证和雇主担保事宜。" },
  "case-studies": { title: "签证案例经验 · 482、186、858 与 600", description: "查看雇主担保、国家创新及访客签证的案例经验和已脱敏的批准文件，涵盖 482、186、858 和 600。" },
  team: { title: "移民与用工服务团队", description: "认识 AQYR Global Services 的移民、法律支持及客户服务团队。我们是 AQYR Ltd（ASX:AQ1）旗下企业。" },
  contact: { title: "联系签证与企业用工团队", description: "联系墨尔本、珀斯或上海团队，咨询澳洲签证、482 和 186 雇主担保、招聘及复杂签证事宜。" },
  privacy: { title: "隐私政策", description: "了解 AQYR Global Services 在您访问网站或联系团队时如何处理信息，以及访问统计的选择方式。" },
  terms: { title: "网站使用条款", description: "AQYR Global Services 网站的使用条款，涵盖网站信息、咨询及专业服务。" },
};
export function pageTitle(title: string, pathname: string): string {
  return pathname === "/" ? `${brandName} — ${title}` : `${title} | ${brandName}`;
}

export function pageMetadata(title: string, description: string, pathname: string, language: "en" | "zh" = "en"): Metadata {
  const fullTitle = pageTitle(title, pathname);
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
