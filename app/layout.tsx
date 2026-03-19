import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://operatoruplift.com"),
  title: "Operator Uplift - Your Life, Automated",
  description: "One App. Every Agent. All Yours. Local-first AI agents with secure, private memory. Build, deploy, and monetize autonomous agents on Solana — no cloud required.",
  keywords: ["Local AI", "Agent Platform", "Solana AI", "Private Memory", "Autonomous Agents", "Local Runtime", "Agent Marketplace", "AI OS", "Local-First"],
  openGraph: {
    title: "Operator Uplift - Your Life, Automated",
    description: "One App. Every Agent. All Yours. Local-first AI agents with secure, private memory — no cloud required.",
    url: "https://operatoruplift.com",
    siteName: "Operator Uplift",
    images: [
      {
        url: "/logo.svg",
        width: 1200,
        height: 630,
        alt: "Operator Uplift - Local-First AI OS",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Operator Uplift - Your Life, Automated",
    description: "One App. Every Agent. All Yours. Local-first AI agents with secure, private memory — no cloud required.",
    creator: "@OperatorUplift",
    images: ["/logo.svg"],
  },
  icons: {
    icon: "/logo.svg",
  },
  manifest: "/manifest.json",
};

import Script from "next/script";
import { CookieConsent } from "@/src/components/CookieConsent";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-white">
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-9VBF7HTRBJ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-9VBF7HTRBJ');
          `}
        </Script>
        <Script id="json-ld" type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Operator Uplift",
              "url": "https://operatoruplift.com",
              "logo": "https://operatoruplift.com/logo.svg",
              "sameAs": [
                "https://x.com/OperatorUplift",
                "https://www.linkedin.com/company/operatoruplift",
                "https://github.com/operatoruplift"
              ]
            }
          `}
        </Script>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
