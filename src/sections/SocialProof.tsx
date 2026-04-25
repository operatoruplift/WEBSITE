'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Key, Database, Zap, Lock, Activity } from 'lucide-react';
import { FadeIn } from '@/src/components/Animators';
import { Section } from '@/src/components/Section';
import { SectionHeader } from '@/src/components/SectionHeader';
import { BuiltWithCarousel } from '@/src/components/BuiltWithCarousel';

/**
 * "Built With" + "What's Shipped", every bullet is verifiable in the
 * codebase or from public infrastructure. Anything we couldn't verify
 * publicly has been moved to /press-kit (email gated).
 */

const SHIPPED_FEATURES = [
    { icon: Key, label: 'Sign-in is checked on every page, no shortcuts, no exceptions' },
    { icon: Database, label: 'Every action you take is saved to your account, only visible to you' },
    { icon: Lock, label: 'Each action gets a tamper-proof fingerprint that can\u2019t be edited later' },
    { icon: Activity, label: 'We anchor those fingerprints on a public chain so we can\u2019t rewrite the history' },
    { icon: ShieldCheck, label: 'Limits on how often the system can be hit, so spammers can\u2019t pile on' },
    { icon: Zap, label: 'The paywall is checked on the server, you can\u2019t sneak past it on the front end' },
];

const SocialProof: React.FC = () => {
    return (
        <Section>
            <SectionHeader
                eyebrow="Why trust this?"
                title="Built on tools you already trust"
                description="Picked for security, speed, and reliability, not for the marketing budget."
            />

            {/* Carousel, matches the Hero/TrustedBy marquee pattern */}
            <BuiltWithCarousel />

            {/* What's Shipped, verifiable */}
            <div className="w-full">
                <p className="text-xs font-bold tracking-[0.25em] text-[#F97316] uppercase mb-6 text-center">
                    What&apos;s already live
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full items-stretch text-left">
                    {SHIPPED_FEATURES.map((f, i) => {
                        const Icon = f.icon;
                        return (
                            <FadeIn key={f.label} delay={i * 60}>
                                <div className="flex items-start gap-3 p-4 rounded-xl border border-[#222222] bg-[#111111] h-full">
                                    <div className="w-8 h-8 rounded-lg bg-[#FAFAFA]/5 border border-[#222222] flex items-center justify-center shrink-0">
                                        <Icon size={14} className="text-[#A1A1AA]" />
                                    </div>
                                    <p className="text-sm text-[#FAFAFA]/90 leading-relaxed">{f.label}</p>
                                </div>
                            </FadeIn>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-[#A1A1AA]">
                    Want the technical details? Check the Privacy page.
                </p>
                <p className="text-[11px] text-[#52525B] max-w-md">
                    Beta software. Everything listed is live in our staging environment. Formal audits are next.
                </p>
                <Link href="/paywall"
                    className="inline-flex items-center h-11 px-6 bg-[#F97316] text-white rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-[#F97316]/90 transition-colors mt-4">
                    Try it free <ArrowRight size={16} className="ml-2" />
                </Link>
            </div>
        </Section>
    );
};

export default SocialProof;
