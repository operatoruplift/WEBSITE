'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import { FadeIn } from '@/src/components/Animators';
import { ArrowRight } from 'lucide-react';

/**
 * /team page, Gamify Your Growth pivot Phase 7.
 *
 * Surfaces the founding team from pitch deck v7 slide 14. Honest
 * roles only; every name is a real person on the deck. The page
 * deliberately keeps copy short so an investor or candidate can
 * skim it in under a minute, then click through to LinkedIn for
 * detail.
 *
 * Honesty rule: this page lists role + one-line background. Big
 * social-proof numbers (followers, funding history) do not belong
 * here until they are defensible.
 */

interface TeamMember {
    name: string;
    role: string;
    bio: string;
    linkedin?: string;
}

/**
 * v10 reframe (pitch deck v10 slide 11, "Built by an operator"):
 * Operator Uplift is built solo by Matthew Sim. The earlier v7
 * deck listed 5 co-founders + 1 advisor; the v10 deck retires
 * that team in favor of the solo-founder track record.
 *
 * Three biography beats per the v10 deck:
 *   1. 13-year solo founder, consumer products, behavioral loops
 *   2. Pro esports, top 5 global, high-stakes execution
 *   3. Military school discipline, consequence-driven accountability
 *
 * The "why" line is preserved verbatim from the deck because it
 * is the founder voice we want investors and operators to hear.
 */
const FOUNDERS: TeamMember[] = [
    {
        name: 'Matthew Sim',
        role: 'Solo Founder, CEO',
        bio: 'Thirteen-year solo founder with multiple consumer products shipped and scaled. Top-5 global pro esports career taught him what high-stakes execution actually costs. Military school taught him what consequences look like. Operator Uplift is the digitization of that strict, consequence-driven accountability.',
    },
];

const ADVISORS: TeamMember[] = [
    {
        name: 'Lubos Brzobohaty',
        role: 'Advisor',
        bio: 'Founder of SANEZOO. Pulls us back to first principles whenever we drift.',
    },
];

const VALUES = [
    {
        title: 'Show up daily',
        body: 'The product preaches consistency, so we ship something every day.',
    },
    {
        title: 'Tell the truth',
        body: 'No fabricated numbers on the live site. Aspirational figures stay in the deck.',
    },
    {
        title: 'Build for the operator',
        body: 'Every feature has to answer the same question: does this help the user keep their word?',
    },
];

const PersonCard: React.FC<{ person: TeamMember }> = ({ person }) => (
    <div className="rounded-2xl border border-foreground/10 bg-card p-6 h-full flex flex-col">
        <h3 className="text-lg font-semibold text-foreground mb-1 leading-tight">{person.name}</h3>
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary mb-3">
            {person.role}
        </span>
        <p className="text-sm text-muted leading-relaxed flex-1">{person.bio}</p>
    </div>
);

