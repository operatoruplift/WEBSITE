'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, MessageSquare, ShieldCheck, Zap } from 'lucide-react';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import { FadeIn } from '@/src/components/Animators';

/**
 * /imessage marketing landing page.
 *
 * Pitches the iMessage agent as a standalone surface so a visitor
 * who arrives from "text the bot" copy doesn't have to scroll the
 * homepage to find the relevant pitch. Uses the same theme-light
 * wrapper, eyebrow + gradient h1 pattern, and FinalCta-style cream
 * tile that the rest of the marketing site commits to.
 *
 * Honest framing: the bot replies with Claude Haiku one-shot today.
 * Multi-turn memory and Gmail/Calendar tool-use over iMessage are
 * roadmap items called out below the fold so we don't overpromise.
 */
export default function IMessageLanding() {
    return (
        <div className="theme-light w-full bg-background min-h-screen">
            <Navbar currentPage="imessage" />

            <main className="pt-32 pb-24 px-6 md:px-12">
                <div className="max-w-[1100px] mx-auto">
                    {/* Header: eyebrow + gradient h1 + sub-line */}
                    <div className="text-center mb-16 mx-auto max-w-2xl">
                        <FadeIn>
                            <div className="inline-flex items-center gap-3 mb-4">
                                <span className="h-px w-16 bg-[#F97316]/40" />
                                <span className="text-xs font-bold tracking-[0.25em] text-[#F97316] uppercase">iMessage Agent</span>
                                <span className="h-px w-16 bg-[#F97316]/40" />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-medium text-foreground bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text [-webkit-text-fill-color:transparent] mb-4 tracking-tight leading-[1.05]">
                                Text Operator Uplift like a friend
                            </h1>
                            <p className="text-muted leading-relaxed text-lg">
                                The bot lives in iMessage. Ask anything in plain English and get a Claude Haiku reply back in 2 to 4 seconds. No app to install. No browser tab to keep open.
                            </p>
                        </FadeIn>
                    </div>

                    {/* Three feature columns */}
                    <FadeIn delay={100}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-20">
                            <FeatureCard
                                icon={<Zap className="w-5 h-5" />}
                                title="Two-tap setup"
                                body="Save the iMessage number once. Text it whenever. The bot answers within seconds, no sign-in or app to install."
                            />
                            <FeatureCard
                                icon={<MessageSquare className="w-5 h-5" />}
                                title="Honors STOP"
                                body="Standard SMS opt-out works. Send STOP to pause replies; START to resume. HELP returns a one-line orientation."
                            />
                            <FeatureCard
                                icon={<ShieldCheck className="w-5 h-5" />}
                                title="Plain text only"
                                body="iMessage doesn't render markdown, so we strip it before sending. What you see in the message bubble is exactly what the bot wrote."
                            />
                        </div>
                    </FadeIn>

                    {/* How it works */}
                    <FadeIn delay={200}>
                        <div className="rounded-2xl border border-foreground/[0.08] bg-foreground/[0.02] p-8 md:p-12 mb-20">
                            <h2 className="text-2xl md:text-3xl font-medium text-foreground tracking-tight mb-2">How the round trip works</h2>
                            <p className="text-muted mb-8">
                                You text. We forward. Claude replies. You read. About 3 seconds end to end.
                            </p>
                            <ol className="space-y-4 text-sm">
                                <Step n={1} text="You send an iMessage to the bot's number." />
                                <Step n={2} text="Photon Spectrum POSTs the message to operatoruplift.com over HTTPS with an HMAC-signed body." />
                                <Step n={3} text="The webhook drops the row into Supabase, then awaits Claude Haiku 4.5 with a 200-token cap." />
                                <Step n={4} text="The reply gets stripped of any stray markdown, then handed to Photon to deliver back to your phone." />
                            </ol>
                        </div>
                    </FadeIn>

                    {/* Roadmap honesty block */}
                    <FadeIn delay={300}>
                        <div className="mb-20">
                            <h2 className="text-xl md:text-2xl font-medium text-foreground tracking-tight mb-4">What's not here yet</h2>
                            <ul className="space-y-3 text-sm text-muted leading-relaxed">
                                <li>
                                    <span className="text-foreground font-medium">Multi-turn memory.</span> Each message is one-shot today. The bot doesn't remember last week's request, or last hour's. Threading is on the roadmap.
                                </li>
                                <li>
                                    <span className="text-foreground font-medium">Gmail / Calendar via iMessage.</span> Those tool calls live in the web app at /chat, where every action waits for a tap and produces a signed receipt. Texting the bot to "draft an email" routes back to the web today.
                                </li>
                                <li>
                                    <span className="text-foreground font-medium">A friendly number.</span> The Spectrum bridge is configured per project. We'll publish the public number when iMessage onboarding is open beyond the team.
                                </li>
                            </ul>
                        </div>
                    </FadeIn>

                    {/* CTA tile, mirrors FinalCta cream pattern */}
                    <FadeIn delay={400}>
                        <div className="rounded-3xl border border-foreground/[0.08] bg-[#F7F6F0] px-8 md:px-16 py-16 md:py-20 flex flex-col items-center text-center">
                            <span className="text-xs font-mono tracking-[0.25em] text-foreground/60 uppercase mb-6">
                                Try it from your phone
                            </span>
                            <h2 className="text-3xl md:text-4xl font-medium text-foreground tracking-tight max-w-xl mb-6 leading-[1.1]">
                                Sign up to get the iMessage number
                            </h2>
                            <p className="text-muted leading-relaxed max-w-lg mb-10">
                                Open the web app first; we hand the iMessage number to verified accounts so the bot can match incoming texts to a profile.
                            </p>
                            <Link
                                href="/login?returnTo=/integrations"
                                className="inline-flex items-center px-7 py-3.5 bg-primary text-white font-bold text-sm rounded-lg hover:bg-primary/90 transition-colors uppercase tracking-wide shadow-[0_0_24px_rgba(249,115,22,0.25)]"
                            >
                                Sign in to claim a number
                                <ArrowRight className="ml-2 w-4 h-4" aria-hidden="true" />
                            </Link>
                        </div>
                    </FadeIn>
                </div>
            </main>

            <Footer />
        </div>
    );
}

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
    return (
        <div className="p-6 rounded-2xl border border-foreground/10 bg-foreground/[0.02]">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4" aria-hidden="true">
                {icon}
            </div>
            <h3 className="text-base font-medium text-foreground mb-2">{title}</h3>
            <p className="text-sm text-muted leading-relaxed">{body}</p>
        </div>
    );
}

function Step({ n, text }: { n: number; text: string }) {
    return (
        <li className="flex items-start gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full border border-foreground/15 bg-foreground/5 flex items-center justify-center text-xs font-mono text-foreground/70">
                {n}
            </span>
            <span className="text-foreground/85 leading-relaxed pt-1">{text}</span>
        </li>
    );
}
