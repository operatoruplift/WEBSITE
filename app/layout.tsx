import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Uplift - The First Local AI Agent Platform",
  description: "Millions of Agents. One Voice. Uplift is a secure, open-source platform for running autonomous AI agents locally. Connect them with your Agentic Vault for unlimited personal memory and collaboration.",
  keywords: ["AI Agents", "Local AI", "Open Source", "Agentic Vault", "Secure AI", "Autonomous Agents", "Uplift"],
  openGraph: {
    title: "Uplift - The First Local AI Agent Platform",
    description: "Millions of Agents. One Voice. Uplift is a secure, open-source platform for running autonomous AI agents locally.",
    url: "https://operatoruplift.com",
    siteName: "Uplift",
    images: [
      {
        url: "/logo.svg", // Recommended: Replace with a 1200x630 .png image
        width: 1200,
        height: 630,
        alt: "Uplift AI Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Uplift - The First Local AI Agent Platform",
    description: "Secure, local, open-source AI agents.",
    creator: "@OperatorUplift",
    images: ["/logo.svg"], // Recommended: Replace with a 1200x630 .png image
  },
  icons: {
    icon: "/logo.svg",
  },
};

import Script from "next/script";

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
              "name": "Uplift",
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
      </body>
    </html>
  );
}
