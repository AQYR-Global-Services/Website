import type { Metadata } from "next";

// Set this to the final public domain when the domain is connected.
export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || "https://website-demo-blush-beta.vercel.app",
).origin;
export const brandName = "AQYR Global Services";
export const organizationDescription =
  "AQYR Global Services is a subsidiary of AQYR, providing Australian visa, employer sponsorship and workforce support for businesses and individuals.";
export const shareImage = {
  url: `${siteUrl}/share-cover.png`,
  width: 1200,
  height: 630,
  alt: "AQYR Global Services company logo",
  type: "image/png",
};
export const pages = {
  "points-calculator": { fileName: "points-calculator.html", title: "189 / 190 / 491 Points Calculator · All States & Territories", description: "Estimate 189, 190 or state-nominated 491 points across Australia, with regional requirements, separate 190 nomination guidance, Victorian VPT and English test standards." },
  about: { fileName: "about.html", title: "About Our Visa & Workforce Advisory Company", description: "Meet AQYR Global Services, a subsidiary of AQYR with service roots in Prince Migration and Hiremii Global Services, supporting Australian visas and workforce matters." },
  employers: { fileName: "employers.html", title: "Global Talent Mobility & Employer Compliance", description: "Australian talent mobility, employer sponsorship compliance and policy-informed workforce planning, including 482, 186 and local HR coordination." },
  "visa-services": { fileName: "visa-services.html", title: "Australian Visa Services for Individuals", description: "Visitor, student, skilled migration and partner visa support, with practical preparation guidance, skills assessments and education-to-career planning." },
  "employer-sponsorship": { fileName: "employer-sponsorship.html", title: "Employer Sponsorship & Nomination Support for Businesses", description: "482 and 186 sponsorship support for Australian employers. Review business and role evidence, coordinate nominations and applicant preparation, and plan ongoing sponsorship responsibilities." },
  "sponsored-visas": { fileName: "sponsored-visas.html", title: "482 & 186 Employer-Sponsored Visa Support for Individuals", description: "Employer-sponsored visa support for individuals, with or without an identified employer. Review work history, skills assessments, English evidence and 482 or 186 pathway preparation." },
  "labour-agreements": { fileName: "labour-agreements.html", title: "Labour Agreement Support for Employers", description: "Labour agreement assessment, request preparation and ongoing support for employers. Explore company-specific, industry and DAMA arrangements, with 482, 186 and 494 pathways." },
  approach: { fileName: "approach.html", title: "Our Visa & Sponsorship Support Process", description: "How we support visa and employer sponsorship matters: initial assessment, an agreed service scope, document preparation and ongoing communication." },
  "case-studies": { fileName: "case-studies.html", title: "Visa Case Experience · 482, 186, 858 & 600", description: "Selected employer-sponsored, National Innovation and visitor visa cases, with redacted approval documents. Explore 482, 186, 858 and 600 case experience." },
  team: { fileName: "team.html", title: "Visa & Workforce Advisory Team", description: "Meet the migration, legal support and client service team at AQYR Global Services, a subsidiary of AQYR." },
  contact: { fileName: "contact.html", title: "Contact Our Visa & Workforce Team", description: "Contact our Melbourne, Perth or Shanghai team about Australian visas, 482 and 186 employer sponsorship, recruitment and complex visa matters." },
  privacy: { fileName: "privacy.html", title: "Privacy Policy", description: "How AQYR Global Services handles information when you visit our website or contact our team." },
  terms: { fileName: "terms.html", title: "Terms of Use", description: "Terms for using the AQYR Global Services website, including information, enquiries and professional services." },
} as const;
export type PageSlug = keyof typeof pages;
export function pageMetadata(title: string, description: string, pathname: string): Metadata {
  const fullTitle = `${brandName} — ${title}`;
  return {
    title: { absolute: fullTitle }, description,
    alternates: { canonical: `${siteUrl}${pathname}` },
    openGraph: { type: "website", siteName: brandName, title: brandName, description,
      url: `${siteUrl}${pathname}`, locale: "en_AU", images: [shareImage] },
    twitter: { card: "summary_large_image", title: brandName, description,
      images: [{ url: shareImage.url, alt: shareImage.alt }] },
  };
}
