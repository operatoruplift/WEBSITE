import type { Metadata, Viewport } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";

export const viewport: Viewport = {
  themeColor: '#F97316',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.operatoruplift.com"),
  title: "Operator Uplift, Your AI Operating System",
  description: "Multi-agent orchestration with on-device encryption. Run AI agents that use your calendar, email, and on-chain tools, governed by you, not a cloud.",
  keywords: ["AI agents", "agent orchestration", "local-first AI", "Solana AI", "encrypted agents", "multi-agent swarm", "AI OS", "agent marketplace", "on-device AI"],
  openGraph: {
    title: "Operator Uplift",
    description: "Multi-agent orchestration with on-device encryption. Calendar, email, and on-chain tools, governed by you.",
    url: "https://www.operatoruplift.com",
    siteName: "Operator Uplift",
    locale: "en_US",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Operator Uplift, Your AI Operating System" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Operator Uplift",
    description: "Multi-agent orchestration with on-device encryption. Calendar, email, and on-chain tools, governed by you.",
    creator: "@OperatorUplift",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  manifest: "/manifest.json",
  other: {
    "base:app_id": "69e244243bb010cd08cfdb7f",
  },
};

import Script from "next/script";
import { CookieConsent } from "@/src/components/CookieConsent";
import { PrivyWrapper } from "@/src/components/providers/PrivyWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="bg-background text-foreground font-sans">
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
              "@graph": [
                {
                  "@type": "Organization",
                  "name": "Operator Uplift",
                  "url": "https://operatoruplift.com",
                  "logo": "https://operatoruplift.com/logo.svg",
                  "founder": {
                    "@type": "Person",
                    "name": "Matt Sim"
                  },
                  "sameAs": [
                    "https://x.com/OperatorUplift",
                    "https://www.linkedin.com/company/operatoruplift",
                    "https://github.com/operatoruplift",
                    "https://discord.gg/eka7hqJcAY"
                  ]
                },
                {
                  "@type": "SoftwareApplication",
                  "name": "Operator Uplift",
                  "applicationCategory": "DeveloperApplication",
                  "operatingSystem": "Windows, macOS, Linux",
                  "description": "Local-first AI agent platform with secure, private memory. Build, deploy, and monetize autonomous agents, no cloud required.",
                  "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
                  }
                }
              ]
            }
          `}
        </Script>
        <PrivyWrapper>
          {children}
        </PrivyWrapper>
        <CookieConsent />
      </body>
    </html>
  );
}
