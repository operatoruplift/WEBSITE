'use client';

import Navbar from '@/src/components/Navbar';
import Hero from '@/src/sections/Hero';
import LocalFirst from '@/src/sections/LocalFirst';
import DemoVideo from '@/src/sections/DemoVideo';
import Comparison from '@/src/sections/Comparison';
import UseCases from '@/src/sections/UseCases';
import Pricing from '@/src/sections/Pricing';
import FAQ from '@/src/sections/FAQ';
import Footer from '@/src/components/Footer';

/**
 * Landing composition. April 30 2026 second-pass added LocalFirst
 * directly after the Hero so the trust substance (where data lives,
 * BYOK, signed receipts) reads as soon as the user scrolls, before
 * the demo video. The earlier ordering put DemoVideo first and left
 * "what is this thing actually doing with my data" as a question.
 *
 * Order:
 *   Hero        , short headline + two CTAs
 *   LocalFirst  , 4-step flow + provider strip + trust grid
 *   DemoVideo   , 90 s recording
 *   Comparison  , vs. ChatGPT / Claude / Gemini / Grok
 *   UseCases    , concrete jobs the agent does
 *   Pricing     , Free / Pro / Teams
 *   FAQ         , objection handling
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
        <LocalFirst />
        <DemoVideo />
        <Comparison />
        <UseCases />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
