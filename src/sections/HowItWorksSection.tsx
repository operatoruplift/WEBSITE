'use client';

import React from 'react';
import { FadeIn } from '@/src/components/Animators';
import { SectionHeader } from '@/src/components/SectionHeader';

/**
 * How it works, 2026-05-22 homepage redesign.
 *
 * Mirrors the design ref's #how section: a 5-step hairline grid
 * (commit → stake → check in → see progress → repeat). Each cell
 * is a hairline panel inside a 1px-gap grid with a foreground-tinted
 * background showing through, plus a small ASCII echo at the bottom.
 *
 * The five-step framing carries the brand spec: stake on commitments,
 * upload proof, AI verifies, success builds reputation, failure
 * redistributes pooled stakes to operators who kept theirs. The
 * "Repeat" step closes the loop so the system reads as iterative,
 * not one-shot.
 */

interface Step {
    n: string;
    title: string;
    body: string;
    /** Tiny terminal echo rendered at the bottom of each cell. */
    cmd: string;
    out: string;
}

const STEPS: Step[] = [
    {
        n: '01',
        title: 'Commit',
        body: 'Declare what you will do, in your own words. Specific enough that "did I do it?" is a yes or no.',
        cmd: '> commit "run 4×/wk"',
        out: '  ok',
    },
    {
        n: '02',
        title: 'Stake',
        body: 'Put real money on the line. USDC or card. Funds sit in escrow while the commitment is active.',
        cmd: '> stake $50',
        out: '  locked',
    },
    {
        n: '03',
        title: 'Upload proof',
        body: 'Photo, GPS, integration data, or a short note. The AI Game Master verifies follow-through and streams reasoning back.',
        cmd: '> check-in 07',
        out: '  yes / not yet',
    },
    {
        n: '04',
        title: 'Build reputation',
        body: 'Honor the commitment: your stake returns and your streak grows. Verifiable history you can point clients and witnesses at.',
        cmd: '> streak +1',
        out: '  honored',
    },
    {
        n: '05',
        title: 'Or redistribute',
        body: 'Miss the mark: your stake is redistributed to operators who kept their word, minus a small protocol fee. Failure funds the ecosystem.',
        cmd: '> settle',
        out: '  pool ←  forfeit',
    },
];

const HowItWorksSection: React.FC = () => {
    return (
        <section
            id="how-it-works"
            aria-labelledby="how-it-works-heading"
            className="relative w-full px-6 md:px-12 border-t border-foreground/[0.07] flex flex-col justify-center"
            style={{
                minHeight: 'clamp(720px, 95vh, 1000px)',
                paddingTop: 'clamp(80px, 12vw, 120px)',
                paddingBottom: 'clamp(80px, 12vw, 120px)',
            }}
        >
            <div className="w-full max-w-[1280px] mx-auto">
                <SectionHeader
                    headingId="how-it-works-heading"
                    align="center"
                    numberPrefix="03"
                    eyebrow="How it works"
                    title={
                        <>
                            Commit. Stake. Prove.{' '}
                            <span className="text-primary">Settle.</span>
                        </>
                    }
                    description="The whole system fits on the back of a napkin. That is by design. We don't sell motivation. We sell consequences you choose for yourself."
                />
                <ol
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 list-none p-0 mt-12"
                    style={{
                        gap: '1px',
                        background: 'rgba(255,255,255,0.12)',
                        border: '1px solid rgba(255,255,255,0.12)',
                    }}
                >
                    {STEPS.map((step, i) => (
                        <li key={step.n} className="bg-background min-h-[220px]">
                            <FadeIn delay={i * 60}>
                                <div className="h-full p-7 md:p-7 flex flex-col items-center text-center">
                                    <div className="font-mono text-[11px] tracking-[0.15em] text-primary uppercase">
                                        Step {step.n}
                                    </div>
                                    <h3 className="mt-4 text-[22px] font-medium text-foreground tracking-[-0.02em] leading-snug">
                                        {step.title}
                                    </h3>
                                    <p className="mt-2 text-[14px] text-muted leading-relaxed">
                                        {step.body}
                                    </p>
                                    <pre
                                        className="mt-auto pt-5 font-mono text-[12px] leading-[1.4] text-muted/80"
                                        aria-hidden="true"
                                    >
                                        <span>{step.cmd}</span>
                                        {'\n'}
                                        <span className="text-primary">{step.out}</span>
                                    </pre>
                                </div>
                            </FadeIn>
                        </li>
                    ))}
                </ol>
                <FadeIn delay={300}>
                    <p
                        className="mt-14 md:mt-16 mx-auto max-w-[820px] text-center text-foreground/95 leading-relaxed"
                        style={{ fontSize: 'clamp(15px, 1.3vw, 19px)' }}
                    >
                        <span className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase block mb-3">
                            AI verification
                        </span>
                        Cost-controlled stack: rules first (EXIF, GPS, timestamp, device, cheap), then a small classifier model on the photo (cheap), and only an LLM for edge cases, disputes, and fraud signals.
                    </p>
                </FadeIn>
            </div>
        </section>
    );
};

export default HowItWorksSection;
