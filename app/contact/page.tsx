'use client';

import Navbar from '@/src/components/Navbar';
import Contact from '@/src/sections/Contact';
import Footer from '@/src/components/Footer';

export default function ContactPage() {
  return (
    <div className="relative w-full bg-background min-h-screen text-foreground">
      <Navbar currentPage="contact" />
      <main>
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
