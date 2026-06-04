import React, { useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/src/components/ThemeToggle';
/**
 * Brand mark uses the real hexagon-sparkle logo at
 * /brand/operator-uplift-mark.png shipped in PR #701. The earlier
 * `<Logo />` SVG was a generic dot placeholder. Plain <img> rather
 * than next/image since the asset is tiny and we want zero
 * optimization overhead in the navbar (renders on every page).
 */

interface NavbarProps {
  currentPage: string;
}

/**
 * Navbar, 2026-05-22 v2-canvas refresh.
 *
 * The earlier navbar (WAITLIST · PRICING · BLOG · FAQ · DOCS + OPEN
 * SOURCE + TRY IT FREE + CONTACT, with 8 visible items and three
 * buttons of competing weight) was visually noisy. The founder's v2
 * design canvas (/tmp/disrupt-onboarding-v2) shows a tighter,
 * editorial navbar:
 *
 *   - small mark icon next to an "operator·uplift" mono wordmark
 *   - five lowercase nav items pointing at homepage anchors
 *   - a single primary "Download →" pill on the right
 *
 * Changes vs. the prior navbar:
 *   - Added the wordmark next to the logo mark.
 *   - Replaced the uppercase tracked-out nav list with the v2
 *     lowercase mono section anchors.
 *   - Collapsed OPEN SOURCE + TRY IT FREE + CONTACT down to a single
 *     "Download →" button (the github link + contact form move to
 *     the footer where they belong on a marketing page).
 *
 * Compatibility: the consumer-copy spec asserts that PRICING, FAQ,
 * DOCS are reachable. PRICING is in DESKTOP_LINKS as the standalone
 * /pricing route. FAQ is the anchor that scrolls to the homepage
 * #faq section. DOCS is the standalone /docs route. All three
 * remain reachable through the visible nav.
 */
const Navbar: React.FC<NavbarProps> = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /**
   * v2 canvas nav items. Each renders as lowercase mono with no
   * heavy tracking. Homepage-anchor entries use `/#…` hashes so the
   * link still works when a user is on a non-home route.
   */
  const navItems: ReadonlyArray<{ label: string; href: string }> = [
    { label: 'problem', href: '/#problem' },
    { label: 'how it works', href: '/#how-it-works' },
    { label: 'pricing', href: '/pricing' },
    { label: 'faq', href: '/faq' },
    { label: 'docs', href: '/docs' },
  ];

  return (
    <>
      {/* Skip-to-main accessibility link. Off-screen by default,
          slides into view when focused via Tab so keyboard /
          screen-reader users can bypass the navbar and the rest of
          the page chrome to jump straight to the main landmark.
          Pairs with <main id="main"> on every page that uses
          Navbar. Targets the page's first interactive content
          which is the hero CTA. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-3 focus:py-2 focus:rounded-md focus:bg-foreground focus:text-background focus:font-mono focus:text-xs focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
      >
        Skip to main content
      </a>
      <nav
        className="fixed top-0 left-0 w-full z-50 px-4 sm:px-6 md:px-10 py-4 sm:py-5 flex items-center justify-between transition-all duration-300 border-b border-foreground/[0.06]"
        style={{
          // Glassmorphism per nslevelup.vercel.app reference: 80% bg
          // mixed with transparent + blur(20px) + saturate(140%). The
          // mix() form means the nav inherits whichever theme palette
          // is active without us re-declaring per-mode styles.
          background: 'color-mix(in oklch, var(--color-background) 80%, transparent)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        }}
      >
        {/* Brand: mark + mono wordmark with accent center-dot. */}
        <Link
          href="/"
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity z-50"
          aria-label="Operator Uplift home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/operator-uplift-mark-64.png"
            alt=""
            aria-hidden="true"
            width={32}
            height={32}
            className="w-7 h-7 md:w-8 md:h-8 object-contain"
          />
          <span className="hidden sm:inline-flex items-baseline font-mono text-sm tracking-[0.02em] text-foreground">
            operator
            <span className="text-primary px-[2px]">·</span>
            uplift
          </span>
        </Link>

        {/* Desktop nav (lg and up). Mobile + tablet use the hamburger. */}
        <div className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="font-mono text-[13px] text-muted hover:text-foreground transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Single primary CTA on the right. 2026-06-04: relabeled
            from "Download →" to "Join the waitlist →" per founder
            direction. The iOS + Android apps are not shipped yet
            (hero badge: "iOS & Android coming soon"), so "Download"
            mismatched the destination (/waitlist) and the action it
            actually triggers. When the apps ship, swap label + href. */}
        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/waitlist"
            className="inline-flex items-center gap-2 px-4 py-2 font-mono text-[13px] text-foreground border border-foreground/[0.16] bg-foreground/[0.02] hover:border-foreground/40 hover:bg-foreground/[0.06] transition-all"
          >
            Join the waitlist
            <span className="text-primary">→</span>
          </Link>
        </div>

        {/* Hamburger (below lg). */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden flex flex-col items-center justify-center w-10 h-10 space-y-1.5 z-50"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
        >
          <span className={`w-6 h-0.5 bg-foreground transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`w-6 h-0.5 bg-foreground transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`w-6 h-0.5 bg-foreground transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </nav>

      {/* Mobile + tablet menu overlay. */}
      <div
        id="mobile-menu"
        aria-hidden={!mobileMenuOpen}
        className={`lg:hidden fixed inset-0 bg-background/98 backdrop-blur-md z-40 transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ top: '64px' }}
      >
        <div className="flex flex-col items-start px-6 py-8 space-y-6">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="font-mono text-lg text-foreground hover:text-primary transition-colors"
            >
              {item.label}
            </a>
          ))}

          <div className="w-full h-px bg-foreground/10 my-3" />

          <div className="flex items-center gap-3 w-full">
            <ThemeToggle />
            <Link
              href="/waitlist"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 font-mono text-sm text-foreground border border-foreground/[0.16] bg-foreground/[0.02] hover:border-foreground/40 transition-all"
            >
              Join the waitlist
              <span className="text-primary">→</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
