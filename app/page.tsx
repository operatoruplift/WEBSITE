'use client';

import React, { useState } from 'react';
import Navbar from '@/src/components/Navbar';
import Hero from '@/src/sections/Hero';
import Product from '@/src/sections/Product';
import Security from '@/src/sections/Security';
import DeveloperDocs from '@/src/sections/DeveloperDocs';
import Contact from '@/src/sections/Contact';
import BuildWithUs from '@/src/sections/BuildWithUs';
import Terms from '@/src/sections/Terms';
import Privacy from '@/src/sections/Privacy';
import ProductPage from '@/src/sections/ProductPage';
import Footer from '@/src/components/Footer';

export default function Home() {
  const [page, setPage] = useState<'home' | 'contact' | 'terms' | 'privacy' | 'product'>('home'); 

  const renderContent = () => {
    switch (page) {
      case 'contact':
        return <Contact />;
      case 'terms':
        return <Terms />;
      case 'privacy':
        return <Privacy />;
      case 'product':
        return <ProductPage />;
      case 'home':
      default:
        return (
          <>
            <Hero />
            <Product onNavigate={setPage} />
            <Security />
            <DeveloperDocs />
            <BuildWithUs />
          </>
        );
    }
  };

  return (
    <div className="w-full bg-background">
      <Navbar onNavigate={(target) => setPage(target)} currentPage={page === 'contact' ? 'contact' : 'home'} />                                                                                     
      {renderContent()}
      <Footer onNavigate={setPage} />
    </div>
  );
}
