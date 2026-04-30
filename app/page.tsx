'use client';

import Navbar from '@/src/components/Navbar';
import Hero from '@/src/sections/Hero';
import WhatBecomesReal from '@/src/sections/WhatBecomesReal';
import DemoVideo from '@/src/sections/DemoVideo';
import Comparison from '@/src/sections/Comparison';
import Security from '@/src/sections/Security';
import UseCases from '@/src/sections/UseCases';
import Pricing from '@/src/sections/Pricing';
import FAQ from '@/src/sections/FAQ';
import Footer from '@/src/components/Footer';

/**
 * Landing composition, trimmed April 30 2026 from 17 sections to 8.
 *
 * What survived (every block earns its scroll):
 *   Hero            , 5-second test (what + for whom + why safe) + CTAs
 *   WhatBecomesReal , three proof blocks (Gmail/Calendar, Approval, Receipt)
 *   DemoVideo       , 90 s recording from the Playwright harness
 *   Comparison      , vs. Gemini Workspace / Copilot
 *   Security        , Privy auth + Solana receipts + RLS
 *   UseCases        , concrete jobs the agent does for the user
 *   Pricing         , single SKU, no enterprise upsell on the consumer page
 *   FAQ             , objection handling
 *
 * What got cut (dense / repetitive on first visit):
 *   ProblemStatement → folds into Hero and the FAQ "why does this exist" Q
 *   Product (scrollytelling) → the demo video does this job in 90s
 *   Compliance       → folded into Security
 *   GoingLocal       → /docs/integrations is the canonical source
 *   CloudVsLocal     → folded into Comparison
 *   MarketOpportunity → investor-deck content, not consumer landing
 *   DeveloperDocs    → /docs is one click away in the navbar
 *   SocialProof      → empty pre-launch; bring back when there are quotes
 *   BuildWithUs      → recruiting CTA lives on /careers
 *
 * Sections still present on dedicated pages (Pricing, FAQ, etc. when
 * users navigate there from the navbar).
 */
export default function Home() {
  return (
    <div className="w-full bg-background">
      <Navbar currentPage="home" />
      <Hero />
      <WhatBecomesReal />
      <DemoVideo />
      <Comparison />
      <Security />
      <UseCases />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
}
