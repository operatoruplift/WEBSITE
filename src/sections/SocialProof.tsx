'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Quote } from 'lucide-react';
import { FadeIn } from '@/src/components/Animators';

const MEDIA_MENTIONS = [
    { outlet: 'Forbes Latin America', quote: 'AI agent orchestration meets local-first privacy' },
    { outlet: 'SF Standard', quote: 'The operating system for autonomous AI agents' },
    { outlet: 'Netflix AI Documentary', quote: 'Featured in the exploration of AI-human collaboration' },
];

const NOTABLE_FOLLOWERS = [
    { name: 'Naval Ravikant', handle: '@naval', role: 'AngelList founder' },
];

const SocialProof: React.FC = () => {
    return (
        <section className="w-full bg-[#0A0A0A] px-6 md:px-12 flex justify-center">
            <div className="w-full max-w-[1200px] py-20">
                <FadeIn>
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-3 mb-4">
                            <span className="h-px w-16 bg-[#F97316]/40" />
                            <span className="text-xs font-bold tracking-[0.25em] text-[#F97316] uppercase">As Seen In</span>
                            <span className="h-px w-16 bg-[#F97316]/40" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">
                            Trusted by builders who ship
                        </h2>
                    </div>
                </FadeIn>

                {/* Media logos / mentions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                    {MEDIA_MENTIONS.map((m, i) => (
                        <FadeIn key={m.outlet} delay={i * 100}>
                            <div className="rounded-xl border border-[#222222] bg-[#111111] p-6 text-center hover:border-[#F97316]/20 transition-all">
                                <Quote size={16} className="text-[#F97316] mx-auto mb-3 opacity-60" />
                                <p className="text-sm text-[#A1A1AA] italic mb-3">{m.quote}</p>
                                <span className="text-xs font-bold uppercase tracking-widest text-white">{m.outlet}</span>
                            </div>
                        </FadeIn>
                    ))}
                </div>

                {/* Notable followers */}
                <FadeIn delay={400}>
                    <div className="flex items-center justify-center gap-6 mb-10">
                        {NOTABLE_FOLLOWERS.map(f => (
                            <div key={f.handle} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[#222222] bg-[#111111]">
                                <div className="w-8 h-8 rounded-full bg-[#F97316]/15 border border-[#F97316]/30 flex items-center justify-center text-xs font-bold text-[#F97316]">
                                    {f.name[0]}
                                </div>
                                <div>
                                    <span className="text-sm font-semibold text-white">{f.name}</span>
                                    <span className="text-xs text-[#52525B] ml-2">{f.handle}</span>
                                </div>
                                <span className="text-[9px] uppercase tracking-widest text-[#F97316] font-bold px-1.5 py-0.5 rounded border bg-[#F97316]/10 border-[#F97316]/30">Follows</span>
                            </div>
                        ))}
                    </div>
                </FadeIn>

                {/* CTA */}
                <FadeIn delay={500}>
                    <div className="text-center">
                        <p className="text-[#A1A1AA] mb-6 text-sm">300+ beta users. Join the next cohort.</p>
                        <Link href="/paywall"
                            className="inline-flex items-center bg-[#F97316] text-white px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-[#F97316]/80 transition-colors shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                            Get Early Access <ArrowRight size={16} className="ml-2" />
                        </Link>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
};

export default SocialProof;
