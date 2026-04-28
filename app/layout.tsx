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
  title: "Operator Uplift, AI for your inbox and calendar",
  description: "An AI assistant that drafts your email, schedules your meetings, and sends your follow-ups. Approval before every action; signed receipt afterward.",
  keywords: ["AI assistant", "email AI", "calendar AI", "AI inbox", "AI scheduler", "private AI", "Gmail AI", "Google Calendar AI", "AI for productivity", "personal AI"],
  openGraph: {
    title: "Operator Uplift",
    description: "AI that drafts your email and schedules your meetings. Approval before every action; signed receipt afterward.",
    url: "https://www.operatoruplift.com",
    siteName: "Operator Uplift",
    locale: "en_US",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Operator Uplift, AI for your inbox and calendar" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Operator Uplift",
    description: "AI that drafts your email and schedules your meetings. Approval before every action; signed receipt afterward.",
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
                  "@type": "WebApplication",
                  "name": "Operator Uplift",
                  "applicationCategory": "ProductivityApplication",
                  "operatingSystem": "Web",
                  "browserRequirements": "Requires a modern browser",
                  "description": "AI assistant that drafts your email, schedules your meetings, and sends your follow-ups. Approval before every action; signed receipt afterward.",
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
