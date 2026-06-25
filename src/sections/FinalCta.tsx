'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { FadeIn } from '@/src/components/Animators';

type CtaState = 'idle' | 'submitting' | 'done';

const FinalCta: React.FC = () => {
    const [email, setEmail] = useState('');
    const [ctaState, setCtaState] = useState<CtaState>('idle');
    const [signupResult, setSignupResult] = useState<{ position: number; count: number } | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (ctaState === 'submitting') return;
        setCtaState('submitting');
        try {
            const res = await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), source: 'final-cta' }),
            });
            const data = await res.json();
            setSignupResult({ position: data.position, count: data.count });
            setCtaState('done');
            window.dispatchEvent(new CustomEvent('waitlist:joined'));
        } catch {
            window.location.href = `/waitlist?email=${encodeURIComponent(email.trim())}`;
        }
    }

    return (
        <section
            id="final-cta"
            aria-labelledby="final-cta-heading"
            className="relative w-full px-6 md:px-12 text-center flex flex-col justify-center"
            style={{
                paddingTop: 'clamp(64px, 10vw, 120px)',
                paddingBottom: 'clamp(64px, 10vw, 120px)',
            }}
        >
            <FadeIn block className="max-w-[920px] mx-auto">
                <span className="font-mono text-[11px] tracking-[0.2em] text-primary uppercase inline-flex items-center gap-3">
                    <span className="h-px w-6 bg-primary inline-block" />
                    Join the waitlist
                    <span className="h-px w-6 bg-primary inline-block" />
                </span>

                {/* Gradient heading: foreground fades to ~65% opacity on the
                    way down. Asme editorial pattern applied to a plain <span>
                    tree so background-clip:text works without interference
                    from animated child spans. "Do the thing." overrides the
                    inherited transparent fill back to the accent color. */}
                <h2
                    id="final-cta-heading"
                    className="mt-6 font-medium tracking-[-0.04em] leading-[0.95]"
                    style={{
                        fontSize: 'clamp(32px, 5vw, 72px)',
                        backgroundImage: 'linear-gradient(to bottom, var(--color-foreground) 0%, color-mix(in oklch, var(--color-foreground) 65%, transparent) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}
                >
                    <span className="block">You said you&apos;d</span>
                    <span className="block">
                        do the thing.{' '}
                        <span style={{ WebkitTextFillColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
                            Do the thing.
                        </span>
                    </span>
                </h2>

                <p
                    className="mt-8 mx-auto max-w-[560px] text-foreground/75 leading-relaxed"
                    style={{ fontSize: 'clamp(15px, 1.15vw, 18px)' }}
                >
                    Operator Uplift opens to new operators in cohorts. Join the waitlist and we&apos;ll send your first commitment ritual within a week.
                </p>

                {ctaState !== 'done' ? (
                    <form
                        onSubmit={handleSubmit}
                        className="mt-10 mx-auto max-w-[420px] flex flex-col sm:flex-row gap-2"
                    >
                        <label htmlFor="final-cta-email" className="sr-only">
                            Email address
                        </label>
                        <input
                            id="final-cta-email"
                            type="email"
                            required
                            placeholder="you@yourname.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex-1 min-w-0 px-4 py-3 font-mono text-sm text-foreground bg-foreground/[0.04] border border-foreground/[0.14] placeholder:text-muted/70 focus:border-foreground/40 focus:outline-none transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={ctaState === 'submitting'}
                            className="group relative overflow-hidden inline-flex items-center justify-center gap-2 px-5 py-3 bg-foreground text-background font-mono text-sm font-semibold tracking-[0.02em] border border-foreground hover:bg-foreground/90 transition-colors whitespace-nowrap disabled:opacity-60"
                        >
                            <span
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent"
                            />
                            <span className="relative">
                                {ctaState === 'submitting' ? 'Joining...' : 'Get in line'}
                            </span>
                            {ctaState !== 'submitting' && (
                                <span className="relative" aria-hidden="true">→</span>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="mt-10 mx-auto max-w-[420px] flex items-center gap-3 px-5 py-3.5 border border-primary/30 bg-primary/[0.04] font-mono text-sm text-foreground">
                        <span className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                            <Check size={13} className="text-primary" />
                        </span>
                        <span className="text-foreground/80 text-left flex-1">
                            {signupResult && signupResult.position > 0 && (
                                <>#{signupResult.position} of {signupResult.count} </>
                            )}
                            on the list
                        </span>
                        <Link href="/waitlist" className="text-primary text-xs hover:underline shrink-0">
                            view →
                        </Link>
                    </div>
                )}

                <p className="mt-5 font-mono text-[10px] tracking-[0.16em] text-muted/70 uppercase">
                    No spam · No newsletter · One email when it&apos;s your turn
                </p>

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
