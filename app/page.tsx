'use client';

import Navbar from '@/src/components/Navbar';
import Hero from '@/src/sections/Hero';
import HowItWorks from '@/src/sections/HowItWorks';
import LocalFirst from '@/src/sections/LocalFirst';
import Channels from '@/src/sections/Channels';
import DemoVideo from '@/src/sections/DemoVideo';
import Comparison from '@/src/sections/Comparison';
import Pricing from '@/src/sections/Pricing';
import FAQ from '@/src/sections/FAQ';
import FinalCta from '@/src/sections/FinalCta';
import Footer from '@/src/components/Footer';

/**
 * Landing composition. 2026-05-22 dark redesign: removed the
 * `theme-light` wrapper so the homepage runs in the default dark
 * palette (#0A0A0A bg, orange primary, foreground white). Source
 * visual: /tmp/disrupt-onboarding/website.html. The dotted-grid
 * backdrop renders behind every section via .bg-grid-dots fixed
 * positioning.
 *
 * Order kept identical to the light-theme version so the v10
 * narrative (Hero -> protocol -> trust -> channels -> demo ->
 * comparison -> pricing -> faq -> closer) still flows the same
 * way; only the visual treatment flipped.
 */
export default function Home() {
  return (
    <div className="relative w-full bg-background min-h-screen text-foreground">
      {/* Site-wide dotted-grid backdrop. Fixed-position so it stays
          parallax-still as the user scrolls. The mask in globals.css
          fades the grid out toward the edges so it never reads as a
          hard pattern. */}
      <div className="bg-grid-dots" aria-hidden="true" />
      <Navbar currentPage="home" />
      <main className="relative z-10">
        <Hero />
        <HowItWorks />
        <LocalFirst />
        <Channels />
        <DemoVideo />
        <Comparison />
        <Pricing />
        <FAQ />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
