'use client';

import React from 'react';
import { FadeIn } from '@/src/components/Animators';
import { SectionHeader } from '@/src/components/SectionHeader';
import { SlideHeader, SlideFooter, CallOut } from '@/src/components/SlideChrome';

/**
 * Market section, 2026-05-22 deck-slide-05 alignment.
 *
 * The earlier version was a 2-col grid: category rows on the left,
 * ASCII bar chart on the right. The pitch deck slide 05 ships a
 * stronger pattern: three giant TAM / SAM / SOM stat cards
 * ($60B / $1.7B / $250M) with the SOM card highlighted as the
 * wedge. That reads as deck-scale on the homepage where the ASCII
 * chart felt understated and dev-tooly.
 *
 * Stat sourcing (deck slide 05):
 *   - TAM $60B: self-improvement category (wellness + habits + coaching)
 *   - SAM $1.7B: accountability-tool buyers already paying for follow-through
 *   - SOM $250M: operators + service providers who need trusted delivery
 *
 * Honesty: numbers come from the deck the founder built; the homepage
 * reads them as analyst-style sizing, not "we will capture all of it
 * by 2030." The closing CallOut keeps the deck's anchor sentence:
 * "real money + visible proof + consequences people can't talk their
 * way out of."
 */

interface MarketCard {
    label: string;
    size: string;
    title: string;
    body: string;
    /** Highlight as the SOM wedge. */
    wedge?: boolean;
}

const CARDS: MarketCard[] = [
    {
        label: '// TAM',
        size: '$60B',
        title: 'Self-improvement.',
        body: 'Wellness, habits, coaching. Real money chasing real outcomes.',
    },
    {
        label: '// SAM',
        size: '$1.7B',
        title: 'Accountability tools.',
        body: 'Users already paying for follow-through. They have not gotten it.',
    },
    {
        label: '// SOM · WEDGE',
        size: '$250M',
        title: 'Operators + service providers.',
        body: 'Founders, creators, freelancers who need trusted delivery.',
        wedge: true,
    },
];

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
                    description="No fake trillion-dollar numbers. The accountability wedge sits inside a $60B category where the work is already happening. We route around the part everyone gives up on."
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 mt-14">
                    {CARDS.map((card, i) => (
                        <FadeIn key={card.label} delay={i * 100}>
                            <article
                                className={[
                                    'h-full flex flex-col p-7 md:p-8 border',
                                    card.wedge
                                        ? 'border-primary/55 bg-primary/[0.04]'
                                        : 'border-foreground/[0.10] bg-foreground/[0.015]',
                                ].join(' ')}
                            >
                                <span
                                    className={[
                                        'font-mono text-[11px] tracking-[0.16em] uppercase',
                                        card.wedge ? 'text-primary' : 'text-muted',
                                    ].join(' ')}
                                >
                                    {card.label}
                                </span>
                                <div
                                    className={[
                                        'mt-5 font-medium tracking-[-0.045em] leading-[0.95]',
                                        card.wedge ? 'text-primary' : 'text-foreground',
                                    ].join(' ')}
                                    style={{ fontSize: 'clamp(48px, 5.5vw, 80px)' }}
                                >
                                    {card.size}
                                </div>
                                <h3 className="mt-5 text-[20px] md:text-[22px] font-medium text-foreground tracking-[-0.01em] leading-tight">
                                    {card.title}
                                </h3>
                                <p className="mt-3 text-[14px] md:text-[15px] text-muted leading-relaxed">
                                    {card.body}
                                </p>
                            </article>
                        </FadeIn>
                    ))}
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
