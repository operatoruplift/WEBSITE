'use client';

import Navbar from '@/src/components/Navbar';
import FaqSection from '@/src/sections/FaqSection';
import Footer from '@/src/components/Footer';

/**
 * /faq , standalone FAQ surface. 2026-06-03 founder direction: trim
 * the homepage by moving FAQ off the long-scroll and into its own
 * route (linked from the footer + navbar). Section content + the
 * FAQPage JSON-LD it emits are untouched; only the URL moved.
 */
export default function FaqPage() {
    return (
        <div className="relative w-full bg-background min-h-screen text-foreground">
            <div className="bg-grid-dots" aria-hidden="true" />
            <Navbar currentPage="home" />
            <main id="main" className="relative z-10 pt-20">
                <FaqSection />
            </main>
            <Footer />
        </div>
    );
}
