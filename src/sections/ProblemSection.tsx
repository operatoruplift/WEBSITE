'use client';

import React from 'react';
import { FadeIn } from '@/src/components/Animators';
import { SectionHeader } from '@/src/components/SectionHeader';

/**
 * Problem section, 2026-05-22 homepage redesign.
 *
 * Mirrors the design ref's #problem block (/tmp/disrupt-onboarding/
 * website.html): a left-aligned eyebrow + struck-through subhead +
 * three numbered cards (DRIFT / FOG / SILENCE).
 *
 * Copy stays in the design ref's voice but the framing carries the
 * brand spec: people fail because motivation fades, plans get fuzzy,
 * and nothing keeps them honest. The fix (stakes + AI + redistribution)
 * is the next section, not this one.
 */

interface ProblemCard {
    num: string;
    label: string;
    title: string;
    body: string;
}

const CARDS: ProblemCard[] = [
    {
        num: '01',
        label: 'DRIFT',
        title: 'Motivation fades.',
        body: 'Day three is harder than day one. By week two, the goal is a tab you keep meaning to close. The push notifications stop working before the habit forms.',
    },
    {
        num: '02',
        label: 'FOG',
        title: 'Plans get fuzzy.',
        body: '"Get in shape." "Ship the thing." "Spend more time outside." A wish, not a verb. Nothing in your life forces it into a check you have to make today.',
    },
    {
        num: '03',
        label: 'SILENCE',
        title: 'No one is watching.',
        body: 'The streak resets in private. The Notes app forgets. Friends are polite. Nothing keeps you honest. The honor system was never going to work, because you are the system.',
    },
];

const ProblemSection: React.FC = () => {
    return (
        <section
            id="problem"
            aria-labelledby="problem-heading"
            className="relative w-full px-6 md:px-12 border-t border-foreground/[0.07] flex flex-col justify-center"
            style={{
                minHeight: 'clamp(640px, 90vh, 920px)',
                paddingTop: 'clamp(80px, 12vw, 120px)',
                paddingBottom: 'clamp(80px, 12vw, 120px)',
            }}
        >
            <div className="w-full max-w-[1280px] mx-auto">
                <SectionHeader
                    headingId="problem-heading"
                    align="center"
                    numberPrefix="01"
                    eyebrow="The problem"
                    title={
                        <>
                            People don&apos;t fail because they{' '}
                            <span
                                className="text-muted/55"
                                style={{ textDecoration: 'line-through', textDecorationThickness: '2px' }}
                            >
                                lack ambition
                            </span>
                            .
                        </>
                    }
                    description="They fail because motivation fades, plans get fuzzy, and nothing keeps them honest day after day."
                />
                <ul
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 list-none p-0 mt-12"
                >
                    {CARDS.map((card, i) => (
                        <li key={card.num}>
                            <FadeIn delay={i * 80}>
                                <article
                                    className="relative border border-foreground/[0.12] p-8 h-full text-center"
                                    style={{
                                        background: 'linear-gradient(180deg, rgba(255,255,255,0.02), transparent)',
                                    }}
                                >
                                    {/* Centered accent hairline above the
                                        eyebrow so the now-centered card has a
                                        symmetric anchor. */}
                                    <span className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-12 bg-primary" aria-hidden="true" />
                                    <div className="font-mono text-xs tracking-[0.1em] text-muted">
                                        {card.num} · {card.label}
                                    </div>
                                    <h3 className="mt-4 text-[26px] md:text-[28px] font-medium text-foreground tracking-[-0.02em] leading-tight">
                                        {card.title}
                                    </h3>
                                    <p className="mt-3 mx-auto max-w-[300px] text-[15px] text-muted leading-relaxed">
                                        {card.body}
                                    </p>
                                </article>
                            </FadeIn>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
};

export default ProblemSection;
