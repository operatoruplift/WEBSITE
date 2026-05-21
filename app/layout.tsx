import type { Metadata, Viewport } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";

export const viewport: Viewport = {
  themeColor: '#F97316',
  // Marketing surfaces use the light palette (PR #309) and the
  // dashboard keeps a dark palette via its own data-theme opt-in,
  // so advertise both to the UA. Forms, scrollbars, and selection
  // chrome adapt to whichever wrapper is active.
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.operatoruplift.com"),
  // The template appends " | Operator Uplift" onto every per-route
  // title that returns a string (e.g. /pricing's "Pricing for teams"
  // becomes "Pricing for teams | Operator Uplift"). The homepage and
  // any sub-page that doesn't set its own title fall back to
  // `default`. PR #367 introduced the per-route metadata layouts;
  // this template ensures their titles still carry the brand for
  // search results and social previews.
  title: {
    default: "Operator Uplift, gamify your growth with AI",
    template: "%s | Operator Uplift",
  },
  description: "Keep your word. Bet on yourself. AI-powered personal development for Gen Z and Millennials. Set a goal, the AI breaks it into a step-by-step questline, you show up daily, and a community keeps you coming back.",
  keywords: ["personal development", "habit tracker", "goal setting", "accountability", "AI coach", "gamified learning", "AI personal development", "habit app", "behavioral AI", "productivity coach"],
  openGraph: {
    title: "Operator Uplift, gamify your growth with AI",
    description: "Keep your word. Bet on yourself. AI-powered personal development that turns ambition into action with commitments, check-ins, visible progress, and a community that keeps you coming back.",
    url: "https://www.operatoruplift.com",
    siteName: "Operator Uplift",
    locale: "en_US",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Operator Uplift, gamify your growth with AI" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Operator Uplift, gamify your growth with AI",
    description: "Keep your word. Bet on yourself. AI-powered personal development that turns ambition into action.",
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
                  "applicationCategory": "LifestyleApplication",
                  "operatingSystem": "Web",
                  "browserRequirements": "Requires a modern browser",
                  "description": "AI-powered personal development for Gen Z and Millennials. Keep your word, bet on yourself. Turn your ambition into a daily habit with AI-built questlines, streaks, and a community that keeps you coming back.",
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
