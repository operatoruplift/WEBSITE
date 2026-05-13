'use client';

import Navbar from '@/src/components/Navbar';
import Hero from '@/src/sections/Hero';
import HowItWorks from '@/src/sections/HowItWorks';
import LocalFirst from '@/src/sections/LocalFirst';
import Channels from '@/src/sections/Channels';
import DemoVideo from '@/src/sections/DemoVideo';
import Comparison from '@/src/sections/Comparison';
import UseCases from '@/src/sections/UseCases';
import Pricing from '@/src/sections/Pricing';
import FAQ from '@/src/sections/FAQ';
import FinalCta from '@/src/sections/FinalCta';
import Footer from '@/src/components/Footer';

/**
 * Landing composition. April 30 2026 second-pass added LocalFirst
 * directly after the Hero so the trust substance (where data lives,
 * BYOK, signed receipts) reads as soon as the user scrolls, before
 * the demo video. May 13 2026 inserted HowItWorks between Hero and
 * LocalFirst per user feedback referencing clawcage.hackyguru.com's
 * "Zero to sandbox in 10 seconds" pattern: a time-to-value walkthrough
 * lands before the trust narrative, then LocalFirst explains why each
 * step is trustworthy.
 *
 * Order:
 *   Hero        , short headline + two CTAs
 *   HowItWorks  , 4-step time-to-value walkthrough
 *   LocalFirst  , trust pillar (where data lives, BYOK, receipts)
 *   Channels    , iMessage shipping, Telegram + WhatsApp ready
 *   DemoVideo   , 90 s recording
 *   Comparison  , vs. niche agent peers
 *   UseCases    , concrete jobs the agent does
 *   Pricing     , Free / Pro / Custom Team
 *   FAQ         , objection handling
 *   FinalCta    , cream editorial closer (sully.ai-derived pattern)
 */
export default function Home() {
  return (
    <div className="theme-light w-full bg-background min-h-screen">
      <Navbar currentPage="home" />
      {/* Wrap content sections in <main> so the page exposes a proper
          landmark to assistive tech and "skip to main content" UX.
          The Hero, sections, and conversion blocks live inside;
          Navbar (already <nav>) and Footer (already <footer>) stay
          outside as their own landmarks. */}
      <main>
        <Hero />
        <HowItWorks />
        <LocalFirst />
        <Channels />
        <DemoVideo />
        <Comparison />
        <UseCases />
        <Pricing />
        <FAQ />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
