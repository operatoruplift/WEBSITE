'use client';

import React from 'react';
import { TrendingDown, Compass, Repeat, DollarSign, Gavel, Eye } from 'lucide-react';
import { FadeIn } from '@/src/components/Animators';
import { Section } from '@/src/components/Section';
import { SectionHeader } from '@/src/components/SectionHeader';

/**
 * Problem + Solution section (Phase 2 of the Gamify Your Growth pivot).
 *
 * Replaces the prior local-first / BYOK / receipts trust-stack story
 * that supported the retired AI-assistant product. The file keeps the
 * `LocalFirst.tsx` name and the `local-first` section id for now so
 * existing nav anchors and analytics keep working; Phase 4 will rename
 * the file + id when the rest of the homepage settles.
 *
 * Source narrative: pitch deck v7 slides 2 and 3, captured in
 * docs/PIVOT_GAMIFY_GROWTH.md.
 *
 *   Problem  - The Motivation Cliff. Most people start, willpower
 *              fades, generic tools do not adapt, the goal slips.
 *   Solution - The AI Co-Pilot. Personalization that learns what
 *              keeps you going and adjusts the plan.
 *
 * Norman door rule: each card names one concrete behavior, not a
 * vague claim. Jakob's Law rule: two-column problem / solution grid
 * is the conventional structure consumers expect; no surprises.
 */

interface Reality {
    icon: React.FC<{ className?: string; size?: number }>;
    title: string;
    body: string;
}

const PROBLEM_REALITIES: Reality[] = [
    {
        icon: TrendingDown,
        title: 'Motivation is a leaky bucket',
        body: 'Day one is easy. Day fourteen is when most people quit. Push notifications and streak emojis do nothing the moment things get hard.',
    },
    {
        icon: Compass,
        title: 'Apps trust the honor system',
        body: 'Passive habit trackers and wellness apps assume you will self-report honestly. You will not. Not when the work is real and the cost of lying is zero.',
    },
    {
        icon: Repeat,
        title: 'No skin, no game',
        body: 'Without consequences, plans drift. High-intent operators are tired of failing themselves. They do not need another mood-board. They need a system that bites back.',
    },
];

const SOLUTION_MECHANISMS: Reality[] = [
    {
        icon: DollarSign,
        title: 'Financial loss aversion',
        body: 'Stake real money on the commitment. USDC or card. Miss the mark and you lose it. Drift stops being free; follow-through stops being optional.',
    },
    {
        icon: Gavel,
        title: 'AI Game Master adjudicates',
        body: 'An impartial AI scores every check-in, with reasoning the operator can see. The streak only counts if it is true. No more lying to yourself by accident.',
    },
    {
        icon: Eye,
        title: 'Verifiable, on-chain settlement',
        body: 'Stakes settle on Solana automatically. Escrow, slashing, payout. Witnesses see the same view you do. A year from now you can prove what you actually did.',
    },
];

const LocalFirst: React.FC = () => {
    return (
        <Section id="local-first" ariaLabelledby="local-first-heading">
            <SectionHeader
                headingId="local-first-heading"
                align="left"
                numberPrefix="01"
                eyebrow="The problem"
                title="The honor system is dead. The protocol is alive."
                description="High-intent operators are drowning in options and starving for enforcement. Operator Uplift is the commitment protocol that replaces self-report and willpower with financial loss aversion, AI adjudication, and verifiable on-chain settlement."
            />

            {/* Two-column grid: Problem on the left, Solution on the
                right. Each column carries a label + three concrete
                cards. The asymmetric accent colors (problem column
                neutral-cool, solution column brand orange) signal the
                shift from diagnosis to remedy without needing copy to
                say so. */}
            <div className="w-full max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Problem column */}
                <FadeIn delay={100}>
                    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6 md:p-8 h-full">
                        <div className="flex items-center gap-3 mb-5">
                            <span className="w-2 h-2 rounded-full bg-foreground/60" />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-foreground/70">
                                The problem
                            </span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-2 leading-tight">
                            Users are starving for enforcement.
                        </h3>
                        <p className="text-sm text-muted leading-relaxed mb-6">
                            The intent was real. The honor system was the problem.
                        </p>
                        <ul className="space-y-4 list-none p-0">
                            {PROBLEM_REALITIES.map((reality) => {
                                const Icon = reality.icon;
                                return (
                                    <li key={reality.title} className="flex gap-4">
                                        <div className="w-9 h-9 shrink-0 rounded-lg bg-foreground/5 border border-foreground/10 flex items-center justify-center">
                                            <Icon aria-hidden size={16} className="text-foreground/70" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-semibold text-foreground mb-1">
                                                {reality.title}
                                            </h4>
                                            <p className="text-sm text-muted leading-relaxed">
                                                {reality.body}
                                            </p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </FadeIn>

                {/* Solution column */}
                <FadeIn delay={200}>
                    <div className="rounded-2xl border border-[#F97316]/30 bg-[#F97316]/[0.04] p-6 md:p-8 h-full">
                        <div className="flex items-center gap-3 mb-5">
                            <span className="w-2 h-2 rounded-full bg-[#F97316]" />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#F97316]">
                                The fix
                            </span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-2 leading-tight">
                            We don't sell motivation. We sell consequences.
                        </h3>
                        <p className="text-sm text-muted leading-relaxed mb-6">
                            Real money. Real adjudication. Real receipts. Forced follow-through, by design.
                        </p>
                        <ul className="space-y-4 list-none p-0">
                            {SOLUTION_MECHANISMS.map((mechanism) => {
                                const Icon = mechanism.icon;
                                return (
                                    <li key={mechanism.title} className="flex gap-4">
                                        <div className="w-9 h-9 shrink-0 rounded-lg bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center">
                                            <Icon aria-hidden size={16} className="text-[#F97316]" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-semibold text-foreground mb-1">
                                                {mechanism.title}
                                            </h4>
                                            <p className="text-sm text-muted leading-relaxed">
                                                {mechanism.body}
                                            </p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </FadeIn>
            </div>

            {/* Closing callout. Sits below the two columns because the
                columns are the diagnosis + remedy and this is the
                stake: who Operator Uplift is for. Plain language only,
                no jargon. */}
            <FadeIn delay={400}>
                <div className="w-full max-w-[1100px] mx-auto mt-8">
                    <div className="rounded-2xl border border-[#F97316]/20 bg-[#F97316]/[0.03] p-6 md:p-8 text-left">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="w-2 h-2 rounded-full bg-[#F97316]" />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-foreground/70">
                                Built for the ambitious
                            </span>
                        </div>
                        <p className="text-sm md:text-base text-foreground/90 leading-relaxed max-w-[820px]">
                            Founders, athletes, operators. The people who have already tried the streak apps and the journals and the accountability calls, and want a system that costs them when they slip. Operator Uplift is the protocol where ambition finally pays for itself.
                        </p>
                    </div>
                </div>
            </FadeIn>
        </Section>
    );
};

export default LocalFirst;
