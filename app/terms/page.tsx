'use client';

import Navbar from '@/src/components/Navbar';
import Terms from '@/src/sections/Terms';
import Footer from '@/src/components/Footer';

export default function TermsPage() {
  return (
    <div className="relative w-full bg-background min-h-screen text-foreground">
      <div className="bg-grid-dots" aria-hidden="true" />
      <Navbar currentPage="home" />
      <main className="relative z-10">
        <Terms />
      </main>
      <Footer />
    </div>
  );
}
