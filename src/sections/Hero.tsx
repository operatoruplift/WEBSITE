import React from 'react';
import Link from 'next/link';
import HeroTerminal from '@/src/components/HeroTerminal';
import { APP_CONTENT } from '@/src/services/dataService';
import { FadeIn } from '@/src/components/Animators';

/**
 * Hero, 2026-05-22 v2-canvas alignment pass.
 *
 * The earlier dark redesign (PR #675) used a 132px headline clamp
 * that overflowed the 1280px wrapper on retina-width viewports and
 * crowded an App Store / Google Play row right under the primary
 * CTAs. The founder shared the v2 design canvas
 * (/tmp/disrupt-onboarding-v2/index.html) showing a smaller,
 * better-balanced hero: 84-96px headline, single-row badge above,
 * tight column with the terminal as the only inline visual.
 *
 * Changes vs. PR #675:
 *   - Headline clamp dropped from clamp(48px, 9vw, 132px) to
 *     clamp(40px, 7.5vw, 96px) so the title comfortably fits the
 *     1280px wrapper on every breakpoint.
 *   - App Store + Google Play inline row removed from the hero.
 *     The v2 canvas puts those badges in a dedicated /04 · DOWNLOAD/
 *     section further down the page; the inline duplication was
 *     visual clutter and competed with the primary CTAs.
 *   - Visionary tag moved up to render as the eyebrow ABOVE the
 *     headline (matching the v2 canvas's eyebrow-then-display
 *     rhythm) instead of as a low-opacity sentinel at the very
 *     bottom of the hero.
 *
 * Kept: the badge ("Now in private beta · iOS & Android coming
 * soon"), the canonical headline split (white "Keep your word." +
 * accent "Bet on yourself."), the v2 subhead copy from
 * dataService.ts, primary CTA "Join the waitlist", secondary CTA
 * "See how it works", and the HeroTerminal CLI mock as the only
 * visual under the hero.
 */
const Hero: React.FC = () => {
  const data = APP_CONTENT.hero;
  const [headlineFirst, headlineSecond] = splitHeadline(data.headline);

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative w-full overflow-hidden pt-24 pb-20 md:pt-28 md:pb-28"
    >
      <div className="accent-glow" />

      <div className="relative z-10 max-w-[1080px] mx-auto px-6 md:px-10 flex flex-col items-center text-center">
        {/* Eyebrow: mono uppercase tag with the // commitment-infrastructure
            sigil. Matches the v2 canvas section-eyebrow rhythm. */}
        <FadeIn delay={50} direction="down">
          <span className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase mb-6">
            {data.visionTag}
          </span>
        </FadeIn>

        {/* Badge with pulse */}
        <FadeIn delay={150} direction="down">
          <div className="inline-flex items-center gap-3 px-3.5 py-2 mb-8 md:mb-10 rounded-full border border-foreground/[0.12] bg-foreground/[0.02] font-mono text-xs text-muted">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inline-flex w-full h-full rounded-full bg-primary opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-primary shadow-[0_0_12px_var(--color-primary)]" />
            </span>
            <span>Now in private beta · iOS &amp; Android coming soon</span>
          </div>
        </FadeIn>

        {/* Headline. The clamp tops out at 96px so the title fits the
            1080px wrapper on retina widths and never overflows. */}
        <FadeIn delay={250}>
          <h1
            id="hero-heading"
            className="font-medium tracking-[-0.045em] leading-[0.93] text-foreground"
            style={{ fontSize: 'clamp(40px, 7.5vw, 96px)', textWrap: 'balance' as React.CSSProperties['textWrap'] }}
          >
            {/* {' '} + <br /> keeps textContent reading as one phrase
                for the Playwright copy spec while the visible layout
                still breaks at the sentence boundary. */}
            {headlineFirst}{' '}
            {headlineSecond && (
              <>
                <br />
                <span className="text-primary">{headlineSecond}</span>
              </>
            )}
          </h1>
        </FadeIn>

        {/* Subhead, v2 commitment-layer one-liner. */}
        <FadeIn delay={400}>
          <p
            className="mt-6 md:mt-7 mx-auto max-w-[620px] text-foreground/75 leading-relaxed"
            style={{ fontSize: 'clamp(15px, 1.15vw, 18px)', textWrap: 'pretty' as React.CSSProperties['textWrap'] }}
          >
            {data.subhead}
          </p>
        </FadeIn>

        {/* Primary + secondary CTAs */}
        <FadeIn delay={550}>
          <div className="mt-9 md:mt-10 flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center flex-wrap">
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

        {/* Terminal mock as the only inline visual under the hero. The
            v2 canvas keeps the App Store + Google Play badges out of
            the hero and reserves them for the /04 · DOWNLOAD/ section. */}
        <FadeIn delay={750}>
          <div className="mt-14 md:mt-20 w-full">
            <HeroTerminal />
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

function splitHeadline(text: string): [string, string | null] {
  const trimmed = text.trim();
  const m = trimmed.match(/^(.+?\.)\s+(.+)$/);
  if (!m) return [trimmed, null];
  return [m[1], m[2]];
}

export default Hero;
