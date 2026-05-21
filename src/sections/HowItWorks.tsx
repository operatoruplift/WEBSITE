'use client';

import React from 'react';
import { Target, Sparkles, Trophy, TrendingUp } from 'lucide-react';
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
        title: 'Set your goal',
        body: 'Tell us the ambition. "Run a marathon." "Ship five days a week." "Read fourteen books this quarter." Big or small, vague or specific, the AI takes it from here.',
    },
    {
        icon: Sparkles,
        n: '02',
        title: 'AI breaks it down',
        body: 'The AI turns your goal into a step-by-step questline. Small daily actions, dated, attached to the right time of day. No more staring at a blank week.',
    },
    {
        icon: Trophy,
        n: '03',
        title: 'Show up daily',
        body: 'Complete the daily quest. Build a streak. Earn badges. Optional stakes you set for yourself. A community cheers you on so motivation does not have to be a solo sport.',
    },
    {
        icon: TrendingUp,
        n: '04',
        title: 'Adapt and achieve',
        body: 'The platform learns what motivates you and where you stall, and adjusts. The plan gets better the longer you stick with it, until the habit becomes who you are.',
    },
];

const HowItWorks: React.FC = () => {
    return (
        <Section id="how-it-works" ariaLabelledby="how-it-works-heading">
            <SectionHeader
                headingId="how-it-works-heading"
                eyebrow="How it works"
                title="Turn your ambition into a daily habit"
                description="Four steps. The AI does the planning. You do the showing up."
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
