'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import { FadeIn } from '@/src/components/Animators';
import { Check, Zap, Clock, ArrowRight } from 'lucide-react';

interface StoreAgent {
    id: string;
    name: string;
    category: string;
    price: string;
    description: string;
    emoji: string;
    live: boolean;
}

const agents: StoreAgent[] = [
    { id: 'task', name: 'Task Manager', category: 'Productivity', price: '0.01 SOL', description: 'Organize tasks, set reminders, track deadlines automatically', emoji: '✅', live: true },
    { id: 'calendar', name: 'Calendar Agent', category: 'Scheduling', price: '0.01 SOL', description: 'Manage your calendar, schedule meetings, send invites', emoji: '📅', live: true },
    { id: 'research', name: 'Research Agent', category: 'Knowledge', price: '0.02 SOL', description: 'Deep research on any topic, summarized and saved to memory', emoji: '🔍', live: true },
    { id: 'finance', name: 'Finance Tracker', category: 'Finance', price: '0.02 SOL', description: 'Track spending, categorize transactions, generate reports', emoji: '💰', live: true },
    { id: 'code', name: 'Code Assistant', category: 'Developer', price: '0.03 SOL', description: 'Review code, suggest fixes, write tests', emoji: '💻', live: true },
    { id: 'health', name: 'Health Coach', category: 'Wellness', price: '0.02 SOL', description: 'Track habits, sleep, nutrition and give personalized recommendations', emoji: '🏃', live: false },
    { id: 'legal', name: 'Legal Assistant', category: 'Compliance', price: '0.05 SOL', description: 'Review contracts, flag risks, summarize legal documents', emoji: '⚖️', live: false },
    { id: 'music', name: 'Music Agent', category: 'Creative', price: '0.02 SOL', description: 'Generate playlists, identify songs, manage your music library', emoji: '🎵', live: false },
    { id: 'language', name: 'Language Tutor', category: 'Education', price: '0.02 SOL', description: 'Daily language practice, vocabulary drills, conversation coaching', emoji: '🌍', live: false },
    { id: 'sleep', name: 'Sleep Coach', category: 'Wellness', price: '0.01 SOL', description: 'Track sleep patterns, optimize your schedule, morning briefings', emoji: '😴', live: false },
];

export default function StorePage() {
    const [installed, setInstalled] = useState<Set<string>>(new Set());
    const [deploying, setDeploying] = useState<string | null>(null);

    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('store-installed') || '[]');
            setInstalled(new Set(saved));
        } catch { /* fresh */ }
    }, []);

    const deploy = async (agent: StoreAgent) => {
        if (!agent.live || installed.has(agent.id)) return;
        setDeploying(agent.id);
        // Simulate Solana devnet transaction (2s)
        await new Promise(r => setTimeout(r, 2000));
        const sig = Array.from({ length: 44 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789'[Math.floor(Math.random() * 58)]).join('');
        setInstalled(prev => {
            const next = new Set(prev);
            next.add(agent.id);
            localStorage.setItem('store-installed', JSON.stringify([...next]));
            return next;
        });
        setDeploying(null);
        alert(`Agent deployed! Transaction: ${sig}`);
    };

    return (
        <div className="w-full bg-background min-h-screen">
            <Navbar currentPage="store" />

            {/* Hero */}
            <section className="pt-32 pb-16 px-6 md:px-12 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 20%, rgba(231,118,48,0.15) 0%, transparent 60%)' }} />
                <div className="relative z-10 max-w-3xl mx-auto">
                    <FadeIn>
                        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest mb-6">
                            <Zap size={12} /> On-Chain Agents
                        </div>
                    </FadeIn>
                    <h1 className="text-4xl md:text-6xl font-medium text-white tracking-tight mb-4">The Agent Store</h1>
                    <p className="text-lg text-gray-400 mb-8">Deploy AI agents on-chain. Powered by Solana.</p>
                    <p className="text-xs text-gray-600 font-mono">All transactions on Solana devnet. No real funds required during beta.</p>
                </div>
            </section>

            {/* Marquee */}
            <div className="overflow-hidden py-4 border-y border-white/5">
                <div className="flex animate-marquee whitespace-nowrap">
                    {[...agents, ...agents].map((a, i) => (
                        <span key={i} className="mx-6 text-sm text-gray-600 font-mono">
                            {a.emoji} {a.name}
                        </span>
                    ))}
                </div>
            </div>

            {/* Agent Grid */}
            <section className="py-16 px-6 md:px-12 max-w-[1200px] mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <span className="text-xs font-bold tracking-widest text-primary uppercase">Live Agents</span>
                    <span className="flex-1 h-px bg-white/10" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {agents.filter(a => a.live).map((agent, i) => (
                        <FadeIn key={agent.id} delay={i * 80}>
                            <div className={`p-6 rounded-2xl border transition-all duration-300 h-full flex flex-col ${installed.has(agent.id) ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 bg-white/[0.02] hover:border-primary/30 hover:bg-primary/5'}`}>
                                <div className="flex items-start justify-between mb-4">
                                    <span className="text-3xl">{agent.emoji}</span>
                                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">{agent.category}</span>
                                </div>
                                <h3 className="text-lg font-medium text-white mb-2">{agent.name}</h3>
                                <p className="text-sm text-gray-400 mb-4 flex-1">{agent.description}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-mono text-primary">{agent.price}</span>
                                    {installed.has(agent.id) ? (
                                        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-bold"><Check size={14} /> Installed</span>
                                    ) : (
                                        <button onClick={() => deploy(agent)} disabled={deploying === agent.id}
                                            className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold uppercase tracking-widest hover:bg-primary/80 transition-colors shadow-[0_0_15px_rgba(231,118,48,0.3)] disabled:opacity-50">
                                            {deploying === agent.id ? 'Deploying...' : 'Deploy with SOL'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </FadeIn>
                    ))}
                </div>

                <div className="flex items-center gap-3 mb-8">
                    <span className="text-xs font-bold tracking-widest text-gray-500 uppercase">Coming Soon</span>
                    <span className="flex-1 h-px bg-white/10" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agents.filter(a => !a.live).map((agent, i) => (
                        <FadeIn key={agent.id} delay={i * 80}>
                            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] opacity-60 h-full flex flex-col">
                                <div className="flex items-start justify-between mb-4">
                                    <span className="text-3xl grayscale">{agent.emoji}</span>
                                    <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">{agent.category}</span>
                                </div>
                                <h3 className="text-lg font-medium text-gray-400 mb-2">{agent.name}</h3>
                                <p className="text-sm text-gray-600 mb-4 flex-1">{agent.description}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-mono text-gray-600">{agent.price}</span>
                                    <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
                                        <Clock size={12} className="inline mr-1" /> Notify Me
                                    </button>
                                </div>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 px-6 md:px-12 text-center">
                <p className="text-gray-500 mb-4">Want to build your own agent?</p>
                <Link href="/agents/builder" className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors">
                    Open Agent Builder <ArrowRight size={14} />
                </Link>
            </section>

            <Footer />
        </div>
    );
}
