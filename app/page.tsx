'use client';

import Navbar from '@/src/components/Navbar';
import Hero from '@/src/sections/Hero';
import WhatBecomesReal from '@/src/sections/WhatBecomesReal';
import DemoVideo from '@/src/sections/DemoVideo';
import ProblemStatement from '@/src/sections/ProblemStatement';
import Product from '@/src/sections/Product';
import MarketOpportunity from '@/src/sections/MarketOpportunity';
import Security from '@/src/sections/Security';
import DeveloperDocs from '@/src/sections/DeveloperDocs';
import GoingLocal from '@/src/sections/GoingLocal';
import CloudVsLocal from '@/src/sections/CloudVsLocal';
import Comparison from '@/src/sections/Comparison';
import Compliance from '@/src/sections/Compliance';
import UseCases from '@/src/sections/UseCases';
import Pricing from '@/src/sections/Pricing';
import SocialProof from '@/src/sections/SocialProof';
import FAQ from '@/src/sections/FAQ';
import BuildWithUs from '@/src/sections/BuildWithUs';
import Footer from '@/src/components/Footer';

/**
 * Landing composition, trust-first consumer flow (April 2026 rewrite).
 *
 *   Hero                , 5-second test: what it does + for whom + why safe
 *   WhatBecomesReal     , three proof blocks (Gmail/Calendar, Approval, Receipt)
 *   DemoVideo           , 60 s recording from the Playwright harness
 *   ProblemStatement    , why this matters
 *   Product             , scrollytelling walk-through
 */
export default function Home() {
  return (
    <div className="w-full bg-background">
      <Navbar currentPage="home" />
      <Hero />
      <WhatBecomesReal />
      <DemoVideo />
      <ProblemStatement />
      <Product />
      <Comparison />
      <Security />
      <Compliance />
      <GoingLocal />
      <CloudVsLocal />
      <UseCases />
      <MarketOpportunity />
      <DeveloperDocs />
      <SocialProof />
      <Pricing />
      <FAQ />
      <BuildWithUs />
      <Footer />
    </div>
  );
}
