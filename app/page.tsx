'use client';

import Navbar from '@/src/components/Navbar';
import Hero from '@/src/sections/Hero';
import HowItWorksSection from '@/src/sections/HowItWorksSection';
import WhySection from '@/src/sections/WhySection';
import AppSection from '@/src/sections/AppSection';
import PricingSection from '@/src/sections/PricingSection';
import ProofSection from '@/src/sections/ProofSection';
import FaqSection from '@/src/sections/FaqSection';
import FinalCta from '@/src/sections/FinalCta';
import Footer from '@/src/components/Footer';

export default function Home() {
  return (
    <div className="relative w-full bg-background min-h-screen text-foreground">
      <div className="bg-grid-dots" aria-hidden="true" />
      <Navbar currentPage="home" />
      <main id="main" className="relative z-10">
        <Hero />
        <HowItWorksSection />
        <WhySection />
        <AppSection />
        <PricingSection />
        <ProofSection />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
