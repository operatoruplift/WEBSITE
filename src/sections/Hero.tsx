import React from 'react';
import Link from 'next/link';
import HeroTerminal from '@/src/components/HeroTerminal';
import { APP_CONTENT } from '@/src/services/dataService';
import { FadeIn } from '@/src/components/Animators';

/**
 * Hero, 2026-05-22 dark redesign.
 *
 * Source visual: /tmp/disrupt-onboarding/website.html (the design ref
 * the founder shared as "the website is supposed to be designed more
 * like this"). Replaces the prior split-column iMessage-mock hero
 * with a centered editorial composition:
 *
 *   - dotted-grid backdrop + soft accent glow (in app/page.tsx)
 *   - badge: "Now in private beta · iOS & Android coming soon"
 *   - headline: "Keep your word. / Bet on yourself." (second line accent)
 *   - subhead: v10 honor-system-is-dead line
 *   - primary CTA: orange "Join the waitlist" pill
 *   - secondary CTA: "See how it works"
 *   - "Coming soon" App Store + Google Play buttons (disabled, v10
 *     honesty: no shipped iOS/Android app yet, the buttons exist as
 *     visual placeholders that point to /waitlist)
 *   - HeroTerminal: animated CLI mock that types out the commit /
 *     stake / status / check-in / streak loop
 *
 * The headline copy and visionTag still come from APP_CONTENT.hero so
 * the canonical strings stay in one place.
 */
