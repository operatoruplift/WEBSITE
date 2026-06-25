'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { APP_CONTENT } from '@/src/services/dataService';
import { FadeIn, SplitChars } from '@/src/components/Animators';
import HeroSpotlight from '@/src/components/HeroSpotlight';
import HeroVideo from '@/src/components/HeroVideo';
import FoundingMemberCounter from '@/src/components/FoundingMemberCounter';

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
type CtaState = 'idle' | 'form' | 'done';

const Hero: React.FC = () => {
  const data = APP_CONTENT.hero;
  const [headlineFirst, headlineSecond] = splitHeadline(data.headline);

  // Email capture CTA state machine (Asme inline-capture pattern).
  // idle  -> click "Join the waitlist" -> form
  // form  -> valid submit             -> done  (or redirect to /waitlist on error)
  // ESC while form is open            -> idle
  const [ctaState, setCtaState] = useState<CtaState>('idle');
  const [emailVal, setEmailVal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signupResult, setSignupResult] = useState<{ position: number; count: number } | null>(null);
  const [typedPlaceholder, setTypedPlaceholder] = useState('');
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Typewriter effect on the email input placeholder (Asme pattern).
  useEffect(() => {
    if (ctaState !== 'form') { setTypedPlaceholder(''); return; }
    const target = 'your@email.com';
    let i = 0;
    const id = setInterval(() => {
      if (i >= target.length) { clearInterval(id); return; }
      setTypedPlaceholder(target.slice(0, ++i));
    }, 55);
    setTimeout(() => emailInputRef.current?.focus(), 80);
    return () => clearInterval(id);
  }, [ctaState]);

  // ESC closes the form.
  useEffect(() => {
    if (ctaState !== 'form') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setCtaState('idle'); setEmailVal(''); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ctaState]);

  async function handleWaitlistSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailVal, source: 'hero-cta' }),
      });
      const data = await res.json();
      setSignupResult({ position: data.position, count: data.count });
      setCtaState('done');
      window.dispatchEvent(new CustomEvent('waitlist:joined'));
    } catch {
      window.location.href = '/waitlist';
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative w-full overflow-hidden pt-24 pb-12 md:pt-28 md:pb-16 flex flex-col justify-center"
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

        {/* Badge: glassmorphism pill with inner "BETA" chip.
            Asme "New | text" pattern adapted to OU colors.
            backdrop-blur gives a subtle depth against the dot-grid. */}
        <FadeIn delay={150} direction="down">
          <div
            className="inline-flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 mb-12 md:mb-16 rounded-full border border-foreground/[0.12] font-mono text-xs text-muted"
            style={{
              background: 'rgba(240,138,76,0.05)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary text-[#0A0A0B] text-[9px] tracking-[0.14em] font-semibold">
              <span className="relative flex w-1 h-1">
                <span className="absolute inline-flex w-full h-full rounded-full bg-[#0A0A0B]/40 animate-ping" />
                <span className="relative inline-flex rounded-full w-1 h-1 bg-[#0A0A0B]" />
              </span>
              BETA
            </span>
            <span>private beta · iOS &amp; Android coming soon</span>
          </div>
        </FadeIn>

        {/* Live founding-member counter. Reads /api/waitlist/counts
            on mount and counts up from 0 to the live total with a
            short tween. No "X of N" cap, no "spots remaining":
            founder direction (2026-06-03) is to keep the door open. */}
        <FadeIn delay={200} direction="down">
          <FoundingMemberCounter />
        </FadeIn>

        {/* Deck-scale headline. clamp(56px → 12vw → 168px) mirrors the
            pitch deck cover which renders the title at roughly 160px
            on a 1080p slide. Left-aligned to match the deck composition. */}
        <h1
          id="hero-heading"
          className="font-medium tracking-[-0.045em] leading-[0.9] text-foreground"
          style={{ fontSize: 'clamp(44px, 7vw, 104px)', textWrap: 'balance' as React.CSSProperties['textWrap'] }}
        >
          <SplitChars text={headlineFirst} baseDelay={250} charDelay={22} />
          {headlineSecond && (
            <>
              <br />
              <SplitChars text={headlineSecond} className="text-primary" baseDelay={490} charDelay={22} />
            </>
          )}
        </h1>

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

        {/* Primary + secondary CTAs.
            Primary cycles through three states (Asme inline-capture pattern):
            idle  -> shows "Join the waitlist" button
            form  -> inline email pill with typewriter placeholder
            done  -> position confirmation with link to full /waitlist page */}
        <FadeIn delay={550}>
          <div className="mt-10 md:mt-12 flex flex-col sm:flex-row gap-3 justify-center items-center flex-wrap">

            {/* idle: pill CTA (wintel pattern) */}
            {ctaState === 'idle' && (
              <Link
                href="/waitlist"
                onClick={(e) => { e.preventDefault(); setCtaState('form'); }}
                className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-primary text-[#0A0A0B] font-mono text-sm font-semibold tracking-[0.02em] hover:shadow-[0_0_36px_rgba(240,138,76,0.6)] hover:-translate-y-px active:translate-y-0 transition-[transform,box-shadow] duration-200"
              >
                <span>Join the waitlist</span>
                <ArrowRight size={14} className="text-[#0A0A0B] group-hover:translate-x-0.5 transition-transform duration-200" />
              </Link>
            )}

            {/* form: email input pill. ESC or submit exits. */}
            {ctaState === 'form' && (
              <form
                onSubmit={handleWaitlistSubmit}
                className="inline-flex items-center gap-2 pl-5 pr-1.5 py-1.5 border border-primary/60 focus-within:border-primary bg-primary/[0.04] font-mono text-sm transition-colors duration-200"
                style={{ minWidth: 264 }}
              >
                <input
                  ref={emailInputRef}
                  type="email"
                  value={emailVal}
                  onChange={(e) => setEmailVal(e.target.value)}
                  placeholder={typedPlaceholder}
                  required
                  autoComplete="email"
                  className="flex-1 bg-transparent text-foreground placeholder-muted/40 outline-none text-sm font-mono tracking-[0.02em]"
                  aria-label="Email address for waitlist"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  aria-label="Submit"
                  className="w-9 h-9 rounded-full bg-primary flex items-center justify-center hover:bg-primary/85 transition-colors duration-200 disabled:opacity-40 shrink-0"
                >
                  <ArrowRight size={14} className="text-[#0A0A0B]" />
                </button>
              </form>
            )}

            {/* done: position confirmation */}
            {ctaState === 'done' && signupResult && (
              <div className="inline-flex items-center gap-3 pl-3 pr-4 py-2 border border-primary/30 bg-primary/[0.04] font-mono text-sm text-foreground">
                <span className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <Check size={13} className="text-primary" />
                </span>
                <span className="text-foreground/80">
                  {signupResult.position > 0 ? `#${signupResult.position} of ${signupResult.count} ` : ''}on the list
                </span>
                <Link href="/waitlist" className="text-primary text-xs hover:underline shrink-0">
                  more →
                </Link>
              </div>
            )}

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
          <div className="mt-12 md:mt-16 w-full max-w-[860px] mx-auto flex flex-row flex-wrap justify-center gap-x-10 gap-y-6 pt-4">
            <MetaCell label="Status" value="Private beta" />
            <MetaCell label="Stack" value="commit · stake · prove · settle" accent />
            <MetaCell label="Web" value="operatoruplift.com" mono />
          </div>
        </FadeIn>

        {/* Launch video. 2026-05-27 swap from the static HeroPreview
            frame to the autoplay-muted launch reel. The video is the
            single hero asset now; HeroPreview is still exported and
            available if a future revert needs it.
            `block` is required on FadeIn here so the wrapper stops
            collapsing around the (max-width-bounded) video container.
            See feedback memory "Bucharest FadeIn inline-block trap". */}
        <FadeIn delay={800} block className="mt-14 md:mt-20 w-full">
          <HeroVideo />
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
