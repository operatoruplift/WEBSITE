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

/**
 * Each step renders a tiny ASCII transcript ("> commit \"run 4x/wk\"
 * \n  ok") below the title + body, matching the design ref's per-step
 * terminal echo. Keeps each step's flavour distinct even at small
 * tile sizes.
 */
const STEP_ECHOES: Record<string, { cmd: string; out: string }> = {
    '01': { cmd: '> commit "run 4×/wk"',  out: '  ok' },
    '02': { cmd: '> stake $50 @maya',     out: '  locked' },
    '03': { cmd: '> did you do it?',      out: '  yes / not yet' },
    '04': { cmd: '> ██████▌░░░ 6 / 10',   out: '  honored' },
};

const HowItWorks: React.FC = () => {
    return (
        <Section id="how-it-works" ariaLabelledby="how-it-works-heading">
            <SectionHeader
                headingId="how-it-works-heading"
                align="left"
                numberPrefix="02"
                eyebrow="The protocol"
                title="Four steps. Repeat until the habit sticks."
                description="The whole system fits on the back of a napkin. That is by design. We don't sell motivation. We sell consequences you choose for yourself."
            />

            {/* Hairline grid: 1px gap on a foreground-tinted background
                makes each step cell read as a panel inside a uniform
                grid, exactly the design's `.steps` layout. */}
            <ol
                className="w-full max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 list-none p-0 mt-2"
                style={{
                    gap: '1px',
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.12)',
                }}
            >
                {STEPS.map((step, i) => {
                    const Icon = step.icon;
                    const echo = STEP_ECHOES[step.n];
                    return (
                        <li key={step.n} className="bg-background min-h-[240px]">
                            <FadeIn delay={i * 80}>
                                <div className="h-full p-7 md:p-8 flex flex-col text-left">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-[11px] tracking-[0.15em] text-primary uppercase">
                                            Step {step.n}
                                        </span>
                                        <Icon aria-hidden size={14} className="text-primary/60" />
                                    </div>
                                    <h3 className="mt-4 text-[22px] font-medium text-foreground tracking-[-0.02em] leading-snug">
                                        {step.title}
                                    </h3>
                                    <p className="mt-2 text-sm text-muted leading-relaxed">
                                        {step.body}
                                    </p>
                                    {echo && (
                                        <pre
                                            className="mt-auto pt-5 font-mono text-[12px] leading-[1.4] text-muted/80"
                                            aria-hidden="true"
                                        >
                                            <span>{echo.cmd}</span>
                                            {'\n'}
                                            <span className="text-primary">{echo.out}</span>
                                        </pre>
                                    )}
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
