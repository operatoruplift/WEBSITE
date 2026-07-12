import type { Metadata, Viewport } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Nunito, Baloo_2 } from 'next/font/google';
import "./globals.css";

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

const baloo2 = Baloo_2({
  subsets: ['latin'],
  variable: '--font-baloo2',
  weight: ['500', '600', '700', '800'],
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#F08A4C',
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
    default: "Operator Uplift, commitment infrastructure",
    template: "%s | Operator Uplift",
  },
  description: "Keep your word. Bet on yourself. Stake money on your commitments, upload proof, AI verifies follow-through. Commitment infrastructure for operators.",
  keywords: ["commitment infrastructure", "accountability protocol", "loss aversion", "habit stakes", "AI accountability", "on-chain commitments", "USDC stakes", "Solana accountability", "operator", "no-bullshit habits"],
  openGraph: {
    title: "Operator Uplift, commitment infrastructure",
    description: "Keep your word. Bet on yourself. We don't sell motivation, we sell consequences. Stake real money on your commitments. AI Game Master adjudicates. Settles on Solana.",
    url: "https://www.operatoruplift.com",
    siteName: "Operator Uplift",
    locale: "en_US",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Operator Uplift, commitment infrastructure" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Operator Uplift, commitment infrastructure",
    description: "Keep your word. Bet on yourself. We don't sell motivation, we sell consequences.",
    creator: "@OperatorUplift",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  manifest: "/manifest.json",
  // Self-referencing canonical for the root layout. Per-route layouts
  // that set their own alternates.canonical override this on /pricing,
  // /faq, etc. Without this, the rendered homepage HTML carried no
  // <link rel="canonical">, exposing the root URL to duplicate-URL
  // dilution (/, /?ref=..., bare host vs canonical host) when search
  // engines crawl tracked / fragment variants.
  alternates: {
    canonical: "/",
  },
  other: {
    "base:app_id": "69e244243bb010cd08cfdb7f",
  },
};

import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CookieConsent } from "@/src/components/CookieConsent";
import CursorSpotlight from "@/src/components/CursorSpotlight";

// 2026-06-03: PrivyWrapper no longer mounts at the root. The
// 367KB-brotli @privy-io/react-auth bundle + Solana wallet connectors
// were loading on every marketing page (homepage, /pricing, /docs,
// /blog, /faq, etc.) even though none of those pages call usePrivy.
// Privy now mounts on (auth)/layout.tsx and (dashboard)/layout.tsx,
// the only routes where its hooks are actually consumed. Audit
// finding: critical, single largest perf win on the homepage.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable} ${nunito.variable} ${baloo2.variable}`}>
      <head>
        {/* Anti-FOUC theme bootstrap. Runs before React hydrates so
            the .theme-light class is applied to <html> before first
            paint. Brand default flipped to LIGHT 2026-05-26 per founder
            direction: first-time visitors land on the light palette,
            and dark mode is an opt-in via the toggle in
            ThemeToggle.tsx. Stored preference still wins over the
            default on every subsequent visit. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='op-uplift-theme';var s=localStorage.getItem(k);var t=s==='light'||s==='dark'?s:'light';if(t==='light'){document.documentElement.classList.add('theme-light');}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.classList.add('theme-light');document.documentElement.dataset.theme='light';}})();`,
          }}
        />
      </head>
      <body className="bg-background text-foreground font-sans">
        {/* Google Analytics. strategy="lazyOnload" so gtag.js loads
            after the window 'load' event, dropping the
            auto-emitted <link rel="preload"> for gtag.js that
            afterInteractive injects and competes with first-paint
            resources. Analytics still records the page view because
            the inline init script also uses lazyOnload and runs
            after gtag.js is on the page. */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-9VBF7HTRBJ"
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
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
                  "url": "https://www.operatoruplift.com",
                  "logo": "https://www.operatoruplift.com/logo.svg",
                  "founder": {
                    "@type": "Person",
                    "name": "Matt Sim"
                  },
                  "sameAs": [
                    "https://x.com/OperatorUplift",
                    "https://www.linkedin.com/company/operatoruplift",
                    "https://discord.gg/eka7hqJcAY"
                  ]
                },
                {
                  "@type": "WebApplication",
                  "name": "Operator Uplift",
                  "applicationCategory": "LifestyleApplication",
                  "operatingSystem": "Web",
                  "browserRequirements": "Requires a modern browser",
                  "description": "Keep your word. Bet on yourself. Commitment infrastructure for operators. Stake real money on your commitments, get daily check-ins adjudicated by an AI Game Master, and settle on Solana when you keep or break your word.",
                  "offers": {
                    "@type": "AggregateOffer",
                    "priceCurrency": "USD",
                    "lowPrice": "0",
                    "highPrice": "24",
                    "offerCount": "3",
                    "description": "Free / Pro $8 / Circle $24 monthly tiers"
                  }
                }
              ]
            }
          `}
        </Script>
        {/* Global cursor spotlight. Fixed-position layer that sits
            behind every page surface and tracks the pointer with an
            orange radial gradient. Skipped on touch + reduced-motion. */}
        <CursorSpotlight />
        {children}
        <CookieConsent />
        {/* Vercel Web Analytics + Speed Insights. Privacy-preserving
            (no cookies, no PII, no cross-site fingerprinting) so they
            run before the cookie banner has a verdict. Vercel docs
            note both packages no-op when not deployed to Vercel, so
            local dev + non-Vercel previews stay silent. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
