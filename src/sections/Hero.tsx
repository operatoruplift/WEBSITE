import React from 'react';
import Link from 'next/link';
import { APP_CONTENT } from '@/src/services/dataService';
import { FadeIn } from '@/src/components/Animators';
import HeroPreview from '@/src/components/HeroPreview';
import HeroSpotlight from '@/src/components/HeroSpotlight';

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
 * "See how it works", and the metadata strip with status, mechanic,
 * and domain.
 *
 * 2026-05-23: HeroTerminal CLI mock removed per founder feedback
 * ("the terminal animation should be removed"); the AppSection
 * phone mockups carry the product-preview load now.
 */
const Hero: React.FC = () => {
  const data = APP_CONTENT.hero;
  const [headlineFirst, headlineSecond] = splitHeadline(data.headline);

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative w-full overflow-hidden pt-24 pb-20 md:pt-28 md:pb-28 flex flex-col justify-center"
      style={{ minHeight: 'clamp(720px, 100vh, 1080px)' }}
    >
      <div className="accent-glow" />
      <HeroSpotlight />

      <div className="relative z-10 max-w-[1280px] mx-auto px-6 md:px-10 flex flex-col items-center text-center">
        {/* Deck-style eyebrow. PR #700 left-aligned the column to
            mirror the pitch deck's slide 01 composition; user
            feedback (2026-05-22) flipped it back to centered:
            "site should be centered vertically not to the left."
            Center alignment keeps the deck's editorial type and
            two-tone headline but puts the whole column on the
            visual axis of the page instead of pushing it to the
            left edge. The metadata row below the CTAs follows
            the same centered axis. */}
        <FadeIn delay={50} direction="down">
          <span className="block font-mono text-[12px] tracking-[0.18em] text-primary uppercase mb-6 md:mb-8">
            // operator uplift · 2026
          </span>
        </FadeIn>

        {/* Badge with pulse, mono-pill style at the top of the column. */}
        <FadeIn delay={150} direction="down">
          <div className="inline-flex items-center gap-3 px-3.5 py-2 mb-12 md:mb-16 rounded-full border border-foreground/[0.12] bg-foreground/[0.02] font-mono text-xs text-muted">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inline-flex w-full h-full rounded-full bg-primary opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-primary shadow-[0_0_12px_var(--color-primary)]" />
            </span>
            <span>Now in private beta · iOS &amp; Android coming soon</span>
          </div>
        </FadeIn>

        {/* Deck-scale headline. clamp(56px → 12vw → 168px) mirrors the
            pitch deck cover which renders the title at roughly 160px
            on a 1080p slide. Left-aligned to match the deck composition. */}
        <FadeIn delay={250}>
          <h1
            id="hero-heading"
            className="font-medium tracking-[-0.045em] leading-[0.9] text-foreground"
            style={{ fontSize: 'clamp(44px, 7vw, 104px)', textWrap: 'balance' as React.CSSProperties['textWrap'] }}
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

        {/* Subhead, deck-style two-tone. Accent the word "consequences"
            so the brand thesis hits visually as well as semantically. */}
        <FadeIn delay={400}>
          <p
            className="mt-8 md:mt-10 max-w-[760px] mx-auto text-foreground/80 leading-relaxed"
            style={{ fontSize: 'clamp(17px, 1.5vw, 24px)', textWrap: 'pretty' as React.CSSProperties['textWrap'] }}
          >
            Trustless follow-through for people who want{' '}
            <span className="text-primary">consequences</span>.
          </p>
        </FadeIn>

        {/* Primary + secondary CTAs */}
        <FadeIn delay={550}>
          <div className="mt-10 md:mt-12 flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center flex-wrap">
            <Link
              href="/waitlist"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-primary text-[#0A0A0B] font-mono text-sm font-semibold tracking-[0.02em] border border-primary hover:shadow-[0_0_32px_rgba(240,138,76,0.55)] hover:-translate-y-px active:translate-y-0 transition-[transform,box-shadow] duration-200"
            >
              Join the waitlist
              <span className="font-mono">→</span>
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 border border-foreground/[0.14] bg-foreground/[0.02] text-foreground font-mono text-sm tracking-[0.02em] hover:border-foreground/40 transition-all"
            >
              See how it works
            </a>
          </div>
        </FadeIn>

        {/* Deck-style metadata row. Pitch deck slide 01 carries three
            labeled columns at the bottom (OPERATOR / RAISE / WEB).
            We mirror the rhythm but keep it honest: status, the
            commitment mechanic in shorthand, and the domain. */}
        <FadeIn delay={650}>
          <div className="mt-12 md:mt-16 w-full max-w-[860px] mx-auto grid grid-cols-2 sm:grid-cols-3 gap-x-10 gap-y-6 border-t border-foreground/[0.07] pt-8 text-center">
            <MetaCell label="Status" value="Private beta" />
            <MetaCell label="Stack" value="commit · stake · prove · settle" accent />
            <MetaCell label="Web" value="operatoruplift.com" mono />
          </div>
        </FadeIn>

        {/* Static product UI preview. PR #726 removed the cycling
            terminal mock; PR #727 replaces the bare inline slot with
            a single deliberate frame showing the actual commitment
            card UI so a visitor can see what the product looks like
            without animations distracting from the headline. */}
        <FadeIn delay={800}>
          <div className="mt-14 md:mt-20 w-full">
            <HeroPreview />
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

interface MetaCellProps {
  label: string;
  value: string;
  /** Render the value in mono (e.g. for the domain). */
  mono?: boolean;
  /** Render the value in the accent color. */
  accent?: boolean;
}

/**
 * Three-column metadata strip at the bottom of the hero. Pitch deck
 * slide 01 uses the same pattern (OPERATOR / RAISE / WEB labels with
 * a single value below each). Anchors the hero composition the way
 * the deck does.
 */
function MetaCell({ label, value, mono = false, accent = false }: MetaCellProps) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="font-mono text-[10px] tracking-[0.18em] text-muted/80 uppercase">
        {label}
      </span>
      <span
        className={[
          mono ? 'font-mono' : 'font-medium',
          accent ? 'text-primary' : 'text-foreground',
          'text-[14px] md:text-[15px] tracking-[-0.005em]',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  );
}

export default Hero;
