'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FadeIn } from '@/src/components/Animators';

/**
 * Closing CTA, 2026-05-22 v2-canvas rewrite.
 *
 * The earlier closer ("Declare. Stake. Honor. Watch.") leaned on a
 * four-verb protocol acronym that sounded like dev-talk on a marketing
 * page. The v2 design canvas closes the page with a direct,
 * conversational ask:
 *
 *   - eyebrow "04 · The ask of you"
 *   - large two-line headline ("You said you'd do the thing. Do the
 *     thing.") with the closing fragment in the accent color
 *   - one-sentence framing about cohort batching + first-week ritual
 *   - an inline email form (input + Get in line button) instead of
 *     a single "Join the waitlist" pill (the inline form is the
 *     more decisive surface for a closer)
 *   - a small monospace caption ("No spam · No newsletter · One
 *     email when it's your turn")
 *
 * The form does not POST yet; it routes to /waitlist with the email
 * as a query param. /waitlist is the existing intake surface and
 * will receive the prefill once the route reads search params.
 */
const FinalCta: React.FC = () => {
    const [email, setEmail] = useState('');

    const action = email.trim().length > 0
        ? `/waitlist?email=${encodeURIComponent(email.trim())}`
        : '/waitlist';

    return (
        <section
            id="final-cta"
            aria-labelledby="final-cta-heading"
            className="relative w-full px-6 md:px-12 text-center border-y border-foreground/[0.07]"
            style={{
                paddingTop: 'clamp(80px, 14vw, 160px)', paddingBottom: 'clamp(80px, 14vw, 160px)',
                background: `radial-gradient(ellipse 60% 70% at 50% 50%, rgba(240, 138, 76, 0.06), transparent 70%), linear-gradient(180deg, rgba(255,255,255,0.01), transparent)`,
            }}
        >
            <FadeIn className="max-w-[920px] mx-auto">
                <span className="font-mono text-[11px] tracking-[0.2em] text-primary uppercase inline-flex items-center gap-3">
                    <span className="h-px w-6 bg-primary inline-block" />
                    04 · The ask of you
                </span>
                <h2
                    id="final-cta-heading"
                    className="mt-6 font-medium tracking-[-0.04em] leading-[0.95] text-foreground"
                    style={{ fontSize: 'clamp(40px, 7vw, 96px)' }}
                >
                    <span className="block">You said you&apos;d</span>
                    <span className="block">
                        do the thing.{' '}
                        <span className="text-primary">Do the thing.</span>
                    </span>
                </h2>
                <p
                    className="mt-8 mx-auto max-w-[560px] text-foreground/75 leading-relaxed"
                    style={{ fontSize: 'clamp(15px, 1.15vw, 18px)' }}
                >
                    Operator Uplift opens to new operators in cohorts. Join the waitlist and we&apos;ll send your first commitment ritual within a week.
                </p>

                <form
                    action={action}
                    method="GET"
                    className="mt-10 mx-auto max-w-[420px] flex flex-col sm:flex-row gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        window.location.href = action;
                    }}
                >
                    <label htmlFor="final-cta-email" className="sr-only">
                        Email address
                    </label>
                    <input
                        id="final-cta-email"
                        type="email"
                        name="email"
                        required
                        placeholder="you@yourname.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 min-w-0 px-4 py-3 font-mono text-sm text-foreground bg-foreground/[0.04] border border-foreground/[0.14] placeholder:text-muted/70 focus:border-foreground/40 focus:outline-none transition-colors"
                    />
                    <button
                        type="submit"
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-foreground text-[#0A0A0B] font-mono text-sm font-semibold tracking-[0.02em] border border-foreground hover:bg-foreground/90 transition-colors whitespace-nowrap"
                    >
                        Get in line
                        <span aria-hidden="true">→</span>
                    </button>
                </form>

                <p className="mt-5 font-mono text-[10px] tracking-[0.16em] text-muted/70 uppercase">
                    No spam · No newsletter · One email when it&apos;s your turn
                </p>

                {/* Visible-but-quiet fallback link for users with JS
                    disabled or autofill-resistant browsers. */}
                <noscript>
                    <Link
                        href="/waitlist"
                        className="mt-6 inline-block font-mono text-xs text-primary underline"
                    >
                        Join the waitlist
                    </Link>
                </noscript>
            </FadeIn>
        </section>
    );
};

export default FinalCta;
