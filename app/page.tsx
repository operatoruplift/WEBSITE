'use client';

import Navbar from '@/src/components/Navbar';
import Hero from '@/src/sections/Hero';
import ProblemSection from '@/src/sections/ProblemSection';
import AppSection from '@/src/sections/AppSection';
import PhaseScrollySection from '@/src/sections/PhaseScrollySection';
import DownloadSection from '@/src/sections/DownloadSection';
import FinalCta from '@/src/sections/FinalCta';
import Footer from '@/src/components/Footer';
// 2026-06-03 trim: removed FaqSection, WhySolanaSection, QuotesGrid,
// and ProofFeed from the homepage per founder direction. FAQ moves
// to /faq (linked from the footer). The other three retired surfaces
// were doing more visual work than conversion work and crowded the
// "join the waitlist" CTA. The page-wide CursorSpotlight effect now
// lives in app/layout.tsx so every route gets it.
export default function Home() {
  return (
    <div className="relative w-full bg-background min-h-screen text-foreground">
      <div className="bg-grid-dots" aria-hidden="true" />
      <Navbar currentPage="home" />
      <main id="main" className="relative z-10">
        <Hero />
        <ProblemSection />
        <AppSection />
        <PhaseScrollySection />
        <DownloadSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
