'use client';

import React from 'react';
import { Target, DollarSign, CheckCircle2, Eye } from 'lucide-react';
import { FadeIn } from '@/src/components/Animators';
import { Section } from '@/src/components/Section';
import { SectionHeader } from '@/src/components/SectionHeader';

/**
 * How it works, the four-step questline.
 *
 * Pivot 2026-05-21: this section was the four-step Gmail/Calendar
 * sign-in flow. The Gamify Your Growth pivot replaces it with the
 * four-step ambition-to-action loop from the pitch deck v7:
 * set a goal, the AI breaks it down, you complete daily quests,
 * the platform adapts. The mirror narrative on the website is
 * captured in docs/PIVOT_GAMIFY_GROWTH.md.
 *
 * Keep steps concrete and verb-led. No jargon (Norman door rule).
 * Each card is one action the operator actually takes.
 */

interface Step {
    icon: React.FC<{ className?: string; size?: number }>;
    n: string;
    title: string;
    body: string;
}

const STEPS: Step[] = [
    {
        icon: Target,
        n: '01',
        title: 'Declare',
        body: 'Write the commitment in your own words. Specific enough that "did I do it?" is a yes or no. "Run four times this week." "Ship by Friday." "No alcohol for 30 days."',
    },
    {
        icon: DollarSign,
        n: '02',
        title: 'Stake',
        body: 'Put real money on the line. USDC or card. If you miss, you lose it. Pick a witness who keeps you honest. The stake makes drift expensive instead of free.',
    },
    {
        icon: CheckCircle2,
        n: '03',
        title: 'Honor',
        body: 'Daily check-in, one tap. An AI Game Master adjudicates so the streak only counts if it is true. Miss the mark and the stake slashes automatically. The honor system is dead; the protocol is alive.',
    },
    {
        icon: Eye,
        n: '04',
        title: 'Watch',
        body: 'Heatmap, streak history, settled stakes. Progress you cannot fake. Witnesses see the same view. Receipts are on-chain and verifiable, so a year from now you can prove what you actually did.',
    },
];

const HowItWorks: React.FC = () => {
    return (
        <Section id="how-it-works" ariaLabelledby="how-it-works-heading">
            <SectionHeader
                headingId="how-it-works-heading"
                eyebrow="The protocol"
                title="Declare. Stake. Honor. Watch."
                description="Four steps for forced follow-through. We don't sell motivation. We sell consequences you choose for yourself."
            />

            {/* Numbered step grid. `<ol>` exposes the sequence to
                assistive tech as an ordered list; each `<li>` carries
                one step's heading + body. The big oversized step
                number is the visual anchor, the icon sits in a tinted
                pill above the number, the heading + body follow. */}
            <ol className="w-full max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 list-none p-0">
                {STEPS.map((step, i) => {
                    const Icon = step.icon;
                    return (
                        <li key={step.n}>
                            <FadeIn delay={i * 80}>
                                <div className="relative h-full rounded-2xl border border-border bg-card p-6 flex flex-col text-left">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center">
                                            <Icon aria-hidden size={18} className="text-[#F97316]" />
                                        </div>
                                        <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#F97316]/70">
                                            Step {step.n}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">
                                        {step.title}
                                    </h3>
                                    <p className="text-sm text-muted leading-relaxed">
                                        {step.body}
                                    </p>
                                </div>
                            </FadeIn>
                        </li>
                    );
                })}
            </ol>
        </Section>
    );
};

export default HowItWorks;
