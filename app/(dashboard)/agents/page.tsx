"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bot, Plus, Search, Play, Pause, Settings, Trash2, Activity, Clock, Zap, MoreHorizontal, Star } from 'lucide-react';
import { Card, CardContent } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { GlowButton } from '@/src/components/ui/GlowButton';
import { MobilePageWrapper } from '@/src/components/mobile';
import { useToast } from '@/src/components/ui/Toast';

interface Agent {
    id: string;
    name: string;
    description: string;
    status: 'running' | 'idle' | 'error' | 'stopped';
    model: string;
    lastActive: string;
    sessions: number;
    memoryUsage: string;
    favorite: boolean;
}

const DEMO_AGENTS: Agent[] = [
    { id: '1', name: 'CodePilot Pro', description: 'Full-stack code generation and debugging assistant', status: 'running', model: 'Claude Opus 4.6', lastActive: 'Now', sessions: 142, memoryUsage: '2.4GB', favorite: true },
    { id: '2', name: 'Research Assistant', description: 'Multi-source academic research and synthesis', status: 'running', model: 'GPT-4.1', lastActive: '2m ago', sessions: 89, memoryUsage: '1.8GB', favorite: true },
    { id: '3', name: 'Blackwall Guard', description: 'Real-time API security and threat detection', status: 'running', model: 'Claude Opus 4.6', lastActive: '5m ago', sessions: 2847, memoryUsage: '512MB', favorite: false },
    { id: '4', name: 'Data Analyst', description: 'SQL generation, visualization, and insight extraction', status: 'idle', model: 'Gemini 2.5 Pro', lastActive: '1h ago', sessions: 56, memoryUsage: '3.1GB', favorite: false },
    { id: '5', name: 'Content Writer', description: 'Blog posts, docs, and marketing copy generation', status: 'idle', model: 'Claude Opus 4.6', lastActive: '3h ago', sessions: 34, memoryUsage: '890MB', favorite: false },
    { id: '6', name: 'DevOps Monitor', description: 'K8s cluster monitoring and auto-remediation', status: 'error', model: 'Llama 3.3', lastActive: '12h ago', sessions: 12, memoryUsage: '256MB', favorite: false },
    { id: '7', name: 'Meeting Summarizer', description: 'Transcribes and summarizes video calls', status: 'stopped', model: 'Grok 3', lastActive: '2d ago', sessions: 8, memoryUsage: '0MB', favorite: false },
];

const statusConfig: Record<string, { color: string; bg: string; label: string; pulse?: boolean }> = {
    running: { color: 'text-emerald-400', bg: 'bg-emerald-400', label: 'Running', pulse: true },
    idle: { color: 'text-amber-400', bg: 'bg-amber-400', label: 'Idle' },
    error: { color: 'text-red-400', bg: 'bg-red-400', label: 'Error', pulse: true },
    stopped: { color: 'text-gray-500', bg: 'bg-gray-500', label: 'Stopped' },
};

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>(DEMO_AGENTS);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'running' | 'idle' | 'error'>('all');
    const { showToast } = useToast();

    const filtered = agents.filter(a => {
        const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'all' || a.status === filter;
        return matchSearch && matchFilter;
    });

    const toggleAgent = (id: string) => {
        setAgents(prev => prev.map(a => {
            if (a.id !== id) return a;
            const newStatus = a.status === 'running' ? 'idle' : 'running';
            showToast(`${a.name} ${newStatus === 'running' ? 'started' : 'paused'}`, newStatus === 'running' ? 'success' : 'info');
            return { ...a, status: newStatus, lastActive: newStatus === 'running' ? 'Now' : 'Just now' };
        }));
    };

    const toggleFavorite = (id: string) => {
        setAgents(prev => prev.map(a => a.id === id ? { ...a, favorite: !a.favorite } : a));
    };

    return (
        <MobilePageWrapper>
            <div className="min-h-screen p-6 lg:p-8">
                <div className="max-w-[1400px] mx-auto space-y-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fadeInUp">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Bot size={16} className="text-[#E77630]" />
                                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Fleet</span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-white">My Agents</h1>
                            <p className="text-sm text-gray-400 mt-1">{agents.filter(a => a.status === 'running').length} running, {agents.length} total</p>
                        </div>
                        <Link href="/agents/builder">
                            <GlowButton className="h-11 px-5"><Plus size={16} className="mr-2" /> Create Agent</GlowButton>
                        </Link>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents..." aria-label="Search agents" className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none transition-colors" />
                        </div>
                        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                            {(['all', 'running', 'idle', 'error'] as const).map(f => (
                                <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all ${filter === f ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>{f}</button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        {filtered.map((agent, i) => {
                            const status = statusConfig[agent.status];
                            return (
                                <Card key={agent.id} variant="glass" className="card-animate group hover:border-white/10 transition-all" style={{ animationDelay: `${i * 60}ms` }}>
                                    <CardContent className="p-5">
                                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-[#E77630]/10 border border-white/5 flex items-center justify-center flex-shrink-0 relative">
                                                    <Bot size={20} className="text-white" />
                                                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${status.bg} border-2 border-[#0a0a0f] ${status.pulse ? 'animate-pulse' : ''}`} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <h3 className="text-white font-semibold truncate">{agent.name}</h3>
                                                        <Badge variant="default" className={`text-[9px] ${status.color} bg-white/5 border border-white/10`}>{status.label}</Badge>
                                                        {agent.favorite && <Star size={12} className="text-amber-400 fill-amber-400" />}
                                                    </div>
                                                    <p className="text-sm text-gray-400 truncate">{agent.description}</p>
                                                    <div className="flex items-center gap-4 mt-1.5 text-[10px] font-mono text-gray-500">
                                                        <span>{agent.model}</span>
                                                        <span className="flex items-center gap-1"><Clock size={9} />{agent.lastActive}</span>
                                                        <span className="flex items-center gap-1"><Zap size={9} />{agent.sessions} sessions</span>
                                                        <span className="flex items-center gap-1"><Activity size={9} />{agent.memoryUsage}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <button onClick={() => toggleFavorite(agent.id)} className={`p-2 rounded-lg transition-colors ${agent.favorite ? 'bg-amber-400/10 text-amber-400' : 'bg-white/5 text-gray-500 hover:text-amber-400'}`}><Star size={14} /></button>
                                                <button onClick={() => toggleAgent(agent.id)} className={`p-2 rounded-lg transition-colors ${agent.status === 'running' ? 'bg-amber-400/10 text-amber-400 hover:bg-amber-400/20' : 'bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20'}`}>
                                                    {agent.status === 'running' ? <Pause size={14} /> : <Play size={14} />}
                                                </button>
                                                <Link href="/settings" className="p-2 rounded-lg bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-colors"><Settings size={14} /></Link>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>
        </MobilePageWrapper>
    );
}
