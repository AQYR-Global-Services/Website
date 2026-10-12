import { brandName, organizationDescription, siteUrl } from "./site";

// These identifiers and office details mirror the public company/contact pages.
// The MARN belongs to the individual agent, not to the company or parent brand.
const organizationId = `${siteUrl}/#organization`;
const agentId = `${siteUrl}/#yuan-leon-gao`;
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
    address: melbourneAddress,
    telephone: "+61 430 907 019",
  },
  {
    "@type": "Place",
    "@id": `${siteUrl}/#perth-office`,
    name: `${brandName} — Perth office`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Level 1 / 251 St Georges Terrace",
      addressLocality: "Perth",
      addressRegion: "WA",
      postalCode: "6000",
      addressCountry: "AU",
    },
    telephone: "+61 3 9415 4000",
  },
  {
    "@type": "Place",
    "@id": `${siteUrl}/#shanghai-office`,
    name: `${brandName} — Shanghai office`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Room 807A, Building B, Zhongshan SOHO, No. 1065 Zhongshan West Road",
      addressLocality: "Changning District",
      addressRegion: "Shanghai",
      addressCountry: "CN",
    },
    telephone: "+86 137 6139 5387",
  },
];

export const siteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: brandName,
      legalName: "HIREMII GLOBAL SERVICES PTY LTD",
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
      sameAs: ["https://abr.business.gov.au/ABN/View?abn=23619566040"],
      address: melbourneAddress,
      location: offices.map((office) => ({ "@id": office["@id"] })),
      employee: { "@id": agentId },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "Client enquiries",
        email: "info@hiremiiglobal.com",
        telephone: "+61 430 907 019",
      },
      parentOrganization: {
        "@type": "Organization",
        "@id": "https://aqyr.ai/#organization",
        name: "AQYR",
        url: "https://aqyr.ai",
      },
    },
    {
      "@type": "Person",
      "@id": agentId,
      name: "Yuan Gao",
      alternateName: "Leon Gao",
      jobTitle: "Executive Director / Registered Migration Agent",
      worksFor: { "@id": organizationId },
      identifier: { "@type": "PropertyValue", propertyID: "MARN", value: "1793302" },
      sameAs: [registerUrl],
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
