'use client';

import Navbar from '@/src/components/Navbar';
import Hero from '@/src/sections/Hero';
import DemoVideo from '@/src/sections/DemoVideo';
import Comparison from '@/src/sections/Comparison';
import UseCases from '@/src/sections/UseCases';
import Pricing from '@/src/sections/Pricing';
import FAQ from '@/src/sections/FAQ';
import Footer from '@/src/components/Footer';

/**
 * Landing composition, second pass (April 30 2026): 8 → 6 sections.
 *
 * What survived:
 *   Hero        , one short headline + two CTAs
 *   DemoVideo   , 90 s recording. Still the fastest "show, don't tell"
 *   Comparison  , vs. Gemini Workspace / Copilot
 *   UseCases    , concrete jobs the agent does for the user
 *   Pricing     , single SKU
 *   FAQ         , objection handling (and where Security bullets now live)
 *
 * Cut in this pass:
 *   WhatBecomesReal (the "What's already live" three-card block) → the
 *      demo video shows the same proof in motion. The static cards
 *      duplicated the content and slowed the first-fold scroll.
 *   Security → Privy + Solana + RLS bullets moved into FAQ "How is
 *      this safe?" so a curious user can drill in, but a casual one
 *      isn't asked to read trust-marketing copy on the way to the demo.
 *
 * Pages /press-kit, /privacy, /security, /docs still exist, navbar
 * links survive for users who came looking for those specifically.
 */
export default function Home() {
  return (
    <div className="theme-light w-full bg-background min-h-screen">
      <Navbar currentPage="home" />
      <Hero />
      <DemoVideo />
      <Comparison />
      <UseCases />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
}