export default function TeamPage() {
    return (
        <div className="relative w-full bg-background min-h-screen text-foreground">
            <div className="bg-grid-dots" aria-hidden="true" />
            <Navbar currentPage="team" />

            <main className="relative z-10 pt-32 pb-24 px-6 md:px-12">
                <div className="max-w-[1100px] mx-auto">
                    {/* Header */}
                    <FadeIn>
                        <div className="text-center mb-16 mx-auto max-w-2xl">
                            <div className="inline-flex items-center gap-3 mb-4">
                                <span className="h-px w-16 bg-[#F08A4C]/40" aria-hidden />
                                <span className="text-xs font-mono font-bold tracking-[0.12em] text-[#F08A4C] uppercase">// Built by an operator</span>
                                <span className="h-px w-16 bg-[#F08A4C]/40" aria-hidden />
                            </div>
                            <h1 className="text-3xl md:text-5xl font-medium text-foreground mb-4 tracking-tight leading-[1.1]">
                                Solo founder. Consequence-driven by design.
                            </h1>
                            <p className="text-muted leading-relaxed">
                                Operator Uplift is built by one person. The product preaches forced follow-through, so the company runs on it too.
                            </p>
                        </div>
                    </FadeIn>

                    {/* Founders grid */}
                    <FadeIn delay={150}>
                        <section aria-labelledby="founders-heading" className="mb-12">
                            <h2 id="founders-heading" className="text-xs font-mono font-bold tracking-[0.12em] text-foreground/60 uppercase mb-6 text-center">
                                // Founder
                            </h2>
                            <ul className="grid grid-cols-1 max-w-2xl mx-auto gap-4 list-none p-0">
                                {FOUNDERS.map((person) => (
                                    <li key={person.name}>
                                        <PersonCard person={person} />
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </FadeIn>

                    {/* The "why" callout, verbatim from v10 deck slide 11. */}
                    <FadeIn delay={200}>
                        <section className="mb-20 max-w-2xl mx-auto">
                            <div className="rounded-2xl border border-[#F08A4C]/30 bg-[#F08A4C]/[0.04] p-6 md:p-8 text-center">
                                <div className="text-xs font-mono font-bold tracking-[0.12em] text-[#F08A4C] uppercase mb-3">
                                    // the why
                                </div>
                                <blockquote className="mx-auto max-w-[640px] text-base md:text-lg text-foreground leading-relaxed">
                                    &ldquo;I built this because I was tired of lying to myself. Motivation failed me. I needed a system that punished me for missing the mark. It worked, so I productized it.&rdquo;
                                </blockquote>
                                <div className="mt-4 text-xs font-mono tracking-wider uppercase text-foreground/60">
                                    Matthew Sim, founder
                                </div>
                            </div>
                        </section>
                    </FadeIn>

                    {/* Advisors */}
                    <FadeIn delay={300}>
                        <section aria-labelledby="advisors-heading" className="mb-20">
                            <h2 id="advisors-heading" className="text-xs font-mono font-bold tracking-[0.12em] text-foreground/60 uppercase mb-6 text-center">
                                // Advisors
                            </h2>
                            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0">
                                {ADVISORS.map((person) => (
                                    <li key={person.name}>
                                        <PersonCard person={person} />
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </FadeIn>

                    {/* Values strip */}
                    <FadeIn delay={350}>
                        <section aria-labelledby="values-heading" className="mb-16">
                            <h2 id="values-heading" className="text-xs font-mono font-bold tracking-[0.12em] text-foreground/60 uppercase mb-6 text-center">
                                // How we work
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {VALUES.map((value) => (
                                    <div key={value.title} className="rounded-2xl border border-[#F08A4C]/20 bg-[#F08A4C]/[0.03] p-6">
                                        <h3 className="text-sm font-semibold text-foreground mb-2">{value.title}</h3>
                                        <p className="text-sm text-muted leading-relaxed">{value.body}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </FadeIn>

                    {/* Closing CTA */}
                    <FadeIn delay={450}>
                        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-8 md:p-12 text-center">
                            <h2 className="text-2xl md:text-3xl font-medium text-foreground mb-3 tracking-tight">
                                Want in?
                            </h2>
                            <p className="text-muted leading-relaxed max-w-xl mx-auto mb-8">
                                Join the waitlist for the next release. Drop a note at <a className="text-primary hover:underline" href="mailto:operatoruplift@gmail.com">operatoruplift@gmail.com</a> if you want to invest, advise, or build with us.
                            </p>
                            <Link
                                href="/waitlist"
                                className="inline-flex items-center px-7 py-3.5 bg-primary text-white font-bold text-sm rounded-lg hover:bg-primary/90 transition-colors uppercase tracking-wide shadow-[0_0_24px_rgba(240, 138, 76,0.25)]"
                            >
                                Join the waitlist
                                <ArrowRight aria-hidden className="ml-2 w-4 h-4" />
                            </Link>
                        </div>
                    </FadeIn>
                </div>
            </main>

            <Footer />
        </div>
    );
}
