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
        eyebrow: '01 · Real',
        title: 'Gmail + Calendar, for real',
        body: 'Connect Google once. Your agent lists events, drafts replies, and creates meetings on your actual accounts. Scopes are minimum-necessary: calendar.events + gmail.compose + gmail.readonly.',
    },
    {
        icon: Hand,
        eyebrow: '02 · Approved',
        title: 'You approve every write',
        body: 'Before anything sends or books, a modal shows exactly what will happen and what data was used. One click to approve, one to cancel. Nothing is committed until you click.',
    },
    {
        icon: FileSignature,
        eyebrow: '03 · Receipted',
        title: 'Every real action leaves a signed receipt',
        body: 'ed25519-signed, hashed, and anchored to a Merkle root on Solana devnet. You can audit every draft sent and every event created, the signature proves Operator Uplift can\u2019t rewrite history.',
    },
];

export function WhatBecomesReal() {
    return (
        <Section>
            <SectionHeader
                eyebrow="After You Sign In"
                title="What becomes real after login"
                description="The demo on /chat is simulated. Sign in + connect Google and three things switch on, each designed so you stay in control."
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
