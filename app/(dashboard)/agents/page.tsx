"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bot, Plus, Search, Settings, Star, ArrowRight, Check } from 'lucide-react';
import { Card, CardContent } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { GlowButton } from '@/src/components/ui/GlowButton';
import { MobilePageWrapper } from '@/src/components/mobile';
import { useToast } from '@/src/components/ui/Toast';
import { listStoreAgents, dependencyRoute, chatDeepLink, type LiveAgent } from '@/config/agents';

/**
 * Dashboard /agents page. Lists live agents from config/agents.ts.
 *
 * Live agents are the single source of truth. Fake sessions / memory-usage
 * counters and "coming soon" placeholders are out: every card here routes
 * to a working in-app experience. Clicking lands in /chat with the agent's
 * test prompt pre-filled, or redirects to a calm gating screen when a
 * dependency is missing.
 */

interface Capabilities {
    capability_google: boolean;
    capability_key: boolean;
    capability_real: boolean;
    authenticated: boolean;
}

const DEMO_CAPS: Capabilities = {
    capability_google: false,
    capability_key: false,
    capability_real: false,
    authenticated: false,
};

// Lazy initializer reads localStorage once during the first client
// render. Avoids the setState-in-effect cascading-render warning that
// the previous load-on-mount pattern triggered.
function loadInitialFavorites(): Set<string> {
    if (typeof window === 'undefined') return new Set();
    try {
        const saved: string[] = JSON.parse(localStorage.getItem('agent-favorites') || '[]');
        return new Set(saved);
    } catch { return new Set(); }
}

export default function AgentsPage() {
    const [search, setSearch] = useState('');
    const [favorites, setFavorites] = useState<Set<string>>(loadInitialFavorites);
    const [caps, setCaps] = useState<Capabilities>(DEMO_CAPS);
    const { showToast } = useToast();
    const router = useRouter();

    const agents = listStoreAgents();

    // Capability fetch is a real async side effect, it stays in
    // useEffect. The favorites read moved to a lazy initializer above
    // so we don't trigger an unnecessary re-render on mount.
    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) { setCaps(DEMO_CAPS); return; }
        fetch('/api/capabilities', {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
        })
            .then(r => r.json())
            .then((data: Capabilities) => setCaps(data))
            .catch(() => setCaps(DEMO_CAPS));
    }, []);

    const toggleFavorite = (id: string) => {
        setFavorites(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            try { localStorage.setItem('agent-favorites', JSON.stringify([...next])); } catch {}
            return next;
        });
    };

    const openAgent = (agent: LiveAgent) => {
        const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('token');
        const gate = dependencyRoute(agent, {
            hasToken,
            hasGoogle: caps.capability_google,
            hasKey: caps.capability_key,
        });
        if (gate) {
            showToast(`${agent.name} needs a quick setup step.`, 'info');
            router.push(gate);
            return;
        }
        router.push(chatDeepLink(agent));
    };

    const filtered = agents.filter(a =>
        !search ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.description.toLowerCase().includes(search.toLowerCase()) ||
        a.tags.some(t => t.toLowerCase().includes(search.toLowerCase())),
    );

    const liveCount = agents.length;

    return (
        <MobilePageWrapper>
            <div className="min-h-screen p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Bot size={16} className="text-[#F97316]" />
                                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Agents</span>
                                <span className="text-[8px] font-mono font-bold tracking-widest uppercase px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                    {liveCount} live
                                </span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-medium tracking-tight text-white">My Helpers</h1>
                            <p className="text-sm text-gray-400 mt-1">Each one is hooked up and ready. Tap to try it.</p>
                        </div>
                        <Link href="/agents/builder">
                            <GlowButton className="h-11 px-5"><Plus size={16} className="mr-2" /> Build a helper</GlowButton>
                        </Link>
                    </div>

                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search agents..."
                            aria-label="Search agents"
                            className="w-full bg-foreground/[0.04] border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" data-testid="agent-store-grid">
                        {filtered.map(agent => {
                            const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('token');
                            const gate = dependencyRoute(agent, {
                                hasToken,
                                hasGoogle: caps.capability_google,
                                hasKey: caps.capability_key,
                            });
                            const fav = favorites.has(agent.id);
                            return (
                                <div key={agent.id} data-testid={`agent-card-${agent.id}`}>
                                <Card
                                    variant="glass"
                                    className="group hover:border-primary/30 transition-all"
                                >
                                    <CardContent className="p-5">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-12 h-12 rounded-xl bg-foreground/[0.04] border border-white/10 flex items-center justify-center text-2xl flex-shrink-0">
                                                {agent.avatar}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h3 className="text-base font-semibold text-white truncate">{agent.name}</h3>
                                                    <Badge variant="default" className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Live</Badge>
                                                </div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider font-mono">{agent.category}</p>
                                            </div>
                                            <button
                                                onClick={() => toggleFavorite(agent.id)}
                                                aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
                                                className={`p-1.5 rounded-lg transition-colors ${fav ? 'bg-amber-400/10 text-amber-400' : 'bg-foreground/[0.04] text-gray-500 hover:text-amber-400'}`}
                                            >
                                                <Star size={12} className={fav ? 'fill-amber-400' : ''} />
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-400 leading-relaxed mb-3 line-clamp-3">{agent.description}</p>
                                        <div className="flex flex-wrap gap-1.5 mb-4">
                                            {agent.tags.slice(0, 4).map(tag => (
                                                <span key={tag} className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/10 text-gray-400">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        {gate ? (
                                            <Link
                                                href={gate}
                                                className="flex items-center justify-between gap-2 w-full py-2 px-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider hover:bg-amber-500/15 transition-colors"
                                                data-testid={`agent-gate-${agent.id}`}
                                            >
                                                <span>Connect {gate === '/login' ? 'Account' : gate === '/integrations' ? 'Google' : 'API Key'}</span>
                                                <ArrowRight size={12} />
                                            </Link>
                                        ) : (
                                            <button
                                                onClick={() => openAgent(agent)}
                                                className="flex items-center justify-between gap-2 w-full py-2 px-3 rounded-lg bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] text-xs font-bold uppercase tracking-wider hover:bg-[#F97316]/15 transition-colors"
                                                data-testid={`agent-open-${agent.id}`}
                                            >
                                                <span>Try in Chat</span>
                                                <ArrowRight size={12} />
                                            </button>
                                        )}
                                        <div className="flex items-center gap-3 mt-3 text-[10px] font-mono text-gray-500">
                                            <span className="flex items-center gap-1">
                                                {agent.surfacesEnabled.web && <Check size={10} className="text-emerald-400" />}
                                                Web
                                            </span>
                                            {agent.surfacesEnabled.imessage && (
                                                <span className="flex items-center gap-1">
                                                    <Check size={10} className="text-emerald-400" />
                                                    iMessage
                                                </span>
                                            )}
                                            {agent.surfacesEnabled.dmg && (
                                                <span className="flex items-center gap-1">
                                                    <Check size={10} className="text-emerald-400" />
                                                    macOS
                                                </span>
                                            )}
                                            <Link href="/settings" className="ml-auto p-1 rounded text-gray-500 hover:text-white transition-colors" aria-label="Agent settings">
                                                <Settings size={10} />
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                                </div>
                            );
                        })}
                    </div>

                    {filtered.length === 0 && (
                        <div className="text-center py-16 text-gray-500">
                            <Bot size={32} className="mx-auto mb-3 opacity-40" />
                            <p className="text-sm">No agents match &ldquo;{search}&rdquo;.</p>
                        </div>
                    )}
                </div>
            </div>
        </MobilePageWrapper>
    );
}
