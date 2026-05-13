'use client';

import React from 'react';
import { Mail, MessageSquare, CheckCircle2, FileSignature } from 'lucide-react';
import { FadeIn } from '@/src/components/Animators';
import { Section } from '@/src/components/Section';
import { SectionHeader } from '@/src/components/SectionHeader';

/**
 * How it works, time-to-value framing.
 *
 * Modeled on clawcage's "Zero to sandbox in 10 seconds" pattern.
 * Sits between Hero and LocalFirst so a first-time visitor sees the
 * four-step walkthrough before any architecture talk. The LocalFirst
 * section below covers WHY each step is trustworthy (BYOK, OAuth,
 * receipts); this section covers WHAT the user does, in order.
 *
 * Keep the steps short and concrete. Avoid jargon. Each step is one
 * verb the user actually performs.
 */

interface Step {
    icon: React.FC<{ className?: string; size?: number }>;
    n: string;
    title: string;
    body: string;
}

const STEPS: Step[] = [
    {
        icon: Mail,
        n: '01',
        title: 'Sign in with Google',
        body: 'One tap. The assistant gets read + compose access to your Gmail and Calendar through Google’s consent screen. We never see your password.',
    },
    {
        icon: MessageSquare,
        n: '02',
        title: 'Ask in plain English',
        body: 'Type into the web chat, or text our iMessage number. The same assistant answers either way: "Draft replies to my last three emails."',
    },
    {
        icon: CheckCircle2,
        n: '03',
        title: 'Tap to approve',
        body: 'Every send, draft, or booking shows you the exact action and parameters first. You tap yes. No always-allow, no surprise sends.',
    },
    {
        icon: FileSignature,
        n: '04',
        title: 'It runs in your real Gmail',
        body: 'The email lands in your Drafts or Sent. The calendar event lands in your Calendar. A signed receipt appears on your dashboard so you can prove what happened.',
    },
];

const HowItWorks: React.FC = () => {
    return (
        <Section id="how-it-works" ariaLabelledby="how-it-works-heading">
            <SectionHeader
                headingId="how-it-works-heading"
                eyebrow="How it works"
                title="From sign-in to first action in under a minute"
                description="Four steps. The assistant never moves faster than you do."
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
