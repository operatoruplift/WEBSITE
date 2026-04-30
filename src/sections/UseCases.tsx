'use client';

import React from 'react';
import { Sun, Inbox, Bell, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { FadeIn } from '@/src/components/Animators';
import { Section } from '@/src/components/Section';
import { SectionHeader } from '@/src/components/SectionHeader';

/**
 * Consumer-first vignettes matching the three May 14 demo beats.
 *
 * The previous version of this section pitched enterprise verticals
 * (lawyers, accountants, therapists) without a concrete workflow or
 * before/after. Per the Demo Day copy rule, anything pitched at that
 * audience must ship a real workflow + before/after, or get cut. For
 * this release we cut it, every card below maps to a concrete chat
 * prompt you can run on /chat right now.
 */
const BEATS = [
    {
        icon: Sun,
        tag: 'Morning briefing',
        headline: 'Wake up to your day, already sorted',
        before: 'Before: you wake up, scroll three apps, and realize your 9am has no agenda.',
        after: 'After: at 8am you get one message. "You have 3 things today. Your 2pm has no agenda, want me to draft one?"',
        prompt: '"What\u2019s on my calendar today and what should I worry about?"',
    },
    {
        icon: Inbox,
        tag: 'Inbox cleanup',
        headline: 'Your inbox, replied to, pending your okay',
        before: 'Before: three emails stuck in your head all morning because you haven\u2019t decided how to answer.',
        after: 'After: three drafts line up on screen. Approve to send, swipe to skip. Nothing leaves Gmail without your tap.',
        prompt: '"Draft replies to these three emails, ask me before sending."',
    },
    {
        icon: Bell,
        tag: 'Morning nudges',
        headline: 'Friendly nudges that actually get used',
        before: 'Before: another app you forget about by lunchtime.',
        after: 'After: weather at 7:55, your day at 8:00, one fun thing at 8:05. You actually look forward to tomorrow.',
        prompt: '"Set up morning nudges for me starting tomorrow."',
    },
];

const UseCases: React.FC = () => {
    return (
        <Section>
            <SectionHeader
                eyebrow="Try it today"
                title="Three things it handles well, try them before you sign up"
                description="Open the demo, paste any of these, and watch every action wait for your okay."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full items-stretch">
                {BEATS.map((beat, i) => {
                    const Icon = beat.icon;
                    return (
                        <FadeIn key={beat.tag} delay={i * 150}>
                            <div className="rounded-2xl border border-border bg-card p-8 h-full flex flex-col text-left hover:border-[#F97316]/30 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center mb-5">
                                    <Icon size={22} className="text-[#F97316]" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F97316] mb-2">{beat.tag}</span>
                                <h3 className="text-lg font-semibold text-foreground mb-3">{beat.headline}</h3>
                                <div className="space-y-2 text-sm text-muted leading-relaxed flex-1">
                                    <p>{beat.before}</p>
                                    <p className="text-foreground">{beat.after}</p>
                                </div>
                                <div className="mt-6 pt-4 border-t border-border">
                                    <span className="text-xs font-mono text-[#F97316]">{beat.prompt}</span>
                                </div>
                            </div>
                        </FadeIn>
                    );
                })}
            </div>

            <FadeIn delay={500}>
                <Link href="/chat"
                    className="inline-flex items-center bg-[#F97316] text-white px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-[#F97316]/90 transition-colors">
                    Try It Live <ArrowRight size={16} className="ml-2" />
                </Link>
            </FadeIn>
        </Section>
    );
};

export default UseCases;
