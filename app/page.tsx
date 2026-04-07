'use client';

import Navbar from '@/src/components/Navbar';
import Hero from '@/src/sections/Hero';
import Product from '@/src/sections/Product';
import Store from '@/src/sections/Store';
import Security from '@/src/sections/Security';
import DeveloperDocs from '@/src/sections/DeveloperDocs';
import BuildWithUs from '@/src/sections/BuildWithUs';
import Footer from '@/src/components/Footer';

export default function Home() {
  return (
    <div className="w-full bg-background">
      <Navbar currentPage="home" />
      <Hero />
      <Product />
      <Store />
      <Security />
      <DeveloperDocs />
      <BuildWithUs />
      <Footer />
    </div>
  );
}
