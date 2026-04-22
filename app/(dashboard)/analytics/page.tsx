"use client";

import { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Users, Zap, Clock, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { MobilePageWrapper } from '@/src/components/mobile';

// Seeded random for consistent but different data per range
function seededRandom(seed: number) {
    let s = seed;
    return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

const RANGE_DATA = {
    '24h': { sessions: '342', users: '89', invocations: '2.1K', avgTime: '0.9s', sessionChange: '+5.2%', userChange: '+2.1%', invokeChange: '+18.4%', timeChange: '-8%', seed: 42 },
    '7d':  { sessions: '2,847', users: '342', invocations: '18.2K', avgTime: '1.2s', sessionChange: '+12.3%', userChange: '+8.1%', invokeChange: '+24.7%', timeChange: '-15%', seed: 77 },
    '30d': { sessions: '11,204', users: '1,247', invocations: '74.6K', avgTime: '1.4s', sessionChange: '+31.2%', userChange: '+22.5%', invokeChange: '+42.1%', timeChange: '-6%', seed: 123 },
};

export default function AnalyticsPage() {
    const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
    const data = RANGE_DATA[timeRange];

    const metrics = [
        { label: 'Total Sessions', value: data.sessions, change: data.sessionChange, positive: true, icon: Activity },
        { label: 'Active Users', value: data.users, change: data.userChange, positive: true, icon: Users },
        { label: 'Agent Invocations', value: data.invocations, change: data.invokeChange, positive: true, icon: Zap },
        { label: 'Avg Response Time', value: data.avgTime, change: data.timeChange, positive: true, icon: Clock },
    ];

    const topAgents = useMemo(() => {
        const multiplier = timeRange === '24h' ? 0.15 : timeRange === '30d' ? 4.2 : 1;
        return [
            { name: 'Code Reviewer', invocations: Math.round(4200 * multiplier), trend: '+18%', bar: 85 },
            { name: 'Research Assistant', invocations: Math.round(3100 * multiplier), trend: '+12%', bar: 63 },
            { name: 'Writing Coach', invocations: Math.round(2800 * multiplier), trend: '+9%', bar: 57 },
            { name: 'Data Analyst', invocations: Math.round(2100 * multiplier), trend: '+22%', bar: 43 },
            { name: 'Security Scanner', invocations: Math.round(1800 * multiplier), trend: '+5%', bar: 37 },
        ];
    }, [timeRange]);

    const chartData = useMemo(() => {
        const rand = seededRandom(data.seed);
        const count = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
        return Array.from({ length: count }, (_, i) => {
            const label = timeRange === '24h' ? `${i.toString().padStart(2, '0')}:00`
                : timeRange === '7d' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]
                : `${(i + 1).toString()}`;
            const base = timeRange === '24h' ? (i > 8 && i < 20 ? 60 : 10) : 30;
            return { label, value: Math.floor(rand() * 60 + base) };
        });
    }, [timeRange, data.seed]);

    const chartLabel = timeRange === '24h' ? 'Hourly Activity' : timeRange === '7d' ? 'Daily Activity' : 'Daily Activity (30d)';
    const showLabel = (i: number) => timeRange === '24h' ? i % 4 === 0 : timeRange === '7d' ? true : i % 5 === 0;

    return (
        <MobilePageWrapper>
            <div className="min-h-screen p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <BarChart3 size={16} className="text-[#F97316]" />
                                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Insights</span>
                                <span className="text-[8px] font-mono font-bold tracking-widest uppercase px-1.5 py-0.5 rounded border bg-amber-400/10 text-amber-400 border-amber-400/20">DEMO</span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-medium tracking-tight text-white">Analytics</h1>
                            <p className="text-sm text-gray-400 mt-1">Sample data, connect Supabase metrics for live analytics</p>
                        </div>
                        <div className="flex items-center gap-1 bg-foreground/[0.04] border border-white/10 rounded-lg p-1">
                            {(['24h', '7d', '30d'] as const).map(range => (
                                <button key={range} onClick={() => setTimeRange(range)} className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${timeRange === range ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>{range}</button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {metrics.map((m, i) => {
                            const Icon = m.icon;
                            return (
                                <Card key={m.label} variant="glass" className="card-animate" style={{ animationDelay: `${i * 80}ms` }}>
                                    <CardContent className="p-5">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-foreground/[0.04] border border-white/10 flex items-center justify-center"><Icon size={18} className="text-[#F97316]" /></div>
                                            <div className={`flex items-center gap-1 text-xs font-mono ${m.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {m.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{m.change}
                                            </div>
                                        </div>
                                        <div className="text-3xl font-bold text-white mb-1">{m.value}</div>
                                        <div className="text-xs text-gray-500">{m.label}</div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card variant="glass" className="lg:col-span-2" style={{ animationDelay: '300ms' }}>
                            <CardHeader className="border-b border-foreground/10 pb-4">
                                <CardTitle className="flex items-center gap-2 text-sm text-gray-300 font-mono uppercase tracking-widest">
                                    <Activity size={14} className="text-[#F97316]" /> {chartLabel}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex items-end gap-1 h-40">
                                    {chartData.map((d, i) => (
                                        <div key={`${timeRange}-${i}`} className="flex-1 flex flex-col items-center gap-1 group">
                                            <div className="w-full rounded-t transition-all duration-300 group-hover:bg-[#F97316] bg-[#F97316]/40" style={{ height: `${d.value}%` }} />
                                            {showLabel(i) && <span className="text-[8px] text-gray-600 font-mono">{d.label}</span>}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card variant="glass" className="card-animate" style={{ animationDelay: '400ms' }}>
                            <CardHeader className="border-b border-foreground/10 pb-4">
                                <CardTitle className="flex items-center gap-2 text-sm text-gray-300 font-mono uppercase tracking-widest">
                                    <TrendingUp size={14} className="text-[#F97316]" /> Top Agents
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="space-y-4">
                                    {topAgents.map((agent, i) => (
                                        <div key={agent.name} className="group">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-mono text-gray-600 w-4">{i + 1}.</span>
                                                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{agent.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono text-gray-500">{agent.invocations.toLocaleString()}</span>
                                                    <Badge variant="default" className="text-[9px] bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">{agent.trend}</Badge>
                                                </div>
                                            </div>
                                            <div className="w-full h-1 bg-foreground/[0.04] rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-[#F97316] to-[#F97316] rounded-full transition-all duration-700" style={{ width: `${agent.bar}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </MobilePageWrapper>
    );
}
