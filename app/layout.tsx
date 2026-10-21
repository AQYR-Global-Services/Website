import type { Metadata } from "next";
import Script from "next/script";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import "../style.css";
import { brandName, shareImage, siteUrl } from "@/lib/site";
import { siteStructuredData } from "@/lib/structured-data";

// Change the URL with the contents so returning visitors cannot reuse an older interaction script.
const interactionVersion = createHash("sha256")
  .update(readFileSync(resolve(process.cwd(), "public/script.js")))
  .digest("hex").slice(0, 12);

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  icons: {
    icon: { url: "/aqyr-favicon.png", type: "image/png", sizes: "192x192" },
    shortcut: "/favicon.ico",
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
        <Script src={`/script.js?v=${interactionVersion}`} strategy="afterInteractive" />
      </body>
    </html>
  );
}
