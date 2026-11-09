import { brandName, organizationDescription, siteUrl, pages, chinesePages, homePages, pageTitle, type PageSlug } from "./site";
import { pageBreadcrumbs } from "./page-hierarchy.mjs";
import { localizedPath } from "../public/site-language.mjs";

export function pageStructuredData(slug: PageSlug | 'index', language: 'en' | 'zh') {
  const details = slug === 'index' ? homePages[language] : language === 'zh' ? chinesePages[slug] : pages[slug];
  const url = siteUrl + localizedPath(slug === 'index' ? '/' : '/' + slug, language);
  const trail = pageBreadcrumbs(slug);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage', '@id': url + '#webpage', url,
        name: pageTitle(details.title, slug === "index" ? "/" : "/" + slug), description: details.description,
        inLanguage: language === 'zh' ? 'zh-Hans' : 'en',
        isPartOf: { '@id': siteUrl + '/#website' },
        publisher: { '@id': siteUrl + '/#organization' },
        ...(trail.length ? { breadcrumb: { '@id': url + '#breadcrumb' } } : {}),
      },
      ...(trail.length ? [{
        '@type': 'BreadcrumbList', '@id': url + '#breadcrumb',
        itemListElement: trail.map((item, index) => ({
          '@type': 'ListItem', position: index + 1, name: item[language],
          item: siteUrl + localizedPath(item.path, language),
        })),
      }] : []),
    ],
  };
}

// These identifiers and office details mirror the public company/contact pages.
// The MARN belongs to the individual agent, not to the company or parent brand.
const organizationId = `${siteUrl}/#organization`;
const agentId = `${siteUrl}/#yuan-leon-gao`;
const belleAgentId = `${siteUrl}/#fengxiao-belle-zhang`;
const belleRegisterUrl =
  "https://portal.mara.gov.au/search-the-register-of-migration-agents/register-of-migration-agent-details/?ContactID=810913f1-166e-f111-ab0d-00224892f740";
const registerUrl =
  "https://portal.mara.gov.au/search-the-register-of-migration-agents/register-of-migration-agent-details/?ContactID=78f1ef82-d715-e711-9404-005056ab0eca";
const melbourneAddress = {
  "@type": "PostalAddress",
  streetAddress: "Office 121, Level 1 / 847 Whitehorse Road",
  addressLocality: "Box Hill",
  addressRegion: "VIC",
  postalCode: "3128",
  addressCountry: "AU",
};
const offices = [
  {
    "@type": "Place",
    "@id": `${siteUrl}/#melbourne-office`,
    name: `${brandName} — Melbourne office`,
    url: `${siteUrl}/contact#melbourne-office`,
    address: melbourneAddress,
    telephone: "+61 430 907 019",
  },
  {
    "@type": "Place",
    "@id": `${siteUrl}/#perth-office`,
    name: `${brandName} — Perth office`,
    url: `${siteUrl}/contact#perth-office`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Level 1 / 251 St Georges Terrace",
      addressLocality: "Perth",
      addressRegion: "WA",
      postalCode: "6000",
      addressCountry: "AU",
    },
    telephone: "+61 8 6263 7731",
  },
  {
    "@type": "Place",
    "@id": `${siteUrl}/#shanghai-office`,
    name: `${brandName} — Shanghai office`,
    url: `${siteUrl}/contact#shanghai-office`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Room 807A, Building B, Zhongshan SOHO, No. 1065 Zhongshan West Road",
      addressLocality: "Changning District",
      addressRegion: "Shanghai",
      addressCountry: "CN",
    },
  },
];

export const siteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: brandName,
      legalName: "AQYR GLOBAL SERVICES PTY LTD",
      alternateName: "Hiremii Global Services",
      url: siteUrl,
      description: organizationDescription,
      logo: `${siteUrl}/aqyr-logo.svg`,
      email: "info@hiremiiglobal.com",
      telephone: "+61 430 907 019",
      taxID: "23619566040",
      identifier: [
        { "@type": "PropertyValue", propertyID: "ABN", value: "23619566040" },
        { "@type": "PropertyValue", propertyID: "ACN", value: "619566040" },
      ],
      sameAs: [
        "https://abr.business.gov.au/ABN/View?abn=23619566040",
        "https://au.linkedin.com/company/aqyr-global-services",
        "https://www.facebook.com/profile.php?id=61595664925410",
      ],
      address: melbourneAddress,
      location: offices.map((office) => ({ "@id": office["@id"] })),
      employee: [{ "@id": agentId }, { "@id": belleAgentId }],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "Client enquiries",
        email: "info@hiremiiglobal.com",
        telephone: "+61 430 907 019",
      },
      parentOrganization: {
        "@type": "Corporation",
        "@id": "https://aqyr.ai/#organization",
        name: "AQYR Ltd",
        alternateName: "AQYR",
        tickerSymbol: "XASX AQ1",
        url: "https://aqyr.ai",
      },
    },
    {
      "@type": "Person",
      "@id": agentId,
      name: "Yuan Gao",
      alternateName: "Leon Gao",
      url: `${siteUrl}/team#leon-gao`,
      image: `${siteUrl}/team/leon-gao-480.webp`,
      jobTitle: "Executive Director / Registered Migration Agent",
      worksFor: { "@id": organizationId },
      identifier: { "@type": "PropertyValue", propertyID: "MARN", value: "1793302" },
      sameAs: [registerUrl],
    },
    {
      "@type": "Person",
      "@id": belleAgentId,
      name: "Fengxiao Zhang",
      alternateName: "Belle Zhang",
      url: `${siteUrl}/team#belle-zhang`,
      image: `${siteUrl}/team/belle-zhang-unified-480.webp`,
      jobTitle: "Senior Migration Operations Manager / Registered Migration Agent",
      worksFor: { "@id": organizationId },
      identifier: { "@type": "PropertyValue", propertyID: "MARN", value: "2619517" },
      sameAs: [belleRegisterUrl],
    },
    ...offices,
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: brandName,
      url: siteUrl,
      inLanguage: ["en", "zh-Hans"],
      publisher: { "@id": organizationId },
    },
  ],
};
