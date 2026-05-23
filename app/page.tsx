'use client';

import Navbar from '@/src/components/Navbar';
import Hero from '@/src/sections/Hero';
import TrustedByStrip from '@/src/sections/TrustedByStrip';
import ProblemSection from '@/src/sections/ProblemSection';
import AppSection from '@/src/sections/AppSection';
import HowItWorksSection from '@/src/sections/HowItWorksSection';
import DownloadSection from '@/src/sections/DownloadSection';
import FinalCta from '@/src/sections/FinalCta';
import FaqSection from '@/src/sections/FaqSection';
import Footer from '@/src/components/Footer';

/**
 * Landing composition. 2026-05-22 design-template restructure: the
 * homepage now mirrors the founder's design ref one-to-one
 * (/tmp/disrupt-onboarding/website.html). Sections that did not exist
 * in that template were dropped per the founder's brief.
 *
 *   removed: LocalFirst (problem/solution two-column),
 *            Channels (iMessage check-in channels grid),
 *            DemoVideo (90-second demo video, explicitly removed),
 *            Comparison (3-column mechanism table),
 *            Pricing tiles (homepage pricing grid),
 *            old FAQ accordion
 *
 *   added:   ProblemSection (3-card DRIFT / FOG / SILENCE grid),
 *            HowItWorksSection (5-step hairline grid: commit → stake
 *            → upload proof → build reputation → or redistribute),
 *            MarketSection (rows + ASCII bar chart),
 *            FaqSection (numbered Q · 01 grid)
 *
 *   kept:    Hero (CLI terminal mock), FinalCta (manifesto closer),
 *            Footer, Navbar, /blog routes, /pricing standalone page
 *
 * The site-wide dotted-grid backdrop renders behind every section
 * via the fixed-position .bg-grid-dots element from globals.css.
 */
export default function Home() {
  return (
    <div className="relative w-full bg-background min-h-screen text-foreground">
      <div className="bg-grid-dots" aria-hidden="true" />
      <Navbar currentPage="home" />
      <main className="relative z-10">
        <Hero />
        <TrustedByStrip />
        <ProblemSection />
        <AppSection />
        <HowItWorksSection />
        <DownloadSection />
        <FinalCta />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}
