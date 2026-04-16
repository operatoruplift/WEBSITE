'use client';

import React from 'react';
import { Scale, Calculator, Heart, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { FadeIn } from '@/src/components/Animators';
import { Section } from '@/src/components/Section';
import { SectionHeader } from '@/src/components/SectionHeader';

const USE_CASES = [
    {
        icon: Scale,
        role: 'Lawyers',
        headline: 'Your AI paralegal that never leaks client data',
        description: 'Draft briefs, review contracts, and schedule depositions — all encrypted on your device. Attorney-client privilege stays intact because nothing touches the cloud.',
        stat: '4.2 hrs/week saved',
    },
    {
        icon: Calculator,
        role: 'Accountants',
        headline: 'Audit-ready AI that runs inside your firewall',
        description: 'Reconcile books, prepare tax documents, and schedule client meetings. Every action is logged to an on-chain audit trail. SOC 2 compliant by architecture.',
        stat: '60% faster prep',
    },
    {
        icon: Heart,
        role: 'Therapists',
        headline: 'HIPAA-compliant scheduling and note-taking',
        description: 'Manage your calendar, draft session notes, and send appointment reminders — with AES-256 encryption and zero cloud storage. Patient data never leaves your machine.',
        stat: 'HIPAA ready',
    },
];

const UseCases: React.FC = () => {
    return (
        <Section>
            <SectionHeader
                eyebrow="Who It's For"
                title="Built for professionals who can't afford data leaks"
                description="Every industry has confidential data. Operator Uplift keeps it local."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full items-stretch">
                {USE_CASES.map((uc, i) => {
                    const Icon = uc.icon;
                    return (
                        <FadeIn key={uc.role} delay={i * 150}>
                            <div className="rounded-2xl border border-[#222222] bg-[#111111] p-8 h-full flex flex-col text-left hover:border-[#F97316]/30 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center mb-5">
                                    <Icon size={22} className="text-[#F97316]" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F97316] mb-2">{uc.role}</span>
                                <h3 className="text-lg font-semibold text-white mb-3">{uc.headline}</h3>
                                <p className="text-sm text-[#A1A1AA] leading-relaxed flex-1">{uc.description}</p>
                                <div className="mt-6 pt-4 border-t border-[#222222] flex items-center justify-between">
                                    <span className="text-xs font-mono text-[#F97316]">{uc.stat}</span>
                                </div>
                            </div>
                        </FadeIn>
                    );
                })}
            </div>

            <FadeIn delay={500}>
                <Link href="/paywall"
                    className="inline-flex items-center bg-[#F97316] text-white px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-[#F97316]/90 transition-colors">
                    Start Your Free Trial <ArrowRight size={16} className="ml-2" />
                </Link>
            </FadeIn>
        </Section>
    );
};

export default UseCases;
