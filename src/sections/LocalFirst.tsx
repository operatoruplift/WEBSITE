'use client';

import React from 'react';
import { TrendingDown, Compass, Brain, Heart, Users, Repeat } from 'lucide-react';
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
        title: 'Motivation fades fast',
        body: 'Day one is easy. Day fourteen is when most people quit. The plan was never the issue. The follow-through was.',
    },
    {
        icon: Compass,
        title: 'Goals stay too big',
        body: '"Get in shape." "Read more." "Launch the thing." Big ambitions never tell you what to do at 7am on a Tuesday.',
    },
    {
        icon: Repeat,
        title: 'Generic apps do not adapt',
        body: 'Streak counters and habit grids are the same for everyone. They do not learn what actually works for you and what does not.',
    },
];

const SOLUTION_MECHANISMS: Reality[] = [
    {
        icon: Brain,
        title: 'AI that learns your patterns',
        body: 'A behavioral model tracks what keeps you showing up and what makes you stall. The plan gets smarter the longer you use it.',
    },
    {
        icon: Heart,
        title: 'Stakes you actually feel',
        body: 'Optional commitments and rewards calibrated to you. Set the stakes you respond to. Make breaking the streak cost something.',
    },
    {
        icon: Users,
        title: 'A community that pulls you back',
        body: 'Squads, challenges, leaderboards. The days motivation runs out, accountability picks up. You do not have to want it every day.',
    },
];

const LocalFirst: React.FC = () => {
    return (
        <Section id="local-first" ariaLabelledby="local-first-heading">
            <SectionHeader
                headingId="local-first-heading"
                eyebrow="The problem and the fix"
                title="The motivation cliff is real. We built the fix."
                description="Most people do not fail because they lack ambition. They fail because motivation fades, plans stay fuzzy, and nothing keeps them honest day after day. Operator Uplift turns intention into action with commitments, daily check-ins, visible progress, and a community that keeps you coming back."
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
                            Most goals die in week two.
                        </h3>
                        <p className="text-sm text-muted leading-relaxed mb-6">
                            The intent was real. The system was not.
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
                            An AI co-pilot that adapts to you.
                        </h3>
                        <p className="text-sm text-muted leading-relaxed mb-6">
                            The plan changes as you change. Motivation gets engineered, not wished for.
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
                            If you have ever set a goal you meant, then watched it slip somewhere between week two and week six, this is for you. Operator Uplift is the platform where ambition finally wins.
                        </p>
                    </div>
                </div>
            </FadeIn>
        </Section>
    );
};

export default LocalFirst;
