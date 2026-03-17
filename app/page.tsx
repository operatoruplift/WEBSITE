'use client';

import Navbar from '@/src/components/Navbar';
import Hero from '@/src/sections/Hero';
import Product from '@/src/sections/Product';
import Security from '@/src/sections/Security';
import DeveloperDocs from '@/src/sections/DeveloperDocs';
import BuildWithUs from '@/src/sections/BuildWithUs';
import TractionBar from '@/src/sections/TractionBar';
import Footer from '@/src/components/Footer';

export default function Home() {
      return (
              <div className="w-full bg-background">
                    <Navbar currentPage="home" />
                    <Hero />
                    <Product />
                    <Security />
                    <DeveloperDocs />
                              <TractionBar />
                    <BuildWithUs />
                    <Footer />
              </div>
            );
}
