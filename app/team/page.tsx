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

const FOUNDERS: TeamMember[] = [
    {
        name: 'Matthew Sim',
        role: 'Founder, CEO',
        bio: 'Built LevelUp before Operator Uplift and validated it at the Sellathon. Spends his time making sure ambitious people finish what they start.',
    },
    {
        name: 'Olawale Olapo',
        role: 'CPO',
        bio: 'Product design and behavioral engagement. Cares about the difference between a daily habit and a daily nag.',
    },
    {
        name: 'Paul Balogun',
        role: 'CBO',
        bio: 'Business, partnerships, and the conversations that turn pilots into contracts.',
    },
    {
        name: 'Francesca Centini',
        role: 'CCO, Communications',
        bio: 'Brand, story, and how the product sounds when nobody is in the room.',
    },
    {
        name: 'Matus Remis',
        role: 'COO',
        bio: 'Operations and the unglamorous infrastructure that keeps the lights on.',
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
        <div className="theme-light min-h-screen bg-background text-foreground">
            <Navbar currentPage="team" />

            <main className="pt-32 pb-24 px-6 md:px-12">
                <div className="max-w-[1100px] mx-auto">
                    {/* Header */}
                    <FadeIn>
                        <div className="text-center mb-16 mx-auto max-w-2xl">
                            <div className="inline-flex items-center gap-3 mb-4">
                                <span className="h-px w-16 bg-[#F97316]/40" aria-hidden />
                                <span className="text-xs font-bold tracking-[0.25em] text-[#F97316] uppercase">The team</span>
                                <span className="h-px w-16 bg-[#F97316]/40" aria-hidden />
                            </div>
                            <h1 className="text-3xl md:text-5xl font-medium text-foreground mb-4 tracking-tight leading-[1.1]">
                                The operators behind Operator Uplift
                            </h1>
                            <p className="text-muted leading-relaxed">
                                A small founding team and one advisor. We are building the platform we wish existed when our own goals stalled in week two.
                            </p>
                        </div>
                    </FadeIn>

                    {/* Founders grid */}
                    <FadeIn delay={150}>
                        <section aria-labelledby="founders-heading" className="mb-20">
                            <h2 id="founders-heading" className="text-xs font-bold tracking-[0.25em] text-foreground/60 uppercase mb-6">
                                Founding team
                            </h2>
                            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0">
                                {FOUNDERS.map((person) => (
                                    <li key={person.name}>
                                        <PersonCard person={person} />
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </FadeIn>

                    {/* Advisors */}
                    <FadeIn delay={250}>
                        <section aria-labelledby="advisors-heading" className="mb-20">
                            <h2 id="advisors-heading" className="text-xs font-bold tracking-[0.25em] text-foreground/60 uppercase mb-6">
                                Advisors
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
                            <h2 id="values-heading" className="text-xs font-bold tracking-[0.25em] text-foreground/60 uppercase mb-6">
                                How we work
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {VALUES.map((value) => (
                                    <div key={value.title} className="rounded-2xl border border-[#F97316]/20 bg-[#F97316]/[0.03] p-6">
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
                                className="inline-flex items-center px-7 py-3.5 bg-primary text-white font-bold text-sm rounded-lg hover:bg-primary/90 transition-colors uppercase tracking-wide shadow-[0_0_24px_rgba(249,115,22,0.25)]"
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
