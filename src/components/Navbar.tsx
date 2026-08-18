import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
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

  // Body scroll lock + ESC-to-close while the mobile overlay is
  // open. Without the scroll lock, iOS Safari lets the underlying
  // page scroll behind the overlay (the menu uses position:fixed
  // but the body keeps its scroll context), which means tapping
  // close lands the user at a different scroll position than where
  // they opened the menu. ESC-to-close matches desktop dialog
  // conventions and helps keyboard users escape without hunting
  // for the visible X.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    // Compensate for the now-absent scrollbar so the page doesn't
    // shift horizontally when overflow flips to hidden.
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileMenuOpen]);

  /**
   * v2 canvas nav items. Each renders as lowercase mono with no
   * heavy tracking. Homepage-anchor entries use `/#…` hashes so the
   * link still works when a user is on a non-home route.
   */
  const navItems: ReadonlyArray<{ label: string; href: string }> = [
    { label: 'how it works', href: '/#how-it-works' },
    { label: 'the app', href: '/#app' },
    { label: 'app demo', href: '/app' },
    { label: 'pricing', href: '/#pricing' },
    { label: 'faq', href: '/#faq' },
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-mono text-[13px] text-foreground border border-foreground/[0.16] bg-foreground/[0.02] hover:border-foreground/40 hover:bg-foreground/[0.06] transition-all"
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

      {/* Backdrop: dims and blurs the page behind the sheet.
          Clicking the backdrop closes the menu. */}
      <div
        aria-hidden="true"
        onClick={() => setMobileMenuOpen(false)}
        className={`lg:hidden fixed inset-0 bg-background/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Slide-in sheet from the right. Sheet slides in from
          translateX(100%) to translateX(0) with a snappy
          cubic-bezier, matching the premium fintech sheet pattern.
          The backdrop above handles close-on-tap outside the sheet. */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!mobileMenuOpen}
        inert={!mobileMenuOpen}
        className={`lg:hidden fixed right-0 top-0 h-full w-[min(88vw,340px)] flex flex-col z-50 transition-transform duration-[420ms] ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{
          background: 'color-mix(in oklch, var(--color-surface) 96%, transparent)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          borderLeft: '1px solid color-mix(in oklch, var(--color-foreground) 8%, transparent)',
          transitionTimingFunction: mobileMenuOpen ? 'cubic-bezier(0.22,1,0.36,1)' : 'cubic-bezier(0.55,0,1,0.45)',
        }}
      >
        {/* Sheet header: logo + close button */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-foreground/[0.06]">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5"
            aria-label="Operator Uplift home"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/operator-uplift-mark-64.png"
              alt=""
              aria-hidden="true"
              width={28}
              height={28}
              className="w-7 h-7 object-contain"
            />
            <span className="font-mono text-sm tracking-[0.02em] text-foreground">
              operator<span className="text-primary px-[2px]">·</span>uplift
            </span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="w-10 h-10 rounded-full bg-foreground/[0.06] flex items-center justify-center hover:bg-foreground/[0.1] transition-colors"
            aria-label="Close menu"
          >
            <X size={18} className="text-foreground" />
          </button>
        </div>

        {/* Nav links with stagger-in animation */}
        <nav className="flex-1 flex flex-col px-3 py-5 gap-1 overflow-y-auto">
          {navItems.map((item, i) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="font-mono text-base text-foreground hover:text-primary px-4 py-3 rounded-2xl hover:bg-foreground/[0.04] transition-colors"
              style={{
                opacity: mobileMenuOpen ? 1 : 0,
                transform: mobileMenuOpen ? 'none' : 'translateX(12px)',
                transition: mobileMenuOpen
                  ? `opacity 0.35s ease ${170 + i * 45}ms, transform 0.35s cubic-bezier(0.16,1,0.3,1) ${170 + i * 45}ms`
                  : 'none',
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Footer CTA */}
        <div
          className="px-4 pb-6 pt-4 border-t border-foreground/[0.06] flex flex-col gap-3"
          style={{
            opacity: mobileMenuOpen ? 1 : 0,
            transform: mobileMenuOpen ? 'none' : 'translateY(8px)',
            transition: mobileMenuOpen ? 'opacity 0.4s ease 380ms, transform 0.4s ease 380ms' : 'none',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">Theme</span>
            <ThemeToggle />
          </div>
          <Link
            href="/waitlist"
            onClick={() => setMobileMenuOpen(false)}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full font-mono text-sm text-foreground border border-foreground/[0.16] bg-foreground/[0.02] hover:border-foreground/40 transition-all"
          >
            Join the waitlist
            <span className="text-primary">→</span>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Navbar;