const Hero: React.FC = () => {
  const data = APP_CONTENT.hero;
  // Split the headline at the first sentence boundary so the second
  // sentence renders in the accent color, mirroring the design ref.
  const [headlineFirst, headlineSecond] = splitHeadline(data.headline);

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative w-full overflow-hidden pt-24 pb-20 md:pt-28 md:pb-28"
    >
      {/* Soft accent glow at the top center of the hero. */}
      <div className="accent-glow" />

      <div className="relative z-10 max-w-[1280px] mx-auto px-6 md:px-10 text-center">
        {/* Badge with pulse */}
        <FadeIn delay={50} direction="down">
          <div className="inline-flex items-center gap-3 px-3.5 py-2 mb-8 md:mb-10 rounded-full border border-foreground/[0.12] bg-foreground/[0.02] font-mono text-xs text-muted">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inline-flex w-full h-full rounded-full bg-primary opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-primary shadow-[0_0_12px_var(--color-primary)]" />
            </span>
            <span>Now in private beta · iOS &amp; Android coming soon</span>
          </div>
        </FadeIn>

        {/* Mega headline */}
        <FadeIn delay={150}>
          <h1
            id="hero-heading"
            className="font-medium tracking-[-0.045em] leading-[0.92] text-foreground"
            style={{ fontSize: 'clamp(48px, 9vw, 132px)', textWrap: 'balance' as React.CSSProperties['textWrap'] }}
          >
            <span className="block">{headlineFirst}</span>
            {headlineSecond && (
              <span className="block text-primary">{headlineSecond}</span>
            )}
          </h1>
        </FadeIn>

        {/* Subhead */}
        <FadeIn delay={350}>
          <p
            className="mt-8 md:mt-9 mx-auto max-w-[720px] text-foreground/80 leading-relaxed"
            style={{ fontSize: 'clamp(16px, 1.4vw, 22px)', textWrap: 'pretty' as React.CSSProperties['textWrap'] }}
          >
            {data.subhead}
          </p>
        </FadeIn>

        {/* Primary + secondary CTAs */}
        <FadeIn delay={550}>
          <div className="mt-10 md:mt-12 flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center flex-wrap">
            <Link
              href="/waitlist"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-[#0A0A0B] font-mono text-sm font-semibold tracking-[0.02em] border border-primary hover:shadow-[0_0_28px_rgba(249,115,22,0.45)] transition-shadow"
            >
              Join the waitlist
              <span className="font-mono">→</span>
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-foreground/[0.14] bg-foreground/[0.02] text-foreground font-mono text-sm tracking-[0.02em] hover:border-foreground/40 transition-all"
            >
              See how it works
            </a>
          </div>
        </FadeIn>

        {/* App Store / Google Play (visual placeholders, v10 honest:
            no shipped iOS or Android app yet, so both buttons link to
            /waitlist and carry a "Coming soon" overline). */}
        <FadeIn delay={700}>
          <div className="mt-7 md:mt-8 flex flex-col items-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.18em] text-muted/70 uppercase">
              Coming soon
            </span>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch">
              <Link
                href="/waitlist"
                aria-label="Download on the App Store, coming soon. Joins the waitlist."
                className="inline-flex items-center gap-3 px-4 py-2.5 border border-foreground/[0.14] bg-foreground/[0.02] hover:border-foreground/30 transition-colors opacity-70 hover:opacity-100"
              >
                <AppleGlyph className="w-6 h-6 text-foreground" />
                <span className="text-left leading-tight">
                  <span className="block text-[10px] font-mono text-muted uppercase tracking-wider">Download on the</span>
                  <span className="block text-base font-medium text-foreground">App Store</span>
                </span>
              </Link>
              <Link
                href="/waitlist"
                aria-label="Get it on Google Play, coming soon. Joins the waitlist."
                className="inline-flex items-center gap-3 px-4 py-2.5 border border-foreground/[0.14] bg-foreground/[0.02] hover:border-foreground/30 transition-colors opacity-70 hover:opacity-100"
              >
                <PlayGlyph className="w-6 h-6 text-foreground" />
                <span className="text-left leading-tight">
                  <span className="block text-[10px] font-mono text-muted uppercase tracking-wider">Get it on</span>
                  <span className="block text-base font-medium text-foreground">Google Play</span>
                </span>
              </Link>
            </div>
          </div>
        </FadeIn>

        {/* CLI terminal mock as the hero centerpiece. */}
        <FadeIn delay={900}>
          <div className="mt-14 md:mt-20">
            <HeroTerminal />
          </div>
        </FadeIn>

        {/* Visionary tag, kept as the discreet brand drop at the very
            bottom of the hero. Mono, uppercase, low opacity. */}
        <FadeIn delay={1100}>
          <div className="mt-14 md:mt-16">
            <span className="font-mono text-[11px] tracking-[0.2em] text-muted/60 uppercase">
              {data.visionTag}
            </span>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

/**
 * Split "Sentence A. Sentence B." into two parts so the second
 * sentence can render in the accent color. Falls back to a single
 * line if there is no period (don't render an empty span).
 */
function splitHeadline(text: string): [string, string | null] {
  const trimmed = text.trim();
  // Split on the first period followed by whitespace.
  const m = trimmed.match(/^(.+?\.)\s+(.+)$/);
  if (!m) return [trimmed, null];
  return [m[1], m[2]];
}

function AppleGlyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.05 12.04c-.02-2.13 1.74-3.16 1.82-3.21-.99-1.45-2.54-1.65-3.09-1.67-1.31-.13-2.56.77-3.23.77-.68 0-1.7-.75-2.79-.73-1.43.02-2.76.83-3.5 2.11-1.5 2.6-.38 6.43 1.07 8.53.71 1.03 1.55 2.18 2.65 2.14 1.07-.04 1.47-.69 2.76-.69 1.28 0 1.65.69 2.78.66 1.15-.02 1.87-1.04 2.57-2.07.81-1.19 1.14-2.34 1.16-2.4-.03-.01-2.22-.85-2.24-3.38ZM14.94 5.6c.59-.71.99-1.7.88-2.69-.85.03-1.88.57-2.49 1.28-.54.62-1.02 1.63-.9 2.6.95.07 1.92-.48 2.51-1.19Z"/>
    </svg>
  );
}

function PlayGlyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M4 3.5v17l13-8.5L4 3.5Z" fill="currentColor" opacity="0.85"/>
      <path d="M4 3.5l9 8.5M4 20.5l9-8.5" stroke="currentColor" strokeWidth="0.5" opacity="0.4"/>
    </svg>
  );
}

export default Hero;
