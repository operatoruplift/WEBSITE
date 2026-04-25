'use client';

import React from 'react';
import { Mail, Hand, FileSignature } from 'lucide-react';
import { FadeIn } from '@/src/components/Animators';
import { Section } from '@/src/components/Section';
import { SectionHeader } from '@/src/components/SectionHeader';

/**
 * "What becomes real after login", three trust blocks that answer the
 * three questions a cold visitor has in their first five seconds:
 *   1. What does it actually do?
 *   2. How do I stay in control?
 *   3. What proof do I have that it did what I asked?
 *
 * Every bullet here maps to a verifiable surface the code already ships.
 * No unverifiable claims, no fake quotes, no placeholder logos.
 */

const BLOCKS = [
    {
        icon: Mail,
        eyebrow: '01 · Real email',
        title: 'Real Gmail. Real calendar.',
        body: 'Connect Google once. After that, it pulls up your meetings, drafts replies in your actual inbox, and books events on your real calendar. We only ask for the bare minimum, read your mail, write drafts, manage events. That\u2019s it.',
    },
    {
        icon: Hand,
        eyebrow: '02 · You decide',
        title: 'Nothing goes out without your okay',
        body: 'Before any email sends or any meeting is booked, a popup shows you exactly what\u2019s about to happen and what info it used. One tap to approve, one to cancel. Until you tap, nothing moves.',
    },
    {
        icon: FileSignature,
        eyebrow: '03 · Receipts',
        title: 'Every action leaves a paper trail',
        body: 'Every email it sends and every meeting it books gets a tamper-proof receipt. You can scroll back and see exactly what happened, when, and why. We can\u2019t quietly rewrite the history.',
    },
];

export function WhatBecomesReal() {
    return (
        <Section>
            <SectionHeader
                eyebrow="After you sign in"
                title="Three things turn on when you sign in"
                description="The demo lets you play, but nothing real happens. Sign in and hook up Gmail and three things switch on, and you stay in charge the whole time."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 w-full items-stretch">
                {BLOCKS.map((b, i) => {
                    const Icon = b.icon;
                    return (
                        <FadeIn key={b.title} delay={i * 120}>
                            <div className="h-full p-6 rounded-2xl border border-[#222222] bg-[#111111] flex flex-col hover:border-[#F97316]/30 transition-colors">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#F97316]/10 border border-[#F97316]/30 flex items-center justify-center">
                                        <Icon size={18} className="text-[#F97316]" />
                                    </div>
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">{b.eyebrow}</span>
                                </div>
                                <h3 className="text-lg font-medium text-white mb-2 tracking-tight">{b.title}</h3>
                                <p className="text-sm text-[#A1A1AA] leading-relaxed flex-1">{b.body}</p>
                            </div>
                        </FadeIn>
                    );
                })}
            </div>
        </Section>
    );
}

export default WhatBecomesReal;
