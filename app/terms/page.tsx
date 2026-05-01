'use client';

import Navbar from '@/src/components/Navbar';
import Terms from '@/src/sections/Terms';
import Footer from '@/src/components/Footer';

export default function TermsPage() {
  return (
    <div className="theme-light w-full bg-background min-h-screen">
      <Navbar currentPage="home" />
      <main>
        <Terms />
      </main>
      <Footer />
    </div>
  );
}
