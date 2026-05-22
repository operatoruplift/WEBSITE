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
 * v10 reframe (2026-05-21 Commitment Infrastructure): the page used
 * to lead with "ask anything" AI-assistant framing. v10 reframes
 * iMessage as the daily honor check-in channel for the commitment
 * protocol. The Gmail / Calendar tools still ship and stay in the
 * "What you can text today" list (per imessage-page.spec), but the
 * primary pitch is "honor your commitments by text" now.
 */
export default function IMessageLanding() {
    return (
        <div className="relative w-full bg-background min-h-screen text-foreground">
            <Navbar currentPage="imessage" />

            <main className="pt-32 pb-24 px-6 md:px-12">
                <div className="max-w-[1100px] mx-auto">
                    {/* Header: eyebrow + gradient h1 + sub-line */}
                    <div className="text-center mb-16 mx-auto max-w-2xl">
                        <FadeIn>
                            <div className="inline-flex items-center gap-3 mb-4">
                                <span className="h-px w-16 bg-[#F97316]/40" />
                                <span className="text-xs font-bold tracking-[0.25em] text-[#F97316] uppercase">// Daily check-in channel</span>
                                <span className="h-px w-16 bg-[#F97316]/40" />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-medium text-foreground bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text [-webkit-text-fill-color:transparent] mb-4 tracking-tight leading-[1.05]">
                                Text Operator Uplift like a friend
                            </h1>
                            <p className="text-muted leading-relaxed text-lg">
                                The AI Game Master pings you over iMessage. You reply YES, NO, or a photo, and the protocol settles your commitment. No app to install. No browser tab to keep open.
                            </p>
                        </FadeIn>
                    </div>

                    {/* Three feature columns */}
                    <FadeIn delay={100} className="w-full">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-20">
                            <FeatureCard
                                icon={<Zap className="w-5 h-5" />}
                                title="Two-tap setup"
                                body="Save the iMessage number once. The Game Master pings you on the cadence your commitment specifies. No sign-in or app to install."
                            />
                            <FeatureCard
                                icon={<MessageSquare className="w-5 h-5" />}
                                title="Honors STOP"
                                body="Standard SMS opt-out works. Send STOP to pause check-ins; START to resume. HELP returns a one-line orientation."
                            />
                            <FeatureCard
                                icon={<ShieldCheck className="w-5 h-5" />}
                                title="Plain text only"
                                body="iMessage doesn't render markdown, so we strip it before sending. What you see in the message bubble is exactly what the Game Master wrote."
                            />
                        </div>
                    </FadeIn>

                    {/* How it works */}
                    <FadeIn delay={200} className="w-full">
                        <div className="rounded-2xl border border-foreground/[0.08] bg-foreground/[0.02] p-8 md:p-12 mb-20">
                            <h2 className="text-2xl md:text-3xl font-medium text-foreground tracking-tight mb-2">How the round trip works</h2>
                            <p className="text-muted mb-8">
                                The Game Master pings you on schedule. You reply. The protocol settles. About 3 seconds end to end on every leg.
                            </p>
                            <ol className="space-y-4 text-sm">
                                <Step n={1} text="You send an iMessage to the bot's number." />
                                <Step n={2} text="Our iMessage bridge forwards the message to operatoruplift.com over HTTPS with an HMAC-signed body so we can verify it actually came from your phone." />
                                <Step n={3} text="The webhook checks 5 stages in order: opt-out, pending YES/NO, keyword (STOP/HELP/PING), intent (set_zodiac/weather/email_draft), and falls back to Claude Haiku 4.5 with multi-turn history." />
                                <Step n={4} text="The reply gets stripped of any stray markdown, then handed back to the iMessage bridge to deliver to your phone." />
                            </ol>
                        </div>
                    </FadeIn>

                    {/* What works today block */}
                    <FadeIn delay={250} className="w-full">
                        <div className="mb-12">
                            <h2 className="text-xl md:text-2xl font-medium text-foreground tracking-tight mb-4">What you can text today</h2>
                            <ul className="space-y-3 text-sm text-muted leading-relaxed">
                                <li>
                                    <span className="text-foreground font-medium">Daily check-ins.</span> The Game Master pings you on the cadence your commitment specifies. Reply YES, NO, or send a photo as evidence. Multi-turn context lets you push back, ask for an extension, or escalate to a witness.
                                </li>
                                <li>
                                    <span className="text-foreground font-medium">Save preferences.</span> &quot;I&apos;m a leo&quot; saves your zodiac. &quot;I&apos;m in San Francisco&quot; saves your location. &quot;Switch to sonnet&quot; changes the model. Or edit them in the dashboard at /integrations.
                                </li>
                                <li>
                                    <span className="text-foreground font-medium">Weather.</span> &quot;What&apos;s the weather in Austin&quot; pulls a current forecast via Open-Meteo (keyless) or OpenWeatherMap.
                                </li>
                                <li>
                                    <span className="text-foreground font-medium">Gmail drafts.</span> &quot;Draft an email to mom@example.com saying I&apos;ll be late&quot; stages a Gmail draft, asks YES, then writes the draft into your real Gmail account.
                                </li>
                                <li>
                                    <span className="text-foreground font-medium">Gmail sends.</span> &quot;Send an email to alice@team.com saying I&apos;m running late&quot; stages a draft, asks YES, then sends it from your address. Same check-in pattern as commitment honor.
                                </li>
                                <li>
                                    <span className="text-foreground font-medium">Calendar events.</span> &quot;Schedule a meeting tomorrow at 3pm for 30 minutes&quot; stages the event, asks YES, then writes it onto your real calendar.
                                </li>
                                <li>
                                    <span className="text-foreground font-medium">Daily summaries.</span> Across model swaps. The bot remembers stable preferences and topics from prior turns even when you switch the model in the dropdown.
                                </li>
                            </ul>
                        </div>
                    </FadeIn>

                    {/* Roadmap honesty block */}
                    <FadeIn delay={300} className="w-full">
                        <div className="mb-20">
                            <h2 className="text-xl md:text-2xl font-medium text-foreground tracking-tight mb-4">What&apos;s not here yet</h2>
                            <ul className="space-y-3 text-sm text-muted leading-relaxed">
                                <li>
                                    <span className="text-foreground font-medium">Slack and Discord.</span> Our message bridge already handles Telegram and WhatsApp; Slack and Discord adapters are roadmap. The agent code is platform-agnostic so this is wiring, not a rewrite.
                                </li>
                                <li>
                                    <span className="text-foreground font-medium">Tauri desktop binary.</span> A Tauri config exists but the native binary is not yet building. The web app is the canonical surface today.
                                </li>
                                <li>
                                    <span className="text-foreground font-medium">A friendly public number.</span> The agent number is configured per project. We&apos;ll publish the public number when iMessage onboarding is open beyond the team.
                                </li>
                            </ul>
                        </div>
                    </FadeIn>

                    {/* CTA tile, mirrors FinalCta cream pattern */}
                    <FadeIn delay={400} className="w-full">
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
