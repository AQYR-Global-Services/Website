import type { Metadata } from "next";
import Script from "next/script";
import "../style.css";
import { brandName, shareImage, siteUrl } from "@/lib/site";
import { siteStructuredData } from "@/lib/structured-data";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  icons: {
    icon: { url: "/aqyr-favicon.webp", type: "image/webp", sizes: "any" },
    apple: "/aqyr-github-avatar.png",
  },
  title: {
    default: "AQYR Global Services",
    template: "AQYR Global Services — %s",
  },
  description:
    "Australian visa, employer sponsorship and workforce support from AQYR Global Services, a subsidiary of AQYR.",
  openGraph: { type: "website", siteName: brandName, title: brandName,
    url: siteUrl, locale: "en_AU", images: [shareImage] },
  twitter: { card: "summary_large_image", title: brandName,
    images: [{ url: shareImage.url, alt: shareImage.alt }] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-lang="en" suppressHydrationWarning>
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify(siteStructuredData).replace(/</g, "\\u003c"),
        }} />
        <Script src="/script.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
