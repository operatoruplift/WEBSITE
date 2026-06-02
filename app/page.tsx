'use client';

import Navbar from '@/src/components/Navbar';
import Hero from '@/src/sections/Hero';
import ProblemSection from '@/src/sections/ProblemSection';
import AppSection from '@/src/sections/AppSection';
import HowItWorksSection from '@/src/sections/HowItWorksSection';
import WhySolanaSection from '@/src/sections/WhySolanaSection';
import QuotesGrid from '@/src/sections/QuotesGrid';
import ProofFeed from '@/src/sections/ProofFeed';
import DownloadSection from '@/src/sections/DownloadSection';
import FinalCta from '@/src/sections/FinalCta';
import FaqSection from '@/src/sections/FaqSection';
import Footer from '@/src/components/Footer';

export default function Home() {
  return (
    <div className="relative w-full bg-background min-h-screen text-foreground">
      <div className="bg-grid-dots" aria-hidden="true" />
      <Navbar currentPage="home" />
      <main className="relative z-10">
        <Hero />
        <ProblemSection />
        <AppSection />
        <HowItWorksSection />
        <WhySolanaSection />
        <QuotesGrid />
        <ProofFeed />
        <DownloadSection />
        <FinalCta />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}
