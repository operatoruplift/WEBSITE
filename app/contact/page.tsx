'use client';

import Navbar from '@/src/components/Navbar';
import Contact from '@/src/sections/Contact';
import Footer from '@/src/components/Footer';

export default function ContactPage() {
  return (
    <div className="theme-light w-full bg-background min-h-screen">
      <Navbar currentPage="contact" />
      <Contact />
      <Footer />
    </div>
  );
}
