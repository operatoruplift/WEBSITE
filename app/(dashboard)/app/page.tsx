"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    MessageSquare, Workflow, Bot, Code, Sparkles, TrendingUp,
    Brain, Zap, ArrowRight, Activity, Plus, Loader2, Shield, Network
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Logo } from '@/src/components/Icons';
import { GlowButton } from '@/src/components/ui/GlowButton';
import { MobilePageWrapper } from '@/src/components/mobile';
import { useToast } from '@/src/components/ui/Toast';
import { getNotifications } from '@/lib/notifications';
import { AnimatedCard, NumberTicker, StaggerChildren, Spotlight } from '@/src/components/effects/MagicUI';

interface StatData { id: string; label: string; value: string; change: string; positive: boolean; icon: React.ComponentType<{ size?: number; className?: string }>; gradient: string; }
interface ActivityEvent { id: string; type: string; title: string; description: string; time: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string; }
interface SystemHealth { label: string; status: string; color: string; }

const fetchDashboardData = async () => {
    // Pull real counts from localStorage
    let agentCount = 0, chatCount = 0;
    try {
        const installed = JSON.parse(localStorage.getItem('installed-agents') || '[]');
        const custom = JSON.parse(localStorage.getItem('custom-agents') || '[]');
        const sessions = JSON.parse(localStorage.getItem('chat-sessions-v2') || '[]');
        agentCount = installed.length + custom.length;
        chatCount = sessions.length;
    } catch { /* demo fallback */ }

    return new Promise<{ stats: StatData[], activity: ActivityEvent[], health: SystemHealth[] }>((resolve) => {
        setTimeout(() => {
            resolve({
                stats: [
                    { id: '1', label: 'Active Agents', value: String(agentCount || 14), change: agentCount ? `${agentCount} installed` : '+3 this week', positive: true, icon: Bot, gradient: 'from-[#F59E0B]/20 to-[#F97316]/10' },
                    { id: '2', label: 'Chat Sessions', value: String(chatCount || 8), change: chatCount ? 'Local storage' : 'Stable', positive: true, icon: Workflow, gradient: 'from-[#F97316]/20 to-[#F97316]/10' },
                    { id: '3', label: 'Memory Bank Nodes', value: '12.4K', change: '+2.1K today', positive: true, icon: Brain, gradient: 'from-[#F97316]/20 to-[#F59E0B]/10' },
                    { id: '4', label: 'Security Threats Blocked', value: '47', change: '-12% vs yesterday', positive: true, icon: Shield, gradient: 'from-emerald-500/20 to-teal-500/10' },
                ],
                activity: [
                    { id: '101', type: 'security', title: 'Blackwall Blocked SQLi', description: 'Agent prompt injection attempt neutralised', time: '2m ago', icon: Shield, color: 'text-emerald-400' },
                    { id: '102', type: 'agent', title: 'DeepRepo Orchestration', description: 'Recursive codebase scan completed on 3 repos', time: '14m ago', icon: Bot, color: 'text-[#F59E0B]' },
                    { id: '103', type: 'workflow', title: 'Nightly Sync Executed', description: 'GitHub issue sync and embeddings update', time: '1h ago', icon: Workflow, color: 'text-[#F97316]' },
                    { id: '104', type: 'memory', title: 'Knowledge Indexed', description: 'Zo.computer rules loaded to agent memory', time: '4h ago', icon: Brain, color: 'text-[#F97316]' },
                    { id: '105', type: 'chat', title: 'Founder Ops Briefing', description: 'Weekly roundup synthesized', time: '5h ago', icon: MessageSquare, color: 'text-gray-400' },
                ],
                health: [
                    { label: 'API Gateway (Blackwall)', status: 'Healthy', color: 'bg-emerald-400' },
                    { label: 'Swarm Router', status: 'Active', color: 'bg-emerald-400' },
                    { label: 'ATP Settlement Layer', status: 'Running', color: 'bg-emerald-400' },
                    { label: 'Vector Store', status: 'Healthy', color: 'bg-emerald-400' },
                ]
            });
        }, 800);
    });
};

