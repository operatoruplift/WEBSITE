'use client';

import React from 'react';
import { FadeIn } from '@/src/components/Animators';
import { SectionHeader } from '@/src/components/SectionHeader';
import { SlideHeader, SlideFooter, CallOut } from '@/src/components/SlideChrome';

/**
 * Market section, 2026-05-22 homepage redesign.
 *
 * Mirrors the design ref's #market block: two-column grid with a
 * categories list on the left (the wedge highlighted in accent) and
 * an ASCII bar chart on the right showing the accountability gap
 * between people who set goals and people who actually get held to
 * them.
 *
 * Honest: no trillion-dollar fake numbers. Just the categories where
 * the work is already happening (self-improvement, habits, coaching,
 * productivity) and the unowned accountability wedge that sits in
 * the middle.
 */

interface Row {
    label: string;
    meta: string;
    wedge?: boolean;
}

const ROWS: Row[] = [
    { label: 'Self-improvement', meta: 'books · courses · workshops' },
    { label: 'Habits', meta: 'trackers · streaks · journals' },
    { label: 'Coaching', meta: '1:1 · group · digital' },
    { label: 'Productivity', meta: 'tasks · time · focus' },
    { label: 'Accountability', meta: 'the unowned wedge ←', wedge: true },
];

const ASCII_CHART = `╔═══════════════════════════════════╗
║                                   ║
║  people who set goals             ║
║  ████████████████████████ 100%    ║
║                                   ║
║  people who track them            ║
║  ████████████ + ░░░░░░░░  ~40%    ║
║                                   ║
║  people held accountable          ║
║  ██ + ░░░░░░░░░░░░░░░░░░  <8%     ║
║                                   ║
║  ↑ this is what we own            ║
║                                   ║
╚═══════════════════════════════════╝`;

const MarketSection: React.FC = () => {
    return (
        <section
            id="market"
            aria-labelledby="market-heading"
            className="relative w-full px-6 md:px-12 border-t border-foreground/[0.07]"
            style={{ paddingTop: 'clamp(80px, 12vw, 120px)', paddingBottom: 'clamp(80px, 12vw, 120px)' }}
        >
            <div className="w-full max-w-[1280px] mx-auto">
                <SlideHeader section="market · why now" slideNumber="03" slideTotal="05" />
                <SectionHeader
                    headingId="market-heading"
                    align="left"
                    numberPrefix="03"
                    eyebrow="The market"
                    title={
                        <>
                            Bigger than{' '}
                            <span
                                className="text-muted/55"
                                style={{ textDecoration: 'line-through', textDecorationThickness: '2px' }}
                            >
                                habits
                            </span>
                            .
                        </>
                    }
                    description="No fake trillion-dollar numbers. Big, boring categories where the work is already happening. We route around the part everyone gives up on."
                />
                <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center mt-12">
                    {/* Left column: category rows */}
                    <div className="flex flex-col">
                        {ROWS.map((row, i) => (
                            <FadeIn key={row.label} delay={i * 50}>
                                <div
                                    className={[
                                        'flex justify-between items-baseline py-4',
                                        i < ROWS.length - 1 ? 'border-b border-foreground/[0.12]' : '',
                                        row.wedge ? 'text-primary' : '',
                                    ].join(' ')}
                                >
                                    <span
                                        className="text-[20px] md:text-[22px] tracking-[-0.01em] font-medium"
                                        style={row.wedge ? { color: 'var(--color-primary)' } : undefined}
                                    >
                                        {row.label}
                                    </span>
                                    <span className="font-mono text-[13px] text-muted">
                                        {row.wedge ? <span className="text-primary">{row.meta}</span> : row.meta}
                                    </span>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                    {/* Right column: ASCII chart */}
                    <FadeIn delay={300}>
                        <pre
                            className="font-mono text-[12px] md:text-[13px] leading-[1.25] text-foreground/85 border border-foreground/[0.12] p-7 md:p-8 overflow-x-auto"
                            style={{ background: 'rgba(255,255,255,0.015)' }}
                            aria-hidden="true"
                        >
                            {ASCII_CHART}
                        </pre>
                    </FadeIn>
                </div>
                <CallOut label="The shift">
                    Real money + visible proof + consequences people can&apos;t talk their way out of.
                </CallOut>
                <SlideFooter section="the market expands" stamp="// COMMITMENT INFRASTRUCTURE" />
            </div>
        </section>
    );
};

export default MarketSection;
