'use client';

import Navbar from '@/src/components/Navbar';
import Hero from '@/src/sections/Hero';
import ProblemStatement from '@/src/sections/ProblemStatement';
import Product from '@/src/sections/Product';
import StatsBar from '@/src/sections/StatsBar';
import MarketOpportunity from '@/src/sections/MarketOpportunity';
import Security from '@/src/sections/Security';
import DeveloperDocs from '@/src/sections/DeveloperDocs';
import TractionBar from '@/src/sections/TractionBar';
import DemoPreview from '@/src/sections/DemoPreview';
import Comparison from '@/src/sections/Comparison';
import SocialProof from '@/src/sections/SocialProof';
import FAQ from '@/src/sections/FAQ';
import BuildWithUs from '@/src/sections/BuildWithUs';
import Footer from '@/src/components/Footer';

export default function Home() {
  return (
    <div className="w-full bg-background">
      <Navbar currentPage="home" />
      <Hero />
      <ProblemStatement />
      <Product />
      <StatsBar />
      <MarketOpportunity />
      <Security />
      <Comparison />
      <DeveloperDocs />
      <TractionBar />
      <SocialProof />
      <DemoPreview />
      <FAQ />
      <BuildWithUs />
      <Footer />
    </div>
  );
}
