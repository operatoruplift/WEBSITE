"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Store, Search, Star, Download, TrendingUp, Grid, List, Bot, ChevronDown, Sparkles, Crown, Check, Users, Loader2, ArrowRight } from 'lucide-react';
import { addNotification } from '@/lib/notifications';
import { Card, CardContent } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { GlowButton } from '@/src/components/ui/GlowButton';
import { MobilePageWrapper } from '@/src/components/mobile';
import { useToast } from '@/src/components/ui/Toast';
import { AnimatedCard, BorderBeam, Spotlight, NumberTicker } from '@/src/components/effects/MagicUI';

interface MarketplaceAgent { id: string; name: string; author: string; description: string; category: string; rating: number; reviews: number; installs: string; price: 'free' | 'pro' | 'enterprise'; tags: string[]; avatar: string; featured?: boolean; trending?: boolean; verified?: boolean; }

const CATEGORIES = ['All', 'Coding', 'Research', 'Data', 'Security', 'Voice', 'Finance', 'Content', 'DevOps'];
const priceColors: Record<string, string> = { free: 'text-green-400 bg-green-400/10 border border-green-400/20', pro: 'text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20', enterprise: 'text-[#F97316] bg-[#F97316]/10 border border-[#F97316]/20' };

const fetchMarketplaceData = async (): Promise<{ agents: MarketplaceAgent[] }> => {
    try {
        const res = await fetch('/api/agents');
        if (!res.ok) return { agents: [] };
        const data = await res.json();
        // Map Supabase fields to the component's interface
        return {
            agents: (data.agents || []).map((a: any) => ({
                id: a.id,
                name: a.name,
                author: a.author,
                description: a.description,
                category: a.category,
                rating: Number(a.rating) || 0,
                reviews: 0,
                installs: String(a.installs || 0),
                price: a.price || 'free',
                tags: a.tags || [],
                avatar: a.avatar || '🤖',
                featured: a.featured,
                trending: a.trending,
                verified: a.verified,
            })),
        };
    } catch {
        return { agents: [] };
    }
};

