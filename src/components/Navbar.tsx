import React, { useState } from 'react';
import Link from 'next/link';
import { Logo, ChevronRight, GitHubIcon } from './Icons';

interface NavbarProps {
  currentPage: string;
}

const Navbar: React.FC<NavbarProps> = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navItems = [
    // April 30 2026 trim, second pass. WATCH DEMO was redundant: the
    // homepage hero already has a "Watch 90s demo" anchor, and a nav
    // duplicate of that just clutters the bar. Pricing + FAQ remain
    // because they answer two distinct first-visit questions.
    { name: 'PRICING', targetId: 'pricing', href: '/#pricing' },
    { name: 'FAQ', targetId: 'faq', href: '/#faq' },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 px-4 sm:px-6 py-4 sm:py-6 md:px-12 flex items-center justify-between bg-background/95 backdrop-blur-sm transition-all duration-300">
        <Link
          href="/"
          className="flex items-center hover:opacity-80 transition-opacity z-50"
          aria-label="Operator Uplift home"
        >
          <Logo className="w-8 h-8 md:w-10 md:h-10" />
        </Link>

        {/* Desktop Navigation: lg and above. Below lg, the hamburger
            menu surfaces the same items so tablet (md) users still
            have a way to reach Pricing / FAQ / Docs. */}
        <div className="hidden lg:flex items-center space-x-3 lg:space-x-4">
          <div className="hidden lg:flex items-center gap-8 mr-6">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href || `/#${item.targetId}`}
                className="group flex items-center text-xs font-bold text-muted hover:text-white transition-colors tracking-[0.15em] px-1"
              >
                {item.name}
                {item.name === 'PRODUCT' && (
                  <ChevronRight className="ml-0.5 w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </a>
            ))}
            {/* /docs is the in-repo GitBook-style site (P9). Keeps the
                nav flow on-site and docs in sync with shipped behavior. */}
            <Link
              href="/docs"
              className="group flex items-center text-xs font-bold text-muted hover:text-white transition-colors tracking-[0.15em] px-1"
            >
              DOCS
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/operatoruplift/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 h-9 px-3 text-xs font-bold bg-white/5 text-white border border-white/10 rounded-sm hover:bg-white/10 transition-colors uppercase tracking-wide"
            >
              <GitHubIcon className="w-4 h-4" />
              <span className="hidden xl:inline">Open Source</span>
            </a>

            <Link
              href="/paywall"
              className="inline-flex items-center h-9 px-4 text-xs font-bold bg-primary text-white rounded-sm hover:bg-primary/90 transition-colors uppercase tracking-wide whitespace-nowrap"
            >
              Try it free
            </Link>

            <Link
              href="/contact"
              className="inline-flex items-center h-9 px-4 text-xs font-bold bg-white/10 text-white border border-white/10 rounded-sm hover:bg-white/20 transition-colors uppercase tracking-wide whitespace-nowrap"
            >
              Contact
            </Link>
          </div>
        </div>

        {/* Hamburger menu button: shows on mobile + tablet (below lg)
            so tablet users can reach the nav items that the desktop
            bar would otherwise hide. */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden flex flex-col items-center justify-center w-10 h-10 space-y-1.5 z-50"
          aria-label="Toggle menu"
        >
          {/* Plain `bg-white` is not flipped by the .theme-light wrapper
              (only `bg-white/N` opacity variants are), so the bars
              rendered as white-on-white on the light marketing pages
              and were effectively invisible. `bg-foreground` follows
              the theme token, dark on light surfaces, white on dark. */}
          <span className={`w-6 h-0.5 bg-foreground transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`w-6 h-0.5 bg-foreground transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`w-6 h-0.5 bg-foreground transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </nav>

      {/* Mobile + tablet menu overlay (below lg). */}
      <div
        className={`lg:hidden fixed inset-0 bg-background/98 backdrop-blur-md z-40 transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ top: '72px' }}
      >
        <div className="flex flex-col items-start px-6 py-8 space-y-6">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href || `/#${item.targetId}`}
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-bold text-white hover:text-primary transition-colors tracking-wide"
            >
              {item.name}
            </a>
          ))}
          <Link
            href="/docs"
            onClick={() => setMobileMenuOpen(false)}
            className="text-lg font-bold text-white hover:text-primary transition-colors tracking-wide"
          >
            DOCS
          </Link>
          
          <div className="w-full h-px bg-white/10 my-4" />
          
          <a 
            href="https://github.com/operatoruplift/" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center space-x-2 text-sm font-bold bg-white/5 text-white border border-white/10 px-4 py-3 rounded-sm hover:bg-white/10 transition-all uppercase tracking-wide w-full justify-center"
          >
            <GitHubIcon className="w-4 h-4" />
            <span>Open Source</span>
          </a>
          
          <Link
            href="/paywall"
            className="text-sm font-bold bg-primary text-white px-4 py-3 rounded-sm hover:bg-primary/80 transition-colors uppercase tracking-wide w-full text-center shadow-[0_0_12px_rgba(231,118,48,0.3)]"
            onClick={() => setMobileMenuOpen(false)}
          >
            Try it free
          </Link>

          <Link
            href="/contact"
            className="text-sm font-bold bg-white/10 text-white border border-white/10 px-4 py-3 rounded-sm hover:bg-white/20 transition-all uppercase tracking-wide w-full text-center"
            onClick={() => setMobileMenuOpen(false)}
          >
            Contact
          </Link>
        </div>
      </div>
    </>
  );
};

export default Navbar;
