'use client';

import Navbar from '@/src/components/Navbar';
import Privacy from '@/src/sections/Privacy';
import Footer from '@/src/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="relative w-full bg-background min-h-screen text-foreground">
      <div className="bg-grid-dots" aria-hidden="true" />
      <Navbar currentPage="home" />
      <main id="main" className="relative z-10">
        <Privacy />
      </main>
      <Footer />
    </div>
  );
}