export default function MarketplacePage() {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'newest'>('popular');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();
    const [agents, setAgents] = useState<MarketplaceAgent[]>([]);
    const [installed, setInstalled] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchMarketplaceData().then(data => { setAgents(data.agents); setIsLoading(false); });
        try { const saved = JSON.parse(localStorage.getItem('installed-agents') || '[]'); setInstalled(new Set(saved)); } catch {}
    }, []);

    const installAgent = async (id: string, agentName: string) => {
        setInstalled(prev => { const next = new Set(prev); next.add(id); localStorage.setItem('installed-agents', JSON.stringify([...next])); return next; });
        // Also persist to API if authenticated
        const token = localStorage.getItem('token');
        if (token && token !== 'demo-token') {
            try {
                await fetch('/api/agents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ name: agentName, description: `Installed from marketplace`, source: 'marketplace' }),
                });
            } catch { /* localStorage already updated */ }
        }
        showToast(`${agentName} installed successfully`, 'success');
        addNotification({ type: 'agent', title: `${agentName} installed`, message: 'Agent added to your fleet from marketplace', icon: 'bot', color: 'text-emerald-400' });
    };

    const filtered = agents.filter(a => category === 'All' || a.category === category).filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase())).sort((a, b) => sortBy === 'rating' ? b.rating - a.rating : b.reviews - a.reviews);
    const featuredAgents = agents.filter(a => a.featured);

    return (
        <MobilePageWrapper>
            <div className="min-h-screen p-6 lg:p-8 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#F97316]/10 blur-[120px] rounded-full pointer-events-none" />
                <div className="max-w-[1400px] mx-auto space-y-8 relative z-10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeInUp">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center relative shadow-[0_0_20px_rgba(231,118,48,0.3)]" style={{ background: 'linear-gradient(135deg, #F59E0B, #F97316)' }}><Store size={20} className="text-white" /></div>
                                <Badge variant="default" className="bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20 text-[10px] tracking-widest font-mono">v2.0 ORCHESTRATION</Badge>
                                <Badge variant="default" className="bg-amber-400/10 text-amber-400 border border-amber-400/20 text-[8px] font-mono tracking-widest">DEMO</Badge>
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-medium tracking-tight text-white">Agent Marketplace</h1>
                            <p className="text-sm text-gray-400 mt-2 font-mono">Deploy pre-trained intelligences directly into your swarm architecture</p>
                        </div>
                        <Link href="/agents/builder"><GlowButton className="h-11 px-6 bg-white/5 border border-white/10 hover:bg-white/10 group transition-all"><Sparkles size={16} className="mr-2 text-[#F97316]" /><span className="font-medium tracking-wide">Build Your Own</span></GlowButton></Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
                        {[{ label: 'Available Agents', value: '2,400+', icon: Bot, gradient: 'from-[#F59E0B]/20 to-transparent', color: 'text-[#F59E0B]' },
                          { label: 'Total Installs', value: '1.2M', icon: Download, gradient: 'from-emerald-500/20 to-transparent', color: 'text-emerald-400' },
                          { label: 'Active Developers', value: '8,200', icon: Users, gradient: 'from-[#F97316]/20 to-transparent', color: 'text-[#F97316]' },
                          { label: 'Avg. Rating', value: '4.7', icon: Star, gradient: 'from-[#F97316]/20 to-transparent', color: 'text-[#F97316]' }
                        ].map(stat => { const Icon = stat.icon; return (
                            <Card key={stat.label} variant="glass" className="p-5 overflow-hidden relative group border-white/5">
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${stat.gradient} blur-2xl opacity-50 group-hover:opacity-100 transition-opacity`} />
                                <div className="relative z-10"><div className={`w-8 h-8 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center mb-3`}><Icon size={14} className={stat.color} /></div><p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p><p className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mt-1">{stat.label}</p></div>
                            </Card>
                        ); })}
                    </div>
                    <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-black/40 p-2 rounded-2xl border border-white/5 backdrop-blur-md animate-fadeInUp" style={{ animationDelay: '200ms' }}>
                        <div className="flex flex-1 w-full xl:w-auto overflow-x-auto gap-1 pb-2 xl:pb-0 scrollbar-none">
                            {CATEGORIES.map(cat => <button key={cat} onClick={() => setCategory(cat)} className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-300 ${category === cat ? 'bg-gradient-to-r from-[#F97316] to-[#F59E0B] text-white shadow-[0_0_15px_rgba(231,118,48,0.4)]' : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}>{cat}</button>)}
                        </div>
                        <div className="flex w-full xl:w-auto gap-2 shrink-0">
                            <div className="relative flex-1 xl:w-64"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents..." aria-label="Search marketplace agents" className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:border-[#F59E0B]/50 focus:outline-none transition-all" /></div>
                            <select value={sortBy} onChange={e => setSortBy(e.target.value as 'popular' | 'rating' | 'newest')} aria-label="Sort agents" className="px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-gray-300 focus:outline-none appearance-none cursor-pointer"><option value="popular">Most Popular</option><option value="rating">Highest Rated</option><option value="newest">Newest</option></select>
                            <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="px-3 rounded-xl bg-black/40 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center">{viewMode === 'grid' ? <List size={16} /> : <Grid size={16} />}</button>
                        </div>
                    </div>
                    {category === 'All' && !search && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeInUp" style={{ animationDelay: '300ms' }}>
                        {isLoading ? Array(2).fill(0).map((_, i) => <div key={i} className="h-64 rounded-2xl bg-white/5 border border-white/5 animate-pulse" />) :
                            featuredAgents.slice(0, 2).map(agent => (
                                <Card key={agent.id} variant="glass" className="relative overflow-hidden group border-white/10 hover:border-[#F97316]/30 transition-all duration-700 cursor-pointer">
                                    <BorderBeam size={250} duration={8} colorFrom="#F97316" colorTo="#F59E0B" />
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#F97316]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-r from-[#F97316] to-[#F97316] text-white text-[10px] uppercase font-bold tracking-widest rounded-bl-xl shadow-lg flex items-center gap-1.5 z-20"><Crown size={12} /> TOP TIER</div>
                                    <CardContent className="p-8 relative z-10 flex flex-col h-full justify-between">
                                        <div><div className="flex items-start gap-5"><div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-3xl shadow-xl group-hover:scale-110 transition-all duration-500">{agent.avatar}</div><div className="flex-1 mt-1"><div className="flex items-center gap-2 mb-1"><h3 className="text-xl font-medium text-white tracking-tight">{agent.name}</h3>{agent.verified && <Check size={14} className="text-[#F59E0B]" />}</div><p className="text-xs font-mono text-gray-500 uppercase tracking-wider">{agent.author}</p></div></div><p className="text-sm text-gray-300 mt-5 leading-relaxed">{agent.description}</p></div>
                                        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 text-xs font-medium"><span className="flex items-center gap-1 bg-yellow-400/10 text-yellow-400 px-2 py-1 rounded-md border border-yellow-400/20"><Star size={12} className="fill-yellow-400" /> {agent.rating}</span><span className="text-gray-400 flex items-center gap-1"><Download size={12} /> {agent.installs}</span><span className={`px-2 py-1 rounded-md uppercase tracking-wider ${priceColors[agent.price]}`}>{agent.price}</span></div>
                                            <GlowButton onClick={() => installAgent(agent.id, agent.name)} className={`text-sm px-5 ml-auto border border-white/10 ${installed.has(agent.id) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 hover:bg-white/20'}`}>
                                                {installed.has(agent.id) ? <><Check size={14} className="mr-2" /> Installed</> : <>Install Agent <ChevronDown size={14} className="ml-2" /></>}
                                            </GlowButton>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        }
                    </div>}
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-fadeInUp relative z-10' : 'space-y-3 animate-fadeInUp relative z-10'} style={{ animationDelay: '400ms' }}>
                        {isLoading ? Array(8).fill(0).map((_, i) => <div key={i} className="h-48 rounded-2xl bg-white/5 border border-white/5 animate-pulse" />) :
                            filtered.filter(a => !(category === 'All' && !search && a.featured)).map(agent => (
                                <AnimatedCard key={agent.id} className="relative p-5 h-full flex flex-col hover:border-white/20 transition-all duration-500 bg-black/60 backdrop-blur-xl cursor-pointer rounded-2xl overflow-hidden" hoverGlow>
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">{agent.avatar}</div>
                                        <div className="flex-1 min-w-0 pt-0.5"><div className="flex items-center gap-1.5 mb-1"><h3 className="text-base font-semibold text-white tracking-tight truncate group-hover:text-[#F59E0B] transition-colors">{agent.name}</h3>{agent.verified && <Check size={12} className="text-[#F59E0B] shrink-0" />}{agent.trending && <TrendingUp size={12} className="text-orange-400 shrink-0" />}</div><p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider truncate">{agent.author}</p></div>
                                    </div>
                                    <p className="text-xs text-gray-400 leading-relaxed mb-6 line-clamp-3 flex-1 group-hover:text-gray-300 transition-colors">{agent.description}</p>
                                    <div className="mt-auto">
                                        <div className="flex items-center justify-between mb-3 text-[10px] font-mono border-t border-white/5 pt-3"><div className="flex items-center gap-3"><span className="text-yellow-400 flex items-center gap-1"><Star size={10} className="fill-yellow-400" /> {agent.rating}</span><span className="text-gray-500 flex items-center gap-1"><Download size={10} /> {agent.installs}</span></div><span className={`px-2 py-0.5 rounded uppercase tracking-widest ${priceColors[agent.price]}`}>{agent.price}</span></div>
                                        <button onClick={() => installAgent(agent.id, agent.name)} className={`w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${installed.has(agent.id) ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-primary/10 hover:text-primary hover:border-primary/20'}`}>
                                            {installed.has(agent.id) ? <span className="flex items-center justify-center gap-1.5"><Check size={12} /> Installed</span> : 'Install'}
                                        </button>
                                    </div>
                                </AnimatedCard>
                            ))
                        }
                    </div>
                </div>
            </div>
        </MobilePageWrapper>
    );
}