const QUICK_ACTIONS = [
    { label: 'Chat', href: '/chat', icon: MessageSquare, text: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10' },
    { label: 'Agent Store', href: '/marketplace', icon: Bot, text: 'text-[#F97316]', bg: 'bg-[#F97316]/10' },
    { label: 'Builder', href: '/agents/builder', icon: Sparkles, text: 'text-[#F97316]', bg: 'bg-[#F97316]/10' },
    { label: 'Swarm', href: '/swarm', icon: Network, text: 'text-[#F97316]', bg: 'bg-[#F97316]/10' },
    { label: 'Blackwall', href: '/security', icon: Shield, text: 'text-rose-400', bg: 'bg-rose-400/10' },
    { label: 'Settings', href: '/settings', icon: Code, text: 'text-emerald-400', bg: 'bg-emerald-400/10' },
];

export default function DashboardPage() {
    const [greeting, setGreeting] = useState('');
    const [currentTime, setCurrentTime] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();
    const router = useRouter();
    const [stats, setStats] = useState<StatData[]>([]);
    const [activity, setActivity] = useState<ActivityEvent[]>([]);
    const [health, setHealth] = useState<SystemHealth[]>([]);

    useEffect(() => {
        const h = new Date().getHours();
        setGreeting(h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening');
        const updateTime = () => setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
        updateTime();
        const t = setInterval(updateTime, 10000);
        fetchDashboardData().then(data => {
            setStats(data.stats);
            // Merge real notifications into activity stream
            const realNotifs = getNotifications().slice(0, 3).map(n => ({
                id: n.id, type: n.type, title: n.title, description: n.message, time: n.time,
                icon: n.icon === 'bot' ? Bot : n.icon === 'workflow' ? Workflow : n.icon === 'shield' ? Shield : MessageSquare,
                color: n.color,
            }));
            setActivity(realNotifs.length > 0 ? [...realNotifs, ...data.activity.slice(realNotifs.length)] : data.activity);
            setHealth(data.health);
            setIsLoading(false);
        });
        return () => clearInterval(t);
    }, []);

    return (
        <MobilePageWrapper>
            <div className="min-h-screen p-6 lg:p-8">
                <div className="max-w-[1400px] mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fadeInUp">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center relative shadow-[0_0_20px_rgba(231,118,48,0.3)]">
                                    <Logo className="w-10 h-10" />
                                </div>
                                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md text-[10px] uppercase tracking-widest font-mono flex items-center gap-1.5 backdrop-blur-md">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Uplift Core Online
                                </div>
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-medium tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-400">Good {greeting}, Commander.</h1>
                            <p className="text-sm text-gray-400 mt-2 font-mono flex items-center gap-2"><Activity size={12} className="text-[#F59E0B]" /> Systems optimized. Monitoring {isLoading ? '...' : activity.length} critical events.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="text-3xl font-mono text-white tracking-widest">{currentTime}</div>
                                <div className="text-[10px] font-mono text-gray-500 uppercase">Local Time</div>
                            </div>
                            <GlowButton onClick={() => router.push('/agents/builder')} className="h-12 px-6 bg-white/5 hover:bg-white/10 border border-white/10 overflow-hidden relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-[#F97316] via-[#F97316] to-[#FFEDD5] opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                                <Plus size={16} className="mr-2 text-[#F97316]" /><span className="font-medium tracking-wide">Initialize Agent</span>
                            </GlowButton>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                        {isLoading ? Array(4).fill(0).map((_, i) => <div key={i} className="h-32 rounded-2xl bg-white/5 border border-white/5 animate-pulse" />) :
                            stats.map((stat, i) => {
                                const Icon = stat.icon;
                                const numericValue = parseInt(stat.value.replace(/[^0-9]/g, ''), 10);
                                const isNumeric = !isNaN(numericValue) && numericValue > 0;
                                const suffix = stat.value.includes('K') ? 'K' : stat.value.includes('+') ? '+' : '';
                                return (
                                    <AnimatedCard key={stat.id} className="card-animate cursor-pointer" hoverGlow>
                                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-[inherit]`} />
                                        <div className="relative z-10 p-5">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center backdrop-blur-md group-hover:scale-110 group-hover:border-white/20 transition-all duration-500"><Icon size={18} className="text-white" /></div>
                                                <Badge variant="default" className="bg-black/40 border border-white/10 text-emerald-400 text-[10px] font-mono backdrop-blur-md">{stat.change}</Badge>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-3xl font-bold text-white tracking-tight">
                                                    {isNumeric ? <NumberTicker value={numericValue} suffix={suffix} durationMs={1400} /> : stat.value}
                                                </div>
                                                <div className="text-xs text-gray-400 font-medium">{stat.label}</div>
                                            </div>
                                        </div>
                                    </AnimatedCard>
                                );
                            })
                        }
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
                        <div className="col-span-1 lg:col-span-2 space-y-6">
                            <div className="animate-fadeInUp" style={{ animationDelay: '300ms' }}>
                                <div className="flex items-center gap-2 mb-4 px-1"><Zap size={14} className="text-[#F97316]" /><h2 className="text-xs font-mono text-gray-400 uppercase tracking-widest">Warp Network</h2></div>
                                <StaggerChildren delayMs={60} className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {QUICK_ACTIONS.map(action => { const Icon = action.icon; return (
                                        <Link key={action.label} href={action.href}>
                                            <Spotlight className="rounded-xl" fill={action.text.includes('rose') ? '#f43f5e' : action.text.includes('emerald') ? '#34d399' : '#F97316'}>
                                                <div className="relative p-4 rounded-xl border border-white/5 bg-black/20 hover:bg-white/5 transition-all duration-300 overflow-hidden flex items-center gap-3 cursor-pointer">
                                                    <div className={`w-10 h-10 rounded-lg ${action.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}><Icon size={18} className={action.text} /></div>
                                                    <span className="text-sm font-medium text-gray-300 hover:text-white transition-colors">{action.label}</span>
                                                </div>
                                            </Spotlight>
                                        </Link>
                                    ); })}
                                </StaggerChildren>
                            </div>
                            <Card variant="glass" className="card-animate" style={{ animationDelay: '400ms' }}>
                                <CardHeader className="border-b border-white/5 pb-4">
                                    <CardTitle className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-gray-300 font-mono tracking-widest uppercase"><Activity size={14} className="text-[#F97316]" /> Event Stream</div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {isLoading ? <div className="flex flex-col items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-600 mb-2" /><span className="text-xs font-mono text-gray-500">Syncing streams...</span></div> :
                                        <div className="divide-y divide-white/5">
                                            {activity.map(event => { const Icon = event.icon; return (
                                                <div key={event.id} className="p-4 flex items-start gap-4 hover:bg-white/5 transition-colors group cursor-pointer">
                                                    <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                                                        <div className={`absolute inset-0 bg-current opacity-10 ${event.color}`} /><Icon size={16} className={event.color} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-baseline justify-between mb-1"><h4 className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors truncate">{event.title}</h4><span className="text-[10px] font-mono text-gray-500 flex-shrink-0">{event.time}</span></div>
                                                        <p className="text-xs text-gray-400 truncate">{event.description}</p>
                                                    </div>
                                                </div>
                                            ); })}
                                        </div>
                                    }
                                </CardContent>
                            </Card>
                        </div>
                        <div className="space-y-6">
                            <Card variant="glass" className="card-animate border-[#F59E0B]/20" style={{ animationDelay: '500ms', background: 'radial-gradient(circle at top right, rgba(0,212,255,0.05), transparent 70%)' }}>
                                <CardHeader className="pb-2"><CardTitle className="flex items-center justify-between text-xs font-mono text-gray-400 uppercase tracking-widest"><span className="flex items-center gap-2"><ServerIcon /> Core Infrastructure</span><span className="text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded border bg-amber-400/10 text-amber-400 border-amber-400/20 normal-case">DEMO</span></CardTitle></CardHeader>
                                <CardContent>
                                    {isLoading ? <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-6 bg-white/5 rounded animate-pulse" />)}</div> :
                                        <div className="space-y-4 pt-2">
                                            {health.map((h, i) => (
                                                <div key={i} className="flex items-center justify-between group">
                                                    <span className="text-xs text-gray-300 font-medium group-hover:text-white transition-colors">{h.label}</span>
                                                    <div className="flex items-center gap-2 bg-black/40 border border-white/5 px-2 py-1 rounded-md backdrop-blur-sm">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${h.color} animate-pulse shadow-[0_0_8px_currentColor]`} />
                                                        <span className="text-[10px] font-mono text-gray-400">{h.status}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="pt-4 mt-2 border-t border-white/5 flex items-center justify-between">
                                                <span className="text-[10px] font-mono text-gray-500">Global Region</span>
                                                <Badge variant="default" className="text-[10px] bg-white/5">US-EAST-1</Badge>
                                            </div>
                                        </div>
                                    }
                                </CardContent>
                            </Card>
                            <Card variant="glass" className="card-animate group overflow-hidden" style={{ animationDelay: '600ms' }}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/20 to-transparent blur-2xl" />
                                <CardContent className="p-6 relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase tracking-widest">
                                            <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><text x="12" y="16" textAnchor="middle" fontSize="12" fill="#000" fontWeight="bold">G</text></svg>
                                            Gold Agent
                                        </div>
                                        <Badge variant="default" className="text-[9px] bg-amber-400/10 text-amber-400 border border-amber-400/20">Oro GRAIL</Badge>
                                    </div>
                                    <div className="mb-1"><span className="text-3xl font-bold font-mono text-white tracking-tighter">0.0847</span><span className="text-sm font-bold text-amber-400 ml-1">oz</span></div>
                                    <div className="text-xs text-gray-400 mb-4">≈ $278.24 USD</div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-[10px] font-mono text-gray-500">Gold Spot</span>
                                        <span className="text-[10px] font-mono text-white">$3,284.50/oz</span>
                                        <span className="text-[10px] font-mono text-emerald-400">+1.2%</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-mono"><span className="text-gray-500">Weekly DCA</span><span className="text-white">$49.27</span></div>
                                        <div className="flex justify-between text-[10px] font-mono"><span className="text-gray-500">Round-ups</span><span className="text-white">$9.85</span></div>
                                        <div className="flex justify-between text-[10px] font-mono"><span className="text-gray-500">Cashback</span><span className="text-white">$3.28</span></div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </MobilePageWrapper>
    );
}

function ServerIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F97316]">
            <rect width="20" height="8" x="2" y="2" rx="2" /><rect width="20" height="8" x="2" y="14" rx="2" />
            <line x1="6" x2="6.01" y1="6" y2="6" /><line x1="6" x2="6.01" y1="18" y2="18" />
        </svg>
    );
}
