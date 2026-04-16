'use client';

import React from 'react';
import { Shield, Globe, Eye } from 'lucide-react';
import { FadeIn } from '@/src/components/Animators';
import { Section } from '@/src/components/Section';
import { SectionHeader } from '@/src/components/SectionHeader';

const items = [
    {
        icon: Shield,
        title: 'HIPAA Ready',
        description: 'Architecture supports HIPAA requirements — data stays in your environment, agents run in isolated sandboxes, every action is logged.',
    },
    {
        icon: Globe,
        title: 'GDPR Compliant',
        description: 'All data stays in your jurisdiction. No cross-border transfers. Full right to erasure via local data wipe.',
    },
    {
        icon: Eye,
        title: 'Auditable by Design',
        description: 'Open-source runtime. Every agent action is hashed, logged, and anchored to a Merkle root on Solana devnet.',
    },
];

const Compliance: React.FC = () => {
    return (
        <Section>
            <SectionHeader
                eyebrow="Compliance"
                title="Built for Compliance"
                description="Privacy and security built into the architecture — not bolted on."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full items-stretch">
                {items.map((item, i) => {
                    const Icon = item.icon;
                    return (
                        <FadeIn key={item.title} delay={i * 100}>
                            <div className="p-6 rounded-2xl border border-[#222222] bg-[#111111] text-center h-full hover:border-[#F97316]/30 transition-colors flex flex-col items-center">
                                <div className="w-12 h-12 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center mb-4">
                                    <Icon size={22} className="text-[#F97316]" />
                                </div>
                                <h3 className="text-lg font-medium text-[#FAFAFA] mb-2">{item.title}</h3>
                                <p className="text-sm text-[#A1A1AA] leading-relaxed">{item.description}</p>
                            </div>
                        </FadeIn>
                    );
                })}
            </div>

            <p className="text-[11px] text-[#52525B] max-w-lg">
                Beta software. Compliance certifications (HIPAA / SOC 2 / GDPR) are architectural commitments — not formal audits. Full audit on the roadmap.
            </p>
        </Section>
    );
};

export default Compliance;
