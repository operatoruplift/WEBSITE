'use client';

import React from 'react';
import { FadeIn } from '@/src/components/Animators';

/**
 * Accountability-market strip, 2026-05-22 rewrite.
 *
 * Earlier iteration was an honest placeholder cohort slot ("Operators
 * we are talking to next"), but the placeholder dots + made-up names
 * read as bland and weren't centered correctly. The pitch deck v3
 * ships a much stronger pattern: a 3-card competitor comparison
 * (Beeminder / stickK / StepBet) with each competitor's structural
 * weakness called out in mono.
 *
 * That's the section we ship here. It uses real logos from the
 * branding kit (public/brand/competitor-*) and frames the existing
 * accountability category as the market we are entering, not a
 * fake customer roster.
 */

interface Competitor {
    name: string;
    logo: string;
    /** Background tone the logo sits against, matching each brand's
     * native treatment so the marks read at full contrast. */
    logoBg: string;
    /** Eyebrow-style tag naming the structural weakness. */
    weakness: string;
    /** One-line explanation of why that pattern leaks. */
    body: string;
}

const COMPETITORS: Competitor[] = [
    {
        name: 'Beeminder',
        logo: '/brand/competitor-beeminder.png',
        logoBg: '#FFFFFF',
        weakness: '// HONOR SYSTEM',
        body: 'Self-report your data. Manual card charge if you fail. Easy to skip the check-in.',
    },
    {
        name: 'stickK',
        logo: '/brand/competitor-stickk.png',
        logoBg: '#1A1A1A',
        weakness: '// HUMAN REFEREE',
        body: 'A friend judges. Discretion becomes the escape hatch when it matters most.',
    },
    {
        name: 'StepBet',
        logo: '/brand/competitor-stepbet.svg',
        logoBg: '#5067F5',
        weakness: '// API ONLY',
        body: 'Fitness-tracker only. One narrow vertical, no general-purpose proof.',
    },
];

const TrustedByStrip: React.FC = () => {
    return (
        <section
            id="market-now"
            aria-labelledby="market-now-heading"
            className="relative w-full px-6 md:px-12 border-y border-foreground/[0.07] flex flex-col justify-center"
            style={{
                minHeight: 'clamp(560px, 80vh, 820px)',
                paddingTop: 'clamp(80px, 10vw, 120px)',
                paddingBottom: 'clamp(80px, 10vw, 120px)',
            }}
        >
            <div className="max-w-[1200px] mx-auto w-full">
                <FadeIn block>
                    <div className="text-center mb-12 md:mb-14">
                        <span className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase inline-flex items-center gap-3">
                            <span className="h-px w-6 bg-primary inline-block" />
                            The accountability market today
                            <span className="h-px w-6 bg-primary inline-block" />
                        </span>
                        <h2
                            id="market-now-heading"
                            className="mt-6 mx-auto max-w-[820px] font-medium tracking-[-0.025em] leading-[1.1] text-foreground"
                            style={{ fontSize: 'clamp(24px, 3vw, 36px)' }}
                        >
                            Three companies tried to fix follow-through.{' '}
                            <span className="text-primary">Each leaks where it matters.</span>
                        </h2>
                    </div>
                </FadeIn>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                    {COMPETITORS.map((c, i) => (
                        <FadeIn key={c.name} delay={i * 100} block>
                            <article className="h-full flex flex-col items-center text-center border border-foreground/[0.10] p-7 md:p-8 gap-5 bg-foreground/[0.015]">
                                <div
                                    className="w-full h-[88px] rounded-md grid place-items-center overflow-hidden"
                                    style={{ background: c.logoBg }}
                                >
                                    {/* Plain <img> instead of next/image so the
                                        StepBet SVG renders without needing
                                        dangerouslyAllowSVG in next.config.
                                        Brand marks are static + small enough
                                        that the optimizer is not needed. */}
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={c.logo}
                                        alt={c.name}
                                        style={{
                                            maxWidth: '78%',
                                            maxHeight: '78%',
                                            width: 'auto',
                                            height: 'auto',
                                            objectFit: 'contain',
                                        }}
                                    />
                                </div>
                                <div className="font-mono text-[12px] tracking-[0.14em] text-primary uppercase">
                                    {c.weakness}
                                </div>
                                <p className="text-[15px] text-foreground/80 leading-relaxed max-w-[280px]">
                                    {c.body}
                                </p>
                            </article>
                        </FadeIn>
                    ))}
                </div>

                <FadeIn delay={400} block>
                    <p className="mt-12 text-center font-mono text-[12px] tracking-[0.14em] text-muted/70 uppercase">
                        Operator Uplift closes the gap with{' '}
                        <span className="text-foreground">staked money</span>,{' '}
                        <span className="text-foreground">uploaded proof</span>, and{' '}
                        <span className="text-foreground">automatic settlement</span>.
                    </p>
                </FadeIn>
            </div>
        </section>
    );
};

export default TrustedByStrip;
