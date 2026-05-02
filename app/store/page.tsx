'use client';

import Link from 'next/link';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import { FadeIn } from '@/src/components/Animators';
import { Zap, ArrowRight } from 'lucide-react';
import { listStoreAgents, chatDeepLink } from '@/config/agents';

/**
 * Public store page. Surfaces the LIVE_AGENTS registry from
 * config/agents.ts so the public surface, the dashboard /agents page,
 * and the chat-deeplinker all read from a single source of truth.
 *
 * Earlier versions of this file shipped a hand-written list of 10
 * agents (Task Manager, Calendar, Researcher, Finance Tracker, Code
 * Assistant, Health Coach, Legal Assistant, Music, Language Tutor,
 * Sleep Coach) that didn't exist in the registry. The "Install" button
 * was a 2-second fake setTimeout that wrote the agent id to
 * localStorage and toasted "X installed" without doing anything else.
 *
 * Now: only the real, isLive=true agents render here, and the CTA
 * deeplinks into /chat with the agent's testPrompt seeded so the
 * visitor immediately sees the agent doing work in demo mode.
 */
export default function StorePage() {
    const agents = listStoreAgents();

    return (
        <div className="theme-light w-full bg-background min-h-screen">
            <Navbar currentPage="store" />

            {/* Hero */}
            <section className="pt-32 pb-16 px-6 md:px-12 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 20%, rgba(231,118,48,0.15) 0%, transparent 60%)' }} />
                <div className="relative z-10 max-w-3xl mx-auto">
                    <FadeIn>
                        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest mb-6">
                            <Zap size={12} /> Built-in helpers
                        </div>
                    </FadeIn>
                    <h1 className="text-4xl md:text-6xl font-medium text-white tracking-tight mb-4">Helpers</h1>
                    <p className="text-lg text-gray-400 mb-8">AI helpers for the parts of your day you&apos;d rather not handle yourself.</p>
                    <p className="text-xs text-gray-600 font-mono">Free during beta. Try any helper in chat without signing up.</p>
                </div>
            </section>

            {/* Marquee */}
            <div className="overflow-hidden py-4 border-y border-white/5">
                <div className="flex animate-marquee whitespace-nowrap">
                    {[...agents, ...agents].map((a, i) => (
                        <span key={i} className="mx-6 text-sm text-gray-600 font-mono">
                            {a.avatar} {a.name}
                        </span>
                    ))}
                </div>
            </div>

            {/* Agent Grid */}
            <section className="py-16 px-6 md:px-12 max-w-[1200px] mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <span className="text-xs font-bold tracking-widest text-primary uppercase">Live now</span>
                    <span className="flex-1 h-px bg-white/10" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {agents.map((agent, i) => (
                        <FadeIn key={agent.id} delay={i * 80}>
                            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 h-full flex flex-col">
                                <div className="flex items-start justify-between mb-4">
                                    <span className="text-3xl">{agent.avatar}</span>
                                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">{agent.category}</span>
                                </div>
                                <h3 className="text-lg font-medium text-white mb-2">{agent.name}</h3>
                                <p className="text-sm text-gray-400 mb-4 flex-1">{agent.description}</p>
                                {agent.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {agent.tags.slice(0, 3).map(tag => (
                                            <span key={tag} className="text-[10px] font-mono text-gray-500 uppercase bg-white/[0.04] px-2 py-0.5 rounded">{tag}</span>
                                        ))}
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-mono text-primary">Free in beta</span>
                                    <Link href={chatDeepLink(agent)}
                                        className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold uppercase tracking-widest hover:bg-primary/80 transition-colors shadow-[0_0_15px_rgba(231,118,48,0.3)] inline-flex items-center gap-1">
                                        Try in chat <ArrowRight size={12} />
                                    </Link>
                                </div>
                            </div>
                        </FadeIn>
                    ))}
                </div>

                <p className="text-xs text-gray-600 text-center font-mono">
                    More helpers ship as the registry grows. The list above is the canonical set, no placeholders, no &ldquo;coming soon&rdquo; stubs.
                </p>
            </section>

            {/* CTA */}
            <section className="py-16 px-6 md:px-12 text-center">
                <p className="text-gray-500 mb-4">Want to build your own helper?</p>
                {/* `bg-white text-black` rendered as a white button on
                    the page's `.theme-light` surface (the wrapper does
                    not flip plain `bg-white`, only `bg-white/N` opacity
                    variants). Switch to `bg-foreground` / `bg-background`
                    so the CTA is a high-contrast inverted button on
                    both themes. */}
                <Link href="/agents/builder" className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-foreground/90 transition-colors">
                    Build your own <ArrowRight size={14} />
                </Link>
            </section>

            <Footer />
        </div>
    );
}
